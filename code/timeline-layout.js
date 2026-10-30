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
  if(item.type==='process'){if(r.parent_process_id)offer(r.id,r.parent_process_id,0);for(const step of r.steps||[])if(step.event_id||step.process_id)offer(step.event_id||step.process_id,r.id,aliases.has(r.id)?1:2);}
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
 return {nodes,aliases,occurrences};
}
export function layoutTimeline(nodes,lo,hi){
 const start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1;
 const active=new Map([...nodes].filter(([,n])=>n.date&&n.date.end>=start&&n.date.start<=end).map(([id,n])=>[id,{...n,children:[],parent:null}]));
 for(const n of active.values()){let p=nodes.get(n.id).parent;while(p&&!active.has(p))p=nodes.get(p)?.parent;if(p){n.parent=p;active.get(p).children.push(n.id);}}
 for(const n of active.values())n.children.sort((a,b)=>nodes.get(n.id).children.indexOf(a)-nodes.get(n.id).children.indexOf(b));
 // Calendar anchors are non-linear. Minimum spacing protects labels; additional
 // constraints reserve only the header/footer space actually needed by nested boxes.
 const day=t=>Math.floor(t/86400000)*86400000;
 const knots=new Set(),labels=new Map(),starts=new Set();
 function label(t,value){if(!labels.has(t))labels.set(t,new Set());labels.get(t).add(value);}
 for(let y=lo;y<=hi+1;y++)knots.add(Date.UTC(y,0,1));
 for(const n of active.values()){
  n.begin=day(Math.max(start,n.boundary==='end'?n.date.end:n.date.start));n.finish=day(Math.min(end,n.date.span||n.boundary==='end'?n.date.end:n.date.start));knots.add(n.begin);knots.add(n.finish);starts.add(n.begin);
  if(n.date.start>=start)label(n.begin,n.date.startLabel||new Date(n.begin).toISOString().slice(0,10));
  if(n.date.span&&n.date.end<=end)label(n.finish,n.date.endLabel||new Date(n.finish).toISOString().slice(0,10));
 }
 function offsets(n,floor=0){const p=active.get(n.parent);n.startOffset=Math.max(floor,p&&p.begin===n.begin?p.startOffset+56:0);
  const children=n.children.map(id=>active.get(id)),first=children.find(c=>c.boundary==='start'),last=children.find(c=>c.boundary==='end'),steps=children.filter(c=>!c.boundary);
  if(first)offsets(first);
  for(const child of steps)offsets(child,first&&first.finish===child.begin?first.endOffset+8:0);
  if(last)offsets(last,Math.max(0,...children.filter(c=>c!==last&&c.finish===last.begin).map(c=>c.endOffset+8)));
  n.endOffset=n.date.span?Math.max(20,n.begin===n.finish?n.startOffset+80:20):n.startOffset+58;
  if(n.date.span)for(const id of n.children){const child=active.get(id);if(child.finish===n.finish)n.endOffset=Math.max(n.endOffset,child.endOffset+20);}
 }
 const roots=[...active.values()].filter(n=>!n.parent);for(const n of roots)offsets(n);
 const points=[...knots].sort((a,b)=>a-b),edges=new Map(points.map(t=>[t,[]]));
 function requireGap(a,b,gap){if(a<b)edges.get(b).push([a,gap]);}
 for(let i=1;i<points.length;i++)requireGap(points[i-1],points[i],Math.max(starts.has(points[i-1])?64:24,(labels.get(points[i-1])?.size||0)*14+4));
 for(const n of active.values()){
  if(n.date.span)requireGap(n.begin,n.finish,n.startOffset+80-n.endOffset);
  if(n.parent){const p=active.get(n.parent);requireGap(p.begin,n.begin,p.startOffset+56-n.startOffset);requireGap(n.finish,p.finish,n.endOffset+20-p.endOffset);}
  const children=n.children.map(id=>active.get(id)),first=children.find(c=>c.boundary==='start'),last=children.find(c=>c.boundary==='end');
  for(const child of children){
   if(first&&child!==first)requireGap(first.finish,child.begin,first.endOffset+8-child.startOffset);
   if(last&&child!==last)requireGap(child.finish,last.begin,child.endOffset+8-last.startOffset);
  }
 }
 const positions=new Map();for(const t of points)positions.set(t,Math.max(28,...edges.get(t).map(([a,g])=>positions.get(a)+g)));
 const yAt=t=>positions.get(day(t));
 for(const n of active.values()){n.top=yAt(n.begin)+n.startOffset;n.bottom=yAt(n.finish)+n.endOffset;}
 const ticks=[...labels].sort((a,b)=>a[0]-b[0]).map(([time,values])=>({time,top:yAt(time),labels:[...values]}));
 const height=Math.max(...positions.values(),...[...active.values()].map(n=>n.bottom))+30;
 const gap=12,unit=310;
 function pack(list){const placed=[];let width=0;
  for(const n of list.sort((a,b)=>a.top-b.top||b.bottom-a.bottom||a.id.localeCompare(b.id))){
   const children=n.children.map(id=>active.get(id));const childWidth=pack(children);n.width=Math.max(unit,childWidth+24);
   let left=0;const overlapping=placed.filter(p=>p.bottom+4>n.top&&p.top<n.bottom+4).sort((a,b)=>a.left-b.left);
   for(const p of overlapping){if(left+n.width+gap<=p.left)break;left=Math.max(left,p.left+p.width+gap);}n.left=left;width=Math.max(width,left+n.width);placed.push(n);
  }return width;
 }
 const width=pack(roots)+116;
 const years=[];for(let year=lo;year<=hi;year++)years.push({year,top:yAt(Date.UTC(year,0,1)),height:yAt(Date.UTC(year+1,0,1))-yAt(Date.UTC(year,0,1))});
 return {nodes:active,roots,width,height,years,ticks};
}
