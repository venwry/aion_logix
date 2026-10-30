import {$,el,human,typeOf,titleOf,references} from './shared.js';

// Flatten owned objects into dotted paths; retain arrays as values or tables.
function fields(value,prefix='',result=[]){
 for(const [key,item] of Object.entries(value)){
  const name=prefix?prefix+'.'+key:key;
  if(item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).length)fields(item,name,result);
  else result.push([name,item]);
 }
 return result;
}
export function compactDetails(record,data,select){
 const host=$('details');host.replaceChildren();host.scrollTop=0;host.classList.add('compact-details');
 if(!record){host.append(el('h2','','Select a record'));return;}
 const top=el('div','record-topline');top.append(el('span','type-tag',human(typeOf(record))),el('span','badge',record.status==='authorized'?'Authorized':'Pending authorization'));
 host.append(top,el('h2','',titleOf(record)));
 function reference(value){
  const row=el('span','reference-entry'),id=el('span','reference-id',value),link=el('a','ref-link reference-name',titleOf(data.index.get(value)));
  link.href='#'+encodeURIComponent(value);link.title=titleOf(data.index.get(value));link.onclick=event=>{if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){event.preventDefault();select(value);}};
  row.append(id,el('span','reference-divider',' - '),link);return row;
 }
 function referenceList(values,label){
  const group=el('div','reference-list'),header=el('div','reference-header'),controls=el('span','reference-controls'),grid=el('div','reference-grid');
  header.append(el('strong','compact-key',label+': '));
  const minus=el('button','','−'),count=el('input'),plus=el('button','','+');minus.type=plus.type='button';minus.setAttribute('aria-label','Fewer columns for '+label);plus.setAttribute('aria-label','More columns for '+label);
  count.type='number';count.min='1';count.max='3';count.value='1';count.setAttribute('aria-label',label+' columns');
  function update(value){const n=Math.max(1,Math.min(3,Math.trunc(Number(value)||1)));count.value=Math.trunc(n);grid.style.setProperty('--reference-columns',count.value);minus.disabled=n<=1;plus.disabled=n>=3;}
  minus.onclick=()=>update(+count.value-1);plus.onclick=()=>update(+count.value+1);count.onchange=()=>update(count.value);controls.append(minus,count,plus);header.append(controls);
  for(const id of values)grid.append(reference(id));group.append(header,grid);update(1);return group;
 }
 const isReferences=value=>Array.isArray(value)&&value.length>0&&value.every(v=>typeof v==='string'&&data.index.has(v));
 function valueNode(value,label='References'){
  if(isReferences(value))return referenceList(value,label);
  if(Array.isArray(value)){
   if(!value.length)return el('span','','[]');
   if(value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))){
    const rows=value.map(v=>new Map(fields(v)));const columns=[...new Set(rows.flatMap(r=>[...r.keys()]))];
    const wrap=el('div','compact-table-scroll'),table=el('table','compact-value-table'),head=el('thead'),headRow=el('tr'),body=el('tbody'),colgroup=el('colgroup');
    for(const name of columns)colgroup.append(el('col'));
    for(const name of columns){const th=el('th');th.append(el('span','column-title',name));th.scope='col';headRow.append(th);}head.append(headRow);
    for(const row of rows){const tr=el('tr');for(const name of columns){const td=el('td');td.append(row.has(name)?valueNode(row.get(name),name):el('span','','—'));tr.append(td);}body.append(tr);}
    table.append(colgroup,head,body);wrap.append(table);
    const headers=[...headRow.children],cols=[...colgroup.children];let widths=null;
    const reset=el('button','table-autofit','↔');reset.type='button';reset.title='Autofit all columns';reset.setAttribute('aria-label','Autofit all columns');headers.at(-1).append(reset);
    const minimum=i=>Math.ceil(headers[i].querySelector('.column-title').getBoundingClientRect().width)+24+(i===headers.length-1?28:0);
    function apply(){table.style.tableLayout='fixed';table.style.width=widths.reduce((a,b)=>a+b,0)+'px';cols.forEach((col,i)=>col.style.width=widths[i]+'px');}
    function freeze(){if(!widths)widths=headers.map((th,i)=>Math.max(minimum(i),th.getBoundingClientRect().width));}
    reset.onclick=()=>{widths=null;table.style.tableLayout='auto';table.style.width='100%';cols.forEach(col=>col.style.width='');};
    headers.forEach((th,i)=>{const handle=el('span','column-resizer');handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label','Resize '+columns[i]+' column');
     function change(width){widths[i]=Math.max(minimum(i),width);handle.setAttribute('aria-valuenow',String(Math.round(widths[i])));handle.setAttribute('aria-valuemin',String(minimum(i)));apply();}
     handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();freeze();const start=event.clientX,initial=widths[i];handle.setPointerCapture(event.pointerId);handle.onpointermove=e=>change(initial+e.clientX-start);};
     handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null;};handle.onlostpointercapture=()=>{handle.onpointermove=null;};
     handle.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();freeze();change(event.key==='Home'?minimum(i):widths[i]+(event.key==='ArrowRight'?16:-16));};th.append(handle);
    });requestAnimationFrame(()=>{if(!table.isConnected)return;headers.forEach((th,i)=>{const handle=th.querySelector('.column-resizer');handle.setAttribute('aria-valuenow',String(Math.round(th.getBoundingClientRect().width)));handle.setAttribute('aria-valuemin',String(minimum(i)));});});return wrap;
   }
   const span=el('span');value.forEach((v,i)=>{if(i)span.append(document.createTextNode(', '));span.append(valueNode(v));});return span;
  }
  if(value&&typeof value==='object')return el('span','',JSON.stringify(value));
  if(typeof value==='string'&&data.index.has(value))return reference(value);
  if(typeof value==='string'&&/^https?:\/\/\S+$/.test(value)){const link=el('a','',value);link.href=value;link.target='_blank';link.rel='noopener noreferrer';return link;}
  return el('span','',value===null?'null':String(value));
 }
 const content=el('div','compact-fields');
 for(const [key,value] of fields(data.originals.get(record.id)||record)){
  if(key==='status')continue;
  const row=el('div','compact-field');if(isReferences(value))row.append(referenceList(value,key));else row.append(el('strong','compact-key',key+': '),key==='id'?el('span','record-id',value):valueNode(value,key));content.append(row);
 }
 host.append(content);
 const incoming=data.records.filter(r=>r.id!==record.id&&references(r,data.index).has(record.id));
 if(incoming.length){const row=el('div','compact-field compact-incoming');row.append(referenceList(incoming.map(r=>r.id),'Referenced by'));host.append(row);}
 const links=el('div','detail-links');
 if(['event','process','campaign'].includes(typeOf(record))){const a=el('a','','Open in timeline →');a.href='timeline.html#'+encodeURIComponent(record.id);links.append(a);}
 const raw=el('a','','Open dataset ↗');raw.href='../data_foundation/'+typeOf(record)+'.json';raw.target='_blank';raw.rel='noopener';links.append(raw);host.append(links);
}
