"""Original 48px action sprites: authored silhouettes and articulated poses."""
from PIL import Image, ImageDraw
import math

OUTLINE='#070d18'
def limb(d, points, width, dark, mid, light):
    d.line(points,fill=OUTLINE,width=width+3)
    d.line(points,fill=dark,width=width)
    d.line([(x,y-1) for x,y in points],fill=mid,width=max(2,width-2))
    d.line([(x-1,y-2) for x,y in points[:-1]],fill=light,width=2) if len(points)>2 else None

def generate(out):
    for kind,key in enumerate(('zip','brick','guard')):
        sheet=Image.new('RGBA',(48*32,48))
        for frame in range(32):
            im=Image.new('RGBA',(48,48));d=ImageDraw.Draw(im)
            def r(box,c): d.rectangle(tuple(round(v) for v in box),fill=c)
            def poly(points,c):d.polygon([(round(x),round(y)) for x,y in points],fill=c)
            skin=['#d68556','#c47b4b','#ad927a'][kind]; face=['#ffd5a0','#ffd092','#d2ba99'][kind]
            shade=['#85442f','#85442b','#68514a'][kind]
            coat=['#168b9d','#df6332','#596079'][kind]; shine=['#79fff0','#ffc668','#b0b7b1'][kind]; deep=['#154257','#85362a','#2b344b'][kind]
            run=4<=frame<=11;phase=(frame-4)%8
            lean=(2 if run else 0);bob=([0,-1,-2,-1,0,-1,-2,-1][phase] if run else [0,0,-1,-1][frame%4])
            lower=5 if frame==14 else 0
            if frame==19:lean=-3;lower=2
            if frame==20:lean=4;lower=0
            if frame==21:lean=3;lower=1
            if frame==22:lean=1;lower=2
            if frame==23:lean=-4;bob=1
            if frame in (28,29):lower=4 if frame==28 else 1
            body=24+lean; sy=17+bob+lower; hip=32+bob+lower
            if 24<=frame<=27:
                # Four genuinely different collapse poses, not a rotated idle frame.
                q=frame-24
                if q<2:
                    limb(d,[(19,29),(15,37),(9,41)],7,deep,coat,shine)
                    limb(d,[(24,29),(28,37),(37,40)],7,deep,coat,shine)
                    poly([(12,20+q*5),(25,17+q*5),(34,26+q*4),(26,35),(14,31)],OUTLINE)
                    poly([(14,21+q*5),(25,19+q*5),(31,27+q*3),(25,32),(15,30)],coat)
                    r((27,17+q*6,38,27+q*6),OUTLINE);r((29,18+q*6,37,25+q*6),face)
                    limb(d,[(25,25+q*5),(35,33),(42,36)],6,shade,skin,face)
                else:
                    poly([(5,40),(13,35),(26,36),(32,33),(43,35),(46,42),(35,45),(8,45)],OUTLINE)
                    r((9,39,23,43),deep);r((20,37,32,42),coat);r((34,35,42,41),skin);r((35,35,41,38),face)
                    r((36,37,37,38),OUTLINE);r((40,37,41,38),OUTLINE);r((30,41,38,44),'#7b7665')
                sheet.paste(im,(frame*48,0));continue
            # Legs have broad alternate contacts; shoes are anchored on full footfall frames.
            poses=[((-7,0),(7,0)),((-10,-1),(8,-7)),((-8,-4),(2,-9)),((-3,-8),(7,-4)),((7,0),(-7,0)),((10,-1),(-8,-7)),((8,-4),(-2,-9)),((3,-8),(-7,-4))]
            feet=poses[phase] if run else ((-6,0),(6,0))
            if frame==12:feet=((-10,-10),(7,-6));bob=-1
            if frame==13:feet=((-7,-3),(9,-5))
            if frame==14:feet=((-9,0),(9,0))
            for i,(dx,dy) in enumerate(feet):
                hx=body+(-3 if i==0 else 3);fx=24+dx;fy=43+dy
                knee=(round((hx+fx)/2)+(2 if i else -2),36+dy/2)
                limb(d,[(hx,hip-2),knee,(fx,fy)],6 if kind!=1 else 7,'#152135','#33475b','#63818a')
                r((fx-3,fy-2,fx+6,fy+2),OUTLINE);r((fx-2,fy-2,fx+4,fy),'#546478');r((fx-2,fy-2,fx+4,fy-2),'#b6c2b3')
                r((knee[0]-2,knee[1]-1,knee[0]+2,knee[1]+1),deep)
            # Back arm, articulated independently for a readable sprint silhouette.
            swing=[-5,-8,-5,0,6,8,5,0][phase] if run else 0
            back=(body-8,sy+3);elbow=(body-11-swing//2,sy+10);hand=(body-7-swing,sy+15-swing//2)
            if frame==12:elbow=(body-13,sy+3);hand=(body-16,sy-2)
            if frame==13:elbow=(body-14,sy+4);hand=(body-16,sy+9)
            if frame>=30:elbow=(body-12,sy-4);hand=(body-12,sy-11)
            limb(d,[back,elbow,hand],6 if kind!=1 else 8,shade,skin,face)
            r((hand[0]-3,hand[1]-2,hand[0]+3,hand[1]+3),deep);r((hand[0]-3,hand[1]-2,hand[0]+2,hand[1]-1),shine)
            # Wide, tapered body; asymmetrical costume highlights distinguish silhouettes.
            w=9 if kind==1 else 7
            poly([(body-w-1,sy-1),(body+w,sy-1),(body+w+2,sy+8),(body+5,hip),(body-6,hip),(body-w-2,sy+7)],OUTLINE)
            poly([(body-w,sy),(body+w-1,sy),(body+w,sy+7),(body+4,hip-1),(body-5,hip-1),(body-w-1,sy+6)],coat)
            poly([(body-w,sy+4),(body-2,sy+7),(body-2,hip-1),(body-5,hip-1),(body-w-1,sy+6)],deep)
            if kind==0:
                # Bright shoulder guard, fitted jacket, scarf, battery and utility webbing.
                poly([(body-7,sy),(body+1,sy-1),(body+3,sy+2),(body-5,sy+3)],'#c9f1d9')
                r((body+2,sy+3,body+4,hip-1),'#093445');r((body+3,sy+4,body+3,hip-2),'#7be8d6')
                r((body-6,sy+8,body-2,sy+10),'#4fc5c5');r((body-5,sy+8,body-2,sy+8),'#c2fff0')
                # Long angular scarf follows motion, giving ZIP an iconic outline.
                poly([(body-4,sy-2),(body-12,sy),(body-17-(3 if run else 0),sy-3),(body-12,sy+4),(body-5,sy+2)],'#114d68')
                d.line([(body-5,sy-1),(body-12,sy+1),(body-17,sy-2)],fill='#4be8ef',width=2)
            elif kind==1:
                # Orange prison tank, broad chest, reinforced harness and heavy bicep.
                poly([(body-6,sy),(body-3,sy),(body-1,hip-2),(body-4,hip-2)],'#272333')
                poly([(body+4,sy),(body+7,sy),(body+5,hip-2),(body+2,hip-2)],'#372b30')
                r((body-1,sy+4,body+3,sy+6),'#f7a54f');r((body-1,sy+4,body+3,sy+4),'#ffe4a0')
                r((body-7,sy+8,body-5,sy+10),'#ffd790')
            else:
                # Armored silhouette, angular helmet and red sensor; no hero palette overlap.
                r((body-w,sy,body+w-1,sy+4),'#89928e');r((body-5,sy+6,body+5,sy+10),'#313a4f')
                for yy in range(sy+6,sy+11,2):r((body-4,yy,body+4,yy),'#566375')
                r((body+4,sy+2,body+6,sy+3),'#ff5e4f')
            r((body-6,hip-2,body+5,hip),OUTLINE);r((body-5,hip-2,body+4,hip-1),'#766b55');r((body,hip-2,body+2,hip),'#ffe3a1')
            r((body-7,hip-1,body-4,hip+2),'#242c3b')
            # Sculpted face with strong brow, nose, ear and square jaw.
            hx=body+(1 if kind!=1 else 0);hy=sy-13
            poly([(hx-6,hy+2),(hx-4,hy),(hx+5,hy),(hx+7,hy+3),(hx+7,hy+7),(hx+9,hy+7),(hx+8,hy+10),(hx+4,hy+13),(hx-4,hy+11),(hx-7,hy+6)],OUTLINE)
            poly([(hx-5,hy+3),(hx-3,hy+1),(hx+4,hy+1),(hx+6,hy+4),(hx+6,hy+7),(hx+8,hy+7),(hx+6,hy+10),(hx+3,hy+12),(hx-3,hy+10)],skin)
            poly([(hx-1,hy+3),(hx+5,hy+3),(hx+5,hy+7),(hx+7,hy+7),(hx+5,hy+9),(hx,hy+8)],face)
            r((hx-5,hy+5,hx-3,hy+7),face)
            r((hx+1,hy+5,hx+5,hy+5),OUTLINE);r((hx+3,hy+6,hx+4,hy+7),'#fff6cf');r((hx+4,hy+6,hx+4,hy+7),OUTLINE)
            r((hx+2,hy+10,hx+5,hy+10),OUTLINE);r((hx+2,hy+9,hx+4,hy+9),'#ffe4b0')
            if kind==0:
                poly([(hx-6,hy+5),(hx-8,hy),(hx-3,hy+1),(hx-3,hy-3),(hx+1,hy-1),(hx+3,hy-4),(hx+6,hy-1),(hx+7,hy+3),(hx+1,hy+2),(hx-2,hy+5)],'#122134')
                d.line([(hx-4,hy),(hx-2,hy-1),(hx,hy+1),(hx+3,hy-2),(hx+5,hy)],fill='#7296a6',width=1)
                r((hx-5,hy+3,hx+5,hy+4),'#40e3df');r((hx+1,hy+3,hx+5,hy+3),'#ddffe3')
                r((hx-6,hy+5,hx-5,hy+7),'#0c647b')
            elif kind==1:
                r((hx-5,hy+1,hx+5,hy+2),'#532b25');r((hx-6,hy+3,hx+6,hy+4),'#fe6a36')
                r((hx-3,hy+3,hx+6,hy+3),'#ffbe6d');r((hx-6,hy+5,hx-4,hy+8),'#572d25')
                d.line([(hx-3,hy+10),(hx+2,hy+12),(hx+5,hy+11)],fill='#60362b',width=2)
                r((hx+1,hy+7,hx+1,hy+9),'#9c432e')
            else:
                poly([(hx-7,hy+1),(hx-4,hy-2),(hx+5,hy-2),(hx+8,hy+2),(hx+8,hy+5),(hx-7,hy+5)],'#303b52')
                r((hx-5,hy,hx+5,hy+2),'#8e9b9b');r((hx-5,hy+6,hx+7,hy+8),'#090e1c');r((hx+1,hy+6,hx+7,hy+7),'#ff604e')
                r((hx-4,hy+9,hx+4,hy+11),'#526171')
            # Front arm: wind-up, massive forward extension, recoil and recovery.
            shoulder=(body+w-1,sy+2);elbow=(body+w+1+swing//2,sy+8);hand=(body+w-2+swing,sy+15+swing//3)
            if frame==12:elbow=(body+9,sy+3);hand=(body+12,sy-3)
            if frame==13:elbow=(body+13,sy+4);hand=(body+16,sy+10)
            if 15<=frame<=18:elbow=(body+10,sy+8);hand=(body+15,sy+5+frame%2)
            if frame==19:elbow=(body-1,sy+10);hand=(body-7,sy+8)
            if frame in (20,21):elbow=(body+11,sy+3);hand=(41,sy+3 if frame==20 else sy+5)
            if frame==22:elbow=(body+9,sy+7);hand=(body+12,sy+12)
            if frame>=30:elbow=(body+12,sy-2);hand=(body+11,sy-9)
            limb(d,[shoulder,elbow,hand],8 if kind==1 else 6,shade,skin,face)
            if kind==1:
                # Oversized riveted power gauntlet; its mass is visible in every pose.
                poly([(hand[0]-5,hand[1]-4),(hand[0]+3,hand[1]-4),(hand[0]+6,hand[1]-1),(hand[0]+5,hand[1]+5),(hand[0]-4,hand[1]+5)],OUTLINE)
                r((hand[0]-4,hand[1]-3,hand[0]+4,hand[1]+3),'#63747b');r((hand[0]-3,hand[1]-3,hand[0]+3,hand[1]-1),'#c1cbb2')
                r((hand[0]+2,hand[1],hand[0]+4,hand[1]+3),'#f8b655');r((hand[0]-3,hand[1]+2,hand[0],hand[1]+4),'#253b4b')
                r((hand[0]-2,hand[1]-2,hand[0]-1,hand[1]-1),'#fff0b4')
            else:
                r((hand[0]-3,hand[1]-3,hand[0]+4,hand[1]+3),OUTLINE)
                r((hand[0]-2,hand[1]-2,hand[0]+3,hand[1]+2),deep)
                r((hand[0]-2,hand[1]-2,hand[0]+3,hand[1]-1),shine)
                if kind==0:r((hand[0]+2,hand[1],hand[0]+4,hand[1]+1),'#c0fff1')
            if kind==2:
                # Visible compact carbine held across the chest.
                r((body-1,sy+10,body+17,sy+13),OUTLINE);r((body+3,sy+9,body+13,sy+11),'#7a8b94');r((body+4,sy+14,body+7,sy+17),'#373745')
                r((body+13,sy+11,body+19,sy+12),'#9ca391')
            if frame in (28,29):
                for yy in range(8,45,4):d.line([(6,yy),(41,yy)],fill='#6ef5ec80',width=1)
            sheet.paste(im,(frame*48,0))
        sheet.save(out/(key+'.png'))
        # Actual hero art reused for menus, without depending on old sheet dimensions.
        if kind<2:sheet.crop((0,0,48,48)).save(out/(key+'-portrait.png'))
