"""One-time technical import of original illustrated sources, NOT an art generator.

Run explicitly to re-import; normal `npm run assets` only copies editable masters.
PNG masters open as sprite sheets in Aseprite/LibreSprite. No random drawing,
procedural anatomy, smoothing, generated texture noise, or invented scenery.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT/'art/reboot/source'
OUT = ROOT/'art/reboot/editable'
OUT.mkdir(parents=True, exist_ok=True)
NEAREST = Image.Resampling.NEAREST
COLORS = '''0c1119 141e27 1b2b36 243c46 30505a 426773 668a8c 9ab9ae
15121d 28202b 40303a 58383b 784b48 9a6353 c48159 eba56a
ffca87 ffe4b0 fff4d0 211d20 362a27 51372d 70432f 8e5433
ad6d3e c68b50 d9a96b e2c58e 2e3030 41453d 575c4d 74775f
94957a b2b296 d1cfaa 102e32 17484c 23686b 309391 59c5b5
91e8cc c8ffdf 1d242d 303e4b 4c5d69 71828b a2acaa d8dfce
471f26 732b29 a43b29 d64e26 f47729 ff9c35 ffc04e ffe16e
302526 494039 635747 86755b a69675 5a252e 8b3838 be5750 000000'''.split()
palette = Image.new('P',(1,1))
rgb = [tuple(bytes.fromhex(c)) for c in COLORS]
palette.putpalette([v for c in rgb for v in c]+[0]*(768-len(rgb)*3))

def crisp(im):
    """Fixed shared palette, hard alpha, no dithering/blur. Preserve pixel locations."""
    im=im.convert('RGBA')
    alpha=im.getchannel('A').point(lambda a:255 if a>=128 else 0)
    out=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
    out.putalpha(alpha)
    return out

def save(im,name):
    im.save(OUT/(name+'.png'))

def cell(im,n,cols,rows):
    x,y=n%cols,n//cols
    return im.crop((round(x*im.width/cols),round(y*im.height/rows),round((x+1)*im.width/cols),round((y+1)*im.height/rows)))

# Explicit pose-to-runtime mapping; the authoritative animation state is unchanged.
frames=[0,0,1,1,2,3,3,4,5,4,4,2,6,7,8,9,9,1,9,10,11,12,0,13,13,8,14,14,8,1,15,15]
for actor in ('zip','brick','guard'):
    source=Image.open(SRC/(actor+'.png')).convert('RGBA')
    poses=[]
    for i in range(16):
        part=cell(source,i,4,4)
        # Guard source frame 7 is a prone pose, not a fall; use its jump key.
        if actor=='guard' and i==7:part=cell(source,6,4,4)
        # Common cell scale preserves relative anatomy, crouches and stride width.
        part=crisp(part.resize((44,44),NEAREST))
        # Remove neighbouring corpse spill from the victory cell's lower left.
        if i==15:
            for yy in range(34,44):
                for xx in range(7):part.putpixel((xx,yy),(0,0,0,0))
        frame=Image.new('RGBA',(48,48));frame.alpha_composite(part,(2,2))
        # Normalise contact baselines explicitly; airborne passing pose stays 3px up.
        bounds=frame.getbbox()
        if bounds:
            baseline=43 if i in (5,6) else 46
            aligned=Image.new('RGBA',(48,48));aligned.alpha_composite(frame,(0,baseline-bounds[3]));frame=aligned
        poses.append(frame)
    sheet=Image.new('RGBA',(48*32,48))
    for i,p in enumerate(frames):sheet.alpha_composite(poses[p],(i*48,0))
    save(sheet,actor)
    grid=Image.new('RGBA',(192,192))
    for i,p in enumerate(poses):grid.alpha_composite(p,((i%4)*48,(i//4)*48))
    save(grid,actor+'-keys')
    if actor!='guard':save(poses[0],actor+'-portrait')

# Four illustrated 128x64px panels and explicit chipped edge masks. These are
# presentation variants of surviving collision cells, never additional terrain.
materials=Image.open(SRC/'materials.png')
tileSheet=Image.new('RGBA',(1024,512))
chips=[(0,0,1,1,0,0,0,1,2,1,0,0,1,0,0,0),
       (1,0,0,0,1,2,1,0,0,0,1,1,0,0,0,1),
       (0,1,1,0,0,0,1,0,0,2,1,0,0,0,1,0),
       (0,0,1,2,1,0,0,0,1,0,0,1,1,0,0,0)]
for material in range(4):
    panel=crisp(cell(materials,material,2,2).resize((128,64),NEAREST))
    for y in range(4):
        for x in range(8):
            base=panel.crop((x*16,y*16,x*16+16,y*16+16))
            for edge in range(16):
                part=base.copy()
                for k,depth in enumerate(chips[(x+y)%4]):
                    # Steel retains its structural lip; masonry chips up to 2px.
                    for j in range(min(depth,1) if material==2 else depth):
                        if edge&1:part.putpixel((k,j),(0,0,0,0))
                        if edge&2:part.putpixel((15-j,k),(0,0,0,0))
                        if edge&4:part.putpixel((k,15-j),(0,0,0,0))
                        if edge&8:part.putpixel((j,k),(0,0,0,0))
                index=edge*128+material*32+y*8+x
                tileSheet.alpha_composite(part,((index%64)*16,(index//64)*16))
save(tileSheet,'tiles')

source=Image.open(SRC/'props.png').convert('RGBA')
props=Image.new('RGBA',(64*8,64))
# Props have independent physical dimensions; the barrel must retain its old size.
sizes=[(28,40),(42,46),(50,62),(64,64),(32,43),(58,36),(45,40),(48,64)]
for i,size in enumerate(sizes):
    part=cell(source,i,4,2)
    bounds=part.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    if bounds:part=part.crop(bounds)
    part=crisp(part.resize(size,NEAREST))
    props.alpha_composite(part,(i*64+(64-size[0])//2,64-size[1]))
save(props,'props')
shutter=cell(source,7,4,2)
shutter=shutter.crop(shutter.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox())
# Gate collision proportions require dedicated native rasters, not stretched pixels.
save(crisp(shutter.resize((32,128),NEAREST)),'gate')
save(crisp(shutter.resize((92,100),NEAREST)),'freight')

source=Image.open(SRC/'fire.png').convert('RGBA')
fire=Image.new('RGBA',(128*18,128))
for i,p in enumerate([0,1,2,2,3,3,4,4,5,5,6,6,7,7,8,9,10,11]):
    fire.alpha_composite(crisp(cell(source,p,4,3).resize((128,128),NEAREST)),(i*128,0))
save(fire,'explosion')

background=crisp(Image.open(SRC/'prison.png').resize((1280,360),NEAREST))
# An explicitly drawn mask separates the recessed cell shaft from its broken arch.
mask=Image.new('L',background.size)
ImageDraw.Draw(mask).polygon([(442,99),(478,73),(517,55),(558,41),(605,38),(650,50),(693,64),(725,82),(768,96),(809,115),(835,158),(829,251),(804,271),(756,301),(680,305),(619,281),(594,260),(550,240),(507,223),(474,222),(441,237)],fill=255)
near=background.copy();near.putalpha(Image.eval(mask,lambda a:255-a))
save(near,'architecture')
save(background,'depth')
json.dump({'palette':['#'+c for c in COLORS],'nativeResolution':[640,360],'world':[1280,352],'cell':48,'baseline':46,'frames':frames,'source':'Original image-generated illustrations, technically imported; not claimed hand-pixelled','materials':['plaster','foundation','steel','slab'],'materialPanel':[128,64],'tileAtlas':[1024,512],'edgeBits':['top','right','bottom','left'],'props':['barrel','terminal','cell','pipes','lamp','rubble','cabinet','shutter']},open(ROOT/'art/reboot/specification.json','w'),indent=2)
print('Imported editable native-pixel masters. Review them before copying to runtime.')
