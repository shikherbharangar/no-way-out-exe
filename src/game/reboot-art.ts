import Phaser from 'phaser';
import type { PixelEffects } from './pixel-effects';

/** Reviewed raster layers and prop placements. No architecture drawn by code.
 * All scenery is cosmetic; terrain silhouettes below come from the host's grid.
 */
export class RebootArt {
 private clock=0;
 private lamps:Phaser.GameObjects.Image[]=[];
 private signal:Phaser.GameObjects.Graphics;
 constructor(scene:Phaser.Scene){
  scene.add.image(0,0,'reboot-depth').setOrigin(0).setScrollFactor(.28,.3).setDepth(-20).setTint(0x8aa7af);
  scene.add.image(0,0,'reboot-architecture').setOrigin(0).setDepth(-8);
  // The original illustration's recess is a separate, slower moving depth plane.
  for(const [x,y,frame] of [[82,288,2],[175,87,3],[556,148,6],[1112,112,3]])
   scene.add.image(x,y,'reboot-props',frame).setOrigin(.5,1).setDepth(-4).setTint(0xa4a38e);
  for(const [x,y] of [[143,135],[404,117],[909,132],[1191,147]]){
   const lamp=scene.add.image(x,y,'reboot-props',4).setOrigin(.5,1).setDepth(-3);
   this.lamps.push(lamp);
  }
  // Close silhouettes frame the ceiling; leave the feet and combat plane unobscured.
  scene.add.image(-14,36,'reboot-props',3).setOrigin(0).setDepth(17).setScrollFactor(1.08).setTint(0x344149);
  scene.add.image(1015,15,'reboot-props',3).setOrigin(0).setDepth(17).setScrollFactor(1.08).setFlipX(true).setTint(0x344149);
  this.signal=scene.add.graphics().setDepth(4);
 }
 update(dt:number,_effects:PixelEffects,powered:boolean){
  this.clock+=dt;
  this.lamps.forEach((s,i)=>s.setAlpha(.93+Math.sin(this.clock*3+i*7)*.05));
  // Functional feedback, intentionally much quieter than the characters and fire.
  const g=this.signal.clear();
  g.fillStyle(powered?0x91e8cc:0x309391).fillRect(477,188,12,1);
  if(powered)g.fillStyle(0xc8ffdf).fillRect(478+Math.floor(this.clock*12)%10,191,2,1);
 }
}

/** Select a 16px piece of a 128x64px authored material panel and its exposed edges. */
export function rebootTile(material:number,x:number,y:number,edges=0){
 const panel=material===8?0:[6,7,10,11].includes(material)?2:material===9?3:1;
 // Steel uses its horizontal beam row on thin platforms, preserving a readable top.
 const row=panel===2?0:panel===3?Math.max(0,y-18)%4:y%4;
 return 12+edges*128+panel*32+row*8+x%8;
}
