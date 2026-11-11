import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {indexProductLaunches} from '../code/product-launches.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const fingerprint=hash(files),before=new Map(records(files).map(r=>[r.id,r]));
const root='data_storytelling/review_evidence/launch-agreement-corrections/';const proposals=read(root+'proposals.json').change,audit=read(root+'audit.json');
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.equal(proposals.length,3);assert.deepEqual(validate(files).errors,[]);
const touched=new Set();
for(const p of proposals){
 assert.deepEqual(files['data_storytelling/change.json'].change.find(q=>q.id===p.id),p);
 for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,before.get(e.record_id));assert.notDeepEqual(e.before,e.after);}
 assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
}
const result=transact(files,request(proposals)).files;
assert.deepEqual(validate(result).errors,[]);assert.deepEqual(records(result),records(transact(files,request([...proposals].reverse())).files));
let sequential=files;for(const p of [...proposals].reverse())sequential=transact(sequential,request([p])).files;assert.deepEqual(records(result),records(sequential));
const after=new Map(records(result).map(r=>[r.id,r]));
for(const r of after.values())if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));
for(const p of proposals.slice(0,2))for(const e of p.elements){
 const expected=structuredClone(e.before);
 if(e.record_type==='product'){
  expected.launch_event_id=p===proposals[0]?'event.academy_launch':'event.aurelia_developer_presentation';
  if(expected.composition_history?.length)expected.composition_history[0].effective_from.event_id=expected.launch_event_id;
  assert.equal(e.after.launch_campaign_id,e.before.launch_campaign_id);
 }else expected.kind='launch';
 assert.deepEqual(e.after,expected);
}
for(const row of audit.agreements){
 const refs=[...after.values()].filter(r=>r.agreement_id===row.agreement_id).map(r=>r.id);
 assert.deepEqual(refs,row.signing_or_acceptance_event_id?[row.signing_or_acceptance_event_id]:[]);
 if(refs.length)assert(refs[0].startsWith('event.'));
 assert.deepEqual(after.get(row.agreement_id),before.get(row.agreement_id));
}
assert.equal(audit.agreements.length,[...after.keys()].filter(id=>id.startsWith('agreement.')).length);
for(const e of proposals[2].elements){
 const expected=structuredClone(e.before);delete expected.agreement_id;
 if(e.record_id==='event.bpi_cooperation')for(const o of expected.outcomes)o.description=o.description.replace('17 July 1978','16 June 1978');
 assert.deepEqual(e.after,expected);
}
const launches=indexProductLaunches(after.values());
assert.equal(launches.get('event.academy_launch').length,5);
assert.equal(launches.get('event.aurelia_developer_presentation').length,4);
assert.equal(launches.get('event.aurelia_launch').length,15);
assert.equal(after.get('event.aurelia_developer_presentation').kind,'launch');
assert.equal(hash(files),fingerprint);
console.log(JSON.stringify({result:'passed',proposals:3,record_operations:touched.size,agreements_audited:audit.agreements.length,agreement_links_removed:proposals[2].elements.length,individual_batch_reverse_and_sequential:'passed',live_foundation_and_authorization:'unchanged'},null,2));
