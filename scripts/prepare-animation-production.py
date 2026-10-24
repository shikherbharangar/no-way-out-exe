"""Prepare editable ARTIST TEMPLATES, not new character artwork.

Copies reference pixels unchanged and packages transparent paint layers, guides,
pose briefs and timing. Does not generate, warp, interpolate or recolor anatomy.
Safe to rerun: existing editable ORA documents are never overwritten.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, io, json, shutil, zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'art/animation-production'
OUT.mkdir(exist_ok=True)
META = json.loads((ROOT / 'art/supplied/runtime.json').read_text())

POSES = {
 'idle': ['Neutral breath, confident face', 'Inhale: chest contour changes one pixel', 'Breath crest; scarf settles', 'Exhale back to neutral'],
 'run': ['Near-foot contact, far arm forward', 'Near-leg compression; planted foot tracks ground', 'Near-leg passing under hip', 'Near-leg push-off; far knee leads', 'Far-foot contact, near arm forward', 'Far-leg compression; fist counterbalances', 'Far-leg passing under hip', 'Far-leg push-off; near knee leads'],
 'jump': ['Takeoff extension', 'Rising tuck; head remains forward', 'Apex hang; feet below hip'],
 'fall': ['Descending extension, knees soft', 'Landing-ready; soles face surface'],
 'land': ['Foot contact and knee absorption', 'Recover torso; equipment lags', 'Return to neutral anchor'],
 'attack': ['Readiness; action starts', 'Anticipation; show wrist connection', 'Release / contact aligned to simulation', 'Follow-through; retain shoulder and forearm', 'Recover equipment mass', 'Settle to neutral'],
 'hurt': ['Short recoil; face exposed', 'Recover balance'],
 'death': ['Lose balance', 'Knees buckle', 'Torso descends', 'Ground contact', 'Settle equipment', 'Hold readable downed body'],
 'revive': ['Downed hero stirs after partner revival', 'Elbow supports torso', 'One knee under hip; equipment braced', 'Rise with stable head volume', 'Return to ready stance'],
}
TIMINGS = {'idle':[180]*4,'run':[40]*8,'jump':[60,90,100],'fall':[100,100],
 'land':[30,30,40],'attack':[30,35,35,50,70,80],'hurt':[60,90],
 'death':[60,70,80,90,110,1000],'revive':[70,80,90,100,110]}
REFERENCE = {'idle':'idle','run':'run','jump':'jump','fall':'fall','land':'idle',
 'attack':'shoot','hurt':'hurt','death':'death','revive':'hack'}

def png(im):
 b=io.BytesIO(); im.save(b,format='PNG'); return b.getvalue()

def ora(path, size, layers, merged):
 if path.exists():
  print('Preserving editable document:', path.name); return
 root=ET.Element('image',{'version':'0.0.3','w':str(size[0]),'h':str(size[1]),'name':path.stem})
 stack=ET.SubElement(root,'stack')
 with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
  z.writestr('mimetype','image/openraster',compress_type=zipfile.ZIP_STORED)
  for i,(name,im,visible) in enumerate(layers):
   src=f'data/layer{i:02d}.png'; z.writestr(src,png(im))
   ET.SubElement(stack,'layer',{'name':name,'src':src,'opacity':'1.0','visibility':'visible' if visible else 'hidden','composite-op':'svg:src-over','x':'0','y':'0'})
  z.writestr('stack.xml',ET.tostring(root,encoding='utf-8',xml_declaration=True))
  z.writestr('mergedimage.png',png(merged))
  thumb=merged.copy();thumb.thumbnail((256,256),Image.Resampling.NEAREST)
  z.writestr('Thumbnails/thumbnail.png',png(thumb))

audit=[]; specs={}
for hero in ('zip','brick'):
 src=ROOT / f'art/supplied/source/sprites/{hero}_atlas.png'
 atlas=Image.open(src).convert('RGBA')
 # These are reference sprite sheets, explicitly not new animation sheets.
 dest=OUT / f'{hero}-reference.png'
 if dest.exists(): assert dest.read_bytes()==src.read_bytes(), f'Unexpected edited reference: {dest}'
 else: shutil.copyfile(src,dest)
 blank=Image.new('RGBA',atlas.size)
 ora(OUT/f'{hero}-repair.ora',atlas.size,[
  ('REPAIR PAINT — empty; no repair completed',blank,True),
  ('EDIT THIS COPY — erase stray pixels here; redraw missing anatomy manually',atlas,True),
  ('ORIGINAL REFERENCE — do not edit; immutable original also in art/supplied/source',atlas,False),
 ],atlas)
 target_h=34 if hero=='zip' else 40
 target={'cell':[64,64],'anchor':[32,56],'idleVisibleHeight':target_h,
  'headTop':56-target_h,'colliderFromAnchor':[-7,-25,14,25],
  'bodyWidthLimit':22 if hero=='zip' else 32,'equipmentAndScarfWidthLimit':46 if hero=='zip' else 60,
  'sourceFacing':1,'runtimeScale':1,'status':'artist target; not implemented or visually approved'}
 clips={}; guides=Image.new('RGBA',(512,576)); d=ImageDraw.Draw(guides)
 for row,(clip,briefs) in enumerate(POSES.items()):
  times=TIMINGS[clip].copy()
  if hero=='brick' and clip=='run':times=[50]*8
  if hero=='brick' and clip=='attack':times=[70,70,35,60,80,100]
  ref=REFERENCE[clip]
  if hero=='brick':ref={'shoot':'punch','hack':'shield'}.get(ref,ref)
  if hero=='zip' and clip=='attack':
   briefs=['Immediate electric release: projectile exists on the first action tick',
    'Gauntlet recoil with connected wrist','Residual arc follows forearm',
    'Recover shoulder and hand','Scarf settles','Ready stance']
  frames=[]
  for col,brief in enumerate(briefs):
   x,y=col*64,row*64
   d.rectangle((x,y,x+63,y+63),outline=(64,72,82,255))
   d.line((x+1,y+56,x+62,y+56),fill=(88,175,165,255))
   d.rectangle((x+25,y+31,x+38,y+55),outline=(170,112,54,255))
   d.line((x+31,y+54,x+33,y+54),fill=(255,255,255,255))
   d.line((x+32,y+53,x+32,y+55),fill=(255,255,255,255))
   d.line((x+22,y+56-target_h,x+42,y+56-target_h),fill=(137,158,190,255))
   frames.append({'id':f'{hero}-{clip}-{col+1:02d}','rect':[x,y,64,64],
    'durationMs':times[col],'anchor':[32,56],'brief':brief,'artStatus':'missing','referencePose':ref})
  clips[clip]={'loop':clip in ('idle','run','fall'),'frames':frames,
   'timingPolicy':'Run is distance-driven: one eight-frame cycle per 48 world pixels; timings are nominal only.' if clip=='run' else 'Presentation only; authoritative action and damage timing always wins.'}
  if clip=='attack':clips[clip]['simulationAlignment']={
   'releaseAtMs':0 if hero=='zip' else 140,
   'contactFromAnchor':[12,-16] if hero=='zip' else [29,-16],
   'facingField':'facing' if hero=='zip' else 'attackFacing',
   'note':'Never delay damage to fit a visual anticipation frame. BRICK impact is the first tick windup reaches zero.'}
  if clip=='revive':clips[clip]['simulationAlignment']={'starts':'reviving > 0 on the revived hero, after 0.8s partner interaction','durationMs':450,'note':'Recovery animation, not the helper interaction. Death/ghost has higher priority.'}
 layers=[('PAINT — empty; illustration required',Image.new('RGBA',guides.size),True),
  ('GUIDES ONLY — hide before export; not character art',guides,True)]
 ora(OUT/f'{hero}-animation-template.ora',guides.size,layers,guides)
 specs[hero]={'identity': 'White swept hair, red scarf, teal jacket, dark trousers, electric gauntlets; cocky face' if hero=='zip' else 'Muscular shoulders, dark beard, orange trousers, pale vest, harness, one enormous connected mechanical fist',
  'target':target,'clips':clips,'completedNewFrames':0,
  'repairFile':f'{hero}-repair.ora','animationFile':f'{hero}-animation-template.ora'}
 for name,f in META['groups'][hero].items():
  left,top,right,bottom=f['alphaBounds'];w,h=right-left,bottom-top
  audit.append({'hero':hero,'pose':name,'bounds':[left,top,right,bottom],
   'visibleWidth':w,'visibleHeight':h,'heightOverCollider':h/25,'heightInTiles':h/16,
   'anchor':f['anchor'],'sourceFacing':f['sourceFacing'],
   'integerScales':{str(s):{'width':w*s,'height':h*s,'heightOverCollider':h*s/25} for s in (1,2,3)}})

spec={'version':1,'status':'Incomplete artist handoff, not production animation',
 'baseCommit':'fed52c9','nativeGame':[640,360],'tile':16,'physicsCollider':[14,25],
 'liveScale':1,'newApprovedFrames':0,'heroes':specs,
 'exportGate':['Every required frame hand-drawn and reviewed at native size',
 'No blank, duplicated, warped or interpolated run frames',
 'Hide guide layers; export transparent RGBA with integer anchors',
 'Mechanical fist stays attached; scarf/equipment remain consistent',
 'Keep soles and skull volumes stable; reference actual side view',
 'Attack timing and muzzle/contact locations agree with existing simulation',
 'No collision or network protocol changes',
 'Review gameplay before replacing runtime atlases']}
(OUT/'animation-spec.json').write_text(json.dumps(spec,indent=2)+'\n')
(OUT/'scale-audit.json').write_text(json.dumps({'heroPoses':audit,'proposedNativeHeights':{'zip':34,'brick':40},
 'decision':'Keep current runtime at 1x pending native artwork. Integer enlargement worsens mismatch. A 1:2 reduction is diagnostic only; it loses clusters and is not approved artwork.'},indent=2)+'\n')
print('Prepared 4 editable ORA documents and 2 unchanged reference sheets. New illustrated frames: 0.')
