"""Cell Block Zero's two deliberately composed bays, not a repeating room generator."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json

def generate(out):
    im=Image.new('RGBA',(1280,360));d=ImageDraw.Draw(im)
    def poly(p,c):d.polygon(p,fill=c)
    def r(b,c):d.rectangle(b,fill=c)
    def line(p,c,w=1):d.line(p,fill=c,width=w)
    def label(x,y,t,c,size):d.text((x,y),t,font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',size),fill=c,stroke_width=0)
    # Ochre plaster over sea-green paint; a broken arch frames the first breach.
    poly([(0,30),(234,30),(234,50),(259,50),(259,68),(280,68),(280,188),(303,188),(303,285),(0,285)],'#3e3b38')
    poly([(0,43),(219,43),(219,67),(244,67),(244,91),(258,91),(258,188),(278,188),(278,282),(0,282)],'#746449')
    poly([(0,170),(94,170),(94,166),(125,166),(125,174),(163,174),(163,169),(218,169),(218,181),(260,181),(260,282),(0,282)],'#3c5d57')
    # Hand placed plaster fractures, missing chunks, chalk and drips.
    for pts in [[(12,57),(37,57),(37,60),(52,60),(47,67),(18,67)],[(193,73),(209,69),(218,82),(208,88)],[(207,147),(219,150),(223,162),(214,165)],[(98,155),(112,153),(118,163),(108,166)],[(4,236),(27,238),(25,248),(9,246)]]:poly(pts,'#4d493c')
    for pts in [[(197,45),(190,69),(199,79),(195,96)],[(39,135),(46,148),(42,161),(52,175)],[(175,192),(169,215),(177,226),(172,247)]]:
        line(pts,'#283735',2);line([(x+1,y) for x,y in pts],'#8a7954')
    # Large cell door. Deep black opening, worn warm stone voussoirs, cold inside.
    poly([(33,280),(33,167),(40,149),(57,135),(133,135),(151,150),(157,169),(157,280)],'#242c2e')
    poly([(42,280),(42,171),(48,155),(60,147),(130,147),(144,160),(147,175),(147,280)],'#0b1922')
    for x in [48,65,82,99,116,133]:
        r((x,159,x+3,280),'#273d42');line([(x,161),(x,280)],'#718078')
    for y in [183,247]:r((40,y,150,y+4),'#3b5352');line([(41,y),(149,y)],'#8e9982')
    r((121,207,135,229),'#526b63');r((125,213,130,217),'#0b1922')
    label(54,109,'C / 003','#b9aa7c',11)
    # A fallen meal tray, bunk and abandoned clothing imply a lived-in prison.
    r((51,240,128,243),'#647a75');r((51,244,128,251),'#182a31');r((55,236,124,239),'#52615c')
    poly([(55,237),(58,233),(81,234),(82,238)],'#a69b77');r((56,250,59,278),'#415957');r((122,250,125,278),'#415957')
    for x in [174,181,188,195]:line([(x,218),(x,231)],'#c2b88a')
    line([(170,229),(198,220)],'#c2b88a');label(165,242,'NO SUN','#c0b18b',6)
    # Large breached observation aperture leaves the distant parallax visible.
    poly([(284,31),(560,31),(560,153),(541,153),(541,71),(522,52),(307,52),(286,74),(286,174),(273,174),(273,55)],'#243c42')
    line([(290,72),(309,55),(521,55),(538,72)],'#829187',2)
    r((290,157,538,163),'#273e43');line([(290,157),(538,157)],'#8d9988')
    label(409,63,'INMATE TRANSFER','#9ca688',7)
    # Sparse floor-side drainage and grime: no all-over random noise.
    for x,y,w in [(16,274,21),(173,270,48),(302,276,34),(511,279,38)]:
        r((x,y,x+w,y+5),'#142b33');line([(x,y),(x+w,y)],'#62776a')
    # The ash-transfer furnace: a different hue, an enormous recognizable silhouette.
    r((638,30,1140,287),'#352b32')
    poly([(654,43),(953,43),(968,64),(968,284),(654,284)],'#584039')
    # Authored broad masonry joints, concentrated at the furnace instead of wallpaper.
    for y in [49,71,94,117,141,166,191,217,244,268]:
        line([(658,y),(951,y)],'#302a30',2)
        for x in ([680,751,824,911] if y%2 else [711,789,870,944]):
            line([(x,y+2),(x-2,y+18)],'#302a30');line([(x+1,y+3),(x+4,y+14)],'#795443')
    # Arched refractory mouth, its big dark center makes action silhouettes readable.
    poly([(691,278),(691,139),(699,109),(724,83),(760,70),(818,70),(852,83),(877,109),(885,141),(885,278)],'#211e29')
    poly([(705,277),(705,140),(712,117),(734,95),(762,84),(815,84),(841,95),(863,119),(871,142),(871,277)],'#ad6245')
    poly([(715,277),(715,143),(722,123),(741,106),(765,97),(812,97),(834,108),(853,128),(860,146),(860,277)],'#673733')
    poly([(724,277),(724,145),(732,128),(747,115),(769,108),(807,108),(827,120),(844,137),(850,153),(850,277)],'#151d28')
    for a,b in [((711,112),(728,125)),((733,88),(744,109)),((764,72),(770,105)),((817,73),(809,107)),((851,89),(830,120)),((875,112),(846,139))]:line([a,b],'#352832',3)
    # Orange vent-light is localized below the black arch, not a full-screen gradient.
    poly([(728,267),(728,221),(744,217),(744,195),(758,192),(758,223),(777,215),(783,185),(798,201),(806,230),(823,204),(836,228),(845,230),(845,277)],'#743a35')
    poly([(731,277),(731,245),(746,249),(753,228),(761,249),(779,238),(790,212),(798,252),(816,231),(827,255),(844,247),(844,277)],'#bc5a38')
    poly([(734,277),(734,265),(760,261),(774,271),(787,247),(795,269),(821,257),(839,269),(839,277)],'#e99a4b')
    for x in [725,746,767,788,809,830,849]:
        r((x,180,x+6,280),'#121c27');line([(x,182),(x,277)],'#aa6643');r((x+1,181,x+3,192),'#dca15b')
    r((719,177,858,183),'#182430');line([(720,178),(857,178)],'#c48a54')
    label(705,46,'ASH TRANSFER / 07','#ca9e69',12)
    label(731,152,'NOT AN EXIT','#b07858',9)
    # Huge chipped sea-green exhaust stack and offset inspection platform.
    poly([(965,30),(1030,30),(1030,76),(1055,101),(1055,286),(987,286),(987,125),(965,103)],'#152930')
    poly([(970,31),(1024,31),(1024,79),(1049,104),(1049,286),(994,286),(994,121),(970,98)],'#365653')
    line([(974,33),(974,95),(999,120),(999,282)],'#8b9474',3)
    for y in [47,88,150,218,267]:
        r((990 if y>100 else 965,y,1054 if y>100 else 1029,y+6),'#1b333a')
        r((994 if y>100 else 969,y,1050 if y>100 else 1025,y+1),'#86957c')
    for pts in [[(1011,155),(1021,151),(1024,162),(1017,170)],[(1004,230),(1016,230),(1011,253),(1003,249)]]:poly(pts,'#84503b')
    # Negative shaft above bridge: diagonal structural ribs, drooping chain and wrecked signage.
    poly([(895,31),(938,31),(1058,165),(1048,183)],'#0a1720');line([(925,34),(1050,173)],'#74694e',2)
    for x,y in [(934,49),(955,73),(978,98),(1000,122)]:r((x,y,x+2,y+2),'#a39365')
    line([(1075,32),(1075,109),(1069,125),(1069,183)],'#0a131f',3)
    for y in range(44,110,9):r((1074,y,1076,y+3),'#768677')
    poly([(1058,182),(1119,173),(1122,194),(1061,202)],'#826c48')
    line([(1059,182),(1118,174)],'#c9b879');label(1063,182,'RECLAIM','#242e30',7)
    # Door to the lift: pale concrete, deep vertical recess and warm threshold.
    r((1135,34,1279,285),'#444e49');r((1149,66,1267,282),'#192f34')
    poly([(1150,65),(1171,47),(1245,47),(1268,66)],'#7a8070');line([(1172,47),(1243,47)],'#c7bc8f',2)
    label(1173,84,'FREIGHT','#abb28d',12);label(1189,103,'04','#c4c59b',28)
    # Foreground framing is placed at the edges of bays, away from the characters.
    im.save(out/'prison-composition.png')
    # Discrete authored chips and joints for the principal destructible masonry tile.
    source=json.loads((Path(__file__).resolve().parents[2]/'art/source/materials.pixels.json').read_text())
    tiles=Image.open(out/'tiles.png')
    for spec in source['tiles']:
        for y,row in enumerate(spec['pixels']):
            for x,c in enumerate(row):
                rgb=source['palettes'][spec['palette']][c]
                tiles.putpixel((spec['index']*16+x,y),tuple(int(rgb[i:i+2],16) for i in (1,3,5))+(255,))
    tiles.save(out/'tiles.png')
