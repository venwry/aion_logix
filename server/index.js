import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {GitHubStore} from './github.js';import {snapshot,transact} from './model.js';
export function createServer({store,accessToken,origins=[],root=process.cwd()}){
 if(!accessToken||accessToken.length<24)throw Error('Set AION_REVIEW_TOKEN to a secret of at least 24 characters.');
 let queue=Promise.resolve();const equal=(a,b)=>{const x=Buffer.from(a||''),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);};
 return http.createServer(async(req,res)=>{
  const origin=req.headers.origin;const allowed=!origin||origins.includes(origin);if(origin&&allowed){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  if(req.method==='OPTIONS'){if(!allowed)return send(403,{error:'Origin not allowed'});res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.writeHead(204);return res.end();}
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/health')return send(200,{ready:true});
  if(pathname.startsWith('/api/')){
   if(!allowed)return send(403,{error:'Origin not allowed'});
   if(!equal(req.headers.authorization,'Bearer '+accessToken))return send(401,{error:'Connect with the backend access key to save authorizations.'});
   try{
    if(pathname==='/api/state'&&req.method==='GET'){await queue;const state=await store.read();return send(200,snapshot(state.files,state.revision));}
    if(pathname==='/api/authorize'&&req.method==='POST'){
     if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON required'});
     let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>256000)return send(413,{error:'Request too large'});}let request;try{request=JSON.parse(body);}catch{return send(400,{error:'Invalid JSON'});}
     const run=queue.then(async()=>{const previous=await store.read();const result=transact(previous.files,request);const revision=result.changed?await store.save(previous,result.files):previous.revision;return snapshot(result.files,revision);});queue=run.catch(()=>{});return send(200,await run);
    }
    return send(404,{error:'Unknown API route'});
   }catch(e){return send(e.status||502,{error:e.message});}
  }
  if(req.method!=='GET')return send(405,{error:'Method not allowed'});
  // Optional static preview, never expose credentials, Git internals or arbitrary directories.
  let name;try{name=decodeURIComponent(pathname).replace(/^\//,'')||'index.html';}catch{return send(400,{error:'Invalid path'});}
  if(name.split('/').some(p=>p==='..'||p.startsWith('.'))||!['archived_no_longer_valid','code','docs','assets','data_foundation','data_storytelling','schemas','index.html','README.md','DATA_MODEL_PRINCIPLES.md'].includes(name.split('/')[0]))return send(404,{error:'Not found'});
  const file=path.join(root,name);if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,{error:'Not found'});
  const mime={'.html':'text/html','.hml':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.md':'text/plain'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
 });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(!process.env.AION_GITHUB_TOKEN)throw Error('Set the server-only AION_GITHUB_TOKEN with Contents read/write permission for the repository.');
 const store=new GitHubStore({token:process.env.AION_GITHUB_TOKEN,repository:process.env.AION_REPOSITORY||'venwry/aion_logix',branch:process.env.AION_BRANCH||'main'});
 const server=createServer({store,accessToken:process.env.AION_REVIEW_TOKEN,origins:(process.env.AION_ALLOWED_ORIGINS||'https://venwry.github.io').split(',').map(x=>x.trim())});
 server.listen(Number(process.env.PORT||8000),process.env.AION_BIND||'127.0.0.1',()=>console.log('Aion review backend is ready.'));
}
