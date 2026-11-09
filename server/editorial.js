import crypto from 'node:crypto';
import {stageFiles} from './staging.js';
import {hash,records} from './model.js';
export const editorialRows=(files,name)=>files['data_storytelling/'+name+'.json']?.[name]||[];
export const latestAnnotation=(files,id)=>editorialRows(files,'annotation').findLast(a=>a.record_id===id);
export const latestReview=(files,id,digest)=>editorialRows(files,'change_review').findLast(r=>r.change_id===id&&r.proposal_sha256===digest);
const fail=(message,status=409)=>{throw Object.assign(Error(message),{status});};
export function saveEditorial(original,request,actor,staged=false){
 const name=request.action==='save_annotations'?'annotation':'change_review',entries=request.entries;
 if(!Array.isArray(entries)||!entries.length||entries.length>1000)fail('Select between 1 and 1000 feedback entries.',400);
 const files=staged?original:stageFiles(original),rows=editorialRows(files,name),index=new Map(records(files).map(r=>[r.id,r])),seen=new Set();let changed=false;
 files['data_storytelling/'+name+'.json']={[name]:rows};
 for(const e of entries){
  if(!e||typeof e.id!=='string'||!new RegExp('^'+name+'\\.[a-zA-Z0-9_-]{8,}$').test(e.id)||typeof e.text!=='string'||!e.text.trim()||e.text.length>20000||!(e.supersedes_id===null||typeof e.supersedes_id==='string'))fail('Feedback requires an ID, non-empty text (up to 20,000 characters), and a saved baseline.',400);
  const isAnnotation=name==='annotation',target=isAnnotation?e.record_id:e.change_id;
  if(typeof target!=='string'||seen.has(target))fail('Invalid or duplicate feedback target.',400);seen.add(target);
  const payload=isAnnotation?{record_id:target,content_sha256:e.content_sha256,state:e.state,text:e.text,supersedes_id:e.supersedes_id}:{change_id:target,proposal_sha256:e.proposal_sha256,state:'needs_refinement',text:e.text,supersedes_id:e.supersedes_id};
  if(!/^[a-f0-9]{64}$/.test(isAnnotation?e.content_sha256:e.proposal_sha256))fail('Invalid feedback content hash.',400);
  if(isAnnotation&&!['open','dismissed'].includes(e.state))fail('Invalid annotation state.',400);
  const duplicate=rows.find(r=>r.id===e.id);
  if(duplicate){if(Object.keys(payload).some(k=>payload[k]!==duplicate[k]))fail('Feedback request ID was reused with different content.');continue;}
  const previous=isAnnotation?latestAnnotation(files,target):latestReview(files,target,e.proposal_sha256);
  if((previous?.id||null)!==e.supersedes_id)fail('Feedback has changed in another session. Reload and compare your draft with the saved annotation.');
  if(isAnnotation){
   const record=index.get(target);if(!record||hash(record)!==e.content_sha256)fail('The annotated record has changed. Reload and review it before saving feedback.');
   if(e.state==='dismissed'&&!previous)fail('Only a saved annotation can be dismissed.',400);
  }else{
   const proposal=files['data_storytelling/change.json'].change.find(p=>p.id===target);
   if(!proposal||hash(proposal)!==e.proposal_sha256)fail('The proposal has changed. Reload and review it before saving feedback.');
  }
  rows.push({id:e.id,...payload,actor,created_at:new Date().toISOString(),...(isAnnotation?{change_ids:[]}: {})});changed=true;
 }
 return {files,changed};
}
export function resolveAnnotations(files,proposal,actor){
 const ids=proposal.annotation_ids||[];
 if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)fail('Invalid annotation links on proposal.');
 for(const id of ids){
  const annotation=editorialRows(files,'annotation').find(a=>a.id===id);
  if(!annotation)fail('Proposal refers to an unknown annotation.');
  if(latestAnnotation(files,annotation.record_id)?.id!==id||annotation.state!=='open')continue;
  editorialRows(files,'annotation').push({...annotation,id:'annotation.'+crypto.randomUUID(),supersedes_id:id,state:'resolved',change_ids:[proposal.id],actor,created_at:new Date().toISOString()});
 }
}
export function validateEditorialHistory(files){
 const errors=[];
 for(const name of ['annotation','change_review']){
  const byTarget=new Map(),seen=new Set();
  for(const r of editorialRows(files,name)){
   const target=name==='annotation'?r.record_id:r.change_id+'|'+r.proposal_sha256;
   if(seen.has(r.id))errors.push('Duplicate '+name+' revision ID');seen.add(r.id);
   if((byTarget.get(target)||null)!==r.supersedes_id)errors.push('Invalid '+name+' revision chain');byTarget.set(target,r.id);
  }
 }
 return errors;
}
