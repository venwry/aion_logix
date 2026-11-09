import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hash,records,transact,validate,get} from '../../server/model.js';
import {createServer} from '../../server/index.js';
function fixture(){
 const files={};for(const dir of ['data_foundation','data_storytelling'])for(const f of fs.readdirSync(dir).filter(n=>n.endsWith('.json')))files[dir+'/'+f]=JSON.parse(fs.readFileSync(dir+'/'+f));
 const proposals=records(files).slice(0,3).map((r,i)=>({id:'change.review_test_'+i,category:'story',title:'Review '+i,reason:'Test review decisions',elements:[{record_type:r.id.split('.')[0],record_id:r.id,before:r,after:{...r,name:r.name+' revised'}}]}));
 files['data_storytelling/change.json'].change=proposals;return {files,proposals};
}
const ref=p=>({change_id:p.id,proposal_sha256:hash(p)});
const feedback=p=>({id:'change_review.mixed_test',...ref(p),text:'Please refine this.',supersedes_id:null});
test('mixed decisions save atomically, replay idempotently and audit removal without authorizing it',()=>{
 const {files,proposals:[a,b,c]}=fixture(),request={action:'save_review',approvals:[ref(a)],removals:[ref(b)],feedback:[feedback(c)]};
 const result=transact(files,request),out=result.files;
 assert.equal(result.changed,true);assert.equal(transact(out,request).changed,false);assert.deepEqual(get(out,'change').map(p=>p.id),[c.id]);
 assert.deepEqual(records(out).find(r=>r.id===a.elements[0].record_id),a.elements[0].after);
 assert.deepEqual(records(out).find(r=>r.id===b.elements[0].record_id),b.elements[0].before);
 assert.deepEqual(get(out,'authorization').filter(r=>r.record_id===b.elements[0].record_id),get(files,'authorization').filter(r=>r.record_id===b.elements[0].record_id));
 const removal=get(out,'authorization_decision').findLast(d=>d.change_id===b.id);assert.equal(removal.action,'remove_change');assert.deepEqual(removal.target,[]);assert.deepEqual(removal.proposal,b);assert.equal(get(out,'change_review').at(-1).change_id,c.id);assert.deepEqual(validate(out).errors,[]);
 assert.throws(()=>transact(out,{action:'approve_changes',changes:[ref(b)]}),/no longer pending/);
 assert.throws(()=>transact(out,{action:'save_review',removals:[ref(a)]}),/no longer pending/);
 const invalid=structuredClone(out);get(invalid,'authorization_decision').at(-1).target=[];assert(validate(invalid).errors.length);
});
test('stale or conflicting decisions reject the complete batch without mutating inputs',()=>{
 const {files,proposals:[a,b,c]}=fixture(),baseline=structuredClone(files);
 for(const request of [
  {approvals:[ref(a)],removals:[{...ref(b),proposal_sha256:'0'.repeat(64)}]},
  {approvals:[ref(a)],removals:[ref(b)],feedback:[{...feedback(c),proposal_sha256:'0'.repeat(64)}]},
  {approvals:[ref(a)],removals:[ref(a)]},
  {removals:[]},
  {removals:'invalid'}
 ]){assert.throws(()=>transact(files,{action:'save_review',...request}));assert.deepEqual(files,baseline);}
 a.elements[0].before={...a.elements[0].before,name:'stale'};
 assert.throws(()=>transact(files,{action:'save_review',approvals:[ref(a)],removals:[ref(b)]}),/before record has changed/);assert.equal(get(files,'change').length,3);
});
test('removal handles stale, schema and rejected proposals, preserving feedback and open annotations',()=>{
 const {files,proposals:[a,b,c]}=fixture(),r=a.elements[0].before;
 let state=transact(files,{action:'save_annotations',entries:[{id:'annotation.withdrawal_test',record_id:r.id,content_sha256:hash(r),supersedes_id:null,state:'open',text:'Unresolved concern'}]}).files;
 const pending=get(state,'change');pending[0].annotation_ids=['annotation.withdrawal_test'];pending[0].elements[0].before={...r,name:'Stale baseline'};pending[1].category='schema';
 state=transact(state,{action:'save_review_feedback',entries:[feedback(pending[2])]}).files;
 const result=transact(state,{action:'save_review',removals:get(state,'change').map(ref)}).files;
 for(const name of ['authorization','annotation','change_review'])assert.deepEqual(get(result,name),get(state,name));assert.deepEqual(records(result),records(state));assert.equal(get(result,'change').length,0);assert.deepEqual(validate(result).errors,[]);
});
test('removal cannot strand a dependent or count as approval of a prerequisite',()=>{
 const {files,proposals:[a,b,c]}=fixture();b.depends_on_change_ids=[a.id];
 assert.throws(()=>transact(files,{action:'save_review',removals:[ref(a)]}),/depends on it/);
 assert.throws(()=>transact(files,{action:'save_review',removals:[ref(a)],approvals:[ref(b)]}),/depends on it/);
 const out=transact(files,{action:'save_review',removals:[ref(a),ref(b)]}).files;
 get(out,'change')[0].depends_on_change_ids=[a.id];assert.throws(()=>transact(out,{action:'approve_changes',changes:[ref(get(out,'change')[0])]}),/required proposal/);
});
test('HTTP mixed review persists once, retries safely and never persists stale removal',async()=>{
 const {files,proposals:[a,b,c]}=fixture();let current=files,saves=0;const token='review-decisions-test-token-24';
 const server=createServer({accessToken:token,store:{read:async()=>({files:current,revision:'base'}),save:async(before,next)=>{current=next;saves++;return 'saved';}}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const url='http://127.0.0.1:'+server.address().port+'/api/authorize',headers={'Content-Type':'application/json',Authorization:'Bearer '+token},request={action:'save_review',approvals:[ref(a)],removals:[ref(b)],feedback:[feedback(c)]};
  assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify({...request,removals:[{...ref(b),proposal_sha256:'0'.repeat(64)}]})})).status,409);assert.equal(saves,0);
  for(let i=0;i<2;i++)assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify(request)})).status,200);assert.equal(saves,1);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
