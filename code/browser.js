import {digest} from './review-log.js';
import {saveAuthorization} from './api-client.js';
import {compactDetails as details} from './compact-details.js';
import {$,el,human,typeOf,titleOf,loadData,timing,actorSet,fillActors,stats,splitter,showError,debounce,statusBadge,datasets} from './shared.js';
try {
 const data=await loadData();const PAGE_SIZE=75;const items=data.records.map(record=>{const date=timing(record,data.index);return {record,id:record.id,title:titleOf(record),type:typeOf(record),kind:record.kind||'',get status(){return record.status;},date:date?.startLabel||'',actors:actorSet(record,data.index),search:JSON.stringify(record).toLowerCase()};});
 for(const name of datasets){const option=el('option','',human(name)+' · '+data.collections[name].length);option.value=name;$('dataset').append(option);}fillActors($('actor'),data);stats($('stats'),[[items.length,'records'],[datasets.length,'datasets']]);splitter('aion-browser-width',Math.round($('workspace').clientWidth*.58));
 const pending=new Set();let saving=false;
 function updateSave(){ $('authorize-selected').disabled=saving||!pending.size;$('authorize-selected').textContent=pending.size?'Authorize and save ('+pending.size+')':'Authorize and save';}
 let key='title',direction=1,page=0,selected='',filtered=[];
 const collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 function kinds(){const previous=$('kind').value;$('kind').replaceChildren(el('option','','All kinds'));$('kind').firstChild.value='';const values=[...new Set(items.filter(i=>!$('dataset').value||i.type===$('dataset').value).map(i=>i.kind).filter(Boolean))].sort();for(const kind of values){const option=el('option','',human(kind));option.value=kind;$('kind').append(option);}if(values.includes(previous))$('kind').value=previous;}
 function matching(){const q=$('search').value.trim().toLowerCase();return items.filter(i=>(!$('dataset').value||i.type===$('dataset').value)&&(!$('kind').value||i.kind===$('kind').value)&&(!$('status').value||i.status===$('status').value)&&(!$('actor').value||i.actors.has($('actor').value))&&(!q||i.search.includes(q))).sort((a,b)=>{if(key==='date'&&(!a.date||!b.date)){if(!a.date&&!b.date)return a.id.localeCompare(b.id);return a.date?-1:1;}return direction*collator.compare(a[key],b[key])||collator.compare(a.id,b.id);});}
 function choose(id,follow=false){if(!data.index.has(id))return;selected=id;history.replaceState(null,'','#'+encodeURIComponent(id));if(follow){$('dataset').value=typeOf(data.index.get(id));$('kind').value='';$('status').value='';$('actor').value='';$('search').value='';kinds();filtered=matching();page=Math.floor(filtered.findIndex(i=>i.id===id)/PAGE_SIZE);render(false);}details(data.index.get(id),data,target=>choose(target,true));document.querySelectorAll('#rows tr').forEach(row=>row.setAttribute('aria-selected',String(row.dataset.recordId===id)));}
 function render(auto=true){filtered=matching();const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));page=Math.min(Math.max(0,page),totalPages-1);$('rows').replaceChildren();
 for(const item of filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)){const row=el('tr');row.tabIndex=0;row.dataset.recordId=item.id;row.setAttribute('aria-selected',String(selected===item.id));row.onclick=()=>choose(item.id);row.onkeydown=event=>{if(event.target!==row)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(item.id);}if(event.key==='ArrowDown'){event.preventDefault();row.nextElementSibling?.focus();}if(event.key==='ArrowUp'){event.preventDefault();row.previousElementSibling?.focus();}};
 const name=el('td');name.append(el('strong','',item.title.length>110?item.title.slice(0,107)+'…':item.title),el('small','',item.id));const status=el('td');if(item.status==='authorized')status.append(statusBadge(item.status));else{const label=el('label','row-authorization');const check=el('input');check.type='checkbox';check.checked=pending.has(item.id);check.disabled=saving;check.setAttribute('aria-label','Authorize '+item.id);label.append(document.createTextNode('Pending authorization '),check);label.onclick=e=>e.stopPropagation();check.onchange=()=>{if(check.checked)pending.add(item.id);else pending.delete(item.id);updateSave();};status.append(label);}row.append(name,el('td','',human(item.type)),status,el('td','',item.date||'—'));$('rows').append(row);}
 $('result-count').textContent=`${filtered.length.toLocaleString()} matching records · ${items.length.toLocaleString()} total`;$('no-results').hidden=!!filtered.length;$('page-number').textContent=`Page ${page+1} of ${totalPages}`;$('previous').disabled=page===0;$('next').disabled=page>=totalPages-1;
 for(const button of document.querySelectorAll('[data-sort]')){const active=button.dataset.sort===key;button.parentElement.setAttribute('aria-sort',active?(direction===1?'ascending':'descending'):'none');button.querySelector('span').textContent=active?(direction===1?'↑':'↓'):'↕';}
 if(auto&&!filtered.some(i=>i.id===selected)){if(filtered.length)choose(filtered[page*PAGE_SIZE].id);else{selected='';history.replaceState(null,'',location.pathname+location.search);details(null,data,id=>choose(id,true));}}
 }
 $('authorize-selected').onclick=async()=>{
  if(saving||!pending.size)return;
  const ids=[...pending];saving=true;updateSave();render(false);$('authorization-message').textContent='Saving '+ids.length+' records to GitHub…';
  try{
   const records=await Promise.all(ids.map(async id=>({record_id:id,content_sha256:await digest(data.originals.get(id))})));
   const state=await saveAuthorization({action:'authorize_records',records});
   const authorizations=new Map(state.authorization.map(a=>[a.record_id,a]));
   for(const item of items){const a=authorizations.get(item.id);item.record.status=a?.state==='authorized'&&a.content_sha256===await digest(data.originals.get(item.id))?'authorized':'unauthorized';}
   for(const id of ids)pending.delete(id);
   $('authorization-message').textContent='Saved '+ids.length+' records · GitHub commit '+state.revision.slice(0,7);
  }catch(error){$('authorization-message').textContent=error.message;}
  finally{saving=false;updateSave();render();if(selected)details(data.index.get(selected),data,id=>choose(id,true));}
 };
 $('filters').onsubmit=e=>e.preventDefault();const change=()=>{page=0;render();};$('dataset').onchange=()=>{kinds();change();};for(const id of ['kind','status','actor'])$(id).onchange=change;$('search').oninput=debounce(change);$('filters').onreset=()=>{setTimeout(()=>{kinds();change();},0);};
 for(const button of document.querySelectorAll('[data-sort]'))button.onclick=()=>{direction=key===button.dataset.sort?-direction:1;key=button.dataset.sort;page=0;render();};
 $('previous').onclick=()=>{page--;render(false);document.querySelector('.table-scroll').scrollTop=0;};$('next').onclick=()=>{page++;render(false);document.querySelector('.table-scroll').scrollTop=0;};
 const hash=decodeURIComponent(location.hash.slice(1));kinds();if(data.index.has(hash))choose(hash,true);else{$('dataset').value='actor';kinds();render();}
 window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(data.index.has(id))choose(id,true);});document.body.dataset.ready='true';
}catch(error){showError(error.message);}
