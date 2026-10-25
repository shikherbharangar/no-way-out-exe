// Works against a production URL; no development hooks or world-state writes.
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.DEPLOYED_GAME_URL;
assert(url,'Set DEPLOYED_GAME_URL to the real HTTPS frontend, or the documented local TLS fixture.');
assert.equal(new URL(url).protocol,'https:');
const local=['localhost','127.0.0.1'].includes(new URL(url).hostname);
const out=process.env.CAPTURE_DIR||'artifacts/deployment';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-renderer-backgrounding','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows']});
const errors=[],contexts=[];let blockedAttempts=0;
async function client(blockOffline=false){
 const context=await browser.newContext({viewport:{width:1280,height:720},ignoreHTTPSErrors:local});contexts.push(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 if(blockOffline)await page.routeWebSocket('**',route=>{blockedAttempts++;route.close();});
 await page.addInitScript(()=>{
  const Original=window.WebSocket;
  window.__netTest={state:null,slot:0,states:0,connections:0,urls:[],events:[],maxEvent:0};window.__sockets=[];
  window.WebSocket=class extends Original{
   constructor(...args){super(...args);window.__sockets.push(this);const evidence=window.__netTest;evidence.connections++;evidence.urls.push(String(args[0]));
    this.addEventListener('message',e=>{let m;try{m=JSON.parse(e.data);}catch{return;}
     if(m.type==='start'){evidence.slot=m.slot;evidence.epoch=(evidence.epoch||0)+1;}
     if(m.type==='state'){evidence.state=m.state;evidence.states++;for(const event of m.state.events)if(event.id>evidence.maxEvent){evidence.events.push(event.type);evidence.maxEvent=event.id;}}
    });
   }
  };
 });
 await page.goto(url);await page.waitForSelector('#play');assert.equal(await page.evaluate(()=>typeof window.__prison),'undefined','Must test a production build');return page;
}
try{
 // A deliberately unavailable transport must not block local gameplay.
 const offline=await client(true);
 await offline.click('#online');await offline.click('#host');await offline.waitForFunction(()=>document.querySelector('#net-status')?.textContent.includes('waking up'));
 await offline.screenshot({path:`${out}/server-waking.png`});
 await offline.click('#local-online');await offline.click('#start');await offline.waitForSelector('#pause');
 await offline.keyboard.down('ArrowRight');await offline.waitForTimeout(700);await offline.keyboard.up('ArrowRight');await offline.keyboard.press('ControlRight');
 const cancelledCount=blockedAttempts;await offline.waitForTimeout(2200);assert.equal(blockedAttempts,cancelledCount,'Background connection attempts continued after cancel');
 await offline.screenshot({path:`${out}/local-without-backend.png`});await offline.close();
 const a=await client(),b=await client();
 await a.click('#online');await a.click('#host');await a.waitForSelector('.room-code',{timeout:125000});const code=await a.locator('.room-code').innerText();
 // Exercise the actual invitation URL, not just the room-code input.
 const invite=new URL(url);invite.searchParams.set('room',code);await b.goto(invite.href);await b.waitForSelector('#join');assert.equal(await b.inputValue('#code'),code);
 await b.click('#join');await b.waitForSelector('#ready',{timeout:125000});await a.click('#ready');await b.click('#ready');
 await Promise.all([a.waitForSelector('#pause'),b.waitForSelector('#pause')]);
 await a.waitForFunction(()=>window.__netTest.state?.tick>5);const initial=await a.evaluate(()=>structuredClone(window.__netTest.state));
 const driver=await build({stdin:{contents:`import {ProductionPilot} from './tests/helpers/production-pilot.ts';
 const pilot=new ProductionPilot(),held=new Set(),bindings={left:'KeyA',right:'KeyD',jump:'Space',special:'KeyG',interact:'KeyF'};
 let epoch=-1;
 function frame(){const evidence=window.__netTest,s=evidence.state;if(epoch!==evidence.epoch){for(const code of held)window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.clear();epoch=evidence.epoch;}const values=s&&!window.__holdDriver?pilot.controls(s)[evidence.slot]:{};
  for(const [action,code]of Object.entries(bindings)){const on=!!values[action];if(held.has(code)===on)continue;on?held.add(code):held.delete(code);window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));}
  requestAnimationFrame(frame);
 }frame();`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',target:'es2022'});
 for(const page of [a,b])await page.addScriptTag({content:driver.outputFiles[0].text});
 const started=Date.now();let reconnected=false,lastStage='',beforeReconnect,lastLog=0;
 while(Date.now()-started<240000){
  const state=await a.evaluate(()=>window.__netTest.state);
  if(Date.now()-lastLog>10000){lastLog=Date.now();console.log('STATUS',state.tick,state.players.map(p=>[Math.round(p.x),Math.round(p.y),p.hp,p.ghost]));}
  const stage=`${state.sector}/${state.machine?.bossHp??state.gate}`;if(stage!==lastStage){console.log('Production browser route',stage);lastStage=stage;}
  if(!reconnected&&state.gate&&state.sector===1){
   for(const page of [a,b])await page.evaluate(()=>window.__holdDriver=true);
   beforeReconnect=state;const connections=await b.evaluate(()=>window.__netTest.connections);
   await b.evaluate(()=>window.__sockets.at(-1).close());
   await b.waitForFunction(n=>window.__netTest.connections>n,connections,{timeout:27000});
   await b.waitForSelector('#pause',{timeout:27000});await a.waitForSelector('#pause',{timeout:27000});
   await b.waitForFunction(t=>window.__netTest.state.tick>t,state.tick);
   const recovered=await b.evaluate(()=>window.__netTest.state);assert(recovered.gate);assert.equal(recovered.seed,state.seed);
   for(let i=0;i<state.terrain.length;i++)if(state.terrain[i]<0)assert.equal(recovered.terrain[i],-1);
   for(const page of [a,b])await page.evaluate(()=>window.__holdDriver=false);
   reconnected=true;console.log('PASS production browser reconnect retains seed, gate and destroyed terrain');
  }
  if(state.sector===2&&state.won)break;
  await new Promise(r=>setTimeout(r,100));
 }
 await b.waitForFunction(()=>window.__netTest.state?.sector===2&&window.__netTest.state?.won,{},{timeout:15000});
 const states=await Promise.all([a,b].map(p=>p.evaluate(()=>window.__netTest.state)));
 assert(states[0].won&&states[0].sector===2);assert.deepEqual(states[0],states[1]);assert(reconnected);
 assert(beforeReconnect.terrain.filter(t=>t>=0).length<initial.terrain.filter(t=>t>=0).length);
 assert(states[0].players.every((p,i)=>p.x!==initial.players[i].x));
 const observed=await a.evaluate(()=>({connections:window.__netTest.connections,urls:window.__netTest.urls,events:[...new Set(window.__netTest.events)],states:window.__netTest.states}));
 assert(observed.urls.every(u=>u.startsWith('wss://')));assert(observed.events.includes('blast'));assert(observed.events.includes('gate'));assert(observed.events.includes('win'));
 for(const [i,p]of [a,b].entries())await p.screenshot({path:`${out}/production-online-${i}.png`});
 assert.deepEqual(errors,[]);
 await writeFile(`${out}/production-online-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),frontend:url,publicDeployment:!local,localTLSCertificateBypass:local,
  method:'Two independent production browser contexts, real UI/invite and keyboard inputs. Test-only WebSocket observation, no simulation writes or application inspection hooks. Separate unavailable-transport case deliberately rejects upgrades.',
  localWorksWithoutBackend:true,cancelStopsRetries:true,reconnected:true,sameFinalSnapshot:true,completedBothSectors:true,finalTick:states[0].tick,seed:states[0].seed,bossHp:states[0].machine.bossHp,durationSeconds:(Date.now()-started)/1000,observed,browserErrors:errors},null,2)+'\n');
 console.log('PASS production HTTPS/WSS, two-client full campaign, invite, movement/destruction, reconnect, and local co-op without backend');
}finally{await browser.close();}
