import Phaser from 'phaser';
import type { Simulation } from './simulation';

type Fragment = { image: Phaser.GameObjects.Image; x: number; y: number; vx: number; vy: number; spin: number; life: number; material: number; delay: number };
type Cloud = { image: Phaser.GameObjects.Image; x: number; y: number; age: number; duration: number; drift: number; scale: number; steam: boolean };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: number };

/** Cosmetic effects only. No client-side mutation of the authoritative world. */
export class PixelEffects {
 fragments: Fragment[] = []; clouds: Cloud[] = []; sparks: Spark[] = [];
 scorch: { x: number; y: number; life: number; radius: number }[] = [];
 private glow: {x:number;y:number;life:number;radius:number;color:number}[] = [];
 private arcs: {x:number;y:number;radius:number;life:number}[]=[];
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
   image.setScale(1).setVisible(i===0);
   this.fragments.push({ image, x: image.x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 90, spin: (Math.random() - .5) * 9, life: 1.4 + Math.random() * 1.4, material, delay:i*.026 });
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
 electric(x:number,y:number,radius:number) {
  this.arcs.push({x,y,radius,life:.28});this.burst(x,y,10,0x91fff0,.55);
  this.glow.push({x,y,life:.2,radius:radius*1.7,color:0x42c5e9});
 }
 muzzle(x:number,y:number,direction:number) {
  this.burst(x,y,4,0xffc780,.3);
  this.glow.push({x:x+direction*9,y,life:.07,radius:26,color:0xffba62});
  this.impact(x,y,direction,0xffd897,.3);
 }
 blast(x: number, y: number, power: number, material='fuel', direction=0) {
  if(material==='fuel'){
   const fire=this.scene.add.sprite(x,y-6,'explosion').setDepth(12).setScale(power).setFlipX(direction<0).play('boom');
   fire.once('animationcomplete',()=>fire.destroy());
   // Each cloud emerges on a different beat as the flame tears apart.
   for(let i=0;i<4;i++){this.cloud(x+(i-1)*16*power,y-18-i*8,.8+power*.3,1.5+i*.15);this.clouds[this.clouds.length-1].age=-i*.065;}
   this.burst(x,y,26,0xffb04b,power);
   this.glow.push({x,y,life:.24,radius:94*power,color:0xffa54e});
  }else{
   this.impact(x,y,direction||1,material==='steel'?0xafffea:0xffe3aa);
   for(let i=0;i<3;i++){this.cloud(x+(i-1)*18,y-4-i*8,.65+power*.12,.75+i*.17);if(material==='concrete')this.clouds[this.clouds.length-1].image.setTint(0xc6ac7a);}
   this.burst(x,y,14,material==='steel'?0x9cfff2:0xe6c98e,.8);
   this.glow.push({x,y,life:.13,radius:50*power,color:material==='steel'?0x4eddd4:0xffcf8c});
   if(material==='steel')this.electric(x,y,55);
  }
  this.scorch.push({x,y,life:7,radius:36*power});
  if(this.scorch.length>12)this.scorch.shift();
 }
 impact(x:number,y:number,direction:number,color=0xffe1a0,scale=1) {
  const slash=this.scene.add.sprite(x,y,'impact').setFlipX(direction<0).setScale(scale).setDepth(13).play('impact');
  slash.once('animationcomplete',()=>slash.destroy());this.burst(x,y,12,color,.7);
 }
 clear() {
  this.fragments.forEach(f=>f.image.destroy());this.clouds.forEach(c=>c.image.destroy());
  this.fragments=[];this.clouds=[];this.sparks=[];this.scorch=[];this.glow=[];this.arcs=[];
  this.ink.clear();this.residue.clear();this.light.clear();
 }
 update(dt: number, sim: Simulation) {
  this.ink.clear();this.residue.clear();this.light.clear();
  for(const f of this.fragments) {
   f.delay-=dt;if(f.delay>0)continue;f.image.setVisible(true);
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
   if(progress<0){c.image.setVisible(false);continue;}c.image.setVisible(true);
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
  for(const a of this.arcs){
   a.life-=dt;
   for(let branch=0;branch<6;branch++){
    const angle=branch*1.047+Math.floor(a.life*30)*.25;
    const points=Array.from({length:6},(_,i)=>({x:Math.round(a.x+Math.cos(angle)*i*a.radius/6+(i%2?3:-3)),y:Math.round(a.y+Math.sin(angle)*i*a.radius/6+(i%2?-4:2))}));
    this.ink.lineStyle(1,0xc9ffea,Math.min(1,a.life*8)).strokePoints(points);
   }
  }
  this.arcs=this.arcs.filter(a=>a.life>0);
  for(const f of this.glow) {
   f.life-=dt;const r=f.radius;
   // Stepped light spill illuminates silhouettes without a smooth radial particle.
   for(let i=0;i<3;i++){
    const rr=r-i*17,xx=Math.round(f.x),yy=Math.round(f.y);
    if(rr<=0)continue;
    this.light.fillStyle(f.color,Math.max(0,f.life)*.33).fillPoints([{x:xx-rr,y:yy-rr*.4},{x:xx-rr*.6,y:yy-rr*.8},{x:xx+rr*.4,y:yy-rr},{x:xx+rr,y:yy-rr*.5},{x:xx+rr,y:yy+rr*.4},{x:xx+rr*.5,y:yy+rr*.7},{x:xx-rr*.6,y:yy+rr*.6}],true);
   }
  }
  this.glow=this.glow.filter(f=>f.life>0);
 }
}
