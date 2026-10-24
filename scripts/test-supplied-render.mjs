import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.CAPTURE_DIR||'artifacts/supplied';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173');await page.click('#play');await page.click('#start');await page.waitForFunction(()=>window.__prison.sim.tick>80);
 const perf=await page.evaluate(()=>new Promise(resolve=>{const stamps=[],game=window.__prison.game,start=performance.now();function rendered(){stamps.push(performance.now());if(performance.now()-start>3000){game.events.off('postrender',rendered);const ms=stamps.slice(1).map((v,i)=>v-stamps[i]).sort((a,b)=>a-b);resolve({seconds:(performance.now()-start)/1000,frames:stamps.length,medianMs:ms[Math.floor(ms.length*.5)],p95Ms:ms[Math.floor(ms.length*.95)],environment:'Headless Chromium / SwiftShader, not production GPU performance'});}}game.events.on('postrender',rendered);}));
 const result=await page.evaluate(async()=>{
  const scene=window.__prison,game=scene.game,meta=scene.supplied.meta;
  scene.scene.pause();scene.children.list.forEach(o=>o.setVisible(false));scene.cameras.main.resetFX();scene.cameras.main.setScroll(0,0).setZoom(1).setBackgroundColor('#242832');
  const test=scene.add.sprite(320,220,'supplied-zip','idle').setDepth(100).setAlpha(1).clearTint();
  const output=document.createElement('canvas');output.width=640;output.height=360;const context=output.getContext('2d',{willReadFrequently:true});context.imageSmoothingEnabled=false;
  const cases=[];
  for(const [group,entries]of Object.entries(meta.groups)){
   const source=new Image();source.src=`/assets/supplied/${group}.png`;await source.decode();
   for(const [name,f]of Object.entries(entries))for(const facing of [1,-1]){
    scene.supplied.pose(test,group,name,320,220,facing);
    await new Promise(resolve=>game.events.once('postrender',()=>{context.drawImage(game.canvas,0,0);resolve();}));
    const flip=facing!==f.sourceFacing,w=f.frame_width,h=f.frame_height,left=320-(flip?w-f.anchor[0]:f.anchor[0]),top=220-f.anchor[1];
    const actual=context.getImageData(left,top,w,h).data;
    const expected=document.createElement('canvas');expected.width=w;expected.height=h;const ec=expected.getContext('2d',{willReadFrequently:true});ec.imageSmoothingEnabled=false;ec.fillStyle='#242832';ec.fillRect(0,0,w,h);
    if(flip){ec.translate(w,0);ec.scale(-1,1);}ec.drawImage(source,f.atlas_x,f.atlas_y,w,h,0,0,w,h);
    const pixels=ec.getImageData(0,0,w,h).data;let mismatches=0;for(let i=0;i<pixels.length;i+=4)if(actual[i]!==pixels[i]||actual[i+1]!==pixels[i+1]||actual[i+2]!==pixels[i+2]||actual[i+3]!==pixels[i+3])mismatches++;
    cases.push({group,name,facing,frame:[w,h],anchor:f.anchor,scale:test.scaleX,mismatches});
   }
  }
  test.destroy();return {method:'Isolated Phaser rendering test, not a gameplay capture. Every full supplied frame rendered both directions at 1x and compared pixel-for-pixel against the original atlas composited on the same neutral background.',cases};
 });
 await writeFile(`${out}/render-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),browserErrors:errors,performance:perf,...result},null,2)+'\n');
 assert.deepEqual(errors,[]);assert.equal(result.cases.length,114);assert.deepEqual(result.cases.filter(c=>c.mismatches),[]);
 console.log('PASS all 57 supplied frames in both directions: exact visible pixels, uncut dimensions, reflected anchors, native scale; performance sample recorded');
}finally{await browser.close();}
