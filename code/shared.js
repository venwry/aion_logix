import {remoteState} from './api-client.js';
import {digest} from './review-log.js';
export const datasets = ['actor','assumption','event','agreement','clause','campaign','process','programme','actor_relationship','location','narrative_period'];
export const $ = id => document.getElementById(id);
export const human = value => String(value).replaceAll('_',' ').replace(/\b\w/g, c=>c.toUpperCase());
export const typeOf = record => record.id.split('.')[0];
export const titleOf = record => record.title || record.name || record.statement?.split('\n')[0] || record.description?.split('\n')[0] || record.id;
export function el(tag, className='', text) { const node=document.createElement(tag); if(className)node.className=className; if(text!==undefined)node.textContent=text; return node; }
export function statusBadge(status) {return el('span','badge '+(status==='authorized'?'confirmed':'pending'),status==='authorized'?'Authorized':'Unauthorized');}
export async function loadData() {
  const remote=await remoteState();let rawCollections,authorization;
  if(remote){rawCollections=remote.collections;authorization=remote.authorization;}
  else{
    const results=await Promise.all(datasets.map(async name=>{const response=await fetch('../data_foundation/'+name+'.json',{cache:'no-store'});if(!response.ok)throw Error(`Could not load ${name}.json (HTTP ${response.status}).`);const d=await response.json();return [name,d[name]];}));rawCollections=Object.fromEntries(results);
    const response=await fetch('../data_storytelling/authorization.json',{cache:'no-store'});if(!response.ok)throw Error('Could not load authorization information.');authorization=(await response.json()).authorization;
  }
  const authorizations=new Map(authorization.map(a=>[a.record_id,a]));const collections={};const originals=new Map();
  for(const [name,rows] of Object.entries(rawCollections))collections[name]=await Promise.all(rows.map(async record=>{originals.set(record.id,record);const a=authorizations.get(record.id),fingerprint=await digest(record);return {...record,status:a?.state==='authorized'&&a.content_sha256===fingerprint?'authorized':'unauthorized'};}));
  const records=Object.values(collections).flat(),index=new Map(records.map(r=>[r.id,r]));return {collections,records,index,originals,remote};
}
export function bounds(point) {
  if(!point?.value)return null;
  const [year,month,day]=point.value.split('-').map(Number);const start=Date.UTC(year,(month||1)-1,day||1);
  const end=day?Date.UTC(year,month-1,day+1)-1:month?Date.UTC(year,month,1)-1:Date.UTC(year+1,0,1)-1;
  return {start,end,startLabel:point.value,endLabel:point.value};
}
export function timing(record,index) {
  if(record.time)return {...bounds(record.time),span:false,derived:false,label:record.time.value,precision:record.time.precision};
  const period=record.period||record.valid_time;
  if(period){const first=bounds(period.start),last=bounds(period.end);return {start:first.start,end:last.end,startLabel:period.start.value,endLabel:period.end.value,span:true,derived:false,label:period.start.value+' – '+period.end.value};}
  if(typeOf(record)==='campaign') {
    const ids=[record.launch_event_id,...(record.activity||[]).flatMap(a=>[a.event_id,a.process_id])].filter(Boolean);
    const dates=[...new Set(ids)].map(id=>index.get(id)).filter(Boolean).filter(r=>['event','process'].includes(typeOf(r))).map(r=>timing(r,index)).filter(Boolean);
    if(!dates.length)return null;
    const first=dates.reduce((a,b)=>a.start<=b.start?a:b),last=dates.reduce((a,b)=>a.end>=b.end?a:b);
    return {start:first.start,end:last.end,startLabel:first.startLabel,endLabel:last.endLabel,span:true,derived:true,label:first.startLabel===last.endLabel?first.startLabel:first.startLabel+' – '+last.endLabel};
  }
  return null;
}
function references(value,index,result=new Set()) {
  if(typeof value==='string'&&index.has(value))result.add(value);
  else if(Array.isArray(value))value.forEach(v=>references(v,index,result));
  else if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))if(!['id','source_refs','confirmation'].includes(key))references(v,index,result);
  return result;
}
export function actorSet(record,index) {
  const refs=references(record,index);const actors=new Set([...refs].filter(id=>id.startsWith('actor.')));
  if(typeOf(record)==='actor')actors.add(record.id);
  if(typeOf(record)==='campaign')for(const id of refs){const target=index.get(id);if(['event','process'].includes(typeOf(target)))for(const aid of references(target,index))if(aid.startsWith('actor.'))actors.add(aid);}
  return actors;
}
export function fillActors(select,data){for(const actor of [...data.collections.actor].sort((a,b)=>a.name.localeCompare(b.name))){const option=el('option','',actor.name);option.value=actor.id;select.append(option);}}
export function stats(target,values){target.replaceChildren();for(const [count,label] of values){const box=el('div','stat');box.append(el('strong','',count.toLocaleString()),el('span','',label));target.append(box);}}
export function showError(message){const box=el('div','error');box.setAttribute('role','alert');box.append(el('strong','','Unable to open the data'),el('p','',message),el('p','','Serve the repository root over HTTP so the application can read its sibling data directory.'));const retry=el('button','quiet-button','Try again');retry.onclick=()=>location.reload();box.append(retry);$('workspace').replaceChildren(box);$('workspace').style.display='block';if($('result-count'))$('result-count').textContent='Data unavailable';}
export function details(record,data,select){
  const host=$('details');host.replaceChildren();host.scrollTop=0;
  if(!record){const empty=el('div','empty-state');empty.append(el('span','empty-mark','↗'),el('h2','','Select a record'),el('p','','Choose an item to read its details and follow its connections.'));host.append(empty);return;}
  const top=el('div','record-topline');top.append(el('span','type-tag',human(typeOf(record))),statusBadge(record.status));
  host.append(top,el('h2','',titleOf(record)),el('p','record-id',record.id));
  const date=timing(record,data.index);if(date){host.append(el('p','record-date',date.label));if(date.derived)host.append(el('p','detail-caption','Display range inferred from linked activities, not an independently confirmed campaign duration.'));}
  if(record.description||record.statement||record.objective)host.append(el('p','description',record.description||record.statement||record.objective));
  const links=el('div','detail-links');const raw=el('a','','Open dataset ↗');raw.href='../data_foundation/'+typeOf(record)+'.json';raw.target='_blank';raw.rel='noopener';links.append(raw);
  const counterpart=el('a','','Open in '+(document.body.dataset.page==='timeline'?'data browser':'timeline')+' →');
  if(document.body.dataset.page==='timeline'||['event','campaign','process'].includes(typeOf(record))){counterpart.href=(document.body.dataset.page==='timeline'?'browser.html':'timeline.html')+'#'+encodeURIComponent(record.id);links.append(counterpart);}host.append(links);
  function valueNode(value,depth=0){
    if(value===null)return el('span','','Unspecified');
    if(typeof value==='string'){
      if(data.index.has(value)){const button=el('button','ref-link',titleOf(data.index.get(value)));button.title=value;button.onclick=()=>select(value);return button;}
      if(/^https?:\/\/\S+$/.test(value)){const link=el('a','',value);link.href=value;link.target='_blank';link.rel='noopener noreferrer';return link;}
      return el('span','',value);
    }
    if(typeof value!=='object')return el('span','',String(value));
    if(Array.isArray(value)){
      if(!value.length)return el('span','detail-caption','None recorded');
      const wrapper=el('div');const list=el('ol','value-list');wrapper.append(list);let offset=0;
      const more=el('button','quiet-button','Show more');const append=()=>{value.slice(offset,offset+30).forEach(item=>{const li=el('li');li.append(valueNode(item,depth+1));list.append(li);});offset+=30;more.hidden=offset>=value.length;more.textContent='Show more ('+Math.max(0,value.length-offset)+' remaining)';};more.onclick=append;wrapper.append(more);append();return wrapper;
    }
    const dl=el('dl',depth?'field-list nested-object':'field-list');for(const [key,v] of Object.entries(value)){const row=el('div');const dd=el('dd');dd.append(valueNode(v,depth+1));row.append(el('dt','',human(key)),dd);dl.append(row);}return dl;
  }
  const skip=new Set(['id','status','name','title','description','statement','objective']);
  for(const [key,value] of Object.entries(record)){
    if(skip.has(key))continue;
    const group=el('details','detail-group');group.append(el('summary','',human(key)+(Array.isArray(value)?' · '+value.length:'')));
    let built=false;const build=()=>{if(built)return;built=true;const content=el('div');content.append(valueNode(value));
      if(key==='source_refs')for(const ref of value){const source=data.index.get(ref.source_id);if(source?.kind==='repository_snapshot'&&source.url?.startsWith('https://github.com/')&&source.commit&&ref.path){const a=el('a','source-note','View source: '+ref.path+(ref.pointer||''));a.href=source.url.replace(/\/$/,'')+'/blob/'+source.commit+'/'+ref.path.split('/').map(encodeURIComponent).join('/');a.target='_blank';a.rel='noopener noreferrer';const p=el('p');p.append(a);content.append(p);}}
      group.append(content);};group.addEventListener('toggle',()=>{if(group.open)build();});
    group.open=true;build();host.append(group);
  }
  const incoming=data.records.filter(r=>r.id!==record.id&&typeOf(r)!=='migration_map'&&references(r,data.index).has(record.id));
  if(incoming.length){const group=el('details','detail-group');group.append(el('summary','','Referenced by · '+incoming.length));let built=false;group.open=true;built=true;group.append(valueNode(incoming.map(r=>r.id)));host.append(group);}

}
export function splitter(key,initial){
  const root=$('workspace'),bar=root.querySelector('.splitter');let width=initial,drag=false;
  try{width=Number(localStorage.getItem(key))||initial;}catch{}
  function apply(value){const max=Math.max(240,root.clientWidth-300);width=Math.round(Math.max(240,Math.min(max,value)));root.style.setProperty('--first-pane',width+'px');bar.setAttribute('aria-valuemin','240');bar.setAttribute('aria-valuemax',String(max));bar.setAttribute('aria-valuenow',String(width));}
  function save(){try{localStorage.setItem(key,String(width));}catch{}}
  apply(width);bar.onpointerdown=event=>{drag=true;bar.setPointerCapture(event.pointerId);document.body.classList.add('resizing');};
  bar.onpointermove=event=>{if(drag)apply(event.clientX-root.getBoundingClientRect().left);};
  const stop=()=>{drag=false;document.body.classList.remove('resizing');save();};bar.onpointerup=stop;bar.onpointercancel=stop;
  bar.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();apply(event.key==='Home'?240:event.key==='End'?root.clientWidth-300:width+(event.key==='ArrowRight'?24:-24));save();};
  window.addEventListener('resize',()=>{if(innerWidth>760)apply(width);});
}
export function debounce(fn,delay=150){let timer;return (...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),delay);};}
