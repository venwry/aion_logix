import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const impact=(key,id)=>({[key]:id,relationship:'competes_with',date:'1979-12',assumption_description:'Assume {scope}.',comparison_description:'An alternative for {scope}.',outcomes_description:'Adoption remains conditional.',parameters:[{key:'scope',value:'qualified office configurations'}]});
function fixture(){const d=readDocuments('data_foundation'),r=d.external_product.external_product[0];r.description='';r.impacted_products=[impact('product_id','product.aurelia_mono'),impact('product_id','external_product.apple_ii')];r.impacted_standards=[impact('standard_id','technology.flexibus')];return {d,r};}
test('external impacts accept both product types, empty descriptions and all relationship values',()=>{
 for(const relationship of ['implements','requires','supports','extends','competes_with','incompatible_with']){const {d,r}=fixture();for(const key of ['impacted_products','impacted_standards'])r[key].forEach(i=>i.relationship=relationship);assert.deepEqual(validateDocuments(d).errors,[]);}
});
test('external impacts reject missing products, nonstandard technologies, duplicates and malformed prose',()=>{
 for(const mutate of [r=>r.impacted_products[0].product_id='product.missing',r=>r.impacted_products[0].product_id='device.flexidisk',r=>r.impacted_products[0].product_id=r.id,r=>r.impacted_products.push(r.impacted_products[0]),r=>r.impacted_standards[0].standard_id='technology.nmos_3um',r=>r.impacted_products[0].relationship='strengthens',r=>delete r.impacted_products[0].relationship,r=>r.impacted_standards[0].relationship='strengthens',r=>r.impacted_products[0].date='1979-02-30',r=>r.impacted_products[0].parameters=[],r=>r.impacted_products[0].parameters.push({key:'unused',value:'x'})]){
 const {d,r}=fixture();mutate(r);assert(validateDocuments(d).errors.length,'invalid impact accepted');
 }
});
test('approved standard impacts remain compatible until individually migrated',()=>{const {d,r}=fixture();delete r.impacted_standards[0].relationship;assert.deepEqual(validateDocuments(d).errors,[]);});
