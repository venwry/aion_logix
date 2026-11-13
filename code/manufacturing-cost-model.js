import {pointBounds} from './temporal.js';
import {parameterValues} from './technical-specification.js';

export const costDates=Array.from({length:6},(_,i)=>[`${1978+i}-06-15`,`${1978+i}-12-15`]).flat();
export const costCategories=['purchased_parts','fabricated_parts','aion_chip_markup','assembly_test','factory_overhead','assembly_loss','third_party_licensing','service_delivery'];
export const costSourceTypes=['product','device','software_edition','base_part','event','process','manufacturing_capability','technology','agreement','assumption'];
export const costSourceRecords=index=>[...index.values()].filter(r=>costSourceTypes.includes(r.id.split('.')[0])).map(({status,...r})=>r).sort((a,b)=>a.id.localeCompare(b.id,'en'));
const years=(date,base)=>(Date.parse(date)-Date.parse(base))/31557600000;
export const roundCost=n=>Math.round((n+Number.EPSILON)*100)/100;
const latest=(rows,date)=>rows.filter(x=>x.date<=date).at(-1);
export function priceIndex(date,assumptions){
 const value=assumptions.inflation.observations.find(o=>o.date.slice(0,7)===date.slice(0,7))?.value;
 if(!(value>0))throw Error('No currency index for '+date);return value;
}
export const nominalFactor=(date,assumptions)=>priceIndex(date,assumptions)/priceIndex(assumptions.base_date,assumptions);
export function eventCostDate(index,id){
 const point=index.get(id)?.time,bounds=pointBounds(point,index);
 if(!bounds)throw Error('Unknown event date: '+id);
 // Month/year precision is conservatively credited only at the end of that period.
 return new Date(bounds.end).toISOString().slice(0,10);
}
function boundaryDate(boundary,index){
 if(boundary?.kind==='event')return eventCostDate(index,boundary.event_id);
 if(boundary?.kind==='process_boundary'){
  const p=index.get(boundary.process_id)?.period?.[boundary.boundary],b=pointBounds(p,index);
  return b?new Date(b.end).toISOString().slice(0,10):null;
 }
 if(boundary?.kind==='simulation_end')return '1995-01-01';
 return boundary?.value||boundary?.date||null;
}
export function costComposition(record,date,index,versionNumber){
 if(versionNumber!==undefined){const v=record.composition_history?.find(v=>v.version_number===versionNumber);if(!v)throw Error('Missing pinned composition '+record.id+' #'+versionNumber);return v;}
 const versions=(record.composition_history||[]).filter(v=>{const start=boundaryDate(v.effective_from,index),end=boundaryDate(v.effective_until,index);return start&&start<=date&&(!end||date<end);});
 if(versions.length!==1)throw Error('Need exactly one dated product composition for '+record.id+' on '+date);
 return versions[0];
}
export function grossDieCount(diameter,area){return Math.max(1,Math.floor(Math.PI*diameter*diameter/(4*area)-Math.PI*diameter/Math.sqrt(2*area)));}
export function chipQuote(profile,date,index,assumptions){
 const candidates=[];
 for(const routeId of profile.route_ids){
  const route=assumptions.fabrication_routes.find(x=>x.id===routeId);if(!route)throw Error('Missing route '+routeId);
  if(eventCostDate(index,route.release_event_id)>date)continue;
  const capability=index.get(route.capability_id);if(!capability)throw Error('Missing capability '+route.capability_id);
  const technology=index.get(capability.technology_id);const diameter=technology?.fabrication?.wafer_diameter_mm;if(!diameter)throw Error('Missing wafer diameter '+capability.technology_id);
  const params=parameterValues(index.get(profile.record_id)?.technical_specification?.parameters);
  const area=route.die_area_mm2??(profile.die_area_parameter?params.get(profile.die_area_parameter):profile.die_area_mm2);
  if(!(area>0))throw Error('Missing die-area estimate '+profile.record_id);
  const state=latest(route.learning,date);if(!state)throw Error('No learning state '+route.id+' on '+date);
  const electrical=state.electrical_yield??Math.min(.95,Math.exp(-state.defects_cm2*area/100)*(1+(route.repair_recovery||0)*state.defects_cm2*area/100));
  const grade=profile.grade_fraction??1,dieYield=electrical*grade,gross=route.gross_die_per_wafer??grossDieCount(diameter,area);
  const waferCost=state.processed_wafer_cost;
  // Wafer cost already includes fab labour, utilities, maintenance and depreciation.
  // Package/test is spent on each accepted die entering assembly, including final rejects.
  const unitCost=(waferCost/(gross*state.wafer_completion*dieYield)+profile.package_test_cost)/state.package_yield;
  candidates.push({unit_cost:unitCost*(1+assumptions.aion_chip_markup_rate),fabrication_cost:unitCost,aion_markup:unitCost*assumptions.aion_chip_markup_rate,route_id:route.id,capability_id:route.capability_id,release_event_id:route.release_event_id,wafer_diameter_mm:diameter,die_area_mm2:area,gross_die:gross,wafer_completion:state.wafer_completion,electrical_yield:electrical,grade_fraction:grade,package_yield:state.package_yield,processed_wafer_cost:waferCost,package_test_cost:profile.package_test_cost});
 }
 if(!candidates.length)throw Error('No dated fabrication route available for '+profile.record_id+' on '+date);
 return candidates.sort((a,b)=>a.unit_cost-b.unit_cost)[0];
}
export function createCostEstimator(index,assumptions){
 const parts=new Map(assumptions.parts.map(p=>[p.record_id,p])),operations=new Map(assumptions.operations.map(p=>[p.record_id,p])),services=new Map(assumptions.services.map(p=>[p.record_id,p]));
 const cache=new Map();
 function leaf(id,date,seen=new Set()){
  const key=id+'@'+date;if(cache.has(key))return cache.get(key);
  if(seen.has(id))throw Error('Cost allowance cycle '+id);seen=new Set([...seen,id]);
  const p=parts.get(id);if(!p)throw Error('No explicit part allowance '+id);
  let quote,category='purchased_parts';
  if(p.method==='fabricated'){quote=chipQuote(p,date,index,assumptions);category='fabricated_parts';}
  else if(p.method==='aion_allowance'){
   const cost=p.unit_cost*Math.pow(1+p.annual_real_change,years(date,p.base_date));
   quote={unit_cost:cost*(1+assumptions.aion_chip_markup_rate),fabrication_cost:cost,aion_markup:cost*assumptions.aion_chip_markup_rate};category='fabricated_parts';
  }
  else if(p.method==='market'){
   const series=assumptions.market_series.find(s=>s.id===p.market_series_id),observation=latest(series?.observations||[],date);
   if(!observation)throw Error('No dated market observation for '+id+' on '+date);
   // Historical dollar quotes already include their period's inflation.
   quote={unit_cost:observation.unit_cost_nominal/nominalFactor(date,assumptions),market_observation:observation};
  }
  else if(p.method==='composite'){
   const sub=p.components.map(c=>({quantity:c.quantity,...leaf(c.record_id,date,seen)}));quote={unit_cost:sub.reduce((sum,c)=>sum+c.quantity*c.unit_cost,0)+p.other_cost,components:sub};
  }else quote={unit_cost:p.unit_cost*Math.pow(1+p.annual_real_change,years(date,p.base_date))};
  const result={...quote,category,basis:p.basis,confidence:p.confidence,record_id:id};cache.set(key,result);return result;
 }
 function estimate(productId,date,{assembly=false,versionNumber}={}){
  const product=index.get(productId);if(!product||!assembly&&!product.id.startsWith('product.'))throw Error('Not an internal product '+productId);
  if(!assembly){const launch=eventCostDate(index,product.launch_event_id);if(date<launch)return null;}
  const breakdown=Object.fromEntries(costCategories.map(k=>[k,0])),lines=[],flags=new Set(),versions=[],routes=new Set();
  function charge(category,cost,record_id,quantity,basis,extra={}){breakdown[category]+=cost;lines.push({record_id,category,quantity,cost,basis,...extra});}
  function visit(id,pinned,multiplier,path){
   if(path.includes(id))throw Error('Composition cycle '+id);
   const r=index.get(id);if(!r)throw Error('Missing BOM object '+id);
   if(id.startsWith('base_part.')){
    function emit(q,quantity){
     if(q.components){flags.add('A functional RAM assembly uses an estimated internal chip population.');for(const c of q.components)emit(c,quantity*c.quantity);const remainder=q.unit_cost-q.components.reduce((sum,c)=>sum+c.quantity*c.unit_cost,0);charge('purchased_parts',remainder*quantity,q.record_id,quantity,q.basis);}
     else{
      const cost=q.fabrication_cost??q.unit_cost;
      charge(q.category,cost*quantity,q.record_id,quantity,q.basis,{unit_cost:cost,chip:q.route_id?q:undefined,market_observation:q.market_observation});
      if(q.aion_markup!==undefined)charge('aion_chip_markup',q.aion_markup*quantity,q.record_id,quantity,'AION Labs operational and profit markup: 15% of chip manufacturing cost, charged once.',{unit_cost:q.aion_markup});
      if(q.route_id)routes.add(q.route_id);
     }
     if(q.confidence==='low')flags.add('Some components use provisional engineering allowances.');
    }
    emit(leaf(id,date),multiplier);return;
   }
   const firstLine=lines.length;
   const v=r.composition_history?.length?costComposition(r,date,index,pinned):null;
   if(v){versions.push({record_id:id,version_number:v.version_number});const start=boundaryDate(v.effective_from,index),end=boundaryDate(v.effective_until,index);if(!start)flags.add('A pinned subassembly has an unknown effective-from date.');else if(start>date||end&&date>=end)flags.add('A recorded BOM pin falls outside the child revision dates; its explicit contents are retained.');
    for(const l of v.composition_definition){if(!(typeof l.quantity==='number'&&l.quantity>=0))throw Error('Unknown quantity '+id+'/'+l.id);visit(l.target.record_id,l.target.version_number,multiplier*l.quantity,[...path,id]);}
   }
   const op=operations.get(id);
   if(op){
    const labor=(op.assembly_hours*assumptions.labor.assembly_hour+op.test_hours*assumptions.labor.test_hour)*multiplier;
    charge('assembly_test',labor,id,multiplier,op.basis);
    charge('factory_overhead',labor*op.overhead_fraction,id,multiplier,'Assembly-site overhead on conversion labour only; wafer overhead is already in fabricated-part costs.');
    // Reject/rework loss only on direct hardware components and conversion, never on service or licence rights.
    if(op.loss_fraction){const hardware=lines.slice(firstLine).filter(l=>!['service_delivery','third_party_licensing'].includes(l.category)).reduce((sum,l)=>sum+l.cost,0);charge('assembly_loss',hardware*op.loss_fraction/(1-op.loss_fraction),id,multiplier,'Estimated unrecovered assembly/rework loss on this assembly; component wafer losses are already included.');}
    if(op.licensing_cost)charge('third_party_licensing',op.licensing_cost*multiplier,id,multiplier,op.licensing_basis);
   }
   const service=services.get(id);
   if(service){charge('service_delivery',service.labor_hours*assumptions.labor[service.labor_rate]+service.other_cost,id,1,service.basis);if(multiplier!==1){const last=lines.at(-1);breakdown.service_delivery+=last.cost*(multiplier-1);last.cost*=multiplier;last.quantity=multiplier;}if(service.provisional)flags.add('Service scope or utilisation is estimated; see the per-unit service basis.');}
   if(!v&&!service&&!op)throw Error('Missing cost coverage '+id);
  }
  visit(productId,versionNumber,1,[]);
  const factor=nominalFactor(date,assumptions);
  for(const key of costCategories)breakdown[key]*=factor;
  for(const line of lines){line.cost*=factor;if(line.unit_cost!==undefined)line.unit_cost*=factor;if(line.chip)line.chip={...line.chip,...Object.fromEntries(['unit_cost','fabrication_cost','aion_markup','processed_wafer_cost','package_test_cost'].map(k=>[k,line.chip[k]*factor]))};}
  const rounded=Object.fromEntries(Object.entries(breakdown).map(([k,v])=>[k,roundCost(v)])),total=roundCost(Object.values(rounded).reduce((a,b)=>a+b,0));
  return {date,currency_index:priceIndex(date,assumptions),currency_factor:factor,composition_version:versions.find(v=>v.record_id===productId)?.version_number??null,total,low:roundCost(total*assumptions.range.low_factor),high:roundCost(total*assumptions.range.high_factor),breakdown:rounded,route_ids:[...routes].sort(),flags:[...flags].sort(),lines,versions};
 }
 return {estimate,estimateAssembly:(id,date,versionNumber=1)=>estimate(id,date,{assembly:true,versionNumber}),partQuote:(id,date)=>{
  const factor=nominalFactor(date,assumptions);
  const convert=quote=>({...quote,...Object.fromEntries(['unit_cost','fabrication_cost','aion_markup','processed_wafer_cost','package_test_cost'].filter(k=>quote[k]!==undefined).map(k=>[k,quote[k]*factor])),...(quote.components?{components:quote.components.map(convert)}:{})});
  return convert(leaf(id,date));
 }};
}
export function buildCostRows(index,assumptions){
 const estimator=createCostEstimator(index,assumptions);
 return [...index.values()].filter(r=>r.id.startsWith('product.')).sort((a,b)=>a.id.localeCompare(b.id,'en')).map(p=>({product_id:p.id,product_name:p.name,kind:p.kind,launch_event_id:p.launch_event_id,launch_date:eventCostDate(index,p.launch_event_id),unit:assumptions.services.find(s=>s.record_id===p.id)?.unit||(p.kind==='software'?'one supplied software edition':p.kind==='service'?'one cartridge exchange':'one complete offered product'),estimates:costDates.filter(date=>date>=eventCostDate(index,p.launch_event_id)).map(date=>{const {lines,versions,...e}=estimator.estimate(p.id,date);return e;})}));
}
