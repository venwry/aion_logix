import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {resolveComposition,validateCompositions} from '../../code/composition.js';
const graph=()=>new Map([
 ['product.example',{id:'product.example',composition_history:[{version_number:1,effective_from:{kind:'unknown'},effective_until:{kind:'unknown'},composition_definition:[{id:'device',target:{record_id:'device.example',version_number:1},quantity:2},{id:'support',target:{record_id:'product.support'},quantity:2}]}]}],
 ['device.example',{id:'device.example',composition_history:[{version_number:1,effective_from:{kind:'unknown'},effective_until:{kind:'unknown'},composition_definition:[{id:'part',target:{record_id:'base_part.example'},quantity:3}]}]}],
 ['base_part.example',{id:'base_part.example'}],['product.support',{id:'product.support',kind:'service'}]
]);
test('required lines without unit or supply condition resolve nested quantities and services',()=>{
 const g=graph(),r=resolveComposition(g,'product.example',1);
 assert.deepEqual(validateCompositions(g),[]);assert.equal(r.leaves[0].quantity,6);assert.equal(r.services[0].quantity,2);assert.equal(r.quantities_complete,true);
 assert.deepEqual(r.leaves[0].conditions,[]);assert(!Object.hasOwn(r.leaves[0],'unit'));
 const l=g.get('device.example').composition_history[0].composition_definition[0];
 l.quantity=.5;assert.match(validateCompositions(g).join('\n'),/integers/);
 l.quantity=null;assert.deepEqual(validateCompositions(g),[]);assert.equal(resolveComposition(g,'product.example',1).leaves[0].quantity,null);assert.equal(resolveComposition(g,'product.example',1).quantities_complete,false);
});
test('legacy conditional ancestors and set units remain effective during review',()=>{
 const g=graph(),p=g.get('product.example').composition_history[0].composition_definition[0],l=g.get('device.example').composition_history[0].composition_definition[0];
 p.supply_condition={kind:'conditional',description:'Legacy reviewed condition'};l.unit='set';
 const r=resolveComposition(g,'product.example',1);assert.equal(r.leaves[0].quantity,6);assert.equal(r.leaves[0].unit,'set');assert.deepEqual(r.leaves[0].conditions,['Legacy reviewed condition']);assert.equal(r.quantities_complete,false);
});
test('schema accepts omitted fields without weakening quantity or legacy condition validation',()=>{
 const d=readDocuments('data_foundation');
 for(const t of ['product','device','software_edition'])for(const r of d[t][t])for(const v of r.composition_history||[])for(const l of v.composition_definition){delete l.unit;delete l.supply_condition;}
 assert.deepEqual(validateDocuments(d).errors,[]);
 const l=d.device.device[0].composition_history[0].composition_definition[0];
 for(const quantity of [0,-1,1.5]){l.quantity=quantity;assert(validateDocuments(d).errors.length);}
 l.quantity=1;l.supply_condition={kind:'conditional'};assert(validateDocuments(d).errors.length);
 l.supply_condition={kind:'always',description:'Unexpected'};assert(validateDocuments(d).errors.length);
});
