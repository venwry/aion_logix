import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
import {readCostFoundation,costHash} from './generate-manufacturing-costs.js';
import {buildProductPricing} from '../code/product-pricing-model.js';
import {costSourceRecords} from '../code/manufacturing-cost-model.js';
const read=name=>JSON.parse(fs.readFileSync(name));
export function validateProductPricing(){
 const index=readCostFoundation(),assumptions=read('data_calculation/product_pricing_assumptions.json'),document=read('data_calculation/product_pricing.json'),costs=read('data_calculation/manufacturing_costs.json');
 const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);const errors=[];
 for(const [name,value] of [['product_pricing_assumptions',assumptions],['product_pricing',document]]){const check=ajv.compile(read('schemas/calculation/'+name+'.schema.json'));if(!check(value))errors.push(name+': '+JSON.stringify(check.errors));}
 if(errors.length)return errors;
 for(const list of [assumptions.sources,assumptions.profiles,assumptions.records]){const ids=list.map(r=>r.id||r.record_id);if(new Set(ids).size!==ids.length)errors.push('Duplicate pricing input identifier');}
 const sources=new Set(assumptions.sources.map(s=>s.id)),profiles=new Set(assumptions.profiles.map(p=>p.id));
 for(const r of assumptions.records)if(!index.has(r.record_id)||!profiles.has(r.profile_id))errors.push('Unknown pricing mapping '+r.record_id);
 for(const p of assumptions.profiles){if(p.observations.some((o,i)=>i&&o.date<=p.observations[i-1].date))errors.push('Unordered/duplicate dates '+p.id);for(const row of [...p.anchors,...p.observations.flatMap(o=>o.comparables)])if(!sources.has(row.source_id))errors.push('Unknown source '+row.source_id);}
 if(document.foundation_sha256!==costHash(costSourceRecords(index))||document.manufacturing_sha256!==costHash(costs)||document.assumptions_sha256!==costHash(assumptions))errors.push('Stale product pricing fingerprints');
 if(costHash(document.dates)!==costHash(costs.dates))errors.push('Pricing date grid differs from manufacturing');
 try{if(costHash(buildProductPricing(index,costs,assumptions))!==costHash(document.product_pricing))errors.push('Product pricing is not reproducible from current inputs');}catch(e){errors.push(e.message);}
 return errors;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const errors=validateProductPricing();if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Validated product pricing: formulas, dated compositions, sources and fingerprints.');}
