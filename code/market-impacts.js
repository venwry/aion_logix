import {standardKinds} from './external-products.js';
import {specificationSegments,renderTechnologySpecification} from './technology-specification.js';
export function validateMarketImpacts(records){
 const errors=[];
 for(const r of records.values())if(r.id.startsWith('market_response.')){
  const fail=text=>errors.push(r.id+': '+text);
  for(const [field,key,types] of [['impacted_standards','standard_id',['technology']],['impacted_products','product_id',['product','external_product']]]){
   const seen=new Set();
   for(const entry of r[field]||[]){
    const id=entry[key],target=records.get(id);
    if(seen.has(id))fail('duplicate '+key+' '+id);seen.add(id);
    if(!target||!types.includes(id.split('.')[0]))fail('invalid '+key+' '+id);
    if(key==='standard_id'&&!standardKinds.has(target?.kind))fail('standard must have software_standard or hardware_standard kind: '+id);
    const keys=new Set();
    for(const p of entry.parameters){
     if(!p.key.trim()||keys.has(p.key))fail('blank or duplicate parameter '+p.key);keys.add(p.key);
     if(!entry.description.includes('{'+p.key+'}'))fail('unused parameter '+p.key);
    }
    for(const part of specificationSegments(entry.description,entry.parameters))if(part.missing)fail('unresolved parameter '+part.missing);
   }
  }
 }
 return errors;
}
export function renderMarketImpacts(entries,field,index,renderValue){
 const key=field==='impacted_standards'?'standard_id':'product_id';
 const labels={strengthens:'Strengthens',weakens:'Weakens',mixed:'Mixed'};
 const section=renderTechnologySpecification(entries.map((e,i)=>({number:i+1,chapter_name:(index.get(e[key])?.name||index.get(e[key])?.title||e[key])+' — '+labels[e.direction],description:e.description,parameters:e.parameters})),renderValue);
 section.classList.add('market-impacts');section.setAttribute('aria-label',field==='impacted_standards'?'Impacted standards':'Impacted products');
 entries.forEach((e,i)=>{const heading=section.children[i].querySelector('.specification-chapter-heading');heading.firstChild.replaceWith(renderValue(e[key]),document.createTextNode(' — '+labels[e.direction]));});
 return section;
}
