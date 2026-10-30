import {$,el,human,typeOf,titleOf,references} from './shared.js';

let detailCleanups=[];

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
 for(const cleanup of detailCleanups)cleanup();detailCleanups=[];
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
  const group=el('div','reference-list'),grid=el('div','reference-grid');
  if(label){const header=el('div','reference-header');header.append(el('strong','compact-key',label+': '));group.append(header);}
  for(const id of values)grid.append(reference(id));group.append(grid);return group;
 }
 const isReferences=value=>Array.isArray(value)&&value.length>0&&value.every(v=>typeof v==='string'&&data.index.has(v));
 function valueNode(value,label='References',inTable=false){
  if(isReferences(value))return referenceList(value,inTable?null:label);
  if(Array.isArray(value)){
   if(!value.length)return el('span','','[]');
   if(value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))){
    const rows=value.map(v=>new Map(fields(v)));const columns=[...new Set(rows.flatMap(r=>[...r.keys()]))];
    const wrap=el('div','compact-table-scroll'),table=el('table','compact-value-table'),head=el('thead'),headRow=el('tr'),body=el('tbody'),colgroup=el('colgroup');
    for(const name of columns)colgroup.append(el('col'));
    for(const name of columns){const th=el('th');th.append(el('span','column-title',name));th.scope='col';headRow.append(th);}head.append(headRow);
    for(const row of rows){const tr=el('tr');for(const name of columns){const td=el('td');td.append(row.has(name)?valueNode(row.get(name),name,true):el('span','','—'));tr.append(td);}body.append(tr);}
    table.append(colgroup,head,body);wrap.append(table);
    const headers=[...headRow.children],cols=[...colgroup.children];let widths=null,automatic=true;
    const contentText=v=>v==null?'':Array.isArray(v)?v.map(contentText).join(' '):typeof v==='object'?Object.values(v).map(contentText).join(' '):typeof v==='string'&&data.index.has(v)?v+' '+titleOf(data.index.get(v)):String(v);
    const weights=columns.map(name=>Math.max(1,rows.reduce((sum,row)=>sum+contentText(row.get(name)).length,0)/rows.length));
    const reset=el('button','table-autofit','↔');reset.type='button';reset.title='Autofit all columns';reset.setAttribute('aria-label','Autofit all columns');headers.at(-1).append(reset);
    const minimum=i=>Math.ceil(headers[i].querySelector('.column-title').getBoundingClientRect().width)+24+(i===headers.length-1?28:0);
    function apply(){table.style.tableLayout='fixed';table.dataset.sizing=automatic?'auto':'manual';table.style.width=widths.reduce((a,b)=>a+b,0)+'px';cols.forEach((col,i)=>{col.style.width=widths[i]+'px';const handle=headers[i].querySelector('.column-resizer');if(handle){handle.setAttribute('aria-valuenow',String(Math.round(widths[i])));handle.setAttribute('aria-valuemin',String(minimum(i)));}});}
    function autofit(){
     if(!table.isConnected)return;automatic=true;const minima=columns.map((_,i)=>minimum(i));let remaining=Math.max(wrap.clientWidth-1,minima.reduce((a,b)=>a+b,0)),pending=columns.map((_,i)=>i);widths=[...minima];
     // Allocate by average rendered content length, pinning short columns to their headers.
     while(pending.length){const total=pending.reduce((sum,i)=>sum+weights[i],0),small=pending.filter(i=>remaining*weights[i]/total<minima[i]);
      if(!small.length){for(const i of pending)widths[i]=remaining*weights[i]/total;break;}
      for(const i of small)remaining-=minima[i];pending=pending.filter(i=>!small.includes(i));
     }apply();
    }
    function freeze(){automatic=false;if(!widths)widths=headers.map((th,i)=>Math.max(minimum(i),th.getBoundingClientRect().width));}
    reset.onclick=autofit;
    headers.forEach((th,i)=>{const handle=el('span','column-resizer');handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label','Resize '+columns[i]+' column');
     function change(width){widths[i]=Math.max(minimum(i),width);handle.setAttribute('aria-valuenow',String(Math.round(widths[i])));handle.setAttribute('aria-valuemin',String(minimum(i)));apply();}
     handle.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();freeze();const start=event.clientX,initial=widths[i];handle.setPointerCapture(event.pointerId);handle.onpointermove=e=>change(initial+e.clientX-start);};
     handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null;};handle.onlostpointercapture=()=>{handle.onpointermove=null;};
     handle.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;event.preventDefault();freeze();change(event.key==='Home'?minimum(i):widths[i]+(event.key==='ArrowRight'?16:-16));};th.append(handle);
    });let lastWidth=-1;
    const observer=new ResizeObserver(()=>{const available=wrap.clientWidth;if(available===lastWidth)return;lastWidth=available;if(automatic)autofit();});observer.observe(wrap);detailCleanups.push(()=>observer.disconnect());requestAnimationFrame(autofit);return wrap;
   }
   const span=el('span');value.forEach((v,i)=>{if(i)span.append(document.createTextNode(', '));span.append(valueNode(v,label,inTable));});return span;
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
 if(document.body.dataset.page==='timeline'){const a=el('a','','Open in Data browser →');a.href='browser.html#'+encodeURIComponent(record.id);links.append(a);}
 else if(['event','process','campaign'].includes(typeOf(record))){const a=el('a','','Open in timeline →');a.href='timeline.html#'+encodeURIComponent(record.id);links.append(a);}
 const raw=el('a','','Open dataset ↗');raw.href='../data_foundation/'+typeOf(record)+'.json';raw.target='_blank';raw.rel='noopener';links.append(raw);host.append(links);
}
