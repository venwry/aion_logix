import {specificationSegments} from './technology-specification.js';

export const graphicFields=['type','width','height','framebuffer_size','double_buffering','sprites_available'];
export const parameterValues=parameters=>new Map((parameters||[]).map(p=>[p.key,Object.hasOwn(p,'ref_id')?p.ref_id:p.value]));
const displayValue=p=>Object.hasOwn(p,'ref_id')?p.ref_id:p.value===null?'unknown':p.value;
const canonicalIntegers=new Set(['chips','capacity_kb','capacity_kbit','stride_bytes']);
export function validateTechnicalSpecifications(records){
 const errors=[],fail=(r,m)=>errors.push(r.id+': '+m);
 function parameters(r,ps,descriptions,fixed=[]){
  const keys=new Set(fixed),used=new Set();
  for(const p of ps){
   if(!/^[a-z][a-z0-9_]*$/.test(p.key)||keys.has(p.key))fail(r,'invalid or duplicate technical parameter '+p.key);
   keys.add(p.key);
   if(Object.hasOwn(p,'ref_id')){
    if(!records.has(p.ref_id))fail(r,'unresolved technical reference '+p.ref_id);
    if(!p.ref_role?.trim())fail(r,'technical reference needs a role: '+p.key);
   }
   if((canonicalIntegers.has(p.key)||p.key==='bits_per_pixel')&&p.value!==null){
    if(typeof p.value!=='number'||!Number.isFinite(p.value)||p.value<0||(canonicalIntegers.has(p.key)&&!Number.isInteger(p.value)))fail(r,'invalid numeric technical parameter '+p.key);
    if(['bits_per_pixel','stride_bytes','capacity_kbit','chips'].includes(p.key)&&p.value===0)fail(r,'technical parameter must be positive: '+p.key);
   }
   if(p.key==='chip_type_id'&&(!p.ref_id?.startsWith('base_part.')||Object.hasOwn(p,'value')))fail(r,'chip_type_id must be a base_part reference');
  }
  for(const description of descriptions)for(const match of description.matchAll(/\{([^{}]+)\}/g)){
   used.add(match[1]);if(!keys.has(match[1]))fail(r,'unresolved technical parameter {'+match[1]+'}');
  }
  for(const p of ps)if(!used.has(p.key))fail(r,'unused technical parameter '+p.key);
  return parameterValues(ps);
 }
 for(const r of records.values()){
  if(r.technical_specification){
   const s=r.technical_specification,nums=new Set();
   for(const c of s.chapters){if(nums.has(c.number)||!c.chapter_name.trim()||!c.description.trim())fail(r,'invalid technical chapter');nums.add(c.number);}
   const p=parameters(r,s.parameters,s.chapters.map(c=>c.description));
   if(p.has('chips')||p.has('chip_type_id')){
    for(const k of ['chips','chip_type_id','capacity_kb'])if(!p.has(k))fail(r,'missing RAM parameter '+k);
    const chip=records.get(p.get('chip_type_id'));
    const capacity=chip?.technical_specification?parameterValues(chip.technical_specification.parameters).get('capacity_kbit'):chip?.technical_definition?.specification?.capacity_kbit;
    if(chip&&capacity===undefined)fail(r,'referenced RAM chip needs capacity_kbit');
    if(p.get('chips')!=null&&p.get('capacity_kb')!=null&&capacity!=null&&p.get('chips')*capacity/8!==p.get('capacity_kb'))fail(r,'memory capacity arithmetic mismatch');
   }
  }
  const ids=new Set();
  for(const mode of r.graphic_modes_specification||[]){
   if(ids.has(mode.id))fail(r,'duplicate graphic mode '+mode.id);ids.add(mode.id);
   const p=parameters(r,mode.parameters,[mode.description],graphicFields);
   if(mode.type==='bitmap'){
    for(const k of ['bits_per_pixel','stride_bytes'])if(!p.has(k))fail(r,'bitmap mode needs '+k);
    const bits=p.get('bits_per_pixel'),stride=p.get('stride_bytes');
    if(mode.width!=null&&bits!=null&&stride!=null&&stride<Math.ceil(mode.width*bits/8))fail(r,'bitmap stride is smaller than a scanline');
    if(mode.height!=null&&stride!=null&&mode.framebuffer_size!=null&&mode.framebuffer_size<stride*mode.height)fail(r,'framebuffer arithmetic mismatch');
   }else{
    for(const k of ['columns','rows','glyph_width','glyph_height','character_map_bytes_per_buffer','attribute_map_bytes_per_buffer'])if(!p.has(k))fail(r,'text mode needs '+k);
    for(const k of ['columns','rows','glyph_width','glyph_height','character_map_bytes_per_buffer','attribute_map_bytes_per_buffer'])if(p.has(k)&&p.get(k)!==null&&(!Number.isInteger(p.get(k))||p.get(k)<0))fail(r,'invalid text-mode parameter '+k);
    for(const [dimension,count,glyph] of [['width','columns','glyph_width'],['height','rows','glyph_height']])if(mode[dimension]!=null&&p.get(count)!=null&&p.get(glyph)!=null&&mode[dimension]!==p.get(count)*p.get(glyph))fail(r,'text geometry mismatch');
    const character=p.get('character_map_bytes_per_buffer'),attribute=p.get('attribute_map_bytes_per_buffer');
    if(character!=null&&attribute!=null&&mode.framebuffer_size!=null&&mode.framebuffer_size<character+attribute)fail(r,'text page is smaller than character and attribute maps');
   }
  }
 }
 return errors;
}

let serial=0;
const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
function narrative(text,parameters,renderValue){
 const container=make('div','specification-description');
 for(const paragraph of text.split(/\n\s*\n/)){
  const line=make('p');for(const segment of specificationSegments(paragraph,parameters.map(p=>({key:p.key,value:displayValue(p)})))){
   if(segment.key){const span=make('span','specification-parameter');const parameter=parameters.find(p=>p.key===segment.key);span.title=parameter?.ref_id?segment.key+': '+parameter.ref_id+' — '+parameter.ref_role:segment.key;span.append(renderValue(segment.text));line.append(span);}
   else line.append(make('span',segment.missing?'specification-unresolved':'',segment.text));
  }container.append(line);
 }return container;
}
function tableToggle(host,heading,parameters,title,renderValue){
 if(!parameters.length)return;
 const wrap=make('div','specification-parameters-scroll'),table=make('table','specification-parameters'),head=make('thead'),hr=make('tr'),body=make('tbody');
 wrap.id='technical-parameters-'+(++serial);wrap.hidden=true;
 const button=make('button','specification-parameters-toggle','[+]');button.type='button';button.setAttribute('aria-controls',wrap.id);
 const update=()=>{button.textContent=wrap.hidden?'[+]':'[−]';button.setAttribute('aria-expanded',String(!wrap.hidden));button.setAttribute('aria-label',(wrap.hidden?'Show':'Hide')+' parameters for '+title);};
 button.onclick=()=>{wrap.hidden=!wrap.hidden;update();};update();heading.append(button);
 for(const label of ['Key','Value','Reference role']){const th=make('th','',label);th.scope='col';hr.append(th);}head.append(hr);
 for(const p of parameters){const tr=make('tr'),key=make('th','',p.key),value=make('td'),role=make('td','',p.ref_role||'');key.scope='row';value.append(renderValue(displayValue(p)));tr.append(key,value,role);body.append(tr);}
 table.setAttribute('aria-label',title+' parameters');table.append(head,body);wrap.append(table);host.append(wrap);
}
export function renderTechnicalSpecification(spec,renderValue=value=>document.createTextNode(value)){
 const section=make('section','technical-specification'),heading=make('h3','specification-chapter-heading','Technical specification');section.setAttribute('aria-label','Technical specification');section.append(heading);
 tableToggle(section,heading,spec.parameters,'Technical specification',renderValue);
 for(const chapter of spec.chapters){const card=make('section','specification-chapter');card.dataset.chapterNumber=chapter.number;card.append(make('h4','specification-chapter-heading',chapter.number+'. '+chapter.chapter_name),narrative(chapter.description,spec.parameters,renderValue));section.append(card);}
 if(!spec.chapters.length)section.append(make('p','','No technical specification recorded.'));
 return section;
}
export function renderGraphicModes(modes,renderValue=value=>document.createTextNode(value)){
 const section=make('section','graphic-modes-specification');section.setAttribute('aria-label','Graphics modes');section.append(make('h3','','Graphics modes'));
 for(const [i,mode] of modes.entries()){
  const card=make('section','specification-chapter'),heading=make('h4','specification-chapter-heading',(i+1)+'. '+mode.id);card.dataset.modeId=mode.id;
  const parameters=[...graphicFields.map(key=>({key,value:mode[key]})),...mode.parameters];
  card.append(heading,narrative(mode.description,parameters,renderValue));tableToggle(card,heading,parameters,mode.id,renderValue);section.append(card);
 }return section;
}
