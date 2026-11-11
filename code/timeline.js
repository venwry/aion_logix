import {indexProductLaunches} from './product-launches.js';
import {annotationController} from './annotations.js';
import {$,el,human,typeOf,titleOf,loadData,timing,actorSet,fillActors,stats,splitter,showError,debounce} from './shared.js';
import {compactDetails} from './compact-details.js';
import {timelineTree,layoutTimeline} from './timeline-layout.js';
import {arrangeSwimlanes,laneFor} from './timeline-lanes.js';
const collapsedLanes=new Set();
try{
 const data=await loadData(),items=data.records.filter(r=>['event','process','campaign'].includes(typeOf(r))).map(record=>({record,type:typeOf(record),date:timing(record,data.index),actors:actorSet(record,data.index),search:JSON.stringify(record).toLowerCase()}));
 const launchedProducts=indexProductLaunches(data.records);
 const tree=timelineTree(items),dated=items.filter(x=>x.date),first=Math.min(...dated.map(x=>new Date(x.date.start).getUTCFullYear())),last=Math.max(...dated.map(x=>new Date(x.date.end).getUTCFullYear()));
 for(let y=first;y<=last;y++)for(const id of ['from','to']){const option=el('option','',y);option.value=y;$(id).append(option);}
 $('from').value=first;$('to').value=last;fillActors($('actor'),data);splitter('aion-timeline-width',360);let selected='';
 const annotation=await annotationController(data),selectionHistory=[];
 function rememberView(){const entry=selectionHistory.at(-1);if(entry){entry.scroll=$('details').scrollTop;entry.version=$('details').querySelector('.composition-version-select')?.selectedOptions[0]?.dataset.versionNumber;}}
 function choose(id,back=false){
  const r=data.index.get(id);if(!r)return;if(!back)rememberView();
  if(!back&&selectionHistory.at(-1)?.id!==id)selectionHistory.push({id,scroll:0});
  const view=selectionHistory.at(-1)||{};selected=id;history.replaceState(null,'','#'+encodeURIComponent(id));
  compactDetails(r,data,next=>choose(next),{versionNumber:view.version});annotation.render(r);$('details').scrollTop=view.scroll||0;
  $('timeline-back').disabled=selectionHistory.length<2;
  for(const node of document.querySelectorAll('.timeline-card')){const active=node.dataset.recordId===id||node.dataset.executionId===id;node.dataset.selected=String(active);node.querySelector(':scope > .timeline-heading')?.setAttribute('aria-pressed',String(active));}
 }
 $('timeline-back').onclick=()=>{if(selectionHistory.length<2)return;selectionHistory.pop();while(selectionHistory.length&&!data.index.has(selectionHistory.at(-1).id))selectionHistory.pop();if(selectionHistory.length)choose(selectionHistory.at(-1).id,true);};

 function card(n){
  const box=el('article','timeline-card '+(n.type==='event'?'event-box':'duration-box'));box.dataset.recordId=n.record.id;box.dataset.type=n.type;box.dataset.context=String(n.context||false);box.dataset.parentId=n.parent||'';box.dataset.productLaunch=String(n.type==='event'&&launchedProducts.has(n.record.id));
  const execution=n.members.find(x=>x.type==='process'&&x.record.id!==n.id),primary=execution?.record||n.record;
  if(execution)box.dataset.executionId=execution.record.id;
  if(n.date?.span)box.dataset.spanId=n.id;
  const heading=el('button','timeline-heading');heading.type='button';heading.append(el('strong','',titleOf(primary)));heading.title=titleOf(primary);heading.onclick=()=>choose(primary.id);heading.setAttribute('aria-label',titleOf(primary));
  const meta=el('div','timeline-meta');
  if(execution){const p=el('button','timeline-kind','Process');p.type='button';p.onclick=()=>choose(execution.record.id);p.title=titleOf(execution.record);meta.append(p);}
  else meta.append(el('span','',human(n.type)));
  if(n.boundary)box.dataset.boundary=n.boundary;
  const states=n.members.map(x=>x.record.status),status=states.every(s=>s==='authorized')?'Authorized':states.every(s=>s!=='authorized')?'Pending authorization':'Mixed authorization';
  const state=el('span','timeline-state',status);state.title=n.members.map(x=>human(x.type)+': '+(x.record.status==='authorized'?'Authorized':'Pending authorization')).join(' · ');meta.append(state);
  const owner=n.members.find(x=>['event','process'].includes(x.type)),agreementId=owner?.record.agreement_id||owner?.record.agreement_ids?.[0];
  if(agreementId&&data.index.has(agreementId)){const agreement=el('button','timeline-agreement','Agreement');agreement.type='button';agreement.title=titleOf(data.index.get(agreementId));agreement.onclick=()=>choose(agreementId);meta.append(agreement);}
  if(n.type==='campaign'&&execution){const campaign=el('button','timeline-campaign','Campaign');campaign.type='button';campaign.title=titleOf(n.record);campaign.onclick=()=>choose(n.record.id);meta.append(campaign);}
  if(n.boundary)meta.append(el('span','timeline-role',human(n.boundary)));
  if(n.clippedStart)meta.append(el('span','timeline-role','Continued'));
  const dates=n.date?n.date.startLabel+(n.date.span?' – '+n.date.endLabel:''):'Unknown dates';
  meta.title=(n.context?'Filter context · ':'')+dates;
  box.setAttribute('aria-label',titleOf(primary)+' · '+dates+(n.parent?' · Part of '+titleOf(tree.nodes.get(n.parent).record):''));
  box.append(heading,meta);return box;
 }
 function dateLabel(value){
  if(!value)return '';
  const date=new Date(value+(value.length===4?'-01-01':value.length===7?'-01':'')+'T00:00:00Z');
  return value.slice(0,4)+(value.length>4?'\n'+date.toLocaleDateString('en-GB',{month:'short',...(value.length>7?{day:'2-digit'}:{}),timeZone:'UTC'}):'');
 }
 function placeGroup(group,layout,host){
  const wrap=el('section','timeline-group');wrap.dataset.groupId=group.id;wrap.dataset.lane=group.laneId;wrap.setAttribute('aria-label',titleOf(group.record));
  Object.assign(wrap.style,{left:group.left+104+'px',top:group.groupTop+'px',width:group.width+'px',height:group.groupBottom-group.groupTop+'px'});
  host.append(wrap);
  const panel=el('div','timeline-track-panel');panel.style.width=group.gutter+'px';if(group.trackCount)wrap.append(panel);
  const localDates=new Map();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('timeline-connectors');svg.setAttribute('aria-hidden','true');wrap.append(svg);
  function marker(x,y,role,label,recordId,extra=''){
   const dot=el('span','track-marker '+role+' '+extra);dot.style.left=x+'px';dot.style.top=y-group.groupTop+'px';dot.title=label;dot.setAttribute('role','img');dot.setAttribute('aria-label',label);dot.dataset.recordId=recordId;dot.dataset.role=role;panel.append(dot);
  }
  function remember(time,label){if(label){if(!localDates.has(time))localDates.set(time,new Set());localDates.get(time).add(label);}}
  for(const n of group.entries){
   if(n.date.span){
    const x=56+n.track*layout.trackGap,rail=el('div','duration-track');rail.dataset.trackId=n.id;rail.dataset.recordId=n.record.id;rail.dataset.type=n.type;
    Object.assign(rail.style,{left:x-2+'px',top:n.anchor-group.groupTop+'px',height:Math.max(0,n.endAnchor-n.anchor)+'px'});panel.append(rail);
    const zero=n.begin===n.finish?'zero-duration':'';
    marker(x,n.anchor,n.clippedStart?'continued-start':'start',(n.clippedStart?'Continues from before range: ':'Start: ')+n.date.startLabel,n.record.id,zero);
    marker(x,n.endAnchor,n.clippedEnd?'continued-end':'end',(n.clippedEnd?'Continues beyond range: ':'End: ')+n.date.endLabel,n.record.id,zero);
    remember(n.finish,n.clippedEnd?String($('to').value)+'-12-31':n.date.endLabel);
   }
   remember(n.begin,n.clippedStart?String($('from').value)+'-01-01':n.boundary==='end'?n.date.endLabel||n.date.startLabel:n.date.startLabel);
   const parent=layout.nodes.get(n.parent),trackNode=n.date.span?n:parent;
   if(trackNode?.date.span){
    const x=56+trackNode.track*layout.trackGap;
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${x} ${n.anchor-group.groupTop} H ${group.gutter-5} V ${n.top+20-group.groupTop} H ${group.gutter}`);svg.append(path);
    if(!n.date.span&&n.begin!==parent.begin&&n.begin!==parent.finish)marker(x,n.anchor,'milestone',n.date.startLabel+' · '+titleOf(n.record),n.record.id,n.date.startLabel?.length<10?'imprecise':'');
    if(n.date.span&&parent&&n.begin!==parent.begin&&n.begin!==parent.finish)marker(56+parent.track*layout.trackGap,n.anchor,'milestone','Child starts: '+titleOf(n.record),n.record.id);
   }
   const node=card(n);Object.assign(node.style,{left:group.gutter+'px',top:n.top-group.groupTop+'px',width:n.cardWidth+'px',height:n.bottom-n.top+'px'});node.dataset.anchor=String(n.anchor);wrap.append(node);
  }
  if(group.trackCount)for(const [time,values] of localDates){
   const date=el('div','track-date',[...values].map(dateLabel).join(' / '));
   // Clipped bounds have no ordinary tick, but still use the shared anchor.
   const at=group.entries.find(n=>n.begin===time||n.finish===time);date.style.top=(at.begin===time?at.anchor:at.endAnchor)-group.groupTop+'px';date.title=[...values].join(' / ');panel.append(date);
  }
 }
 function render(){
  if(+$('from').value>+$('to').value)$('to').value=$('from').value;const lo=+$('from').value,hi=+$('to').value,start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1,q=$('search').value.trim().toLowerCase();
  const matches=i=>(!$('type').value||i.type===$('type').value)&&(!$('status').value||i.record.status===$('status').value)&&(!$('actor').value||i.actors.has($('actor').value))&&(!q||i.search.includes(q))&&(!i.date||i.date.end>=start&&i.date.start<=end);
  const matching=items.filter(matches),direct=new Set(matching.flatMap(i=>tree.occurrences.get(i.record.id)||[])),included=new Set(direct);
  for(const id of direct){let p=tree.nodes.get(id).parent;while(p){included.add(p);p=tree.nodes.get(p).parent;}}
  // Campaign/process filters retain their contents as context, without counting them as matches.
  function descendants(id){for(const child of tree.nodes.get(id).children){included.add(child);descendants(child);}}
  for(const id of direct)if(tree.nodes.get(id).date?.span)descendants(id);
  const nodes=new Map([...tree.nodes].filter(([id])=>included.has(id)).map(([id,n])=>[id,{...n,context:!direct.has(id)}]));
  const layout=arrangeSwimlanes(layoutTimeline(nodes,lo,hi),collapsedLanes,[...nodes.values()].some(n=>laneFor(n.category).id==='uncategorised'));$('timeline').replaceChildren();$('undated').replaceChildren();
  const controls=$('lane-controls');controls.replaceChildren();
  for(const lane of layout.lanes){const button=el('button','lane-toggle',(lane.hidden?'＋ ':'− ')+lane.label);button.type='button';button.dataset.lane=lane.id;button.style.backgroundColor=lane.color;button.setAttribute('aria-expanded',String(!lane.hidden));button.setAttribute('aria-controls','timeline undated');button.title=(lane.hidden?'Expand ':'Collapse ')+lane.label;button.onclick=()=>{if(lane.hidden)collapsedLanes.delete(lane.id);else collapsedLanes.add(lane.id);render();controls.querySelector('[data-lane="'+lane.id+'"]')?.focus();};controls.append(button);}
  stats($('stats'),['event','process','campaign'].map(t=>[matching.filter(i=>i.type===t).length,t==='process'?'processes':t+'s']));
  $('result-count').textContent=`${matching.length} of ${items.length} records match · ${lo}–${hi} · shared calendar · ${layout.lanes.filter(l=>!l.hidden).length} lanes shown`;
  const root=$('timeline');root.style.width=layout.width+'px';root.style.height=layout.height+'px';
  for(const lane of layout.lanes.filter(l=>!l.hidden)){const band=el('section','timeline-lane');band.dataset.lane=lane.id;band.setAttribute('aria-label',lane.label);Object.assign(band.style,{left:lane.left+104+'px',width:lane.width+'px',height:layout.height+'px',backgroundColor:lane.color});band.append(el('h2','timeline-lane-title',lane.label));root.append(band);}
  if(layout.roots.length){for(const year of layout.years){const section=el('section','year-section');section.dataset.year=year.year;section.style.top=year.top+'px';section.style.height=year.height+'px';section.append(el('div','year-line'));root.append(section);}
   for(const n of layout.roots)placeGroup(n,layout,root);
   const axis=el('div','date-axis');axis.setAttribute('aria-label','Timeline dates and years');
   for(const year of layout.years){const label=el('h2','axis-year',year.year);label.style.top=year.top+'px';axis.append(label);}
   const spine=el('div','date-spine');spine.style.top=layout.years[0].top+'px';spine.style.height=(layout.height-layout.years[0].top-30)+'px';axis.append(spine);
   for(const tick of layout.ticks){const row=el('div','date-tick');row.style.top=tick.top+'px';row.dataset.date=new Date(tick.time).toISOString().slice(0,10);row.title=tick.labels.join(' / ');const labels=tick.labels.map(value=>{if(value.length===4)return layout.years.some(year=>String(year.year)===value&&year.top===tick.top)?'':value;const date=new Date(value+(value.length===7?'-01':'')+'T00:00:00Z');return date.toLocaleDateString('en-GB',{month:'short',...(value.length>7?{day:'2-digit'}:{}),timeZone:'UTC'});});row.append(el('span','date-tick-label',[...new Set(labels.filter(Boolean))].join(' / ')),el('span','date-dot'));axis.append(row);}
   root.append(axis);
  }else{const empty=el('div','empty-state');empty.append(el('h2','',layout.lanes.some(l=>l.hidden&&l.groups.length)?'Matching lanes are collapsed':'No dated records match'),el('p','','Expand a lane or adjust the filters to explore more of the story.'));root.append(empty);}
  const undated=[...nodes.values()].filter(n=>!n.date&&!collapsedLanes.has(laneFor(n.category).id));$('undated').hidden=!undated.length;
  if(undated.length){$('undated').append(el('h2','','Undated / relative timing'),el('p','','Unknown boundaries are not invented. Linked undated work is listed here until dates are supplied.'));for(const n of undated){const node=card(n);node.dataset.lane=laneFor(n.category).id;if(n.parent)node.title='Belongs to '+titleOf(tree.nodes.get(n.parent).record);$('undated').append(node);}}
  if(!selected&&matching.length)selected=matching[0].record.id;if(selected)choose(selected);else compactDetails(null,data,choose);
 }
 $('filters').onsubmit=e=>e.preventDefault();for(const id of ['type','status','actor','from','to'])$(id).onchange=render;$('search').oninput=debounce(render);$('filters').onreset=()=>setTimeout(()=>{$('from').value=first;$('to').value=last;render();},0);
 const toggle=$('timeline-fullscreen');
 function fullScreen(on){document.body.classList.toggle('timeline-fullscreen',on);toggle.setAttribute('aria-pressed',String(on));toggle.textContent=on?'Exit full screen':'Full screen';}
 toggle.onclick=()=>fullScreen(!document.body.classList.contains('timeline-fullscreen'));
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('timeline-fullscreen')){fullScreen(false);toggle.focus();}});
 const hash=decodeURIComponent(location.hash.slice(1));if(data.index.has(hash))selected=hash;render();window.addEventListener('hashchange',()=>choose(decodeURIComponent(location.hash.slice(1))));document.body.dataset.ready='true';
}catch(error){showError(error.message);}
