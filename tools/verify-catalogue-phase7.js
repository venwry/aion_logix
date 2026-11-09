// Verify the review queue, technical fact conservation and optional strict final profile.
// All approvals below are disposable in-memory transactions.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,records,transact,validate} from '../server/model.js';
import {datasetForFile} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase7/audit.json');
const amendment=read('data_storytelling/review_evidence/catalogue-phase7/feedback-amendment.json');
const reviewedQueue=JSON.parse(execFileSync('git',['show',amendment.source_commit+':data_storytelling/change.json']));
const reviewed=reviewedQueue.change.find(p=>p.id===amendment.change_id);
const feedback=read('data_storytelling/change_review.json').change_review.find(r=>r.id===amendment.feedback_id);
assert.equal(hash(reviewed),amendment.reviewed_proposal_sha256);
assert.equal(feedback.proposal_sha256,amendment.reviewed_proposal_sha256);
assert.equal(feedback.text,amendment.feedback_text);
const amendedAudit=audit.proposals.find(p=>p.change_id===amendment.change_id);
assert.equal(amendedAudit.proposal_sha256,amendment.reviewed_proposal_sha256);
amendedAudit.proposal_sha256=amendment.revised_proposal_sha256;
amendedAudit.record_ids=amendment.record_ids;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const original=structuredClone(files),index=new Map(records(files).map(r=>[r.id,r]));
const pending=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase7_'));
const decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const groups=audit.proposals.map(a=>{
 const p=pending.find(p=>p.id===a.change_id)||decisions.findLast(d=>d.action==='approve_change'&&d.change_id===a.change_id)?.proposal;
 assert(p,'Missing proposal '+a.change_id);assert.equal(hash(p),a.proposal_sha256);assert.deepEqual(p.elements.map(e=>e.record_id),a.record_ids);return p;
});
const revised=groups.find(p=>p.id===amendment.change_id);
for(const previous of reviewed.elements){
 const current=revised.elements.find(e=>e.record_id===previous.record_id);
 assert.deepEqual(current.before,previous.before,'Changed original before snapshot');
 if(!['product.artemis_budget_128_hdd','event.artemis_launch','campaign.comdex1980'].includes(previous.record_id))assert.deepEqual(current,previous,'Unrelated pending edit changed');
}
assert.deepEqual(revised.elements.filter(e=>!reviewed.elements.some(p=>p.record_id===e.record_id)).map(e=>e.record_id),amendment.added_to_proposal_record_ids);
assert.equal(groups.length,20);assert.deepEqual(validate(files).errors,[]);
if(pending.length===groups.length)for(const [path,sha] of Object.entries(audit.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unexpected source mutation '+path);
if(pending.some(p=>p.id===amendment.change_id))for(const [path,sha] of Object.entries(amendment.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Changed approved content or review history '+path);
const changed=new Set();
for(const p of groups)for(const e of p.elements){
 assert(!changed.has(e.record_id),'Overlapping proposals');changed.add(e.record_id);
 assert(e.before,'No new foundation records expected');
 if(e.after===null)assert(audit.retired_record_ids.includes(e.record_id));
 assert.deepEqual(index.get(e.record_id)??null,pending.some(x=>x.id===p.id)?e.before:e.after,'Stale proposal '+e.record_id);
 if(e.after){assert.deepEqual(e.after.time,e.before.time);assert.deepEqual(e.after.period,e.before.period);if(e.before.launch_campaign_id){assert.equal(e.after.launch_campaign_id,e.before.launch_campaign_id);assert.equal(e.after.launch_event_id,e.before.launch_event_id);}}
}
assert.equal(changed.size,65);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of pending)assert.deepEqual(validate(transact(files,request([p])).files).errors,[],'Individual approval '+p.id);
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(pending),reverse=apply([...pending].reverse());assert.deepEqual(records(result),records(reverse));
for(const order of [pending,[...pending].reverse()]){let state=files;for(const p of order)state=transact(state,request([p])).files;assert.deepEqual(records(state),records(result));}
const final=new Map(records(result).map(r=>[r.id,r]));assert.deepEqual(validate(result).errors,[]);
const docs=Object.fromEntries(Object.entries(result).filter(([p])=>p.startsWith('data_foundation/')).map(([p,d])=>[datasetForFile(p.split('/').at(-1)),d]));
assert.deepEqual(validateCatalogue(docs).errors,[],'Final catalogue profile');
const products=[...final.values()].filter(r=>r.id.startsWith('product.'));assert.equal(products.length,104);assert(products.every(p=>p.launch_event_id&&p.launch_campaign_id));
function at(obj,pointer){return pointer.slice(1).split('/').reduce((v,k)=>v[k],obj);}
for(const fact of audit.technical_fact_destinations){
 const before=groups.flatMap(g=>g.elements).find(e=>e.record_id===fact.product_id).before;
 assert.deepEqual(at(before,fact.source_path),fact.value);
 for(const d of fact.destinations)assert.deepEqual(at(final.get(d.record_id),d.path),fact.canonical_value??fact.value,'Lost technical fact '+fact.product_id+fact.source_path);
}
assert.equal(audit.technical_fact_destinations.length,240);
const retired=groups.flatMap(g=>g.elements).find(e=>e.record_id==='product.comdex82_reference_hardware').before;
assert.deepEqual(retired.composition_history[0].composition_definition,final.get('product.comdex82_artemis_autocad').composition_history[0].composition_definition.slice(0,12));
assert(!final.has(retired.id));
for(const [id,r] of index)if(!changed.has(id))assert.deepEqual(final.get(id),r,'Unrelated record '+id);
// Service entitlement values, BOM targets and existing device revisions remain intact.
const support=groups.flatMap(g=>g.elements).find(e=>e.record_id==='product.service_regular_support');
assert.deepEqual(support.before.specification.map(s=>s.value),support.after.specification.map(s=>s.value));
assert(support.after.specification.some(s=>s.value==='10% discount on depot repairs'));
for(const e of groups.flatMap(g=>g.elements).filter(e=>e.record_type==='device'))assert.deepEqual(e.after.composition_history,e.before.composition_history);
const hdd=final.get('product.artemis_budget_128_hdd');assert.deepEqual(hdd.composition_history.map(v=>v.version_number),[1,2]);
assert.equal(hdd.launch_campaign_id,'campaign.comdex1980');assert.equal(hdd.launch_event_id,'event.software32');
assert.deepEqual(final.get(hdd.launch_event_id).time,{value:'1980-11-19',precision:'day'});
assert.deepEqual(hdd.composition_history.map(v=>v.effective_from.event_id),['event.software32','event.network_launch']);
assert.deepEqual(hdd.composition_history[0].effective_until,hdd.composition_history[1].effective_from);
assert.deepEqual(hdd.composition_history[1].effective_until,{kind:'open'});
for(const [i,v] of hdd.composition_history.entries()){
 assert.equal(v.composition_definition.find(l=>l.target.record_id==='software_edition.abacus_3').supply_condition.kind,'conditional');
 assert.deepEqual(v.composition_definition,reviewed.elements.find(e=>e.record_id===hdd.id).after.composition_history[i+1].composition_definition,'Retained BOM changed');
}
assert.equal(hdd.composition_history[1].composition_definition.find(l=>l.target.record_id==='device.network_card_artemis').supply_condition.kind,'conditional');
// No reference is silently redirected from the old HDD product version 2.
function pins(x){if(!x||typeof x!=='object')return false;if(x.record_id===hdd.id&&x.version_number===2)return true;return Object.values(x).some(pins);}
for(const r of index.values())assert(!pins(r),'Old product revision is externally pinned');
const ram=final.get('product.ram_64kb_module');assert.equal(ram.composition_history[0].composition_definition[0].quantity,1);assert.match(ram.description,/replacement/);
for(const id of ['campaign.ncc1978','event.aurelia_launch','campaign.ncc1980','event.artemis_launch'])assert(!(final.get(id).subject_ids||[]).includes('product.aion_c_ide'));
assert(!final.get('campaign.comdex1980').subject_ids.includes(hdd.id));assert(final.get('campaign.comdex1980').marketing_content.some(s=>s.type==='product_launch'));
for(const id of ['event.artemis_launch','process.ncc1980_campaign'])assert(!/hard.disk|\bhdd\b|\b5\s*(?:MB|megabyte)\b|ST.?506|budget_128_hdd/i.test(JSON.stringify(final.get(id))),'Premature HDD claim '+id);
for(const id of ['campaign.comdex1980','process.comdex1980_campaign','event.software32'])assert.match(JSON.stringify(final.get(id)),/introduce/i,'Missing COMDEX introduction '+id);
assert(!final.get('event.software32').subject_ids.includes(hdd.id));
// The same ST506 availability correction must hold for other offerings using this part.
function containsST506(id,seen=new Set()){
 if(id==='base_part.hdd_5mb')return true;
 if(seen.has(id))return false;
 const next=new Set([...seen,id]);
 return (final.get(id)?.composition_history||[]).some(v=>v.composition_definition.some(l=>containsST506(l.target.record_id,next)));
}
for(const p of products.filter(p=>containsST506(p.id)))assert(final.get(p.launch_event_id).time.value>='1980-11-19','Premature ST506 offering '+p.id);
assert.deepEqual(files,original,'Verification mutated source files');
console.log(JSON.stringify({result:'passed',proposals:groups.length,pending:pending.length,approved:groups.length-pending.length,affected_records:changed.size,revised_proposal_records:revised.elements.length,products_after_approval:products.length,explicit_product_launch_pairs:products.length,technical_facts_accounted_for:audit.technical_fact_destinations.length,individual_batch_reverse_and_sequential_approvals_valid:true,strict_profile_passes_after_approval:true,active_schema_unchanged:true,regular_support_discount_preserved:true,hdd_launch_date:'1980-11-19',hdd_versions:2,artemis_launch_has_no_hdd_claims:true,all_st506_offerings_at_or_after_comdex1980:true,feedback_and_authorized_content_preserved:true},null,2));
