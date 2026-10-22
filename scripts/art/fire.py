"""Six drawn flame contours plus separately drawn curls; no radial blob generator."""
from PIL import Image,ImageDraw,ImageFilter
from pathlib import Path
import json

def generate(out):
    src=json.loads((Path(__file__).resolve().parents[2]/'art/source/fire-keyframes.json').read_text())
    sheet=Image.new('RGBA',(128*18,128))
    # Faster ignition, lingering asymmetric rupture, then cooler curling smoke.
    timeline=[(0,.7),(0,1),(1,.9),(1,1),(2,.97),(2,1),(3,1),(3,.97),(4,1),(4,.97),(4,.94),(5,1),(5,.98),(5,.93),(5,.88),(5,.83),(5,.76),(5,.65)]
    for frame,(key,scale) in enumerate(timeline):
        im=Image.new('RGBA',(128,128));mask=Image.new('L',(128,128));d=ImageDraw.Draw(mask)
        pts=[(round(64+(x-64)*scale),round(70+(y-70)*scale-(max(0,frame-8))*1.5)) for x,y in src['keys'][key]]
        d.polygon(pts,fill=255)
        colors=['#412a35','#a33c2e','#ef642c','#ffa944','#ffe595','#fffbd3'] if frame<11 else ['#252630','#49363c','#795043','#bb6843']
        for layer,c in enumerate(colors):
            m=mask.filter(ImageFilter.MinFilter(1+layer*6)) if layer else mask
            if layer>1:
                shifted=Image.new('L',(128,128));shifted.paste(m,(-layer,layer));m=shifted
            im.paste(c,(0,0),m)
        d=ImageDraw.Draw(im)
        if frame>=4:
            for n,curl in enumerate(src['curls']):
                pts=[(round(x*scale+64*(1-scale)),round(y*scale+70*(1-scale)-max(0,frame-8)*1.5)) for x,y in curl]
                d.polygon(pts,fill='#9d3e30' if frame<11 else '#3e333c')
                d.line(pts[:5],fill='#ffb04b' if frame<11 else '#8e6752',width=2)
        if frame<9:
            # Strong forward jet, split tail; not a symmetrical circular fireball.
            d.polygon([(71,68),(93,58),(121,64),(101,66),(114,71),(89,73),(76,80)],fill='#ffd46e')
            d.polygon([(69,68),(96,64),(109,65),(89,69),(72,74)],fill='#fffbd3')
        sheet.alpha_composite(im,(frame*128,0))
    sheet.save(out/'explosion.png')
