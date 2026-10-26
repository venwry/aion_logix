import {$,el,human,typeOf,titleOf,loadData,timing,actorSet,fillActors,stats,details,splitter,showError,debounce,statusBadge} from './shared.js';
try {
 const data=await loadData(); const items=data.records.filter(r=>['event','process','campaign'].includes(typeOf(r))).map(record=>({record,type:typeOf(record),date:timing(record,data.index),actors:actorSet(record,data.index),search:JSON.stringify(record).toLowerCase()}));
 const dated=items.filter(i=>i.date);const first=Math.min(...dated.map(i=>new Date(i.date.start).getUTCFullYear())),last=Math.max(...dated.map(i=>new Date(i.date.end).getUTCFullYear()));
 for(let year=first;year<=last;year++)for(const id of ['from','to']){const option=el('option','',year);option.value=year;$(id).append(option);}
 $('from').value=first;$('to').value=last;fillActors($('actor'),data);splitter('aion-timeline-width',360);
 let selected='',visible=[],yearNodes=[],frame=0;
 function choose(id){const record=data.index.get(id);if(!record)return;if(!['event','process','campaign'].includes(typeOf(record))){location.href='browser.html#'+encodeURIComponent(id);return;}selected=id;history.replaceState(null,'','#'+encodeURIComponent(id));details(record,data,choose);document.querySelectorAll('[data-record-id]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset.recordId===id)));draw();}
 function card(item,continuation=false){const r=item.record,button=el('button','timeline-card');button.dataset.recordId=r.id;button.dataset.type=item.type;button.setAttribute('aria-pressed',String(selected===r.id));button.title=titleOf(r);button.onclick=()=>choose(r.id);
 const date=el('span','card-date',item.date?(continuation?'From '+item.date.startLabel:item.date.startLabel):'Undated');const body=el('span','card-body');body.append(el('strong','',titleOf(r)));const meta=el('span','card-meta');meta.append(el('span','type-tag',human(item.type)),statusBadge(r.status));if(item.date?.span)meta.append(el('span','card-date','→ '+item.date.endLabel+(item.date.derived?' · linked activity range':'')));body.append(meta);button.append(date,body);return button;}
 function render(){
  if(Number($('from').value)>Number($('to').value))$('to').value=$('from').value;
  const lo=Number($('from').value),hi=Number($('to').value),start=Date.UTC(lo,0,1),end=Date.UTC(hi+1,0,1)-1,q=$('search').value.trim().toLowerCase();
  visible=items.filter(i=>(!$('type').value||i.type===$('type').value)&&(!$('status').value||i.record.status===$('status').value)&&(!$('actor').value||i.actors.has($('actor').value))&&(!q||i.search.includes(q))&&(!i.date||(i.date.end>=start&&i.date.start<=end)));
  const undated=visible.filter(i=>!i.date),dated=visible.filter(i=>i.date);
  stats($('stats'),['event','process','campaign'].map(type=>[visible.filter(i=>i.type===type).length,type==='process'?'processes':type+'s']));
  $('result-count').textContent=`${visible.length} of ${items.length} records · ${lo}–${hi}`+(undated.length?` · ${undated.length} undated shown separately`:'');
  $('timeline').replaceChildren();$('undated').replaceChildren();$('undated').hidden=!undated.length;yearNodes=[];
  if(dated.length)for(let year=lo;year<=hi;year++){
   const section=el('section','year-section');section.dataset.year=year;
   const starts=dated.filter(i=>Math.max(lo,new Date(i.date.start).getUTCFullYear())===year).sort((a,b)=>a.date.start-b.date.start||titleOf(a.record).localeCompare(titleOf(b.record)));
   const ongoing=dated.filter(i=>i.date.span&&i.date.start<Date.UTC(year,0,1)&&i.date.end>=Date.UTC(year,0,1));
   const heading=el('div','year-heading');heading.append(el('h2','',year),el('span','year-count',`${starts.length} entries${ongoing.length?' · '+ongoing.length+' ongoing':''}`));section.append(el('div','year-line'),heading);
   const anchors=[];for(const item of starts){const node=card(item,item.date.start<start);section.append(node);anchors.push({item,node});}
   if(ongoing.length){const group=el('details','year-ongoing');group.append(el('summary','',`${ongoing.length} ongoing processes / campaign or event spans`));for(const item of ongoing){const button=el('button','ongoing-button',titleOf(item.record));button.dataset.recordId=item.record.id;button.setAttribute('aria-pressed',String(selected===item.record.id));button.onclick=()=>choose(item.record.id);group.append(button);}section.append(group);}
   $('timeline').append(section);yearNodes.push({year,section,anchors});
  }
  else{const empty=el('div','empty-state');empty.append(el('h2','','No dated records match'),el('p','','Adjust the filters to explore more of the story.'));$('timeline').append(empty);}
  if(undated.length){$('undated').append(el('h2','','Undated / relative timing'),el('p','','These records have no explicit period. They are not placed at an invented date.'));for(const item of undated)$('undated').append(card(item));}
  if(selected&&!visible.some(i=>i.record.id===selected)){selected='';history.replaceState(null,'',location.pathname+location.search);details(null,data,choose);}
  if(!selected&&visible.length)choose((dated[0]||undated[0]).record.id);
  if(!visible.length)details(null,data,choose);
  schedule();
 }
 function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}
 function draw(){
  $('timeline').querySelector('svg')?.remove();if(!yearNodes.length)return;
  const root=$('timeline'),rect=root.getBoundingClientRect(),height=root.scrollHeight,ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');svg.classList.add('timeline-overlay');svg.setAttribute('viewBox',`0 0 ${root.clientWidth} ${height}`);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
  const line=(y1,y2,cls)=>{const node=document.createElementNS(ns,'line');node.setAttribute('x1',innerWidth<=760?'9':'22');node.setAttribute('x2',innerWidth<=760?'9':'22');node.setAttribute('y1',y1);node.setAttribute('y2',y2);node.setAttribute('class',cls);return node;};
  const knots=[];
  for(const {year,section,anchors} of yearNodes){const y=section.getBoundingClientRect().top-rect.top+41;knots.push([Date.UTC(year,0,1),y]);const seen=new Set();for(const {item,node} of anchors){const date=item.date.start;if(date<=Date.UTC(year,0,1)||new Date(date).getUTCFullYear()!==year||seen.has(date))continue;seen.add(date);knots.push([date,node.getBoundingClientRect().top-rect.top+26]);}}
  knots.push([Date.UTC(yearNodes.at(-1).year+1,0,1),height-15]);knots.sort((a,b)=>a[0]-b[0]);
  function yAt(date){if(date<=knots[0][0])return knots[0][1];for(let i=1;i<knots.length;i++)if(date<=knots[i][0]){const [a,ya]=knots[i-1],[b,yb]=knots[i];return ya+(date-a)/(b-a)*(yb-ya);}return knots.at(-1)[1];}
  const spine=line(knots[0][1],height-15,'spine');spine.setAttribute('stroke','#dce5d5');spine.setAttribute('stroke-width','1');svg.append(spine);
  const spans=visible.filter(i=>i.date?.span).sort((a,b)=>Number(a.record.id===selected)-Number(b.record.id===selected));
  for(const item of spans){const node=line(yAt(item.date.start),Math.max(yAt(item.date.start)+8,yAt(item.date.end)),`span-bar ${item.type}${selected===item.record.id?' selected':''}`);node.dataset.spanId=item.record.id;svg.append(node);}
  root.prepend(svg);
 }
 const onChange=()=>render();$('filters').onsubmit=e=>e.preventDefault();for(const id of ['type','status','actor','from','to'])$(id).onchange=onChange;$('search').oninput=debounce(onChange);
 $('filters').onreset=()=>{setTimeout(()=>{$('from').value=first;$('to').value=last;render();},0);};
 new ResizeObserver(schedule).observe($('timeline'));window.addEventListener('resize',schedule);$('timeline').addEventListener('toggle',schedule,true);
 const hash=decodeURIComponent(location.hash.slice(1));render();if(data.index.has(hash))choose(hash);window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(data.index.has(id))choose(id);});
 document.body.dataset.ready='true';
}catch(error){showError(error.message);}
