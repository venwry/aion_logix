// Lossless format adapter for explicit migrations and historical test fixtures.
export function migrateTechnologySpecification(items){
 return items.map(item=>'chapter_name' in item?structuredClone(item):({number:item.number,chapter_name:item.type,description:item.description,parameters:'value' in item&&String(item.value)!==item.description?[{key:'value',value:String(item.value)}]:[]}));
}
// Plain-text substitution only: inserted values are never parsed as HTML or templates.
export function specificationSegments(description,parameters=[]){
 const values=new Map(parameters.map(p=>[p.key,p.value])),parts=[];let offset=0;
 for(const match of description.matchAll(/\{([^{}]+)\}/g)){
  if(match.index>offset)parts.push({text:description.slice(offset,match.index)});
  parts.push(values.has(match[1])?{text:values.get(match[1]),key:match[1]}:{text:match[0],missing:match[1]});offset=match.index+match[0].length;
 }
 if(offset<description.length)parts.push({text:description.slice(offset)});
 return parts;
}
export function validateTechnologySpecifications(records){
 const errors=[];
 for(const record of records.values())if(record.id.startsWith('technology.'))for(const chapter of record.specification||[]){
  if(!chapter.parameters)continue; // Historical display fixtures are not new-format records.
  const keys=new Set();for(const p of chapter.parameters){if(!p.key.trim()||keys.has(p.key))errors.push(record.id+': blank or duplicate chapter parameter '+p.key);keys.add(p.key);}
  if(!chapter.chapter_name.trim())errors.push(record.id+': blank chapter name');
  for(const part of specificationSegments(chapter.description,chapter.parameters))if(part.missing)errors.push(record.id+': unresolved chapter parameter {'+part.missing+'}');
 }
 return errors;
}
let parameterTableId=0;
export function renderTechnologySpecification(chapters,renderValue=value=>document.createTextNode(value)){
 const make=(tag,className='',text)=>{const n=document.createElement(tag);n.className=className;if(text!==undefined)n.textContent=text;return n;};
 const section=make('section','technology-specification');section.setAttribute('aria-label','Technology specification');
 for(const chapter of chapters){
  const card=make('section','specification-chapter');card.dataset.chapterNumber=chapter.number;
  const heading=make('h3','specification-chapter-heading');
  heading.append(make('span','',chapter.number+'. '+(chapter.chapter_name??chapter.type)));card.append(heading);
  // Read-only compatibility for preserved before snapshots from older schemas.
  const parameters=chapter.parameters??('value' in chapter&&String(chapter.value)!==chapter.description?[{key:'value',value:String(chapter.value)}]:[]);
  const description=make('div','specification-description');
  for(const paragraph of chapter.description.split(/\n\s*\n/)){
   const p=make('p');for(const part of specificationSegments(paragraph,parameters)){
    if(part.key){const span=make('span','specification-parameter');span.title=part.key;span.append(renderValue(part.text));p.append(span);}
    else if(part.missing){const span=make('span','specification-unresolved',part.text);span.title='No parameter named '+part.missing;p.append(span);}
    else p.append(document.createTextNode(part.text));
   }description.append(p);
  }card.append(description);
  if(parameters.length){
   const wrap=make('div','specification-parameters-scroll'),table=make('table','specification-parameters'),head=make('thead'),hr=make('tr'),body=make('tbody');
   wrap.id='specification-parameters-'+(++parameterTableId);wrap.hidden=true;
   const toggle=make('button','specification-parameters-toggle','[+]');toggle.type='button';toggle.setAttribute('aria-controls',wrap.id);
   const updateToggle=()=>{const label=(wrap.hidden?'Show':'Hide')+' parameters for '+chapter.number+'. '+(chapter.chapter_name??chapter.type);toggle.textContent=wrap.hidden?'[+]':'[−]';toggle.setAttribute('aria-expanded',String(!wrap.hidden));toggle.setAttribute('aria-label',label);toggle.title=label;};
   updateToggle();toggle.addEventListener('click',()=>{wrap.hidden=!wrap.hidden;updateToggle();});heading.append(toggle);
   for(const label of ['Key','Value']){const th=make('th','',label);th.scope='col';hr.append(th);}head.append(hr);
   for(const parameter of parameters){const row=make('tr'),key=make('th','',parameter.key),value=make('td');key.scope='row';value.append(renderValue(parameter.value));row.append(key,value);body.append(row);}
   table.append(head,body);table.setAttribute('aria-label',(chapter.chapter_name??chapter.type)+' parameters');wrap.append(table);card.append(wrap);
  }section.append(card);
 }
 if(!chapters.length)section.append(make('p','','No specification chapters.'));
 return section;
}
