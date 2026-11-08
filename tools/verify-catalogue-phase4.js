// Read-only verification while the complete phase-4 queue is pending.
// Authorizations below are simulated in memory; no endpoint or writer is used.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase4/audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(p=>p.endsWith('.json')).map(p=>[d+'/'+p,read(d+'/'+p)])));
const original=structuredClone(files),ps=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase4_'));
assert.equal(ps.length,39,'Run while all 39 phase-4 proposals are pending.');
for(const [p,sha] of Object.entries(audit.source_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),sha,'Unexpected source edit: '+p);
assert.deepEqual(validate(files).errors,[]);
const index=new Map(records(files).map(r=>[r.id,r])),targets=new Set();
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of ps)for(const e of p.elements){
 assert(!targets.has(e.record_id),'Overlapping proposals: '+e.record_id);targets.add(e.record_id);
 assert.deepEqual(e.before,index.get(e.record_id));
 if(e.after){
  assert.equal(e.record_id,e.after.id);
  for(const key of ['time','period','category','parent_process_id','process_ids','agreement_id','steps']){
   // Two reviewed step reference lists change; ownership and action descriptions do not.
   if(key==='steps'){
    const scrub=v=>v?.map(({subject_ids,...rest})=>rest);
    assert.deepEqual(scrub(e.after[key]),scrub(e.before[key]),e.record_id+' '+key);
   }else assert.deepEqual(e.after[key],e.before[key],e.record_id+' '+key);
  }
 }
}
const offerings=ps.filter(p=>p.id.startsWith('change.catalogue_phase4_offer_'));
assert.equal(offerings.length,30);
for(const p of offerings){
 assert.equal(p.elements.length,1);assert.equal(p.elements[0].record_type,'product');assert(!p.depends_on_change_ids?.length);
 const r=transact(files,request([p]));assert.deepEqual(validate(r.files).errors,[]);
 const after=p.elements[0].after;
 assert(after.launch_campaign_id&&after.launch_event_id);
 const assessment=audit.individual_offering_assessments.find(x=>x.product_id===after.id);
 assert(assessment?.assessment&&assessment.evidence_ids.every(id=>index.has(id)));
 assert.equal(after.launch_campaign_id,assessment.launch_campaign_id);assert.equal(after.launch_event_id,assessment.launch_event_id);
 for(const v of after.composition_history||[])for(const line of v.composition_definition){assert.equal(line.quantity,1);assert.equal(line.target.record_id,assessment.technical_target_id);}
}
// Each cleanup validates alone or with only its own declared offering dependencies.
let gated=0;
for(const p of ps.filter(p=>!offerings.includes(p))){
 const deps=(p.depends_on_change_ids||[]).map(id=>{const d=offerings.find(x=>x.id===id);assert(d);return d;});
 if(deps.length){gated++;assert.throws(()=>transact(files,request([p])),/Select required proposal/);}
 assert.deepEqual(validate(transact(files,request([...deps,p])).files).errors,[]);
}
const applied=transact(files,request(ps)).files,reverse=transact(files,request([...ps].reverse())).files;
assert.deepEqual(validate(applied).errors,[]);assert.deepEqual(records(applied),records(reverse));
// Confirm independent decisions remain usable when saved individually before cleanup.
let sequential=files;
for(const p of offerings)sequential=transact(sequential,request([p])).files;
for(const p of ps.filter(p=>!offerings.includes(p)))sequential=transact(sequential,request([p])).files;
assert.deepEqual(records(sequential),records(applied));
const finalIndex=new Map(records(applied).map(r=>[r.id,r]));
function strings(v){return typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(strings):v&&typeof v==='object'?Object.values(v).flatMap(strings):[];}
const finalStrings=new Set(records(applied).flatMap(strings));
assert.equal(audit.retirements.length,27);
for(const {record_id,canonical_definition_id} of audit.retirements){assert(!finalIndex.has(record_id));assert(!finalStrings.has(record_id),'Retired reference remains: '+record_id);if(canonical_definition_id)assert(finalIndex.has(canonical_definition_id));}
for(const type of ['base_part','device','software_edition','external_products'])assert.deepEqual(applied['data_foundation/'+type+'.json'],files['data_foundation/'+type+'.json']);
for(const c of audit.dependent_reverse_link_cleanup){
 const product=finalIndex.get(c.product_id);assert([product.launch_campaign_id,product.launch_event_id].includes(c.record_id));
 assert(!finalIndex.get(c.record_id).subject_ids?.includes(c.product_id));
 assert(ps.find(p=>p.id===c.cleanup_change_id).depends_on_change_ids.includes(c.depends_on_change_id));
}
for(const p of ps)for(const e of p.elements){
 if(!e.after||!['event','process'].includes(e.record_type))continue;
 for(const id of e.after.subject_ids||[])assert(audit.top_level_exceptions.some(x=>x.record_id===e.record_id&&x.ref_id===id&&x.reason),'Unexplained activity subject');
}
// Commercial consolidation must not rewrite package contents or implementation quantities.
assert.deepEqual(finalIndex.get('product.aion_development_team').composition_history,index.get('product.aion_development_team').composition_history);
assert.deepEqual(finalIndex.get('product.academy_course_1').specification,index.get('product.academy_course_1').specification);
for(const r of records(applied).filter(r=>r.id.startsWith('manufacturing_capability.')))assert.deepEqual(r.base_part_ids,index.get(r.id).base_part_ids);
assert.equal(finalIndex.get('product.device_color_monitor_2').launch_campaign_id,'campaign.comdex1979');
assert.equal(finalIndex.get('product.device_network_card_artemis').launch_campaign_id,'campaign.ncc1981');
const cpm=finalIndex.get('product.software_cpm_aurelia_networking');assert.equal(cpm.technical_identity.record_id,'device.rom_cartridge.cpm_aurelia_networking');assert.deepEqual(cpm.provider_actor_ids,['actor.logix']);
assert.deepEqual(files,original,'Simulated approvals mutated source');
console.log(JSON.stringify({result:'passed',source_commit:audit.source_commit,pending_proposals:ps.length,independently_reviewable_offerings:offerings.length,cleanup_groups:ps.length-offerings.length,dependency_gated_cleanup_groups:gated,existing_records_proposed_for_revision:targets.size-27,product_aliases_proposed_for_removal:27,retired_reference_occurrences:audit.reference_dispositions.length,redundant_launch_references_removed_after_prerequisites:audit.dependent_reverse_link_cleanup.length,individual_batch_reverse_and_sequential_approvals_valid:true,technical_definitions_preserved:true,foundation_and_authorization_unchanged:true,no_authorization_saved:true},null,2));
