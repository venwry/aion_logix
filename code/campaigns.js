import {pointBounds,resolvePoint} from './temporal.js';
import {renderTechnologySpecification,specificationSegments} from './technology-specification.js';

export function validateCampaigns(records){
 const errors=[],owners=new Map();
 const own=(child,parent)=>{if(!owners.has(child))owners.set(child,new Set());owners.get(child).add(parent);};
 for(const r of records.values()){
  for(const step of r.steps||[])if(step.event_id||step.process_id||step.campaign_id)own(step.event_id||step.process_id||step.campaign_id,r.id);
  if(r.id.startsWith('process.'))for(const point of [r.period?.start,r.period?.end])if(point?.precision==='event')own(point.value,r.id);
  if(r.id.startsWith('event.'))for(const id of r.process_ids||[])own(r.id,id);
  if(r.id.startsWith('campaign.'))for(const step of r.marketing_steps||[])if(step.reference_id)own(step.reference_id,r.id);
 }
 for(const campaign of records.values())if(campaign.id.startsWith('campaign.')&&campaign.period){
  const fail=msg=>errors.push(campaign.id+': '+msg),ids=new Set(),numbers=new Set(),references=new Set();
  function ancestry(id,path=new Set()){
   if(path.has(id)){fail('cycle in campaign ownership at '+id);return;}
   const parents=owners.get(id)||new Set();
   if(parents.size>1)fail('campaign ownership requires a single parent at '+id);
   for(const parent of parents)ancestry(parent,new Set([...path,id]));
  }
  ancestry(campaign.id);
  for(const step of campaign.marketing_steps){
   if(ids.has(step.id)||numbers.has(step.number))fail('duplicate marketing step id or number');ids.add(step.id);numbers.add(step.number);
   if(step.reference_id){
    if(references.has(step.reference_id))fail('a child may occur in only one marketing step');references.add(step.reference_id);ancestry(step.reference_id);
    const target=records.get(step.reference_id),start=pointBounds(campaign.period.start,records),end=pointBounds(campaign.period.end,records);
    const childStart=pointBounds(target?.time||target?.period?.start,records),childEnd=pointBounds(target?.time||target?.period?.end,records);
    if(start&&end&&childStart&&childEnd&&(childStart.start<start.start||childEnd.end>end.end))fail('marketing step reference falls outside campaign period');
   }
   const blocks=new Set();
   for(const block of step.marketing_presentation){
    if(blocks.has(block.number))fail('duplicate presentation block number in '+step.id);blocks.add(block.number);
    const keys=new Set();for(const p of block.parameters){if(keys.has(p.key))fail('duplicate presentation parameter '+p.key);keys.add(p.key);}
    for(const part of specificationSegments(block.description,block.parameters))if(part.missing)fail('unresolved presentation parameter '+part.missing);
    for(const key of keys)if(!block.description.includes('{'+key+'}'))fail('unused presentation parameter '+key);
   }
  }
 }
 return errors;
}

export function renderMarketingSteps(steps,index,renderValue){
 const section=document.createElement('section');section.className='marketing-steps';section.setAttribute('aria-label','Marketing steps');
 for(const step of steps){
  const card=document.createElement('section');card.className='marketing-step';card.dataset.stepId=step.id;
  const heading=document.createElement('h3');heading.className='marketing-step-heading';heading.textContent=step.number+' '+step.type+' '+step.description;card.append(heading);
  if(step.reference_id){
   const target=index.get(step.reference_id),point=resolvePoint(target?.time||target?.period?.start,index);
   const reference=document.createElement('div');reference.className='marketing-step-reference';reference.append(renderValue(step.reference_id),document.createTextNode(' · '+(point?.value||'unknown date')));card.append(reference);
  }
  const blocks=step.marketing_presentation.map(block=>({number:block.number,chapter_name:'Presentation block',description:block.description,parameters:block.parameters.map(p=>({key:p.key,value:p.ref_id??p.value}))}));
  card.append(renderTechnologySpecification(blocks,renderValue));section.append(card);
 }
 if(!steps.length){const empty=document.createElement('p');empty.textContent='No marketing steps specified.';section.append(empty);}
 return section;
}
