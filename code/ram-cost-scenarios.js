import {createCostEstimator,costDates,eventCostDate,roundCost} from './manufacturing-cost-model.js';
import {parameterValues} from './technical-specification.js';

const sourceDefinitions=[
 {id:'aion16',name:'AION 4116-375',part_id:'base_part.aion_4116',capacity_kbit:16,origin:'aion'},
 {id:'commercial16',name:'Commercial 16K × 1 (150/200 ns planning grade)',part_id:'base_part.dram_16kbit',capacity_kbit:16,origin:'commercial'},
 {id:'aion64',name:'AION 4164 — cheapest released recipe',part_id:'base_part.aion_4164',capacity_kbit:64,origin:'aion'},
 {id:'aion64_2um',name:'AION 4164 — specified 2 µm revision',part_id:'base_part.aion_4164_2um',capacity_kbit:64,origin:'aion'},
 {id:'commercial64',name:'Commercial 64K × 1 (dated grade)',part_id:'base_part.dram_64kbit',capacity_kbit:64,origin:'commercial'}
];
const objects=[
 'device.subsystem.aurelia.base_memory','device.subsystem.aurelia_plus.base_memory',
 'device.ram_64kb_x32','device.ram_128kb_x32','device.ram_256kb_x32','device.ram_256kb_x32_2um',
 'device.artemis_ram_module_prototype','device.artemis_ram_module_64kb'
];
const safetyNote='Conditional electrical candidates, not production approvals. Preserve capacity, data width, matched pairs and host-listed modules. Confirm full access/cycle timing, rails, refresh, loading, pinout and grade; do not equate advertised access time with memory cycle time. No 16K-to-64K chip drop-in or new module design is assumed.';
const start=(record,index)=>{
 const boundary=record.composition_history?.[0]?.effective_from;
 return boundary?.kind==='event'?eventCostDate(index,boundary.event_id):null;
};
function bestOf(candidates){
 if(!candidates.length)return {cheapest_id:null,robust_to_chip_range:false};
 const sorted=[...candidates].sort((a,b)=>a.cost-b.cost||a.id.localeCompare(b.id));
 return {cheapest_id:sorted[0].id,robust_to_chip_range:sorted.length>1&&sorted.slice(1).every(c=>sorted[0].high<c.low)};
}
export function buildRamScenarios(index,assumptions){
 const base=createCostEstimator(index,assumptions),partMap=new Map(assumptions.parts.map(p=>[p.record_id,p]));
 const profiles=sourceDefinitions.map(source=>{
  const profile=structuredClone(partMap.get(source.part_id));
  if(profile.die_area_parameter){profile.die_area_mm2=parameterValues(index.get(source.part_id).technical_specification.parameters).get(profile.die_area_parameter);delete profile.die_area_parameter;}
  return {...source,profile};
 });
 // Known declarations define possible capacities. No new host sockets or module qualifications are invented.
 const targets=new Map();
 for(const r of index.values())for(const v of r.composition_history||[]){
  const lines=v.composition_definition||[],byLine=new Map(lines.map(l=>[l.id,l]));
  for(const line of lines){
   if(!objects.includes(line.target.record_id)||!line.connection?.host_line_id||line.connection.socket_id!=='ram')continue;
   const host=byLine.get(line.connection.host_line_id),capacity=parameterValues(index.get(line.target.record_id).technical_specification?.parameters).get('capacity_kb');
   if(!host||!capacity)continue;
   const hostId=host.target.record_id,hostVersion=host.target.version_number,key=[hostId,hostVersion,capacity*line.quantity,line.target.record_id,line.quantity].join('#');
   targets.set(key,{host_id:hostId,host_version:hostVersion,capacity_kib:capacity*line.quantity,recorded_module_id:line.target.record_id,recorded_modules:line.quantity});
  }
 }
 const dates=costDates.map(date=>{
  const chips=profiles.map(({profile,...source})=>{
   try{const q=base.partQuote(source.part_id,date);return {...source,available:true,cost:roundCost(q.unit_cost),manufacturing_cost:q.fabrication_cost===undefined?null:roundCost(q.fabrication_cost),markup:q.aion_markup===undefined?0:roundCost(q.aion_markup),route_id:q.route_id||null,observation:q.market_observation||null};}
   catch(error){if(!/No dated (fabrication route|market observation)/.test(error.message))throw error;return {...source,available:false,reason:error.message};}
  });
  const modules=[];
  for(const id of objects){
   const record=index.get(id),availableFrom=start(record,index);if(!availableFrom||availableFrom>date)continue;
   const v=record.composition_history[0],memory=v.composition_definition.filter(l=>profiles.some(s=>s.part_id===l.target.record_id));
   if(memory.length!==1)throw Error('Need one explicit DRAM population in '+id);
   const line=memory[0],source=profiles.find(s=>s.part_id===line.target.record_id),params=parameterValues(record.technical_specification?.parameters);
   const recorded=base.estimateAssembly(id,date,v.version_number),candidates=[];
   for(const alternative of profiles.filter(s=>s.capacity_kbit===source.capacity_kbit&&(s.id!=='aion64_2um'||source.id==='aion64_2um')&&(source.id!=='aion64_2um'||s.id!=='aion64'))){
    if(!chips.find(c=>c.id===alternative.id).available)continue;
    const run=factor=>{
     const inputs=structuredClone(assumptions),p={...alternative.profile,record_id:line.target.record_id};
     if(alternative.origin==='aion'){
      p.package_test_cost*=factor;
      inputs.fabrication_routes=inputs.fabrication_routes.map(r=>({...r,learning:r.learning.map(s=>({...s,processed_wafer_cost:s.processed_wafer_cost*factor}))}));
     }else inputs.market_series=inputs.market_series.map(s=>({...s,observations:s.observations.map(o=>({...o,unit_cost_nominal:o.unit_cost_nominal*factor}))}));
     inputs.parts=inputs.parts.map(x=>x.record_id===line.target.record_id?p:x);
     return createCostEstimator(index,inputs).estimateAssembly(id,date,v.version_number).total;
    };
    candidates.push({id:alternative.id,name:alternative.name,part_id:alternative.part_id,origin:alternative.origin,chip_quantity:line.quantity,cost:run(1),low:run(assumptions.ram_scenarios[alternative.origin+'_low_factor']),high:run(assumptions.ram_scenarios[alternative.origin+'_high_factor']),status:'qualification_required'});
   }
   modules.push({record_id:id,name:record.name,version_number:v.version_number,capacity_kib:params.get('capacity_kb')||line.quantity*source.capacity_kbit/8,recorded_cost:recorded.total,recorded_source_id:source.id,candidates,...bestOf(candidates)});
  }
  const configurations=[];
  for(const target of targets.values()){
   const host=index.get(target.host_id);if(!start(host,index)||start(host,index)>date)continue;
   const v=host.composition_history.find(v=>v.version_number===target.host_version),socket=v?.expansion_socket_groups?.flatMap(g=>g.sockets).find(s=>s.id==='ram');if(!socket)throw Error('Missing RAM socket '+target.host_id);
   const limit=parameterValues(host.technical_specification?.parameters).get('maximum_ram_kib'),candidates=[],excluded=[];
   for(const m of modules.filter(m=>m.record_id.startsWith('device.ram_'))){
    const count=target.capacity_kib/m.capacity_kib,reasons=[];
    if(!socket.compatible_device_ids.includes(m.record_id))reasons.push('Not listed by this host socket.');
    if(!Number.isInteger(count)||count%(socket.installation_multiple||1))reasons.push('Cannot preserve capacity with complete matched pairs.');
    if(count>(socket.capacity??target.recorded_modules))reasons.push(socket.capacity?'Exceeds socket count.':'Additional sockets are not established.');
    if(limit&&target.capacity_kib>limit)reasons.push('Exceeds declared host RAM limit.');
    if(reasons.length){excluded.push({module_id:m.record_id,reasons});continue;}
    for(const c of m.candidates)candidates.push({id:m.record_id+'@'+c.id,module_id:m.record_id,source_id:c.id,name:count+' × '+m.name+' / '+c.name,module_count:count,chip_quantity:count*c.chip_quantity,cost:roundCost(count*c.cost),low:roundCost(count*c.low),high:roundCost(count*c.high),status:'qualification_required'});
   }
   if(!candidates.length)continue;
   const recorded=modules.find(m=>m.record_id===target.recorded_module_id);
   configurations.push({...target,host_name:host.name,socket_limit:socket.capacity,recorded_cost:recorded?roundCost(recorded.recorded_cost*target.recorded_modules):null,candidates,excluded,...bestOf(candidates)});
  }
  return {date,chips,modules,configurations};
 });
 return {note:safetyNote,scope:'Complete module/subsystem and RAM-population costs, including conversion, assembly loss and AION markup. Fixed computer costs, redesign, qualification NRE and operating electricity are excluded from the comparison. These scenarios do not replace recorded product BOMs.',dates};
}
