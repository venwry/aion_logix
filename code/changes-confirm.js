import {el,$,human,loadData,showError,splitter,titleOf} from './shared.js';
import {stable,digest} from './review-log.js';
import {saveAuthorization} from './api-client.js';
import {compactDetails,disposeDetails} from './compact-details.js';
import {loadEditorial,draftStore,renderOrphanDrafts} from './editorial.js';
const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
function diff(before,after){if(before===null||after===null)return [before,after];const keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>!equal(before[k],after[k]));return [before,after].map(r=>Object.fromEntries(keys.map(k=>[k,Object.hasOwn(r,k)?r[k]:'(not present)'])));}
try{
 const data=await loadData(),editorial=await loadEditorial();
 const response=data.remote?null:await fetch('../data_storytelling/change.json',{cache:'no-store'});if(response&&!response.ok)throw Error('Could not load proposed changes.');
 let proposals=(data.remote?.changes||await response.json()).change,reviews=editorial.change_reviews,annotations=editorial.annotations,current=decodeURIComponent(location.hash.slice(1)),saving=false,activeElement=0;
 const hashes=new Map(await Promise.all(proposals.map(async p=>[p.id,await digest(p)]))),selected=new Set(),removals=new Set(),feedbackEditing=new Set(),drafts=draftStore('change-reviews',message=>$('warning').textContent=message);
 const recovery=el('details','draft-recovery');$('warning').after(recovery);
 let detailHosts=[];
 const cleanup=()=>{detailHosts.forEach(disposeDetails);detailHosts=[];};
 const review=p=>reviews.findLast(r=>r.change_id===p.id&&r.proposal_sha256===hashes.get(p.id));
 const stale=p=>p.elements.some(e=>e.record_type!=='schema'&&!equal(data.originals.get(e.record_id)??null,e.before));
 const blocked=p=>p.category==='schema'||stale(p)||!!review(p)||!!drafts.get(p.id)||feedbackEditing.has(p.id);
 function updateSelection(){
  $('selected-count').textContent=selected.size+' selected';$('removal-count').textContent=removals.size+' removals';
  const n=Object.keys(drafts.all()).length;$('save-review').disabled=saving||!(n+selected.size+removals.size);$('feedback-count').textContent=n+' uncommitted';renderOrphanDrafts(recovery,drafts,id=>proposals.some(p=>p.id===id),id=>{drafts.remove(id);updateSelection();},saving);
 }
 function matching(){const q=$('search').value.toLowerCase();return proposals.filter(p=>(!$('category').value||p.category===$('category').value)&&(!q||JSON.stringify(p).toLowerCase().includes(q))&&(!$('review-state').value||$('review-state').value===(review(p)?'needs_refinement':'pending')));}
 function navigation(){
  const nav=$('proposal-nav');nav.replaceChildren();for(const p of matching()){
   const button=el('button','proposal-nav-item');button.type='button';button.dataset.changeId=p.id;button.setAttribute('aria-current',String(current===p.id));
   button.append(el('strong','',p.title),el('span','',p.elements.length+' affected record(s)'),el('span','',removals.has(p.id)?'Marked for removal':selected.has(p.id)?'Selected for authorization':drafts.get(p.id)?'Unsaved feedback':review(p)?'Needs refinement':stale(p)?'Stale comparison':'Pending review'));
   button.onclick=()=>{current=p.id;activeElement=0;history.replaceState(null,'','#'+encodeURIComponent(p.id));render();};nav.append(button);
  }
  if(!nav.children.length)nav.append(el('p','empty-state','No proposals match these filters.'));
  $('review-count').textContent=proposals.length+' pending proposal(s)';updateSelection();
 }
 function renderDetailsPair(p,e,container){
  let linkedId=e.record_id,version;
  const contexts=['before','after'].map(side=>{const originals=new Map(data.originals);for(const element of p.elements){if(element[side]===null)originals.delete(element.record_id);else originals.set(element.record_id,element[side]);}return {originals,index:originals,records:[...originals.values()]};});
  const back=el('button','quiet-button','Return to affected record');back.type='button';back.hidden=true;container.append(back);
  container.append(el('p','detail-caption','Linked records use the current repository snapshot with all proposal elements overlaid on each side.'));
  const grid=el('div','comparison-grid');container.append(grid);
  function draw(){
   for(const host of [...grid.querySelectorAll('.comparison-record')]){disposeDetails(host);detailHosts=detailHosts.filter(h=>h!==host);}grid.replaceChildren();
   const pair=contexts.map(c=>c.originals.get(linkedId)||null),keys=new Set([...Object.keys(pair[0]||{}),...Object.keys(pair[1]||{})].filter(k=>!equal(pair[0]?.[k],pair[1]?.[k])));
   if(version===undefined)version=(pair[0]?.composition_history?.[0]||pair[1]?.composition_history?.[0])?.version_number;
   pair.forEach((record,i)=>{const column=el('section','comparison-column'),host=el('div','comparison-record compact-details');column.append(el('h3','',i?'After':'Before'),host);grid.append(column);detailHosts.push(host);
    if(!record){host.append(el('p','empty-state',i?'Record removed or not present':'Not present — new element'));return;}
    compactDetails(record,contexts[i],id=>{linkedId=id;version=undefined;back.hidden=linkedId===e.record_id;draw();},{host,comparison:true,statusLabel:i?'Proposed content':'Before snapshot',changedFields:keys,versionNumber:version,onVersionChange:number=>{version=number;draw();}});
   });
  }
  back.onclick=()=>{linkedId=e.record_id;version=undefined;back.hidden=true;draw();};draw();
 }
 function render(){
  cleanup();$('proposal-actions').replaceChildren();$('affected-record-control').replaceChildren();$('affected-record-control').hidden=true;const host=$('proposals');host.replaceChildren();if(!proposals.some(p=>p.id===current)){current=matching()[0]?.id||proposals[0]?.id;activeElement=0;}
  const p=proposals.find(p=>p.id===current);navigation();if(!p){host.append(el('p','empty-state','No pending changes.'));return;}
  const card=el('article','proposal-card');card.dataset.changeId=p.id;card.append(el('span','type-tag',review(p)?'Needs refinement':'Pending review'),el('h2','',p.title),el('p','',p.reason));host.append(card);
  if(p.annotation_ids?.length){const source=el('div','source-annotations');source.append(el('h3','','Source annotations'));for(const id of p.annotation_ids){const a=annotations.find(a=>a.id===id);if(a){const link=el('a','',a.record_id);link.href='timeline.html#'+encodeURIComponent(a.record_id);source.append(link,el('p','',a.text));}}card.append(source);}
  if(p.depends_on_change_ids?.length)card.append(el('p','dependency-note','Requires proposals: '+p.depends_on_change_ids.join(', ')));
  const controls=$('proposal-actions'),authorize=el('button','quiet-button authorize-choice','Authorize'),reject=el('button','quiet-button','Request changes'),remove=el('button','quiet-button',removals.has(p.id)?'Undo removal':'Remove');authorize.type=reject.type=remove.type='button';authorize.setAttribute('aria-pressed',String(selected.has(p.id)));authorize.disabled=saving||removals.has(p.id)||blocked(p);reject.disabled=saving||removals.has(p.id);remove.disabled=saving||!!drafts.get(p.id)||feedbackEditing.has(p.id);
  if(remove.disabled&&!saving)remove.title='Save or cancel feedback before removing this proposal.';
  authorize.onclick=()=>{if(selected.has(p.id))selected.delete(p.id);else selected.add(p.id);render();};reject.onclick=()=>{selected.delete(p.id);feedbackEditing.add(p.id);render();$('proposals').querySelector('textarea')?.focus();};
  remove.onclick=()=>{selected.delete(p.id);if(removals.has(p.id))removals.delete(p.id);else removals.add(p.id);render();};controls.append(authorize,reject,remove);
  if(removals.has(p.id))card.append(el('p','review-warning','Marked for removal. Save will remove this proposal without applying its changes.'));
  if(stale(p)||p.category==='schema'||review(p))card.append(el('p','review-warning',stale(p)?'The story has changed. Refresh this proposal before authorization.':p.category==='schema'?'Schema changes need a reviewed schema deployment.':'This revision needs refinement. A revised proposal must be reviewed before authorization.'));
  const previous=review(p),draft=drafts.get(p.id),editing=feedbackEditing.has(p.id)||!!draft;
  if(previous||editing){
   const area=el('div','review-feedback'),label=el('label','','Refinement feedback'),text=el('textarea');text.id='refinement-feedback';label.htmlFor=text.id;text.rows=5;text.maxLength=20000;text.value=draft?.text??previous?.text??'';text.readOnly=!editing;text.disabled=saving;
   const note=el('p','',draft?'Saved locally · not committed to GitHub':'Committed feedback');area.append(label,text,note);
   if(draft&&draft.proposal_sha256!==hashes.get(p.id))note.textContent='This draft concerns an earlier proposal revision. Compare, then cancel and write fresh feedback for the current revision.';
   if(draft&&(previous?.id||null)!==draft.supersedes_id){note.textContent='Saved feedback changed in another session. Compare it below before starting a fresh edit.';area.append(el('pre','',previous?.text||'No feedback on this revision'));}
   if(editing){const cancel=el('button','quiet-button','Cancel feedback');cancel.type='button';cancel.disabled=saving;cancel.onclick=()=>{drafts.remove(p.id);feedbackEditing.delete(p.id);render();};area.append(cancel);}
   text.oninput=()=>{selected.delete(p.id);if(text.value===(previous?.text||'')){drafts.remove(p.id);note.textContent='No uncommitted feedback changes';}else{const saved=drafts.set(p.id,{...(drafts.get(p.id)||{id:'change_review.'+crypto.randomUUID(),change_id:p.id,proposal_sha256:hashes.get(p.id),supersedes_id:previous?.id||null}),text:text.value});note.textContent=saved?'Saved locally · not committed to GitHub':'Draft in this page only';}navigation();};card.append(area);
  }
  const earlier=reviews.filter(r=>r.change_id===p.id&&r.id!==previous?.id);if(earlier.length){const history=el('details','feedback-history');history.append(el('summary','','Earlier feedback ('+earlier.length+')'));for(const r of earlier)history.append(el('p','',r.text));card.append(history);}
  const mode=$('comparison-mode').value;$('full-json-control').hidden=mode!=='json';
  if(mode==='json'||p.category==='schema'){
   const table=el('table','change-table'),head=el('thead'),tr=el('tr'),body=el('tbody');for(const name of ['Subject','Before','After']){const th=el('th','',name);th.scope='col';tr.append(th);}head.append(tr);table.append(head,body);
   for(const e of p.elements){const row=el('tr'),subject=el('th','',human(e.record_type)+' · '+e.record_id);subject.scope='row';row.append(subject);const pair=p.category==='schema'||$('full-json').checked?[e.before,e.after]:diff(e.before,e.after);pair.forEach((v,i)=>{const cell=el('td');cell.append(v===null?el('p','',i?'Record removed':'Not present — new element'):el('pre','',JSON.stringify(v,null,2)));row.append(cell);});body.append(row);}card.append(table);
  }else{
   const control=$('affected-record-control'),picker=el('select'),previous=el('button','quiet-button','‹'),next=el('button','quiet-button','›');control.hidden=false;picker.setAttribute('aria-label','Affected record');previous.type=next.type='button';previous.setAttribute('aria-label','Previous affected record');next.setAttribute('aria-label','Next affected record');
   p.elements.forEach((e,i)=>{const option=el('option','',titleOf(e.after||e.before||{id:e.record_id})+' — '+e.record_id);option.value=String(i);picker.append(option);});activeElement=Math.min(activeElement,p.elements.length-1);picker.value=String(activeElement);previous.disabled=activeElement===0;next.disabled=activeElement===p.elements.length-1;previous.onclick=()=>{activeElement--;render();};next.onclick=()=>{activeElement++;render();};picker.onchange=()=>{activeElement=Number(picker.value);render();};control.append(previous,picker,next);const comparison=el('div');card.append(comparison);renderDetailsPair(p,p.elements[activeElement],comparison);

  }
  updateSelection();
 }
 $('save-review').onclick=async()=>{
  const chosen=proposals.filter(p=>selected.has(p.id)),removed=proposals.filter(p=>removals.has(p.id)),entries=Object.values(drafts.all());if(saving||!(chosen.length+removed.length+entries.length))return;
  if(chosen.some(blocked)){$('warning').textContent='A selected proposal needs refreshed review or saved feedback.';return;}
  if(entries.some(e=>!e.text.trim())){$('warning').textContent='Explain what needs refinement before saving feedback.';return;}
  const missing=chosen.flatMap(p=>(p.depends_on_change_ids||[]).filter(id=>proposals.some(q=>q.id===id)&&!selected.has(id)));if(missing.length){$('warning').textContent='Also select required proposals: '+[...new Set(missing)].join(', ');return;}
  saving=true;render();$('warning').textContent='Saving review decisions to GitHub…';
  const reference=p=>({change_id:p.id,proposal_sha256:hashes.get(p.id)});
  try{const state=await saveAuthorization({action:'save_review',approvals:chosen.map(reference),removals:removed.map(reference),feedback:entries});proposals=state.changes.change;selected.clear();removals.clear();data.originals.clear();for(const rows of Object.values(state.collections))for(const r of rows)data.originals.set(r.id,r);reviews=state.change_reviews||reviews;annotations=state.annotations||annotations;
   for(const entry of entries){if(equal(drafts.get(entry.change_id),entry))drafts.remove(entry.change_id);feedbackEditing.delete(entry.change_id);}
   hashes.clear();for(const p of proposals)hashes.set(p.id,await digest(p));
   $('warning').textContent='Review decisions saved · GitHub commit '+state.revision.slice(0,7);
  }catch(error){$('warning').textContent=error.message;}finally{saving=false;render();}
 };
 function filter(){if(!matching().some(p=>p.id===current)){current=matching()[0]?.id;activeElement=0;}render();}
 $('category').onchange=filter;$('search').oninput=filter;$('review-state').onchange=filter;$('comparison-mode').onchange=render;$('full-json').onchange=render;
 splitter('aion-review-width',280);render();document.body.dataset.ready='true';
}catch(error){showError(error.message);}
