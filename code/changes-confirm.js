import {el,$,human,loadData,showError} from './shared.js';import {stable,digest} from './review-log.js';import {saveAuthorization} from './api-client.js';
function diff(before,after){if(before===null||after===null)return [before,after];const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>JSON.stringify(stable(before[k]))!==JSON.stringify(stable(after[k])));return [before,after].map(r=>Object.fromEntries(keys.map(k=>[k,Object.hasOwn(r,k)?r[k]:'(not present)'])));}
try{
 const data=await loadData();const response=data.remote?null:await fetch('../data_storytelling/change.json',{cache:'no-store'});if(response&&!response.ok)throw Error('Could not load proposed changes.');const manifest=data.remote?.changes||await response.json();let proposals=manifest.change;
 const notice=el('p','','Approve and save to apply the displayed change and authorize the resulting records in GitHub. Each grouped proposal is saved in one commit.');$('questions').before(notice);
 function render(){
  $('proposals').replaceChildren();let count=0;for(const p of proposals){if($('category').value&&p.category!==$('category').value)continue;if($('search').value&&!JSON.stringify(p).toLowerCase().includes($('search').value.toLowerCase()))continue;count++;
   const card=el('article','proposal-card');card.dataset.changeId=p.id;card.append(el('span','type-tag',p.category==='schema'?'Schema decision':'Unauthorized change'),el('h2','',p.title),el('p','',p.reason));
   const table=el('table','change-table');const head=el('thead'),tr=el('tr');for(const name of ['Subject','Before','After']){const th=el('th','',name);th.scope='col';tr.append(th);}head.append(tr);table.append(head);const body=el('tbody');
   for(const e of p.elements){const row=el('tr');const subject=el('th','',human(e.record_type)+' · '+e.record_id);subject.scope='row';row.append(subject);const pair=e.record_type==='schema'?[e.before,e.after]:diff(e.before,e.after);pair.forEach((v,i)=>{const cell=el('td');cell.append(v===null?el('p','',i?'Record removed':'Not present — new element'):el('pre','',JSON.stringify(v,null,2)));row.append(cell);});body.append(row);}table.append(body);card.append(table);
   const label=el('label','review-check');const check=el('input');check.type='checkbox';label.append(check,document.createTextNode('I authorize this change'));const save=el('button','quiet-button','Authorize and save');save.disabled=true;const message=el('p','detail-caption');message.setAttribute('role','status');card.append(label,save,message);
   const stale=p.elements.some(e=>e.record_type!=='schema'&&JSON.stringify(stable(data.originals.get(e.record_id)??null))!==JSON.stringify(stable(e.before)));
   if(stale||p.category==='schema'){check.disabled=true;message.textContent=stale?'The story has changed. This proposal needs a refreshed comparison.':'This schema decision requires a reviewed schema deployment.';}
   check.onchange=()=>save.disabled=!check.checked;
   save.onclick=async()=>{save.disabled=true;check.disabled=true;message.textContent='Saving to GitHub…';try{const state=await saveAuthorization({action:'approve_change',change_id:p.id,proposal_sha256:await digest(p)});proposals=state.changes.change;for(const [name,rows]of Object.entries(state.collections))for(const r of rows)data.originals.set(r.id,r);$('warning').textContent='Saved and authorized · GitHub commit '+state.revision.slice(0,7);render();}catch(error){check.disabled=false;save.disabled=false;message.textContent=error.message;}};
   $('proposals').append(card);
  }
  $('review-count').textContent=count+' pending proposal(s)';if(!count)$('proposals').append(el('p','empty-state','No pending changes match these filters.'));
 }
 $('category').onchange=render;$('search').oninput=render;render();document.body.dataset.ready='true';
}catch(error){showError(error.message);}
