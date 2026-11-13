import {costComposition,roundCost} from './manufacturing-cost-model.js';
export const pricingFields=[['manufacturing_cost','Manufacturing'],['competition_price','Competition'],['retail_price','Retail'],['profit','Profit']];
export function pricingAmounts(cost,competition){
 if(!Number.isFinite(cost)||cost<0||competition!==null&&(!Number.isFinite(competition)||competition<0))throw Error('Invalid pricing input');
 const fee=roundCost(cost*.20),breakEven=roundCost(cost+fee),retail=competition===null?null:roundCost((breakEven+competition)/2);
 return {manufacturing_cost:cost,computerland_fee:fee,break_even:breakEven,competition_price:competition,retail_price:retail,profit:retail===null?null:roundCost(retail-breakEven)};
}
export function competitionBasket(index,assumptions,productId,date){
 const mappings=new Map(assumptions.records.map(r=>[r.record_id,r])),profiles=new Map(assumptions.profiles.map(r=>[r.id,r]));const lines=[],missing=[];
 function visit(id,version,quantity,path){
  if(path.includes(id))throw Error('Pricing composition cycle: '+id);if(quantity===0)return;
  const r=index.get(id);if(!r)throw Error('Missing pricing record '+id);
  const mapping=mappings.get(id);
  if(mapping){
   const profile=profiles.get(mapping.profile_id);if(!profile)throw Error('Missing competition profile '+mapping.profile_id);
   const observations=profile.observations.filter(o=>o.date<=date);const observation=observations.at(-1);
   if(!observation||observation.status==='planning'&&!assumptions.allow_planning){missing.push(id+': no supported comparator at '+date);return;}
   const normalized=observation.comparables.map(c=>({...c,normalized_price:roundCost(c.price*mapping.multiplier)}));
   const unit=roundCost(normalized.reduce((s,c)=>s+c.normalized_price,0)/normalized.length);
   lines.push({record_id:id,quantity,profile_id:profile.id,status:observation.status,observation_date:observation.date,basis:profile.basis+' '+mapping.basis,comparables:normalized,unit_price:unit,total:roundCost(unit*quantity)});return;
  }
  if(r.id.startsWith('product.')&&r.composition_history?.length){const v=costComposition(r,date,index,version);for(const l of v.composition_definition)visit(l.target.record_id,l.target.version_number,quantity*l.quantity,[...path,id]);}
  else missing.push(id+': no comparable scope defined');
 }
 visit(productId,undefined,1,[]);
 return {competition_price:missing.length?null:roundCost(lines.reduce((s,l)=>s+l.total,0)),status:missing.length?'unpriced':lines.some(l=>l.status==='planning')?'planning':'normalized',lines,missing};
}
export function buildProductPricing(index,costs,assumptions){return costs.manufacturing_costs.map(row=>({product_id:row.product_id,unit:row.unit,estimates:row.estimates.map(e=>{const comparison=competitionBasket(index,assumptions,row.product_id,e.date);return {date:e.date,composition_version:e.composition_version,...pricingAmounts(e.total,comparison.competition_price),comparison};})}));}
