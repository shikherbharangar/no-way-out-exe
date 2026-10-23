const output=process.env.CAPTURE_DIR||'artifacts/machine';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-renderer-backgrounding','--disable-background-timer-throttling','--disable-backgrounding-occluded-windows']});
const errors=[],contexts=[];
async function client(){const context=await browser.newContext({viewport:{width:960,height:540}});contexts.push(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173');return page;}
try{
 const a=await client(),b=await client();await a.click('#online');await a.click('#host');await a.waitForSelector('.room-code');const code=await a.locator('.room-code').innerText();
 await b.click('#online');await b.fill('#code',code);await b.click('#join');await b.waitForSelector('#ready');await a.click('#ready');await b.click('#ready');await Promise.all([a.waitForSelector('#pause'),b.waitForSelector('#pause')]);

 for(const page of [a,b])await page.evaluate(async()=>{
  const {CampaignPilot}=await import('/tests/helpers/machine-pilot.ts');window.machinePilot=new CampaignPilot();
  const held=new Set(),bindings={left:'KeyA',right:'KeyD',jump:'Space',special:'KeyG',interact:'KeyF'};
  window.machineKeys=input=>{for(const [action,code]of Object.entries(bindings)){const on=!!input[action];if(held.has(code)===on)continue;if(on)held.add(code);else held.delete(code);window.dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code,bubbles:true,cancelable:true}));}};
  window.__prison.events.on('preupdate',()=>{const s=window.__prison.sim;window.machineKeys(window.machinePilot.controls(s.snapshot())[window.__prison.localSlot]);});
 });
 const start=Date.now();let stage='',captured=false,won=false,lastStatus=0;
 while(Date.now()-start<180000){
  const result=await a.evaluate(()=>{const s=window.__prison.sim;return {sector:s.sector,won:s.won,phase:s.machine?.bossPhase,stage:s.machine?window.machinePilot.stage:window.machinePilot.prisonStage};});
  if(Date.now()-lastStatus>10000){lastStatus=Date.now();console.log('ROUTE status',await a.evaluate(()=>({tick:window.__prison.sim.tick,positions:window.__prison.sim.players.map(p=>[Math.round(p.x),Math.round(p.y),p.facing]),online:window.__prison.online,paused:window.__prison.pausedRun,keys:[...window.__prison.keys]})));}
  const next=`${result.sector}/${result.stage}`;if(next!==stage){console.log('PASS two-browser route',next);stage=next;}
  if(!captured&&result.phase==='caught'){
   await mkdir(output,{recursive:true});
   for(const [i,page]of [a,b].entries()){
    const png=await page.evaluate(()=>new Promise(resolve=>window.__prison.game.events.once('postrender',()=>resolve(window.__prison.game.canvas.toDataURL('image/png').split(',')[1]))));assert(Buffer.from(png,'base64').length>10000,'Empty WebGL readback');await writeFile(`${output}/0${8+i}-online-${i?'brick':'zip'}.png`,Buffer.from(png,'base64'));
   }
   captured=true;
  }
  if(result.sector===2&&result.won){won=true;break;}
  await new Promise(r=>setTimeout(r,100));
 }
 assert(won,'Two-browser route timed out: '+await a.evaluate(()=>JSON.stringify(window.__prison.sim.snapshot())));assert(captured);await b.waitForFunction(()=>window.__prison.sim.sector===2&&window.__prison.sim.won);
 const states=await Promise.all([a,b].map(page=>page.evaluate(()=>window.__prison.sim.snapshot())));assert.deepEqual(states[0],states[1]);assert.deepEqual(errors,[]);
 await writeFile(`${output}/online-browser-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),method:'Two independent browser contexts; real lobby, normal keyboard events, full campaign; no world-state writes',duration:(Date.now()-start)/1000,browserErrors:errors,sameFinalSnapshot:true,seed:states[0].seed,finalTick:states[0].tick,bossHp:states[0].machine.bossHp,won:true},null,2)+'\n');
 console.log('PASS both browser clients render THE MACHINE, solve co-op boss and finish with identical snapshots');
}finally{await browser.close();}
