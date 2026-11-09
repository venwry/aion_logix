import {pointBounds} from './temporal.js';

// Validate only products that opt into the paired launch links during migration.
// Ownership is structural; subject, input and outcome links do not establish it.
export function validateProductLaunches(records) {
 const errors=[],parents=new Map();
 function own(child,parent) {
  if(!parents.has(child))parents.set(child,new Set());
  parents.get(child).add(parent);
 }
 for(const r of records.values()) {
  if(r.id.startsWith('process.')) {
   for(const step of r.steps||[])if(step.event_id||step.process_id)own(step.event_id||step.process_id,r.id);
   for(const point of [r.period?.start,r.period?.end])if(point?.precision==='event')own(point.value,r.id);
  }
  if(r.id.startsWith('event.'))for(const id of r.process_ids||[])own(r.id,id);
 }
 for(const product of records.values()) {
  if(!product.id.startsWith('product.')||(!product.launch_campaign_id&&!product.launch_event_id))continue;
  const fail=message=>errors.push(`${product.id}: ${message}`);
  if(!product.launch_campaign_id||!product.launch_event_id){fail('launch campaign and event must be supplied together');continue;}
  const campaign=records.get(product.launch_campaign_id),event=records.get(product.launch_event_id),process=records.get(campaign?.process_id);
  if(!campaign||!event||!process)continue; // Schema reference validation reports missing targets.
  const seen=new Set();let cursor=event.id,owned=false,valid=true;
  while(cursor) {
   if(seen.has(cursor)){fail('cycle in launch event ownership');valid=false;break;}
   seen.add(cursor);
   if(cursor===process.id)owned=true;
   const owners=parents.get(cursor)||new Set();
   if(owners.size>1){fail('launch event ownership must have a single parent at '+cursor);valid=false;break;}
   if(!owners.size){if(!owned)fail('launch event must belong to its campaign execution process');break;}
   cursor=[...owners][0];
  }
  if(!owned||!valid)continue;
  const date=pointBounds(event.time,records),start=pointBounds(process.period?.start,records),end=pointBounds(process.period?.end,records);
  if(!date||!start||!end){fail('launch containment requires known event and campaign process dates');continue;}
  // Preserve source precision: reject dates outside even the widest possible
  // process envelope; never coerce month/year boundaries to an invented day.
  if(date.start<start.start||date.end>end.end)fail('launch event falls outside the campaign execution process period');
 }
 return errors;
}
