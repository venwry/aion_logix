import {specificationSegments} from '../code/technology-specification.js';
// Authoring checks for revised proposals. The direct format-conversion baseline
// remains readable and schema-valid while its prose changes await review.
export function checkTechnologyProse(record){
 const errors=[];
 for(const chapter of record.specification||[]){
  const at=record.id+' chapter '+chapter.number,used=new Set(specificationSegments(chapter.description,chapter.parameters).filter(p=>p.key).map(p=>p.key)),lists=new Map();
  for(const p of chapter.parameters){
   if(/^(true|false)$/i.test(p.value.trim()))errors.push(at+': Boolean parameter '+p.key+' belongs in prose');
   if(!used.has(p.key))errors.push(at+': unused parameter '+p.key);
   if(/[.!?]$/.test(p.value.trim()))errors.push(at+': statement-valued parameter '+p.key);
   const numbered=p.key.match(/^(.*?) (\d+)( \([^)]*\))?$/);
   if(numbered){const base=numbered[1]+(numbered[3]||'');lists.set(base,(lists.get(base)||0)+1);}
  }
  for(const [base,count] of lists)if(count>1)errors.push(at+': consolidate numbered list '+base);
  for(const part of specificationSegments(chapter.description,chapter.parameters))if(part.missing)errors.push(at+': missing parameter '+part.missing);
 }
 return errors;
}
