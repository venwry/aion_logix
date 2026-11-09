// Review a pinned audit queue without applying changes to disk or resolving remarks.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasetForFile} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
import {pointBounds} from '../code/temporal.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/closeout-audit/';
// Saved feedback has its own lineage-preserving verification, without rewriting the baseline inventory.
if(fs.existsSync('data_storytelling/review_evidence/unused-field-cleanup/audit.json')){
 await import('./verify-unused-field-cleanup.js');
}else if(fs.existsSync('data_storytelling/review_evidence/fixed-composition-offerings/review.json')){
 await import('./verify-fixed-composition-offerings.js');
}else if(fs.existsSync('data_storytelling/review_evidence/technology-chapters/migration.json')){
 await import('./verify-technology-chapters.js');
}else if(fs.existsSync(root+'feedback-amendment.json')){
 await import('./verify-closeout-feedback.js');
}else{
const inventory=read(root+'inventory.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),before=structuredClone(files);
const pending=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const groups=inventory.items.map(item=>{
 const p=pending.find(p=>p.id===item.proposal_id)||decisions.findLast(d=>d.change_id===item.proposal_id&&['approve_change','remove_change'].includes(d.action))?.proposal;
 assert(p,'Missing review item '+item.proposal_id);assert.equal(hash(p),item.proposal_sha256,'Revised item needs amended audit '+p.id);return p;
});
assert.equal(groups.filter(p=>p.category==='foundation').length,10);assert.equal(groups.filter(p=>p.category==='discussion').length,31);
assert.deepEqual(validate(files).errors,[]);
const docs=f=>Object.fromEntries(Object.entries(f).filter(([p])=>p.startsWith('data_foundation/')).map(([p,d])=>[datasetForFile(p.split('/').at(-1)),d]));
assert.deepEqual(validateCatalogue(docs(files)).errors,[]);
const concrete=pending.filter(p=>groups.some(g=>g.id===p.id)&&p.category==='foundation'),discussion=pending.filter(p=>groups.some(g=>g.id===p.id)&&p.category==='discussion');
if(groups.every(p=>pending.some(x=>x.id===p.id)))for(const [path,sha] of Object.entries(inventory.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unintended source mutation '+path);
const touched=new Set(),index=new Map(records(files).map(r=>[r.id,r]));
const parents=new Map(),own=(id,parent)=>{if(!parents.has(id))parents.set(id,new Set());parents.get(id).add(parent);};
for(const r of index.values()){
 if(r.id.startsWith('process.')){if(r.parent_process_id)own(r.id,r.parent_process_id);for(const s of r.steps)if(s.event_id||s.process_id)own(s.event_id||s.process_id,r.id);for(const b of Object.values(r.period))if(b.precision==='event')own(b.value,r.id);assert(pointBounds(r.period.start,index)&&pointBounds(r.period.end,index),'Unknown process boundary '+r.id);}
 if(r.id.startsWith('event.'))for(const id of r.process_ids||[])own(r.id,id);
}
for(const [id,owners] of parents){
 assert.equal(owners.size,1,'Conflicting owners '+id);const r=index.get(id),parent=index.get([...owners][0]);
 const start=pointBounds(r.time||r.period.start,index),end=pointBounds(r.time||r.period.end,index),pStart=pointBounds(parent.period.start,index),pEnd=pointBounds(parent.period.end,index);
 assert(start.start>=pStart.start&&end.end<=pEnd.end,'Child outside parent '+id);
 const seen=new Set();let cursor=id;while(cursor){assert(!seen.has(cursor),'Ownership cycle '+id);seen.add(cursor);cursor=[...(parents.get(cursor)||[])][0];}
}
for(const p of concrete)for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,index.get(e.record_id));assert.notDeepEqual(e.before,e.after,'No-op edit');for(const key of ['id','time','period','composition_history','launch_campaign_id','launch_event_id'])assert.deepEqual(e.after[key],e.before[key],'Out-of-scope '+e.record_id+'.'+key);}
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of concrete)assert.deepEqual(validateCatalogue(docs(transact(files,request([p])).files)).errors,[],'Independent approval '+p.id);
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(concrete);assert.deepEqual(records(result),records(apply([...concrete].reverse())));
for(const order of [concrete,[...concrete].reverse()]){let current=files;for(const p of order)current=transact(current,request([p])).files;assert.deepEqual(records(current),records(result));}
assert.deepEqual(validateCatalogue(docs(result)).errors,[]);
for(const p of discussion){
 assert.deepEqual(p.elements,[]);assert.throws(()=>transact(files,{action:'approve_change',change_id:p.id,proposal_sha256:hash(p)}),/Discussion entries cannot be authorized/);
 for(const id of p.affected_record_ids)assert(index.has(id));
}
const afterIndex=new Map(records(result).map(r=>[r.id,r]));
for(const [id,r] of index)if(!touched.has(id))assert.deepEqual(afterIndex.get(id),r);
assert.equal(records(result).length,1080);assert.equal([...afterIndex.keys()].filter(id=>id.startsWith('product.')).length,104);
assert(afterIndex.get('product.service_regular_support').specification.some(s=>s.value==='10% discount on depot repairs'));
for(const r of files['data_storytelling/reconciliation_issue.json'].reconciliation_issue)for(const id of r.affected_ids)assert(index.has(id),'Retired editorial target '+id);
const archived=fs.readFileSync(inventory.editorial_issue_reconciliation.archived_path);assert.equal(crypto.createHash('sha256').update(archived).digest('hex'),inventory.editorial_issue_reconciliation.original_sha256);
for(const item of inventory.documentation){assert(fs.existsSync(item.path),item.path);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex'),item.sha256,'Documentation changed since audit '+item.path);}
assert.deepEqual(files,before,'Simulation changed input');
console.log(JSON.stringify({result:'passed',foundation_records:1080,products_with_launch_pairs:104,concrete_proposals:10,discussion_entries:31,changed_records_if_approved:touched.size,foundation_and_authorization_files_preserved:true,independent_batch_reverse_and_sequential_approvals_valid:true,discussions_cannot_authorize:true,strict_catalogue_passes_before_and_after:true,legacy_issue_targets_resolve:true,markdown_files_audited:inventory.documentation.length},null,2));

}
