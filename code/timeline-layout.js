// Pure layout: explicit membership, interval packing, and a shared content-spaced calendar.
export function timelineTree(items){
 const byId=new Map(items.map(x=>[x.record.id,x])),aliases=new Map(),nodes=new Map();
 for(const item of items.filter(x=>x.type==='campaign'))if(byId.has(item.record.process_id))aliases.set(item.record.process_id,item.record.id);
 for(const item of items){if(aliases.has(item.record.id))continue;const execution=item.type==='campaign'?byId.get(item.record.process_id):null;
  nodes.set(item.record.id,{...item,id:item.record.id,members:execution?[item,execution]:[item],children:[],parent:null});
 }
 const canonical=id=>aliases.get(id)||id,candidates=new Map();
 function offer(child,parent,priority){child=canonical(child);parent=canonical(parent);if(child===parent||!nodes.has(child)||!nodes.has(parent))return;const list=candidates.get(child)||[];list.push({parent,priority});candidates.set(child,list);}
 for(const item of items){const r=item.record;
  if(item.type==='process'){for(const step of r.steps||[])if(step.event_id||step.process_id||step.campaign_id)offer(step.event_id||step.process_id||step.campaign_id,r.id,aliases.has(r.id)?1:2);}
  if(item.type==='campaign')for(const step of r.marketing_steps||[])if(step.reference_id)offer(step.reference_id,r.id,2);
  if(item.type==='event')for(const id of r.process_ids||[])offer(r.id,id,3);
 }
 for(const [id,list] of candidates){const node=nodes.get(id);list.sort((a,b)=>a.priority-b.priority||a.parent.localeCompare(b.parent));
  for(const candidate of list){const parent=nodes.get(candidate.parent);let ancestor=parent,cycle=false;while(ancestor){if(ancestor.id===id){cycle=true;break;}ancestor=nodes.get(ancestor.parent);}if(cycle)continue;
   // Never stretch a dated process or invent a missing child's dates just to fit membership.
   if(node.date&&parent.date&&(node.date.start<parent.date.start||node.date.end>parent.date.end))continue;
   node.parent=parent.id;parent.children.push(id);break;
  }
 }
 // Boundary occurrences belong to each owning process. They share the event
 // record, but not its visual identity: a handoff can end one process and start another.
 const boundaryOwners=new Map();
 for(const item of items.filter(x=>x.type==='process'))for(const role of ['start','end']){
  const point=item.record.period?.[role],event=point?.precision==='event'?byId.get(point.value):null;
  if(event?.type!=='event')continue;
  const parent=nodes.get(canonical(item.record.id)),id=`${item.record.id}::${role}::${event.record.id}`;
  nodes.set(id,{...event,id,members:[event],children:[],parent:parent.id,boundary:role});parent.children.push(id);
  if(!boundaryOwners.has(event.record.id))boundaryOwners.set(event.record.id,new Set());
  boundaryOwners.get(event.record.id).add(parent.id);
 }
 for(const [id,owners] of boundaryOwners){const original=nodes.get(id);
  // Retain a separate step occurrence only when it belongs to another process.
  if(!original.parent||owners.has(original.parent)){
   if(original.parent){const parent=nodes.get(original.parent);parent.children=parent.children.filter(child=>child!==id);}
   nodes.delete(id);
  }
 }
 const order=id=>nodes.get(id).boundary==='start'?-1:nodes.get(id).boundary==='end'?1:0;
 for(const node of nodes.values())node.children.sort((a,b)=>order(a)-order(b));
 const occurrences=new Map();
 for(const node of nodes.values())for(const member of node.members){const id=member.record.id;if(!occurrences.has(id))occurrences.set(id,[]);occurrences.get(id).push(node.id);}
 // Resolve on the complete ownership tree, before filters can hide ancestors.
 function category(node){
  if(node.category!==undefined)return node.category;
  const owner=node.members.find(m=>m.type==='process')||node.members.find(m=>m.type==='event')||node.members.find(m=>m.type==='campaign');
  return node.category=node.parent?category(nodes.get(node.parent)):(owner?.record.category||'');
 }
 for(const node of nodes.values())category(node);
 return {nodes,aliases,occurrences};
}
// Header cards and duration tracks have separate geometry. Every group uses the
// same content-spaced date anchors; nested levels share one narrow track panel.
export function layoutTimeline(nodes,lo,hi){
 const start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1,day=t=>Math.floor(t/86400000)*86400000;
 const active=new Map([...nodes].filter(([,n])=>n.date&&n.date.end>=start&&n.date.start<=end).map(([id,n])=>[id,{...n,children:[],parent:null}]));
 for(const n of active.values()){let p=nodes.get(n.id).parent;while(p&&!active.has(p))p=nodes.get(p)?.parent;if(p){n.parent=p;active.get(p).children.push(n.id);}}
 const roots=[...active.values()].filter(n=>!n.parent),knots=new Set(),labels=new Map();
 const cardHeight=54,rowGap=8,trackGap=16,cardWidth=340;
 const label=(t,value)=>{if(!labels.has(t))labels.set(t,new Set());labels.get(t).add(value);};
 for(let year=lo;year<=hi+1;year++)knots.add(Date.UTC(year,0,1));
 for(const n of active.values()){
  n.begin=day(Math.max(start,n.boundary==='end'?n.date.end:n.date.start));
  n.finish=day(Math.min(end,n.date.span||n.boundary==='end'?n.date.end:n.date.start));
  n.clippedStart=n.date.start<start;n.clippedEnd=n.date.end>end;
  knots.add(n.begin);knots.add(n.finish);
  if(!n.clippedStart)label(n.begin,n.boundary==='end'?n.date.endLabel||n.date.startLabel:n.date.startLabel||new Date(n.begin).toISOString().slice(0,10));
  if(n.date.span&&!n.clippedEnd)label(n.finish,n.date.endLabel||new Date(n.finish).toISOString().slice(0,10));
 }
 // Preorder puts a parent's header before its same-date descendants; end
 // occurrences follow the entire subtree. Original step order breaks ties.
 function visit(n,list){list.push(n);const children=n.children.map(id=>active.get(id));
  for(const child of children.filter(c=>c.boundary==='start'))visit(child,list);
  for(const child of children.filter(c=>!c.boundary))visit(child,list);
  for(const child of children.filter(c=>c.boundary==='end'))visit(child,list);
 }
 const reservations=new Map();
 for(const root of roots){
  const list=[];visit(root,list);const rank=new Map(list.map((n,i)=>[n.id,i]));
  root.entries=list.sort((a,b)=>a.begin-b.begin||rank.get(a.id)-rank.get(b.id));
  const counts=new Map(),slots=[];
  for(const n of root.entries){
   n.group=root.id;n.row=counts.get(n.begin)||0;counts.set(n.begin,n.row+1);
   if(n.date.span){let slot=slots.findIndex(finish=>finish<n.begin);if(slot<0)slot=slots.length;slots[slot]=n.finish;n.track=slot;}
  }
  root.trackCount=slots.length;root.gutter=slots.length?56+slots.length*trackGap:0;root.width=root.gutter+cardWidth+8;
  for(const [time,count] of counts)reservations.set(time,Math.max(reservations.get(time)||0,count*(cardHeight+rowGap)));
 }
 const rootStarts=new Set(roots.map(n=>n.begin));
 const points=[...knots].sort((a,b)=>a-b),positions=new Map();let y=72;
 for(let i=0;i<points.length;i++){
  if(i)y+=Math.max(rootStarts.has(points[i])?50:24,reservations.get(points[i-1])||0,(labels.get(points[i-1])?.size||0)*24+4);
  positions.set(points[i],y);
 }
 const yAt=t=>positions.get(day(t));
 for(const n of active.values()){
  n.anchor=yAt(n.begin);n.endAnchor=yAt(n.finish);
  n.top=n.anchor-20+n.row*(cardHeight+rowGap);n.bottom=n.top+cardHeight;
  n.cardWidth=cardWidth;
 }
 // Pack whole groups, not nested boxes. Sequential roots can reuse a lane.
 const placed=[];let width=0;
 for(const root of roots.sort((a,b)=>a.top-b.top||b.endAnchor-a.endAnchor||a.id.localeCompare(b.id))){
  root.groupTop=Math.min(...root.entries.map(n=>n.top))-4;
  root.groupBottom=Math.max(...root.entries.map(n=>Math.max(n.bottom,n.endAnchor+12)))+4;
  let left=0;const overlaps=placed.filter(p=>p.groupBottom+12>root.groupTop&&p.groupTop<root.groupBottom+12).sort((a,b)=>a.left-b.left);
  for(const p of overlaps){if(left+root.width+16<=p.left)break;left=Math.max(left,p.left+p.width+16);}
  root.left=left;for(const n of root.entries)n.cardLeft=left+root.gutter;
  placed.push(root);width=Math.max(width,left+root.width);
 }
 const ticks=[...labels].sort((a,b)=>a[0]-b[0]).map(([time,values])=>({time,top:yAt(time),labels:[...values]}));
 const years=[];for(let year=lo;year<=hi;year++)years.push({year,top:yAt(Date.UTC(year,0,1)),height:yAt(Date.UTC(year+1,0,1))-yAt(Date.UTC(year,0,1))});
 const height=Math.max(...positions.values(),...roots.map(n=>n.groupBottom))+30;
 return {nodes:active,roots,width:width+116,height,years,ticks,trackGap};
}
