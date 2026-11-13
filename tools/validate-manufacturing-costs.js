import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {costHash,readCostFoundation} from './generate-manufacturing-costs.js';
import {buildCostRows,costSourceRecords,costDates,eventCostDate,roundCost} from '../code/manufacturing-cost-model.js';
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const checks=Object.fromEntries(['manufacturing_costs','manufacturing_cost_assumptions'].map(n=>[n,ajv.compile(JSON.parse(fs.readFileSync(new URL('../schemas/calculation/'+n+'.schema.json',import.meta.url))))]));
export function validateManufacturingCosts(document,assumptions,index){
 const errors=[],warnings=[];
 for(const [name,value] of [['manufacturing_costs',document],['manufacturing_cost_assumptions',assumptions]])if(!checks[name](value))errors.push(...checks[name].errors.map(e=>name+e.instancePath+': '+e.message));
 if(errors.length)return {errors,warnings};
 if(JSON.stringify(assumptions.inflation.observations.map(o=>o.date))!==JSON.stringify(costDates))errors.push('Require one price index for every snapshot date in order.');
 if(document.currency_basis!==assumptions.currency_basis)errors.push('Currency basis mismatch');
 if(document.assumptions_sha256!==costHash(assumptions))errors.push('Cost assumptions have changed; regenerate estimates.');
 if(document.foundation_sha256!==costHash(costSourceRecords(index)))errors.push('Cost foundation has changed; regenerate estimates.');
 for(const list of ['parts','operations','services']){
  const seen=new Set();for(const a of assumptions[list]){if(seen.has(a.record_id))errors.push('Duplicate '+list+' assumption '+a.record_id);seen.add(a.record_id);if(!index.has(a.record_id))errors.push('Unknown cost input '+a.record_id);}
 }
 const routeIds=new Set();
 for(const r of assumptions.fabrication_routes){
  if(routeIds.has(r.id))errors.push('Duplicate fabrication route '+r.id);routeIds.add(r.id);
  const cap=index.get(r.capability_id),event=index.get(r.release_event_id);
  if(!cap||!event)errors.push('Unknown fabrication source '+r.id);
  else if(!(event.outcomes||[]).some(o=>o.subject_ids?.includes(cap.id)))errors.push('Release event does not establish the scoped capability '+r.id);
  for(let i=0;i<r.learning.length;i++){
   if(i&&r.learning[i-1].date>=r.learning[i].date)errors.push('Learning states must be strictly ordered '+r.id);
   if(event&&r.learning[i].date<eventCostDate(index,event.id))errors.push('Learning state precedes its qualification gate '+r.id);
  }
 }
 for(const p of assumptions.parts){for(const id of p.route_ids||[])if(!routeIds.has(id))errors.push('Unknown route '+id);for(const c of p.components||[])if(!index.has(c.record_id))errors.push('Unknown composite part '+c.record_id);}
 if(JSON.stringify(document.dates)!==JSON.stringify(costDates))errors.push('Require June 15 and December 15 from 1978 through 1983.');
 const seen=new Set();for(const r of document.manufacturing_costs){
  if(seen.has(r.product_id))errors.push('Duplicate cost product '+r.product_id);seen.add(r.product_id);
  const product=index.get(r.product_id);if(!product){errors.push('Unknown product '+r.product_id);continue;}
  const launch=eventCostDate(index,product.launch_event_id);if(r.launch_date!==launch||r.launch_event_id!==product.launch_event_id)errors.push('Wrong launch provenance '+r.product_id);
  const expected=costDates.filter(d=>d>=launch);if(JSON.stringify(r.estimates.map(e=>e.date))!==JSON.stringify(expected))errors.push('Missing, repeated or pre-launch costs '+r.product_id);
  for(const e of r.estimates){if(!(e.low<=e.total&&e.total<=e.high))errors.push('Invalid cost range '+r.product_id);if(roundCost(Object.values(e.breakdown).reduce((a,b)=>a+b,0))!==e.total)errors.push('Cost breakdown does not sum '+r.product_id);}
 }
 for(const r of index.values())if(r.id.startsWith('product.')&&!seen.has(r.id))errors.push('Missing product estimate '+r.id);
 if(!errors.length)try{if(costHash(document.manufacturing_costs)!==costHash(buildCostRows(index,assumptions)))errors.push('Stored estimates differ from reproducible cost model; regenerate.');}catch(error){errors.push(error.message);}
 return {errors,warnings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=validateManufacturingCosts(JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json')),JSON.parse(fs.readFileSync('data_calculation/manufacturing_cost_assumptions.json')),readCostFoundation());
 if(r.errors.length){console.error(r.errors.join('\n'));process.exitCode=1;}else console.log('Validated manufacturing estimates, source fingerprints, full date coverage and reproducible totals.');
}
