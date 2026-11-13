import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateExternalProducts,validDirectDate} from '../code/external-products.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const fingerprint=hash(files),original=new Map(records(files).map(r=>[r.id,r]));
const ps=read('data_storytelling/review_evidence/ecosystem-iteration-1/proposals.json').change;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.deepEqual(validate(files).errors,[]);
const touched=new Set();
for(const p of ps){
 assert.deepEqual(files['data_storytelling/change.json'].change.find(q=>q.id===p.id),p);
 for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,original.get(e.record_id));
  if(e.record_type==='technology'){const expected=structuredClone(e.before);expected.kind=e.after.kind;assert.deepEqual(e.after,expected);}
  if(e.record_type==='external_product')for(const [i,s] of e.before.specification.entries()){
   const c=e.after.specification[i];assert.equal(c.number,s.no);assert(c.description.startsWith(s.description));assert.equal(c.chapter_name.toLowerCase(),s.ref_role.toLowerCase());assert.equal(c.parameters[0].value,s.ref_id);
  }
 }
 assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
}
const after=transact(files,request(ps)).files;assert.deepEqual(validate(after).errors,[]);
assert.deepEqual(records(after),records(transact(files,request([...ps].reverse())).files));
const index=new Map(records(after).map(r=>[r.id,r]));
for(const r of index.values())if(!touched.has(r.id))assert.deepEqual(r,original.get(r.id));
assert(![...index.keys()].some(id=>id.startsWith('actor_relationship.')));
for(const good of ['1979','1979-10','2000-02-29'])assert(validDirectDate(good));
for(const bad of ['0000','1900-02-29','1979-02-30','1979-13','1979-01-00','1979-1','event.tandy_release'])assert(!validDirectDate(bad));
const target=structuredClone(index.get('external_product.model_ii_flexibus'));
target.impacted_standards=[{standard_id:'technology.flexibus',date:'1979-10',assumption_description:'An optional {interface} expands the host.',comparison_description:'Implements the shared bus.',outcomes_description:'Availability may encourage adoption; sales are not established.',parameters:[{key:'interface',value:'board'}]}];
index.set(target.id,target);assert.deepEqual(validateExternalProducts(index),[]);
const wrapped=structuredClone(after);wrapped['data_foundation/external_products.json'].external_product=wrapped['data_foundation/external_products.json'].external_product.map(r=>r.id===target.id?target:r);assert.deepEqual(validate(wrapped).errors,[]);
const bad=(mutate,pattern)=>{const variant=structuredClone(target);mutate(variant);const map=new Map(index);map.set(variant.id,variant);assert(validateExternalProducts(map).some(e=>pattern.test(e)));};
bad(r=>r.impacted_standards[0].standard_id='technology.nmos_3um',/standard kind/);
bad(r=>r.impacted_standards.push(structuredClone(r.impacted_standards[0])),/duplicate impacted/);
bad(r=>r.impacted_standards[0].date='1979-02-30',/invalid standard impact date/);
bad(r=>r.impacted_standards[0].parameters=[],/unresolved parameter/);
bad(r=>r.impacted_standards[0].parameters.push({key:'unused',value:'text'}),/unused parameter/);
bad(r=>r.impacted_standards[0].parameters.push({key:'interface',value:'text'}),/duplicate parameter/);
assert.equal(hash(files),fingerprint);
console.log(JSON.stringify({result:'passed',proposals:ps.length,operations:touched.size,individual_and_batch_approval:'passed',negative_validation:'passed',foundation_and_authorization:'unchanged'}));
