import {remoteState,connection} from './api-client.js';
export async function loadEditorial(){
 const state=await remoteState();if(state)return {annotations:state.annotations||[],change_reviews:state.change_reviews||[]};
 const docs=await Promise.all(['annotation','change_review'].map(async name=>{const r=await fetch('../data_storytelling/'+name+'.json',{cache:'no-store'});if(!r.ok)throw Error('Cannot load '+name);return (await r.json())[name];}));
 return {annotations:docs[0],change_reviews:docs[1]};
}
export async function saveFeedback(action,entries){
 const c=connection();if(!c)throw Error('Connect to the saving service to commit feedback. Your drafts are retained.');
 const r=await fetch(c.url+'/api/feedback',{method:'POST',headers:{Authorization:'Bearer '+c.token,'Content-Type':'application/json'},body:JSON.stringify({action,entries})});
 const state=await r.json();if(!r.ok)throw Error(state.error||'Feedback was not saved. Your drafts are retained.');return state;
}
// Drafts contain feedback only; backend credentials remain in sessionStorage.
export function draftStore(kind,onWarning=()=>{}){
 const key='aion:venwry/aion_logix:main:'+kind;let drafts={};
 try{drafts=JSON.parse(localStorage.getItem(key)||'{}');if(!drafts||typeof drafts!=='object'||Array.isArray(drafts))throw Error();}catch{onWarning('Local drafts could not be read.');drafts={};}
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify(drafts));return true;}catch{onWarning('Local draft storage is unavailable. Keep this page open until feedback is committed.');return false;}};
 window.addEventListener('storage',event=>{if(event.key===key&&event.newValue!==JSON.stringify(drafts))onWarning('Drafts changed in another tab. This tab retains its edits; compare before saving.');});
 window.addEventListener('beforeunload',event=>{if(Object.keys(drafts).length){event.preventDefault();event.returnValue='';}});
 return {all:()=>drafts,get:id=>drafts[id],set:(id,value)=>{drafts[id]=value;return persist();},remove:id=>{delete drafts[id];persist();}};
}

// A removed record/proposal must not trap an otherwise recoverable local draft.
export function renderOrphanDrafts(host,store,exists,onDiscard,saving=false){
 const entries=Object.entries(store.all()).filter(([id])=>!exists(id));host.hidden=!entries.length;host.replaceChildren();if(!entries.length)return;
 const summary=document.createElement('summary');summary.textContent='Drafts whose targets are no longer available ('+entries.length+')';host.append(summary);
 for(const [id,draft] of entries){const section=document.createElement('section'),title=document.createElement('p'),text=document.createElement('textarea'),button=document.createElement('button');title.textContent=id;text.readOnly=true;text.value=draft.text;text.setAttribute('aria-label','Recover draft for '+id);button.type='button';button.className='quiet-button';button.textContent='Discard local draft';button.disabled=saving;button.onclick=()=>onDiscard(id);section.append(title,text,button);host.append(section);}
}
