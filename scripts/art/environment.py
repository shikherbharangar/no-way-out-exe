"""Art-directed prison layers, differentiated materials and readable props."""
from PIL import Image,ImageDraw,ImageFont
import random,math

def generate(out):
    rng=random.Random(337)
    def text(d,xy,s,c,size=9):d.text(xy,s,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',size),fill=c)
    # Far: cold shafts, gantries and distant warm furnace slits, beneath near-black sky.
    im=Image.new('RGBA',(1600,360),'#080f1c');d=ImageDraw.Draw(im)
    for j in range(25):
        x=j*71-20;top=rng.randrange(20,95);w=rng.randrange(40,68)
        d.rectangle((x,top,x+w,330),fill='#122439');d.line((x,top,x+w,top),fill='#2a485a',width=2)
        for y in range(top+14,300,24):
            d.line((x+3,y,x+w-4,y),fill='#1f3548')
            for xx in range(x+8,x+w-5,10):
                d.rectangle((xx,y+5,xx+3,y+11),fill=rng.choice(['#2a4f60','#234354','#30445a','#aa623a']))
        if j%4==0:
            d.rectangle((x+7,top+15,x+12,280),fill='#1c384b');d.line((x+8,top+16,x+8,280),fill='#416371')
    for x in range(0,1600,180):
        d.rectangle((x,0,x+7,360),fill='#080e1a')
        for y in range(50,300,50):d.line((x,y,x+90,y+55),fill='#20394a',width=4)
    im.save(out/'far.png')
    # Mid: distinct bays instead of endlessly repeated barred windows.
    im=Image.new('RGBA',(1600,360));d=ImageDraw.Draw(im)
    for bay,x in enumerate(range(0,1600,160)):
        for y in range(40,291,12):
            for xx in range(x,x+160,25):
                xx+=7 if (y//12)%2 else 0
                d.rectangle((xx,y,xx+23,y+10),fill=rng.choice(['#162334','#1c2b3d','#1a2939','#202d3d']))
                d.line((xx,y,xx+22,y),fill='#2b3b4b')
        # Weathering follows joints and water run-off, not a uniform noise overlay.
        for j in range(60):
            xx=x+rng.randrange(5,145);yy=rng.randrange(48,275)
            d.rectangle((xx,yy,xx+1,yy+rng.randrange(2,9)),fill=rng.choice(['#112232','#263845','#343735','#20232f']))
        if bay%3!=1:
            d.rectangle((x+12,61,x+122,185),fill='#070f1c')
            d.rectangle((x+17,66,x+117,180),fill=(0,0,0,0))
            for xx in range(x+24,x+117,14):
                d.rectangle((xx,67,xx+3,179),fill='#0a1625');d.line((xx,68,xx,179),fill='#354e60')
            for yy in [84,147]:d.rectangle((x+16,yy,x+119,yy+3),fill='#152b3e')
            d.rectangle((x+9,184,x+125,191),fill='#0a1523');d.line((x+9,184,x+125,184),fill='#4b5e68',width=2)
            # Offset inner window rail provides depth against the distant architecture.
            d.line((x+18,70,x+116,70),fill='#3d5969',width=2)
        else:
            # Closed turbine bay: big dark negative shapes with sparse warm accents.
            d.rectangle((x+16,65,x+119,185),fill='#0b1625');d.rectangle((x+19,69,x+116,181),fill='#263442')
            for yy in range(73,179,9):
                d.rectangle((x+22,yy,x+113,yy+4),fill='#0c1727');d.line((x+23,yy,x+111,yy),fill='#46535a')
            for yy in (88,124,160):
                d.rectangle((x+26,yy,x+108,yy+2),fill='#75462e');d.rectangle((x+35,yy,x+98,yy),fill='#e49046')
        # Pylons deliberately dark. Rivets do not compete with the heroes.
        d.rectangle((x+132,34,x+153,300),fill='#0b1625');d.rectangle((x+135,35,x+138,300),fill='#344b5c')
        for yy in range(48,290,40):
            d.rectangle((x+129,yy,x+155,yy+8),fill='#1a2e40')
            for xx in (x+132,x+150):d.rectangle((xx,yy+2,xx+1,yy+3),fill='#738084')
        # Cooling network, interrupted ducts, cable trays, prison stencils.
        for yy in [220,245,271]:
            d.rectangle((x+2,yy,x+130,yy+6),fill='#09121e');d.rectangle((x+2,yy+1,x+130,yy+2),fill='#42515d')
            for xx in range(x+4,x+130,37):
                d.rectangle((xx,yy-1,xx+4,yy+8),fill='#263a47');d.line((xx,yy-1,xx+3,yy-1),fill='#687075')
        text(d,(x+24,197),['DETENTION  /  07','COOLANT / 450V','NO HUMAN ACCESS'][bay%3],'#52626d',7)
        # Small paper labels and rust blooms, localized below fixtures.
        if bay%2==0:
            d.rectangle((x+88,233,x+104,253),fill='#817d65');d.rectangle((x+90,236,x+102,238),fill='#593f36')
            for yy in [241,245,249]:d.line((x+91,yy,x+100,yy),fill='#47494a')
        for j in range(12):
            xx=x+45+rng.randrange(20);yy=50+rng.randrange(50)
            d.rectangle((xx,yy,xx+1,yy+4),fill='#3d3835')
    im.save(out/'mid.png')
    # Game-plane tiles: cool concrete, fractured sandstone, strata and steel.
    im=Image.new('RGBA',(16*12,16));d=ImageDraw.Draw(im)
    for t in range(12):
        x=t*16
        base=['#526575','#465b6b','#394b5d','#624936','#71513a','#4d3c32','#405c70','#3e566b','#b18c59','#707e7b','#34465b','#142337'][t]
        d.rectangle((x,0,x+15,15),fill=base)
        for n in range(25):
            xx=x+rng.randrange(16);yy=rng.randrange(16);offset=rng.choice([-18,-10,11,19]);rgb=tuple(int(base[i:i+2],16) for i in (1,3,5));c=tuple(max(0,min(255,v+offset)) for v in rgb)
            d.rectangle((xx,yy,min(xx+rng.randrange(2,5),x+15),yy),fill=c)
        if t<3 or t==8:
            for yy in [0,8]:
                d.line((x,yy,x+15,yy),fill='#1c2735');d.line((x,yy+1,x+15,yy+1),fill='#e1bd81' if t==8 else '#8da5aa')
                xx=x+(3 if yy==0 else 11);d.line((xx,yy,xx,yy+7),fill='#273038')
            if t==8:
                d.line([(x+10,0),(x+6,5),(x+9,8),(x+5,13),(x+7,15)],fill='#302b2e',width=2)
                d.line([(x+11,2),(x+8,5),(x+10,8)],fill='#f0d69b')
                d.line([(x+8,8),(x+14,10)],fill='#644630')
        elif t in (6,7,10,11):
            d.rectangle((x,0,x+15,1),fill='#9abac0' if t!=11 else '#314452');d.line((x,15,x+15,15),fill='#07111f')
            d.line((x,3,x,13),fill='#1c2d3f');d.line((x+15,2,x+15,14),fill='#627a88')
            for xx in (x+2,x+12):
                for yy in (4,12):d.rectangle((xx,yy,xx+1,yy+1),fill='#c5cbb5')
            if t==7:
                for xx in range(x,x+20,8):d.polygon([(xx,2),(xx+4,2),(xx,6),(xx-4,6)],fill='#ffc365')
            if t==6:d.rectangle((x+5,5,x+9,9),fill='#182b40');d.rectangle((x+6,5,x+8,6),fill='#5e889a')
        elif t==9:
            d.rectangle((x,0,x+15,2),fill='#c4cab0');d.line((x,3,x+15,3),fill='#4c666e')
            d.line([(x+4,8),(x+8,7),(x+11,12)],fill='#334450')
        else:
            for yy in (3,9,14):
                d.line((x,yy,x+15,yy),fill='#3c302c')
                d.rectangle((x+rng.randrange(7),yy+1,x+9,yy+2),fill='#a7804f')
    im.save(out/'tiles.png')
    # Repaint existing props in their original slots so no gameplay locations move.
    im=Image.open(out/'props.png');d=ImageDraw.Draw(im)
    d.rectangle((0,0,63,63),fill=(0,0,0,0))
    d.polygon([(19,27),(24,24),(41,24),(46,28),(46,59),(41,63),(22,63),(18,58)],fill='#080e1c')
    d.rectangle((21,28,43,59),fill='#ac302c');d.rectangle((23,28,29,58),fill='#eb6537');d.rectangle((25,29,27,57),fill='#ff9e53')
    d.rectangle((38,29,43,58),fill='#732a2c')
    for yy in (28,39,56):
        d.rectangle((19,yy,45,yy+3),fill='#203044');d.line((20,yy,44,yy),fill='#9aa59a')
        d.rectangle((22,yy+1,23,yy+2),fill='#d6d7ae');d.rectangle((41,yy+1,42,yy+2),fill='#687f89')
    d.rectangle((23,25,40,27),fill='#647c86');d.rectangle((27,24,32,26),fill='#a6b7ad')
    d.polygon([(32,42),(26,51),(38,51)],fill='#ffdf86');d.rectangle((32,45,32,47),fill='#773b2d');d.rectangle((32,49,32,49),fill='#773b2d')
    # Cyan terminal screen, red machine panel and luminous industrial exit.
    x=64;d.rectangle((x+22,20,x+42,35),fill='#06283c');d.line((x+23,20,x+41,20),fill='#a2ffff')
    for yy in (24,27,30):d.line((x+24,yy,x+36+(yy%3),yy),fill='#46e9ed')
    x=9*64;d.rectangle((x+14,21,x+50,46),fill='#151a2d');d.rectangle((x+22,27,x+26,31),fill='#ff5a4d');d.rectangle((x+38,27,x+42,31),fill='#ff5a4d');d.line((x+24,37,x+39,37),fill='#f88a5a',width=2)
    im.save(out/'props.png')
