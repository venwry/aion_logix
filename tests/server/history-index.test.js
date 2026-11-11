import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {GitHubStore} from '../../server/github.js';import {hash,transact} from '../../server/model.js';
const fixture=()=>Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[`${d}/${f}`,JSON.parse(fs.readFileSync(`${d}/${f}`))])));
test('indexed history is not downloaded, new decisions are sharded atomically, and retries use the index',async()=>{
 const files=fixture(),old=files['data_storytelling/authorization_decision.json'];const idx=files['data_storytelling/authorization_decision_index.json'];
 files['data_storytelling/authorization.json'].authorization=files['data_storytelling/authorization.json'].authorization.filter(a=>a.record_id!==files['data_foundation/event.json'].event[0].id);
 const paths=Object.keys(files),calls=[],uploaded=[];let active=0,maxActive=0;
 const store=new GitHubStore({token:'test',repository:'test/repo'});
 store.api=async(path,method='GET',body)=>{
  calls.push([path,method]);if(path==='/git/ref/heads/main')return {object:{sha:'head'}};if(path==='/git/commits/head')return {tree:{sha:'tree'}};
  if(path==='/git/trees/tree?recursive=1')return {tree:paths.map((p,i)=>({path:p,type:'blob',sha:String(i)}))};
  if(path.startsWith('/git/blobs/')&&method==='GET'){active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setImmediate(r));active--;return files[paths[Number(path.split('/').at(-1))]];}
  if(path==='/git/blobs'&&method==='POST'){let raw='';for await(const chunk of body)raw+=chunk;uploaded.push(JSON.parse(JSON.parse(raw).content));return {sha:'blob'+uploaded.length};}
  if(path==='/git/trees'&&method==='POST'){store.createdTree=body;return {sha:'newtree'};}if(path==='/git/commits')return {sha:'newhead'};return {};
 };
 const previous=await store.read();assert.equal(maxActive,1);assert(!calls.some(([p])=>p==='/git/blobs/'+paths.indexOf('data_storytelling/authorization_decision.json')));assert.equal(previous.files['data_storytelling/authorization_decision.json'].authorization_decision.length,0);
 const record=previous.files['data_foundation/event.json'].event[0];const result=transact(previous.files,{action:'authorize_record',record_id:record.id,content_sha256:hash(record)});assert(result.changed);
 await store.save(previous,result.files);const tree=store.createdTree.tree;const shard=tree.find(x=>x.path.startsWith('data_storytelling/authorization_decisions/'));assert(shard);assert(!tree.some(x=>x.path==='data_storytelling/authorization_decision.json'));
 const indexBlob=uploaded[Number(tree.find(x=>x.path==='data_storytelling/authorization_decision_index.json').sha.slice(4))-1];assert.equal(indexBlob.authorization_decision_index.length,idx.authorization_decision_index.length+1);assert.equal(indexBlob.authorization_decision_index.at(-1).path,shard.path);
 const shardBlob=uploaded[Number(shard.sha.slice(4))-1];assert.equal(shardBlob.authorization_decision.length,1);assert.equal(old.authorization_decision.length,idx.authorization_decision_index.length);
 const prior=idx.authorization_decision_index.find(d=>d.action==='approve_change');const replay=transact(previous.files,{action:'approve_change',change_id:prior.change_id,proposal_sha256:prior.proposal_sha256});assert.equal(replay.changed,false);
});
test('existing audit index faithfully maps the preserved historical decisions',()=>{
 const history=JSON.parse(fs.readFileSync('data_storytelling/authorization_decision.json')).authorization_decision;
 const index=JSON.parse(fs.readFileSync('data_storytelling/authorization_decision_index.json')).authorization_decision_index;
 const archive=index.filter(x=>x.path==='data_storytelling/authorization_decision.json');
 assert.deepEqual(archive,history.map(d=>({...Object.fromEntries(['id','action','change_id','proposal_sha256'].filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]])),path:'data_storytelling/authorization_decision.json'})));
 for(const row of index.filter(x=>x.path!=='data_storytelling/authorization_decision.json')){const data=JSON.parse(fs.readFileSync(row.path)).authorization_decision;assert(data.some(d=>d.id===row.id&&d.action===row.action&&d.change_id===row.change_id&&d.proposal_sha256===row.proposal_sha256));}
});
