// Verify the review queue, technical fact conservation and optional strict final profile.
// All approvals below are disposable in-memory transactions.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasetForFile} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase7/audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const original=structuredClone(files),index=new Map(records(files).map(r=>[r.id,r]));
const pending=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase7_'));
const decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const groups=audit.proposals.map(a=>{
 const p=pending.find(p=>p.id===a.change_id)||decisions.findLast(d=>d.action==='approve_change'&&d.change_id===a.change_id)?.proposal;
 assert(p,'Missing proposal '+a.change_id);assert.equal(hash(p),a.proposal_sha256);assert.deepEqual(p.elements.map(e=>e.record_id),a.record_ids);return p;
});
assert.equal(groups.length,20);assert.deepEqual(validate(files).errors,[]);
if(pending.length===groups.length)for(const [path,sha] of Object.entries(audit.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unexpected source mutation '+path);
const changed=new Set();
for(const p of groups)for(const e of p.elements){
 assert(!changed.has(e.record_id),'Overlapping proposals');changed.add(e.record_id);
 assert(e.before,'No new foundation records expected');
 if(e.after===null)assert(audit.retired_record_ids.includes(e.record_id));
 assert.deepEqual(index.get(e.record_id)??null,pending.some(x=>x.id===p.id)?e.before:e.after,'Stale proposal '+e.record_id);
 if(e.after){assert.deepEqual(e.after.time,e.before.time);assert.deepEqual(e.after.period,e.before.period);if(e.before.launch_campaign_id){assert.equal(e.after.launch_campaign_id,e.before.launch_campaign_id);assert.equal(e.after.launch_event_id,e.before.launch_event_id);}}
}
assert.equal(changed.size,62);
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
const hdd=final.get('product.artemis_budget_128_hdd');assert.deepEqual(hdd.composition_history.map(v=>v.version_number),[1,2,3]);
assert.deepEqual(hdd.composition_history.map(v=>v.effective_from.event_id),['event.artemis_launch','event.software32','event.network_launch']);
assert(!hdd.composition_history[0].composition_definition.some(l=>l.target.record_id==='software_edition.abacus_3'));
for(const v of hdd.composition_history.slice(1))assert.equal(v.composition_definition.find(l=>l.target.record_id==='software_edition.abacus_3').supply_condition.kind,'conditional');
assert.equal(hdd.composition_history[2].composition_definition.find(l=>l.target.record_id==='device.network_card_artemis').supply_condition.kind,'conditional');
// No reference is silently redirected from the old HDD product version 2.
function pins(x){if(!x||typeof x!=='object')return false;if(x.record_id===hdd.id&&x.version_number===2)return true;return Object.values(x).some(pins);}
for(const r of index.values())assert(!pins(r),'Old product revision is externally pinned');
const ram=final.get('product.ram_64kb_module');assert.equal(ram.composition_history[0].composition_definition[0].quantity,1);assert.match(ram.description,/replacement/);
for(const id of ['campaign.ncc1978','event.aurelia_launch','campaign.ncc1980','event.artemis_launch'])assert(!(final.get(id).subject_ids||[]).includes('product.aion_c_ide'));
assert(final.get('campaign.comdex1980').subject_ids.includes(hdd.id));assert(final.get('campaign.comdex1980').marketing_content.some(s=>s.type==='follow_up_demonstration'));
assert.deepEqual(files,original,'Verification mutated source files');
console.log(JSON.stringify({result:'passed',proposals:groups.length,pending:pending.length,approved:groups.length-pending.length,affected_records:changed.size,products_after_approval:products.length,explicit_product_launch_pairs:products.length,technical_facts_accounted_for:audit.technical_fact_destinations.length,individual_batch_reverse_and_sequential_approvals_valid:true,strict_profile_passes_after_approval:true,active_schema_unchanged:true,regular_support_discount_preserved:true},null,2));
