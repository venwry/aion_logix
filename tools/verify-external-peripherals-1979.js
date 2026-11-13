// Validate this proposal set through the real review transaction, entirely in memory.
// No production endpoint is called and no foundation/authorization data is written.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasets,datasetPath} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';

const root='data_storytelling/review_evidence/external-peripherals-1979/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read(root+'baseline.json'),catalog=read(root+'catalog.json'),assessment=read(root+'assessment.json');
const proposed=read(root+'proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
// The compact decision index preserves prerequisite/retry history. Avoid loading the immutable archive.
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const pending=files['data_storytelling/change.json'].change;
const originalIndex=new Map(records(files).map(r=>[r.id,r]));
const proposalIndex=new Map(proposed.map(p=>[p.id,p]));
const allProposedElements=proposed.flatMap(p=>p.elements);
const afterIndex=new Map(allProposedElements.map(e=>[e.record_id,e.after]));
const reviewRequest=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const simulate=ps=>transact(files,reviewRequest(ps)).files;
const canonicalRecords=f=>records(f).map(r=>[r.id,r]).sort(([a],[b])=>a.localeCompare(b));
const profile=f=>Object.fromEntries(datasets.map(n=>[n,f[datasetPath(n)]]));
function unchangedDisk(){for(const [p,digest] of Object.entries(baseline.preserved_files_sha256))assert.equal(sha(p),digest,'Protected file changed: '+p);}
unchangedDisk();
assert.deepEqual(validate(files).errors,[]);
assert.deepEqual(validateCatalogue(profile(files)).errors,[]);
assert.equal(catalog.items.length,200);
assert.deepEqual(catalog.items.map(r=>r.number),Array.from({length:200},(_,i)=>i+1));
assert.equal(new Set(catalog.items.map(r=>r.id)).size,200);
assert.equal(assessment.entries.length,212);
assert.equal(new Set(assessment.entries.map(r=>r.record_id)).size,212);
assert.deepEqual(pending.filter(p=>!proposalIndex.has(p.id)),baseline.preexisting_pending_proposals,'Unrelated review queue changed');
assert.equal(new Set(allProposedElements.map(e=>e.record_id)).size,allProposedElements.length,'Overlapping whole-record proposals');
assert.deepEqual(allProposedElements.filter(e=>e.record_type==='actor').map(e=>e.record_id).sort(),[...baseline.provider_ids_added].sort());
const currentStandards=new Set(records(files).filter(r=>['hardware_standard','software_standard'].includes(r.kind)).map(r=>r.id));
assert.equal(currentStandards.size,5);

for(const p of proposed){
 assert.deepEqual(pending.find(q=>q.id===p.id),p,'Live queue/evidence mismatch: '+p.id);
 assert(p.elements.length>=5&&p.elements.length<=15,'Batch size: '+p.id);
 for(const id of p.depends_on_change_ids||[])assert(proposalIndex.has(id),'Missing prerequisite '+id);
 for(const e of p.elements){
  assert(['actor','external_product'].includes(e.record_type),'Unexpected mutation type');
  assert.deepEqual(e.before,originalIndex.get(e.record_id)??null,'Stale before snapshot');
  assert.notDeepEqual(e.after,e.before,'No-op proposal');
  if(e.before){
   assert.equal(e.record_type,'external_product');
   const retained=structuredClone(e.after);delete retained.impacted_standards;retained.specification.pop();
   assert.deepEqual(retained,e.before,'Existing external definition changed beyond the assessment');
  }
 }
}
for(const row of catalog.items){
 const record=afterIndex.get(row.id),a=assessment.entries.find(a=>a.record_id===row.id);
 assert(record&&a,'Missing item '+row.number);
 assert.equal(record.kind,'peripheral');
 assert.deepEqual(record.provider_actor_ids,[row.provider_actor_id]);
 assert(!originalIndex.has(row.id),'Duplicate existing identity');
 assert(row.source_ids.length>=2,'Missing historical source pointer: '+row.number);
 for(const source of row.source_ids)assert(catalog.sources[source],'Unknown source '+source);
 assert(/^(D|H|T|TT|HT|M)(–(D|H|T|TT|HT|M))?$/.test(row.sales_scale));
 assert.equal(a.assessment_date,'1979-12-31');
 assert(a.product_impacts.length||a.product_no_impact_reason,'Unassessed product effect');
 assert(a.standards_impacts.length||a.standards_no_impact_reason,'Unassessed standard effect');
 if(row.assessment_profile==='none_memory'){
  assert.deepEqual(a.product_impacts,[]);assert.deepEqual(a.standards_impacts,[]);
  assert(!record.impacted_standards,'Memory card acquired a spurious standards impact');
 }
 if(!record.impacted_standards)assert(record.specification.some(c=>c.chapter_name==='Standards impact'));
 const proposal=proposalIndex.get(row.proposal_id);
 assert(proposal.elements.some(e=>e.record_id===row.id));
 if(!originalIndex.has(row.provider_actor_id)){
  const supplier=proposed.find(p=>p.elements.some(e=>e.record_id===row.provider_actor_id));
  assert(proposal.depends_on_change_ids.includes(supplier.id),'Undeclared provider prerequisite');
 }
}
for(const a of assessment.entries){
 const record=afterIndex.get(a.record_id);
 assert.deepEqual(record.impacted_standards||[],a.standards_impacts);
 for(const effect of a.product_impacts)assert(originalIndex.has(effect.product_id),'Unresolved offering comparison');
 for(const effect of a.standards_impacts)assert(currentStandards.has(effect.standard_id),'Non-core standard target');
 const text=JSON.stringify(record);
 assert(!/"(?:price|annual_sales|estimated_units|sales_scale|source_refs|authorization)"\s*:/.test(text),'Unsupported data in foundation');
 assert(!/\$|£|€/.test(text),'Pricing leaked into foundation');
}

const providers=proposed.filter(p=>p.elements.every(e=>e.record_type==='actor'));
const products=proposed.filter(p=>p.elements.every(e=>e.record_type==='external_product'));
// Every group succeeds alone or with precisely its declared supplier prerequisites.
for(const p of proposed){
 const dependencies=(p.depends_on_change_ids||[]).map(id=>proposalIndex.get(id));
 const result=simulate([...dependencies,p]);
 assert.deepEqual(validateCatalogue(profile(result)).errors,[],'Group '+p.id);
 if(dependencies.length)assert.throws(()=>simulate([p]),/required proposal/,'Missing prerequisites must be rejected');
}
const together=simulate(proposed);
assert.deepEqual(validate(together).errors,[]);
assert.deepEqual(validateCatalogue(profile(together)).errors,[]);
assert.equal(together['data_foundation/external_products.json'].external_product.length,212);
assert.equal(together['data_foundation/actor.json'].actor.length,files['data_foundation/actor.json'].actor.length+baseline.provider_ids_added.length);
assert.deepEqual(canonicalRecords(simulate([...proposed].reverse())),canonicalRecords(together),'Batch order affects content');
// Approve providers first; remaining groups must then work independently in reverse order.
let sequential=transact(files,reviewRequest(providers)).files;
for(const p of [...products].reverse())sequential=transact(sequential,reviewRequest([p])).files;
assert.deepEqual(canonicalRecords(sequential),canonicalRecords(together),'Independent review order affects content');
assert.equal(transact(together,reviewRequest(proposed)).changed,false,'Exact retry is not idempotent');
const stale=reviewRequest(proposed);stale.changes[0].proposal_sha256='0'.repeat(64);
assert.throws(()=>transact(files,stale),/changed/,'Stale proposals accepted');
for(const [id,record] of originalIndex)if(!afterIndex.has(id))assert.deepEqual(new Map(records(together).map(r=>[r.id,r])).get(id),record,'Unrelated record changed');
assert.deepEqual(files['data_storytelling/change.json'].change,pending);
unchangedDisk();
console.log(JSON.stringify({result:'passed',baseline:baseline.foundation_revision,change_records:proposed.length,group_sizes:proposed.map(p=>p.elements.length),new_peripherals:200,existing_external_products_assessed:12,new_provider_actors:baseline.provider_ids_added.length,external_products_if_all_approved:212,independent_groups_with_prerequisites:true,combined_reverse_and_sequential_approval:true,stale_hash_rejected:true,idempotent_retry:true,foundation_authorizations_calculations_and_schemas_unchanged_on_disk:true},null,2));
