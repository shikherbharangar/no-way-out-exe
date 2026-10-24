import type Phaser from 'phaser';
import type { Player, Simulation } from './simulation';
export type ArtFrame={atlas_x:number;atlas_y:number;frame_width:number;frame_height:number;anchor:[number,number];sourceFacing:number;index:number};
export type ArtMetadata={scale:number;groups:Record<string,Record<string,ArtFrame>>};
export const ART_GROUPS=['zip','brick','enemies','pickups','props'] as const;
export const GUARD_POSES=['guard','shotgunner','sniper','heavy_trooper'];
/** Named, variable-sized atlas frames. Source pixels and physics are independent. */
export class SuppliedArt {
 readonly meta:ArtMetadata;
 constructor(scene:Phaser.Scene){
  this.meta=scene.cache.json.get('supplied-metadata');
  for(const group of ART_GROUPS){
   const texture=scene.textures.get('supplied-'+group);
   for(const [name,f] of Object.entries(this.meta.groups[group]))texture.add(name,0,f.atlas_x,f.atlas_y,f.frame_width,f.frame_height);
  }
 }
 pose(sprite:Phaser.GameObjects.Sprite|Phaser.GameObjects.Image,group:string,name:string,x:number,y:number,facing=1){
  const f=this.meta.groups[group][name],flip=facing!==f.sourceFacing;
  // Phaser mirrors about its display origin; reflect the measured anchor too.
  sprite.setTexture('supplied-'+group,name).setScale(this.meta.scale).setFlipX(flip)
   .setOrigin((flip?f.frame_width-f.anchor[0]:f.anchor[0])/f.frame_width,f.anchor[1]/f.frame_height)
   .setPosition(Math.round(x),Math.round(y));
 }
}
/** One supplied key pose per action, explicitly held; no invented run in-betweens. */
export function heroPose(p:Player,sim:Simulation){
 if(p.ghost)return 'death';
 if(p.hurt>.9)return 'hurt';
 if(p.reviving>0)return p.id?'shield':'hack'; // supplied pack has no revival key
 if(p.id===0){
  if(!p.grounded&&Math.abs(p.vx)>220)return 'dash';
  if(p.action>0)return sim.sector===1&&sim.plate&&Math.abs(p.x-487)<32?'hack':'shoot';
  if(!p.grounded)return p.wall?'wall_jump':p.vy<0?'jump':'fall';
 }else{
  if(p.action>0)return p.windup>0?'charge':p.charge>0?'special':'punch';
  if(p.shield>0&&p.grounded&&Math.abs(p.vx)<=15)return 'shield';
  if(!p.grounded)return p.vy<0?'jump':'fall';
 }
 if(p.landed>0)return 'idle'; // missing landing key: no synthetic squash
 return Math.abs(p.vx)>15?'run':'idle';
}
