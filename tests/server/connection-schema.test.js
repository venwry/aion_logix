import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GitHubStore} from '../../server/github.js';
import {createServer} from '../../server/index.js';
import {schemaVersion} from '../../code/model-contract.js';

// Exercise the real repository-loading path; fixture manifests must not replace the deployed one.
test('current repository connects through GitHubStore; schema mismatch is distinct from a rejected key',async()=>{
 const paths=['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>dir+'/'+f));
 let manifestOverride,reads=0;
 const store=new GitHubStore({token:'mock-github-token',repository:'test/repo',fetchImpl:async(url,options)=>{
  assert.equal(options.method,'GET','Connection must never write repository data');reads++;
  const path=new URL(url).pathname.split('/repos/test/repo')[1];
  if(path==='/git/ref/heads/main')return Response.json({object:{sha:'fixture-head'}});
  if(path==='/git/commits/fixture-head')return Response.json({tree:{sha:'fixture-tree'}});
  if(path==='/git/trees/fixture-tree')return Response.json({tree:paths.map((path,i)=>({path,type:'blob',sha:String(i)}))});
  if(path.startsWith('/git/blobs/')){
   const file=paths[Number(path.split('/').at(-1))];assert(!file.includes('authorization_decision'),'Connection excludes the audit history');
   if(file==='data_storytelling/manifest.json'&&manifestOverride)return Response.json(manifestOverride);
   return new Response(fs.readFileSync(file));
  }
  throw Error('Unexpected request '+path);
 }});
 const token='local-connection-test-key-only',server=createServer({store,accessToken:token,origins:['https://venwry.github.io']});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port,headers={Authorization:'Bearer '+token,Origin:'https://venwry.github.io'};
 try{
  assert.equal((await fetch(url+'/health').then(r=>r.json())).schema_version,schemaVersion);
  assert.equal((await fetch(url+'/api/state')).status,401);assert.equal(reads,0);
  let response=await fetch(url+'/api/state',{headers});assert.equal(response.status,200,await response.clone().text());
  const state=await response.json();assert.equal(state.revision,'fixture-head');assert(Object.values(state.collections).flat().length>1000);assert(Array.isArray(state.changes.change));
  manifestOverride=JSON.parse(fs.readFileSync('data_storytelling/manifest.json'));manifestOverride.manifest[0].schema_version='stale-version';
  response=await fetch(url+'/api/state',{headers});assert.equal(response.status,502);assert.equal((await response.json()).error,'Schema version mismatch: repository manifest stale-version; backend '+schemaVersion+'. Update the deployment and manifest together.');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
