import json, numpy as np
from PIL import Image
from scipy import ndimage
A="/cursor/stores/store-98aeaf3c-afc9-4740-804e-efef12f4bb76/grok-bot/agents/1e98e88e-342c-4a97-af4d-b72b2c71d67f/assets"
R={ # name: (category, file, mode, crop_y0)
 'torso':('base','839dff51','g'),'upper_arm':('base','5bc480b7','g'),'forearm_hand':('base','3009004e','g'),
 'leg':('base','ae3eab87','g'),'foot':('base','40df368e','g'),
 'malay_man':('heads','ae9d06c9','g'),'chinese_man':('heads','90d1d804','g'),'indian_woman':('heads','a9963588','g'),
 'malay_woman':('heads','b329e622','g'),'kadazan_man':('heads','951fb4b3','g'),
 'songkok':('headwear','d5f5a822','g'),'tudung':('headwear','ebfa3980','g'),'ketayap':('headwear','f140ebe3','g'),
 'turban':('headwear','36a7cb4d','g'),'baseball_cap':('headwear','0c8d3711','g'),
 'baju_melayu':('outfits','e7d4b65c','g'),'batik_shirt':('outfits','cc25094a','g'),'business_suit':('outfits','76eccbfb','g'),
 'baju_kurung':('outfits','01cf5b6d','g'),'songket_samping':('lower','abdeeea9','g'),'sarong':('lower','e99e58fa','w')}
import glob,os
def path(p): return glob.glob(f"{A}/{p}*.jpg")[0]
# raw pins (1024 frame) estimated visually
P={'torso':{'neck':(512,157),'shoulder_L':(296,294),'shoulder_R':(726,294),'hip_L':(301,808),'hip_R':(718,808)},
 'upper_arm':{'shoulder':(512,278),'elbow':(512,714)},
 'forearm_hand':{'elbow':(543,423),'wrist':(520,655)},
 'leg':{'hip':(514,240),'knee':(497,508),'ankle':(490,752)},
 'foot':{'ankle':(360,440)},
 'malay_man':{'neck':(514,824)},'chinese_man':{'neck':(515,777)},'indian_woman':{'neck':(516,828)},
 'malay_woman':{'neck':(511,812)},'kadazan_man':{'neck':(519,847)}}
for o in ['baju_melayu','batik_shirt','business_suit','baju_kurung']: P[o]=dict(P['torso'])
def key(name):
    cat,f,m=R[name]; im=np.asarray(Image.open(path(f)).convert('RGB')).astype(float)
    if name=='forearm_hand': im[:380]=im[5,5]
    if m=='g':
        bg=np.median(np.concatenate([im[:20,:20].reshape(-1,3),im[-20:,-20:].reshape(-1,3),im[:20,-20:].reshape(-1,3)]),0)
        d=np.linalg.norm(im-bg,axis=2)
        g=im[...,1]-np.maximum(im[...,0],im[...,2])  # greenness
        a=np.clip((d-35)/40,0,1)
        a=np.where(g>40, np.minimum(a,np.clip((90-g)/50,0,1)),a)
        # despill
        im[...,1]=np.minimum(im[...,1],np.maximum(im[...,0],im[...,2])+10)
    else:
        d=np.linalg.norm(im-255,axis=2); fg=d>30
        bgm=~fg; lab,_=ndimage.label(bgm); border=set(np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]))-{0}
        out=np.isin(lab,list(border)); a=(~out).astype(float)
        a=ndimage.gaussian_filter(a,0.7)
    # keep largest components only (drop specks)
    lab,n=ndimage.label(a>0.5)
    if n>1:
        sz=ndimage.sum(np.ones_like(lab),lab,range(1,n+1)); keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>2000])
        a=a*ndimage.binary_dilation(keep,iterations=3)
    return Image.fromarray(np.dstack([im,a*255]).clip(0,255).astype(np.uint8),'RGBA')
# target sizes: heads 512 tall; torso 560 tall; others relative
TH={'heads':512,'torso':560,'outfits':560,'upper_arm':230,'forearm_hand':300,'leg':360}
rig={'parts':{}}
os.makedirs('parts',exist_ok=True)
meta={}
for name,(cat,f,m) in R.items():
    img=key(name); bb=img.getchannel('A').point(lambda v:255 if v>20 else 0).getbbox()
    pad=6; x0,y0,x1,y1=bb[0]-pad,bb[1]-pad,bb[2]+pad,bb[3]+pad
    img=img.crop((x0,y0,x1,y1)); h=y1-y0; w=x1-x0
    meta[name]=(x0,y0,w,h)
    if cat=='heads': s=TH['heads']/h
    elif cat in('outfits',) or name=='torso': s=None
    else: s=None
    meta[name]=[x0,y0,w,h,s,img]
# torso & outfits: one shared scale from base torso so they align
ts=TH['torso']/meta['torso'][3]
for n in ['torso','baju_melayu','batik_shirt','business_suit','baju_kurung']: meta[n][4]=ts
meta['upper_arm'][4]=TH['upper_arm']/meta['upper_arm'][3]
meta['forearm_hand'][4]=TH['forearm_hand']/meta['forearm_hand'][3]
meta['leg'][4]=TH['leg']/meta['leg'][3]
meta['foot'][4]=200/meta['foot'][2]
hipw=(718-301)*ts
meta['songket_samping'][4]=hipw*1.25/meta['songket_samping'][2]
meta['sarong'][4]=430/meta['sarong'][3]
# headwear relative to average head skull width (~0.80 of head image width incl ears) -> use malay_man
hs=meta['malay_man'][4]; headw=meta['malay_man'][2]*hs
HWW={'songkok':0.72,'ketayap':0.70,'turban':0.86,'baseball_cap':0.95,'tudung':1.16}
for k,v in HWW.items(): meta[k][4]=headw*v/meta[k][2]
for name,(x0,y0,w,h,s,img) in meta.items():
    cat=R[name][0]; W,H=round(w*s),round(h*s)
    out=img.resize((W,H),Image.LANCZOS); os.makedirs(f'parts/{cat}',exist_ok=True); out.save(f'parts/{cat}/{name}.png')
    pins={k:[round((px-x0)*s),round((py-y0)*s)] for k,(px,py) in P.get(name,{}).items()}
    if cat=='heads':
        a=np.asarray(out.getchannel('A'))>128; ys=np.where(a.any(1))[0]; top=int(ys[0])
        pins['crown']=[W//2,top]
        # hat line ~ hairline/forehead, face centre: fractions of head-only height (crown to neck pin)
        hh=pins['neck'][1]-top
        pins['hat_brim']=[W//2,int(top+0.30*hh)]
        pins['face_center']=[W//2,int(top+0.55*hh)]
    if cat=='headwear':
        if name=='tudung': pins['face_hole_center']=[round((512-x0)*s),round((445-y0)*s)]
        else: pins['brim']=[W//2,H-8]
    if cat=='lower': pins['waist']=[W//2,8]
    rig['parts'][f'{cat}/{name}']={'file':f'parts/{cat}/{name}.png','size':[W,H],'pins':pins}
rig['draw_order']=['base/leg (back, mirrored)','base/foot (back)','base/upper_arm (back)','base/forearm_hand (back)','lower/sarong','base/leg (front)','base/foot (front)','base/torso','outfits/*','lower/songket_samping','headwear/tudung (back drape not separate; tudung drawn over head)','heads/*','headwear/* (non-tudung)','headwear/tudung','base/upper_arm (front)','base/forearm_hand (front)']
rig['draw_order']=['leg_back','foot_back','upper_arm_back','forearm_hand_back','lower:sarong','leg_front','foot_front','torso','outfit','lower:songket_samping','head','headwear','upper_arm_front','forearm_hand_front']
rig['joints']={'torso.neck':'head.neck','torso.shoulder_L/R':'upper_arm.shoulder','upper_arm.elbow':'forearm_hand.elbow','torso.hip_L/R':'leg.hip (also lower.waist centred between hips, offset up ~40px)','leg.ankle':'foot.ankle','head.hat_brim':'headwear.brim','head.face_center':'tudung.face_hole_center'}
rig['notes']='Left-side limbs: mirror horizontally (x -> width-1-x). Outfits share the base torso pin layout and replace/overlay the torso.'
json.dump(rig,open('rig.json','w'),indent=1)
