import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {pricingAmounts,competitionBasket} from '../../code/product-pricing-model.js';
import {validateProductPricing} from '../../tools/validate-product-pricing.js';
test('20 percent fee is on cost, retail midpoint and losses are retained',()=>{
 assert.deepEqual(pricingAmounts(100,200),{manufacturing_cost:100,computerland_fee:20,break_even:120,competition_price:200,retail_price:160,profit:40});assert.equal(pricingAmounts(100,80).profit,-20);assert.equal(pricingAmounts(0,0).profit,0);assert.equal(pricingAmounts(100,null).retail_price,null);assert.throws(()=>pricingAmounts(100,NaN));
});
const version=(number,from,quantity,target='device.disk')=>({version_number:number,effective_from:{kind:'date',value:from},effective_until:{kind:'simulation_end'},composition_definition:[{target:{record_id:target,version_number:1},quantity}]});
test('competition follows quantities, pinned descendants, and stops at priced scope',()=>{
 const old=version(1,'1978-01-01',2);old.effective_until={kind:'date',value:'1982-01-01'};
 const i=new Map([['product.host',{id:'product.host',composition_history:[old,version(2,'1982-01-01',1)]}],['device.disk',{id:'device.disk',composition_history:[version(1,'1978-01-01',99,'base_part.ignored')]}]]);
 const a={allow_planning:true,records:[{record_id:'device.disk',profile_id:'disk',multiplier:1,basis:'Complete disk'}],profiles:[{id:'disk',basis:'Comparable disks',observations:[{date:'1978-01-01',status:'planning',comparables:[{name:'A',price:400},{name:'B',price:600}]}]}]};
 assert.equal(competitionBasket(i,a,'product.host','1981-12-15').competition_price,1000);assert.equal(competitionBasket(i,a,'product.host','1982-06-15').competition_price,500);
 assert.equal(competitionBasket(i,{...a,allow_planning:false},'product.host','1982-06-15').competition_price,null);
 assert.throws(()=>competitionBasket(i,a,'product.host','1977-12-15'),/dated product composition/);
});
test('all current products and dates have reproducible explicitly provisional prices',()=>{
 assert.deepEqual(validateProductPricing(),[]);const d=JSON.parse(fs.readFileSync('data_calculation/product_pricing.json'));const c=JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json'));assert.equal(d.product_pricing.length,c.manufacturing_costs.length);
 for(const p of d.product_pricing)for(const e of p.estimates){assert.equal(e.comparison.status,'planning');assert.ok(Number.isFinite(e.competition_price));assert.equal(e.profit,Math.round((e.retail_price-e.break_even)*100)/100);}
});
