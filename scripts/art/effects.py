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
    fire=Image.new('RGBA',(128*18,128))
    for fr in range(18):
        im=Image.new('RGBA',(128,128));d=ImageDraw.Draw(im)
        age=fr/17
        radius=[7,16,29,40,48,52,52,50,48,45,42,39,35,30,25,21,16,10][fr]
        # Individual curling lobes grow along unequal radial paths, then peel off.
        for j in range(11):
            angle=j*2.399;dist=radius*(.37+.11*(j%3));size=radius*(.28+.035*(j%4))
            cx=64+math.cos(angle)*dist;cy=68+math.sin(angle)*dist-age*9
            if fr>9:cy-=(fr-9)*(1+j%3)*.6
            blob(d,cx,cy,size+6,size+5,'#252535',j*7+fr//3)
            blob(d,cx-2,cy-3,size+2,size+3,'#693438' if fr<11 else '#4f4552',j*7+fr//3)
            if fr<14:
                blob(d,cx-2,cy-4,size,size,'#bf462b',j*7+fr//3)
                blob(d,cx-3,cy-5,size*.77,size*.77,'#fa7029',j*7+fr//3)
                blob(d,cx-4,cy-7,size*.50,size*.55,'#ffb942',j*7+fr//3)
                # Dark curl cutting back into the fire gives the silhouette volume.
                if fr>3 and j%2==0:blob(d,cx+size*.45,cy+size*.2,size*.42,size*.5,'#8f352b',j+1)
        if fr<11:
            blob(d,64,67,radius*.74,radius*.65,'#ff872b',12+fr//2)
            blob(d,62,66,radius*.56,radius*.53,'#ffd464',12+fr//2)
            blob(d,61,65,radius*.38,radius*.40,'#fff2ab',12+fr//2)
            blob(d,61,64,radius*.24,radius*.27,'#ffffe9',12+fr//2,1)
            # Tearing tongues and hot fragments; different cadence from the bloom.
            for j in range(8):
                a=j*math.pi/4+.14;rr=radius*(.9+.12*(j%3));x=64+math.cos(a)*rr;y=65+math.sin(a)*rr
                d.polygon([(int(x),int(y)),(int(x+math.cos(a)*10),int(y+math.sin(a)*10)),(int(x+3),int(y+5)),(int(x-3),int(y+3))],fill='#ffd070')
                if fr>2:d.rectangle((int(x)-1,int(y)-1,int(x)+1,int(y)+1),fill='#fff8bf')
        for j in range(14):
            a=j*2.4;rr=radius+8+fr*.7;cx=64+math.cos(a)*rr;cy=66+math.sin(a)*rr-fr*.25
            if 1<cx<125 and 1<cy<125:
                d.rectangle((int(cx),int(cy),int(cx)+1,int(cy)+2),fill='#ffdf81' if fr<12 else '#a86440')
        fire.paste(im,(fr*128,0))
    fire.save(out/'explosion.png')
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
