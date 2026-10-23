import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const output=process.env.CAPTURE_DIR||'artifacts/premium';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],badResponses=[],assets=new Set();
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badResponses.push({url:r.url(),status:r.status()});if(r.ok()&&r.url().endsWith('.png'))assets.add(new URL(r.url()).pathname);});
try{
 await page.goto('http://127.0.0.1:4173');await page.click('#play');await page.click('#start');await page.waitForTimeout(500);
 expect(await page.evaluate(()=>typeof window.__prison)).toBe('undefined');
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(900);await page.keyboard.up('ArrowRight');await page.keyboard.press('ControlRight');await page.waitForTimeout(400);
 await mkdir(output,{recursive:true});await page.screenshot({path:`${output}/production.png`});
 await page.keyboard.press('Escape');await expect(page.locator('#resume')).toBeVisible();await page.click('#resume');await expect(page.locator('#pause')).toBeVisible();
 expect(errors).toEqual([]);expect(badResponses).toEqual([]);expect(assets.size).toBeGreaterThanOrEqual(16);
 for(const name of ['zip','brick','guard','explosion','smoke','debris','prison-composition','machine-composition','machine-depth','machine-foreground','machine-props'])expect(assets.has(`/assets/${name}.png`)).toBe(true);
 for(const name of ['zip','brick','guard','explosion','props','tiles','architecture','depth','gate','freight'])expect(assets.has(`/assets/reboot-${name}.png`)).toBe(true);
 await writeFile(`${output}/production-evidence.json`,JSON.stringify({verifiedAt:new Date().toISOString(),browserErrors:errors,badResponses,assets:[...assets],developmentHookAbsent:true,pauseResume:true},null,2)+'\n');
 console.log(`PASS production UI/input/pause, ${assets.size} PNG assets, no browser/HTTP errors, inspection hook absent`);
}finally{await browser.close();}
