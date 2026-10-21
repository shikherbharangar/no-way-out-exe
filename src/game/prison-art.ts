import Phaser from 'phaser';
import type { PixelEffects } from './pixel-effects';

/** Non-colliding scenery: keep the gameplay plane bright and the architecture quiet. */
export class PrisonArt {
 fans: Phaser.GameObjects.Image[]=[];
 lamps: Phaser.GameObjects.Graphics[]=[];
 private signals: Phaser.GameObjects.Graphics;
 private clock=0;private nextSteam=0;private nextSpark=0;
 constructor(private scene:Phaser.Scene) {
  const g=scene.add.graphics().setDepth(-3);
  // Large shadow masses, with sparse edge glints rather than uniformly bright lines.
  for(const x of [15,189,580,652,932,1125,1255]) {
   g.fillStyle(0x07101d).fillRect(x,25,17,265);
   g.fillStyle(0x263b50).fillRect(x+2,25,3,265).fillRect(x+12,25,3,265);
   for(let y=57;y<287;y+=49) {g.fillStyle(0x132238).fillRect(x-3,y,23,8);g.fillStyle(0x647989).fillRect(x,y+2,2,2).fillRect(x+13,y+2,2,2);}
  }
  const roof=scene.add.graphics().setDepth(16);
  roof.fillStyle(0x050b14).fillRect(0,0,1280,27);
  roof.fillStyle(0x28374a).fillRect(0,26,1280,4);roof.fillStyle(0x61727d).fillRect(0,27,1280,1);
  for(let x=0;x<1280;x+=48){roof.lineStyle(2,0x1b2b3c).lineBetween(x,2,x+30,23).lineBetween(x+30,2,x,23);roof.fillStyle(0x78908e).fillRect(x+3,28,2,1);}
  // A cell cage occupies only the foreground edge of the first bay.
  g.fillStyle(0x09111f,.5).fillRect(37,177,138,110);
  for(let x=38;x<178;x+=13){g.fillStyle(0x081423).fillRect(x,176,4,110);g.fillStyle(0x3d5969).fillRect(x,178,1,108);}
  for(const y of [176,225,283]){g.fillStyle(0x142638).fillRect(34,y,146,5);g.fillStyle(0x4e6572).fillRect(34,y,146,1);}
  // Heavy return-air duct: a distinctive diagonal silhouette above the breach.
  g.fillStyle(0x08111f).fillPoints([{x:210,y:58},{x:307,y:58},{x:343,y:95},{x:343,y:120},{x:314,y:120},{x:314,y:104},{x:295,y:84},{x:210,y:84}],true);
  g.fillStyle(0x2b3b4c).fillPoints([{x:212,y:60},{x:305,y:60},{x:339,y:96},{x:339,y:118},{x:317,y:118},{x:317,y:103},{x:297,y:81},{x:212,y:81}],true);
  g.lineStyle(2,0x62727a).lineBetween(213,61,304,61).lineBetween(304,61,338,96);
  for(let x=220;x<300;x+=17){g.fillStyle(0x142439).fillRect(x,60,4,22);g.fillStyle(0x82918c).fillRect(x,62,1,2);}
  g.fillStyle(0x8e632f).fillRect(235,78,25,3);
  // Wire bundles hang in unequal arcs; the air-space silhouette is no longer repetitive.
  for(const [x,width,drop] of [[40,124,24],[350,186,43],[676,220,32],[955,155,35]]) {
   for(let wire=0;wire<3;wire++) {
    const points=Array.from({length:19},(_,i)=>({x:Math.round(x+i*width/18),y:Math.round(31+Math.sin(i/18*Math.PI)*drop+wire*3)}));
    g.lineStyle(wire===0?2:1,wire===2?0x6e4d35:0x070e1b).strokePoints(points);
   }
  }
  // Back catwalks have gaps and stairs, leaving breathing room around actors.
  for(const [start,end,y] of [[215,425,153],[662,887,125],[938,1115,158]]) {
   for(let x=start;x<end;x+=29){g.lineStyle(1,0x3b5363).lineBetween(x,y-22,x,y);g.lineStyle(1,0x1f374c).lineBetween(x,y-21,x+27,y-3);}
   g.lineStyle(1,0x526575).lineBetween(start,y-23,end,y-23);
   g.fillStyle(0x101f30).fillRect(start,y,end-start,7);g.fillStyle(0x4a5d6a).fillRect(start,y,end-start,1);
  }
  for(const x of [81,357,722,1068]) {
   scene.add.image(x,32,'props',6).setOrigin(.5,0).setDepth(17);
   const glow=scene.add.graphics().setDepth(-1).setBlendMode(Phaser.BlendModes.ADD);
   for(let i=0;i<4;i++){glow.fillStyle(0xf49f4a,.018+i*.012).fillTriangle(x-10,67,x+10,67,x+61-i*8,284);glow.fillTriangle(x-10,67,x-61+i*8,284,x+61-i*8,284);}
   this.lamps.push(glow);
  }
  for(const [x,y] of [[302,126],[775,173],[1070,116]]) {
   scene.add.image(x,y,'props',3).setDepth(-2).setTint(0x7892a6);
   this.fans.push(scene.add.image(x,y,'fan').setDepth(-1).setTint(0x879da9).setAlpha(.75));
  }
  for(const [x,y] of [[562,171],[1095,188]]) {
   g.fillStyle(0x081423).fillRect(x,y,10,288-y);g.fillStyle(0x425769).fillRect(x+2,y,4,288-y);
   for(let yy=y+6;yy<288;yy+=22){g.fillStyle(0x82908d).fillRect(x-2,yy,14,3);g.fillStyle(0x152b3d).fillRect(x-2,yy+3,14,2);}
  }
  // Uneven wall dressing: junction box, conduit bends, pressure dial, prison stencil.
  g.fillStyle(0x070f1e).fillRect(346,173,32,40);g.fillStyle(0x33475b).fillRect(348,175,28,36);
  g.lineStyle(1,0x788c92).strokeRect(350,177,24,32);g.fillStyle(0xd29442).fillTriangle(362,185,355,198,369,198);
  g.fillStyle(0x182b3e).fillRect(361,188,2,5);
  g.lineStyle(4,0x101d2c).lineBetween(376,198,400,198).lineBetween(400,198,400,269);
  g.lineStyle(1,0x516271).lineBetween(376,196,402,196).lineBetween(402,196,402,269);
  scene.add.text(46,102,'CELL BLOCK',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#526479',letterSpacing:2}).setDepth(-2);
  scene.add.text(45,113,'ZERO',{fontFamily:'monospace',fontSize:'30px',fontStyle:'bold',color:'#3a4b60',letterSpacing:3}).setDepth(-2);
  scene.add.text(404,76,'07',{fontFamily:'monospace',fontSize:'33px',fontStyle:'bold',color:'#414957'}).setDepth(-2);
  scene.add.text(402,111,'NO RELEASE',{fontFamily:'monospace',fontSize:'7px',color:'#7b6651'}).setDepth(-2);
  // Freight lift and deep foundation; foreground clutter stays below the play line.
  g.fillStyle(0x060e1b).fillRect(1141,206,113,82);
  for(let x=1148;x<1254;x+=8)g.fillStyle(x%16?0x27374e:0x14233a).fillRect(x,209,3,77);
  g.fillStyle(0xc6bd8e).fillRect(1140,286,114,2);
  for(let x=1140;x<1254;x+=10)g.fillStyle(0xf1a949).fillRect(x,283,5,3);
  const front=scene.add.graphics().setDepth(15);
  front.fillStyle(0x07101b).fillRect(0,343,1280,17);
  for(let x=0;x<1280;x+=53){front.fillStyle(0x172738).fillRect(x,342,47,8);front.fillStyle(0x4b5e66).fillRect(x,343,47,1);front.fillStyle(0x293e4d).fillRect(x+7,338,5,14);}
  this.signals=scene.add.graphics().setDepth(4);
 }
 update(dt:number,effects:PixelEffects,powered:boolean) {
  this.clock+=dt;const t=this.clock;
  this.fans.forEach((s,i)=>s.setRotation(Math.round(t*(i%2?-2:2)*32)/32));
  this.lamps.forEach((s,i)=>s.setAlpha(.88+Math.sin(t*2+i*8)*.06));
  const g=this.signals.clear();
  for(const x of [185,588,931,1128]) {
   const on=Math.sin(t*5+x)>.35,y=x===588?129:146;
   g.fillStyle(0x091421).fillRect(x-6,y,18,9);g.fillStyle(on?0xff6f3a:0x7c382f).fillRect(x-3,y+2,12,4);
   if(on){g.fillStyle(0xff6f3a,.09).fillRect(x-10,y-3,26,15);g.fillStyle(0xffe0a1).fillRect(x-2,y+2,8,1);}
  }
  // A quiet traveling electrical pulse marks the interactive terminal.
  g.fillStyle(powered?0x6cfff3:0x3285a3).fillRect(477,184,13,1);
  for(let i=0;i<3;i++)g.fillStyle(0x64eee9,.35+(Math.sin(t*6+i)+1)*.2).fillRect(500,200+i*4,2,2);
  if(t>this.nextSteam){this.nextSteam=t+.7;for(const x of [199,560,920])effects.cloud(x,281,.65,1.8,true);}
  if(t>this.nextSpark){this.nextSpark=t+2.3;effects.burst(399,199,4,0x70cfea,.28);}
  for(let i=0;i<24;i++) {
   const x=(i*91+t*(2+i%3))%1280,y=60+((i*41-t*4)%220+220)%220;
   g.fillStyle(i%4?0x77a4b2:0xf9b56b,.14+(i%3)*.07).fillRect(Math.round(x),Math.round(y),1,1);
  }
 }
}
