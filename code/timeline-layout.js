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
 return {nodes,aliases};
}
export function layoutTimeline(nodes,lo,hi){
 const start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1;
 const active=new Map([...nodes].filter(([,n])=>n.date&&n.date.end>=start&&n.date.start<=end).map(([id,n])=>[id,{...n,children:[],parent:null}]));
 for(const n of active.values()){let p=nodes.get(n.id).parent;while(p&&!active.has(p))p=nodes.get(p)?.parent;if(p){n.parent=p;active.get(p).children.push(n.id);}}
 function depth(n){return n.parent?depth(active.get(n.parent))+1:0;}
 const knots=new Map();function knot(t,d=0){knots.set(t,Math.max(knots.get(t)||0,d));}
 for(let y=lo;y<=hi+1;y++)knot(Date.UTC(y,0,1));
 for(const n of active.values()){n.depth=depth(n);n.begin=Math.max(start,n.date.start);n.finish=Math.min(end,n.date.span?n.date.end:n.date.start);knot(n.begin,n.depth);knot(n.finish,n.depth);}
 const points=[...knots].sort((a,b)=>a[0]-b[0]);let cursor=38;const positions=new Map();
 for(const [time,d] of points){positions.set(time,cursor);cursor+=84+d*70;}
 const yAt=t=>{if(positions.has(t))return positions.get(t);for(let i=1;i<points.length;i++)if(t<points[i][0]){const a=points[i-1][0],b=points[i][0];return positions.get(a)+(t-a)/(b-a)*(positions.get(b)-positions.get(a));}return cursor;};
 for(const n of active.values()){n.top=yAt(n.begin)+n.depth*70;n.bottom=n.date.span?yAt(n.finish)+(knots.get(n.finish)||0)*70+66:n.top+58;}
 const gap=12,unit=310;
 function pack(list){const placed=[];let width=0;
  for(const n of list.sort((a,b)=>a.top-b.top||b.bottom-a.bottom||a.id.localeCompare(b.id))){
   const children=n.children.map(id=>active.get(id));const childWidth=pack(children);n.width=Math.max(unit,childWidth+24);
   let left=0;const overlapping=placed.filter(p=>p.bottom+8>n.top&&p.top<n.bottom+8).sort((a,b)=>a.left-b.left);
   for(const p of overlapping){if(left+n.width+gap<=p.left)break;left=Math.max(left,p.left+p.width+gap);}n.left=left;width=Math.max(width,left+n.width);placed.push(n);
  }return width;
 }
 const roots=[...active.values()].filter(n=>!n.parent);const width=pack(roots)+86;
 const years=[];for(let year=lo;year<=hi;year++)years.push({year,top:yAt(Date.UTC(year,0,1)),height:yAt(Date.UTC(year+1,0,1))-yAt(Date.UTC(year,0,1))});
 return {nodes:active,roots,width,height:cursor,years};
}
