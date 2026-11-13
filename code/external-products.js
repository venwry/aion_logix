import {specificationSegments} from './technology-specification.js';
export const standardKinds=new Set(['software_standard','hardware_standard']);
export function validDirectDate(value){
 if(typeof value!=='string'||!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value))return false;
 const [year,month=1,day=1]=value.split('-').map(Number);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 return year>0&&month>=1&&month<=12&&day>=1&&day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
}
export function externalSpecificationChapters(items){
 return items.map(item=>'chapter_name' in item?item:{number:item.no,chapter_name:item.ref_role,description:item.description+' Related record: {reference}.',parameters:[{key:'reference',value:item.ref_id}]});
}
const descriptions=['assumption_description','comparison_description','outcomes_description'];
export function validateExternalProducts(records){
 const errors=[];
 for(const r of records.values())if(r.id.startsWith('external_product.')){
  const fail=message=>errors.push(r.id+': '+message);
  if(r.release!==undefined&&!validDirectDate(r.release))fail('invalid release date');
  const numbers=new Set();
  function parameters(item,texts){
   const keys=new Set();
   for(const p of item.parameters||[]){if(!p.key.trim()||keys.has(p.key))fail('blank or duplicate parameter '+p.key);keys.add(p.key);}
   for(const text of texts)for(const segment of specificationSegments(text,item.parameters||[]))if(segment.missing)fail('unresolved parameter '+segment.missing);
   for(const key of keys)if(!texts.some(t=>t.includes('{'+key+'}')))fail('unused parameter '+key);
   // IDs stored as text parameters retain navigability and referential integrity.
   for(const p of item.parameters||[])if(/^(actor|agreement|assumption|campaign|event|location|manufacturing_capability|market_response|process|product|technology|base_part|device|software_edition|external_product)\.[a-z0-9][a-z0-9_.-]*$/.test(p.value)&&!records.has(p.value))fail('unknown parameter reference '+p.value);
  }
  for(const c of r.specification||[]){const n=c.number??c.no;if(numbers.has(n))fail('duplicate specification number '+n);numbers.add(n);if(c.chapter_name!==undefined){if(!c.chapter_name.trim())fail('blank chapter name');parameters(c,[c.description]);}}
  const standards=new Set();
  for(const impact of r.impacted_standards||[]){
   if(standards.has(impact.standard_id))fail('duplicate impacted standard '+impact.standard_id);standards.add(impact.standard_id);
   if(!standardKinds.has(records.get(impact.standard_id)?.kind))fail('impacted standard must have software_standard or hardware_standard kind: '+impact.standard_id);
   if(!validDirectDate(impact.date))fail('invalid standard impact date');
   parameters(impact,descriptions.map(k=>impact[k]));
  }
 }
 return errors;
}
let serial=0;
export function renderImpactedStandards(items,index,renderValue=value=>document.createTextNode(String(value))){
 const make=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const section=make('section','impacted-standards');section.setAttribute('aria-label','Impacted standards');
 const labels=['Base assumptions:','Relation to standard:','Commercial consequences:'];
 for(const item of items){
  const card=make('section','standard-impact');card.dataset.standardId=item.standard_id;
  const title=(index.get(item.standard_id)?.name||item.standard_id)+' ('+item.date+')';
  const heading=make('h3','specification-chapter-heading');heading.append(renderValue(item.standard_id),document.createTextNode(' ('+item.date+')'));card.append(heading);
  const prose=make('div','specification-description');
  descriptions.forEach((field,i)=>{
   const p=make('p');p.append(make('strong','',labels[i]),document.createTextNode(' '));
   for(const part of specificationSegments(item[field],item.parameters)){
    if(part.key){const span=make('span','specification-parameter');span.title=part.key;span.append(renderValue(part.text));p.append(span);}
    else p.append(document.createTextNode(part.text));
   }prose.append(p);
  });card.append(prose);
  if(item.parameters.length){
   const wrap=make('div','specification-parameters-scroll');wrap.id='impact-parameters-'+(++serial);wrap.hidden=true;
   const toggle=make('button','specification-parameters-toggle');toggle.type='button';toggle.setAttribute('aria-controls',wrap.id);
   const update=()=>{toggle.textContent=wrap.hidden?'[+]':'[−]';toggle.setAttribute('aria-expanded',String(!wrap.hidden));toggle.setAttribute('aria-label',(wrap.hidden?'Show':'Hide')+' parameters for '+title);};update();toggle.onclick=()=>{wrap.hidden=!wrap.hidden;update();};heading.append(toggle);
   const table=make('table','specification-parameters'),head=make('thead'),tr=make('tr'),body=make('tbody');
   for(const label of ['Key','Value']){const th=make('th','',label);th.scope='col';tr.append(th);}head.append(tr);
   for(const p of item.parameters){const row=make('tr'),key=make('th','',p.key),value=make('td');key.scope='row';value.append(renderValue(p.value));row.append(key,value);body.append(row);}table.append(head,body);table.setAttribute('aria-label',title+' parameters');wrap.append(table);card.append(wrap);
  }section.append(card);
 }
 return section;
}
