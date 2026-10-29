import json
from PIL import Image, ImageOps, ImageDraw, ImageFilter
rig=json.load(open('rig.json'))['parts']
def L(k,mirror=False):
    p=rig[k]; im=Image.open(p['file']); pins=dict(p['pins'])
    if mirror:
        im=ImageOps.mirror(im); pins={n:[im.width-1-x,y] for n,(x,y) in pins.items()}
    return im,pins
def char(head,hw,outfit,lower):
    C=Image.new('RGBA',(1100,1900),(0,0,0,0)); ox,oy=550,700
    T,tp=L('base/torso'); tx,ty=ox-tp['neck'][0],oy
    def at(k,src,dst,mirror=False):
        im,p=L(k,mirror); x=dst[0]-p[src][0]; y=dst[1]-p[src][1]; C.alpha_composite(im,(int(x),int(y))); return {n:[v[0]+x,v[1]+y] for n,v in p.items()}
    abs_=lambda n:[tp[n][0]+tx,tp[n][1]+ty]
    for side,m in (('L',False),('R',True)):
        lg=at('base/leg','hip',abs_('hip_'+side),m); at('base/foot','ankle',lg['ankle'],side=='R')
    if lower=='sarong': at('lower/sarong','waist',[ox,abs_('hip_L')[1]-60])
    C.alpha_composite(L('base/torso')[0],(tx,ty))
    if outfit: C.alpha_composite(L('outfits/'+outfit)[0],(tx,ty))
    if lower=='songket_samping': at('lower/songket_samping','waist',[ox,abs_('hip_L')[1]-110])
    h=at('heads/'+head,'neck',abs_('neck'))
    if hw=='tudung': at('headwear/tudung','face_hole_center',h['face_center'])
    elif hw: at('headwear/'+hw,'brim',[h['hat_brim'][0],h['hat_brim'][1]+{'baseball_cap':70,'turban':40}.get(hw,15)])
    for side,m in (('L',False),('R',True)):
        u=at('base/upper_arm','shoulder',abs_('shoulder_'+side),m); at('base/forearm_hand','elbow',u['elbow'],m)
    return C
chars=[('malay_man','songkok','baju_melayu','songket_samping'),('malay_woman','tudung','baju_kurung','sarong'),('chinese_man','baseball_cap','business_suit',None),('indian_woman',None,'batik_shirt','sarong'),('kadazan_man','ketayap','batik_shirt',None)]
W=Image.new('RGBA',(1100*len(chars),1900),(236,220,190,255))
for i,c in enumerate(chars):
    C=char(*c); sh=Image.new('RGBA',C.size,(0,0,0,0)); sh.putalpha(C.getchannel('A').point(lambda v:v*0.35)); sh=sh.filter(ImageFilter.GaussianBlur(12))
    W.alpha_composite(sh,(i*1100+14,18)); W.alpha_composite(C,(i*1100,0))
W.convert('RGB').resize((W.width//2,W.height//2)).save('preview.png')
