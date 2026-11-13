import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {validateAnnualSales} from '../../tools/validate-calculation.js';
const documents=()=>readDocuments('data_foundation');
const impact=(key,id)=>({[key]:id,direction:'strengthens',description:'Adoption improves with {benefit}.',parameters:[{key:'benefit',value:'shared applications'}]});
function withImpacts(){const d=documents(),r=d.market_response.market_response[0];r.impacted_standards=[impact('standard_id','technology.flexibus')];r.impacted_products=[impact('product_id','product.aurelia_mono'),impact('product_id','external_product.trs80_model_ii')];return d;}
test('market responses accept both impact sections and validate target kinds and parameters',()=>{
 assert.deepEqual(validateDocuments(withImpacts()).errors,[]);
 for(const [mutate,match] of [
 [r=>r.impacted_standards[0].standard_id='technology.nmos_3um',/standard must/],
 [r=>r.impacted_standards[0].standard_id='technology.missing',/unresolved reference/],
 [r=>r.impacted_products[0].product_id='actor.logix',/pattern/],
 [r=>r.impacted_products.push(structuredClone(r.impacted_products[0])),/duplicate product_id/],
 [r=>r.impacted_standards[0].parameters=[],/unresolved parameter/],
 [r=>r.impacted_standards[0].parameters.push({key:'benefit',value:'other'}),/duplicate parameter/],
 [r=>r.impacted_standards[0].parameters.push({key:'unused',value:'other'}),/unused parameter/],
 [r=>r.impacted_standards[0].direction='increase',/allowed values/]]){
 const d=withImpacts();mutate(d.market_response.market_response[0]);assert(validateDocuments(d).errors.some(e=>match.test(e)),String(match));
 }
});
test('retired live structures are rejected while current data passes',()=>{
 assert.deepEqual(validateDocuments(documents()).errors,[]);assert(!fs.existsSync('schemas/actor_relationship.schema.json'));
 const d=documents();d.actor_relationship={actor_relationship:[]};assert(validateDocuments(d).errors.some(e=>e.includes('Unknown dataset')));
 const x=documents();x.external_product.external_product[0].specification=[{no:1,description:'Old',ref_id:'actor.dri',ref_role:'publisher'}];assert(validateDocuments(x).errors.length);
 const c=documents();c.campaign.campaign[0]={id:'campaign.legacy',title:'Old campaign',objective:'Legacy',lead_actor_ids:['actor.logix'],process_id:'process.ncc1979_campaign'};assert(validateDocuments(c).errors.length);
});
const row=()=>({id:'annual_sales.test',product_id:'external_product.test',year:1980,geography:'US',segment:'business',unit:'computer',estimated_units:100,low_units:50,high_units:150,basis:'Test estimate.'});
const records=new Map([['external_product.test',{id:'external_product.test',release:'1979-10'}],['product.test',{id:'product.test'}]]);
test('annual sales is independent of foundation authorization and checks ranges, references and scopes',()=>{
 assert.deepEqual(validateAnnualSales({annual_sales:[row()]},records).errors,[]);
 for(const mutate of [r=>r.high_units=90,r=>delete r.high_units,r=>r.estimated_units=-1,r=>r.estimated_units=1.2,r=>r.product_id='external_product.missing',r=>r.unit='other',r=>r.updated_at='yesterday',r=>r.geography=' ',r=>r.foundation_revision='abc',r=>r.authorization='approved']){const r=row();mutate(r);assert(validateAnnualSales({annual_sales:[r]},records).errors.length);}
 const other={...row(),id:'annual_sales.second',scenario:'baseline'};assert(validateAnnualSales({annual_sales:[row(),other]},records).errors.some(e=>e.includes('duplicate product/year')));
 const alt={...row(),id:'annual_sales.third',scenario:'optimistic'};assert.deepEqual(validateAnnualSales({annual_sales:[row(),alt]},records).errors,[]);
 const zero={...row(),estimated_units:0,low_units:0,high_units:0};assert.deepEqual(validateAnnualSales({annual_sales:[zero]},records).errors,[]);
 assert(validateAnnualSales({annual_sales:[{...row(),year:1978}]},records).warnings.length);
 assert.deepEqual(validateAnnualSales({annual_sales:[{...row(),product_id:'product.test'}]},records).errors,[]);
 const unit={...row(),id:'annual_sales.other',year:1981,unit:'software_license'};assert(validateAnnualSales({annual_sales:[row(),unit]},records).errors.some(e=>e.includes('inconsistent unit')));
});
