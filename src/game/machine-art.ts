import Phaser from 'phaser';
import { crusherBottom } from './machine';
import type { Simulation } from './simulation';
import type { PixelEffects } from './pixel-effects';
/** Original machinery assets at native pixel scale. Collision lives in the shared simulation. */
export class MachineArt {
 objects:Phaser.GameObjects.GameObject[]=[];
 ink:Phaser.GameObjects.Graphics; mid:Phaser.GameObjects.Graphics;
 cage:Phaser.GameObjects.Image; wheel:Phaser.GameObjects.Image; receiver:Phaser.GameObjects.Image;
 crusher:Phaser.GameObjects.Image; shuttle:Phaser.GameObjects.Image; boss:Phaser.GameObjects.Image;
 labels:Phaser.GameObjects.Text[]=[];lastDialogue=-1;steam=0;
 constructor(private scene:Phaser.Scene){
  const before=new Set(scene.children.list);
  scene.add.image(0,0,'machine-depth').setOrigin(0).setScrollFactor(.18,.25).setDepth(-22);
  this.mid=scene.add.graphics().setDepth(-14).setScrollFactor(.65,.8);
  for(const [x,y] of [[166,122],[551,188],[924,108],[1240,212]]){
   this.mid.lineStyle(5,0x142c34).lineBetween(x,y,x+106,y+154);
   this.mid.lineStyle(1,0x4b5f52).lineBetween(x+3,y,x+109,y+154);
   this.mid.lineStyle(2,0x2a4245).lineBetween(x+78,y-60,x+78,y+201);
  }
  scene.add.image(0,0,'machine-composition').setOrigin(0).setDepth(-8);
  scene.add.image(0,0,'machine-foreground').setOrigin(0).setDepth(16);
  this.ink=scene.add.graphics().setDepth(5);
  const prop=(x:number,y:number,frame:number,depth=4)=>scene.add.image(x,y,'machine-props',frame).setOrigin(.5,1).setDepth(depth);
  this.cage=prop(216,572,0);this.wheel=prop(326,368,1);this.receiver=prop(464,398,2);
  this.crusher=prop(682,344,3);this.shuttle=prop(768,428,4);this.boss=prop(1092,462,5,1);
  const label=(x:number,y:number,t:string,c='#abc2a8')=>{
   const text=scene.add.text(x,y,t,{fontFamily:'monospace',fontSize:'6px',color:c,stroke:'#07131d',strokeThickness:2,align:'center'}).setOrigin(.5).setDepth(8);this.labels.push(text);return text;
  };
  label(216,592,'BRICK: BRAKE   /   ZIP: MOTOR\nBOTH HOLD INTERACT');
  label(326,399,'BRACE THE FLYWHEEL','#efc47d');label(461,302,'ZIP: SHOOT RECEIVER','#a9fbe3');
  label(544,392,'LINK BRIDGE');label(984,456,'BRICK: FACE RAM + BRACE','#efc47d');
  label(1080,478,'ZIP: SHOOT EXPOSED CORE','#a9fbe3');label(488,515,'HOLD INTERACT\nTO CLIMB');label(872,530,'SERVICE LADDER');
  this.objects=scene.children.list.filter(o=>!before.has(o));this.visible(false);
 }
 visible(on:boolean){for(const o of this.objects)(o as Phaser.GameObjects.Image).setVisible(on);}
 update(dt:number,s:Simulation,effects:PixelEffects){
  const m=s.machine;if(!m)return;
  const g=this.ink.clear(),t=m.age;
  this.cage.y=Math.round(m.liftY)+12;this.shuttle.setPosition(Math.round(m.platformX)+24,428);
  this.crusher.setPosition(m.layout.crusherX,Math.round(crusherBottom(m)));
  this.boss.setFrame(m.bossHp===0?7:m.bossPhase==='caught'?6:5);
  if(m.bossHit>0&&Math.floor(t*30)%2)this.boss.setTintFill(0xfff5c3);else this.boss.clearTint();
  // Suspension cables and a counterweight travelling opposite to the cage.
  for(const x of [178,250]){g.lineStyle(1,0xb4b38b).lineBetween(x,80,x,m.liftY-56);}
  const weightY=150+(560-m.liftY)*.7;
  g.fillStyle(0x122b33).fillRect(156,weightY,17,64);g.fillStyle(0x6a7b69).fillRect(158,weightY+2,12,59);
  for(let y=weightY+6;y<weightY+61;y+=12)g.fillStyle(0x223f43).fillRect(158,y,12,3);
  g.fillStyle(0xf2c779).fillRect(185,m.liftY-3,24,2);g.fillStyle(0x9cebd9).fillRect(223,m.liftY-3,24,2);
  // A breathing coil and actual receiver state, not decorative progress.
  const charged=m.relay||m.relayCharge>0;
  this.receiver.setTint(charged?0xc4ffe5:0x889e85);
  g.fillStyle(charged?0x91ffe0:0x82764f,.16).fillRect(436,328,54,40);
  for(let i=0;i<2;i++)g.fillStyle(m.relayCharge>i?0xb3ffe0:0x304b49).fillRect(451+i*13,375,8,3);
  const braced=s.players[1].shield>0&&Math.abs(s.players[1].x-326)<24;
  if(braced){g.lineStyle(1,0xd5edb5).strokeCircle(326,326,15);g.fillStyle(0xafd2a0,.12).fillRect(305,308,42,44);}
  // Laser barrier has a bold white core and rectangular spill on nearby surfaces.
  if(!m.relay){
   g.fillStyle(0xf46957,.08).fillRect(487,0,37,559);
   for(let y=0;y<558;y+=9){g.fillStyle(0xff705a).fillRect(502,y,3,7);g.fillStyle(0xffeac1).fillRect(503,y,1,6);}
   if(s.players.some(p=>Math.abs(p.x-502)<16))effects.burst(501,350,2,0xffd38d,.4);
  }else{
   g.fillStyle(0x264a4c).fillRect(512,368,64,8);g.fillStyle(0xb9d9b1).fillRect(512,368,64,1);
   for(let x=516;x<575;x+=12){g.fillStyle(0x91cab0).fillRect(x,371,5,2);}
  }
  // Ladders are solidly mounted to indestructible foundations; recovery routes stay readable.
  for(const [x,top] of [[488,368],[872,432]]){
   g.lineStyle(2,0x6d8b7a).lineBetween(x-7,top-10,x-7,558).lineBetween(x+7,top-10,x+7,558);
   for(let y=top-6;y<560;y+=12)g.lineStyle(1,0xc1b686).lineBetween(x-7,y,x+7,y);
  }
  // Telegraph the trap before its first strike; chase wall tears the service line behind you.
  if(m.trap>=0&&!m.chaseDone){
   const x=Math.round(m.chaseX);g.fillStyle(0x08121a).fillRect(x-28,282,28,278);g.fillStyle(0x7a5340).fillRect(x-8,282,7,278);
   for(let y=288;y<558;y+=16){g.fillStyle(0xf4b86b).fillTriangle(x,y,x+10,y+7,x,y+14);}
   if(m.trap<1.5||((m.trap-1.5)%3.4)<1.4){g.fillStyle(0xff7352,.13).fillRect(m.layout.crusherX-27,350,54,82);}
  }
  // The ram reaches BRICK's catch mark; the vulnerable core remains a separate readable target.
  if(m.bossPhase!=='sleep'&&m.bossPhase!=='dead'){
   const caught=m.bossPhase==='caught',slam=m.bossPhase==='slam';
   const head=caught?1006:slam?966:1058+Math.round(Math.sin(t*8)*2);
   g.fillStyle(0x0d232e).fillRect(head,390,1091-head,29);g.fillStyle(0x6e9281).fillRect(head,395,1091-head,6);
   for(let x=head+7;x<1087;x+=12){g.fillStyle(0xb3c5a0).fillRect(x,395,2,5);g.fillStyle(0x365752).fillRect(x,404,6,9);}
   g.fillStyle(0x193943).fillRect(head-9,383,15,42);g.fillStyle(caught?0xa7f7dc:0xd1b675).fillRect(head-9,385,3,37);
   if(caught){g.lineStyle(1,0xa0ffe5).strokePoints([{x:984,y:399},{x:1000,y:390},{x:995,y:411},{x:1008,y:418}]);}
   else if(m.bossPhase==='windup'&&m.bossTimer<.8){g.fillStyle(0xff7857,.14).fillRect(945,410,145,22);}
   for(let i=0;i<6;i++)g.fillStyle(m.bossHp>i?0xe2be71:0x253d40).fillRect(1055+i*12,306,9,3);
  }
  if(m.bossHp>0){g.fillStyle(0x143039).fillRect(1152,0,16,432);for(let y=5;y<431;y+=13)g.fillStyle(0xac9868).fillRect(1155,y,10,3);}
  this.steam+=dt;if(this.steam>.55){this.steam=0;effects.cloud(m.chaseDone?1112:432,m.chaseDone?282:249,.34,.8,true);}
 }
 hint(s:Simulation):string{
  const m=s.machine!;
  if(!m.liftSolved)return 'CAGE: BRICK ON AMBER / ZIP ON CYAN / BOTH HOLD INTERACT';
  if(!m.relay)return 'BRICK BRACES THE FLYWHEEL. ZIP SHOOTS THE RECEIVER TWICE.';
  if(!m.chaseDone)return m.trap>=0?'WARDEN.exe: "EXIT WAS A TYPO."  KEEP MOVING!':'TRANSFER LINE / STAY TOGETHER';
  if(m.bossHp>0)return m.bossPhase==='caught'?'RAM HELD! ZIP: SHOOT THE OPEN CORE!':'BRICK: FACE RIGHT + BRACE ON AMBER. ZIP: GET PAST THE RAM.';
  return 'ZIP: "Those batteries have names."  BRICK: "Then we get them out."';
 }
}
