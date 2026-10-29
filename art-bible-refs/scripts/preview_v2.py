import json,sys
from PIL import Image, ImageOps, ImageFilter
R=json.load(open('rig.json')); rig=R['parts']; PL=R['placement']; SK=R['skin']
def L(k,mirror=False,tone=None):
    p=rig[k]; f=p['file']
    if tone and k.startswith('base/'): f=f"parts/base_tones/{tone}/{k.split('/')[1]}.png"
    im=Image.open(f); pins=dict(p['pins'])
    if mirror: im=ImageOps.mirror(im); pins={n:[im.width-1-x,y] for n,(x,y) in pins.items()}
    return im,pins
def char(head,hw,outfit,lower):
    tone=SK['head_tone'][head]; C=Image.new('RGBA',(1100,1900),(0,0,0,0)); ox,oy=550,700
    T,tp=L('base/torso'); tx,ty=ox-tp['neck'][0],oy
    def at(k,src,dst,mirror=False):
        im,p=L(k,mirror,tone); x=dst[0]-p[src][0]; y=dst[1]-p[src][1]; C.alpha_composite(im,(int(x),int(y))); return {n:[v[0]+x,v[1]+y] for n,v in p.items()}
    A=lambda n:[tp[n][0]+tx,tp[n][1]+ty]; WD=PL['lower_waist_dy_from_hips']
    for s,m in (('L',False),('R',True)):
        lg=at('base/leg','hip',A('hip_'+s),m); at('base/foot','ankle',lg['ankle'],s=='R')
    if lower=='sarong': at('lower/sarong','waist',[ox,A('hip_L')[1]+WD['sarong']])
    C.alpha_composite(L('base/torso',tone=tone)[0],(tx,ty))
    if outfit: C.alpha_composite(L('outfits/'+outfit)[0],(tx,ty))
    if lower=='songket_samping': at('lower/songket_samping','waist',[ox,A('hip_L')[1]+WD['songket_samping']])
    h=at('heads/'+head,'neck',A('neck'))
    if hw=='tudung': at('headwear/tudung','face_hole_center',h['face_center'])
    elif hw: at('headwear/'+hw,'brim',[h['hat_brim'][0],h['hat_brim'][1]+PL['headwear_brim_dy'][hw]])
    sl=R['sleeves'].get(outfit,[])
    for s,m in (('L',False),('R',True)):
        u=at('base/upper_arm','shoulder',A('shoulder_'+s),m)
        if 'upper' in sl: at(f'sleeves/{outfit}_upper','shoulder',A('shoulder_'+s),m)
        at('base/forearm_hand','elbow',u['elbow'],m)
        if 'forearm' in sl: at(f'sleeves/{outfit}_forearm','elbow',u['elbow'],m)
    return C
chars=[('malay_man','songkok','baju_melayu','songket_samping'),('malay_woman','tudung','baju_kurung','sarong'),('chinese_man','baseball_cap','business_suit',None),('indian_woman',None,'batik_shirt','sarong'),('kadazan_man','ketayap','batik_shirt',None),('malay_man','turban','business_suit','sarong')]
W=Image.new('RGBA',(1100*len(chars),1900),(236,220,190,255))
for i,c in enumerate(chars):
    C=char(*c); sh=Image.new('RGBA',C.size,(0,0,0,0)); sh.putalpha(C.getchannel('A').point(lambda v:v*0.35)); sh=sh.filter(ImageFilter.GaussianBlur(12))
    W.alpha_composite(sh,(i*1100+14,18)); W.alpha_composite(C,(i*1100,0))
W.convert('RGB').resize((W.width//2,W.height//2)).save('preview.png'); W.convert('RGB').resize((W.width//2,W.height//2)).save(sys.argv[1] if len(sys.argv)>1 else '/tmp/p.png')
