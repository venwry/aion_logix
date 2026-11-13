import {el,loadData,showError,debounce} from './shared.js';
import {renderTechnicalSpecification,renderGraphicModes} from './technical-specification.js';
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
  const box=el('details','catalog-component'),summary=el('summary');
  summary.append(el('span','catalog-quantity',node.quantity==null?'? ×':node.quantity+' ×'),el('strong','',nameOf(node.record)));
  if(node.version)summary.append(el('small','','Revision '+node.version.version_number));box.append(summary);
  const body=el('div','catalog-component-body');body.append(el('p','',node.record.description||''),link(node.record.id));
  if(node.record.technical_specification)body.append(renderTechnicalSpecification(node.record.technical_specification,value));
  if(node.record.graphic_modes_specification?.length)body.append(renderGraphicModes(node.record.graphic_modes_specification,value));
  if(node.children.length){const nested=el('details');nested.append(el('summary','','Included components'));node.children.forEach(n=>nested.append(component(n)));body.append(nested);}
  box.append(body);return box;
 }
 function renderProduct(){
  const r=data.index.get(selected),host=$('catalog-content');host.replaceChildren();if(!r){host.append(el('p','','No matching products.'));return;}
  const header=el('div','catalog-product-heading');header.append(el('p','eyebrow',r.kind.replaceAll('_',' ')),el('h2','',nameOf(r)),el('p','',r.description||''));
  const launch=el('p','catalog-launch');for(const id of [r.launch_campaign_id,r.launch_event_id].filter(Boolean)){if(launch.childNodes.length)launch.append(' · ');launch.append(link(id));}launch.append(' · '+date(data.index.get(r.launch_event_id)));header.append(launch,link(r.id));host.append(header);
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
  panels.configuration.append(el('p','catalog-note','Recorded contents of this revision. Quantities are per complete product. Open a component to inspect its specification.'));
  for(const group of configurationGroups(tree)){const section=el('section','catalog-category');section.append(el('h3','',group.title));if(!group.nodes.length)section.append(el('p','catalog-empty','Not included in this composition.'));else group.nodes.forEach(n=>section.append(component(n)));panels.configuration.append(section);}
  panels.bom.append(el('p','catalog-note','Indented assemblies and their contents. Quantities per parent and per complete product are shown separately; assemblies and their parts must not be added together. ? means an unknown quantity.'));
  const scroll=el('div','catalog-table-scroll'),table=el('table'),thead=el('thead'),tr=el('tr');for(const label of ['Component / assembly','Per parent','Per product','Revision']){const th=el('th','',label);th.scope='col';tr.append(th);}thead.append(tr);table.append(thead);const tbody=el('tbody');
  const rows=flattenedBOM(tree);for(const n of rows){const row=el('tr'),name=el('td');name.style.paddingLeft=(12+n.depth*18)+'px';name.append(link(n.record.id));row.append(name,el('td','',n.line.quantity??'?'),el('td','',n.quantity??'?'),el('td','',n.version?.version_number??'—'));tbody.append(row);}table.append(tbody);scroll.append(table);panels.bom.append(scroll);
  if(!rows.length)panels.bom.append(el('p','',r.kind==='service'?'This is a service; no physical bill of materials is defined.':'No component lines are recorded.'));
 }
 function choose(id){selected=id;revision=null;history.replaceState(null,'','#'+encodeURIComponent(id));renderProduct();document.querySelectorAll('[data-product-id]').forEach(b=>b.setAttribute('aria-current',b.dataset.productId===id?'true':'false'));}
 function renderList(){
  const q=$('search').value.trim().toLowerCase(),filtered=products.filter(p=>[nameOf(p),p.id,p.description,nameOf(data.index.get(p.launch_campaign_id)),nameOf(data.index.get(p.launch_event_id))].join(' ').toLowerCase().includes(q));
  $('result-count').textContent=`${filtered.length} of ${products.length} products`;$('catalog-list').replaceChildren();
  for(const campaign of launchGroups(filtered,data.index)){const section=el('section','catalog-campaign');section.append(el('h2','',nameOf(campaign.record)==='Unknown'?'No launch campaign':nameOf(campaign.record)),el('small','',date(campaign.record)));
   for(const event of campaign.events){const group=el('section','catalog-event');group.append(el('h3','',nameOf(event.record)==='Unknown'?'No launch event':nameOf(event.record)),el('small','',date(event.record)));
    for(const p of event.products){const button=el('button','catalog-product',nameOf(p));button.dataset.productId=p.id;button.setAttribute('aria-current',String(selected===p.id));button.onclick=()=>choose(p.id);group.append(button);}section.append(group);
   }$('catalog-list').append(section);
  }
  if(!filtered.some(p=>p.id===selected)){const first=launchGroups(filtered,data.index)[0]?.events[0]?.products[0];if(first)choose(first.id);else{selected='';history.replaceState(null,'',location.pathname);renderProduct();}}
 }
 const hash=decodeURIComponent(location.hash.slice(1));if(products.some(p=>p.id===hash))selected=hash;
 $('search').oninput=debounce(renderList);renderList();if(selected)renderProduct();
 window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(products.some(p=>p.id===id)){$('search').value='';selected=id;renderList();choose(id);}});
 document.body.dataset.ready='true';
}catch(error){showError(error.message);}
