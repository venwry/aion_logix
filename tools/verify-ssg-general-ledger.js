import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';
import {validateCatalogueProduct} from './validate-catalogue.js';

const read = p => JSON.parse(fs.readFileSync(p));
// Retained historical decisions are not needed to simulate new proposals. This
// bounds validation memory without writing or changing the real audit files.
const files = Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d => fs.readdirSync(d)
  .filter(f => f.endsWith('.json') && !f.startsWith('authorization_decision'))
  .map(f => [d+'/'+f, read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json'] = {authorization_decision: []};
const initialHash = hash(files);
const proposals = read('data_storytelling/review_evidence/ssg-general-ledger/proposals.json').change;
const baseline = new Map(records(files).map(r => [r.id,r]));
const queue = files['data_storytelling/change.json'].change;
const touched = new Set();
const req = ps => ({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const byId = new Map(proposals.map(p=>[p.id,p]));
const closure = p => {
  const ids = new Set();
  function visit(q) { for(const id of q.depends_on_change_ids || []) visit(byId.get(id)); ids.add(q.id); }
  visit(p); return proposals.filter(q=>ids.has(q.id));
};
assert.deepEqual(validate(files).errors,[],'Baseline invalid');
for(const p of proposals) {
  assert.deepEqual(queue.find(q=>q.id===p.id),p);
  assert(Buffer.byteLength(JSON.stringify(p)) < 100000, p.id+' exceeds compact review budget');
  for(const e of p.elements) {
    assert(!touched.has(e.record_id),'Overlapping target '+e.record_id); touched.add(e.record_id);
    assert.deepEqual(e.before,baseline.get(e.record_id)??null);
    assert.notDeepEqual(e.before,e.after);
    assert.notEqual(e.record_type,'actor_relationship');
  }
  if(p.depends_on_change_ids?.length)assert.throws(()=>transact(files,req([p])),/required proposal/);
  assert.deepEqual(validate(transact(files,req(closure(p))).files).errors,[],p.id);
}
let sequential=files;
for(const p of proposals)sequential=transact(sequential,req([p])).files;
const batch=transact(files,req(proposals)).files;
const reverse=transact(files,req([...proposals].reverse())).files;
const sorted = f=>records(f).sort((a,b)=>a.id.localeCompare(b.id));
assert.deepEqual(sorted(sequential),sorted(batch));
assert.deepEqual(sorted(reverse),sorted(batch));
const index=new Map(records(batch).map(r=>[r.id,r]));
for(const r of index.values())if(r.id.startsWith('product.'))assert.deepEqual(validateCatalogueProduct(r),[],r.id);
for(const r of records(batch))if(!touched.has(r.id))assert.deepEqual(r,baseline.get(r.id));
assert.equal(index.get('event.bpi_offer').time.value,'1977-07-28');
assert.equal(index.get('event.bpi_cooperation').time.value,'1977-08-12');
assert.equal(index.get('event.ssg_cbasic_release').time.value,'1978-01-15');
assert.equal(index.get('event.aurelia_developer_presentation').time.value,'1978-06-06');
assert(!index.has('event.bpi_launch'));
assert.equal(index.get('actor.bpi').name,'Structured Systems Group');
assert.equal(index.get('agreement.bpi_offer').party.some(p=>p.actor_id==='actor.academy'),false,'Academy did not yet exist in July 1977');
assert.equal(index.get('agreement.bpi_offer').clauses.some(c=>c.kind==='equity'),false);
assert.equal(index.get('software_edition.bpi_suite').composition_history[0].technical_definition.modules.length,1);
assert.equal(index.get('software_edition.bpi_suite.era').composition_history[0].technical_definition.modules.length,1);
assert.equal(index.get('product.proposed_aurelia_accounts').launch_event_id,'event.aurelia_developer_presentation');
assert.equal(index.get('software_edition.bpi_suite').composition_history[0].effective_from.event_id,'event.aurelia_developer_presentation');
assert.equal(index.get('software_edition.simple_c_z80').composition_history[0].effective_from.event_id,'event.aurelia_developer_presentation');
assert(!index.get('campaign.ncc1978').marketing_steps.some(s=>s.id==='bpi-session'));
assert.equal(index.get('campaign.ncc1978').marketing_steps.filter(s=>s.reference_id==='event.aurelia_developer_presentation').length,1);
assert.equal(index.get('event.academy_launch').time.value,'1978-06-16');
const bad=[];
function scan(v,path) {
  if(Array.isArray(v))return v.forEach((x,i)=>scan(x,path+'/'+i));
  if(v&&typeof v==='object')return Object.entries(v).forEach(([k,x])=>scan(x,path+'/'+k));
  if(typeof v!=='string')return;
  // Lowercase bpi inside stable IDs is deliberately retained, never a display name.
  if(/\bBPI\b/.test(v)||v.includes('event.bpi_launch'))bad.push(path+': '+v);
}
records(batch).forEach(r=>scan(r,r.id));
assert.deepEqual(bad,[],'Obsolete publisher or launch references remain');
const ncc=JSON.stringify(index.get('campaign.ncc1978'));
assert(!/afternoon|SSG Payroll|five-module application family/.test(ncc));
const agreement=JSON.stringify(index.get('agreement.bpi_offer'));
assert(!/150,000|150000|33%|fully diluted/.test(agreement));
assert.equal(hash(files),initialHash,'Simulation mutated input records');
console.log(JSON.stringify({result:'passed',proposals:proposals.length,record_operations:touched.size,dependency_closure_approvals:'passed',sequential_batch_reverse:'passed',strict_catalogue:'passed',unchanged_foundation_records:'passed',dates_ownership_scope_and_obsolete_mentions:'passed',foundation_written:false},null,2));
