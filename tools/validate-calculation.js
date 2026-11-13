import {validateManufacturingCosts,validateRamScenarios} from './validate-manufacturing-costs.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {resolvePoint} from '../code/temporal.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
const check=ajv.compile(JSON.parse(fs.readFileSync(path.join(root,'schemas/calculation/annual_sales.schema.json'))));
export function validateAnnualSales(document,records){
 const errors=[],warnings=[];
 if(!check(document))return {errors:check.errors.map(e=>e.instancePath+': '+e.message),warnings};
 const ids=new Set(),scopes=new Set(),units=new Map();
 for(const row of document.annual_sales){
  const fail=text=>errors.push(row.id+': '+text),product=records.get(row.product_id);
  if(ids.has(row.id))fail('duplicate id');ids.add(row.id);
  if(!product||!['product','external_product'].includes(row.product_id.split('.')[0]))fail('unknown product '+row.product_id);
  const scope=JSON.stringify([row.scenario?.trim()||'baseline',row.product_id,row.year,row.geography.trim(),row.segment.trim()]);
  if(scopes.has(scope))fail('duplicate product/year/geography/segment/scenario');scopes.add(scope);
  if(units.has(row.product_id)&&units.get(row.product_id)!==row.unit)fail('inconsistent unit for product');units.set(row.product_id,row.unit);
  if(row.low_units!==undefined&&!(row.low_units<=row.estimated_units&&row.estimated_units<=row.high_units))fail('require low_units <= estimated_units <= high_units');
  const release=product?.release||resolvePoint(records.get(product?.launch_event_id)?.time,records)?.value;
  if(release&&row.year<Number(release.slice(0,4))&&(row.high_units??row.estimated_units)>0)warnings.push(row.id+': positive sales before known release '+release+'; reassess the scenario.');
 }
 return {errors,warnings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const records=new Map(fs.readdirSync(path.join(root,'data_foundation')).filter(f=>f.endsWith('.json')).flatMap(f=>Object.values(JSON.parse(fs.readFileSync(path.join(root,'data_foundation',f)))).flat()).map(r=>[r.id,r]));
 const file=process.argv[2]||path.join(root,'data_calculation/annual_sales.json');
 const document=JSON.parse(fs.readFileSync(file));
 const assumptions=JSON.parse(fs.readFileSync(path.join(root,'data_calculation/manufacturing_cost_assumptions.json')));
 const result=document.manufacturing_costs?validateManufacturingCosts(document,assumptions,records):document.dates&&document.scope?validateRamScenarios(document,assumptions,records):validateAnnualSales(document,records);
 if(!process.argv[2]){const costs=validateManufacturingCosts(JSON.parse(fs.readFileSync(path.join(root,'data_calculation/manufacturing_costs.json'))),JSON.parse(fs.readFileSync(path.join(root,'data_calculation/manufacturing_cost_assumptions.json'))),records);result.errors.push(...costs.errors);result.warnings.push(...costs.warnings);}
 if(!process.argv[2])result.errors.push(...validateRamScenarios(JSON.parse(fs.readFileSync(path.join(root,'data_calculation/ram_cost_scenarios.json'))),assumptions,records).errors);
 for(const warning of result.warnings)console.warn(warning);
 if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}else console.log('Validated calculation datasets (outside foundation authorization).');
}
