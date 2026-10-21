"""Original pixel assets. Integer coordinates, limited palettes, deterministic texture.
No sourced game art. Pillow is needed only to re-author the committed PNGs.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random, math
OUT=Path(__file__).resolve().parents[1]/'public/assets'; OUT.mkdir(exist_ok=True)
rng=random.Random(814)
INK='#0b1119'; DARK='#15202a'; STEEL='#344854'; EDGE='#718280'; RUST='#82523c'; ORANGE='#ef8b35'; LIGHT='#ffdd8c'; CYAN='#75eadb'
def canvas(w,h):
 im=Image.new('RGBA',(w,h));return im,ImageDraw.Draw(im)
def rect(d,box,c): d.rectangle(tuple(map(int,box)),fill=c)
def line(d,pts,c,w=1): d.line(pts,fill=c,width=w)
def label(d,xy,s,c='#b2b7a0',size=8):
 f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',size)
 d.text(xy,s,font=f,fill=c,stroke_width=0)
# Tiles: masonry variants, concrete, dirt, riveted steel, breakable brick and deck.
im,d=canvas(16*12,16)
for t in range(12):
 ox=t*16
 base=['#485452','#535c52','#3d4a49','#725c43','#615540','#4c4437','#32434c','#465961','#715f4a','#686b59','#344753','#252f36'][t]
 rect(d,(ox,0,ox+15,15),base)
 for n in range(48):
  x=ox+rng.randrange(16);y=rng.randrange(16)
  col=rng.choice(['#ffffff16','#00000020'])
  # Solid palette clusters, no soft noise.
  orig=tuple(int(base[i:i+2],16) for i in (1,3,5)); off=rng.choice([-16,-10,8,14])
  c=tuple(max(0,min(255,v+off)) for v in orig)+(255,)
  rect(d,(x,y,min(x+rng.randrange(1,4),ox+15),y),c)
 if t<3 or t==8:
  for y in [0,8]:
   line(d,[(ox,y),(ox+15,y)],'#242f32');line(d,[(ox,y+1),(ox+15,y+1)],'#748071')
   for x in ([4,14] if y==0 else [0,10]):line(d,[(ox+x,y),(ox+x,y+7)],'#283333')
  if t==8:
   line(d,[(ox+7,0),(ox+5,5),(ox+9,8),(ox+5,12),(ox+6,15)],'#171f28',2)
   line(d,[(ox+9,8),(ox+14,10)],'#c6ae77')
 elif t in (6,7,10,11):
  rect(d,(ox,0,ox+15,1),'#9caa92' if t==7 else '#60767b')
  line(d,[(ox,15),(ox+15,15)],INK);line(d,[(ox,1),(ox,14)],'#1b2a32')
  for x in (2,13):
   for y in (3,12):rect(d,(ox+x,y,ox+x+1,y+1),'#84958b')
  if t==7:
   for x in range(0,16,6): d.polygon([(ox+x,2),(ox+x+3,2),(ox+x-1,6),(ox+x-4,6)],fill='#d2a14d')
 elif t==9:
  line(d,[(ox,1),(ox+15,1)],'#bbb994',2)
  line(d,[(ox+3,9),(ox+8,6),(ox+10,10)],'#343c38')
 else:
  for n in range(5):
   x=ox+rng.randrange(12);y=rng.randrange(13)
   rect(d,(x,y,x+3,y+2),rng.choice(['#7f7153','#302f2b','#99805c']))
im.save(OUT/'tiles.png')
# Distant prison architecture, built with stepped color bands and dense small silhouettes.
im,d=canvas(1600,360)
rect(d,(0,0,1599,359),'#101c27')
for y,c in [(55,'#142430'),(130,'#1c3038'),(205,'#29403f'),(265,'#354b44')]:rect(d,(0,y,1599,359),c)
for i in range(32):
 x=i*54-15;top=rng.randrange(15,100);w=rng.randrange(35,65)
 rect(d,(x,top,x+w,310),'#142631');rect(d,(x+2,top,x+w-2,top+3),'#2a4149')
 for yy in range(top+12,290,18):
  for xx in range(x+6,x+w-4,10):
   rect(d,(xx,yy,xx+4,yy+7),rng.choice(['#203944','#29454b','#35564f','#546753']))
   if rng.random()<.15:rect(d,(xx,yy,xx+3,yy+3),'#8c8150')
 for yy in (112,207):line(d,[(x,yy),(x+w,yy)],'#3d5355',2)
for i in range(9):
 x=i*190+25;rect(d,(x,0,x+7,359),'#0f202b');rect(d,(x+2,0,x+3,359),'#34505a')
 for yy in range(10,360,44):d.polygon([(x,yy),(x+90,yy+55),(x+90,yy+60),(x,yy+5)],fill='#1d3540')
# cables against shafts
for x in range(0,1600,120):
 d.arc((x,-24,x+170,100),0,180,fill='#0a1721',width=2)
im.save(OUT/'far.png')
# Middle architecture: barred windows, masonry courses, ducting, balconies, vines.
im,d=canvas(1600,360)
for x in range(0,1600,160):
 for yy in range(52,294,12):
  for xx in range(x,x+160,24):
   j=6 if (yy//12)%2 else 0
   rect(d,(xx+j,yy,xx+j+22,yy+10),rng.choice(['#273a3d','#293d3e','#304242','#26383b']))
   line(d,[(xx+j,yy),(xx+j+21,yy)],'#3e5049')
 # barred tall window
 rect(d,(x+15,64,x+117,180),'#131f29');rect(d,(x+18,67,x+114,177),'#497063')
 for yy in range(69,178,7):line(d,[(x+20,yy),(x+112,yy)],'#3f5d55')
 rect(d,(x+25,77,x+107,163),(0,0,0,0))
 if x%480==160:
  rect(d,(x+21,81,x+110,161),'#5b5540')
  for yy in range(83,160,5):line(d,[(x+22,yy),(x+109,yy)],'#716246')
 for xx in range(x+28,x+110,12):
  rect(d,(xx,76,xx+3,167),'#101f29');rect(d,(xx,76,xx,167),'#587062')
 for yy in [91,144]:rect(d,(x+22,yy,x+112,yy+3),'#182d34')
 rect(d,(x+12,177,x+120,182),'#506157');rect(d,(x+14,183,x+118,187),'#15242c')
 # bolted buttress
 rect(d,(x+133,26,x+151,300),'#15262e');rect(d,(x+135,26,x+144,300),'#3e504b');rect(d,(x+137,26,x+139,300),'#647160')
 for yy in range(37,300,36):
  rect(d,(x+130,yy,x+153,yy+7),'#182b32');line(d,[(x+131,yy),(x+153,yy)],'#728071')
  rect(d,(x+134,yy+2,x+135,yy+3),'#92a08a');rect(d,(x+148,yy+2,x+149,yy+3),'#92a08a')
 # lower pipe manifold
 for yy in (225,247,271):
  rect(d,(x+2,yy,x+130,yy+6),'#101e28');rect(d,(x+2,yy+1,x+130,yy+3),'#58675a')
  for xx in range(x+8,x+130,33):rect(d,(xx,yy-1,xx+4,yy+8),'#3d4b45')
 for j in range(19):
  vx=x+rng.randrange(10,130);vy=rng.randrange(190,289)
  rect(d,(vx,vy,vx+rng.randrange(1,5),vy+1),rng.choice(['#536052','#405348','#1c3035']))
 # Leaking water, moss, exposed wire and corrosion collect around window edges.
 for n in range(35):
  xx=x+rng.randrange(17,120);yy=rng.randrange(176,215)
  if rng.random()<.65:rect(d,(xx,yy,xx+1,yy+rng.randrange(1,6)),rng.choice(['#405c45','#52654a','#696548']))
 # stencil
 label(d,(x+29,196),f'PANOPTICON / {x//160+1:02}', '#78826a',6)
 # hanging chains
 for yy in range(26,65,4):rect(d,(x+58,yy,x+59,yy+2),'#7d7f63')
 # warm light housing
 rect(d,(x+44,58,x+73,64),'#101b23');rect(d,(x+46,60,x+71,62),'#d79b54');rect(d,(x+48,60,x+68,60),'#ffe2a1')
im.save(OUT/'mid.png')
# Foreground scenery / props sheet, 64x64 cells.
im,d=canvas(64*10,64)
for k in range(10):
 x=k*64
 if k==0: # explosive barrel
  rect(d,(x+21,29,x+43,59),INK);rect(d,(x+23,28,x+41,58),'#944a35');rect(d,(x+25,30,x+28,57),'#c16d43')
  for yy in [29,39,54]:rect(d,(x+21,yy,x+43,yy+3),'#2a363a');line(d,[(x+23,yy),(x+41,yy)],'#7e8874')
  d.polygon([(x+32,41),(x+27,49),(x+37,49)],fill='#edbc64');rect(d,(x+32,44,x+32,46),'#542c29')
 elif k==1: # terminal
  rect(d,(x+17,14,x+47,51),INK);rect(d,(x+19,16,x+45,48),'#55645c');rect(d,(x+22,20,x+42,35),'#102c30');rect(d,(x+24,22,x+40,23),CYAN)
  for yy in [26,29,32]:line(d,[(x+24,yy),(x+rng.randrange(30,40),yy)],'#4da89d')
  rect(d,(x+18,39,x+46,43),'#1b3036')
  for xx in range(x+21,x+43,4):rect(d,(xx,40,xx+1,41),'#aab5a0')
  rect(d,(x+24,49,x+39,63),'#354743');rect(d,(x+18,60,x+46,63),'#788575')
 elif k==2: # heavy crate
  rect(d,(x+10,26,x+53,63),INK);rect(d,(x+12,28,x+51,61),'#705d44')
  for xx in range(x+14,x+52,8):rect(d,(xx,29,xx+2,60),'#99805b')
  for yy in [28,57]:rect(d,(x+12,yy,x+51,yy+4),'#b09867')
  for xx in [13,48]:
   for yy in [29,58]:rect(d,(xx,yy,xx+1,yy+1),'#303a35')
  d.polygon([(x+29,36),(x+35,36),(x+35,44),(x+40,44),(x+32,52),(x+24,44),(x+29,44)],fill='#333d36')
 elif k==3: # big fan grille
  rect(d,(x+3,3,x+60,60),'#0d1e28');rect(d,(x+5,5,x+58,58),'#516056');rect(d,(x+8,8,x+55,55),'#122b32')
  d.ellipse((x+11,11,x+52,52),fill='#203b41',outline='#7c8873',width=2)
  for xx in range(x+10,x+55,5):line(d,[(xx,10),(xx,54)],'#0c202a')
  for yy in range(12,55,5):line(d,[(x+10,yy),(x+54,yy)],'#314a48')
  for xx in [6,56]:
   for yy in [6,56]:rect(d,(xx,yy,xx+1,yy+1),'#a5aa89')
 elif k==4: # warning sign
  rect(d,(x+7,24,x+57,48),'#19292f');rect(d,(x+9,26,x+55,46),'#c0a15e');rect(d,(x+11,28,x+53,44),'#343b32')
  label(d,(x+14,29),'DANGER','#dfb566',8);label(d,(x+15,38),'HIGH VOLT','#b7b88e',6)
 elif k==5: # exit signage
  rect(d,(x+4,21,x+60,45),'#0a252c');rect(d,(x+6,23,x+58,43),'#385c50');line(d,[(x+7,24),(x+57,24)],CYAN)
  label(d,(x+13,26),'EXIT >','#9bd8af',12)
 elif k==6: # ceiling lamp
  line(d,[(x+32,0),(x+32,27)],'#788074',2);rect(d,(x+18,26,x+46,30),'#152731')
  d.polygon([(x+22,25),(x+42,25),(x+47,33),(x+17,33)],fill='#556558');rect(d,(x+20,33,x+44,35),'#ffdb87')
 elif k==7: # cables and switch
  rect(d,(x+23,30,x+43,61),'#23383d');rect(d,(x+25,32,x+41,59),'#85917a')
  rect(d,(x+29,37,x+37,52),'#15272d');rect(d,(x+30,40,x+34,46),'#df7b45')
  for xx in [26,38]:rect(d,(x+xx- x,33,x+xx-x,34),'#d7d2a4')
 elif k==8: # prison bed
  rect(d,(x+1,42,x+62,49),'#3a4f4d');rect(d,(x+4,38,x+59,43),'#9a9676');rect(d,(x+8,36,x+21,40),'#b8b18a');rect(d,(x+25,37,x+57,41),'#4b6960')
  for xx in [4,57]:rect(d,(x+xx,45,x+xx+3,63),'#6f7c68')
 else: # monitor WARDEN
  rect(d,(x+9,16,x+55,52),'#0b1922');rect(d,(x+11,18,x+53,50),'#6d7865');rect(d,(x+14,21,x+50,46),'#192f35')
  for xx in [22,38]:rect(d,(x+xx,27,x+xx+4,31),'#e4ab55')
  line(d,[(x+24,37),(x+39,37)],'#d37c42',2)
  rect(d,(x+16,53,x+19,63),'#475950');rect(d,(x+47,53,x+50,63),'#475950')
im.save(OUT/'props.png')
# Original hand-directed characters. 32 x 40 frames: idle 0-3, run 4-11,
# jump 12, fall 13, land 14, interact 15-18, attack 19-22, hurt 23,
# death 24-27, revive 28-29, victory 30-31.
def character(kind):
 im,d=canvas(32*32,40)
 skin=['#d8a479','#cb9770','#b29476'][kind];hilite=['#f4c59a','#ecc298','#c4bb91'][kind];shirt=['#79d8c4','#e28b46','#6f7f68'][kind];shadow=['#2d797d','#86472f','#394e49'][kind]
 for fr in range(32):
  ox=fr*32;run=4<=fr<=11;phase=(fr-4)*math.pi/4
  bob=(-1 if fr%4<2 else 0) if not run else round(math.cos(phase*2))
  yy=5+bob; center=16;wide=7 if kind==1 else 4
  attack=19<=fr<=22;dead=24<=fr<=27
  if dead:
   # four authored collapse poses, head and limbs separately articulated
   y=25+(fr-24)*2
   rect(d,(ox+5,y,ox+26,y+6),INK);rect(d,(ox+8,y+1,ox+19,y+4),shirt)
   rect(d,(ox+22,y-2,ox+28,y+3),skin);rect(d,(ox+3,y+3,ox+10,y+7),'#253d45')
   rect(d,(ox+24,y,ox+25,y),'#1c252b');continue
  if fr==14:yy+=3
  if fr in (28,29):yy+=2
  # back arm, exposed bicep
  arm=round(math.sin(phase)*3) if run else 0
  rect(d,(ox+center-wide-4,yy+11+arm,ox+center-wide,yy+20+arm),INK)
  rect(d,(ox+center-wide-3,yy+12+arm,ox+center-wide-1,yy+19+arm),skin)
  # boots and alternating thighs
  for leg,sgn in [(0,-1),(1,1)]:
   lx=center+sgn*3+round(math.sin(phase)*sgn*4) if run else center+sgn*3
   ly=yy+22+(round(math.cos(phase)*sgn*2) if run else 0)
   if fr==12: ly-=3 if leg else 0;lx+=sgn*2
   if fr==13:lx+=sgn*2
   rect(d,(ox+lx-2,yy+20,ox+lx+2,ly+8),INK);rect(d,(ox+lx-1,yy+21,ox+lx+1,ly+5),'#334e53')
   rect(d,(ox+lx-2,ly+5,ox+lx+4,ly+8),'#131d27');rect(d,(ox+lx-1,ly+5,ox+lx+3,ly+5),'#7f8770')
  # torso broad shoulders and vest
  d.polygon([(ox+center-wide-1,yy+10),(ox+center+wide+1,yy+10),(ox+center+wide+2,yy+19),(ox+center+3,yy+24),(ox+center-4,yy+24),(ox+center-wide-2,yy+18)],fill=INK)
  rect(d,(ox+center-wide,yy+11,ox+center+wide,yy+20),shirt);rect(d,(ox+center-wide,yy+15,ox+center-1,yy+21),shadow)
  rect(d,(ox+center-4,yy+21,ox+center+4,yy+23),'#1c2a30');rect(d,(ox+center,yy+21,ox+center+2,yy+22),'#d5b779')
  line(d,[(ox+center+1,yy+12),(ox+center+3,yy+19)],'#edc291' if kind==1 else '#b8ddd0')
  # head, neck, jutting nose, ear and dark jawline
  rect(d,(ox+center-2,yy+8,ox+center+2,yy+11),skin)
  rect(d,(ox+center-5,yy,ox+center+5,yy+9),INK)
  rect(d,(ox+center-4,yy+1,ox+center+4,yy+7),skin);rect(d,(ox+center,yy+2,ox+center+4,yy+5),hilite)
  rect(d,(ox+center+5,yy+4,ox+center+6,yy+6),skin)
  rect(d,(ox+center+1,yy+4,ox+center+2,yy+4),INK)
  rect(d,(ox+center,yy+8,ox+center+4,yy+9),'#6f4c3a')
  # distinct hair / red bandanna / prison cap
  if kind==0:
   rect(d,(ox+center-5,yy,ox+center+2,yy+2),'#252b30');rect(d,(ox+center-3,yy-2,ox+center+1,yy),'#303942')
   rect(d,(ox+center-5,yy+3,ox+center+3,yy+3),'#b5e9d6');line(d,[(ox+center-5,yy+3),(ox+center-10,yy+7)],'#61b9b2',2)
  elif kind==1:
   rect(d,(ox+center-4,yy,ox+center+4,yy+1),'#6d4a36');rect(d,(ox+center-5,yy+2,ox+center+4,yy+3),'#dc6940')
   rect(d,(ox+center-5,yy+4,ox+center-3,yy+6),'#5b3d2d')
  else:
   rect(d,(ox+center-5,yy-1,ox+center+5,yy+2),'#455d59');rect(d,(ox+center-2,yy+3,ox+center+6,yy+4),'#152b32')
  # forward arm, muscle highlight, gloves and metal cuff
  ax=center+wide-1;ay=yy+12-arm
  if attack:
   ext=[2,7,8,4][fr-19];rect(d,(ox+ax,yy+12,ox+min(30,ax+ext+3),yy+17),INK)
   rect(d,(ox+ax+1,yy+13,ox+min(30,ax+ext+2),yy+16),skin);rect(d,(ox+min(29,ax+ext),yy+12,ox+min(31,ax+ext+3),yy+17),'#a3b5a0')
  elif fr>=30:
   rect(d,(ox+ax,yy+4,ox+ax+4,yy+14),INK);rect(d,(ox+ax+1,yy+5,ox+ax+3,yy+13),hilite)
  elif 15<=fr<=18:
   rect(d,(ox+ax,yy+12,ox+ax+7,yy+15),skin);rect(d,(ox+ax+5,yy+10+fr%2,ox+ax+7,yy+14),CYAN)
  else:
   rect(d,(ox+ax,ay,ox+ax+5,ay+10),INK);rect(d,(ox+ax+1,ay+1,ox+ax+4,ay+7),skin);rect(d,(ox+ax+1,ay+1,ox+ax+3,ay+3),hilite)
   rect(d,(ox+ax,ay+7,ox+ax+5,ay+9),'#9caa94');rect(d,(ox+ax+1,ay+9,ox+ax+4,ay+11),'#344747')
 im.save(OUT/(['zip','brick','guard'][kind]+'.png'))
for i in range(3):character(i)
# Authored, stepped, irregular explosion frames. Solid pixel shapes at every scale.
im,d=canvas(96*12,96)
for fr in range(12):
 ox=fr*96;cx=ox+48;cy=48
 rad=[9,19,30,39,43,43,41,37,33,28,20,12][fr]
 for layer,(col,scale) in enumerate([('#252d31',1.07),('#535446',1),('#a95231',.87),('#e98032',.75),('#ffc35a',.57),('#fff0ad',.34)]):
  if fr>7 and layer>2:continue
  r=rad*scale
  pts=[]
  rr=random.Random(212+fr//3+layer)
  for a in range(32):
   ang=a*math.pi/16;v=r*(.8+rr.random()*.25)
   pts.append((cx+round(math.cos(ang)*v/2)*2,cy+round(math.sin(ang)*v/2)*2))
  d.polygon(pts,fill=col)
 for k in range(12):
  a=k*2.4;dist=rad+5+fr
  px=cx+round(math.cos(a)*dist);py=cy+round(math.sin(a)*dist)
  rect(d,(px,py,px+1,py+2),'#f4c76c' if fr<8 else '#656251')
im.save(OUT/'explosion.png')
# Fan blades isolated for animated machinery.
im,d=canvas(40,40)
for a in range(4):
 points=[(20,20),(24,4),(31,3),(34,10),(24,23)]
 angle=a*math.pi/2
 ps=[(round(20+(x-20)*math.cos(angle)-(y-20)*math.sin(angle)),round(20+(x-20)*math.sin(angle)+(y-20)*math.cos(angle))) for x,y in points]
 d.polygon(ps,fill='#687a69');d.line(ps,fill='#a2ad8c',width=1)
d.rectangle((17,17,23,23),fill='#1b3035');d.rectangle((19,18,21,20),fill='#b3b69a')
im.save(OUT/'fan.png')
print('Wrote 9 original pixel-art sheets / layers to',OUT)

# Original block-letter title, individually authored glyphs with pixel chipping.
glyphs={
'N':['10001','11001','11001','10101','10011','10011','10001'],
'O':['01110','11011','11011','11011','11011','11011','01110'],
'W':['10001','10001','10001','10101','10101','11011','10001'],
'A':['01110','11011','11011','11111','11011','11011','11011'],
'Y':['11011','11011','11011','01110','00100','00100','00100'],
'U':['11011','11011','11011','11011','11011','11011','01110'],
'T':['11111','11111','00100','00100','00100','00100','00100'],
'E':['11111','11000','11000','11110','11000','11000','11111'],
'X':['10001','11011','01110','00100','01110','11011','10001'],
'.':['00000','00000','00000','00000','00000','00110','00110']}
im,d=canvas(240,115)
def pixel_word(word,x,y,scale,col,shadow=True):
 for char in word:
  if char==' ':x+=scale*3;continue
  shape=glyphs[char]
  if shadow:
   for yy,row in enumerate(shape):
    for xx,v in enumerate(row):
     if v=='1':rect(d,(x+xx*scale+2,y+yy*scale+3,x+(xx+1)*scale+1,y+(yy+1)*scale+2),'#687566')
  for yy,row in enumerate(shape):
   for xx,v in enumerate(row):
    if v=='1':rect(d,(x+xx*scale,y+yy*scale,x+(xx+1)*scale-1,y+(yy+1)*scale-1),col)
  x+=scale*6
pixel_word('NO WAY',1,1,7,'#dedfc0');pixel_word('OUT',1,58,7,'#dedfc0');pixel_word('.EXE',119,87,3,'#eaaa64')
for n in range(48):
 x=rng.randrange(236);y=rng.randrange(108)
 if im.getpixel((x,y))[:3]==(222,223,192):rect(d,(x,y,x+rng.randrange(1,4),y),'#b6bba0')
im.save(OUT/'logo.png')
# Small favicon cut directly from our own protagonist.
Image.open(OUT/'zip.png').crop((6,3,28,25)).resize((44,44),Image.Resampling.NEAREST).save(OUT/'icon.png')
