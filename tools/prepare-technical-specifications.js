// Steps 1–4 only: propose new presentation and relocate sockets. Never authorize
// foundation records or retire legacy technical_definition in this tool.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const clone=structuredClone;
const reserved=new Set(['chip_type_id','chips','capacity_kb','capacity_kbit']);
const wrappers=new Set(['specification','technical_profile']);
const label=s=>s.replace(/_/g,' ').replace(/\bid\b/g,'ID').replace(/\b(ram|rom|dma|api|cpu|pcb|io|sram|dram|rgb|sql|tui|ecc)\b/g,x=>x.toUpperCase()).replace(/^./,x=>x.toUpperCase());
const cleanKey=parts=>parts.filter(p=>!wrappers.has(p)).join('_').replace(/[^a-z0-9_]/gi,'_').toLowerCase().replace(/^(?=[^a-z])/,'item_');
const isRef=v=>typeof v==='string'&&/^(actor|technology|base_part|device|software_edition|product|external_product|manufacturing_capability)\.[a-z0-9][a-z0-9_.-]*$/.test(v);
const referenceRole=(parts)=>{
 const leaf=parts.at(-1),context=parts.filter(p=>!wrappers.has(p)).join('_');
 if(leaf==='chip_type_id')return 'DRAM chip used to populate this memory module';
 if(leaf==='legacy_card_id')return 'Source of inherited graphics modes and baseline capabilities';
 if(leaf==='specification_id')return 'Technical specification implemented by this record';
 if(leaf==='computer_id')return 'Computer host supported by this software edition';
 if(leaf==='manufacturing_capability_id')return 'Fabrication capability used by this manufacturing recipe';
 if(parts.includes('dependency_ids'))return 'Direct implementation prerequisite';
 return 'Defines '+label(context).replace(/ ID(s)?$/, '').toLowerCase()+' for this implementation';
};
const quantitySentence=(name,parts,token)=>{
 const leaf=parts.at(-1),units={kb:'KiB',kib:'KiB',kbit:'Kibit',bytes:'bytes',bits:'bits',mhz:'MHz',hz:'Hz',khz:'kHz',mm:'mm',mm2:'mm²',um:'µm',v:'V',ns:'ns',ms:'ms',usd:'USD'};
 const suffix=leaf.split('_').at(-1);
 if(units[suffix])return 'The '+label(parts.at(-1).slice(0,-suffix.length-1)).toLowerCase()+' is '+token+' '+units[suffix]+'.';
 if(['chips','ranks','chips_per_rank','modules_per_bank','parity_bits','organization_words'].includes(leaf))return 'The '+label(leaf).toLowerCase()+' count is '+token+'.';
 return name+': '+token+'.';
};
const sentence=s=>/[.!?]$/.test(s.trim())?s.trim():s.trim()+'.';
const modesKeys=new Set(['text_modes','bitmap_modes']);

export function convertTechnical(record,index){
 const after=clone(record),sources=[record.technical_definition,...(record.composition_history||[]).map(v=>v.technical_definition)].filter(x=>x&&Object.keys(x).length);
 if(!sources.length)return null;
 if(sources.length!==1)throw Error(record.id+': root specification requires a single invariant definition');
 const source=sources[0],chapters=[],parameters=[],coverage=[],keys=new Set(),modes=[];
 const addParameter=(parts,value,role)=>{
  let key=reserved.has(parts.at(-1))&&(parts.length===1||(parts.length===2&&parts[0]==='specification'))?parts.at(-1):cleanKey(parts);
  if(keys.has(key))throw Error(record.id+': parameter collision '+key);keys.add(key);
  parameters.push(isRef(value)?{key,ref_id:value,ref_role:referenceRole(parts)}:{key,value});return '{'+key+'}';
 };
 function describe(value,parts,context=[]){
  if(modesKeys.has(parts.at(-1))){for(const mode of value)modes.push(convertMode(mode,parts.at(-1)==='text_modes'?'text':'bitmap'));coverage.push({source:parts.join('.'),destination:'graphic_modes_specification'});return [];}
  if(parts.at(-1)==='expansion_socket_groups'){coverage.push({source:parts.join('.'),destination:'composition_history.expansion_socket_groups'});return [];}
  const name=label(context.join('_')||parts.at(-1));
  if(Array.isArray(value)){
   if(!value.length)return []; // Empty containers carry no technical facts.
   if(value.every(v=>typeof v==='string')&&!value.some(isRef)){
    coverage.push({source:parts.join('.'),destination:'technical_specification'});
    if(value.every(v=>v.length<=55&&!/[.!?]\s|\n/.test(v)))return [name+': '+addParameter(parts,value.join(', '))+'.'];
    return [name+':\n\n'+value.map(sentence).join('\n\n')];
   }
   return value.flatMap((v,i)=>{
    const tag=v&&typeof v==='object'?(v.id||v.name||v.region||v.computer_id||String(i+1)):(isRef(v)?v:String(i+1));
    return describe(v,[...parts,cleanKey([tag])],[...context,label(String(tag))]);
   });
  }
  if(value&&typeof value==='object')return Object.entries(value).flatMap(([k,v])=>describe(v,[...parts,k],[...context,k]));
  coverage.push({source:parts.join('.'),destination:'technical_specification'});
  if(typeof value==='boolean'){
   // Booleans are assertions in prose, not interpolated true/false tokens.
   if(/allowed$/.test(name))return [name.replace(/ allowed$/,'')+(value?' is allowed.':' is not allowed.')];
   if(/supported$/.test(name))return [name.replace(/ supported$/,'')+(value?' is supported.':' is not supported.')];
   return [name+(value?' is enabled.':' is disabled.')];
  }
  if(typeof value==='string'&&!isRef(value)&&(value.length>70||/[.!?]$|[.!?]\s|\n/.test(value)||/description|responsibility|policy|purpose|note|residence|diagram_label/.test(parts.at(-1))))return [name+': '+sentence(value)];
  const token=addParameter(parts,value,name);
  if(isRef(value))return [name+' is defined by '+token+'.'];
  return [typeof value==='number'?quantitySentence(name,parts,token):name+': '+token+'.'];
 }
 function chapter(value,parts,title){
  const chapterName=title||label(parts.filter(x=>!wrappers.has(x)).join('_')||'Technical characteristics');
  if(Array.isArray(value)&&value.length&&value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))&&value.some(v=>Object.keys(v).length>1)){
   for(const [i,item] of value.entries()){
    const tag=item.id||item.name||item.region||String(i+1);
    chapter(item,[...parts,cleanKey([String(tag)])],chapterName+' — '+(item.name||item.id||item.region||'Entry '+(i+1)));
   }return;
  }
  const nested=[];
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   const simple={};for(const [k,v] of Object.entries(value)){
    if(!modesKeys.has(k)&&Array.isArray(v)&&v.length&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x))&&v.some(x=>Object.keys(x).length>1))nested.push([k,v]);else simple[k]=v;
   }value=simple;
  }
  const lines=describe(value,parts,[]);if(lines.length)chapters.push({number:chapters.length+1,chapter_name:chapterName,description:lines.join('\n\n')});
  for(const [k,v] of nested)chapter(v,[...parts,k],chapterName+' — '+label(k));
 }
 for(const [k,v] of Object.entries(source)){
  if(wrappers.has(k)&&v&&typeof v==='object'&&!Array.isArray(v)){
   const scalar=Object.fromEntries(Object.entries(v).filter(([,x])=>!x||typeof x!=='object'||Array.isArray(x)));
   if(Object.keys(scalar).length)chapter(scalar,[k]);
   for(const [sub,x] of Object.entries(v))if(x&&typeof x==='object'&&!Array.isArray(x))chapter(x,[k,sub]);
  }else chapter(v,[k]);
 }
 if(record.id==='device.artemis_professional_video_128kb'){
  const legacy=index.get('device.artemis_video_card_64kb').composition_history[0].technical_definition.specification;
  for(const [type,list] of [['text',legacy.text_modes],['bitmap',legacy.bitmap_modes]])for(const old of list){
   if(type==='bitmap'&&modes.some(m=>m.type===type&&m.width===old.width&&m.height===old.height&&m.parameters.some(p=>p.key==='bits_per_pixel'&&p.value===old.bits_per_pixel)))continue;
   const inherited=convertMode(old,type,{inherited:true});
   inherited.parameters.push({key:'inherited_from_id',ref_id:'device.artemis_video_card_64kb',ref_role:'Source of the inherited mode geometry and baseline buffering capability'});
   inherited.description+='\n\nThis mode inherits its geometry and baseline buffering capability from {inherited_from_id}. The professional card uses a fixed 800×600 output raster, with older modes centered without scaling. Qualify the monitor profile, palette-list allocation and sprite timing on the professional card; the source card’s 64 KiB allocation totals are not professional-card totals.';
   modes.push(inherited);
  }
 }
 const ram=source.specification;
 if(ram?.chip_type_id&&ram.chips!==undefined){
  const c=chapters.find(c=>c.chapter_name==='Technical characteristics');
  if(c){
   const used=new Set(['capacity_kb','chips','chip_type_id','data_width_bits','chip_organization','ranks','chips_per_rank','rank_capacity_kb','modules_per_bank','bank_data_width_bits','bank_capacity_kb','parity_bits']);
   const rest=c.description.split(/\n\s*\n/).filter(p=>![...used].some(k=>p.includes('{'+k+'}')));
   const lines=['The module provides {capacity_kb} KiB using {chips} chips of type {chip_type_id}.'];
   if(ram.data_width_bits!==undefined)lines.push('Its data interface is {data_width_bits} bits wide.');
   if(ram.chip_organization!==undefined)lines.push('Each chip has a {chip_organization} organization.');
   if(ram.ranks!==undefined&&ram.chips_per_rank!==undefined&&ram.rank_capacity_kb!==undefined)lines.push('The module has {ranks} rank(s), with {chips_per_rank} chips and {rank_capacity_kb} KiB per rank.');
   if(ram.modules_per_bank!==undefined&&ram.bank_data_width_bits!==undefined&&ram.bank_capacity_kb!==undefined)lines.push('Install {modules_per_bank} modules per capacity bank. The bank holds {bank_capacity_kb} KiB on a {bank_data_width_bits}-bit data bus.');
   if(ram.parity_bits!==undefined)lines.push('The design allocates {parity_bits} parity bits.');
   // Unusual partial groups retain their individual explanations.
   const explained=new Set([...lines.join(' ').matchAll(/\{([^{}]+)\}/g)].map(m=>m[1]));
   const partial=c.description.split(/\n\s*\n/).filter(p=>[...used].some(k=>p.includes('{'+k+'}')&&!explained.has(k)));
   c.description=[lines.join(' '),...partial,...rest].join('\n\n');
  }
 }
 after.technical_specification={chapters,parameters};
 if(modes.length)after.graphic_modes_specification=modes;
 for(const v of after.composition_history||[])if(v.technical_definition?.expansion_socket_groups){v.expansion_socket_groups=v.technical_definition.expansion_socket_groups;delete v.technical_definition.expansion_socket_groups;}
 return {after,coverage};
}
export function convertMode(old,type,{inherited=false}={}){
 const professional=old.framebuffer_count!==undefined&&old.double_buffering===undefined;
 const m={id:old.id,type,width:old.width??null,height:old.height??null,framebuffer_size:old.ram_bytes_per_page??old.bytes_per_framebuffer??old.framebuffer_bytes??null,double_buffering:old.double_buffering??(professional?old.framebuffer_count>=2:null),sprites_available:old.sprites_available??(professional?5:null),parameters:[]};
 const lines=[type==='text'?'This text mode presents {columns} columns and {rows} rows within a {width} × {height} logical-pixel area. Each character cell is {glyph_width} × {glyph_height} pixels. One page allocates {framebuffer_size} bytes for the character and attribute maps; shared font storage is separate.':'This bitmap mode has {width} × {height} logical pixels at {bits_per_pixel} bits per pixel. Each scanline has a stride of {stride_bytes} bytes, and one framebuffer allocates {framebuffer_size} bytes.'];
 lines.push(m.double_buffering===null?'Double-buffering capability is unspecified.':m.double_buffering?'Double buffering is supported, subject to the recorded memory and monitor constraints.':'Double buffering is not supported for this mode.');
 lines.push(m.sprites_available===null?'Sprite availability is unspecified.':'The mode supports {sprites_available} sprites.');
 const consumed=new Set(['id','type','width','height','ram_bytes_per_page','bytes_per_framebuffer','framebuffer_bytes','double_buffering','sprites_available','configurations','required_raster_ids']);
 const explained=new Set(type==='text'?['columns','rows','glyph_width','glyph_height']:['bits_per_pixel','stride_bytes']);
 for(const [key,value] of Object.entries(old))if(!consumed.has(key)){
  if(typeof value==='boolean'){lines.push(label(key)+(value?' is enabled.':' is disabled.'));continue;}
  if(typeof value==='object'&&value!==null)throw Error('Unexpected graphics field '+key);
  if(typeof value==='string'&&value.length>85){lines.push(label(key)+': '+sentence(value));continue;}
  m.parameters.push({key,value});if(!explained.has(key))lines.push(label(key)+' is {'+key+'}.');
 }
 if(!inherited&&old.required_raster_ids?.length)lines.push('The original mode requires a compatible monitor raster from: '+old.required_raster_ids.join(', ')+'. Raster selection still depends on the identified or configured monitor.');
 if(!inherited)for(const c of old.configurations||[]){
  const count=c.text_buffer_count??c.framebuffer_count;
  lines.push('The recorded allocation with '+count+(type==='text'?' text page(s)':' framebuffer(s)')+' and '+c.sprite_count+' sprites uses '+c.allocated_bytes+' bytes, leaving '+c.remaining_video_ram_bytes+' bytes of display RAM'+(c.palette_list_bytes!==undefined?'; the allocation includes '+c.palette_list_bytes+' bytes reserved for the palette list':'')+'.');
 }
 if(professional)lines.push('The five legacy sprites use separate 1 KiB SRAM. Sprite coordinates and line budgets require qualification at 800×600; this is not a guarantee of a sixth pointer sprite.');
 m.description=lines.join('\n\n');return m;
}

export function prepare(){
 const read=p=>JSON.parse(fs.readFileSync(p));
 const docs=Object.fromEntries(['device','software_edition','base_part'].map(t=>[t,read('data_foundation/'+t+'.json')[t]]));
 const index=new Map(Object.values(docs).flat().map(r=>[r.id,r])),proposals=[],audit={scope:'Steps 1–4. Preserve legacy technical_definition until step 5; new presentation is authoritative when present.',counts:{},records:[]};
 for(const [type,records] of Object.entries(docs)){
  const elements=[];
  for(const before of records){const converted=convertTechnical(before,index);if(!converted)continue;elements.push({record_type:type,record_id:before.id,before,after:converted.after});audit.records.push({id:before.id,chapters:converted.after.technical_specification.chapters.length,parameters:converted.after.technical_specification.parameters.length,graphics_modes:converted.after.graphic_modes_specification?.length||0,coverage:converted.coverage});}
  audit.counts[type]={records:records.length,migrated:elements.length,empty_definitions:records.length-elements.length};
  for(let i=0;i<elements.length;i+=20){const n=i/20+1;proposals.push({id:'change.technical_specifications_'+type+'_'+n,category:'data',title:'Root technical specifications — '+type.replaceAll('_',' ')+' definitions '+n,reason:'Introduce chapter narratives with one typed parameter table per record. Preserve direct references with explicit roles and stable validation keys. Extract text/bitmap modes into root graphic_modes_specification, omitting legacy configuration/raster arrays while retaining their constraints in prose. Move socket groups into each composition version without changing BOMs or version boundaries. Legacy technical definitions remain for step 5 retirement; the application shows the new specification when present. These record migrations may be reviewed and saved independently.',elements:elements.slice(i,i+20)});}
 }
 const queue=read('data_storytelling/change.json');for(const p of proposals){if(queue.change.some(q=>q.id===p.id))throw Error('Proposal already present: '+p.id);queue.change.push(p);}
 const root='data_storytelling/review_evidence/root-technical-specifications';fs.mkdirSync(root,{recursive:true});fs.writeFileSync(root+'/proposals.json',JSON.stringify({change:proposals},null,2)+'\n');fs.writeFileSync(root+'/audit.json',JSON.stringify(audit,null,2)+'\n');fs.writeFileSync('data_storytelling/change.json',JSON.stringify(queue,null,2)+'\n');
 console.log(JSON.stringify({proposals:proposals.length,counts:audit.counts,graphics_modes:audit.records.reduce((a,r)=>a+r.graphics_modes,0)},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))prepare();
