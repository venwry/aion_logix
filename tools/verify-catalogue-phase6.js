// Review phase 6 against current pending/approved state. Simulations never persist.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {hash,records,transact,validate} from '../server/model.js';
import {pointBounds} from '../code/temporal.js';
import {validateProductLaunches} from '../code/product-launches.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('data_storytelling/review_evidence/catalogue-phase6/audit.json');
const amendment=read('data_storytelling/review_evidence/catalogue-phase6/feedback-amendment.json');
const reviewedQueue=JSON.parse(execFileSync('git',['show',amendment.source_commit+':data_storytelling/change.json']));
for(const a of amendment.proposals){
 const old=reviewedQueue.change.find(p=>p.id===a.change_id),feedback=read('data_storytelling/change_review.json').change_review.find(r=>r.id===a.feedback_id);
 assert.equal(hash(old),a.reviewed_proposal_sha256);assert.equal(feedback.proposal_sha256,a.reviewed_proposal_sha256);assert.equal(feedback.text,a.feedback_text);
 const item=audit.proposals.find(p=>p.change_id===a.change_id);assert.equal(item.proposal_sha256,a.reviewed_proposal_sha256);item.proposal_sha256=a.revised_proposal_sha256;item.record_ids=a.record_ids;
}
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>[dir+'/'+f,read(dir+'/'+f)])));
const original=structuredClone(files),index=new Map(records(files).map(r=>[r.id,r]));
const pending=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase6_'));
const decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const groups=audit.proposals.map(a=>{const p=pending.find(p=>p.id===a.change_id)||decisions.findLast(d=>d.action==='approve_change'&&d.change_id===a.change_id)?.proposal;assert(p,'Missing proposal '+a.change_id);assert.equal(hash(p),a.proposal_sha256);assert.deepEqual(p.elements.map(e=>e.record_id),a.record_ids);return p;});
assert.equal(groups.length,4);
if(amendment.proposals.every(a=>pending.some(p=>p.id===a.change_id)))for(const [path,sha] of Object.entries(amendment.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unexpected source change '+path);
assert.deepEqual(validate(files).errors,[]);
const changed=new Set(),allowed={
 'product.abacus_1.model_ii':['launch_campaign_id','launch_event_id'],
 'campaign.ncc1979':['subject_ids','marketing_content'],
 'process.ncc1979_campaign':['steps'],
 'process.tandy_cooperation':['steps','period','description','outcomes'],
 'event.tandy_release':['subject_ids','description','category'],
 'event.open79_delivery':['inputs'],
 'process.ncc1980_campaign':['steps','description'],
 'process.comdex1980_campaign':['steps','period','description'],
 'campaign.comdex1980':['objective','marketing_content'],
 'process.comdex1982_campaign':['inputs','steps'],
 'campaign.clone_january1982':['launch_event_id']
};
for(const p of groups)for(const e of p.elements){
 assert(!changed.has(e.record_id),'Overlapping proposals');changed.add(e.record_id);
 if(e.before===null)assert(amendment.added_record_ids.includes(e.record_id),'Unexpected addition');
 if(e.after===null)assert(amendment.retired_record_ids.includes(e.record_id),'Unexpected deletion');
 assert.deepEqual(index.get(e.record_id)??null,pending.some(x=>x.id===p.id)?e.before:e.after,'Stale proposal '+e.record_id);
 if(e.before&&e.after)for(const k of new Set([...Object.keys(e.before),...Object.keys(e.after)]))if(!allowed[e.record_id]?.includes(k))assert.deepEqual(e.after[k],e.before[k],'Out-of-scope edit '+e.record_id+'.'+k);
}
assert.equal(changed.size,15);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of pending)assert.deepEqual(validate(transact(files,request([p])).files).errors,[],'Individual approval '+p.id);
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(pending),reverse=apply([...pending].reverse());assert.deepEqual(records(result),records(reverse));
for(const order of [pending,[...pending].reverse()]){let state=files;for(const p of order)state=transact(state,request([p])).files;assert.deepEqual(records(state),records(result));}
const final=new Map(records(result).map(r=>[r.id,r]));assert.deepEqual(validate(result).errors,[]);assert.equal(final.size,1081);
for(const [id,r] of index){
 const next=final.get(id);if(!next){assert(amendment.retired_record_ids.includes(id));continue;}assert.deepEqual(next.time,r.time);if(!['process.tandy_cooperation','process.comdex1980_campaign'].includes(id))assert.deepEqual(next.period,r.period);
 if(!changed.has(id))assert.deepEqual(next,r,'Unrelated record '+id);
 if(r.id.startsWith('product.')&&r.launch_campaign_id){assert.equal(next.launch_campaign_id,r.launch_campaign_id);assert.equal(next.launch_event_id,r.launch_event_id);}
}
function ownership(map){
 const parents=new Map();const own=(child,parent)=>{if(!parents.has(child))parents.set(child,new Set());parents.get(child).add(parent);};
 for(const r of map.values()){
  if(r.id.startsWith('process.')){if(r.parent_process_id)own(r.id,r.parent_process_id);for(const s of r.steps||[])if(s.event_id||s.process_id)own(s.event_id||s.process_id,r.id);for(const p of [r.period.start,r.period.end])if(p.precision==='event')own(p.value,r.id);}
  if(r.id.startsWith('event.'))for(const p of r.process_ids||[])own(r.id,p);
 }
 return parents;
}
function campaignAudit(map){
 const parents=ownership(map),reports=[];
 for(const c of [...map.values()].filter(r=>r.id.startsWith('campaign.'))){
  const process=map.get(c.process_id),event=map.get(c.launch_event_id),path=[];assert(event,'Missing campaign headline launch: '+c.id);
  let cursor=event.id;while(cursor){assert(!path.includes(cursor),'Ownership cycle');path.push(cursor);const ps=[...(parents.get(cursor)||[])];assert(ps.length<=1,'Multiple owners '+cursor);if(ps.length)assert(!map.get(cursor).category,'Child category '+cursor);cursor=ps[0];}
  assert(path.includes(process.id),'Launch outside campaign ownership: '+c.id);
  const start=pointBounds(process.period.start,map),end=pointBounds(process.period.end,map),date=pointBounds(event.time,map);assert(start&&end&&date);assert(date.start>=start.start&&date.end<=end.end,'Launch outside recorded period: '+c.id);
  const descendants=[],walk=pid=>{const r=map.get(pid),s=pointBounds(r.period.start,map),e=pointBounds(r.period.end,map);for(const [id,ps] of parents)if(ps.has(pid)){assert.equal(ps.size,1,'Multiple owners '+id);assert(!descendants.includes(id),'Campaign ownership cycle');descendants.push(id);const child=map.get(id);assert(!child.category,'Child category '+id);const a=pointBounds(child.time||child.period?.start,map),b=pointBounds(child.time||child.period?.end,map);assert(a&&b&&s&&e,'Unknown campaign child dates '+id);assert(a.start>=s.start&&b.end<=e.end,'Campaign child outside period '+id);if(child.period)walk(id);}};walk(process.id);
  reports.push({campaign_id:c.id,launch_event_id:event.id,event_time:event.time,execution_process_id:process.id,period:process.period,ownership_path:path,owned_descendants:descendants.length});
 }
 return reports;
}
const campaigns=campaignAudit(final);assert.equal(campaigns.length,12);assert.deepEqual(validateProductLaunches(final),[]);
const parents=ownership(final);assert.deepEqual([...parents.get('event.tandy_release')],['process.tandy_model_ii_campaign']);assert.deepEqual([...parents.get('process.tandy_model_ii_campaign')],['process.tandy_cooperation']);assert.deepEqual([...parents.get('event.tandy_ncc_demo')],['process.tandy_cooperation']);
assert.equal(final.get('event.tandy_release').time.value,'1979-10-15');assert.equal(final.get('event.tandy_ncc_demo').time.value,'1979-06-04');
const abacus=final.get('product.abacus_1.model_ii');assert.equal(abacus.launch_campaign_id,'campaign.tandy_model_ii_1979');assert.equal(abacus.launch_event_id,'event.tandy_release');
for(const id of ['campaign.ncc1979','event.tandy_release'])assert(!final.get(id).subject_ids.includes(abacus.id));
for(const id of amendment.retired_record_ids)assert(!final.has(id));
const tandyCampaign=final.get('campaign.tandy_model_ii_1979');assert.deepEqual(tandyCampaign.lead_actor_ids,['actor.tandy']);assert.equal(tandyCampaign.launch_event_id,'event.tandy_release');assert.equal(tandyCampaign.process_id,'process.tandy_model_ii_campaign');
assert.deepEqual(final.get('process.tandy_cooperation').period.end,final.get('event.tandy_release').time);
assert.equal(final.get('process.tandy_cooperation').outcomes.length,1);
assert(!final.get('process.ncc1979_campaign').steps.some(s=>['event.tandy_release','event.open79_delivery'].includes(s.event_id)||s.process_id==='process.tandy_model_ii_campaign'));
assert(!JSON.stringify(final.get('campaign.ncc1979')).includes('15 October'));
assert.deepEqual(final.get('process.ncc1980_campaign').period.end,{value:'1980-10',precision:'month'});
assert(final.get('process.ncc1980_campaign').steps.some(s=>s.process_id==='process.ncc1980_roadshows'));
assert.deepEqual(final.get('process.ncc1980_roadshows'),index.get('process.ncc1980_roadshows'));
const comdex=final.get('process.comdex1980_campaign');assert.deepEqual(comdex.period.start,{value:'1980-10-19',precision:'day'});assert.deepEqual(comdex.period.end,{value:'1980-11-19',precision:'day'});
assert.equal((pointBounds(final.get('event.software32').time,final).start-pointBounds(comdex.period.start,final).start)/86400000,31);
assert(comdex.steps.some(s=>s.event_id==='event.software32'));assert(comdex.steps[0].description.includes('advertising'));assert(comdex.steps[0].description.includes('Abacus 3')&&comdex.steps[0].description.includes('Pulse 3'));
assert(final.get('campaign.comdex1980').marketing_content.some(m=>m.type==='advance_advertising'&&m.description.includes('19 October 1980')));
assert(final.get('process.comdex1982_campaign').inputs.some(i=>i.event_id==='event.autodesk_beta'));
assert.deepEqual([...parents.get('event.autodesk_beta')],['process.autodesk_development']);assert.deepEqual([...parents.get('event.autodesk_comdex')],['process.comdex1982_campaign']);
assert(!final.get('process.ncc1980_campaign').steps.some(s=>/COMDEX|November/i.test(s.description)));
assert(final.get('process.comdex1980_campaign').steps.some(s=>s.description.includes('19 November 1980')&&s.description.includes('Abacus 3')&&s.description.includes('Pulse 3')));
for(const d of audit.remaining_deferred){assert.deepEqual(final.get(d.product_id),index.get(d.product_id));assert(!final.get(d.product_id).launch_event_id);}
assert.equal([...final.values()].filter(r=>r.id.startsWith('product.')&&r.launch_event_id).length,101);
// Exercise the actual ownership and category guardrails on disposable copies.
const duplicate=structuredClone(final);duplicate.get('event.tandy_release').process_ids=['process.tandy_cooperation'];assert(validateProductLaunches(duplicate).some(e=>e.includes('single parent')));
const outside=structuredClone(final);outside.get('process.tandy_model_ii_campaign').period.end={value:'1979-10-15',precision:'day'};outside.get('event.tandy_release').process_ids=['process.tandy_model_ii_campaign'];outside.get('event.tandy_release').time={value:'1981-01-01',precision:'day'};assert(validateProductLaunches(outside).some(e=>e.includes('outside')));
const categorized=structuredClone(result);categorized['data_foundation/event.json'].event.find(e=>e.id==='event.tandy_release').category='Product dev & launch';assert(validate(categorized).errors.some(e=>e.includes('child timeline records')));
assert.deepEqual(files,original,'Approval simulation mutated source');
console.log(JSON.stringify({result:'passed',source_commit:audit.source_commit,proposals:groups.length,pending:pending.length,approved:groups.length-pending.length,changed_records:changed.size,campaigns_checked:campaigns.length,products_with_launch_pairs_after_approval:101,deferred_products:4,existing_event_dates_preserved:true,explicit_period_revisions:['process.tandy_cooperation.end','process.comdex1980_campaign.start'],added_records:amendment.added_record_ids,retired_records:amendment.retired_record_ids,amendment_source_commit:amendment.source_commit,all_campaign_headline_launches_single_owned_and_contained:true,all_owned_campaign_descendants_single_owned_contained_and_uncategorized:true,previous_product_launch_pairs_preserved:true,individual_batch_reverse_and_sequential_approvals_valid:true,no_foundation_or_authorization_saved:true,campaigns},null,2));
