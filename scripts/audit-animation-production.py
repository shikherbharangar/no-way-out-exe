"""Verify handoff packaging and state the unmet art acceptance explicitly."""
from pathlib import Path
from PIL import Image
import hashlib, io, json, subprocess, zipfile
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1];art=root/'art/animation-production';out=root/'artifacts/animation-review'
spec=json.loads((art/'animation-spec.json').read_text())
manifest=json.loads((root/'art/supplied/source-manifest.json').read_text())
for name,sha in manifest['files'].items():
 assert hashlib.sha256((root/'art/supplied/source'/name).read_bytes()).hexdigest()==sha,name
packages=[]
for hero in ('zip','brick'):
 ref=(root/f'art/supplied/source/sprites/{hero}_atlas.png').read_bytes()
 assert (art/f'{hero}-reference.png').read_bytes()==ref
 assert (root/f'public/assets/supplied/{hero}.png').read_bytes()==ref
 for kind in ('repair','animation-template'):
  path=art/f'{hero}-{kind}.ora'
  with zipfile.ZipFile(path) as z:
   assert z.read('mimetype')==b'image/openraster'
   tree=ET.fromstring(z.read('stack.xml'));layers=tree.findall('./stack/layer')
   assert len(layers)==(3 if kind=='repair' else 2)
   for layer in layers:Image.open(io.BytesIO(z.read(layer.attrib['src']))).verify()
   if kind=='repair':
    original=Image.open(io.BytesIO(ref)).convert('RGBA')
    assert Image.open(io.BytesIO(z.read(layers[2].attrib['src']))).tobytes()==original.tobytes()
   assert Image.open(io.BytesIO(z.read(layers[0].attrib['src']))).getbbox() is None,'Update readiness status after artist paints'
   packages.append({'file':str(path.relative_to(root)),'size':[int(tree.attrib['w']),int(tree.attrib['h'])],
    'layers':[x.attrib['name'] for x in layers],'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
missing=[f['id'] for h in spec['heroes'].values() for c in h['clips'].values() for f in c['frames'] if f['artStatus']!='approved']
assert len(missing)==78
for h in spec['heroes'].values():assert len(h['clips']['run']['frames'])==8
# Compare actual authoritative files to the requested starting commit.
changed=subprocess.check_output(['git','diff','fed52c9','--name-only','--','src/game/simulation.ts','src/game/machine.ts','src/game/generator.ts','server','src/net'],cwd=root,text=True).splitlines()
assert not changed,changed
captures=json.loads((out/'scale-capture-evidence.json').read_text())
for capture in captures['captures']:
 assert capture['unchangedState']
 for f in capture['frames']:
  path=out/f'{capture["label"]}-{f["name"]}.png'
  assert hashlib.sha256(path.read_bytes()).hexdigest()==f['sha256']
  im=Image.open(path).convert('RGBA');enlarged=Image.open(path.with_name(path.stem+'-2x.png')).convert('RGBA')
  assert im.size==(640,360) and enlarged.size==(1280,720)
  assert im.resize((1280,720),Image.Resampling.NEAREST).tobytes()==enlarged.tobytes(),path
report={'packagingValidated':True,'animationAcceptance':'NOT MET','completedNewFrames':0,
 'completedAnatomyRepairs':0,'missingDrawings':len(missing),'missingFrameIds':missing,
 'sourceFilesUnchanged':len(manifest['files']),'runtimeHeroAtlasesUnchanged':True,
 'authoritativeFilesChanged':changed,'runtimeScale':1,'proposedNativeHeights':{'zip':34,'brick':40},
 'sameTickGameplayComparisons':len(captures['captures']),'editablePackages':packages,
 'limitation':'A consistent illustrated animation cycle and anatomical repairs are not supplied by this tooling. Editable templates and specifications are not finished art.'}
(out/'production-readiness.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS source preservation, ORA packaging, native captures, exact 2x enlargements, unchanged authority. ART ACCEPTANCE NOT MET: 78 drawings and all anatomy repairs remain.')
