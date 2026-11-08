// Read-only verification of the complete pending phase-4 queue, including feedback refinements.
// All authorizations run in memory; no endpoint or persistence writer is used.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {latestReview} from '../server/editorial.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase4/audit.json');
const revision=read('data_storytelling/review_evidence/catalogue-phase4/feedback-revision.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(p=>p.endsWith('.json')).map(p=>[d+'/'+p,read(d+'/'+p)])));
const original=structuredClone(files),ps=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase4_'));
assert.equal(ps.length,audit.proposals.length,'Run while the complete recorded phase-4 queue is pending.');
assert.equal(ps.length,40);
for(const [p,sha] of Object.entries(revision.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha,'Unexpected source edit: '+p);
assert.deepEqual(validate(files).errors,[]);
const index=new Map(records(files).map(r=>[r.id,r])),targets=new Set(),byId=new Map(ps.map(p=>[p.id,p]));
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
function dependencies(p,visiting=new Set(),result=new Map()){
 assert(!visiting.has(p.id),'Dependency cycle');visiting.add(p.id);
 for(const id of p.depends_on_change_ids||[]){assert(byId.has(id));dependencies(byId.get(id),visiting,result);}
 visiting.delete(p.id);result.set(p.id,p);return [...result.values()];
}
for(const p of ps)for(const e of p.elements){
 assert(!targets.has(e.record_id),'Overlapping proposals: '+e.record_id);targets.add(e.record_id);
 assert.deepEqual(e.before,index.get(e.record_id)??null);
 if(e.after){
  assert.equal(e.record_id,e.after.id);
  if(e.before)for(const key of ['time','period','category','parent_process_id','process_ids','agreement_id','steps']){
   if(key==='steps'){
    const scrub=v=>v?.map(({subject_ids,...rest})=>rest);assert.deepEqual(scrub(e.after[key]),scrub(e.before[key]),e.record_id+' '+key);
   }else assert.deepEqual(e.after[key],e.before[key],e.record_id+' '+key);
  }
  if(e.record_type==='product'){
   assert.deepEqual(e.after.technology_ids,[]);
   for(const s of e.after.specification){assert(Object.hasOwn(s,'value'));assert(!/[\[\]/]/.test(s.type),'Imported path in commercial specification');assert(s.description.trim());}
  }
 }
}
// Every saved rejection remains immutable but refers to an older proposal hash.
assert.equal(revision.feedback_actions.length,10);
for(const f of revision.feedback_actions){
 const saved=files['data_storytelling/change_review.json'].change_review.find(x=>x.id===f.review_id),p=byId.get(f.change_id);
 assert.equal(saved.proposal_sha256,f.reviewed_proposal_sha256);assert.notEqual(hash(p),saved.proposal_sha256);assert.equal(hash(p),f.revised_proposal_sha256);
 assert.equal(latestReview(files,p.id,hash(p)),undefined,'Revised proposal still blocked by old feedback');
}
let gated=0;
for(const p of ps){
 if(p.depends_on_change_ids?.length){gated++;assert.throws(()=>transact(files,request([p])),/Select required proposal/);}
 assert.deepEqual(validate(transact(files,request(dependencies(p))).files).errors,[],p.id);
}
const applied=transact(files,request(ps)).files,reverse=transact(files,request([...ps].reverse())).files;
assert.deepEqual(validate(applied).errors,[]);assert.deepEqual(records(applied),records(reverse));
let sequential=files;const completed=new Set();
for(const p of ps)for(const candidate of dependencies(p))if(!completed.has(candidate.id)){sequential=transact(sequential,request([candidate])).files;completed.add(candidate.id);}
assert.deepEqual(records(sequential),records(applied));
const finalIndex=new Map(records(applied).map(r=>[r.id,r]));
function strings(v){return typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(strings):v&&typeof v==='object'?Object.values(v).flatMap(strings):[];}
const finalStrings=new Set(records(applied).flatMap(strings));
assert.equal(audit.retirements.length,28);
for(const {record_id,canonical_definition_id} of audit.retirements){assert(!finalIndex.has(record_id));assert(!finalStrings.has(record_id),'Retired reference remains: '+record_id);if(canonical_definition_id)assert(finalIndex.has(canonical_definition_id));}
// Technical edits are explicitly scoped to cartridge hardware and software delivery.
const technicalChanges=new Set(revision.technical_definition_changes.map(x=>x.record_id));
assert.equal(technicalChanges.size,13);
for(const r of records(applied).filter(r=>/^(base_part|device|software_edition|external_product)\./.test(r.id))){
 if(!technicalChanges.has(r.id)){assert.deepEqual(r,index.get(r.id));continue;}
 const before=index.get(r.id);if(!before){assert(revision.new_base_parts.includes(r.id));continue;}
 assert.deepEqual(r.technology_ids,before.technology_ids);
 for(const [n,v] of r.composition_history.entries()){
  const old=before.composition_history[n];
  for(const l of old.composition_definition){const now=v.composition_definition.find(x=>x.id===l.id);assert.deepEqual(now.target,l.target);assert.equal(now.quantity,l.quantity);assert.equal(now.unit,l.unit);assert.deepEqual(now.supply_condition,l.supply_condition);}
  if(r.id.startsWith('software_edition.')){
   assert.deepEqual(v.composition_definition,old.composition_definition);
   const scrub=t=>{t=structuredClone(t);delete t.distribution;if(t.specification?.rom_execution)delete t.specification.rom_execution.physical_implementation;return t;};
   assert.deepEqual(scrub(v.technical_definition),scrub(old.technical_definition));
  }
 }
}
for(const c of audit.dependent_reverse_link_cleanup){
 const product=finalIndex.get(c.product_id);assert([product.launch_campaign_id,product.launch_event_id].includes(c.record_id));assert(!finalIndex.get(c.record_id).subject_ids?.includes(c.product_id));assert(byId.get(c.cleanup_change_id).depends_on_change_ids.includes(c.depends_on_change_id));
}
for(const p of ps)for(const e of p.elements){
 if(!e.after||!['event','process'].includes(e.record_type))continue;
 for(const id of e.after.subject_ids||[])assert(audit.top_level_exceptions.some(x=>x.record_id===e.record_id&&x.ref_id===id&&x.reason),'Unexplained activity subject');
}
assert.deepEqual(finalIndex.get('product.aion_development_team').composition_history,index.get('product.aion_development_team').composition_history);
for(const r of records(applied).filter(r=>r.id.startsWith('manufacturing_capability.')))assert.deepEqual(r.base_part_ids,index.get(r.id).base_part_ids);
for(const id of ['service_customer_care','service_professional_support','service_professional_business_onsite']){
 const r=finalIndex.get('product.'+id);assert.equal(r.specification.find(s=>s.type==='duration').value,'1 year');assert.match(r.specification.find(s=>s.type==='eligibility').value,/initial year/);
}
for(const id of revision.course_product_ids){const r=finalIndex.get(id);assert.match(r.specification.find(s=>s.type==='location').value,/Academy facility or customer/);}
for(const [id,days] of [['product.academy_course_1','2 days'],['product.academy_course_2','5 days'],['product.academy_course_3','6 days'],['product.academy_course_4','5 days']])assert.equal(finalIndex.get(id).specification.find(s=>s.type==='duration').value,days);
for(const id of ['software_aionix','software_aionix_server','software_aionix2']){
 const r=finalIndex.get('product.'+id);assert.equal(r.kind,'service');assert.match(r.name,/one-off/);assert.equal(r.specification.find(s=>s.type==='service').value,'One cartridge exchange');
 for(const l of r.composition_history[0].composition_definition){const d=finalIndex.get(l.target.record_id);assert.equal(d.kind,'rom_cartridge');assert(d.composition_history[0].composition_definition.some(x=>x.target.record_id.startsWith('software_edition.')));assert(d.composition_history[0].composition_definition.filter(x=>x.target.record_id.startsWith('base_part.')).length>=3);}
}
const mouse=finalIndex.get('product.ncc82_mouse_learning').composition_history[0].composition_definition;
assert.equal(mouse.find(l=>l.target.record_id==='device.logix_mouse').quantity,1);
for(const id of ['software_edition.entertainment_suite','software_edition.entertainment_suite.era'])assert.equal(mouse.find(l=>l.target.record_id===id).supply_condition.kind,'conditional');
assert.match(finalIndex.get('software_edition.aionix2').composition_history[0].technical_definition.distribution.installation,/page-sized RAM patch overlays/);
assert.equal(finalIndex.get('product.device_color_monitor_2').launch_campaign_id,'campaign.comdex1979');
assert.equal(finalIndex.get('product.device_network_card_artemis').launch_campaign_id,'campaign.ncc1981');
assert.deepEqual(files,original,'Simulated approvals mutated source');
const elements=ps.flatMap(p=>p.elements);
console.log(JSON.stringify({result:'passed',source_commit:audit.source_commit,pending_proposals:ps.length,saved_feedback_entries_addressed:revision.feedback_actions.length,technical_specification_items_reviewed:revision.technical_item_dispositions.length,dependency_gated_groups:gated,existing_records_proposed_for_revision:elements.filter(e=>e.before&&e.after).length,records_proposed_for_removal:elements.filter(e=>!e.after).length,new_base_parts_proposed:revision.new_base_parts.length,individual_dependency_batch_reverse_and_sequential_approvals_valid:true,technical_changes_limited_to_declared_cartridge_and_delivery_records:true,foundation_feedback_and_authorization_unchanged:true,no_authorization_saved:true},null,2));
