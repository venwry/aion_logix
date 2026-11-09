// Verify the saved-feedback amendment and simulate authorization without disk writes.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasetForFile,simulationEnd} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/closeout-audit/';
const amendment=read(root+'feedback-amendment.json'),inventory=read(root+'inventory.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),original=structuredClone(files);
const pending=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision,reviews=files['data_storytelling/change_review.json'].change_review;
const current=id=>pending.find(p=>p.id===id)||decisions.findLast(d=>d.change_id===id&&['approve_change','remove_change'].includes(d.action))?.proposal;
const amended=new Map([...amendment.amendments,...(amendment.consequential_amendments||[])].map(a=>[a.proposal_id,a]));
for(const item of inventory.items){
 const a=amended.get(item.proposal_id);const prior=a?.before||current(item.proposal_id);
 assert(prior,'Missing historical proposal '+item.proposal_id);assert.equal(hash(prior),item.proposal_sha256,'Original audit lineage '+item.proposal_id);
}
for(const a of amendment.amendments){
 const review=reviews.find(r=>r.id===a.review_id);assert(review);assert.equal(review.proposal_sha256,hash(a.before));assert.equal(review.text,a.feedback);
 assert.deepEqual(current(a.proposal_id),a.after,'Revised proposal needs a new amendment '+a.proposal_id);
}
for(const a of amendment.consequential_amendments||[])assert.deepEqual(current(a.proposal_id),a.after);
for(const p of amendment.added_discussions)assert.deepEqual(current(p.id),p);
if(amendment.amendments.every(a=>pending.some(p=>p.id===a.proposal_id)))for(const [path,sha] of Object.entries(amendment.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unintended source mutation '+path);
assert.deepEqual(validate(files).errors,[]);
const documents=f=>Object.fromEntries(Object.entries(f).filter(([p])=>p.startsWith('data_foundation/')).map(([p,d])=>[datasetForFile(p.split('/').at(-1)),d]));
const proposals=pending.filter(p=>amended.has(p.id)&&p.category==='foundation'),index=new Map(records(files).map(r=>[r.id,r])),touched=new Set();
for(const p of proposals)for(const e of p.elements){assert(!touched.has(e.record_id),'Overlapping record '+e.record_id);touched.add(e.record_id);assert.deepEqual(e.before,index.get(e.record_id));assert.notDeepEqual(e.before,e.after);}
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of proposals)assert.deepEqual(validateCatalogue(documents(transact(files,request([p])).files)).errors,[],'Independent approval '+p.id);
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(proposals);assert.deepEqual(records(result),records(apply([...proposals].reverse())));
for(const order of [proposals,[...proposals].reverse()]){let state=files;for(const p of order)state=transact(state,request([p])).files;assert.deepEqual(records(state),records(result));}
assert.deepEqual(validateCatalogue(documents(result)).errors,[]);
const final=new Map(records(result).map(r=>[r.id,r]));
for(const [id,r] of index)if(!touched.has(id))assert.deepEqual(final.get(id),r);
const boundary=b=>b.kind==='simulation_end'?simulationEnd:b.kind==='event'?final.get(b.event_id).time.value:undefined;
for(const row of amendment.composition_date_evidence){const r=final.get(row.record_id),v=r.composition_history.find(v=>v.version_number===row.version_number);assert.deepEqual(v.effective_from,row.effective_from);assert.deepEqual(v.effective_until,row.effective_until);}
for(const r of final.values()){
 if(r.id.startsWith('assumption.')){assert(r.topic);assert(r.statements?.length);assert(!('statement' in r));}
 const history=r.composition_history||[];
 for(const [i,v] of history.entries()){
  if(i===history.length-1)assert.equal(v.effective_until.kind,'simulation_end');
  else assert.deepEqual(v.effective_until,history[i+1].effective_from);
  if(v.effective_from.kind==='unknown')assert.equal(r.id,'device.aurelia_ram_16kb_card');
  for(const line of v.composition_definition){
   if(!line.target.version_number)continue;
   const child=final.get(line.target.record_id).composition_history.find(c=>c.version_number===line.target.version_number);
   const start=boundary(v.effective_from),childStart=boundary(child.effective_from);
   if(start&&childStart)assert(childStart<=start,'Child unavailable at parent start '+r.id+' -> '+line.target.record_id);
  }
 }
}
const assumptionAmendment=amended.get('change.closeout_planning_source_cleanup');
const cleaned=new Map(assumptionAmendment.before.elements.map(e=>[e.record_id,e.after.statement]));
const normalize=s=>s.replace(/\s+/g,' ').trim();
for(const e of assumptionAmendment.after.elements)assert.equal(normalize(e.after.statements.join(' ')),normalize(cleaned.get(e.record_id)||e.before.statement),'Assumption meaning changed '+e.record_id);
assert.equal(final.get('software_edition.cpm_model_ii').version,'1.6');
for(const row of amendment.media_quantity_evidence){const v=final.get(row.record_id).composition_history.find(v=>v.version_number===row.version_number);assert.equal(v.composition_definition.find(l=>l.id===row.line_id).quantity,row.quantity);}
for(const id of ['product.retail.connect_office','product.retail.cpm_migration'])assert.equal(final.get(id).composition_history[0].composition_definition[0].quantity,null);
assert(final.get('product.service_regular_support').specification.some(s=>s.value==='10% discount on depot repairs'));
for(const p of pending.filter(p=>p.category==='discussion'))assert.throws(()=>transact(files,{action:'approve_change',change_id:p.id,proposal_sha256:hash(p)}),/Discussion entries cannot be authorized/);
assert.deepEqual(files,original,'Simulation mutated its source');
console.log(JSON.stringify({result:'passed',feedback_items:amendment.amendments.length,pending_concrete:proposals.length,changed_records:touched.size,dated_versions:amendment.composition_date_evidence.length,diskette_quantities:amendment.media_quantity_evidence.length,remaining_discussions:pending.filter(p=>p.category==='discussion').length,foundation_unchanged_on_disk:true},null,2));
