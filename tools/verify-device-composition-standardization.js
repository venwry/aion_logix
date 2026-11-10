import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {resolveComposition} from '../code/composition.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/device-composition-standardization/';
const ps=read(root+'proposals.json').change,audit=read(root+'audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),initial=structuredClone(files);
const queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const waiting=ps.filter(p=>queue.some(q=>q.id===p.id));const apply=ps=>ps.length?transact(files,request(ps)).files:files;
assert.deepEqual(validate(files).errors,[]);
const before=new Map(records(files).map(r=>[r.id,r])),touched=new Set();
for(const p of ps){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,p);
 for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.notDeepEqual(e.before,e.after);if(e.before)before.set(e.record_id,e.before);else before.delete(e.record_id);}
 if(waiting.includes(p))assert.deepEqual(validate(apply([p])).errors,[]);
}
const result=apply(waiting),after=new Map(records(result).map(r=>[r.id,r]));assert.deepEqual(validate(result).errors,[]);
for(const id of audit.professional_devices){
 const old=before.get(id).composition_history.find(v=>v.version_number===2),versions=after.get(id).composition_history;assert.equal(versions.length,1);const v=versions[0];
 assert.equal(v.version_number,1);assert.deepEqual(v.effective_from,{kind:'event',event_id:audit.handover_event});assert.deepEqual(v.effective_until,{kind:'simulation_end'});
 for(const field of ['technical_definition','composition_definition','assembly_requirements'])assert.deepEqual(v[field],old[field]);
 const expected=structuredClone(before.get(id));expected.composition_history=versions;assert.deepEqual(after.get(id),expected);
}
const event=structuredClone(before.get(audit.handover_event));event.time={value:audit.handover_date,precision:'day'};event.description=event.description.replace('Around June, deliver','On 8 June 1982, deliver');assert.deepEqual(after.get(event.id),event);
const normalize=r=>r.leaves.map(({path,...leaf})=>({...leaf,path:path.map(p=>({...p,version_number:audit.professional_devices.includes(p.id)?1:p.version_number}))}));
let pins=0;
for(const row of audit.repins){
 const expected=structuredClone(before.get(row.record_id));
 for(const pin of row.pins){const v=expected.composition_history.find(v=>v.version_number===pin.version_number),line=v.composition_definition.find(l=>l.id===pin.line_id);assert.equal(line.target.version_number,2);line.target.version_number=1;pins++;}
 assert.deepEqual(after.get(row.record_id),expected);
 for(const v of expected.composition_history)assert.deepEqual(normalize(resolveComposition(after,row.record_id,v.version_number)),normalize(resolveComposition(before,row.record_id,v.version_number)));
}
assert.equal(pins,8);
for(const id of audit.ram_modules){
 const old=before.get(id),current=after.get(id);assert(!Object.hasOwn(current,'technical_definition'));assert.equal(current.composition_history.length,1);
 const v=current.composition_history[0],expected=structuredClone(old.technical_definition);if(id.endsWith('_64kb'))expected.specification.data_width_bits=8;
 assert.deepEqual(v.technical_definition,expected);assert.deepEqual(v.effective_from,{kind:'unknown'});assert.deepEqual(v.effective_until,{kind:'simulation_end'});assert.deepEqual(current.requirements,old.requirements);
 const s=v.technical_definition.specification,dram=v.composition_definition.filter(l=>l.target.record_id===s.chip_type_id);assert.equal(dram.length,1);assert.equal(dram[0].quantity,s.chips);
 assert.equal(s.chips*before.get(s.chip_type_id).technical_definition.specification.capacity_kbit/8,s.capacity_kb);
 assert.equal(v.composition_definition.length,4);
 for(const line of v.composition_definition){assert(!Object.hasOwn(line,'unit'));assert(!Object.hasOwn(line,'supply_condition'));assert(!Object.hasOwn(line,'requirements'));assert(after.has(line.target.record_id));}
 const resolved=resolveComposition(after,id,1);assert.equal(resolved.leaves.length,4);
}
assert.equal(ps.flatMap(p=>p.elements).filter(e=>e.before===null&&e.record_type==='base_part').length,6);
for(const r of records(result)){
 if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));
 for(const v of r.composition_history||[])for(const l of v.composition_definition)if(audit.professional_devices.includes(l.target.record_id))assert.equal(l.target.version_number,1);
}
const sortedRecords=files=>records(files).sort((a,b)=>a.id.localeCompare(b.id));
const permutations=xs=>xs.length?xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];
for(const order of permutations(waiting)){
 assert.deepEqual(sortedRecords(apply(order)),sortedRecords(result));let sequential=files;for(const p of order)sequential=transact(sequential,request([p])).files;assert.deepEqual(sortedRecords(sequential),sortedRecords(result));
}
const docs=Object.fromEntries(Object.entries(result).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]));assert.deepEqual(validateCatalogue(docs).errors,[]);
assert.deepEqual(files,initial);
console.log(JSON.stringify({result:'passed',proposals:ps.length,pending:waiting.length,records:touched.size,devices:4,product_version_pins_updated:pins,product_inventories:'unchanged',new_support_parts:6,ram_capacity_checks:'32 KiB and 64 KiB',independent_batch_sequential_approval:'passed',live_foundation_and_authorization:'unchanged'},null,2));
