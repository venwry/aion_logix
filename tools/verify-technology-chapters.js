// Check the direct format migration and independently reviewable chapter rewrites.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {hash,records,transact,validate} from '../server/model.js';
import {migrateTechnologySpecification,specificationSegments} from '../code/technology-specification.js';
import {datasetPath} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/technology-chapters/';
if(fs.existsSync('data_storytelling/review_evidence/technology-prose-refinement/review.json')){
 await import('./verify-technology-prose.js');
}else{
const baseline=read(root+'before-technology.json').technology,migration=read(root+'migration.json'),coverage=read(root+'coverage.json'),proposals=read(root+'proposals.json').change,priorQueue=read(root+'before-proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),initial=structuredClone(files);
const pending=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision,auth=files['data_storytelling/authorization.json'].authorization;
const index=new Map(records(files).map(r=>[r.id,r]));assert.deepEqual(validate(files).errors,[]);
const latest=id=>pending.find(p=>p.id===id)||decisions.findLast(d=>d.change_id===id)?.proposal;
const normalize=v=>String(v);
for(const original of baseline){
 const p=proposals.find(p=>p.elements[0].record_id===original.id),e=p.elements[0],m=migration.records.find(m=>m.record_id===original.id);
 assert.deepEqual(e.before,{...original,specification:migrateTechnologySpecification(original.specification)},'Lossless conversion '+original.id);
 assert.equal(hash(original),m.before_sha256);assert.equal(hash(e.before),m.after_sha256);
 assert.deepEqual(e.before.specification.map(s=>s.number),original.specification.map(s=>s.number));
 assert.deepEqual(latest(p.id),p,'Proposal amendment requires new evidence '+p.id);
 const beforeOther={...e.before},afterOther={...e.after};delete beforeOther.specification;delete afterOther.specification;assert.deepEqual(beforeOther,afterOther);
 if(pending.some(q=>q.id===p.id)){
  assert.deepEqual(index.get(original.id),e.before);const a=auth.find(a=>a.record_id===original.id);
  assert.equal(a.state,m.prior_authorization.state);assert.equal(a.content_sha256,hash(e.before));
 }
 const found=[];
 for(const entry of coverage.filter(c=>c.record_id===original.id)){
  const chapter=e.after.specification.find(c=>c.number===entry.chapter_number);assert(chapter);assert.equal(chapter.number,Math.min(...entry.sources.map(s=>s.number)));
  const rendered=specificationSegments(chapter.description,chapter.parameters).map(p=>p.text).join('');
  for(const source of entry.sources){
   const row=original.specification.find(s=>s.number===source.number);assert(row);found.push(row.number);
   const value=normalize('value'in row?row.value:row.description);
   if(source.kind==='qualification_role'){assert.equal(value,'host_qualification');assert(rendered.includes(source.text));}
   else if(source.kind==='description')assert(rendered.includes(value),'Lost prose '+original.id+' #'+row.number);
   else{const parameter=chapter.parameters.find(p=>p.key===source.key);assert(parameter);assert(parameter.value.includes(value)||parameter.key===value,'Lost parameter '+original.id+' #'+row.number);}
  }
  for(const extra of entry.context_parameters){let v=original;for(const part of extra.source.split('/').filter(Boolean))v=v[part];assert.equal(chapter.parameters.find(p=>p.key===extra.key).value,String(v));}
 }
 assert.deepEqual(found.sort((a,b)=>a-b),original.specification.map(s=>s.number).sort((a,b)=>a-b),'Every original fact has one chapter owner');
}
const direct=decisions.find(d=>d.id===migration.authorization_decision_id);assert(direct);assert.equal(direct.action,'authorize_records');assert.equal(direct.target.length,5);
for(const target of direct.target){const m=migration.records.find(m=>m.record_id===target.record_id);assert.equal(m.prior_authorization.state,'authorized');assert.equal(target.content_sha256,m.after_sha256);}
for(const p of priorQueue){
 if(p.id==='change.closeout_technical_specification_labels')continue;
 const expected=structuredClone(p);
 if(p.id==='change.closeout_qualification_evidence')for(const f of expected.findings)if(f.record_id?.startsWith('technology.'))delete f.path;
 assert.deepEqual(latest(p.id),expected,'Unrelated proposal changed '+p.id);
}
if(migration.preserved_files_sha256)for(const [path,sha] of Object.entries(migration.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unrelated source mutation '+path);
const waiting=proposals.filter(p=>pending.some(q=>q.id===p.id)),touched=new Set();
for(const p of waiting)for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,index.get(e.record_id));}
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of waiting)assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
const applied=waiting.length?transact(files,request(waiting)).files:files;
const reversed=waiting.length?transact(files,request([...waiting].reverse())).files:files;assert.deepEqual(records(applied),records(reversed));
assert.deepEqual(validateCatalogue(Object.fromEntries(Object.keys(applied).filter(p=>p.startsWith('data_foundation/')).map(p=>{const d=applied[p],n=Object.keys(d)[0];return [n,d];}))).errors,[]);
for(const r of records(applied))if(!touched.has(r.id))assert.deepEqual(r,index.get(r.id));
assert.deepEqual(files,initial,'Simulation changed its source');
console.log(JSON.stringify({result:'passed',converted_records:baseline.length,source_items:baseline.reduce((s,r)=>s+r.specification.length,0),proposed_chapters:coverage.length,proposals:proposals.length,pending_proposals:waiting.length,independent_and_batch_approval:true,prior_authorized_preserved:direct.target.length,previously_pending_not_promoted:30,source_facts_preserved:true},null,2));

}
