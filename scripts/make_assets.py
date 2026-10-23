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
# Fan blades isolated for animated machinery.
im,d=canvas(40,40)
for a in range(4):
 points=[(20,20),(24,4),(31,3),(34,10),(24,23)]
 angle=a*math.pi/2
 ps=[(round(20+(x-20)*math.cos(angle)-(y-20)*math.sin(angle)),round(20+(x-20)*math.sin(angle)+(y-20)*math.cos(angle))) for x,y in points]
 d.polygon(ps,fill='#687a69');d.line(ps,fill='#a2ad8c',width=1)
d.rectangle((17,17,23,23),fill='#1b3035');d.rectangle((19,18,21,20),fill='#b3b69a')
im.save(OUT/'fan.png')


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


# Art direction v2. The retained prop slots and logo above are reused; all actors,
# materials, parallax architecture, explosions and fracture assets are authored here.
from art.actors import generate as actors
from art.effects import generate as effects
from art.environment import generate as environment
actors(OUT)
effects(OUT)
environment(OUT)
from art.composition import generate as composition
composition(OUT)
Image.open(OUT/'zip-portrait.png').crop((13,0,38,25)).resize((50,50),Image.Resampling.NEAREST).save(OUT/'icon.png')
print('Compiled pixel sources: 48px actors, drawn fire keyframes, material tiles and composed prison bays.')

from art.machine import generate as machine
machine(OUT)
from art.reboot import generate as reboot
reboot(OUT)
