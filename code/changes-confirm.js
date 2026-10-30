import {el,$,human,loadData,showError} from './shared.js';import {stable,digest} from './review-log.js';import {saveAuthorization} from './api-client.js';
function diff(before,after){if(before===null||after===null)return [before,after];const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>JSON.stringify(stable(before[k]))!==JSON.stringify(stable(after[k])));return [before,after].map(r=>Object.fromEntries(keys.map(k=>[k,Object.hasOwn(r,k)?r[k]:'(not present)'])));}
try{
 const data=await loadData();const response=data.remote?null:await fetch('../data_storytelling/change.json',{cache:'no-store'});if(response&&!response.ok)throw Error('Could not load proposed changes.');const manifest=data.remote?.changes||await response.json();let proposals=manifest.change;const selected=new Set();let saving=false;
 const save=$('authorize-selected');
 function updateSelection(){save.disabled=saving||!selected.size;$('selected-count').textContent=selected.size+' selected';}
 function unavailable(p){return p.category==='schema'||p.elements.some(e=>e.record_type!=='schema'&&JSON.stringify(stable(data.originals.get(e.record_id)??null))!==JSON.stringify(stable(e.before)));}
 const notice=el('p','','Check the proposals you authorize, then use Authorize and save beside Search. All selected proposals, including those hidden by filters, are saved together in one Git commit.');$('questions').before(notice);
 function render(){
  $('proposals').replaceChildren();let count=0;for(const p of proposals){if($('category').value&&p.category!==$('category').value)continue;if($('search').value&&!JSON.stringify(p).toLowerCase().includes($('search').value.toLowerCase()))continue;count++;
   const card=el('article','proposal-card');card.dataset.changeId=p.id;card.append(el('span','type-tag',p.category==='schema'?'Schema decision':'Unauthorized change'),el('h2','',p.title),el('p','',p.reason));
   const table=el('table','change-table');const head=el('thead'),tr=el('tr');for(const name of ['Subject','Before','After']){const th=el('th','',name);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const body=el('tbody');
   for(const e of p.elements){const row=el('tr');const subject=el('th','',human(e.record_type)+' · '+e.record_id);subject.scope='row';row.append(subject);const pair=e.record_type==='schema'?[e.before,e.after]:diff(e.before,e.after);pair.forEach((v,i)=>{const cell=el('td');cell.append(v===null?el('p','',i?'Record removed':'Not present — new element'):el('pre','',JSON.stringify(v,null,2)));row.append(cell);});body.append(row);}table.append(body);card.append(table);
   const label=el('label','review-check');const check=el('input');check.type='checkbox';label.append(check,document.createTextNode('I authorize this change'));check.checked=selected.has(p.id);const message=el('p','detail-caption');message.setAttribute('role','status');card.append(label,message);
   const stale=p.elements.some(e=>e.record_type!=='schema'&&JSON.stringify(stable(data.originals.get(e.record_id)??null))!==JSON.stringify(stable(e.before)));
   if(stale||p.category==='schema'){selected.delete(p.id);check.checked=false;check.disabled=true;message.textContent=stale?'The story has changed. This proposal needs a refreshed comparison.':'This schema decision requires a reviewed schema deployment.';}
   if(saving)check.disabled=true;
   check.onchange=()=>{if(check.checked)selected.add(p.id);else selected.delete(p.id);updateSelection();};
   $('proposals').append(card);
  }
  $('review-count').textContent=count+' pending proposal(s)';if(!count)$('proposals').append(el('p','empty-state','No pending changes match these filters.'));
  updateSelection();
 }
 save.onclick=async()=>{
  if(saving||!selected.size)return;
  const chosen=proposals.filter(p=>selected.has(p.id));
  if(chosen.some(unavailable)){ $('warning').textContent='A selected proposal needs a refreshed comparison. Reload and review it.';return;}
  saving=true;render();$('warning').textContent='Saving selected changes to GitHub…';
  try{
   const changes=await Promise.all(chosen.map(async p=>({change_id:p.id,proposal_sha256:await digest(p)})));
   const state=await saveAuthorization({action:'approve_changes',changes});
   proposals=state.changes.change;selected.clear();data.originals.clear();
   for(const rows of Object.values(state.collections))for(const r of rows)data.originals.set(r.id,r);
   $('warning').textContent='Saved and authorized · '+chosen.length+' proposal(s) · GitHub commit '+state.revision.slice(0,7);
  }catch(error){$('warning').textContent=error.message;}
  finally{saving=false;render();}
 };
 $('category').onchange=render;$('search').oninput=render;render();document.body.dataset.ready='true';
}catch(error){showError(error.message);}
