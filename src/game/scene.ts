import Phaser from 'phaser';
import { Simulation, COLS, TILE, WORLD_W, idleInput, type Input, type GameEvent } from './simulation';
import { Sound } from './audio';
import { PixelEffects } from './pixel-effects';
import { MachineArt } from './machine-art';
import { PrisonArt } from './prison-art';
import { SuppliedArt, ART_GROUPS, GUARD_POSES, heroPose } from './supplied-art';
import { RESCUE_CAGE } from './simulation';
export type Binding = { left: string; right: string; jump: string; interact: string; special: string };
export const defaults: Binding[] = [
 { left: 'KeyA', right: 'KeyD', jump: 'Space', interact: 'KeyF', special: 'KeyG' },
 { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ShiftRight', interact: 'Enter', special: 'ControlRight' },
];
export class PrisonScene extends Phaser.Scene {
 sim = new Simulation(); sfx = new Sound(); activeRun = false; pausedRun = false; online = false; localSlot = 0;
 networkStep?: (input: Input) => void; onWin?: () => void; onPause?: () => void;
 keys = new Set<string>(); pressed = new Set<string>(); bindings: Binding[] = structuredClone(defaults);
 sprites!: Phaser.GameObjects.Sprite[]; guardSprites!: Phaser.GameObjects.Sprite[]; barrelSprites!: Phaser.GameObjects.Image[];
 terrainLayer!: Phaser.Tilemaps.TilemapLayer; previousTerrain: number[] = [];
 supplied!:SuppliedArt; rescueCage!:Phaser.GameObjects.Image; checkpointFlag!:Phaser.GameObjects.Image; rescueHint!:Phaser.GameObjects.Text; rescueVisual=0;
 effects!: PixelEffects; scenery!: PrisonArt; machineArt!:MachineArt;
 sectorOneObjects:Phaser.GameObjects.GameObject[]=[];displaySector=1;
 fx!: Phaser.GameObjects.Graphics; link!: Phaser.GameObjects.Graphics; edges!: Phaser.GameObjects.Graphics;
 gateGraphics!: Phaser.GameObjects.Graphics; hud!: Phaser.GameObjects.Graphics;
 names!: Phaser.GameObjects.Text[]; objective!: Phaser.GameObjects.Text; dialog!: Phaser.GameObjects.Text; hackLabel!: Phaser.GameObjects.Text;
 portraits: Phaser.GameObjects.Image[]=[]; healthLabels:Phaser.GameObjects.Text[]=[];
 lastEvent = 0; accumulator = 0; freeze = 0; elapsedVisual = 0; winSent = false;
 private stride=[0,0];private guardHp=[2,2,2,2];private guardReaction=[0,0,0,0];private lastHint='';private hintUntil=0;private shotTrail=0;
 constructor() { super('prison'); }
 preload() {
  for (const key of ['far', 'mid', 'fan','zip-portrait','brick-portrait','prison-composition','machine-composition','machine-foreground','machine-depth']) this.load.image(key, `/assets/${key}.png`);
  for(const group of ART_GROUPS)this.load.image('supplied-'+group,`/assets/supplied/${group}.png`);
  this.load.json('supplied-metadata','/assets/supplied/runtime.json');
  this.load.spritesheet('props', '/assets/props.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('explosion', '/assets/explosion.png', { frameWidth: 128, frameHeight: 128 });
  this.load.spritesheet('smoke', '/assets/smoke.png', { frameWidth: 96, frameHeight: 96 });
  this.load.spritesheet('debris', '/assets/debris.png', { frameWidth: 16, frameHeight: 16 });
  this.load.spritesheet('impact', '/assets/impact.png', { frameWidth: 64, frameHeight: 64 });
  this.load.spritesheet('machine-props','/assets/machine-props.png',{frameWidth:96,frameHeight:96});
  this.load.image('tiles', '/assets/tiles.png');
 }
 create() {
  this.supplied=new SuppliedArt(this);
  this.cameras.main.setBackgroundColor('#080f1c').setRoundPixels(true).setBounds(0, 0, WORLD_W, 360);
  this.add.image(0, 0, 'far').setOrigin(0).setScrollFactor(.16).setDepth(-20);
  this.add.image(0, 0, 'mid').setOrigin(0).setScrollFactor(.6).setDepth(-15);
  this.add.image(0,0,'prison-composition').setOrigin(0).setDepth(-8);
  this.scenery=new PrisonArt(this);
  this.sectorOneObjects=this.children.list.slice();
  this.effects=new PixelEffects(this);
  this.machineArt=new MachineArt(this);
  const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: COLS, height: 40 });
  const tiles = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
  this.terrainLayer = map.createBlankLayer('destructible', tiles, 0, 0)!.setDepth(2);
  this.edges=this.add.graphics().setDepth(3);
  this.syncTerrain();
  this.barrelSprites = this.sim.barrels.map(b => this.add.image(b.x, b.y, 'props', 0).setOrigin(.5, 1).setDepth(4));
  const beforeProps=new Set(this.children.list);
  const terminal=this.add.image(487,224,'supplied-props','terminal').setDepth(3);this.supplied.pose(terminal,'props','terminal',487,224);
  this.add.image(110, 288, 'props', 8).setOrigin(.5, 1).setDepth(-1).setTint(0x7b8d98);
  this.add.image(548, 177, 'props', 9).setOrigin(.5, 1).setDepth(0);
  this.add.image(645, 273, 'props', 7).setOrigin(.5, 1).setDepth(0);
  for (const x of [287, 790, 945]) this.add.image(x, 211, 'props', 4).setDepth(-1).setTint(0xa9a7a1);
  for (const x of [590, 1159]) this.add.image(x, 153, 'props', 5).setDepth(0);
  this.sectorOneObjects.push(...this.children.list.filter(o=>!beforeProps.has(o)));
  this.rescueCage=this.add.image(RESCUE_CAGE.x,RESCUE_CAGE.y,'supplied-props','rescue_cage').setDepth(3);
  this.checkpointFlag=this.add.image(690,288,'supplied-props','checkpoint_flag').setDepth(0);
  this.rescueHint=this.text(RESCUE_CAGE.x,166,'HOLD INTERACT / RESCUE','#b8fff0',6).setOrigin(.5).setDepth(12);
  this.sectorOneObjects.push(this.rescueCage,this.checkpointFlag,this.rescueHint);
  this.link = this.add.graphics().setDepth(6); this.gateGraphics = this.add.graphics().setDepth(5);
  this.sprites = ['zip', 'brick'].map(key => this.add.sprite(0, 0, 'supplied-'+key,'idle').setOrigin(.5, 1).setDepth(7));
  this.guardSprites = this.sim.guards.map((_,i) => this.add.sprite(0, 0, 'supplied-enemies',GUARD_POSES[i%4]).setOrigin(.5, 1).setDepth(6));
  this.fx=this.add.graphics().setDepth(10);
  this.anims.create({ key: 'boom', frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 17 }), frameRate: 28, repeat: 0, hideOnComplete: true });
  this.anims.create({ key: 'impact', frames: this.anims.generateFrameNumbers('impact', { start: 0, end: 5 }), frameRate: 35, repeat: 0, hideOnComplete: true });
  this.names = this.sprites.map((_, i) => this.text(0, 0, i ? '2' : '1', i ? '#ffba68' : '#83fff3', 6).setDepth(12).setOrigin(.5));
  this.hackLabel = this.text(487, 132, '', '#91f3ec', 7).setOrigin(.5);
  this.sectorOneObjects.push(this.text(864, 248, 'CAUTION: LOAD LIMIT', '#c8995c', 6).setOrigin(.5));
  this.sectorOneObjects.push(this.text(1193, 195, 'FREIGHT 04', '#8a9caa', 7).setOrigin(.5));
  this.hud = this.add.graphics().setScrollFactor(0).setDepth(29);
  this.objective = this.text(320, 15, '', '#859aa9', 7).setOrigin(.5).setScrollFactor(0).setDepth(30);
  this.dialog = this.text(320, 329, '', '#f7d6a0', 8).setOrigin(.5).setScrollFactor(0).setDepth(30);
  this.portraits=['zip','brick'].map((key,i)=>this.add.image(i?520:25,23,'supplied-'+key,'idle').setScale(.5).setOrigin(.5,.5).setScrollFactor(0).setDepth(31));
  this.healthLabels=[this.text(47,9,'ZIP','#9efff0',7),this.text(542,9,'BRICK','#ffc27b',7)];
  this.healthLabels.forEach(t=>t.setScrollFactor(0).setDepth(31));
  window.addEventListener('keydown', (e: KeyboardEvent) => {
   if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
   if (!this.keys.has(e.code)) this.pressed.add(e.code);
   this.keys.add(e.code);
   if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'ShiftRight', 'ControlRight'].includes(e.code)) e.preventDefault();
   if (e.code === 'Escape' && !e.repeat && this.activeRun) this.onPause?.();
  });
  window.addEventListener('keyup', (e: KeyboardEvent) => this.keys.delete(e.code));
  window.addEventListener('blur', () => { this.keys.clear(); this.pressed.clear(); if (this.activeRun && !this.online && !this.pausedRun) this.onPause?.(); });
  try { const stored = localStorage.getItem('nwo-bindings'); if (stored) this.bindings = JSON.parse(stored); } catch { /* use defaults */ }
  this.game.events.emit('prison-ready', this);
 }
 text(x:number,y:number,value:string,color:string,size=8) {return this.add.text(x,y,value,{fontFamily:'monospace',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#060e1b',strokeThickness:2,padding:{x:2,y:2}}).setDepth(3);}
 start(online=false,slot=0,seed=2026) {
  this.sim=new Simulation(seed);this.previousTerrain=[];this.lastEvent=0;this.activeRun=true;this.pausedRun=false;this.online=online;this.localSlot=slot;this.winSent=false;this.accumulator=0;
  this.effects.clear();this.rescueVisual=0;this.keys.clear();this.pressed.clear();this.stride=[0,0];this.guardHp=[2,2,2,2];this.guardReaction=[0,0,0,0];this.lastHint='';this.hintUntil=0;
  this.sfx.unlock();this.cameras.main.fadeIn(350,6,12,22);
 }
 readInputs(): Input[] {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  return this.bindings.map((b, i) => {
   const pad = pads[i]; const axis = pad?.axes[0] ?? 0; const down = (n: number) => !!pad?.buttons[n]?.pressed;
   return { left: this.keys.has(b.left) || axis < -.25 || down(14), right: this.keys.has(b.right) || axis > .25 || down(15), jump: this.keys.has(b.jump) || this.pressed.has(b.jump) || this.keys.has(i ? 'ArrowUp' : 'KeyW') || down(0), interact: this.keys.has(b.interact) || down(2), special: this.keys.has(b.special) || this.pressed.has(b.special) || down(1) };
  });
 }
 syncSector(){
  if(this.displaySector===this.sim.sector)return;
  this.displaySector=this.sim.sector;const machine=this.displaySector===2;
  this.sectorOneObjects.forEach(o=>(o as Phaser.GameObjects.Image).setVisible(!machine));this.machineArt.visible(machine);
  this.terrainLayer.fill(-1);this.previousTerrain=[];this.effects.clear();this.gateGraphics.clear();this.hackLabel.setVisible(false);
  this.barrelSprites.forEach(s=>s.destroy());this.barrelSprites=this.sim.barrels.map(b=>this.add.image(b.x,b.y,'props',0).setOrigin(.5,1).setDepth(4));
  this.guardSprites.forEach(s=>s.destroy());this.guardSprites=this.sim.guards.map((_,i)=>this.add.sprite(0,0,'supplied-enemies',GUARD_POSES[i%4]).setOrigin(.5,1).setDepth(6));
  this.guardHp=this.sim.guards.map(g=>g.hp);this.guardReaction=this.sim.guards.map(()=>0);
  this.cameras.main.setBounds(0,0,WORLD_W,machine?640:360);this.cameras.main.scrollY=machine?280:0;
  this.winSent=false;this.machineArt.lastDialogue=-1;
  this.say(machine?'WARDEN.exe: "Your sentence powers the city."':'ZIP: "I have a plan."',4);
 }
 syncTerrain() {
  let changed=false;
  const blasts=this.sim.events.filter(e=>e.type==='blast'&&e.id>this.lastEvent);
  this.sim.terrain.forEach((tile,i)=>{
   if(this.previousTerrain[i]===tile)return;
   changed=true;const x=i%COLS,y=Math.floor(i/COLS),old=this.previousTerrain[i];
   if(tile<0){
    this.terrainLayer.removeTileAt(x,y);
    if(old>=0) {
     const origin=blasts.reduce<GameEvent|undefined>((near,e)=>!near||Math.hypot(e.x-x*TILE,e.y-y*TILE)<Math.hypot(near.x-x*TILE,near.y-y*TILE)?e:near,undefined);
     this.effects.fracture(x*TILE+8,y*TILE+8,old,origin?.x??x*TILE,origin?.y??y*TILE);
    }
   } else this.terrainLayer.putTileAt(tile,x,y);
  });
  this.previousTerrain=this.sim.terrain.slice();
  if(changed) {
   this.edges.clear();
   for(let y=1;y<this.sim.height/TILE;y++)for(let x=0;x<COLS;x++){
    const i=y*COLS+x,t=this.sim.terrain[i];if(t<0)continue;
    const metal=[6,7,10,11].includes(t),light=metal?0xa5c7d2:t===8?0xe8c17e:0xb6a07b;
    if(this.sim.terrain[i-COLS]<0)this.edges.fillStyle(light,.9).fillRect(x*16,y*16,16,1);
    if(x>0&&this.sim.terrain[i-1]<0){this.edges.fillStyle(0x080e1b,.7).fillRect(x*16,y*16+1,2,15);this.edges.fillStyle(light,.5).fillRect(x*16+2,y*16+3,1,4);}
    if(x<COLS-1&&this.sim.terrain[i+1]<0)this.edges.fillStyle(light,.65).fillRect(x*16+15,y*16+1,1,14);
   }
  }
 }
 event(e:GameEvent) {
  this.sfx.play(e.type==='rescue'?'revive':e.type);
  if(e.type==='rescue'){
   this.say('PRISONER EXTRACTED / +1 TEAM HEALTH',3);this.effects.burst(e.x,e.y,12,0x7cfff0,.4);
   const icon=this.add.image(e.x,e.y-20,'supplied-pickups','health').setDepth(13);
   this.tweens.add({targets:icon,y:icon.y-30,alpha:0,duration:1200,onComplete:()=>icon.destroy()});
  }
  if(e.type==='blast') {
   const power=e.power??1;this.effects.blast(e.x,e.y,power,e.material??'concrete',e.direction??0);this.cameras.main.shake(220,.008*Math.min(1.25,power),true);this.freeze=.055;
   const p=this.sim.players[1];if(Math.abs(p.x-e.x)<60)this.effects.impact(p.x+p.facing*23,p.y-25,p.facing);
  } else if(e.type==='death') {
   this.effects.burst(e.x,e.y,23,0xff9363,.8);this.effects.cloud(e.x,e.y,.65,1.3);this.cameras.main.shake(110,.004);
  } else if(e.type==='land') {
   this.effects.cloud(e.x-9,e.y,.42,.55);this.effects.cloud(e.x+9,e.y,.42,.55);
  } else if(e.type==='jump')this.effects.cloud(e.x,e.y,.36,.45);
  else if(e.type==='charge'){this.effects.electric(e.x,e.y,34);this.say('LINK OVERCHARGE / BRICK: MAKE IT COUNT.',2);}
  else if(e.type==='arc'||e.type==='deflect'){this.effects.electric(e.x,e.y,20);}
  else if(e.type==='shot'){this.effects.muzzle(e.x,e.y,e.power??1);}
  else if(e.type==='spark'){this.effects.burst(e.x,e.y,9,0x7ff4ff,.65);}
  else if(e.type==='hurt'){this.effects.burst(e.x,e.y,10,0xffc49a,.6);this.freeze=.025;}
  else if(e.type==='gate'||e.type==='checkpoint'||e.type==='revive'){
   this.effects.burst(e.x,e.y,20,0x7cffe1,.7);
   if(e.type==='gate'){this.cameras.main.shake(280,.003);this.say('WARDEN.exe: "That door was load-bearing."',4);}
   if(e.type==='checkpoint')this.say('CHECKPOINT  /  Two idiots accounted for.',3);
   if(e.type==='revive')this.say('ZIP: "Death looks terrible on you."',3);
  }
 }
 say(line:string,duration:number){this.lastHint=line;this.hintUntil=this.elapsedVisual+duration;}
 update(_time: number, ms: number) {
  if (!this.sprites) return;
  const dt = Math.min(ms / 1000, .05); this.elapsedVisual += dt;
  if (this.activeRun && this.online && this.pausedRun) this.networkStep?.(idleInput());
  if (this.activeRun && !this.pausedRun) {
   const inputs = this.readInputs();
   if (this.online) this.networkStep?.(inputs[0]);
   else if (this.freeze <= 0) {
    this.accumulator += dt;
    while (this.accumulator >= 1 / 60) { this.sim.step(inputs); this.accumulator -= 1 / 60; }
   }
  }
  if (this.online || (this.freeze <= 0 && this.accumulator < dt)) this.pressed.clear();
  this.freeze -= dt;
  this.syncSector();
  this.syncTerrain();
  for (const e of this.sim.events) if (e.id > this.lastEvent) { this.event(e); this.lastEvent = e.id; }
  if (this.sim.won && this.sim.sector===2 && !this.winSent) { this.winSent = true; this.time.delayedCall(700, () => this.onWin?.()); }
  this.drawWorld(dt);
 }
 drawWorld(dt:number) {
  const t=this.elapsedVisual,sim=this.sim;
  // Velocity look-ahead is capped by the space needed to keep both players in view.
  const mid=(sim.players[0].x+sim.players[1].x)/2;
  const lead=Phaser.Math.Clamp((sim.players[0].vx+sim.players[1].vx)*.07,-16,16);
  const target=this.activeRun?mid-320+lead:60;
  this.cameras.main.scrollX=Math.round(Phaser.Math.Linear(this.cameras.main.scrollX,Phaser.Math.Clamp(target,0,WORLD_W-640),1-Math.exp(-dt*7)));
  if(sim.machine){
   const vertical=(sim.players[0].y+sim.players[1].y)/2-230;
   this.cameras.main.scrollY=Math.round(Phaser.Math.Linear(this.cameras.main.scrollY,Phaser.Math.Clamp(vertical,0,280),1-Math.exp(-dt*5)));
   this.machineArt.update(dt,sim,this.effects);
   if(sim.machine.dialogue!==this.machineArt.lastDialogue){
    this.machineArt.lastDialogue=sim.machine.dialogue;
    const lines=['WARDEN.exe: "Your sentence powers the city."','ZIP: "That is a lot of batteries."','BRICK: "Those are prisoner numbers."','WARDEN.exe: "EXIT WAS A TYPO."','WARDEN.exe: "The heart needs two minds. Yours will do."','ZIP: "Those batteries have names."'];
    this.say(lines[sim.machine.dialogue],3.5);
   }
  }else this.scenery.update(dt,this.effects,sim.plate);
  this.barrelSprites.forEach((s,i)=>{const b=sim.barrels[i];s.setPosition(b.x,b.y).setVisible(b.alive);if(b.fuse>=0&&Math.floor(t*32)%2)s.setTintFill(0xffe5a0);else s.clearTint();});
  this.fx.clear();
  this.sprites.forEach((s,i)=>{
   const p=sim.players[i],running=Math.abs(p.vx)>15;
   this.stride[i]+=Math.abs(p.vx)*dt;
   const frame=heroPose(p,sim);
   const x=this.activeRun?this.online?Phaser.Math.Linear(s.x,p.x,Math.min(1,dt*24)):p.x:430+i*48;
   const y=this.activeRun?this.online?Phaser.Math.Linear(s.y+(p.ghost?14:0),p.y,Math.min(1,dt*24)):p.y:288;
   // Small contact shadows anchor the larger silhouettes to the surfaces.
   if(p.grounded)this.fx.fillStyle(0x050a16,.7).fillEllipse(Math.round(x),Math.round(y),i?31:23,5);
   this.supplied.pose(s,i?'brick':'zip',frame,x,y+(p.ghost?-14:0),p.facing);
   s.setAlpha(p.ghost?.48:p.hurt>0&&Math.floor(t*18)%2?.5:1);
   if(p.ghost)s.setTint(0x66eafa);else if(p.hurt>.94)s.setTintFill(0xffffff);else s.clearTint();
   this.names[i].setPosition(x,y-93).setVisible(this.activeRun&&(sim.elapsed<3||p.ghost)).setText(p.ghost?'REVIVE':i?'2':'1');
   // Electric afterimages use the actual moving character frame.
   if(i===0&&Math.abs(p.vx)>220&&t>this.shotTrail){
    this.shotTrail=t+.045;const trail=this.add.image(s.x-p.facing*7,s.y,s.texture.key,frame).setOrigin(s.originX,s.originY).setFlipX(s.flipX).setTintFill(0x43d8ec).setAlpha(.35).setDepth(5);
    this.tweens.add({targets:trail,alpha:0,duration:140,onComplete:()=>trail.destroy()});
   }
  });
  this.guardSprites.forEach((s,i)=>{
   const g=sim.guards[i];if(g.hp<this.guardHp[i])this.guardReaction[i]=.2;this.guardHp[i]=g.hp;this.guardReaction[i]=Math.max(0,this.guardReaction[i]-dt);
   this.supplied.pose(s,'enemies',GUARD_POSES[i%4],Math.round(g.x)+(this.guardReaction[i]>0?-g.direction*3:0),g.y,g.direction);
   s.setAlpha(g.hp>0?1:.35); // Static enemy art has no supplied death/run cycle.
   if(this.guardReaction[i]>.13)s.setTintFill(0xffd9bd);else s.clearTint();
   if(g.hp>0&&g.aim>0){const mx=g.x+g.direction*23,my=g.y-20;this.fx.fillStyle(0xff5949,.55).fillRect(mx,my,2,2);this.fx.lineStyle(1,0xff7059,.18).lineBetween(mx,my,mx+g.direction*70,my);}
  });
  this.link.clear();const a=this.sprites[0],b=this.sprites[1];
  if(Math.hypot(a.x-b.x,a.y-b.y)<540){
   const points=Array.from({length:19},(_,i)=>({x:Math.round(a.x+(b.x-a.x)*i/18),y:Math.round(a.y-20+(b.y-a.y)*i/18+Math.sin(i*2+t*12)*(sim.plate?3:1)+Math.sin(i/18*Math.PI)*7)}));
   if(sim.plate)this.link.lineStyle(3,0x2da9d4,.24).strokePoints(points);
   this.link.lineStyle(1,sim.plate?0xc4fff3:0x58a3bf,sim.plate?.9:.17).strokePoints(points);
  }
  if(sim.sector===1){
   this.drawGate();
   this.rescueVisual=sim.rescued?Math.min(1,this.rescueVisual+dt*1.8):0;
   this.supplied.pose(this.rescueCage,'props','rescue_cage',RESCUE_CAGE.x,RESCUE_CAGE.y-this.rescueVisual*110);
   this.rescueCage.setVisible(this.rescueVisual<1).setAlpha(1-this.rescueVisual);
   this.supplied.pose(this.checkpointFlag,'props','checkpoint_flag',690,288);this.checkpointFlag.setAlpha(sim.checkpoint?1:.45);
   this.rescueHint.setVisible(!sim.rescued&&sim.gate).setText(sim.rescueProgress>0?'EXTRACTING '+Math.floor(sim.rescueProgress*100)+'%':'HOLD INTERACT / RESCUE');
  }
  for(const bolt of sim.bolts){
   const x=Math.round(bolt.x),y=Math.round(bolt.y),dir=Math.sign(bolt.vx);
   if(bolt.owner===0){
    const pts=Array.from({length:8},(_,i)=>({x:x-dir*i*3,y:y+(i%2?1:-1)*(1+Math.floor((t*35+i)%3))}));
    this.fx.lineStyle(3,0x268ba9,.35).strokePoints(pts);this.fx.lineStyle(1,0xbaffed,1).strokePoints(pts);
    this.fx.fillStyle(0xffffff).fillRect(x-2,y-1,5,3);
   }else {this.fx.fillStyle(0xe95b32,.35).fillRect(x-dir*12,y-1,12,3);this.fx.fillStyle(0xffe5ac).fillRect(x,y,dir*5,1);}
  }
  for(const p of sim.players)if(p.shield>0||p.charge>0){
   const x=Math.round(p.x+p.facing*20),y=Math.round(p.y-24),color=p.charge>0?0x79ffec:0xffc674;
   this.fx.lineStyle(p.charge>0?2:1,color,.85).strokePoints([{x:x-p.facing*5,y:y-19},{x,y:y-10},{x:x+p.facing*2,y:y+8},{x:x-p.facing*5,y:y+21}]);
   if(p.charge>0){
    for(let i=0;i<4;i++){const xx=Math.round(p.x-15+i*10),yy=Math.round(p.y-24+Math.sin(t*26+i*4)*16);this.fx.lineStyle(1,0xb8fff1).strokePoints([{x:xx,y:yy},{x:xx+4,y:yy-4},{x:xx+2,y:yy-7}]);}
   }
  }
  this.effects.update(dt,sim);
  this.renderHud();
 }
 drawGate() {
  const g=this.gateGraphics.clear(),bottom=this.sim.gate?176:288;
  g.fillStyle(0x070f1e).fillRect(602,154,27,bottom-154);
  for(let y=163;y<bottom;y+=12){
   g.fillStyle(0x627b8a).fillRect(606,y,18,2);g.fillStyle(0x253d54).fillRect(606,y+2,18,9);
   g.fillStyle(0xe6ac5c).fillRect(608,y+4,3,5);g.fillStyle(0x0a1726).fillRect(615,y+4,3,5);
  }
  g.fillStyle(0x081726).fillRect(344,283,50,6);g.fillStyle(this.sim.plate?0x81fff1:0xe5b36b).fillRect(346,this.sim.plate?286:283,46,2);
  for(let x=349;x<391;x+=8)g.fillStyle(0x294356).fillRect(x,284,3,2);
  const near=Math.abs(this.sim.players[0].x-487)<65;
  this.hackLabel.setVisible(this.activeRun&&near&&!this.sim.gate).setText(this.sim.plate?'HOLD '+this.bindings[0].interact.replace('Key',''):'NEEDS LINK POWER');
  if(this.sim.hack>0&&!this.sim.gate){g.fillStyle(0x081725).fillRect(466,180,42,4);g.fillStyle(0x92fff1).fillRect(467,181,40*this.sim.hack,2);}
  g.fillStyle(this.sim.gate?0x6cfff1:0xff7044).fillRect(608,157,8,3);
 }
 renderHud() {
  const visible=this.activeRun;this.hud.clear();this.objective.setVisible(visible);this.dialog.setVisible(false);
  this.portraits.forEach(p=>p.setVisible(visible));this.healthLabels.forEach(p=>p.setVisible(visible));
  if(!visible)return;
  const g=this.hud;
  for(const p of this.sim.players){
   const x=p.id?504:9,color=p.id?0xffae59:0x67efdf;
   g.fillStyle(0x060d19,.87).fillRoundedRect(x,6,115,42,3);g.fillStyle(color).fillRect(x,10,2,24);
   for(let i=0;i<3;i++)g.fillStyle(p.hp>i?color:0x263245).fillRect(x+39+i*21,22,18,5);
   if(p.cooldown>0)g.fillStyle(0x8b9dac).fillRect(x+39,31,60*Math.max(0,1-p.cooldown/.65),1);
  }
  this.objective.setText(this.sim.won?'SECTOR CLEAR':this.sim.sector===2?'02 / THE MACHINE':'CELL BLOCK ZERO');
  // Only short-lived dialogue and nearby actionable hints remain on the playfield.
  if(this.sim.elapsed<.1&&this.lastHint==='')this.say('ZIP: "I have a plan."  BRICK: "Make it loud."',3.5);
  let line=this.elapsedVisual<this.hintUntil?this.lastHint:'';
  const ghost=this.sim.players.find(p=>p.ghost);
  if(ghost)line=this.sim.machine?'NEAR + HOLD TO REVIVE / BOTH HOLD INTERACT 3s TO RECALL':'GET CLOSE + HOLD INTERACT TO REVIVE';
  else if(this.sim.sector===1&&this.sim.won)line='DESCEND TO THE MACHINE / BOTH HOLD INTERACT';
  else if(this.sim.machine)line=this.elapsedVisual<this.hintUntil?this.lastHint:this.machineArt.hint(this.sim);
  else if(this.sim.players.every(p=>p.x>1120))line='BOTH IN THE LIFT. PRESS INTERACT.';
  else if(Math.abs(this.sim.players[0].x-this.sim.players[1].x)>490)line='LINK LIMIT / BRING YOUR PARTNER';
  if(line){
   this.dialog.setText(line).setVisible(true);
   const width=Math.min(590,this.dialog.width+24);g.fillStyle(0x080d19,.9).fillRect(320-width/2,319,width,21);g.fillStyle(0xd49248).fillRect(320-width/2,319,2,21);
  }
 }
}
