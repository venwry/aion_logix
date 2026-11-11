import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasetPath,datasets} from '../code/model-contract.js';
import {resolvePoint} from '../code/temporal.js';
import {timelineTree} from '../code/timeline-layout.js';
import {timing} from '../code/shared.js';
const read=p=>JSON.parse(fs.readFileSync(p));
// Match the server's current write model: indexed history plus new decision tail.
const files=Object.fromEntries([...datasets.map(datasetPath),...['authorization','authorization_decision_index','annotation','change_review','change'].map(n=>'data_storytelling/'+n+'.json')].map(p=>[p,read(p)]));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const initialHash=hash(files),queue=files['data_storytelling/change.json'].change;
const proposals=read('data_storytelling/review_evidence/campaign-timelines/proposals.json').change;
const index=new Map(records(files).map(r=>[r.id,r]));
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.equal(proposals.length,12);assert.deepEqual(validate(files).errors,[]);
const affected=new Set();
for(const p of proposals){
 assert.deepEqual(queue.find(q=>q.id===p.id),p);
 for(const e of p.elements){assert(!affected.has(e.record_id));affected.add(e.record_id);assert.deepEqual(e.before,index.get(e.record_id));}
 const {before,after}=p.elements[0],execution=index.get(before.process_id);
 assert.deepEqual(after.period,Object.fromEntries(Object.entries(execution.period).map(([k,v])=>[k,resolvePoint(v,index)])));
 for(const field of ['process_id','launch_event_id','claim_policy','presentation','marketing_content','subject_ids','booth'])assert(!Object.hasOwn(after,field));
 assert(after.marketing_steps.every(s=>!Object.hasOwn(s,'reference_id')));
 if(p.elements.length===2){const parent=p.elements[1];assert.deepEqual(parent.after.steps.slice(0,-1),parent.before.steps);assert.equal(parent.after.steps.at(-1).campaign_id,after.id);const stripped=structuredClone(parent.after);stripped.steps=parent.before.steps;assert.deepEqual(stripped,parent.before);}
 const result=transact(files,request([p])).files;assert.deepEqual(validate(result).errors,[],p.id);
}
const apply=ps=>transact(files,request(ps)).files;
const batch=apply(proposals),reverse=apply([...proposals].reverse());assert.deepEqual(records(batch),records(reverse));
let sequential=files;for(const p of [...proposals].reverse())sequential=transact(sequential,request([p])).files;
assert.deepEqual(records(batch),records(sequential));
const finalRecords=records(batch),finalIndex=new Map(finalRecords.map(r=>[r.id,r]));
for(const record of finalRecords)if(!affected.has(record.id))assert.deepEqual(record,index.get(record.id));
const tree=timelineTree(finalRecords.filter(r=>/^(event|process|campaign)\./.test(r.id)).map(record=>({record,type:record.id.split('.')[0],date:timing(record,finalIndex)})));
for(const p of proposals){const c=p.elements[0];assert(tree.nodes.has(c.after.id));assert(tree.nodes.has(c.before.process_id));assert.equal(tree.nodes.get(c.after.id).members.length,1);assert.equal(tree.nodes.get(c.after.id).children.length,0);if(p.elements[1])assert.equal(tree.nodes.get(c.after.id).parent,p.elements[1].record_id);}
assert.equal(hash(files),initialHash);
console.log('Verified 12 independent, batch and reverse-sequential campaign approvals; parent steps, dates, launch links and all untouched records preserved. No live data or authorization written.');
