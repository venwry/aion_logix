import {$,el} from './shared.js';
import {digest} from './review-log.js';
import {loadEditorial,saveFeedback,draftStore,renderOrphanDrafts} from './editorial.js';
export async function annotationController(data){
 let {annotations}=await loadEditorial(),record=null,editing=new Set(),saving=false;
 const hashes=new Map(await Promise.all([...data.originals].map(async([id,r])=>[id,await digest(r)])));
 const notice=$('annotation-message'),save=$('save-annotations'),count=$('annotation-count');
 const drafts=draftStore('annotations',message=>notice.textContent=message);
 const latest=id=>annotations.findLast(a=>a.record_id===id);
 const recovery=el('details','draft-recovery');notice.after(recovery);
 const update=()=>{const n=Object.keys(drafts.all()).length;count.textContent=n+' uncommitted';save.disabled=saving||!n;renderOrphanDrafts(recovery,drafts,id=>data.originals.has(id),id=>{drafts.remove(id);update();},saving);};
 const makeDraft=r=>{const old=latest(r.id);return {id:'annotation.'+crypto.randomUUID(),record_id:r.id,supersedes_id:old?.id||null,content_sha256:hashes.get(r.id),text:old?.state==='open'?old.text:'',state:'open'};};
 function render(r){
  record=r;if(!r)return;const host=$('details');host.querySelector('.annotation-box')?.remove();host.querySelector('.annotation-toggle')?.remove();
  const old=latest(r.id),draft=drafts.get(r.id),visible=!!draft||editing.has(r.id)||old?.state==='open';
  const button=el('button','quiet-button annotation-toggle',draft||editing.has(r.id)?'Editing':old?.state==='open'?'Edit Annotation':'Add annotation');button.type='button';button.disabled=saving||!!draft||editing.has(r.id);host.querySelector('.record-topline').append(button);
  button.onclick=()=>{editing.add(r.id);render(r);host.querySelector('textarea').focus();};
  if(!visible){update();return;}
  const box=el('div','annotation-box'),textarea=el('textarea');textarea.rows=5;textarea.maxLength=20000;textarea.setAttribute('aria-label','Annotation');textarea.value=draft?.text??(old?.state==='open'?old.text:'');textarea.readOnly=!draft&&!editing.has(r.id);textarea.disabled=saving;
  const state=el('p','annotation-state',draft?'Uncommitted draft':editing.has(r.id)?'Editing annotation':'Committed to GitHub');
  const cancel=el('button','quiet-button','Cancel edit');cancel.type='button';cancel.hidden=textarea.readOnly;cancel.disabled=saving;
  cancel.onclick=()=>{drafts.remove(r.id);editing.delete(r.id);render(r);};
  box.append(textarea,state,cancel);
  if(old?.state==='open'){const dismiss=el('button','quiet-button','Dismiss annotation');dismiss.type='button';dismiss.disabled=saving;dismiss.onclick=async()=>{drafts.set(r.id,{...makeDraft(r),text:old.text,state:'dismissed'});editing.add(r.id);render(r);};box.append(dismiss);}
  if(draft?.state==='dismissed'){textarea.readOnly=true;state.textContent='Dismissal pending — Save annotations to commit, or Cancel edit.';}
  if(draft&&(old?.id||null)!==draft.supersedes_id){state.textContent='Saved annotation changed since this draft. Your draft is retained; compare it below before cancelling and starting a fresh edit.';box.append(el('pre','annotation-saved-copy',old?.text||'No saved annotation'));}

  textarea.oninput=()=>{
   const text=textarea.value,base=drafts.get(r.id)||makeDraft(r);
   if(text===(old?.state==='open'?old.text:'')){drafts.remove(r.id);state.textContent='No uncommitted changes';}
   else{const stored=drafts.set(r.id,{...base,text,state:'open'});state.textContent=text.trim()?(stored?'Saved locally · not committed to GitHub':'Draft in this page only'):'Enter text or use Dismiss annotation.';}
   update();
  };
  if(draft&&draft.content_sha256!==hashes.get(r.id))state.textContent='Record changed since this draft. Copy the text, cancel this edit and review the current record before starting a fresh annotation.';
  if(!draft&&old&&old.content_sha256!==hashes.get(r.id))state.textContent='Committed annotation · written against an earlier record version.';
  host.querySelector('h2').before(box);update();
 }
 save.onclick=async()=>{
  const entries=Object.values(drafts.all());if(saving||!entries.length)return;
  if(entries.some(e=>!e.text.trim())){notice.textContent='Empty annotations cannot be saved. Enter feedback, cancel the edit, or explicitly dismiss a saved annotation.';return;}
  saving=true;update();render(record);notice.textContent='Saving annotations to GitHub…';
  try{const state=await saveFeedback('save_annotations',entries);annotations=state.annotations;for(const entry of entries){if(JSON.stringify(drafts.get(entry.record_id))===JSON.stringify(entry))drafts.remove(entry.record_id);editing.delete(entry.record_id);}notice.textContent='Annotations committed · '+state.revision.slice(0,7);}
  catch(error){notice.textContent=error.message;}
  finally{saving=false;render(record);update();}
 };
 update();return {render};
}
