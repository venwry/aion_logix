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
 function valueNode(value){
  if(Array.isArray(value)){
   if(!value.length)return el('span','','[]');
   if(value.every(v=>v&&typeof v==='object'&&!Array.isArray(v))){
    const rows=value.map(v=>new Map(fields(v)));const columns=[...new Set(rows.flatMap(r=>[...r.keys()]))];
    const wrap=el('div','compact-table-scroll'),table=el('table','compact-value-table'),head=el('thead'),headRow=el('tr'),body=el('tbody');
    for(const name of columns){const th=el('th','',name);th.scope='col';headRow.append(th);}head.append(headRow);
    for(const row of rows){const tr=el('tr');for(const name of columns){const td=el('td');td.append(row.has(name)?valueNode(row.get(name)):el('span','','—'));tr.append(td);}body.append(tr);}
    table.append(head,body);wrap.append(table);return wrap;
   }
   const span=el('span');value.forEach((v,i)=>{if(i)span.append(document.createTextNode(', '));span.append(valueNode(v));});return span;
  }
  if(value&&typeof value==='object')return el('span','',JSON.stringify(value));
  if(typeof value==='string'&&data.index.has(value)){const button=el('button','ref-link',titleOf(data.index.get(value)));button.title=value;button.onclick=()=>select(value);return button;}
  if(typeof value==='string'&&/^https?:\/\/\S+$/.test(value)){const link=el('a','',value);link.href=value;link.target='_blank';link.rel='noopener noreferrer';return link;}
  return el('span','',value===null?'null':String(value));
 }
 const content=el('div','compact-fields');
 for(const [key,value] of fields(data.originals.get(record.id)||record)){
  if(key==='status')continue;
  const row=el('div','compact-field');row.append(el('strong','compact-key',key+': '),key==='id'?el('span','record-id',value):valueNode(value));content.append(row);
 }
 host.append(content);
 const incoming=data.records.filter(r=>r.id!==record.id&&references(r,data.index).has(record.id));
 if(incoming.length){const row=el('div','compact-field compact-incoming');row.append(el('strong','compact-key','Referenced by: '),valueNode(incoming.map(r=>r.id)));host.append(row);}
 const links=el('div','detail-links');
 if(['event','process','campaign'].includes(typeOf(record))){const a=el('a','','Open in timeline →');a.href='timeline.html#'+encodeURIComponent(record.id);links.append(a);}
 const raw=el('a','','Open dataset ↗');raw.href='../data_foundation/'+typeOf(record)+'.json';raw.target='_blank';raw.rel='noopener';links.append(raw);host.append(links);
}
