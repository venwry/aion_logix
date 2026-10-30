import {$,el,human,typeOf,titleOf,loadData,timing,actorSet,fillActors,stats,splitter,showError,debounce} from './shared.js';
import {compactDetails} from './compact-details.js';
import {timelineTree,layoutTimeline} from './timeline-layout.js';
try{
 const data=await loadData(),items=data.records.filter(r=>['event','process','campaign'].includes(typeOf(r))).map(record=>({record,type:typeOf(record),date:timing(record,data.index),actors:actorSet(record,data.index),search:JSON.stringify(record).toLowerCase()}));
 const tree=timelineTree(items),dated=items.filter(x=>x.date),first=Math.min(...dated.map(x=>new Date(x.date.start).getUTCFullYear())),last=Math.max(...dated.map(x=>new Date(x.date.end).getUTCFullYear()));
 for(let y=first;y<=last;y++)for(const id of ['from','to']){const option=el('option','',y);option.value=y;$(id).append(option);}
 $('from').value=first;$('to').value=last;fillActors($('actor'),data);splitter('aion-timeline-width',360);let selected='';
 function choose(id){const r=data.index.get(id);if(!r)return;selected=id;history.replaceState(null,'','#'+encodeURIComponent(id));compactDetails(r,data,choose);for(const node of document.querySelectorAll('.timeline-card')){const selected=node.dataset.recordId===id||node.dataset.executionId===id;node.dataset.selected=String(selected);node.querySelector(':scope > .timeline-heading')?.setAttribute('aria-pressed',String(selected));}}
 function card(n){const box=el('article','timeline-card '+(n.date?.span?'duration-box':'event-box'));box.dataset.recordId=n.id;box.dataset.type=n.type;box.dataset.context=String(n.context||false);if(n.date?.span)box.dataset.spanId=n.id;
  const heading=el('button','timeline-heading');heading.append(el('strong','',titleOf(n.record)));heading.title=titleOf(n.record);heading.onclick=()=>choose(n.id);heading.setAttribute('aria-label',titleOf(n.record));
  const meta=el('div','timeline-meta');const execution=n.members.find(x=>x.type==='process'&&x.record.id!==n.id);
  if(execution){box.dataset.executionId=execution.record.id;const c=el('button','timeline-kind','Campaign'),p=el('button','timeline-kind','Process');c.onclick=()=>choose(n.id);p.onclick=()=>choose(execution.record.id);p.title=execution.record.id+' — '+titleOf(execution.record);meta.append(c,document.createTextNode(' / '),p);}
  else meta.append(el('span','',human(n.type)));
  const states=n.members.map(x=>x.record.status);const status=states.every(s=>s==='authorized')?'Authorized':states.every(s=>s!=='authorized')?'Pending authorization':'Mixed authorization';
  const date=n.date?(n.date.startLabel):'Unknown dates';
  meta.append(el('span','timeline-state',status),el('span','timeline-date',date));meta.title=(n.context?'Context for matching records · ':'')+status+' · '+date;
  box.append(heading,meta);if(n.date?.span){const end=el('div','timeline-end-date',n.date.endLabel);end.title='End: '+n.date.endLabel;box.append(end);}return box;
 }
 function render(){
  if(+$('from').value>+$('to').value)$('to').value=$('from').value;const lo=+$('from').value,hi=+$('to').value,start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1,q=$('search').value.trim().toLowerCase();
  const matches=i=>(!$('type').value||i.type===$('type').value)&&(!$('status').value||i.record.status===$('status').value)&&(!$('actor').value||i.actors.has($('actor').value))&&(!q||i.search.includes(q))&&(!i.date||i.date.end>=start&&i.date.start<=end);
  const matching=items.filter(matches),direct=new Set(matching.map(i=>tree.aliases.get(i.record.id)||i.record.id)),included=new Set(direct);
  for(const id of direct){let p=tree.nodes.get(id).parent;while(p){included.add(p);p=tree.nodes.get(p).parent;}}
  // Campaign/process filters retain their contents as context, without counting them as matches.
  function descendants(id){for(const child of tree.nodes.get(id).children){included.add(child);descendants(child);}}
  for(const id of direct)if(tree.nodes.get(id).date?.span)descendants(id);
  const nodes=new Map([...tree.nodes].filter(([id])=>included.has(id)).map(([id,n])=>[id,{...n,context:!direct.has(id)}]));
  const layout=layoutTimeline(nodes,lo,hi);$('timeline').replaceChildren();$('undated').replaceChildren();
  stats($('stats'),['event','process','campaign'].map(t=>[matching.filter(i=>i.type===t).length,t==='process'?'processes':t+'s']));
  $('result-count').textContent=`${matching.length} of ${items.length} records match · ${lo}–${hi} · linked context shown inside processes`;
  const root=$('timeline');root.style.width=layout.roots.length?layout.width+'px':'100%';root.style.height=layout.roots.length?layout.height+'px':'auto';
  if(layout.roots.length){for(const year of layout.years){const section=el('section','year-section');section.dataset.year=year.year;section.style.top=year.top+'px';section.style.height=year.height+'px';section.append(el('div','year-line'),el('h2','year-label',year.year));root.append(section);}
   function place(n,host,parent=null){const node=card(n);node.style.left=(parent?n.left+12:n.left+148)+'px';node.style.top=(parent?n.top-parent.top:n.top)+'px';node.style.width=n.width+'px';node.style.height=(n.bottom-n.top)+'px';host.append(node);for(const child of n.children)place(layout.nodes.get(child),node,n);}
   for(const n of layout.roots)place(n,root);
   const axis=el('div','date-axis');axis.setAttribute('aria-label','Timeline dates');
   const spine=el('div','date-spine');spine.style.top=layout.years[0].top+'px';spine.style.height=(layout.height-layout.years[0].top-30)+'px';axis.append(spine);
   for(const tick of layout.ticks){const row=el('div','date-tick');row.style.top=tick.top+'px';row.dataset.date=new Date(tick.time).toISOString().slice(0,10);row.title=tick.labels.join(' / ');const labels=tick.labels.map(value=>{if(value.length===4)return value;const date=new Date(value+(value.length===7?'-01':'')+'T00:00:00Z');return date.toLocaleDateString('en-GB',{month:'short',...(value.length>7?{day:'2-digit'}:{}),timeZone:'UTC'});});row.append(el('span','date-tick-label',[...new Set(labels)].join(' / ')),el('span','date-dot'));axis.append(row);}
   root.append(axis);
  }else{const empty=el('div','empty-state');empty.append(el('h2','','No dated records match'),el('p','','Adjust the filters to explore more of the story.'));root.append(empty);}
  const undated=[...nodes.values()].filter(n=>!n.date);$('undated').hidden=!undated.length;
  if(undated.length){$('undated').append(el('h2','','Undated / relative timing'),el('p','','Unknown boundaries are not invented. Linked undated work is listed here until dates are supplied.'));for(const n of undated){const node=card(n);if(n.parent)node.title='Belongs to '+titleOf(tree.nodes.get(n.parent).record);$('undated').append(node);}}
  if(!selected&&matching.length)selected=matching[0].record.id;if(selected)choose(selected);else compactDetails(null,data,choose);
 }
 $('filters').onsubmit=e=>e.preventDefault();for(const id of ['type','status','actor','from','to'])$(id).onchange=render;$('search').oninput=debounce(render);$('filters').onreset=()=>setTimeout(()=>{$('from').value=first;$('to').value=last;render();},0);
 const toggle=$('timeline-fullscreen');
 function fullScreen(on){document.body.classList.toggle('timeline-fullscreen',on);toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'Exit full screen':'Full screen';}
 toggle.onclick=()=>fullScreen(!document.body.classList.contains('timeline-fullscreen'));
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('timeline-fullscreen')){fullScreen(false);toggle.focus();}});
 const hash=decodeURIComponent(location.hash.slice(1));if(data.index.has(hash))selected=hash;render();window.addEventListener('hashchange',()=>choose(decodeURIComponent(location.hash.slice(1))));document.body.dataset.ready='true';
}catch(error){showError(error.message);}
