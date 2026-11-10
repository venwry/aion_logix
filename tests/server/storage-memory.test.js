import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GitHubStore} from '../../server/github.js';
import {blobBody,jsonChunks} from '../../server/json-stream.js';
import {stageFiles} from '../../server/staging.js';
const readBody=async body=>{let text='';for await(const chunk of body)text+=chunk;return JSON.parse(text);};
test('streamed blob content exactly preserves JSON formatting, escaping and Unicode',()=>{
 const fixtures=[{},[],{empty:[],nested:{quote:'"\\\n\t',unicode:'Zażółć 😀 𝄞',lone:'\ud800'},values:[null,true,false,1.23,-0,1e30,Infinity],ignored:undefined},Array.from({length:1000},(_,i)=>({i,text:'汉字 😀 '+i}))];
 for(const value of fixtures){
  const expected=JSON.stringify(value,null,2)+'\n';assert.equal([...jsonChunks(value,3)].join(''),expected);
  const encoded=JSON.parse([...blobBody(value)].join(''));assert.deepEqual(encoded,{encoding:'utf-8',content:expected});
 }
});
test('staging isolates edits and appends while reusing immutable audit entries',()=>{
 const old=Object.freeze({id:'decision.old',target:Object.freeze([])});
 const input={'data_storytelling/authorization_decision.json':{authorization_decision:[old]},'data_foundation/actor.json':{actor:[{id:'actor.test',name:'Before'}]}};
 const next=stageFiles(input);assert.equal(next['data_storytelling/authorization_decision.json'].authorization_decision[0],old);
 next['data_storytelling/authorization_decision.json'].authorization_decision.push({id:'decision.new'});next['data_foundation/actor.json'].actor[0].name='After';
 assert.equal(input['data_storytelling/authorization_decision.json'].authorization_decision.length,1);assert.equal(input['data_foundation/actor.json'].actor[0].name,'Before');
});
test('changed files stream sequentially into blobs and one atomic tree/commit/ref update',async()=>{
 const calls=[],documents=new Map(),store=new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:async(url,options)=>{
  const path=new URL(url).pathname.split('/repos/test/repo')[1];
  let body;if(path==='/git/blobs'){
   assert.equal(options.duplex,'half');assert.notEqual(typeof options.body,'string');body=await readBody(options.body);
   const sha=createHash('sha256').update(body.content).digest('hex');documents.set(sha,body.content);calls.push({path,sha});return Response.json({sha});
  }
  body=JSON.parse(options.body);calls.push({path,body});return Response.json({sha:path==='/git/trees'?'tree-new':'commit-new'});
 }});
 const previous={revision:'head-old',tree:'tree-old',files:{'data_storytelling/authorization_decision.json':{authorization_decision:[{id:'old'}]},'data_foundation/actor.json':{actor:[]},'unchanged.json':{a:1,b:2}}};
 const next={...previous.files,'data_storytelling/authorization_decision.json':{authorization_decision:[{id:'old'},{id:'new'}]},'data_foundation/actor.json':{actor:[{id:'actor.new'}]},'unchanged.json':{b:2,a:1}};
 assert.equal(await store.save(previous,next),'commit-new');assert.equal(calls.filter(c=>c.path==='/git/blobs').length,2);
 const tree=calls.find(c=>c.path==='/git/trees').body;assert.equal(tree.base_tree,'tree-old');
 for(const entry of tree.tree){assert(!('content' in entry));assert.equal(documents.get(entry.sha),JSON.stringify(next[entry.path],null,2)+'\n');}
 assert.deepEqual(calls.find(c=>c.path==='/git/commits').body.parents,['head-old']);assert.deepEqual(calls.at(-1).body,{sha:'commit-new',force:false});
 const count=calls.length;assert.equal(await store.save(previous,previous.files),'head-old');assert.equal(calls.length,count);
});
test('a failed blob upload never creates a tree, commit or branch update',async()=>{
 let calls=0;const store=new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:async()=>{calls++;return Response.json({message:'Unavailable'},{status:503});}});
 await assert.rejects(store.save({revision:'old',files:{}},{'new.json':{value:1}}),/HTTP 503/);assert.equal(calls,1);
});

test('streamed blob request works over HTTP with the native fetch implementation',async()=>{
 const {createServer}=await import('node:http');let received;
 const server=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  received=JSON.parse(body);res.writeHead(201,{'Content-Type':'application/json'});res.end(JSON.stringify({sha:'uploaded'}));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const {Readable}=await import('node:stream');
  const store=new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:(_,options)=>fetch('http://127.0.0.1:'+server.address().port,options)});
  const value={example:['Unicode 😀','quoted "value"','x'.repeat(100000)]};
  assert.deepEqual(await store.api('/git/blobs','POST',Readable.from(blobBody(value))),{sha:'uploaded'});
  assert.equal(received.content,JSON.stringify(value,null,2)+'\n');assert.equal(received.encoding,'utf-8');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('422 blob failure identifies upload rather than inventing a branch conflict',async()=>{
 let calls=0;
 const store=new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:async()=>{calls++;return Response.json({message:'Validation Failed'},{status:422});}});
 await assert.rejects(store.save({revision:'old',files:{}},{'new.json':{value:1}}),e=>e.status===502&&/upload repository file \(HTTP 422\): Validation Failed/.test(e.message));
 assert.equal(calls,1);
});
test('only an explicit non-fast-forward ref rejection asks to reload',async()=>{
 const store=message=>new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:async()=>Response.json({message},{status:422})});
 await assert.rejects(store('Update is not a fast forward').api('/git/refs/heads/main','PATCH',{sha:'new',force:false}),e=>e.status===409&&/branch changed/.test(e.message));
 await assert.rejects(store('Protected branch update failed').api('/git/refs/heads/main','PATCH',{sha:'new',force:false}),e=>e.status===502&&/update branch.*Protected branch/.test(e.message));
 await assert.rejects(store('Validation Failed').api('/git/commits','POST',{}),/create save commit.*Validation Failed/);
});
test('non-JSON upstream errors retain the failed operation and HTTP status',async()=>{
 const store=new GitHubStore({token:'test-only',repository:'test/repo',fetchImpl:async()=>new Response('upstream unavailable',{status:503})});
 await assert.rejects(store.api('/git/trees','POST',{}),/create repository tree \(HTTP 503\)/);
});
