import {simulationEnd} from './model-contract.js';
// Shared definition-only BOM traversal. Child versions are explicitly pinned;
// unknown temporal bounds never select a default or latest version.
export function resolveComposition(records, id, versionNumber) {
 const index=records instanceof Map?records:new Map(records.map(r=>[r.id,r]));
 const leaves=[],services=[],nodes=[];
 function walk(id,number,multiplier,conditions,path){
  if(path.some(p=>p.id===id))throw Error('Composition cycle: '+id);
  const record=index.get(id);if(!record)throw Error('Unresolved composition reference '+id);
  const version=record.composition_history?.find(v=>v.version_number===number);
  if(!version)throw Error('Missing composition version '+id+' #'+number);
  const next=[...path,{id,version_number:number}];nodes.push({id,version_number:number,quantity:multiplier});
  for(const line of version.composition_definition){
   const target=index.get(line.target.record_id);if(!target)throw Error('Unresolved composition reference '+line.target.record_id);
   const quantity=multiplier===null||line.quantity===null?null:multiplier*line.quantity;
   // New compositions list required items only. Preserve explicit legacy
   // conditions and units while proposals await approval and in old snapshots.
   const conditionsHere=[...conditions,...(line.supply_condition?.kind==='conditional'?[line.supply_condition.description]:[])];
   const item={record_id:target.id,quantity,...(line.unit===undefined?{}:{unit:line.unit}),conditions:conditionsHere,path:next,line_id:line.id};
   if(target.id.startsWith('base_part.'))leaves.push(item);
   else if(target.id.startsWith('product.')&&target.kind==='service')services.push(item);
   else walk(target.id,line.target.version_number,quantity,conditionsHere,next);
  }
 }
 walk(id,versionNumber,1,[],[]);return {leaves,services,nodes,quantities_complete:leaves.every(l=>l.quantity!==null&&l.conditions.length===0)};
}
export function validateCompositions(records){
 const errors=[],fail=m=>errors.push(m),index=records;
 const boundary=b=>{
  if(b?.kind==='simulation_end')return simulationEnd;
  if(b?.kind==='event')return index.get(b.event_id)?.time?.value;
  // Read preserved historical snapshots; active schemas no longer admit this form.
  if(b?.kind==='process_boundary'){const p=index.get(b.process_id)?.period?.[b.boundary];return p?.precision==='event'?index.get(p.value)?.time?.value:p?.precision==='day'?p.value:undefined;}
 };
 for(const r of index.values()){
  if(r.technical_identity&&!index.has(r.technical_identity.record_id))fail(r.id+': unresolved technical identity');
  if(r.offering_category&&r.offering_category!=='service'&&!r.composition_history?.length)fail(r.id+': offering needs composition');
  if(r.kind==='family'&&r.composition_history?.length)fail(r.id+': family cannot have composition');
  const nums=new Set();let previousNumber=0,previousEnd;const intervals=[];
  for(const v of r.composition_history||[]){
   if(nums.has(v.version_number)||v.version_number<=previousNumber)fail(r.id+': composition versions must increase');nums.add(v.version_number);previousNumber=v.version_number;
   const checkBoundary=b=>{if(b.kind==='event'&&!index.has(b.event_id))fail(r.id+': unresolved event boundary');if(b.kind==='process_boundary'&&!index.has(b.process_id))fail(r.id+': unresolved process boundary');};
   checkBoundary(v.effective_from);checkBoundary(v.effective_until);
   if(['open','simulation_end'].includes(v.effective_from.kind))fail(r.id+': start cannot be open or simulation end');
   if(v.effective_until.kind==='simulation_end'&&v!==r.composition_history.at(-1))fail(r.id+': simulation end is only valid for the final composition version');
   const start=boundary(v.effective_from),end=boundary(v.effective_until);
   if(previousEnd&&start&&previousEnd!==start)fail(r.id+': composition revisions must share a boundary');
   previousEnd=end;
   if(v.effective_until.kind==='simulation_end'&&start&&start>=simulationEnd)fail(r.id+': composition starts at or after simulation end');
   if(start&&end&&start>=end)fail(r.id+': reversed composition interval');
   if(start){const stop=v.effective_until.kind==='open'?'9999-12-31':end;if(stop){if(intervals.some(([a,b])=>start<b&&stop>a))fail(r.id+': overlapping composition intervals');intervals.push([start,stop]);}}
   const lines=new Map();for(const l of v.composition_definition){if(lines.has(l.id))fail(r.id+': duplicate composition line '+l.id);lines.set(l.id,l);}
   for(const l of lines.values()){
    const child=index.get(l.target.record_id);
    if(!child){fail(r.id+': unresolved composition reference '+l.target.record_id);continue;}
    if(child.id.startsWith('product.')&&child.kind!=='service')fail(r.id+': commercial product nesting is forbidden');
    if(child.kind==='service'&&!r.id.startsWith('product.'))fail(r.id+': service cannot be a device material');
    if((l.unit===undefined||['each','set'].includes(l.unit))&&l.quantity!==null&&!Number.isInteger(l.quantity))fail(r.id+': count quantities must be integers');
    if(l.placements){const qty=l.placements.reduce((s,p)=>s+p.quantity,0);if(l.quantity!==null&&qty!==l.quantity)fail(r.id+': placement quantity differs from supplied quantity');}
    const connections=[...(l.connection?.host_line_id?[{...l.connection,quantity:l.quantity}]:[]),...(l.placements||[])];
    for(const c of connections){const host=lines.get(c.host_line_id);if(!host){fail(r.id+': missing connection host');continue;}
     if(c.host_instance&&host.quantity!==null&&c.host_instance>host.quantity)fail(r.id+': host instance exceeds population');
     const hr=index.get(host.target.record_id),hv=hr?.composition_history?.find(x=>x.version_number===host.target.version_number);
     const sockets=hv?.technical_definition?.expansion_socket_groups?.flatMap(g=>g.sockets)||[];
     if(sockets.length&&!sockets.some(s=>s.id===c.socket_id))fail(r.id+': nonexistent socket '+c.socket_id);
     const socket=sockets.find(s=>s.id===c.socket_id);
     if(socket?.compatible_device_ids?.length&&!socket.compatible_device_ids.includes(child.id))fail(r.id+': incompatible device at '+c.socket_id);
     if(socket?.installation_multiple&&c.quantity!==null&&c.quantity%socket.installation_multiple!==0)fail(r.id+': invalid installation multiple');
    }
   }
   // Aggregate all connected lines sharing a host/socket, not merely each line.
   const usage=new Map();for(const l of lines.values())for(const c of [...(l.connection?.host_line_id?[{...l.connection,quantity:l.quantity}]:[]),...(l.placements||[])]){
    const key=c.host_line_id+'|'+(c.host_instance||'all')+'|'+c.socket_id;const old=usage.get(key);usage.set(key,{...c,quantity:old?.quantity===null||c.quantity===null?null:(old?.quantity||0)+c.quantity});
   }
   for(const c of usage.values()){
    const h=lines.get(c.host_line_id),hr=h&&index.get(h.target.record_id),hv=hr?.composition_history?.find(x=>x.version_number===h.target.version_number),s=hv?.technical_definition?.expansion_socket_groups?.flatMap(g=>g.sockets).find(s=>s.id===c.socket_id);
    if(s?.capacity!=null&&c.quantity!==null){const hosts=c.host_instance?1:h.quantity;if(hosts!==null&&c.quantity>s.capacity*hosts)fail(r.id+': socket capacity exceeded');}
   }
   try{resolveComposition(index,r.id,v.version_number);}catch(e){fail(e.message);}
   checkTechnical(v.technical_definition,r.id,index,fail);
  }
  if(r.technical_definition)checkTechnical(r.technical_definition,r.id,index,fail);
 }
 return errors;
}
function checkTechnical(value,id,index,fail){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){for(const v of value)checkTechnical(v,id,index,fail);return;}
 const chip=index.get(value.chip_type_id)?.technical_definition?.specification;
 if(chip&&value.chips!=null&&value.capacity_kb!=null&&chip.capacity_kbit!=null&&value.chips*chip.capacity_kbit/8!==value.capacity_kb)fail(id+': memory capacity arithmetic mismatch');
 if(['width','height','bits_per_pixel'].every(k=>Number.isFinite(value[k])))for(const k of ['bytes_per_framebuffer','framebuffer_bytes'])if(Number.isFinite(value[k])&&value[k]!==value.width*value.height*value.bits_per_pixel/8)fail(id+': framebuffer arithmetic mismatch');
 for(const [key,v] of Object.entries(value)){
  if(key.endsWith('_id')&&typeof v==='string'&&/^(base_part|device|software_edition|product|technology|actor|manufacturing_capability)\./.test(v)&&!index.has(v))fail(id+': unresolved technical reference '+v);
  if(key.endsWith('_ids')&&Array.isArray(v))for(const x of v)if(typeof x==='string'&&/^(base_part|device|software_edition|product|technology|actor|manufacturing_capability)\./.test(x)&&!index.has(x))fail(id+': unresolved technical reference '+x);
  checkTechnical(v,id,index,fail);
 }
}
