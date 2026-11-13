import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readCostFoundation,costHash} from '../../tools/generate-manufacturing-costs.js';
import {createCostEstimator,costDates} from '../../code/manufacturing-cost-model.js';
import {buildRamScenarios} from '../../code/ram-cost-scenarios.js';
import {validateRamScenarios,validateManufacturingCosts} from '../../tools/validate-manufacturing-costs.js';
const index=readCostFoundation(),a=JSON.parse(fs.readFileSync('data_calculation/manufacturing_cost_assumptions.json')),ram=JSON.parse(fs.readFileSync('data_calculation/ram_cost_scenarios.json')),costs=JSON.parse(fs.readFileSync('data_calculation/manufacturing_costs.json')),model=createCostEstimator(index,a);
test('15% markup covers all AION chips and ROM allowances once, including nested RAM assemblies',()=>{
 for(const p of a.parts.filter(p=>['fabricated','aion_allowance'].includes(p.method))){const q=model.partQuote(p.record_id,'1983-12-15');assert(Math.abs(q.unit_cost-q.fabrication_cost*1.15)<1e-10,p.record_id);assert(Math.abs(q.aion_markup-q.fabrication_cost*.15)<1e-10);}
 for(const row of costs.manufacturing_costs)for(const e of row.estimates)assert(Math.abs(e.breakdown.aion_chip_markup-e.breakdown.fabricated_parts*.15)<.011,row.product_id);
 const q=model.partQuote('base_part.device.artemis_cpm80_module.local_64_kib_ram_implementation','1983-12-15');assert.equal(q.components[0].unit_cost,model.partQuote('base_part.aion_4164','1983-12-15').unit_cost);
 const price=model.partQuote('base_part.dram_16kbit','1983-12-15');assert.equal(price.aion_markup,undefined);
});
test('equal ROM banks and the five SA450 aliases retain identical dated cost curves',()=>{
 for(const g of a.equivalent_cost_groups)for(const date of costDates)assert.equal(new Set(g.record_ids.map(id=>model.partQuote(id,date).unit_cost)).size,1,g.id);
 const changed=structuredClone(a);changed.parts.find(p=>p.record_id==='base_part.athena_server.system_rom').unit_cost++;
 assert(validateManufacturingCosts(costs,changed,index).errors.some(e=>e.includes('Equivalent parts have inconsistent cost bases')));
});
test('market quotes stay nominal, use only the current or earlier observation, and respect pricing availability',()=>{
 assert.equal(model.partQuote('base_part.dram_16kbit','1982-06-15').unit_cost,1.95);
 assert.equal(model.partQuote('base_part.dram_16kbit','1982-06-14').unit_cost,4.2);
 assert.throws(()=>model.partQuote('base_part.dram_64kbit','1979-12-15'),/No dated market/);
});
test('RAM comparisons preserve foundation, dated module availability, total capacity and matched pairs',()=>{
 const before=costHash([...index.values()]);const result=buildRamScenarios(index,a);assert.equal(costHash([...index.values()]),before);assert.deepEqual(validateRamScenarios(ram,a,index).errors,[]);
 assert(!result.dates[0].modules.some(m=>m.record_id==='device.ram_256kb_x32'));
 for(const d of result.dates)for(const c of d.configurations)for(const x of c.candidates){const m=d.modules.find(m=>m.record_id===x.module_id);assert.equal(x.module_count%2,0);assert.equal(x.module_count*m.capacity_kib,c.capacity_kib);if(c.socket_limit!==null)assert(x.module_count<=c.socket_limit);}
 const d=result.dates.at(-1);assert.equal(d.configurations.filter(c=>c.host_id==='device.base_computer.artemis'&&c.capacity_kib===256).length,2);const small=d.configurations.find(c=>c.host_id==='device.base_computer.artemis'&&c.capacity_kib===128);
 assert(small.candidates.every(c=>c.module_id==='device.ram_64kb_x32'));
 const athena=d.configurations.find(c=>c.host_id==='device.base_computer.athena');assert(athena.candidates.every(c=>c.module_id==='device.ram_128kb_x32'));
 assert(athena.excluded.some(e=>e.module_id==='device.ram_256kb_x32'&&e.reasons.some(r=>r.includes('Not listed'))));
});
test('commercial RAM can beat AION; the exact 2um population never receives the 1.5um route',()=>{
 const early=ram.dates[0].modules.find(m=>m.record_id==='device.subsystem.aurelia.base_memory');assert.equal(early.cheapest_id,'aion16');
 const late=ram.dates.at(-1),m=late.modules.find(m=>m.record_id==='device.ram_64kb_x32');assert.equal(m.cheapest_id,'commercial16');
 const server=late.configurations.find(c=>c.host_id==='device.base_computer.athena_server');assert(server.candidates.every(c=>c.source_id!=='aion64'));assert.match(server.cheapest_id,/commercial64$/);assert.equal(server.robust_to_chip_range,false);
});
test('changing a winner, date or source invalidates saved comparison results',()=>{
 for(const mutate of [r=>r.dates.pop(),r=>r.dates[0].modules[0].cheapest_id='commercial16',r=>r.foundation_sha256='0'.repeat(64)]){const r=structuredClone(ram);mutate(r);assert(validateRamScenarios(r,a,index).errors.length);}
});
