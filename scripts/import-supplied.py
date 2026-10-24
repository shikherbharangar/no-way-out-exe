"""Validate the supplied pack and copy its original atlases byte-for-byte.
No drawing, trimming, resampling, palette conversion or alpha replacement.
"""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil
root=Path(__file__).resolve().parents[1];src=root/'art/supplied/source';out=root/'public/assets/supplied';out.mkdir(exist_ok=True)
manifest=json.loads((root/'art/supplied/source-manifest.json').read_text())
for name,sha in manifest['files'].items():assert hashlib.sha256((src/name).read_bytes()).hexdigest()==sha,('Source changed',name)
meta=json.loads((src/'sprite_metadata.json').read_text())
paths={'zip':'sprites/zip_atlas.png','brick':'sprites/brick_atlas.png','enemies':'enemies/atlas.png','pickups':'pickups/atlas.png','props':'props/atlas.png'}
files={};frames={}
for path in sorted(src.rglob('*')):
 if not path.is_file():continue
 data=path.read_bytes();entry={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 if path.suffix=='.png':
  im=Image.open(path);im.verify();im=Image.open(path).convert('RGBA');a=im.getchannel('A')
  entry.update(size=im.size,mode=Image.open(path).mode,alphaValues=len(set(a.get_flattened_data())),bounds=im.getbbox())
 files[str(path.relative_to(src))]=entry
for group,path in paths.items():
 im=Image.open(src/path).convert('RGBA');shutil.copyfile(src/path,out/(group+'.png'));frames[group]={}
 for name,frame in meta['animations'][group].items():
  x,y,w,h=(frame[k] for k in ('atlas_x','atlas_y','frame_width','frame_height'));assert x+w<=im.width and y+h<=im.height
  crop=im.crop((x,y,x+w,y+h));assert crop.getbbox()
  individual=src/(f'sprites/{group}/{frame["index"]:02d}_{name}.png' if group in ('zip','brick') else f'{group}/{name}.png')
  single=Image.open(individual).convert('RGBA')
  assert crop.size==single.size
  visibleDifference=sum(a!=b and (a[3]>0 or b[3]>0) for a,b in zip(crop.get_flattened_data(),single.get_flattened_data()))
  assert visibleDifference==0,(individual,visibleDifference)
  frames[group][name]={**frame,'alphaBounds':crop.getbbox(),'singlePose':True,'individualVisiblePixelsMatch':True,'transparentRGBDifferences':sum(a!=b for a,b in zip(crop.get_flattened_data(),single.get_flattened_data()))}
# Runtime uses explicit measured body/foot anchors, independent of alpha debris.
anchors={
 'zip':{'idle':[48,91],'run':[48,91],'jump':[48,89],'fall':[44,91],'shoot':[43,91],'melee':[43,91],'dash':[47,89],'wall_jump':[48,89],'slide':[48,91],'hack':[48,91],'electric':[46,91],'hurt':[48,91],'death':[49,91]},
 'brick':{'idle':[45,91],'run':[43,91],'jump':[47,89],'fall':[49,91],'punch':[69,91],'aim':[39,91],'slam':[49,91],'shield':[38,91],'charge':[46,91],'special':[48,91],'hurt':[43,91],'death':[48,91]},
 'enemies':{'guard':[47,80],'shotgunner':[46,80],'shield_trooper':[42,81],'sniper':[45,81],'heavy_trooper':[45,82],'jetpack_trooper':[48,86],'riot_trooper':[46,80]},
 'props':{'checkpoint_flag':[31,118],'rescue_cage':[64,119],'terminal':[64,104],'reactor':[64,122],'exit_beacon':[64,119]},
}
for group,entries in frames.items():
 for name,f in entries.items():
  f['anchor']=anchors.get(group,{}).get(name,[f['frame_width']//2,f['alphaBounds'][3]])
  f['sourceFacing']=-1 if group=='brick' and name=='punch' else 1
runtime={'scale':1,'pixelPolicy':'One original artwork pixel per world pixel; nearest-neighbor; no frame fitting','groups':frames}
(root/'art/supplied/runtime.json').write_text(json.dumps(runtime,indent=2)+'\n');shutil.copyfile(root/'art/supplied/runtime.json',out/'runtime.json')
(root/'art/supplied/inventory.json').write_text(json.dumps({'files':files,'frames':frames,'sourceFiles':len(files),'sourceUnchanged':True},indent=2)+'\n')
print(f'Validated all {len(files)} source files, decoded every PNG, checked all 57 named frames against individual PNGs; published original atlases unchanged.')
