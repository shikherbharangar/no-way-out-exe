"""Compile the editable, individually drawn pixel grids and explicit key poses.
No generated anatomy: art/source/actors.pixels.json is the source of every pixel.
"""
from PIL import Image
import json
from pathlib import Path

def generate(out):
    src=json.loads((Path(__file__).resolve().parents[2]/'art/source/actors.pixels.json').read_text())
    parts={}
    for key,rows in src['parts'].items():
        im=Image.new('RGBA',(max(map(len,rows)),len(rows)))
        for y,row in enumerate(rows):
            for x,c in enumerate(row):
                if c!='.':
                    rgb=src['palette'][c];im.putpixel((x,y),tuple(int(rgb[i:i+2],16) for i in (1,3,5))+(255,))
        parts[key]=im
    for actor in ('zip','brick','guard'):
        sheet=Image.new('RGBA',(48*32,48))
        for frame,pose in enumerate(src['frames']):
            im=Image.new('RGBA',(48,48))
            for key,x,y,flip in src['poses'][pose]:
                if key=='scarf' and actor!='zip':continue
                key={'HEAD':actor+'_head','BODY':actor+'_body','HAND':'gauntlet' if actor=='brick' else 'glove'}.get(key,key)
                part=parts[key]
                if actor=='guard' and key.startswith('arm_'):
                    part=part.copy()
                    colors={src['palette'][a]:src['palette'][b] for a,b in zip('sthf','dmll')}
                    for yy in range(part.height):
                        for xx in range(part.width):
                            c=part.getpixel((xx,yy));h='#%02x%02x%02x'%c[:3]
                            if c[3] and h in colors:
                                v=colors[h];part.putpixel((xx,yy),tuple(int(v[i:i+2],16) for i in (1,3,5))+(255,))
                if flip:part=part.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                im.alpha_composite(part,(x,y))
            if actor=='guard':im.alpha_composite(parts['carbine'],(24 if pose!='windup' else 18,26 if pose!='aim' else 22))
            if frame==26:im=im.rotate(58,resample=Image.Resampling.NEAREST,center=(24,36),translate=(0,4))
            if frame==27:im=im.rotate(88,resample=Image.Resampling.NEAREST,center=(24,35),translate=(0,4))
            sheet.alpha_composite(im,(frame*48,0))
        sheet.save(out/(actor+'.png'))
        if actor!='guard':sheet.crop((0,0,48,48)).save(out/(actor+'-portrait.png'))
