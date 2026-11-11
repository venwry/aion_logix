import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';

const read=p=>JSON.parse(fs.readFileSync(p));
const root='data_storytelling/review_evidence/ssg-abacus-feedback/';
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d)
  .filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json')
  .map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
// The real committed decision index satisfies prerequisites already approved
// by the author without loading all immutable decision payloads into memory.
const originalHash=hash(files);
const revised=read(root+'proposals.json').change;
const old=read(root+'before-proposal.json');
const feedback=read(root+'feedback.json');
const queue=files['data_storytelling/change.json'].change;
const baseline=new Map(records(files).map(r=>[r.id,r]));
assert.equal(hash(old),feedback.proposal_sha256);
assert.notEqual(hash(revised[0]),hash(old));
assert.equal(revised[0].id,old.id);
assert.deepEqual(revised[0].elements.map(e=>e.before),old.elements.map(e=>e.before));
assert.deepEqual(revised[0].elements.find(e=>e.record_id==='software_edition.abacus_2'),old.elements.find(e=>e.record_id==='software_edition.abacus_2'));
assert.deepEqual(validate(files).errors,[]);
for(const p of revised){
  assert.deepEqual(queue.find(q=>q.id===p.id),p);
  for(const e of p.elements)assert.deepEqual(e.before,baseline.get(e.record_id)??null);
}
const req=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of revised)assert.deepEqual(validate(transact(files,req([p])).files).errors,[]);
const batch=transact(files,req(revised)).files;
let sequential=files;
for(const p of [...revised].reverse())sequential=transact(sequential,req([p])).files;
assert.deepEqual(records(batch),records(sequential));
const all=queue.filter(p=>p.category!=='discussion'&&p.elements?.length);
const complete=transact(files,req([...all].reverse())).files;
assert.deepEqual(validate(complete).errors,[]);
const index=new Map(records(complete).map(r=>[r.id,r]));
for(const id of ['software_edition.abacus_1','software_edition.abacus_1.model_ii']){
  const r=index.get(id);
  for(const v of r.composition_history){
    assert(!Object.hasOwn(v.technical_definition,'programmatic_file_access'));
    assert(!v.technical_definition.features.some(f=>/forms|layout|formatted|Pulse/i.test(f)));
    assert.match(v.technical_definition.data_interchange.contract,/ordinary worksheet cells/);
  }
  assert(!JSON.stringify(r).includes('Pulse'));
  assert.match(r.technical_specification.chapters[1].description,/accounting_export_id/);
}
assert.match(JSON.stringify(index.get('software_edition.abacus_2')),/Pulse/);
assert(!index.has('event.bpi_pilot'));
assert(!JSON.stringify(records(complete)).includes('event.bpi_pilot'));
assert.equal(index.get('process.ssg_general_ledger_port').steps.length,baseline.get('process.ssg_general_ledger_port').steps.length-1);
assert(index.get('process.ssg_general_ledger_port').steps.some(s=>/error\/recovery tests/.test(s.description)));
const touched=new Set(revised.flatMap(p=>p.elements.map(e=>e.record_id)));
for(const r of records(batch))if(!touched.has(r.id))assert.deepEqual(r,baseline.get(r.id));
assert.equal(hash(files),originalHash);
console.log(JSON.stringify({result:'passed',revised_proposal:'change.ssg_abacus_early',new_proposal:'change.ssg_remove_pilot',before_snapshots_and_feedback:'preserved',individual_batch_reverse_and_remaining_proposals:'passed',abacus_1_scope:'passed',abacus_2_preserved:true,pilot_event_and_references_removed_in_simulation:true,foundation_written:false},null,2));
