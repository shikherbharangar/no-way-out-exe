"""Original clustered pixel fire, billowing smoke and material debris sheets."""
from PIL import Image,ImageDraw
import math,random

def blob(d,cx,cy,rx,ry,color,seed=0,step=2):
    rnd=random.Random(seed);pts=[]
    for i in range(24):
        a=i*math.pi/12;r=.88+rnd.random()*.19
        pts.append((round((cx+math.cos(a)*rx*r)/step)*step,round((cy+math.sin(a)*ry*r)/step)*step))
    d.polygon(pts,fill=color)

def generate(out):
    from art.fire import generate as fire
    fire(out)
    smoke=Image.new('RGBA',(96*12,96))
    for fr in range(12):
        im=Image.new('RGBA',(96,96));d=ImageDraw.Draw(im)
        r=8+fr*2.3
        for j in range(7):
            a=j*2.39;cx=48+math.cos(a)*r*.46;cy=55+math.sin(a)*r*.36-fr*1.4
            size=r*(.53+j%3*.09)
            blob(d,cx,cy,size,size*.85,'#20222f',j*17+fr//4)
            blob(d,cx-2,cy-3,size*.9,size*.75,'#41404a',j*17+fr//4)
            blob(d,cx-3,cy-5,size*.65,size*.5,'#65616a',j*17+fr//4)
            blob(d,cx-6,cy-7,size*.32,size*.24,'#8d8075',j*17+fr//4)
        smoke.paste(im,(fr*96,0))
    smoke.save(out/'smoke.png')
    fragments=Image.new('RGBA',(16*12,16))
    for i in range(12):
        im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im);rng=random.Random(51+i)
        pts=[(2,5),(6,2),(12,4),(14,9),(9,14),(3,11)]
        pts=[(x+rng.randrange(-1,2),y+rng.randrange(-1,2)) for x,y in pts]
        if i<4:dark,mid,light='#473c37','#a28762','#e0c28b'
        elif i<8:dark,mid,light='#142232','#506e84','#b3e1e0'
        else:dark,mid,light='#35292b','#76533d','#b89157'
        if 4<=i<8:pts=[(1,6),(12,3),(14,5),(4,12)]
        d.polygon(pts,fill=dark);d.polygon([(x-1,y-2) for x,y in pts[1:5]],fill=mid);d.line(pts[:3],fill=light,width=2)
        if i<4:d.line([(6,4),(7,8),(4,12)],fill=dark,width=1)
        if 4<=i<8:d.rectangle((7,5,8,6),fill='#fff0ae')
        fragments.paste(im,(i*16,0))
    fragments.save(out/'debris.png')
    # Broad impact slash, comic spark fan and electric contact burst.
    im=Image.new('RGBA',(64*6,64));d=ImageDraw.Draw(im)
    for f in range(6):
        ox=f*64;r=7+f*4
        for j in range(9):
            a=(j-4)*.28
            x=ox+16+math.cos(a)*r;y=32+math.sin(a)*r
            d.polygon([(ox+16,32),(int(x),int(y)-2),(int(x+8),int(y)),(int(x),int(y)+2)],fill='#fff4ae' if f<3 else '#f4a24d')
    im.save(out/'impact.png')
