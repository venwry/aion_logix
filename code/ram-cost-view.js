import {el} from './shared.js';
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
function table(headers,rows){
 const t=el('table','cost-detail-table'),head=el('thead'),tr=el('tr');for(const h of headers){const th=el('th','',h);th.scope='col';tr.append(th);}head.append(tr);t.append(head);const body=el('tbody');
 for(const row of rows){const tr=el('tr');for(const value of row)tr.append(el('td','',String(value)));body.append(tr);}t.append(body);return t;
}
export function renderRamCostComparison(host,document,initialDate){
 host.replaceChildren();host.append(el('p','cost-warning',document.note),el('p','cost-detail-note',document.scope));
 const label=el('label','','Comparison date '),select=el('select');select.setAttribute('aria-label','RAM comparison date');
 for(const d of document.dates){const option=el('option','',d.date);option.value=d.date;select.append(option);}select.value=initialDate||document.dates.at(-1).date;label.append(select);host.append(label);const content=el('div');host.append(content);
 function render(){
  const d=document.dates.find(d=>d.date===select.value);content.replaceChildren();content.append(el('p','cost-detail-note','Nominal USD on '+d.date+'. AION quotes include 15% markup on manufacturing cost. Sensitivity ranges vary chip costs only; supplier contracts and final electrical qualification remain open.'));
  content.append(el('h3','','Chip acquisition costs'),table(['Chip source','Per chip','AION manufacturing cost','AION markup'],d.chips.map(c=>[c.name,c.available?money(c.cost):'Not costed before availability',c.available&&c.manufacturing_cost!==null?money(c.manufacturing_cost):'—',c.available&&c.origin==='aion'?money(c.markup):'—'])));
  content.append(el('h3','','Complete module and subsystem alternatives'));
  for(const m of d.modules){const section=el('details'),best=m.candidates.find(c=>c.id===m.cheapest_id);section.append(el('summary','',`${m.name}: ${best.name} · ${money(best.cost)} per module/subsystem`),el('p','cost-detail-note',`${m.capacity_kib} KiB. Recorded sourcing: ${money(m.recorded_cost)}. Cheapest central estimate ${m.robust_to_chip_range?'remains lower across the tested chip ranges':'is sensitive to chip-cost uncertainty'}.`),table(['Source','Chip count','Complete assembly','Sensitivity range'],m.candidates.map(c=>[c.name,c.chip_quantity,money(c.cost),money(c.low)+'–'+money(c.high)])));content.append(section);}
  content.append(el('h3','','Host-listed RAM population alternatives'));
  if(!d.configurations.length)content.append(el('p','cost-detail-note','No dated modular host configurations are available at this date; fixed-memory subsystems are compared above.'));
  for(const c of d.configurations){const best=c.candidates.find(x=>x.id===c.cheapest_id),section=el('details');section.append(el('summary','',`${c.host_name} · ${c.capacity_kib} KiB: ${money(best.cost)}`),el('p','cost-detail-note',`Lowest central estimate: ${best.name}. Recorded population: ${c.recorded_modules} × ${d.modules.find(m=>m.record_id===c.recorded_module_id)?.name||c.recorded_module_id}, costing ${money(c.recorded_cost)}. ${c.robust_to_chip_range?'Winner stays cheaper across the tested chip ranges.':'Candidate cost ranges overlap; the central winner is not a firm procurement recommendation.'} ${c.socket_limit===null?'Maximum sockets are unspecified; comparisons use no more than the recorded fitted population.':''}`),table(['Population / source','Chips','RAM assembly cost','Sensitivity range'],c.candidates.map(x=>[x.name,x.chip_quantity,money(x.cost),money(x.low)+'–'+money(x.high)])));
   for(const e of c.excluded)section.append(el('p','cost-detail-note',`${e.module_id}: ${e.reasons.join(' ')}`));content.append(section);
  }
 }
 select.onchange=render;render();
}
