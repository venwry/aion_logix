import {parameterValues} from './technical-specification.js';
import {pointBounds} from './temporal.js';

export const categories=['Mainboard core','Memory and cartridges','Disk drives','Expansion cards','Flexibus & Video peripherals','Software & services'];
export const nameOf=r=>r?.name||r?.title||r?.id||'Unknown';
export const parameters=r=>parameterValues(r?.technical_specification?.parameters);
export function launchGroups(products,index){
 const groups=new Map();
 const date=r=>pointBounds(r?.time||r?.period?.start,index);
 for(const product of products){
  const key=product.launch_campaign_id||'';
  if(!groups.has(key))groups.set(key,{record:index.get(key),events:new Map()});
  const group=groups.get(key),eventId=product.launch_event_id||'';
  if(!group.events.has(eventId))group.events.set(eventId,{record:index.get(eventId),products:[]});
  group.events.get(eventId).products.push(product);
 }
 const sort=(a,b)=>(date(a.record)?.start??Infinity)-(date(b.record)?.start??Infinity)||nameOf(a.record).localeCompare(nameOf(b.record));
 return [...groups.values()].sort(sort).map(g=>({...g,events:[...g.events.values()].sort(sort).map(e=>({...e,products:e.products.sort((a,b)=>nameOf(a).localeCompare(nameOf(b)))}))}));
}
export function compositionTree(index,id,versionNumber){
 function walk(id,number,quantity,line,path){
  if(path.includes(id))throw Error('Composition cycle: '+id);
  const record=index.get(id);if(!record)throw Error('Missing component: '+id);
  const leaf=id.startsWith('base_part.')||record.kind==='service';
  const version=leaf?null:record.composition_history?.find(v=>v.version_number===number);
  if(!leaf&&!version)throw Error('Missing composition version: '+nameOf(record)+' #'+number);
  return {record,version,quantity,line,children:(version?.composition_definition||[]).map(l=>walk(l.target.record_id,l.target.version_number,quantity==null||l.quantity==null?null:quantity*l.quantity,l,[...path,id]))};
 }
 return walk(id,versionNumber,1,null,[]);
}
export function categoryFor(node){
 const r=node.record,p=parameters(r);
 if(r.id.startsWith('software_edition.')||['service','software'].includes(r.kind))return 5;
 if(r.kind==='memory_module'||r.kind==='rom_cartridge'||(['internal_subsystem','expansion_card'].includes(r.kind)&&p.has('capacity_kb')))return 1;
 if(r.kind==='storage_device')return 2;
 if(r.kind==='expansion_card')return 3;
 if(['keyboard','mouse','monitor','printer','network_device'].includes(r.kind))return 4;
 return 0;
}
export function configurationGroups(tree){
 const groups=categories.map(title=>({title,nodes:[]}));
 function visit(node){
  if(node.record.id.startsWith('product.')&&node.record.kind!=='service'||node.record.kind==='base_computer'){
   for(const child of node.children)visit(child);
  }else groups[categoryFor(node)].nodes.push(node);
 }
 visit(tree);return groups;
}
// Count declared memory assemblies once. Never add their constituent chips,
// video buffers, storage capacity, maximum RAM or bank capacity to system RAM.
export function headlineSpecs(tree){
 let ramKiB=0,ramKnown=true,hasRam=false;const processors=new Set(),memory=[];
 function visit(node,covered=false){
  const p=parameters(node.record);
  if(node.record.kind==='base_computer'){
   const cpu=p.get('processor_id')||node.version?.technical_definition?.processor?.part_id;
   const fitted=(n)=>n.record.id===cpu&&n.quantity!==0||n.children.some(fitted);
   if(cpu&&node.children.some(fitted))processors.add(cpu);
  }
  const isMemory=node.record.kind==='memory_module'||(['internal_subsystem','expansion_card'].includes(node.record.kind)&&p.has('capacity_kb'));
  if(isMemory&&!covered){
   hasRam=true;const capacity=p.get('capacity_kb');memory.push(node);
   if(typeof capacity!=='number'||node.quantity==null)ramKnown=false;
   else ramKiB+=capacity*node.quantity;
  }
  node.children.forEach(n=>visit(n,covered||isMemory));
 }
 visit(tree);return {processors:[...processors],ramKiB,ramKnown,hasRam,memory};
}
export function flattenedBOM(tree){
 const rows=[];function walk(n,depth){for(const child of n.children){rows.push({...child,depth});walk(child,depth+1);}}walk(tree,0);return rows;
}
