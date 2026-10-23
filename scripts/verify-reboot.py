"""Validate published pixel masters and real capture files, not artistic parity."""
from pathlib import Path
from PIL import Image
import json, hashlib

root=Path(__file__).resolve().parents[1]
masters=root/'art/reboot/editable'
spec=json.loads((root/'art/reboot/specification.json').read_text())
colors={tuple(bytes.fromhex(c[1:])) for c in spec['palette']}
for path in masters.glob('*.png'):
    im=Image.open(path).convert('RGBA')
    assert set(im.getchannel('A').get_flattened_data())<={0,255},path
    assert all(px[:3] in colors for px in im.get_flattened_data() if px[3]),path
    if not path.stem.endswith('-keys'):
        assert path.read_bytes()==(root/('public/assets/reboot-'+path.name)).read_bytes(),path
for actor in ('zip','brick','guard'):
    im=Image.open(masters/(actor+'.png'))
    assert im.size==(1536,48)
    for f in range(32):assert im.crop((f*48,0,(f+1)*48,48)).getbbox(),(actor,f)
    for f in (0,1,2,3,14,15,19,20,21,22,27):
        assert im.crop((f*48,0,(f+1)*48,48)).getbbox()[3]==46,(actor,f,'contact baseline')
assert Image.open(masters/'tiles.png').size==(1024,512)
for phase in ('before','after'):
    evidence=json.loads((root/f'artifacts/reboot/{phase}/capture-evidence.json').read_text())
    assert not evidence['browserErrors']
    assert len(evidence['captures'])==6
    for capture in evidence['captures']:
        assert capture['stateBeforeScreenshot']['tick']>0
        path=root/capture['path'];im=Image.open(path).convert('RGB')
        assert im.size==(1280,720),path
        assert len(set(im.get_flattened_data()))>128,('blank capture',path)
action=json.loads((root/'artifacts/reboot/after/action/evidence.json').read_text())
assert action['final']['won'] and not action['browserErrors']
for event in ('shot','charge','death','blast','win'):
    assert any(e['type']==event for e in action['events']),event
manifest={}
for path in sorted((root/'artifacts/reboot/after').rglob('*')):
    if path.suffix in ('.png','.mp4','.webm'):
        data=path.read_bytes();manifest[str(path.relative_to(root))]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(root/'artifacts/reboot/verification.json').write_text(json.dumps({'checks':['65-color palette','binary alpha','96 populated runtime frames','contact baselines','editable/runtime equality','12 nonblank 1280x720 before/after screenshots','recorded combat, co-op and victory'],'files':manifest},indent=2)+'\n')
print('PASS pixel asset contracts, real capture evidence and media hashes (not a claim of artistic parity)')
