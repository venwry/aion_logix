export const timelineCategories = [
 {id:'personal',label:"Adam's personal",color:'#edf5ff'},
 {id:'investment',label:'Logix/AION investment',color:'#f1edfa'},
 {id:'product',label:'Product dev & launch',color:'#eaf6ee'},
 {id:'ecosystem',label:'Ecosystem & Partners',color:'#fff5df'},
 {id:'competition',label:'Competition',color:'#fceeed'},
];
export const uncategorisedLane={id:'uncategorised',label:'Uncategorised',color:'#f1f3f5'};
export function laneFor(category){return timelineCategories.find(l=>l.label===category)||uncategorisedLane;}

// Pack concurrent groups inside their category. Callers exclude hidden categories
// before calculating the shared vertical geometry; retain their controls here.
export function arrangeSwimlanes(layout,collapsed=new Set(),hasUncategorised=false){
 const definitions=[...timelineCategories];
 if(hasUncategorised||layout.roots.some(r=>laneFor(r.category).id==='uncategorised'))definitions.push(uncategorisedLane);
 let offset=0;
 const lanes=definitions.map(def=>{
  const groups=layout.roots.filter(r=>laneFor(r.category).id===def.id),hidden=collapsed.has(def.id),placed=[];
  let width=360;
  for(const root of groups){
   let left=12;
   const overlaps=placed.filter(p=>p.groupBottom+12>root.groupTop&&p.groupTop<root.groupBottom+12).sort((a,b)=>a.left-b.left);
   for(const p of overlaps){if(left+root.width+16<=p.left)break;left=Math.max(left,p.left+p.width+16);}
   root.left=left;placed.push(root);width=Math.max(width,left+root.width+12);
  }
  const lane={...def,left:offset,width:hidden?0:width,hidden,groups};
  for(const root of groups){root.left+=offset;root.laneId=def.id;for(const n of root.entries)n.cardLeft=root.left+root.gutter;}
  if(!hidden)offset+=width+12;
  return lane;
 });
 return {...layout,lanes,roots:lanes.filter(l=>!l.hidden).flatMap(l=>l.groups),width:offset+104};
}
