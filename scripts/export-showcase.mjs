import { execFileSync } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const dir=process.env.CAPTURE_DIR||'artifacts/premium';
const source=`${dir}/gameplay-source.webm`,output=`${dir}/gameplay-15s.mp4`;
const probe=path=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height,nb_frames','-of','json',path],{encoding:'utf8'}));
const evidence=JSON.parse(await readFile(`${dir}/evidence.json`,'utf8'));
assert(evidence.final.won&&evidence.browserErrors.length===0,'Capture must pass before export');
assert(evidence.events.some(e=>e.type==='win'&&e.seconds<15),'The excerpt must include the escape');
const original=probe(source);assert(Number(original.format.duration)>=15,'Source is shorter than 15 seconds');
// Trim a continuous real capture; no compositing, replacement frames, or speed-up.
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',source,'-t','15','-vf','fps=30','-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',output]);
const final=probe(output);assert(Math.abs(Number(final.format.duration)-15)<.05);
const video=final.streams.find(s=>s.codec_name==='h264');assert(video&&Number(video.nb_frames)===450&&video.width===640&&video.height===360);
execFileSync('ffmpeg',['-v','error','-i',output,'-f','null','-']);
const files={};for(const file of await readdir(dir)){if(/\.(png|webm|mp4)$/.test(file)){const bytes=await readFile(`${dir}/${file}`);files[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}}
await writeFile(`${dir}/media-verification.json`,JSON.stringify({source:original,export:final,continuousClip:true,edit:'First 15 seconds; constant 30fps encoding; source audio retained',files},null,2)+'\n');
console.log('PASS 15.000-second H.264/AAC video, 450 decoded frames, 640x360; media SHA-256 manifest written');
