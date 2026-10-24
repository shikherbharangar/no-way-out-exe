import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output=process.env.CAPTURE_DIR||'artifacts/machine';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.text().startsWith('ROUTE'))console.log(m.text());});
try{
 await page.goto('http://127.0.0.1:5173');await page.click('#play');await page.click('#start');
 const result=await page.evaluate(async()=>{
  const {CampaignPilot}=await import('/tests/helpers/machine-pilot.ts'),pilot=new CampaignPilot(),scene=window.__prison;
  const held=new Set(),bindings=[{left:'KeyA',right:'KeyD',jump:'Space',special:'KeyG',interact:'KeyF'},{left:'ArrowLeft',right:'ArrowRight',jump:'ShiftRight',special:'ControlRight',interact:'Enter'}];
  function key(code,on){if(held.has(code)===on)return;if(on)held.add(code);else held.delete(code);window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));}
  const release=()=>{for(const code of [...held])key(code,false);};
  const shots=[],seen=new Set(),events=[],frames=[new Set(),new Set()],samples=[];let recorder,stream,audio,start=performance.now(),machineStart=0,recorded=0,lastEvent=0,lastPhase='',lastSample=0,ended=false;
  const chunks=[];
  const state=()=>{const s=scene.sim;return {tick:s.tick,sector:s.sector,seed:s.seed,won:s.won,players:s.players.map(p=>({x:p.x,y:p.y,hp:p.hp,ghost:p.ghost})),machine:structuredClone(s.machine),terrain:s.terrain.filter(t=>t>=0).length};};
  return await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>finish(Error('Campaign route exceeded 180 seconds: '+JSON.stringify(state()))),180000);
   function begin(){
    machineStart=performance.now();lastEvent=scene.sim.eventId;stream=scene.game.canvas.captureStream(30);scene.sfx.unlock();audio=scene.sfx.context.createMediaStreamDestination();scene.sfx.gain.connect(audio);stream.addTrack(audio.stream.getAudioTracks()[0]);
    recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:4000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.start();
   }
   async function finish(error){
    if(ended)return;ended=true;clearTimeout(timeout);release();scene.events.off('preupdate',drive);scene.game.events.off('postrender',render);
    if(recorder){await new Promise(r=>{recorder.onstop=r;recorder.stop();});scene.sfx.gain.disconnect(audio);stream.getTracks().forEach(t=>t.stop());}
    if(error){reject(error);return;}
    const bytes=new Uint8Array(await new Blob(chunks,{type:'video/webm'}).arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    resolve({method:'Complete campaign via ordinary keyboard events; simulation inspection is read-only',shots,video:btoa(binary),events,samples,frames:frames.map(s=>[...s]),renderedFrames:recorded,duration:(performance.now()-machineStart)/1000,totalSeconds:(performance.now()-start)/1000,final:state()});
   }
   function drive(){
    const s=scene.sim;if(s.sector===2&&!recorder)begin();
    const inputs=pilot.controls(s.snapshot());inputs.forEach((input,i)=>{for(const [action,code]of Object.entries(bindings[i]))key(code,input[action]);});
    const phase=`${s.sector}/${s.machine?pilot.stage:pilot.prisonStage}`;if(phase!==lastPhase){lastPhase=phase;console.log('ROUTE',phase,Math.round((performance.now()-start)/1000));}
    if(s.machine&&Math.floor(s.machine.age)>lastSample){lastSample=Math.floor(s.machine.age);samples.push(state());}
    if(s.sector===2&&s.won&&!seen.has('07-sector-clear'))seen.add('finish-pending');
   }
   function render(){
    const s=scene.sim,m=s.machine;if(!m||!recorder||scene.displaySector!==2)return;recorded++;
    scene.sprites.forEach((sprite,i)=>frames[i].add(String(sprite.frame.name)));
    for(const e of s.events)if(e.id>lastEvent){lastEvent=e.id;events.push({...e,seconds:(performance.now()-machineStart)/1000});}
    const activeFire=scene.children.list.some(o=>o.texture?.key==='explosion'&&o.visible&&Number(o.frame.name)>=4&&Number(o.frame.name)<=8);
    const candidates=[['01-counterweight',m.liftY<510&&m.liftY>410],['02-relay',m.relayCharge===1],['03-trap',m.trap>.2&&m.trap<1.5],['04-chase',m.trap>1.7&&!m.chaseDone&&m.chaseX>560],['05-cooperative-ram',m.bossPhase==='caught'&&m.bossHp<6&&m.bossHp>0],['06-heart-explosion',m.bossHp===0&&activeFire],['07-sector-clear',s.won]];
    for(const [name,when]of candidates)if(when&&!seen.has(name)){seen.add(name);shots.push({name,state:state(),png:scene.game.canvas.toDataURL('image/png').split(',')[1]});console.log('ROUTE capture',name);}
    if(seen.has('07-sector-clear'))setTimeout(()=>finish(),100);
   }
   scene.events.on('preupdate',drive);scene.game.events.on('postrender',render);
  });
 });
 const {video,shots,...evidence}=result;
 await writeFile(`${output}/gameplay.webm`,Buffer.from(video,'base64'));
 for(const shot of shots)await writeFile(`${output}/${shot.name}.png`,Buffer.from(shot.png,'base64'));
 evidence.shots=shots.map(({png,...rest})=>rest);evidence.browserErrors=errors;await writeFile(`${output}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
 assert.deepEqual(errors,[]);assert.equal(result.final.won,true);assert.equal(result.final.sector,2);assert.equal(shots.length,7);
 for(const f of result.frames)assert(f.includes('run')&&f.some(n=>['shoot','punch','charge'].includes(n)),'Moving and attacking pose selection; not a cycle-quality test');
 const art=await page.evaluate(()=>window.__prison.sprites.map(s=>s.texture.key));assert.deepEqual(art,['supplied-zip','supplied-brick']);
 await page.click('#again');await page.waitForFunction(()=>window.__prison.sim.sector===1&&window.__prison.displaySector===1);
 assert.deepEqual(await page.evaluate(()=>({actors:window.__prison.sprites.map(s=>s.texture.key),rescued:window.__prison.sim.rescued})),{actors:['supplied-zip','supplied-brick'],rescued:false});
 console.log('PASS supplied heroes across both sectors and real replay resets rescue');
 console.log('PASS full two-sector browser campaign, seven real frames, video/audio, actor pose selection, no browser errors');
}finally{await browser.close();}
