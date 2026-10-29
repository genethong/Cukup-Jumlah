import json, numpy as np
from PIL import Image
from scipy import ndimage
A="/cursor/stores/store-98aeaf3c-afc9-4740-804e-efef12f4bb76/grok-bot/agents/1e98e88e-342c-4a97-af4d-b72b2c71d67f/assets"
R={ # name: (category, file, mode, crop_y0)
 'torso':('base','839dff51','g'),'upper_arm':('base','5bc480b7','g'),'forearm_hand':('base','6d831759','g'),
 'leg':('base','ae3eab87','g'),'foot':('base','40df368e','g'),
 'malay_man':('heads','ae9d06c9','g'),'chinese_man':('heads','90d1d804','g'),'indian_woman':('heads','a9963588','g'),
 'malay_woman':('heads','b329e622','g'),'kadazan_man':('heads','951fb4b3','g'),
 'songkok':('headwear','d5f5a822','g'),'tudung':('headwear','ebfa3980','g'),'ketayap':('headwear','f140ebe3','g'),
 'turban':('headwear','36a7cb4d','g'),'baseball_cap':('headwear','0c8d3711','g'),
 'baju_melayu':('outfits','e7d4b65c','g'),'batik_shirt':('outfits','cc25094a','g'),'business_suit':('outfits','76eccbfb','g'),
 'baju_kurung':('outfits','01cf5b6d','g'),'songket_samping':('lower','abdeeea9','g'),'sarong':('lower','5d731053','w'),
 'baju_melayu_upper':('sleeves','c6e95038','g'),'baju_melayu_forearm':('sleeves','8d50203a','g'),
 'business_suit_upper':('sleeves','42b5596c','g'),'business_suit_forearm':('sleeves','d2bb709c','g'),
 'baju_kurung_upper':('sleeves','fb47b4eb','w'),'baju_kurung_forearm':('sleeves','86bf0113','w'),
 'batik_shirt_upper':('sleeves','974a1475','w')}
import glob,os
def path(p): return glob.glob(f"{A}/{p}*.jpg")[0]
# raw pins (1024 frame) estimated visually
P={'torso':{'neck':(512,157),'shoulder_L':(296,294),'shoulder_R':(726,294),'hip_L':(301,808),'hip_R':(718,808)},
 'upper_arm':{'shoulder':(512,278),'elbow':(512,714)},
 'forearm_hand':{'elbow':(515,197),'wrist':(517,652)},'baju_melayu_upper':{'shoulder':(512,252)},'business_suit_upper':{'shoulder':(512,250)},'baju_kurung_upper':{'shoulder':(522,188)},'batik_shirt_upper':{'shoulder':(514,186)},
 'leg':{'hip':(514,240),'knee':(497,508),'ankle':(490,752)},
 'foot':{'ankle':(360,440)},
 'malay_man':{'neck':(514,824)},'chinese_man':{'neck':(515,777)},'indian_woman':{'neck':(516,828)},
 'malay_woman':{'neck':(511,812)},'kadazan_man':{'neck':(519,847)}}
for o in ['baju_melayu','batik_shirt','business_suit','baju_kurung']: P[o]=dict(P['torso'])
def key(name):
    cat,f,m=R[name]; im=np.asarray(Image.open(path(f)).convert('RGB')).astype(float)
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
os.chdir('v2');os.makedirs('parts',exist_ok=True)
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
ua=meta['upper_arm']; uaw=ua[2]*ua[4]
for n in ['baju_melayu_upper','business_suit_upper','baju_kurung_upper']: meta[n][4]=205/meta[n][3]
meta['batik_shirt_upper'][4]=135/meta['batik_shirt_upper'][3]
fa=meta['forearm_hand']; fs=fa[4]; fseg=(652-197)*fs  # elbow->wrist length in output px
for n in ['baju_melayu_forearm','business_suit_forearm','baju_kurung_forearm']: meta[n][4]=fa[2]*fs*1.2/meta[n][2]
# taper sarong: row-wise horizontal squeeze 1.0 top -> 0.68 bottom
im=meta['sarong'][5]; a=np.asarray(im); H_,W_=a.shape[:2]; out=np.zeros_like(a)
for y in range(H_):
    f=1-0.32*(y/H_); row=Image.fromarray(a[y:y+1]).resize((max(1,int(W_*f)),1),Image.LANCZOS)
    out[y,(W_-row.width)//2:(W_-row.width)//2+row.width]=np.asarray(row)[0]
meta['sarong'][5]=Image.fromarray(out,'RGBA'); meta['sarong'][4]=hipw*1.5/W_
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
    if name.endswith('_forearm'): pins['elbow']=[W//2,int(0.06*H)]
    rig['parts'][f'{cat}/{name}']={'file':f'parts/{cat}/{name}.png','size':[W,H],'pins':pins}
rig['draw_order']=['base/leg (back, mirrored)','base/foot (back)','base/upper_arm (back)','base/forearm_hand (back)','lower/sarong','base/leg (front)','base/foot (front)','base/torso','outfits/*','lower/songket_samping','headwear/tudung (back drape not separate; tudung drawn over head)','heads/*','headwear/* (non-tudung)','headwear/tudung','base/upper_arm (front)','base/forearm_hand (front)']

rig['joints']={'torso.neck':'head.neck','torso.shoulder_L/R':'upper_arm.shoulder','upper_arm.elbow':'forearm_hand.elbow','torso.hip_L/R':'leg.hip (also lower.waist centred between hips, offset up ~40px)','leg.ankle':'foot.ankle','head.hat_brim':'headwear.brim','head.face_center':'tudung.face_hole_center'}
rig['notes']='Left-side limbs: mirror horizontally (x -> width-1-x). Outfits share the base torso pin layout and replace/overlay the torso.'

# ---- skin tinting (HSV mask recolour) ----
import colorsys
def skin_mask(img,pins,prad):
    a=np.asarray(img).astype(float)/255; r,g,b,al=a[...,0],a[...,1],a[...,2],a[...,3]
    mx=a[...,:3].max(2); mn=a[...,:3].min(2); v=mx; s_=np.where(mx>0,(mx-mn)/np.maximum(mx,1e-6),0)
    h=np.zeros_like(mx); d=np.maximum(mx-mn,1e-6)
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
    m=(h>=12)&(h<=45)&(s_>0.22)&(s_<0.78)&(v>0.30)&(al>0.05)
    yy,xx=np.mgrid[:m.shape[0],:m.shape[1]]
    for (px,py) in pins: m&=((xx-px)**2+(yy-py)**2)>prad**2
    return ndimage.gaussian_filter(m.astype(float),1.0)
def tint(img,target,pins=(),prad=0):
    m=skin_mask(img,pins,prad); a=np.asarray(img).astype(float)
    src=(a[...,:3]*(m[...,None]>0.5)).sum((0,1))/max((m>0.5).sum(),1)
    k=np.array(target)/src; new=np.clip(a[...,:3]*k,0,255)
    a[...,:3]=a[...,:3]*(1-m[...,None])+new*m[...,None]
    return Image.fromarray(a.astype(np.uint8),'RGBA'),[round(x) for x in src]
TONES={'light':(236,196,154),'tan':(214,164,114),'golden':(196,136,84),'medium_brown':(160,100,58),'dark':(118,70,40)}
HEAD_TONE={'chinese_man':'light','kadazan_man':'tan','malay_woman':'golden','malay_man':'medium_brown','indian_woman':'dark'}
rig['skin']={'method':'HSV mask recolour: pixels with hue 12-45deg, sat 0.22-0.78, value>0.30, excluding a circle of radius pin_radius around every pin (brass), get RGB multiplied by target/source_mean_skin. Pre-baked results in parts/base_tones/<tone>/. Outfits and sleeves are NOT tinted (their gold/orange batik falls in the same hue range); their small skin neck tab is hidden under the head.',
 'tones':{k:list(v) for k,v in TONES.items()},'head_tone':HEAD_TONE,'base_tones_dir':'parts/base_tones/<tone>/<part>.png'}
for hn,t in HEAD_TONE.items():
    p=rig['parts'][f'heads/{hn}']; im=Image.open(p['file'])
    out,src=tint(im,TONES[t],[p['pins']['neck']],26*512/meta[hn][3]); out.save(p['file']); p['skin_source_mean']=src
for t,col in TONES.items():
    os.makedirs(f'parts/base_tones/{t}',exist_ok=True)
    for bn in ['torso','upper_arm','forearm_hand','leg','foot']:
        p=rig['parts'][f'base/{bn}']; im=Image.open(p['file'])
        out,_=tint(im,col,list(p['pins'].values()),28*meta[bn][4]); out.save(f'parts/base_tones/{t}/{bn}.png')
rig['placement']={'headwear_brim_dy':{'songkok':15,'ketayap':15,'turban':55,'baseball_cap':70},
 'headwear_note':'place headwear.brim at head.hat_brim + (0, dy)',
 'tudung':'place tudung.face_hole_center at head.face_center',
 'lower_waist_dy_from_hips':{'songket_samping':-110,'sarong':-60},
 'lower_note':'waist pin x = torso centre, y = torso hip pin y + dy',
 'sleeve_upper':'sleeves/<outfit>_upper.shoulder -> torso.shoulder_*',
 'sleeve_forearm':'sleeves/<outfit>_forearm.elbow -> upper_arm.elbow (same point as forearm_hand.elbow)',
 'mirror':'right-side limbs, sleeves and the right foot are mirrored horizontally'}
rig['sleeves']={'baju_melayu':['upper','forearm'],'business_suit':['upper','forearm'],'baju_kurung':['upper','forearm'],'batik_shirt':['upper']}
rig['draw_order']=['leg x2','foot x2','lower:sarong','torso','outfit','lower:songket_samping','head','headwear','upper_arm x2','sleeve_upper x2','forearm_hand x2','sleeve_forearm x2']
json.dump(rig,open('rig.json','w'),indent=1)
# batik short sleeve: non-uniform resize so it is wider than the arm but short
p=rig['parts']['sleeves/batik_shirt_upper']; im=Image.open(p['file']); sx,sy=122/im.width,150/im.height
im.resize((122,150),Image.LANCZOS).save(p['file']); p['pins']={'shoulder':[round(p['pins']['shoulder'][0]*sx),round(p['pins']['shoulder'][1]*sy)]}
json.dump(rig,open('rig.json','w'),indent=1)
