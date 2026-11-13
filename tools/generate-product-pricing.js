import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {readCostFoundation,costHash} from './generate-manufacturing-costs.js';
import {costSourceRecords} from '../code/manufacturing-cost-model.js';
import {buildProductPricing} from '../code/product-pricing-model.js';
export function generateProductPricing(){
 const index=readCostFoundation(),costs=JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json')),assumptions=JSON.parse(fs.readFileSync('data_calculation/product_pricing_assumptions.json'));
 const manufacturingAssumptions=JSON.parse(fs.readFileSync('data_calculation/manufacturing_cost_assumptions.json'));
 if(costs.foundation_sha256!==costHash(costSourceRecords(index))||costs.assumptions_sha256!==costHash(manufacturingAssumptions))throw Error('Regenerate manufacturing costs first.');
 const doc={model_version:'1.0.0',currency:'USD',currency_basis:'nominal_usd',foundation_sha256:costs.foundation_sha256,manufacturing_sha256:costHash(costs),assumptions_sha256:costHash(assumptions),dates:costs.dates,product_pricing:buildProductPricing(index,costs,assumptions)};
 fs.writeFileSync('data_calculation/product_pricing.json',JSON.stringify(doc,null,2)+'\n');console.log('Generated pricing for '+doc.product_pricing.length+' offerings.');return doc;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)generateProductPricing();
