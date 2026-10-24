"""Verify source preservation and real integration media; no artistic-parity claim."""
from pathlib import Path
from PIL import Image, ImageChops
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1];source=root/'art/supplied/source';out=root/'artifacts/supplied'
manifest=json.loads((root/'art/supplied/source-manifest.json').read_text())
for name,sha in manifest['files'].items():assert hashlib.sha256((source/name).read_bytes()).hexdigest()==sha,name
inventory=json.loads((root/'art/supplied/inventory.json').read_text())
for name,entry in inventory['files'].items():
 data=(source/name).read_bytes();assert hashlib.sha256(data).hexdigest()==entry['sha256'],name
paths={'zip':'sprites/zip_atlas.png','brick':'sprites/brick_atlas.png','enemies':'enemies/atlas.png','pickups':'pickups/atlas.png','props':'props/atlas.png'}
for group,path in paths.items():assert (root/f'public/assets/supplied/{group}.png').read_bytes()==(source/path).read_bytes(),group
assert (root/'art/supplied/runtime.json').read_bytes()==(root/'public/assets/supplied/runtime.json').read_bytes()
render=json.loads((out/'render-evidence.json').read_text());assert len(render['cases'])==114 and not render['browserErrors'];assert all(c['mismatches']==0 and c['scale']==1 for c in render['cases'])
capture=json.loads((out/'acceptance/evidence.json').read_text());assert not capture['browserErrors'] and len(capture['captures'])==9
triplets=[]
for shot in capture['captures']:
 assert shot['state']==shot['restoredState'],shot['name']
 for variant in ('normal','neutral','restored'):
  path=out/f'acceptance/{shot["name"]}-{variant}.png';im=Image.open(path).convert('RGB');assert im.size==(640,360);assert len(set(im.get_flattened_data()))>100
  big=im.resize((1280,720),Image.Resampling.NEAREST);big.save(path.with_name(path.stem+'-2x.png'));assert big.resize((640,360),Image.Resampling.NEAREST).tobytes()==im.tobytes()
 a=Image.open(out/f'acceptance/{shot["name"]}-normal.png').convert('RGB');b=Image.open(out/f'acceptance/{shot["name"]}-restored.png').convert('RGB');assert ImageChops.difference(a,b).getbbox() is None,shot['name']
 triplets.append({'name':shot['name'],'sameStateAndRestoredPixels':True})
assert capture['captures'][-1]['state']['rescued'] and capture['captures'][-1]['state']['checkpoint']
action=json.loads((out/'action/evidence.json').read_text());assert not action['browserErrors'] and action['final']['won'] and action['final']['rescued']
for event in ('rescue','shot','charge','death','blast','win'):assert any(e['type']==event for e in action['events']),event
for path in (out/'action').glob('*.png'):
 if path.stem.endswith('-2x'):continue
 im=Image.open(path);assert im.size==(640,360);im.resize((1280,720),Image.Resampling.NEAREST).save(path.with_name(path.stem+'-2x.png'))
originals=subprocess.check_output(['git','ls-tree','-r','--name-only','69eba18','public/assets'],text=True).splitlines()
for name in originals:assert (root/name).read_bytes()==subprocess.check_output(['git','show',f'69eba18:{name}']),name
files={}
for path in sorted(out.rglob('*')):
 if path.suffix not in ('.png','.mp4','.webm') or ('regression' in path.parts and path.suffix=='.webm'):continue
 data=path.read_bytes();files[str(path.relative_to(out))]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(out/'verification.json').write_text(json.dumps({'checks':['83 source files unchanged','5 original runtime atlases byte-identical','114 exact Phaser rendering comparisons','9 same-state native/neutral/restored triplets','27 exact 2x copies','real rescue, checkpoint, combat and victory','original main assets unchanged'],'originalAssetCount':len(originals),'triplets':triplets,'files':files},indent=2)+'\n')
print('PASS source preservation, exact native rendering, actual gameplay evidence and 2x pixels; source animation limitations remain documented')
