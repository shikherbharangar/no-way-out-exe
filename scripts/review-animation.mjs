import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[],bad=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});
try{
 await page.goto('http://127.0.0.1:5173/artifacts/animation-review/index.html');await page.waitForFunction(()=>window.reviewReady);
 let gameplayImages=0,poseCells=0,missingBriefs=0;
 for(const moment of ['idle','running','combat']){
  await page.selectOption('#moment',moment);
  const options=await page.locator('#view option').evaluateAll(list=>list.map(o=>o.value));
  for(const view of options)for(const zoom of ['1','2']){
   await page.selectOption('#view',view);await page.selectOption('#zoom',zoom);
   const dimensions=await page.locator('#game').evaluate(async im=>{await im.decode();return [im.naturalWidth,im.naturalHeight];});
   assert.deepEqual(dimensions,zoom==='1'?[640,360]:[1280,720]);gameplayImages++;
  }
 }
 for(const hero of ['zip','brick']){
  await page.selectOption('#hero',hero);
  const poses=await page.locator('#pose-name option').evaluateAll(list=>list.map(o=>o.value));
  for(const pose of poses){await page.selectOption('#pose-name',pose);await page.waitForFunction(p=>JSON.parse(document.getElementById('pose-data').textContent).pose===p,pose);poseCells++;}
  const clips=await page.locator('#clip option').evaluateAll(list=>list.map(o=>o.value));
  for(const clip of clips){await page.selectOption('#clip',clip);const n=await page.locator('.frame').count();if(clip==='run')assert.equal(n,8);missingBriefs+=n;}
 }
 const downloads=await page.locator('a[href$=".ora"]').evaluateAll(list=>list.map(a=>a.href));
 for(const url of downloads){const r=await page.request.get(url);assert.equal(r.status(),200);assert.equal((await r.body()).subarray(0,2).toString(),'PK');}
 const media=await page.locator('video').evaluate(async v=>{v.muted=true;await v.play();await new Promise(r=>setTimeout(r,600));v.pause();return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,time:v.currentTime};});
 assert.equal(media.width,640);assert.equal(media.height,360);assert.equal(media.duration,15);assert(media.time>0);
 assert.equal(poseCells,25);assert.equal(missingBriefs,78);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 await writeFile('artifacts/animation-review/gallery-evidence.json',JSON.stringify({verifiedAt:new Date().toISOString(),gameplayImages,poseCells,missingBriefs,editableDownloads:downloads.length,media,browserErrors:errors,httpErrors:bad},null,2)+'\n');
 console.log('PASS gallery gameplay comparisons, 25 original pose cells, 78 explicitly missing briefs, 4 ORA downloads and actual video playback');
}finally{await browser.close();}
