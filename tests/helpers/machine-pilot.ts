import { idleInput, type Snapshot, type Input } from '../../src/game/simulation';
/** A test driver: returns normal controls only; never changes world state. */
export class MachinePilot {
 stage=0;
 private boarding=[false,false];
 controls(s:Snapshot):Input[]{
  const m=s.machine!,p=s.players,t=s.tick;
  const move=(id:number,x:number,jump=false):Input=>({...idleInput(),left:p[id].x>x+7,right:p[id].x<x-7,jump:jump&&t%52<36});
  const at=(id:number,x:number)=>Math.abs(p[id].x-x)<12;
  if(p.some(a=>a.ghost))return p.map((a,i)=>a.ghost?idleInput():{...move(i,p[1-i].x),interact:true,special:t%42<4});
  if(!m.liftSolved){
   this.stage=0;
   // A delayed online input can overshoot a partly raised cage. Back clear of
   // its lip, jump vertically, then steer aboard once the feet clear the top.
   return p.map((a,id)=>{
    if(a.y>m.liftY+6||((a.x<177||a.x>255)&&m.liftY<560&&a.y>=m.liftY))this.boarding[id]=true;
    if(this.boarding[id]&&a.y<m.liftY-2)this.boarding[id]=false;
    if(this.boarding[id]){
     const right=a.x>=216,clear=right?a.x>=263&&a.x<=274:a.x>=158&&a.x<=169;
     // Stay within reach of the existing recall control when the cage is high.
     const target=right?(a.x>274?267:272):(a.x<158?165:160);
     return {...(clear?idleInput():move(id,target)),jump:clear&&a.y-m.liftY<32&&t%52<36,interact:true};
    }
    const riding=Math.abs(a.y-m.liftY)<3&&a.x>177&&a.x<255;
    if(riding&&(id?a.x<216:a.x>216))return {...idleInput(),interact:true};
    return {...move(id,id?196:236),interact:true};
   });
  }
  if(!m.relay){
   this.stage=1;
   const a=move(0,432),b=move(1,340);
   b.interact=true;b.special=t%44<4;
   a.special=t%36<4;
   if(p[1].x>334&&p[1].x<354){b.left=false;b.right=p[1].facing<0;}
   // Punch the service wall, then brace the flywheel while ZIP fires at the receiver.
   if(s.terrain[21*80+23]<0){b.left=p[1].x>326+7;b.right=p[1].x<326-7;b.special=false;}
   if(at(0,432)){a.left=false;a.right=p[0].facing<0;}
   return [a,b];
  }
  if(!m.chaseDone){
   this.stage=2;
   return p.map((a,i)=>{
    const target=i===1?936:Math.min(944,p[1].x+40),input=move(i,target);
    const ahead=a.x+18;
    const obstacle=(s.terrain[Math.floor((a.y-8)/16)*80+Math.floor(ahead/16)]??-1)>=0;
    const gap=(s.terrain[Math.floor((a.y+5)/16)*80+Math.floor(ahead/16)]??-1)<0;
    input.jump=t%52<36&&(obstacle||gap||a.y>440);
    input.interact=true;input.special=i===0&&t%38<4;
    if(a.y>440&&a.x>800){input.left=a.x>872+3;input.right=a.x<872-3;input.jump=false;}
    return input;
   });
  }
  if(m.bossHp>0){
   this.stage=3;
   const a=move(0,1044),b=move(1,984);
   b.interact=true;if(at(1,984)){b.left=false;b.right=p[1].facing<0;}
   if(at(0,1044)){a.left=false;a.right=p[0].facing<0;}
   a.special=t%36<4;
   return [a,b];
  }
  this.stage=4;return [move(0,1220),move(1,1246)].map(i=>({...i,interact:true}));
 }
}
export class CampaignPilot extends MachinePilot {
 prisonStage=0;
 private terminalRecovery=0;
 override controls(s:Snapshot):Input[]{
  if(s.machine)return super.controls(s);
  if(s.won)return [{...idleInput(),interact:true},{...idleInput(),interact:true}];
  const approach=(id:number,target:number):Input=>{
   const p=s.players[id],t=s.tick,dir=Math.sign(target-p.x),gap=Math.abs(target-p.x);
   const solid=(x:number,y:number)=>s.terrain[Math.floor(y/16)*80+Math.floor(x/16)]>=0;
   return {...idleInput(),left:gap>7&&dir<0,right:gap>7&&dir>0,jump:t%48<30&&(solid(p.x+dir*12,p.y-8)||p.y>290||(p.x>390&&p.x<475)),special:id===1&&p.x>195&&p.x<300&&t%42<4};
  };
  if(!s.gate){
   if(this.prisonStage===0&&s.players[1].x>330)this.prisonStage=1;
   if(this.prisonStage===0)return [idleInput(),approach(1,369)];
   const zip=s.players[0];
   // If ZIP falls beneath the overhang, use his existing wall jump around its
   // right edge. Walking toward the terminal from below cannot reach its top.
   if(!this.terminalRecovery&&zip.y>263&&zip.x>448)this.terminalRecovery=1;
   if(this.terminalRecovery===1&&zip.x>542)this.terminalRecovery=2;
   if(this.terminalRecovery===2&&zip.grounded&&zip.y<230)this.terminalRecovery=0;
   const a=approach(0,this.terminalRecovery===1?550:487);
   if(this.terminalRecovery)a.jump=this.terminalRecovery===2&&s.tick%30<24;
   return [{...a,interact:true},approach(1,369)];
  }
  return s.players.map((p,i)=>{
   const input=approach(i,i?1215:1190);input.interact=true;
   input.special=i===0?s.tick%40<4:s.tick%60<4&&s.guards.some(g=>g.hp>0&&Math.abs(g.x-p.x)<60);
   if(s.players[1-i].ghost){const other=s.players[1-i];input.left=p.x>other.x+20;input.right=p.x<other.x-20;}
   return input;
  });
 }
}
