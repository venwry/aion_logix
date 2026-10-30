import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hash,transact,validate} from '../../server/model.js';
import {createServer} from '../../server/index.js';
function fixture(){
 const files={};for(const dir of ['data_foundation','data_storytelling'])for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.json')))files[dir+'/'+f]=JSON.parse(fs.readFileSync(dir+'/'+f));
 const proposal=(id,record)=>({id:'change.'+id,category:'story',title:id,reason:'Batch test',elements:[{record_type:record.id.split('.')[0],record_id:record.id,before:null,after:record}]});
 const a=proposal('batch_actor',{id:'actor.batch_test',kind:'person',name:'Batch test'});
 const b=proposal('batch_assumption',{id:'assumption.batch_test',kind:'world_premise',statement:'Test premise',scope_ids:['actor.batch_test']});
 const c=proposal('unselected',{id:'actor.unselected',kind:'person',name:'Unselected'});
 files['data_storytelling/change.json']={change:[a,b,c]};
 return {files,a,b,c,request:{action:'approve_changes',changes:[b,a].map(p=>({change_id:p.id,proposal_sha256:hash(p)}))}};
}
test('batch validates combined graph, preserves separate audit decisions and leaves unchecked proposals pending',()=>{
 const {files,a,b,c,request}=fixture(),before=structuredClone(files),result=transact(files,request);
 assert.deepEqual(files,before);assert.deepEqual(validate(result.files).errors,[]);
 assert.deepEqual(result.files['data_storytelling/change.json'].change,[c]);
 const decisions=result.files['data_storytelling/authorization_decision.json'].authorization_decision.slice(-2);
 assert.deepEqual(decisions.map(d=>d.change_id),[b.id,a.id]);assert(decisions.every(d=>d.action==='approve_change'&&d.target.length===1));
 for(const p of [a,b])assert(result.files['data_storytelling/authorization.json'].authorization.some(x=>x.record_id===p.elements[0].record_id&&x.state==='authorized'));
 assert.equal(transact(result.files,request).changed,false);
});
test('one stale hash or before snapshot rejects the entire batch without mutating input',()=>{
 const {files,request}=fixture(),before=structuredClone(files);request.changes[0].proposal_sha256='0'.repeat(64);
 assert.throws(()=>transact(files,request),/has changed/);assert.deepEqual(files,before);
 const f=fixture();f.files['data_foundation/actor.json'].actor.push(f.a.elements[0].after);
 const baseline=structuredClone(f.files);assert.throws(()=>transact(f.files,f.request),/before record/);assert.deepEqual(f.files,baseline);
});
test('empty, duplicate, overlapping and schema selections are rejected',()=>{
 const {files,a,request}=fixture();
 assert.throws(()=>transact(files,{action:'approve_changes',changes:[]}),/Select/);
 assert.throws(()=>transact(files,{...request,changes:[request.changes[0],request.changes[0]]}),/duplicate/);
 const overlap={...structuredClone(a),id:'change.overlap'};files['data_storytelling/change.json'].change.push(overlap);
 assert.throws(()=>transact(files,{action:'approve_changes',changes:[a,overlap].map(p=>({change_id:p.id,proposal_sha256:hash(p)}))}),/overlap/);
 a.category='schema';assert.throws(()=>transact(files,{action:'approve_changes',changes:[{change_id:a.id,proposal_sha256:hash(a)}]}),/schema deployment/);
});
test('missing dependencies fail final validation and completed members can be retried with pending members',()=>{
 const {files,a,b,request}=fixture(),before=structuredClone(files);
 assert.throws(()=>transact(files,{action:'approve_changes',changes:[{change_id:b.id,proposal_sha256:hash(b)}]}),/invalid/);assert.deepEqual(files,before);
 const first=transact(files,{action:'approve_change',change_id:a.id,proposal_sha256:hash(a)});
 const result=transact(first.files,request);assert.deepEqual(validate(result.files).errors,[]);assert.equal(result.files['data_storytelling/change.json'].change.length,1);
});
test('HTTP batch calls persistence once and replay does not create another commit',async()=>{
 const {files,request}=fixture();let current=files,saves=0;const key='test-batch-proposal-key-at-least-24';
 const server=createServer({accessToken:key,store:{read:async()=>({files:current,revision:'base'}),save:async(previous,next)=>{saves++;current=next;return 'one-commit';}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const send=()=>fetch('http://127.0.0.1:'+server.address().port+'/api/authorize',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(request)});
  const response=await send();assert.equal(response.status,200);assert.equal((await response.json()).revision,'one-commit');assert.equal(saves,1);
  assert.equal((await send()).status,200);assert.equal(saves,1);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
