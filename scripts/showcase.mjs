import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.CAPTURE_DIR||'artifacts/premium';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir(output,{recursive:true});
try {
 await page.goto(process.env.GAME_CAPTURE_URL||'http://127.0.0.1:5173');await page.click('#play');await page.click('#start');
 // All route preparation and showcase actions use ordinary keyboard events.
 // The inspection hook is read-only; no teleport, damage override or time stepping.
 await page.evaluate(()=>{
  const scene=window.__prison,held=new Set();
  const bindings=[{left:'KeyA',right:'KeyD',jump:'Space',special:'KeyG',interact:'KeyF'},{left:'ArrowLeft',right:'ArrowRight',jump:'ShiftRight',special:'ControlRight',interact:'Enter'}];
  function key(code,down){if(held.has(code)===down)return;if(down)held.add(code);else held.delete(code);window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true,cancelable:true}));}
  function control(id,values){for(const [action,code]of Object.entries(bindings[id]))key(code,!!values[action]);}
  function release(){for(const k of [...held])key(k,false);}
  function approach(id,target,t,combat=false){const s=scene.sim,p=s.players[id],dir=Math.sign(target-p.x),gap=Math.abs(target-p.x);return {left:gap>3&&dir<0,right:gap>3&&dir>0,jump:t%48<30&&(s.solid(p.x+dir*12,p.y-8)||p.y>290||(p.x>390&&p.x<475)||(combat&&p.x>800&&p.x<940)),special:id===1&&p.x>195&&p.x<300&&t%42<3,interact:combat&&id===1};}
  window.captureControls={control,release,approach};
  window.captureDrive=(id,target,y=288)=>new Promise((resolve,reject)=>{
   const start=performance.now(),tick=scene.sim.tick;
   function frame(){const s=scene.sim,p=s.players[id],t=s.tick-tick;
    if(Math.abs(target-p.x)<4&&p.grounded&&Math.abs(p.y-y)<4){control(id,{});resolve();return;}
    if(performance.now()-start>45000){release();reject(Error(`Route stalled ${id} at ${p.x},${p.y}`));return;}
    control(id,approach(id,target,t,target>624));requestAnimationFrame(frame);
   }frame();
  });
 });
 await page.evaluate(()=>window.captureDrive(1,369));
 await page.evaluate(()=>window.captureDrive(0,487,224));
 await page.keyboard.down('KeyF');await page.waitForFunction(()=>window.__prison.sim.gate);await page.keyboard.up('KeyF');
 await page.evaluate(()=>Promise.all([window.captureDrive(1,638),window.captureDrive(0,597)]));
 const result=await page.evaluate(()=>new Promise(async(resolve,reject)=>{
  const scene=window.__prison,s=scene.sim,{control,release,approach}=window.captureControls;
  const stream=scene.game.canvas.captureStream(60);
  scene.sfx.unlock();const audio=scene.sfx.context.createMediaStreamDestination();scene.sfx.gain.connect(audio);stream.addTrack(audio.stream.getAudioTracks()[0]);
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:4500000}),chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const shots=[],events=[],samples=[],playerFrames=[new Set(),new Set()],guardFrames=new Set(),fireFrames=new Set();let renderedFrames=0;let last=s.eventId,lastSample=-1,chargedAt=-1,punched=false;
  const start=performance.now(),startTick=s.tick,startEvent=s.eventId;
  let pending='01-encounter';
  const snapshot=()=>({tick:s.tick,players:s.players.map(p=>({id:p.id,x:p.x,y:p.y,hp:p.hp,charge:p.charge,shield:p.shield,ghost:p.ghost})),guards:s.guards.map(g=>({...g})),barrels:s.barrels.map(b=>({...b})),rescued:s.rescued,rescueProgress:s.rescueProgress,checkpoint:s.checkpoint,remainingTiles:s.terrain.filter(t=>t>=0).length,won:s.won});
  const initial=snapshot();
  function rendered(){
   renderedFrames++;scene.sprites.forEach((sprite,i)=>playerFrames[i].add(String(sprite.frame.name)));
   scene.guardSprites.forEach(sprite=>guardFrames.add(String(sprite.frame.name)));
   scene.children.list.filter(o=>o.texture?.key==='explosion'&&o.visible).forEach(o=>fireFrames.add(Number(o.frame.name)));
   if(!pending)return;
   shots.push({name:pending,seconds:(performance.now()-start)/1000,state:snapshot(),png:scene.game.canvas.toDataURL('image/png').split(',')[1]});pending='';
  }
  scene.game.events.on('postrender',rendered);
  recorder.onstop=async()=>{
   scene.game.events.off('postrender',rendered);scene.sfx.gain.disconnect(audio);stream.getTracks().forEach(t=>t.stop());
   const blob=new Blob(chunks,{type:'video/webm'}),buffer=await blob.arrayBuffer();let text='';for(const byte of new Uint8Array(buffer))text+=String.fromCharCode(byte);
   resolve({video:btoa(text),shots,events,samples,initial,final:snapshot(),renderedFrames,animationFrames:{players:playerFrames.map(set=>[...set]),guards:[...guardFrames],fire:[...fireFrames]},duration:(performance.now()-start)/1000,browserErrors:[]});
  };
  recorder.start();
  function frame(){
   const elapsed=(performance.now()-start)/1000,t=s.tick-startTick;
   for(const e of s.events)if(e.id>last){events.push({...e,seconds:elapsed});last=e.id;
    if(e.type==='rescue')pending='02b-prisoner-rescue';
    if(e.type==='charge'&&chargedAt<0){chargedAt=elapsed;pending='02-cooperative-charge';}
    if(e.type==='blast'&&e.material==='steel'&&!shots.some(shot=>shot.name==='03-shock-punch'))pending='03-shock-punch';
   }
   if(!shots.some(x=>x.name==='04-chain-explosion')&&scene.children.list.filter(o=>o.texture?.key==='explosion'&&o.visible&&Number(o.frame.name)<13).length>=2)pending='04-chain-explosion';
   if(!shots.some(x=>x.name==='05-narrow-escape')&&s.players.every(p=>p.x>800)&&s.players.some(p=>!p.grounded)&&s.barrels.slice(1,5).every(b=>!b.alive))pending='05-narrow-escape';
   if(!shots.some(x=>x.name==='06-freight-lift')&&s.players.every(p=>p.x>1150))pending='06-freight-lift';
   if(Math.floor(elapsed)!==lastSample){lastSample=Math.floor(elapsed);samples.push({seconds:elapsed,...snapshot()});}
   if(elapsed>=16.5){release();recorder.stop();return;}
   // Keep this Sector 01 recording at its completed lift; the campaign now continues.
   if(s.won){release();requestAnimationFrame(frame);return;}
   if(elapsed<2.7){
    control(0,{right:t<8,special:t%36<3});control(1,{interact:true});
   }else if(!punched){
    control(0,{});
    control(1,{right:s.players[1].x<690,interact:true,special:s.players[1].x>=688});
    if(s.events.some(e=>e.type==='blast'&&e.material==='steel'&&e.id>startEvent)){punched=true;}
    if(elapsed>4.5)punched=true;
   }else {
    for(let id=0;id<2;id++){
     const p=s.players[id],holding=elapsed<8.7;
     const target=id?(holding?956:1205):Math.min(holding?914:1180,s.players[1].x-26);
     const values=approach(id,target,t,true);
     if(holding&&id===0&&Math.abs(p.x-target)<8)values.jump=t%48<30;
     values.special=id===0?t%40<3:t%60<3&&s.guards.some(g=>g.hp>0&&Math.abs(g.x-p.x)<60&&Math.abs(g.y-p.y)<60);
     values.interact=id===1||p.x>1150;
     const other=s.players[1-id];
     if(p.ghost){control(id,{});continue;}
     if(other.ghost){const rescue=approach(id,other.x,t,true);rescue.special=false;rescue.interact=true;control(id,rescue);}
     else control(id,values);
    }
   }
   requestAnimationFrame(frame);
  }
  frame();
 }));
 await writeFile(`${output}/gameplay-source.webm`,Buffer.from(result.video,'base64'));delete result.video;
 for(const shot of result.shots){await writeFile(`${output}/${shot.name}.png`,Buffer.from(shot.png,'base64'));delete shot.png;}
 result.browserErrors=errors;result.capturedAt=new Date().toISOString();
 await writeFile(`${output}/evidence.json`,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({duration:result.duration,shots:result.shots.map(s=>s.name),eventTypes:[...new Set(result.events.map(e=>e.type))],initial:result.initial.players,final:result.final.players,won:result.final.won,errors}));
 assert(result.animationFrames.players.every(frames=>frames.length>=4&&frames.includes('run')),'Missing moving hero animation');
 assert.equal(new Set(result.shots.map(shot=>shot.name)).size,result.shots.length,'Duplicate screenshot filename');
 assert(result.events.some(e=>e.type==='win'&&e.seconds<15),'Escape must be visible in the 15-second excerpt');
 assert(result.events.some(e=>e.type==='rescue'),'No actual cage rescue');
 assert(result.final.rescued,'Rescue state missing');
 assert(result.animationFrames.fire.length>=8,'Missing evolving fire animation');
 assert(result.events.some(e=>e.type==='shot'),'Guards did not shoot');
 assert(result.events.some(e=>e.type==='death'),'No enemy defeat');
 assert.equal(errors.length,0);assert(result.events.some(e=>e.type==='charge'),'No cooperative charge');assert(result.events.some(e=>e.material==='steel'),'No charged punch');assert(result.shots.some(s=>s.name==='04-chain-explosion'),'No chain frame');assert(result.shots.some(s=>s.name==='05-narrow-escape'),'No escape frame');assert(result.final.won,'Did not reach the freight lift');
} finally {await browser.close();}
