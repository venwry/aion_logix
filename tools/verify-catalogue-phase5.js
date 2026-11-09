// Verify the catalogue launch-link proposals against current pending/approved
// state. Approval simulations use the production transaction code in memory.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {schemaVersion} from '../code/model-contract.js';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';
import {validateProductLaunches} from '../code/product-launches.js';
const read=path=>JSON.parse(fs.readFileSync(path));
const audit=read('data_storytelling/review_evidence/catalogue-phase5/audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir)
 .filter(path=>path.endsWith('.json')).map(path=>[dir+'/'+path,read(dir+'/'+path)])));
const original=structuredClone(files),index=new Map(records(files).map(r=>[r.id,r]));
const pending=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase5_'));
const decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const groups=audit.proposals.map(a=>{
 const p=pending.find(p=>p.id===a.change_id)??decisions.findLast(d=>d.action==='approve_change'&&d.change_id===a.change_id)?.proposal;
 assert(p,'Missing pending/approved proposal '+a.change_id);assert.equal(hash(p),a.proposal_sha256);return p;
});
assert.equal(groups.length,9);
if(pending.length===groups.length)for(const [path,sha] of Object.entries(audit.preserved_files_sha256)){
 if(path==='data_storytelling/manifest.json'){
  // An application deployment may advance the contract without changing phase 5 data.
  const baseline=execFileSync('git',['show',audit.source_commit+':'+path]);
  assert.equal(crypto.createHash('sha256').update(baseline).digest('hex'),sha);
  const expected=JSON.parse(baseline);expected.manifest[0].schema_version=schemaVersion;
  assert.deepEqual(files[path],expected,'Manifest changed beyond the deployed contract version');
 }else assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unexpected source change: '+path);
}
assert.deepEqual(validate(files).errors,[]);
const changed=new Set();
const stripSubjects=x=>Array.isArray(x)?x.map(stripSubjects):x&&typeof x==='object'
 ?Object.fromEntries(Object.entries(x).filter(([k])=>k!=='subject_ids').map(([k,v])=>[k,stripSubjects(v)])):x;
for(const p of groups)for(const e of p.elements){
 assert(!changed.has(e.record_id),'Overlapping review groups: '+e.record_id);changed.add(e.record_id);
 assert(e.before&&e.after,'Phase 5 only revises existing records.');
 const isPending=pending.some(x=>x.id===p.id);
 assert.deepEqual(index.get(e.record_id),isPending?e.before:e.after,'Stale or unexpectedly changed '+e.record_id);
 if(e.record_type==='product'){
  const {launch_campaign_id,launch_event_id,...rest}=e.after;
  assert.deepEqual(rest,e.before,'Product definition changed: '+e.record_id);
  assert(launch_campaign_id&&launch_event_id);
 }else{
  assert(['campaign','event'].includes(e.record_type));
  assert.deepEqual(stripSubjects(e.after),stripSubjects(e.before),'Changed prose, dates, ownership or activity structure: '+e.record_id);
  const expected=structuredClone(e.before);
  for(const removal of audit.reverse_link_removals.filter(r=>r.record_id===e.record_id)){
   const path=removal.pointer.split('/').slice(1),key=path.pop();
   const parent=path.reduce((value,key)=>value[key],expected);
   parent[key]=parent[key].filter(id=>!removal.removed_product_ids.includes(id));
  }
  assert.deepEqual(e.after,expected,'A reference other than a declared reverse launch link changed: '+e.record_id);
 }
}
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of pending)assert.deepEqual(validate(transact(files,request([p])).files).errors,[],p.id);
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(pending),reverse=apply([...pending].reverse());
assert.deepEqual(records(result),records(reverse));
for(const order of [pending,[...pending].reverse()]){
 let sequential=files;for(const p of order)sequential=transact(sequential,request([p])).files;
 assert.deepEqual(records(sequential),records(result));
}
const finalIndex=new Map(records(result).map(r=>[r.id,r]));
for(const a of audit.assignments){
 const p=finalIndex.get(a.product_id);assert.equal(p.launch_campaign_id,a.launch_campaign_id);assert.equal(p.launch_event_id,a.launch_event_id);
 assert.equal(finalIndex.get(a.launch_campaign_id).subject_ids?.includes(a.product_id)??false,false);
 assert.equal(finalIndex.get(a.launch_event_id).subject_ids?.includes(a.product_id)??false,false);
}
for(const removal of audit.reverse_link_removals){
 const value=removal.pointer.split('/').slice(1).reduce((value,key)=>value[key],finalIndex.get(removal.record_id));
 for(const id of removal.removed_product_ids)assert(!value.includes(id));
}
for(const id of audit.already_linked_unchanged)assert.deepEqual(finalIndex.get(id),index.get(id));
for(const d of audit.deferred){
 assert.deepEqual(finalIndex.get(d.product_id),index.get(d.product_id));
 assert(!finalIndex.get(d.product_id).launch_event_id);
}
const products=[...finalIndex.values()].filter(r=>r.id.startsWith('product.'));
assert.equal(products.length,105);assert.equal(products.filter(r=>r.launch_event_id).length,100);
assert.equal(audit.assignments.length,67);assert.equal(audit.deferred.length,5);
for(const r of records(result))if(!changed.has(r.id))assert.deepEqual(r,index.get(r.id));
assert(finalIndex.get('product.service_regular_support').specification.some(s=>s.value==='10% discount on depot repairs'));
for(const later of audit.preserved_later_promotions)assert(finalIndex.get(later.campaign_id).subject_ids.includes(later.product_id));
// The side-event links use existing ownership and timing, rather than forcing
// every product onto the campaign's headline event.
assert.equal(finalIndex.get('product.proposed_aurelia_accounts').launch_event_id,'event.bpi_launch');
assert.equal(finalIndex.get('product.service_bpi_training').launch_event_id,'event.bpi_dealer_program');
// Demonstrate the actual deferred blocker without changing the story: the
// Model II release fits the campaign dates but not its ownership chain.
const tandy=structuredClone(finalIndex),abacus=tandy.get('product.abacus_1.model_ii');
abacus.launch_campaign_id='campaign.ncc1979';abacus.launch_event_id='event.tandy_release';
assert(validateProductLaunches(tandy).some(e=>e.startsWith(abacus.id+':')&&e.includes('belong to its campaign')));
assert.deepEqual(files,original,'Approval simulation mutated its input.');
console.log(JSON.stringify({result:'passed',source_commit:audit.source_commit,proposals:groups.length,pending:pending.length,approved:groups.length-pending.length,changed_records:changed.size,new_product_launch_links:67,linked_products_after_approval:100,deferred_products:5,individual_batch_reverse_and_sequential_approvals_valid:true,technical_definitions_dates_ownership_and_prose_unchanged:true,regular_support_discount_preserved:true,existing_launch_links_and_later_promotions_preserved:true,no_authorization_saved:true},null,2));
