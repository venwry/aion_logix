import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateCatalogue} from './validate-catalogue.js';
import {datasets,datasetPath} from '../code/model-contract.js';
import {compositionTree,flattenedBOM} from '../code/product-catalog-model.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='data_storytelling/review_evidence/cartridge-storage-definition/';
const baseline=read(root+'baseline.json'),summary=read(root+'summary.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const index=new Map(records(files).map(r=>[r.id,r]));
const proposals=files['data_storytelling/change.json'].change.filter(p=>summary.proposal_ids.includes(p.id));
assert.equal(proposals.length,6);
assert.deepEqual(files['data_storytelling/change.json'].change.filter(p=>!summary.proposal_ids.includes(p.id)),baseline.existing_proposals);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of proposals){
 assert.equal(p.elements.length,2);
 for(const e of p.elements){
  assert.deepEqual(e.before,index.get(e.record_id));
  if(e.record_type==='device'){
   const withoutRequirements=r=>{r=structuredClone(r);r.composition_history.forEach(v=>delete v.assembly_requirements);return r;};
   assert.deepEqual(withoutRequirements(e.before),withoutRequirements(e.after));
  }else{
   assert.equal(e.after.supply_form,'supplied_set');assert.equal(e.after.kind,'supplied_assembly');
   assert.deepEqual(e.after.supplier_actor_ids,e.before.supplier_actor_ids);
   const capacity=e.after.technical_specification.parameters.find(x=>x.key==='rom_capacity_bytes');
   if(e.record_id.includes('.business_tools_aurelia.'))assert.equal(capacity.value,16384);else assert.equal(capacity,undefined);
   assert(!e.after.technical_specification.parameters.some(x=>x.key==='storage_device_count'));
  }
 }
 assert.doesNotThrow(()=>transact(files,request([p])));
}
const all=transact(files,request(proposals)).files;
assert.deepEqual(validate(all).errors,[]);
assert.deepEqual(validateCatalogue(Object.fromEntries(datasets.map(n=>[n,all[datasetPath(n)]]))).errors,[]);
const reverse=transact(files,request([...proposals].reverse())).files;
assert.deepEqual(records(reverse),records(all));
assert.equal(transact(all,request(proposals)).changed,false);
const affected=new Set(),bySet=[];
for(const p of proposals){const id=p.elements.find(e=>e.record_type==='base_part').record_id,products=new Set();
 for(const product of [...index.values()].filter(r=>r.id.startsWith('product.')))for(const v of product.composition_history||[]){
  if(flattenedBOM(compositionTree(index,product.id,v.version_number)).some(n=>n.record.id===id&&n.quantity!==0)){products.add(product.id);affected.add(product.id);}
 }
 bySet.push({record_id:id,product_ids:[...products].sort()});
}
for(const [p,digest] of Object.entries(baseline.protected_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),digest,p);
console.log(JSON.stringify({result:'passed',proposals:6,records:12,independent_combined_reverse_approval_and_retry:true,foundation_authorization_discussions_and_calculations_unchanged:true,affected_offerings:affected.size,composition_trace:bySet},null,2));
