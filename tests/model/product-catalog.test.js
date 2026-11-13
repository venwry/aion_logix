import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compositionTree,headlineSpecs,flattenedBOM,launchGroups,configurationGroups} from '../../code/product-catalog-model.js';
const records=fs.readdirSync('data_foundation').filter(f=>f.endsWith('.json')).flatMap(f=>Object.values(JSON.parse(fs.readFileSync('data_foundation/'+f))).filter(Array.isArray).flat()).filter(r=>r?.id);
const index=new Map(records.map(r=>[r.id,r]));
test('all product revisions resolve with their pinned children and appear once in launch groups',()=>{
 const products=records.filter(r=>r.id.startsWith('product.'));
 for(const p of products)for(const v of p.composition_history||[])assert.doesNotThrow(()=>compositionTree(index,p.id,v.version_number));
 const grouped=launchGroups(products,index).flatMap(c=>c.events.flatMap(e=>e.products.map(p=>p.id)));
 assert.equal(grouped.length,products.length);assert.equal(new Set(grouped).size,products.length);
});
test('computer headline RAM excludes video RAM and does not count chips twice',()=>{
 for(const [id,ram,cpu] of [['product.athena',256,'base_part.era2_12mhz'],['product.aurelia_mono',48,'base_part.z80a']]){
 const tree=compositionTree(index,id,1),s=headlineSpecs(tree);assert.equal(s.ramKiB,ram);assert.equal(s.ramKnown,true);assert.deepEqual(s.processors,[cpu]);assert.equal(configurationGroups(tree).length,6);assert.ok(flattenedBOM(tree).length>20);
 }
});
test('nested quantities and unknown memory remain unknown',()=>{
 const root={id:'product.test',kind:'computer',composition_history:[{version_number:1,composition_definition:[{id:'a',quantity:3,target:{record_id:'device.memory',version_number:2}}]}]};
 const memory={id:'device.memory',kind:'memory_module',technical_specification:{parameters:[{key:'capacity_kb',value:64}]},composition_history:[{version_number:2,composition_definition:[{id:'b',quantity:8,target:{record_id:'base_part.ram'}}]}]};
 const idx=new Map([root,memory,{id:'base_part.ram'}].map(r=>[r.id,r]));
 let tree=compositionTree(idx,root.id,1);assert.equal(headlineSpecs(tree).ramKiB,192);assert.equal(flattenedBOM(tree)[1].quantity,24);
 root.composition_history[0].composition_definition[0].quantity=null;tree=compositionTree(idx,root.id,1);assert.equal(headlineSpecs(tree).ramKnown,false);assert.equal(flattenedBOM(tree)[1].quantity,null);
 assert.throws(()=>compositionTree(idx,root.id,2),/Missing composition version/);
});
test('launch groups sort campaigns and their events chronologically, undated last',()=>{
 const cs=[{id:'campaign.late',period:{start:{value:'1980',precision:'year'}}},{id:'campaign.early',period:{start:{value:'1978',precision:'year'}}}];
 const es=[{id:'event.late',time:{value:'1978-06',precision:'month'}},{id:'event.early',time:{value:'1978-04',precision:'month'}}];
 const idx=new Map([...cs,...es].map(r=>[r.id,r]));
 const ps=[{id:'product.a',launch_campaign_id:cs[0].id},{id:'product.b',launch_campaign_id:cs[1].id,launch_event_id:es[0].id},{id:'product.c',launch_campaign_id:cs[1].id,launch_event_id:es[1].id},{id:'product.d'}];
 const groups=launchGroups(ps,idx);assert.equal(groups[0].record.id,'campaign.early');assert.equal(groups[0].events[0].record.id,'event.early');assert.equal(groups.at(-1).record,undefined);
});
