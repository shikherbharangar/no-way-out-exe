import Phaser from 'phaser';
import type { Simulation } from './simulation';

type Fragment = { image: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; spin: number; life: number; material: number };
type Cloud = { image: Phaser.GameObjects.Image; x: number; y: number; age: number; duration: number; drift: number; scale: number; steam: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: number };

/** Cosmetic effects only. No client-side mutation of the authoritative world. */
export class PixelEffects {
 fragments: Fragment[] = []; clouds: Cloud[] = []; sparks: Spark[] = [];
 scorch: { x: number; y: number; life: number; radius: number }[] = [];
 private glow: {x:number;y:number;life:number;radius:number}[] = [];
 readonly ink: Phaser.GameObjects.Graphics;
 readonly residue: Phaser.GameObjects.Graphics;
 readonly light: Phaser.GameObjects.Graphics;
 constructor(private scene: Phaser.Scene) {
  this.ink = scene.add.graphics().setDepth(14);
  this.residue = scene.add.graphics().setDepth(1);
  this.light = scene.add.graphics().setDepth(11).setBlendMode(Phaser.BlendModes.ADD);
 }
 fracture(x: number, y: number, tile: number, originX: number, originY: number) {
  const material = tile === 7 || tile === 10 ? 1 : tile >= 3 && tile <= 5 ? 2 : 0;
  for (let i = 0; i < (material === 1 ? 2 : 3); i++) {
   if (this.fragments.length >= 150) this.fragments.shift()!.image.destroy();
   const angle = Math.atan2(y - originY - 10, x - originX) + (Math.random() - .5) * 1.1;
   const speed = 65 + Math.random() * 140;
   const image = this.scene.add.image(x + (i - 1) * 4, y, 'debris', material * 4 + Math.floor(Math.random() * 4)).setDepth(9);
   image.setScale(i === 0 ? .75 : .5);
   this.fragments.push({ image, x: image.x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 90, spin: (Math.random() - .5) * 9, life: 1.4 + Math.random() * 1.4, material });
  }
  if (this.clouds.length < 40) this.cloud(x, y, .45, .8, false);
 }
 cloud(x: number, y: number, scale = 1, duration = 1.5, steam = false) {
  if (this.clouds.length > 55) this.clouds.shift()!.image.destroy();
  const image = this.scene.add.image(x, y, 'smoke', 0).setDepth(steam ? -1 : 8).setScale(scale);
  if (steam) image.setTint(0x759bb0);
  this.clouds.push({image,x,y,age:0,duration,drift:(Math.random()-.5)*22,scale,steam});
 }
 burst(x: number, y: number, amount: number, color = 0xffd77a, power = 1) {
  for (let i = 0; i < amount; i++) {
   const a = Math.random() * Math.PI * 2, speed = (60 + Math.random() * 220) * power;
   this.sparks.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-60,life:.2+Math.random()*.65,color:i%4===0?0xffffff:color});
  }
  if (this.sparks.length > 260) this.sparks.splice(0, this.sparks.length - 260);
 }
 blast(x: number, y: number, power: number) {
  const fire = this.scene.add.sprite(x, y - 6, 'explosion').setDepth(12).setScale(Math.max(.8,power)).play('boom');
  fire.once('animationcomplete', () => fire.destroy());
  for (let i=0;i<5;i++) this.cloud(x+(i-2)*14*power,y-12-(i%2)*16,.8+power*.4,1.1+i*.19);
  this.burst(x,y,40,0xffb04b,power);
  this.glow.push({x,y,life:.17,radius:72*power});
  this.scorch.push({x,y,life:7,radius:36*power});
  if(this.scorch.length>12)this.scorch.shift();
 }
 impact(x:number,y:number,direction:number,color=0xffe1a0) {
  const slash=this.scene.add.sprite(x,y,'impact').setFlipX(direction<0).setDepth(13).play('impact');
  slash.once('animationcomplete',()=>slash.destroy());this.burst(x,y,12,color,.7);
 }
 clear() {
  this.fragments.forEach(f=>f.image.destroy());this.clouds.forEach(c=>c.image.destroy());
  this.fragments=[];this.clouds=[];this.sparks=[];this.scorch=[];this.glow=[];
  this.ink.clear();this.residue.clear();this.light.clear();
 }
 update(dt: number, sim: Simulation) {
  this.ink.clear();this.residue.clear();this.light.clear();
  for(const f of this.fragments) {
   f.life-=dt;f.x+=f.vx*dt;const dy=f.vy*dt;f.y+=dy;
   if(f.vy>0 && sim.solid(f.x,f.y)) {f.y-=dy;f.vy*=-.33;f.vx*=.68;f.spin*=.6;}
   f.vy+=390*dt;
   f.image.setPosition(Math.round(f.x),Math.round(f.y)).setRotation(Math.round((f.image.rotation+f.spin*dt)*32)/32).setAlpha(Math.min(1,f.life*2));
   if(f.life<=0)f.image.destroy();
  }
  this.fragments=this.fragments.filter(f=>f.life>0);
  for(const c of this.clouds) {
   c.age+=dt;c.x+=c.drift*dt;c.y-=(c.steam?18:11)*dt;
   const progress=c.age/c.duration;
   c.image.setPosition(Math.round(c.x),Math.round(c.y)).setFrame(Math.min(11,Math.floor(progress*12)))
    .setAlpha((c.steam?.25:.8)*Math.min(1,progress*10)*Math.max(0,1-progress)).setScale(c.scale);
   if(progress>=1)c.image.destroy();
  }
  this.clouds=this.clouds.filter(c=>c.age<c.duration);
  for(const s of this.sparks) {
   s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=220*dt;
   this.ink.lineStyle(1,s.color,Math.min(1,s.life*4)).lineBetween(Math.round(s.x),Math.round(s.y),Math.round(s.x-s.vx*.022),Math.round(s.y-s.vy*.022));
   this.ink.fillStyle(0xfff3c1,Math.min(1,s.life*3)).fillRect(Math.round(s.x),Math.round(s.y),2,1);
  }
  this.sparks=this.sparks.filter(s=>s.life>0);
  for(const s of this.scorch) {
   s.life-=dt;this.residue.fillStyle(0x080b14,Math.min(.65,s.life*.15));
   for(let i=0;i<9;i++) {const a=i*2.4;const x=Math.round(s.x+Math.cos(a)*s.radius*.45),y=Math.round(s.y+Math.sin(a)*s.radius*.3);this.residue.fillRect(x-10,y-7,20,14);}
  }
  this.scorch=this.scorch.filter(s=>s.life>0);
  for(const f of this.glow) {
   f.life-=dt;const r=f.radius;
   for(let i=0;i<4;i++){this.light.fillStyle(0xffa84c,Math.max(0,f.life)*.25).fillRoundedRect(Math.round(f.x-r+i*9),Math.round(f.y-r+i*9),Math.round((r-i*9)*2),Math.round((r-i*9)*2),12);}
  }
  this.glow=this.glow.filter(f=>f.life>0);
 }
}
