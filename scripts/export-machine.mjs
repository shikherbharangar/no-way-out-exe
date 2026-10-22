import {execFileSync} from 'node:child_process';
import {readFile,writeFile,copyFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const dir=process.env.CAPTURE_DIR||'artifacts/machine';
const run=(command,args)=>execFileSync(command,args,{encoding:'utf8',maxBuffer:8*1024*1024});
const probe=path=>JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path]));
const evidence=JSON.parse(await readFile(`${dir}/browser-evidence.json`,'utf8'));
assert(evidence.final.won&&evidence.final.sector===2);assert.equal(evidence.shots.length,7);assert.deepEqual(evidence.browserErrors,[]);
const source=probe(`${dir}/gameplay.webm`);assert(Number(source.format.duration)>15);assert(source.streams.some(s=>s.codec_type==='audio'));
run('ffmpeg',['-y','-v','error','-i',`${dir}/gameplay.webm`,'-map','0:v:0','-map','0:a:0','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','128k','-movflags','+faststart',`${dir}/gameplay.mp4`]);
run('ffmpeg',['-v','error','-i',`${dir}/gameplay.mp4`,'-f','null','-']);
const encoded=probe(`${dir}/gameplay.mp4`),v=encoded.streams.find(s=>s.codec_type==='video');assert.equal(v.width,640);assert.equal(v.height,360);assert.equal(v.r_frame_rate,'30/1');assert(Math.abs(Number(encoded.format.duration)-Number(source.format.duration))<.2);
await copyFile(`${dir}/05-cooperative-ram.png`,`${dir}/gameplay.png`);
const pngs=(await readdir(dir)).filter(n=>n.endsWith('.png'));
run('python',['-c',`from PIL import Image\nimport sys\nfor path in sys.argv[1:]:\n Image.open(path).verify(); im=Image.open(path); assert im.size==(640,360), (path,im.size); im.load(); assert len(set(im.convert('RGB').getdata()))>128, ('Blank gameplay frame',path)`,...pngs.map(n=>`${dir}/${n}`)]);
const files=[];for(const name of [...pngs,'gameplay.webm','gameplay.mp4']){const data=await readFile(`${dir}/${name}`);files.push({name,bytes:(await stat(`${dir}/${name}`)).size,sha256:createHash('sha256').update(data).digest('hex')});}
await writeFile(`${dir}/media-verification.json`,JSON.stringify({verifiedAt:new Date().toISOString(),sourceDuration:Number(source.format.duration),encodedDuration:Number(encoded.format.duration),videoCodec:v.codec_name,audioCodec:encoded.streams.find(s=>s.codec_type==='audio').codec_name,encodedFrames:Number(v.nb_frames),actualRenderedFrames:evidence.renderedFrames,canvas:[640,360],uncut:true,decodePassed:true,pngsDecoded:pngs.length,files},null,2)+'\n');
console.log(`PASS ${pngs.length} decoded gameplay PNGs; ${encoded.format.duration}s continuous 640x360 H.264/AAC video; full decode and SHA-256 manifest`);
