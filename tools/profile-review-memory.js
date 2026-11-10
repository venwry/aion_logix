// Read-only memory regression probe: GitHub requests are mocked in this process.
// No repository file, authorization or remote service is changed.
import fs from 'node:fs';
import {setImmediate} from 'node:timers/promises';
import {GitHubStore} from '../server/github.js';
import {hash,transact,snapshot} from '../server/model.js';
const paths=['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>d+'/'+f));
// Reconstruct the incident fixture (or an explicit --proposals evidence file), even after the author
// commits them. Read the current (larger) history to retain a conservative load.
const fixtureFlag=process.argv.indexOf('--proposals');
const fixture=fixtureFlag<0?'data_storytelling/review_evidence/fixed-required-compositions/proposals.json':process.argv[fixtureFlag+1];
if(!fixture)throw Error('--proposals requires an evidence JSON path');
const pinned=JSON.parse(fs.readFileSync(fixture)).change;
const overrides=new Map();
for(const proposal of pinned)for(const e of proposal.elements){
 const path='data_foundation/'+e.record_type+'.json';
 if(!overrides.has(path))overrides.set(path,JSON.parse(fs.readFileSync(path)));
 const rows=overrides.get(path)[e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(i>=0)rows[i]=e.before;else rows.push(e.before);
}
overrides.set('data_storytelling/change.json',{change:pinned});
const runs=[];
async function run(){
 let blobBytes=0,treeBytes=0,commits=0;
 const store=new GitHubStore({token:'isolated-test-only',repository:'test/repo',fetchImpl:async(url,options)=>{
  const path=new URL(url).pathname.split('/repos/test/repo')[1];let body;
  if(path==='/git/ref/heads/main')body={object:{sha:'before'}};
  else if(path==='/git/commits/before')body={tree:{sha:'old-tree'}};
  else if(path==='/git/trees/old-tree')body={tree:paths.map(path=>({path,sha:Buffer.from(path).toString('hex'),type:'blob'}))};
  else if(path.startsWith('/git/blobs/')){
   if(options.headers.Accept!=='application/vnd.github.raw+json')throw Error('Large JSON blobs must use raw media, without base64 expansion.');
   const file=Buffer.from(path.slice(11),'hex').toString();
   return new Response(overrides.has(file)?JSON.stringify(overrides.get(file)):fs.readFileSync(file));
  }
  else {
   let bytes=0;if(typeof options.body==='string')bytes=Buffer.byteLength(options.body);else for await(const chunk of options.body)bytes+=Buffer.byteLength(chunk);
   if(path==='/git/blobs')blobBytes+=bytes;
   if(path==='/git/trees')treeBytes+=bytes;
   if(path==='/git/commits')commits++;
   body={sha:path==='/git/trees'?'new-tree':'new-commit'};
  }
  return Response.json(body);
 }});
 const previous=await store.read();
 const proposals=previous.files['data_storytelling/change.json'].change.filter(p=>p.category!=='discussion'&&p.category!=='schema'&&p.elements?.length);
 if(!proposals.length)throw Error('The pinned memory fixture must contain concrete proposals.');
 const request={action:'save_review',approvals:proposals.map(p=>({change_id:p.id,proposal_sha256:hash(p)})),removals:[],feedback:[]};
 const result=transact(previous.files,request);await store.save(previous,result.files);
 const responseBytes=Buffer.byteLength(JSON.stringify(snapshot(result.files,'new-commit')));
 runs.push({proposals:proposals.length,request_bytes:Buffer.byteLength(JSON.stringify(request)),uploaded_blob_bytes:blobBytes,tree_request_bytes:treeBytes,response_bytes:responseBytes,commits});
}
for(let i=0;i<3;i++){await run();await setImmediate();}
const peakMiB=Math.ceil(process.resourceUsage().maxRSS/1024);
console.log(JSON.stringify({result:peakMiB<480?'passed':'memory_budget_exceeded',peak_rss_mib:peakMiB,budget_mib:480,render_limit_mib:512,runs},null,2));
if(peakMiB>=480)process.exitCode=1;
