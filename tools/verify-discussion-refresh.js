// Verify this pinned editorial refresh without changing authorization or story data.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,validate} from '../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='data_storytelling/review_evidence/discussion-refresh/';
const baseline=read(root+'baseline.json'),assessment=read(root+'assessment.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
assert.deepEqual(validate(files).errors,[]);
const index=new Map(records(files).map(r=>[r.id,r]));
const queue=files['data_storytelling/change.json'].change;
assert.equal(baseline.queue.change.length,27);assert.equal(queue.length,26);
assert.deepEqual(baseline.queue.change.filter(old=>!queue.some(p=>p.id===old.id)).map(p=>p.id),assessment.removed);
for(const p of queue){
 assert.equal(p.category,'discussion');assert.deepEqual(p.elements,[]);
 assert(baseline.queue.change.some(old=>old.id===p.id),'unexpected new proposal');
 for(const id of p.affected_record_ids)assert(index.has(id),'missing record '+id);
 for(const f of p.findings){
  if(!f.record_id)continue;
  assert(p.affected_record_ids.includes(f.record_id));
  let value=index.get(f.record_id);
  if(f.path)for(const token of f.path.slice(1).split('/')){const key=token.replaceAll('~1','/').replaceAll('~0','~');assert(value!==null&&value!==undefined&&Object.hasOwn(value,key),f.record_id+f.path);value=value[key];}
 }
}
const auth=new Map(files['data_storytelling/authorization.json'].authorization.map(a=>[a.record_id,a]));
const pending=[...index.values()].filter(r=>auth.get(r.id)?.state!=='authorized'||auth.get(r.id)?.content_sha256!==hash(r)).map(r=>r.id).sort();
assert.deepEqual(queue.find(p=>p.id==='change.closeout_authorization_coverage').affected_record_ids,pending);
const relocation=index.get('event.aionix_relocation');assert.equal(relocation.time.value,'1978-02-24');assert(index.get('process.aionix_development').steps.some(s=>s.event_id===relocation.id));
assert(!queue.some(p=>p.id==='change.closeout_aionix_relocation'));
for(const [p,digest] of Object.entries(baseline.protected_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),digest,'protected file changed '+p);
console.log(JSON.stringify({result:'passed',reviewed:27,removed:1,remaining:queue.length,findings:queue.reduce((n,p)=>n+p.findings.length,0),pending_authorizations:pending.length,all_record_ids_and_finding_paths_resolve:true,foundation_authorization_and_feedback_unchanged:true},null,2));
