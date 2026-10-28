import {el} from './shared.js';import {digest} from './review-log.js';import {saveAuthorization} from './api-client.js';
export async function recordConfirmations(data){
 return record=>{
  const panel=el('div','confirmation-control'),label=el('label','review-check'),check=el('input');check.type='checkbox';check.checked=record.status==='authorized';check.disabled=check.checked;
  label.append(check,document.createTextNode(check.checked?'Authorized':'I authorize this record'));
  const button=el('button','quiet-button','Authorize and save');button.disabled=true;button.hidden=check.checked;
  const message=el('p','detail-caption',check.checked?'Authorization matches this version of the story record.':'Saving records your decision in GitHub.');message.setAttribute('role','status');panel.append(label,button,message);
  check.onchange=()=>button.disabled=!check.checked;
  button.onclick=async()=>{button.disabled=true;check.disabled=true;message.textContent='Saving to GitHub…';try{const state=await saveAuthorization({action:'authorize_record',record_id:record.id,content_sha256:await digest(data.originals.get(record.id))});record.status='authorized';button.hidden=true;label.lastChild.textContent='Authorized';const badge=document.querySelector('#details .record-topline .badge');if(badge){badge.textContent='Authorized';badge.className='badge confirmed';}message.textContent='Saved to GitHub · '+state.revision.slice(0,7);document.querySelectorAll('#rows tr').forEach(row=>{if(row.dataset.recordId===record.id){const b=row.querySelector('.badge');b.textContent='Authorized';b.className='badge confirmed';}});}catch(error){check.disabled=false;button.disabled=false;message.textContent=error.message;}};
  document.querySelector('#details .record-id').after(panel);
 };
}
