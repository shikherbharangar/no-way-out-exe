// Local TEST fixture only. Render provides TLS termination in the real deployment.
import { createServer } from 'node:https';
import { request } from 'node:http';
import { connect } from 'node:net';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=resolve(process.env.DIST_DIR||'/tmp/nwo-production-dist');
const backend=Number(process.env.BACKEND_PORT||2568),port=Number(process.env.TLS_PORT||4443);
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.json':'application/json'};
const server=createServer({key:await readFile(process.env.TLS_KEY||'/tmp/nwo-deploy-tls/key.pem'),cert:await readFile(process.env.TLS_CERT||'/tmp/nwo-deploy-tls/cert.pem')},async(req,res)=>{
 if(req.url==='/health'){
  const upstream=request({hostname:'127.0.0.1',port:backend,path:'/health'},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  upstream.on('error',()=>{res.writeHead(503);res.end();});upstream.end();return;
 }
 const pathname=decodeURIComponent(new URL(req.url,'https://localhost').pathname);
 const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+'/')){res.writeHead(403);res.end();return;}
 try{const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}
});
let coldUntil=0;
server.on('upgrade',(req,socket,head)=>{
 // Deliberate 503s test waking/retry behavior, then forward real WebSockets.
 if(!coldUntil)coldUntil=Date.now()+Number(process.env.COLD_START_MS||0);
 if(Date.now()<coldUntil){socket.end('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');return;}
 const upstream=connect(backend,'127.0.0.1',()=>{
  upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`+Object.entries(req.headers).map(([k,v])=>`${k}: ${v}\r\n`).join('')+'\r\n');
  if(head.length)upstream.write(head);socket.pipe(upstream);upstream.pipe(socket);
 });
 upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());
});
server.listen(port,'127.0.0.1',()=>console.log(`Local production TLS fixture at https://127.0.0.1:${port}; backend ${backend}`));
