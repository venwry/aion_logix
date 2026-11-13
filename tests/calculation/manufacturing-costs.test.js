import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCostEstimator,costComposition,eventCostDate,costDates,buildCostRows} from '../../code/manufacturing-cost-model.js';
import {readCostFoundation,costHash} from '../../tools/generate-manufacturing-costs.js';
import {validateManufacturingCosts} from '../../tools/validate-manufacturing-costs.js';
const index=readCostFoundation(),assumptions=JSON.parse(fs.readFileSync('data_calculation/manufacturing_cost_assumptions.json')),costs=JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json'));
const model=createCostEstimator(index,assumptions);
test('all current products have every eligible June/December estimate, with reproducible source fingerprints',()=>{
 assert.deepEqual(validateManufacturingCosts(costs,assumptions,index).errors,[]);
 assert.equal(costs.manufacturing_costs.length,[...index.keys()].filter(id=>id.startsWith('product.')).length);assert.equal(costDates.length,12);assert.equal(costDates[0],'1978-06-15');assert.equal(costDates.at(-1),'1983-12-15');
 for(const r of costs.manufacturing_costs)assert.deepEqual(r.estimates.map(e=>e.date),costDates.filter(d=>d>=r.launch_date));
});
test('launch boundary is exact; June 16 Academy courses have no June 15 cost',()=>{
 assert.equal(model.estimate('product.academy_course_1','1978-06-15'),null);assert(model.estimate('product.academy_course_1','1978-06-16'));
 assert.equal(model.estimate('product.athena','1982-12-15'),null);assert(model.estimate('product.athena','1983-06-15'));
});
test('Aurelia consumes 32 DRAMs, two sprite SRAMs and one support term without pricing assemblies twice',()=>{
 const r=model.estimate('product.aurelia_mono','1978-06-15');
 const qty=id=>r.lines.filter(l=>l.record_id===id&&['fabricated_parts','service_delivery'].includes(l.category)).reduce((s,l)=>s+l.quantity,0);
 assert.equal(qty('base_part.aion_4116'),32);assert.equal(qty('base_part.aion_2114'),2);assert.equal(qty('product.service_regular_support'),1);
 assert.equal(r.lines.find(l=>l.record_id==='base_part.device.storage.computer.aurelia.525_inch_single_density_floppy_mechanism.controller_cable').cost,3);
 assert.equal(r.breakdown.service_delivery,23);
});
test('wafer cost uses separate completion, electrical, grade and package yields; worse yield raises cost',()=>{
 const q=model.partQuote('base_part.aion_4116','1978-06-15');assert(Math.abs(q.unit_cost-(210/(190*.9*.6)+.65)/.95)<1e-10);
 const a=structuredClone(assumptions);a.fabrication_routes.find(r=>r.id==='dram16').learning[0].electrical_yield=.3;
 assert(createCostEstimator(index,a).partQuote('base_part.aion_4116','1978-06-15').unit_cost>q.unit_cost);
});
test('month-only gates do not improve the June 15 estimate and shrinks do not silently alter CPU identity',()=>{
 assert.equal(eventCostDate(index,'event.dram_control_release'),'1980-06-30');
 assert.equal(model.partQuote('base_part.aion_4164','1980-06-15').route_id,'dram64_launch');
 assert.equal(model.partQuote('base_part.aion_4164','1980-12-15').route_id,'dram64_control');
 assert.equal(model.partQuote('base_part.aion_4164','1981-06-15').route_id,'dram64_repair');
 assert.equal(model.partQuote('base_part.aion_4164_2um','1983-12-15').route_id,'dram64_2');
 assert.equal(model.partQuote('base_part.erav1_8mhz','1983-12-15').route_id,'erav1');assert.equal(model.partQuote('base_part.erav1_8mhz','1983-12-15').die_area_mm2,55);
});
test('root revisions change with time, but child BOM pins remain explicit',()=>{
 const p=index.get('product.artemis_128_mono');assert.equal(costComposition(p,'1980-12-15',index).version_number,1);assert.equal(costComposition(p,'1981-06-15',index).version_number,2);
 assert.equal(costComposition(p,'1981-06-15',index,1).version_number,1);
 const a=model.estimate(p.id,'1980-12-15'),b=model.estimate(p.id,'1981-06-15');assert.equal(a.composition_version,1);assert.equal(b.composition_version,2);
});
test('validation rejects missing cells, bad totals, wrong source references and stale input hashes',()=>{
 for(const mutate of [d=>d.manufacturing_costs.pop(),d=>d.manufacturing_costs[0].estimates.pop(),d=>d.manufacturing_costs[0].estimates[0].total+=1,d=>d.manufacturing_costs.push(d.manufacturing_costs[0]),d=>d.foundation_sha256='0'.repeat(64)]){const d=structuredClone(costs);mutate(d);assert(validateManufacturingCosts(d,assumptions,index).errors.length);}
 const a=structuredClone(assumptions);a.parts[0].record_id='base_part.missing';assert(validateManufacturingCosts(costs,a,index).errors.length);
});
test('training and undefined service scopes have explicit per-unit assumptions; calculation is read-only',()=>{
 const before=costHash([...index.values()]);assert.equal(model.estimate('product.academy_course_1','1978-12-15').total,71.65);
 const r=costs.manufacturing_costs.find(r=>r.product_id==='product.service_aurelia_compatibility_support');assert.match(r.unit,/eight-hour/);assert(r.estimates[0].flags.some(f=>/Service scope/.test(f)));
 buildCostRows(index,assumptions);assert.equal(costHash([...index.values()]),before);
});

test('costs are nominal USD on each date and general inflation is separate from real learning',()=>{
 const first=model.estimate('product.service_regular_support','1978-06-15'),last=model.estimate('product.service_regular_support','1983-12-15');
 assert.equal(costs.currency_basis,'nominal_usd');assert.equal(first.total,23);assert.equal(last.total,Math.round(23*101.3/65.2*100)/100);assert.equal(last.currency_index,101.3);
 assert(Math.abs(model.partQuote('base_part.aion_4116','1983-12-15').unit_cost-((185/(190*.95*.8)+.65)/.98)*(101.3/65.2))<1e-10);
 const composite=model.partQuote('base_part.device.artemis_cpm80_module.local_64_kib_ram_implementation','1983-12-15');
 assert.equal(composite.components[0].unit_cost,model.partQuote('base_part.aion_4164','1983-12-15').unit_cost);
 assert(Math.abs(composite.unit_cost-composite.components.reduce((sum,c)=>sum+c.quantity*c.unit_cost,0)-4*101.3/65.2)<1e-10);
});
