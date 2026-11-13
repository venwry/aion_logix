import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {resolveComposition} from '../code/composition.js';
import {pointBounds} from '../code/temporal.js';
const dir='data_storytelling/review_evidence/aion-memory-production';
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[`${d}/${f}`,JSON.parse(fs.readFileSync(`${d}/${f}`))])));
const baseline=hash(files),queue=files['data_storytelling/change.json'].change;
const p=queue.find(p=>p.id==='change.aion_memory_production_1975_1978');assert(p,'Pending manufacturing proposal required');
const before=new Map(records(files).map(r=>[r.id,r])),touched=new Set();
for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,before.get(e.record_id)||null);}
for(const other of queue.filter(q=>q!==p))for(const e of other.elements)assert(!touched.has(e.record_id),'Overlapping proposal '+other.id);
assert.deepEqual(validate(files).errors,[]);
const request={action:'approve_changes',changes:[{change_id:p.id,proposal_sha256:hash(p)}]};
const simulated=transact(files,request,'simulation-only').files;assert.deepEqual(validate(simulated).errors,[]);
const after=new Map(records(simulated).map(r=>[r.id,r]));
for(const [id,r] of before)if(!touched.has(id))assert.deepEqual(after.get(id),r);
for(const id of ['process.stepper_install','process.aion_erav1_qualification','assumption.finance','base_part.dram_16kbit'])assert.deepEqual(after.get(id),before.get(id));
assert.equal(after.get('device.aurelia_ram_16kb_card').composition_history[0].effective_from.kind,'unknown');
const dates={'event.aion_pilot_line_acceptance':'1975-12-15','event.aion_rom_sram_release':'1976-09-30','event.aion_sram4_release':'1977-03-31','event.aion_dram16_release':'1977-09-30','event.aion_3um_repeatable':'1978-03-31','event.aion_aurelia_memory_supply':'1978-05-15'};
for(const [id,date] of Object.entries(dates)){const r=after.get(id);assert.equal(r.time.value,date);assert(!r.category);for(const input of r.inputs||[])if(input.event_id)assert(after.get(input.event_id).time.value<=date);}
// Check all affected process ownership bounds and predecessor-event chronology.
for(const e of p.elements){const r=e.after;if(!r?.id.startsWith('process.'))continue;const start=pointBounds(r.period.start,after),end=pointBounds(r.period.end,after);for(const i of r.inputs||[])if(i.event_id)assert(pointBounds(after.get(i.event_id).time,after).end<=start.start,r.id+' future input');for(const s of r.steps||[])if(s.event_id){const date=pointBounds(after.get(s.event_id).time,after);assert(date.start>=start.start&&date.end<=end.end,r.id+' step outside period');}}
const owners=new Map();for(const r of after.values())if(r.id.startsWith('process.'))for(const s of r.steps||[])if(dates[s.event_id]){assert(!owners.has(s.event_id),'Duplicate milestone ownership');owners.set(s.event_id,r.id);}assert.equal(owners.size,6);
const population=id=>{const leaves=resolveComposition(after,id,1);return leaves.leaves;};
const bom=population('device.base_computer.aurelia');
const counts={};for(const leaf of bom){const id=leaf.record_id||leaf.id;counts[id]=(counts[id]||0)+leaf.quantity;}
assert.equal(counts['base_part.aion_4116'],32);assert.equal(counts['base_part.aion_2114'],2);assert(!counts['base_part.dram_16kbit']);
const card=population('device.aurelia_ram_16kb_card');assert.equal(card.find(x=>(x.record_id||x.id)==='base_part.aion_4116').quantity,8);
const scenarios=[];
for(const computers of [10000,20000])for(const dieYield of [.5,.6]){
 const dramForecast=computers*(32+.3*8)+100000,sramForecast=computers*2+10000;
 const dramRequired=dramForecast*1.05,sramRequired=sramForecast*1.05;
 const goodPerStart=190*.9*dieYield*.95,sramGoodPerStart=160*.9*.5*.95;
 scenarios.push({computers_per_month:computers,dram_electrical_yield:dieYield,dram_forecast:dramForecast,dram_required_capacity:dramRequired,sram_required_capacity:sramRequired,dram_good_per_start:goodPerStart,dram_starts_required:Math.ceil(dramRequired/goodPerStart),sram_starts_required:Math.ceil(sramRequired/sramGoodPerStart),dram_output_at_6000_starts:6000*goodPerStart,sram_output_at_500_starts:500*sramGoodPerStart,fits_initial_memory_allocations:Math.ceil(dramRequired/goodPerStart)<=6000&&Math.ceil(sramRequired/sramGoodPerStart)<=500});
}
const policy=after.get('assumption.aion_memory_supply_1978').statements.join(' ');
for(const scenario of scenarios.filter(s=>s.dram_electrical_yield===.6))for(const key of ['dram_required_capacity','sram_required_capacity'])assert(policy.includes(scenario[key].toLocaleString('en-US')),'Policy capacity arithmetic differs from the model');
const toolCapacity=n=>n*26*24*.75*55/10;
assert(toolCapacity(4)>=8000);assert(toolCapacity(3)>=7000);assert(toolCapacity(3)<8000);
const nominal=scenarios.find(s=>s.computers_per_month===10000&&s.dram_electrical_yield===.6);assert(nominal.dram_output_at_6000_starts>=575000);assert(nominal.sram_output_at_500_starts>=31500);
const dramProbeHours=6000*.9*190*2/3600,dramFinalHours=6000*.9*190*.6*3/3600;assert(dramProbeHours<936);assert(dramFinalHours<936);
assert.equal(hash(files),baseline);
const report={result:'passed',local_full_archive_audit_peak_rss_kib:process.resourceUsage().maxRSS,proposal:p.id,proposal_sha256:hash(p),records:p.elements.length,add:p.elements.filter(e=>!e.before).length,update:p.elements.filter(e=>e.before&&e.after).length,remove:p.elements.filter(e=>!e.after).length,bytes:Buffer.byteLength(JSON.stringify(p)),checks:['before snapshots match','no overlapping proposals','real atomic Changes confirm save validates','untouched foundation preserved','six uniquely owned milestone events within process periods','direct event inputs precede process/event start','later stepper and ERAv1 work unchanged','generic DRAM preserved','RAM-card first offering remains unknown','recursive Aurelia BOM: 32 AION DRAM + 2 AION SRAM','capacity and outage arithmetic','source files not mutated by simulation'],milestones:dates};
fs.writeFileSync(dir+'/verification.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(dir+'/capacity-scenarios.json',JSON.stringify({classification:'Planning arithmetic; not observed laboratory or shipment evidence',assumptions:{dram_gross_die_per_75mm_wafer:190,sram4_gross_die_per_75mm_wafer:160,wafer_completion:.9,assembly_final_acceptance:.95,supply_headroom:.05,ram_card_attachment:.3},scenarios,projection_capacity_starts:{four_tools:toolCapacity(4),three_tools:toolCapacity(3)},dram_test_loading_hours:{probe:dramProbeHours,final:dramFinalHours,available_at_each_stage:936},launch_inventory:{dram:344000,sram4:20000},limitations:['Actual mask maps and full-route measured loading must substantiate the proposed story acceptance.','The remaining test-station hours must cover SRAM, ROM, logic, changeovers and sample qualification; add stations if the mix fails the loading test.','20,000 computers/month requires extra DRAM and SRAM capacity; 12,000 DRAM starts are an expansion option only.','One failed aligner preserves memory by pausing other starts, not by sustaining all 8,000 starts.']},(key,value)=>typeof value==='number'?Math.round(value*1e6)/1e6:value,2)+'\n');
console.log(JSON.stringify(report,null,2));
