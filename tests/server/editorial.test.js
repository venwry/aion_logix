import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hash,records,transact,validate} from '../../server/model.js';
import {createServer} from '../../server/index.js';
function fixture(){const files={};for(const dir of ['data_foundation','data_storytelling'])for(const f of fs.readdirSync(dir).filter(n=>n.endsWith('.json')))files[dir+'/'+f]=JSON.parse(fs.readFileSync(dir+'/'+f));const record=records(files)[0];const proposal={id:'change.editorial_test',category:'story',title:'Editorial test',reason:'Test atomic feedback workflow',elements:[{record_type:record.id.split('.')[0],record_id:record.id,before:record,after:{...record,name:record.name+' revised'}}]};files['data_storytelling/change.json'].change=[proposal];return {files,record,proposal};}
const annotation=(record,overrides={})=>({id:'annotation.test_revision_1',record_id:record.id,content_sha256:hash(record),supersedes_id:null,state:'open',text:'Please refine this record.',...overrides});
test('annotation revisions are atomic, idempotent, and leave foundation and authorization untouched',()=>{
 const {files,record}=fixture(),entry=annotation(record),request={action:'save_annotations',entries:[entry]};const result=transact(files,request);
 assert.equal(result.changed,true);assert.equal(transact(result.files,request).changed,false);assert.deepEqual(result.files['data_storytelling/authorization.json'],files['data_storytelling/authorization.json']);assert.deepEqual(records(result.files),records(files));
 const next={...entry,id:'annotation.test_revision_2',supersedes_id:entry.id,text:'More specific feedback'};const second=transact(result.files,{action:'save_annotations',entries:[next]});assert.equal(second.files['data_storytelling/annotation.json'].annotation.length,2);assert.deepEqual(validate(second.files).errors,[]);
 assert.throws(()=>transact(second.files,{action:'save_annotations',entries:[{...next,id:'annotation.stale_revision'}]}),/another session/);
 assert.throws(()=>transact(files,{action:'save_annotations',entries:[entry,{...entry,id:'annotation.duplicate_target'}]}),/duplicate/);assert.equal(files['data_storytelling/annotation.json'].annotation.length,0);
 assert.throws(()=>transact(files,{action:'save_annotations',entries:[{...entry,content_sha256:'0'.repeat(64)}]}),/record has changed/);
 assert.throws(()=>transact(files,{action:'save_annotations',entries:[{...entry,text:'  '}]}),/non-empty/);
 assert.throws(()=>transact(files,{action:'save_annotations',entries:[{...entry,state:'resolved'}]}),/Invalid annotation state/);
});
test('requesting changes binds feedback to the proposal hash and blocks that revision only',()=>{
 const {files,proposal}=fixture(),entry={id:'change_review.test_revision_1',change_id:proposal.id,proposal_sha256:hash(proposal),supersedes_id:null,text:'Please improve the name.'};
 const result=transact(files,{action:'save_review_feedback',entries:[entry]});assert.deepEqual(records(result.files),records(files));assert.deepEqual(result.files['data_storytelling/authorization.json'],files['data_storytelling/authorization.json']);assert.equal(transact(result.files,{action:'save_review_feedback',entries:[entry]}).changed,false);
 assert.throws(()=>transact(result.files,{action:'approve_change',change_id:proposal.id,proposal_sha256:hash(proposal)}),/needs refinement/);
 const next=structuredClone(result.files),revised=next['data_storytelling/change.json'].change[0];revised.reason+=' — refined';assert(transact(next,{action:'approve_change',change_id:revised.id,proposal_sha256:hash(revised)}).changed);
 assert.throws(()=>transact(next,{action:'save_review_feedback',entries:[{...entry,id:'change_review.stale_revision',supersedes_id:entry.id}]}),/proposal has changed/);
});
test('linked annotations resolve only after approval, and newer feedback is never silently resolved',()=>{
 const {files,record,proposal}=fixture(),entry=annotation(record);let state=transact(files,{action:'save_annotations',entries:[entry]}).files;
 const p=state['data_storytelling/change.json'].change[0];p.annotation_ids=[entry.id];const result=transact(state,{action:'approve_change',change_id:p.id,proposal_sha256:hash(p)});assert.equal(result.files['data_storytelling/annotation.json'].annotation.at(-1).state,'resolved');assert.deepEqual(result.files['data_storytelling/annotation.json'].annotation.at(-1).change_ids,[proposal.id]);assert.deepEqual(validate(result.files).errors,[]);
 state=transact(state,{action:'save_annotations',entries:[{...entry,id:'annotation.newer_revision',supersedes_id:entry.id,text:'Additional concern'}]}).files;
 const newer=transact(state,{action:'approve_change',change_id:p.id,proposal_sha256:hash(p)});assert.equal(newer.files['data_storytelling/annotation.json'].annotation.at(-1).state,'open');
});
test('dependencies and stale annotation baselines reject the entire operation',()=>{
 const {files,proposal}=fixture();proposal.depends_on_change_ids=['change.missing'];assert.throws(()=>transact(files,{action:'approve_change',change_id:proposal.id,proposal_sha256:hash(proposal)}),/required proposal/);
 const rs=records(files).slice(0,2),entries=rs.map((r,i)=>annotation(r,{id:'annotation.batch_entry_'+i}));entries[1].supersedes_id='annotation.missing';assert.throws(()=>transact(files,{action:'save_annotations',entries}),/another session/);assert.equal(files['data_storytelling/annotation.json'].annotation.length,0);
});
test('feedback HTTP endpoint authenticates, persists once, and exposes saved revisions',async()=>{
 const {files,record}=fixture();let current=files,saves=0;const token='editorial-test-token-at-least-24';
 const server=createServer({accessToken:token,store:{read:async()=>({files:current,revision:'base'}),save:async(before,next)=>{current=next;saves++;return 'saved';}}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const url='http://127.0.0.1:'+server.address().port+'/api/feedback',body=JSON.stringify({action:'save_annotations',entries:[annotation(record)]}),headers={'Content-Type':'application/json',Authorization:'Bearer '+token};assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body})).status,401);let r=await fetch(url,{method:'POST',headers,body});assert.equal(r.status,200);assert.equal((await r.json()).annotations.length,1);assert.equal((await fetch(url,{method:'POST',headers,body})).status,200);assert.equal(saves,1);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
