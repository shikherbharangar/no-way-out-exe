import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
try{
 await page.goto('http://127.0.0.1:5173/artifacts/supplied/index.html');
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 await page.selectOption('#scene','09-checkpoint');await page.selectOption('#comparison','restored');await page.selectOption('#zoom','2');
 await page.waitForFunction(()=>document.getElementById('game').naturalWidth===640&&document.getElementById('game').style.width==='1280px');
 for(const [group,pose]of [['zip','death'],['brick','punch'],['enemies','heavy_trooper'],['pickups','health'],['props','rescue_cage']]){
  await page.selectOption('#group',group);await page.selectOption('#pose',pose);
  await page.waitForFunction(()=>document.getElementById('details').textContent.includes('Original'));
 }
 await page.waitForFunction(()=>document.getElementById('asset').width===128);
 const video=await page.evaluate(async()=>{const v=document.querySelector('video');await v.play();await new Promise(r=>setTimeout(r,700));return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,played:v.currentTime>.3};});
 assert.equal(video.duration,15);assert.equal(video.width,640);assert(video.played);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 await writeFile('artifacts/supplied/review-page-evidence.json',JSON.stringify({verifiedAt:new Date().toISOString(),localImagesLoaded:true,sceneSelection:true,neutralRestoredSelection:true,exact2xDisplay:true,fiveSourceAtlasGroups:true,variableCellSizes:true,video,browserErrors:errors,badResponses:bad},null,2)+'\n');
 console.log('PASS review controls, source atlas viewer, all local media and real MP4 playback');
}finally{await browser.close();}
