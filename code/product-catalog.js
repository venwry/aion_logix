import {specificationSegments} from './technology-specification.js';
import {el,loadData,showError,debounce} from './shared.js';
import {launchGroups,compositionTree,configurationGroups,headlineSpecs,flattenedBOM,nameOf} from './product-catalog-model.js';
const $=id=>document.getElementById(id);
try {
 const data=await loadData(),products=data.collections.product;
 let selected='',revision=null,activeTab='configuration';
 const link=id=>{const a=el('a','',nameOf(data.index.get(id))||id);a.href='browser.html#'+encodeURIComponent(id);return a;};
 const value=v=>data.index.has(v)?link(v):document.createTextNode(String(v??'Unknown'));
 const date=r=>r?.time?.value||r?.period?.start?.value||'Date not recorded';
 const boundary=b=>b?.kind==='event'?date(data.index.get(b.event_id)):b?.kind==='simulation_end'?'Simulation end':b?.date||b?.value||'Unknown';
 function component(node){
  const summary=el('li','catalog-component');
  const name=el('strong');name.append(link(node.record.id));
  summary.append(el('span','catalog-quantity',node.quantity==null?'? ×':node.quantity+' ×'),name);
  const description=node.record.description?.trim(),spec=node.record.technical_specification;
  const text=description&&description!==nameOf(node.record)?description:spec?.chapters?.[0]?.description;
  if(text){
   const prose=el('span','catalog-component-description'),parameters=(spec?.parameters||[]).map(p=>({key:p.key,value:Object.hasOwn(p,'ref_id')?p.ref_id:p.value===null?'unknown':p.value}));
   for(const part of specificationSegments(text.split(/\r?\n/)[0],parameters)){
    if(part.key){const strong=el('strong');strong.append(value(part.text));prose.append(strong);}else prose.append(document.createTextNode(part.text));
   }
   summary.append(' ',prose);
  }
  return summary;
 }
 function renderProduct(){
  const r=data.index.get(selected),host=$('catalog-content');host.replaceChildren();if(!r){host.append(el('p','','No matching products.'));return;}
  const header=el('div','catalog-product-heading'),title=el('h2','',nameOf(r)),recordLink=link(r.id);
  recordLink.className='catalog-record-link';recordLink.textContent='';recordLink.setAttribute('aria-label','Open '+nameOf(r)+' in data browser');recordLink.title='Open in data browser';
  recordLink.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 3h7v7M21 3l-11 11M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>';
  title.append(recordLink);header.append(title);if(r.description&&r.description.trim()!==nameOf(r))header.append(el('p','',r.description));host.append(header);
  const versions=[...(r.composition_history||[])].sort((a,b)=>a.version_number-b.version_number);
  if(!versions.some(v=>v.version_number===revision))revision=versions[0]?.version_number;
  if(versions.length){const label=el('label','catalog-revision','Composition revision '),select=el('select');select.id='catalog-revision';
   for(const v of versions){const option=el('option','',`Revision ${v.version_number} · ${boundary(v.effective_from)} → ${boundary(v.effective_until)}`);option.value=v.version_number;option.selected=v.version_number===revision;select.append(option);}select.onchange=()=>{revision=Number(select.value);renderProduct();};label.append(select);host.append(label);
  }
  let tree=null;
  if(versions.length||r.kind==='service')try{tree=compositionTree(data.index,r.id,revision);}catch(e){const error=el('p','error',e.message);error.setAttribute('role','alert');host.append(error);}
  if(tree){const specs=headlineSpecs(tree),stats=el('div','catalog-specs');
   if(specs.processors.length){const cpu=el('div');cpu.append(el('small','','Processor'));specs.processors.forEach(id=>cpu.append(link(id)));stats.append(cpu);}
   if(specs.hasRam){const ram=el('div');ram.append(el('small','','System RAM'),el('strong','',specs.ramKnown?`${specs.ramKiB.toLocaleString()} KiB`:`Unknown total (${specs.ramKiB.toLocaleString()} KiB known)`));ram.title=specs.memory.map(n=>`${n.quantity??'?'} × ${nameOf(n.record)}`).join('\n');stats.append(ram);}
   if(r.kind==='computer'&&!specs.hasRam)stats.append(el('p','','System RAM is not established by the recorded composition.'));host.append(stats);
  }
  const tabs=el('div','catalog-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Product view');
  const panels={};for(const [id,title] of [['configuration','Configuration contents'],['bom','Bill of materials']]){
   const button=el('button','',title);button.id='tab-'+id;button.setAttribute('role','tab');button.setAttribute('aria-controls','panel-'+id);button.setAttribute('aria-selected',String(activeTab===id));button.tabIndex=activeTab===id?0:-1;
   button.onclick=()=>{activeTab=id;for(const b of tabs.children){const on=b===button;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}for(const [key,p] of Object.entries(panels))p.hidden=key!==id;};
   button.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?tabs.firstChild:e.key==='End'?tabs.lastChild:button===tabs.firstChild?tabs.lastChild:tabs.firstChild;target.click();target.focus();}};tabs.append(button);
   const panel=el('section','catalog-panel');panel.id='panel-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.hidden=activeTab!==id;panels[id]=panel;
  }host.append(tabs,...Object.values(panels));
  if(!tree){for(const p of Object.values(panels))p.append(el('p','','No resolvable composition is recorded for this product.'));return;}
  panels.configuration.append(el('p','catalog-note','Recorded contents of this revision. Quantities are per complete product. Follow a component link to inspect its specification.'));
  for(const group of configurationGroups(tree).filter(group=>group.nodes.length)){const section=el('section','catalog-category');section.append(el('h3','',group.title));const list=el('ul','catalog-components');group.nodes.forEach(n=>list.append(component(n)));section.append(list);panels.configuration.append(section);}
  panels.bom.append(el('p','catalog-note','Indented assemblies and their contents. Quantities per parent and per complete product are shown separately; assemblies and their parts must not be added together. ? means an unknown quantity.'));
  const scroll=el('div','catalog-table-scroll'),table=el('table'),thead=el('thead'),tr=el('tr');for(const label of ['Component / assembly','Per parent','Per product','Revision']){const th=el('th','',label);th.scope='col';tr.append(th);}thead.append(tr);table.append(thead);const tbody=el('tbody');
  const rows=flattenedBOM(tree);for(const n of rows){const row=el('tr'),name=el('td');name.style.paddingLeft=(12+n.depth*18)+'px';name.append(link(n.record.id));row.append(name,el('td','',n.line.quantity??'?'),el('td','',n.quantity??'?'),el('td','',n.version?.version_number??'—'));tbody.append(row);}table.append(tbody);scroll.append(table);panels.bom.append(scroll);
  if(!rows.length)panels.bom.append(el('p','',r.kind==='service'?'This is a service; no physical bill of materials is defined.':'No component lines are recorded.'));
 }
 function choose(id){selected=id;revision=null;history.replaceState(null,'','#'+encodeURIComponent(id));renderProduct();document.querySelectorAll('[data-product-id]').forEach(b=>b.setAttribute('aria-current',b.dataset.productId===id?'true':'false'));}
 function renderList(){
  const q=$('search').value.trim().toLowerCase(),filtered=products.filter(p=>[nameOf(p),p.id,p.description,nameOf(data.index.get(p.launch_campaign_id)),nameOf(data.index.get(p.launch_event_id))].join(' ').toLowerCase().includes(q));
  $('result-count').textContent=`${filtered.length} of ${products.length} products`;$('catalog-list').replaceChildren();
  for(const campaign of launchGroups(filtered,data.index)){const section=el('section','catalog-campaign');const heading=el('h2','',nameOf(campaign.record)==='Unknown'?'No launch campaign':nameOf(campaign.record));heading.append(' ',el('small','catalog-group-date',date(campaign.record)));section.append(heading);
   for(const event of campaign.events){const group=el('section','catalog-event');const heading=el('h3','',nameOf(event.record)==='Unknown'?'No launch event':nameOf(event.record));heading.append(' ',el('small','catalog-group-date',date(event.record)));group.append(heading);
    for(const p of event.products){const button=el('button','catalog-product'),flag=el('span','catalog-kind',p.kind.replaceAll('_',' '));flag.dataset.kind=p.kind;button.append(el('span','catalog-product-name',nameOf(p)),flag);button.dataset.productId=p.id;button.setAttribute('aria-current',String(selected===p.id));button.onclick=()=>choose(p.id);group.append(button);}section.append(group);
   }$('catalog-list').append(section);
  }
  if(!filtered.some(p=>p.id===selected)){const first=launchGroups(filtered,data.index)[0]?.events[0]?.products[0];if(first)choose(first.id);else{selected='';history.replaceState(null,'',location.pathname);renderProduct();}}
 }
 const hash=decodeURIComponent(location.hash.slice(1));if(products.some(p=>p.id===hash))selected=hash;
 $('search').oninput=debounce(renderList);renderList();if(selected)renderProduct();
 window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(products.some(p=>p.id===id)){$('search').value='';selected=id;renderList();choose(id);}});
 document.body.dataset.ready='true';
}catch(error){showError(error.message);}
