import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {resolveComposition} from '../code/composition.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/fixed-required-compositions/';
const ps=read(root+'proposals.json').change,previous=read('data_storytelling/review_evidence/unused-field-cleanup/proposals.json').change,audit=read(root+'audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const initial=structuredClone(files),queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const waiting=ps.filter(p=>queue.some(q=>q.id===p.id));
const apply=ps=>ps.length?transact(files,request(ps)).files:structuredClone(files);
const touched=new Set(),counts={};
assert.deepEqual(validate(files).errors,[]);
for(const p of ps){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,p);
 const old=previous.find(o=>o.id===p.id);assert(old);
 for(const e of old.elements){
  const revised=p.elements.find(x=>x.record_id===e.record_id);assert(revised);assert.deepEqual(revised.before,e.before);
  const expected=structuredClone(e.after);
  for(const v of expected.composition_history||[])for(const l of v.composition_definition){delete l.unit;delete l.supply_condition;}
  // These five devices additionally freeze the OEM assembly boundary in prose.
  if(audit.conditional_lines.some(c=>c.device_id===e.record_id)){
   expected.requirements=revised.after.requirements;
   expected.composition_history.forEach((v,i)=>v.assembly_requirements=revised.after.composition_history[i].assembly_requirements);
  }
  assert.deepEqual(revised.after,expected,e.record_id);
 }
 for(const e of p.elements){
  assert(!touched.has(e.record_id),'Overlapping proposals');touched.add(e.record_id);
  assert.notDeepEqual(e.before,e.after);
  for(const v of e.after.composition_history||[])for(const l of v.composition_definition){
   assert(!Object.hasOwn(l,'unit'));assert(!Object.hasOwn(l,'supply_condition'));assert(!Object.hasOwn(l,'requirements'));
   counts[e.record_type]=(counts[e.record_type]||0)+1;
  }
 }
 if(waiting.includes(p))assert.deepEqual(validate(apply([p])).errors,[]);
}
assert.deepEqual(counts,{product:483,device:419,software_edition:98});
assert.equal(ps.flatMap(p=>p.elements).filter(e=>e.record_type==='base_part').length,10);
// Reconstruct the common before graph even after some or all proposals are approved.
const before=new Map(records(files).map(r=>[r.id,r]));
for(const p of ps)for(const e of p.elements)before.set(e.record_id,e.before);
const result=apply(waiting),after=new Map(records(result).map(r=>[r.id,r]));
const inventory=r=>[r.leaves,r.services,r.nodes].map(rows=>rows.map(({unit,conditions,...x})=>x));
for(const r of before.values())for(const v of r.composition_history||[]){
 const a=resolveComposition(before,r.id,v.version_number),b=resolveComposition(after,r.id,v.version_number);
 assert.deepEqual(inventory(b),inventory(a),'Changed targets/quantity/paths: '+r.id);
 assert(b.leaves.every(l=>!Object.hasOwn(l,'unit')&&l.conditions.length===0));
 assert(b.services.every(l=>!Object.hasOwn(l,'unit')&&l.conditions.length===0));
}
for(const c of audit.conditional_lines){
 assert.equal(resolveComposition(before,c.device_id,c.version_number).quantities_complete,false);
 assert.equal(resolveComposition(after,c.device_id,c.version_number).quantities_complete,true);
 const d=after.get(c.device_id),v=d.composition_history.find(v=>v.version_number===c.version_number);
 assert.equal(v.composition_definition.filter(l=>l.target.record_id===c.part_id).length,1);
 assert.equal(v.composition_definition.find(l=>l.id===c.line_id).quantity,1);
 assert(d.requirements.some(r=>/always fit/i.test(r.description)));
 assert(v.assembly_requirements.some(r=>/always fit/i.test(r.description)));
}
assert.deepEqual(after.get('base_part.sony_kv1204_display_assembly').technical_definition,before.get('base_part.sony_kv1204_display_assembly').technical_definition);
assert.match(after.get('base_part.sony_kv1204_display_assembly').description,/HV supply and deflection circuitry/);
for(const r of records(result))if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));
const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>j!==i)).map(t=>[x,...t])):[[]];
for(const order of permutations(waiting)){
 assert.deepEqual(records(apply(order)),records(result));
 let sequential=structuredClone(files);for(const p of order)sequential=transact(sequential,request([p])).files;
 assert.deepEqual(records(sequential),records(result));
}
assert.deepEqual(validate(result).errors,[]);
const docs=Object.fromEntries(Object.entries(result).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]));
assert.deepEqual(validateCatalogue(docs).errors,[]);
assert.deepEqual(files,initial);
console.log(JSON.stringify({result:'passed',proposals:ps.length,pending:waiting.length,records:touched.size,composition_lines:counts,mandatory_device_assemblies:audit.conditional_lines.length,independent_batch_and_sequential_approval:'passed',unchanged_inventory_quantities_and_paths:true,foundation_and_authorization_unchanged:true},null,2));
