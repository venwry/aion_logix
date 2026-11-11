import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';
const read = p => JSON.parse(fs.readFileSync(p));
const files = Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.json') && f !== 'authorization_decision.json').map(f => [d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const originalHash=hash(files);
const proposals=read('data_storytelling/review_evidence/cap-london/proposals.json').change;
const queue=files['data_storytelling/change.json'].change;
const ids=new Set();
for(const p of proposals){
 assert.deepEqual(queue.find(q=>q.id===p.id),p);
 for(const e of p.elements){assert(!ids.has(e.record_id));ids.add(e.record_id);assert.deepEqual(records(files).find(r=>r.id===e.record_id)??null,e.before);assert.notDeepEqual(e.before,e.after);assert.notEqual(e.record_type,'actor_relationship');}
}
const req=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.deepEqual(validate(files).errors,[]);
for(const p of proposals){
 const deps=(p.depends_on_change_ids||[]).map(id=>proposals.find(q=>q.id===id));
 if(deps.length)assert.throws(()=>transact(files,req([p])),/required proposal/);
 assert.deepEqual(validate(transact(files,req([...deps,p])).files).errors,[]);
}
const applied=transact(files,req(proposals)).files;
let sequential=files;for(const p of proposals)sequential=transact(sequential,req([p])).files;
const reversed=transact(files,req([...proposals].reverse())).files;
assert.deepEqual(records(applied),records(sequential));
assert.deepEqual([...records(applied)].sort((a,b)=>a.id.localeCompare(b.id)),[...records(reversed)].sort((a,b)=>a.id.localeCompare(b.id)));
const index=new Map(records(applied).map(r=>[r.id,r]));
for(const r of index.values())if(!r.id.startsWith('location.'))assert(!/rovsing|copenhagen|denmark/i.test(JSON.stringify(r)),r.id+' retains abandoned scenario');
assert.equal(index.get('event.cap_acquisition_closed').time.value,'1975-01');
assert.equal(index.get('event.dri_cpm').time.value,'1975-01-12');
assert(index.get('event.dri_cpm').inputs.some(i=>i.event_id==='event.cap_acquisition_closed'));
assert.equal(index.get('event.letwin').time.value,'1977-06-01');
assert.equal(index.get('event.aionix_relocation').time.value,'1978-02-24');
assert.equal(index.get('agreement.cap_acquisition').clauses.find(c=>c.id==='clause.cap_control').value,70);
assert.equal(index.get('agreement.letwin_aion_appointment').clauses.find(c=>c.id==='clause.aion_leadership_balance').value,66.5);
assert.equal(70*0.95,66.5);assert.equal(30*0.95,28.5);assert.equal(66.5+28.5+5,100);
for(const id of ['agreement.logix_share_transfer_1978','software_edition.simple_c_z80','software_edition.abacus'])if(index.has(id))assert.deepEqual(index.get(id),records(files).find(r=>r.id===id));
const beforeDri=records(files).find(r=>r.id==='agreement.dri_cpm');
for(const c of beforeDri.clauses)assert.deepEqual(index.get(beforeDri.id).clauses.find(x=>x.id===c.id),c);
const other=queue.filter(p=>!proposals.some(x=>x.id===p.id)&&p.elements?.length);
assert.deepEqual(validate(transact(files,req([...proposals,...other])).files).errors,[]);
assert.equal(hash(files),originalHash,'Simulation mutated inputs');
console.log(JSON.stringify({result:'passed',proposals:proposals.length,record_operations:ids.size,individual_with_dependencies:'passed',batch_reverse_and_sequential:'passed',existing_concrete_proposal_compatibility:'passed',obsolete_scenario_scan:'passed',foundation_written:false},null,2));
