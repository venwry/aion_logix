import {datasetPath} from '../code/model-contract.js';
import {stageFiles} from './staging.js';
import {editorialRows,latestReview,saveEditorial,resolveAnnotations,validateEditorialHistory} from './editorial.js';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import crypto from 'node:crypto';
import {validateDocuments} from '../tools/validate-model.js';
const editorialValidator=new Ajv2020({allErrors:true,strict:false});addFormats(editorialValidator);
const checks=Object.fromEntries(['authorization','authorization_decision','annotation','change_review'].map(n=>[n,editorialValidator.compile(JSON.parse(fs.readFileSync(new URL('../schemas/storytelling/'+n+'.schema.json',import.meta.url))))]));
const checkDiscussion=editorialValidator.compile(JSON.parse(fs.readFileSync(new URL('../schemas/storytelling/discussion.schema.json',import.meta.url))));
export {datasets as names} from '../code/model-contract.js';
import {datasets as names} from '../code/model-contract.js';
export const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
export const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
export const records=files=>names.flatMap(n=>files[datasetPath(n)][n]);
export const get= (files,name)=>files[`data_storytelling/${name}.json`][name];
export function validate(files){
 const result=validateDocuments(Object.fromEntries(names.map(n=>[n,files[datasetPath(n)]])));
 for(const [name,check] of Object.entries(checks))if(!check(files[`data_storytelling/${name}.json`]||{[name]:[]}))result.errors.push(name+': '+editorialValidator.errorsText(check.errors));
 result.errors.push(...validateEditorialHistory(files));
 const index=new Map(records(files).map(r=>[r.id,r]));const seen=new Set();
 for(const p of get(files,'change')||[])if(p.category==='discussion'){
  if(!checkDiscussion(p)){result.errors.push(p.id+': '+editorialValidator.errorsText(checkDiscussion.errors));continue;}
  for(const id of p.affected_record_ids)if(!index.has(id))result.errors.push(p.id+': unknown discussion record '+id);
  for(const f of p.findings)if(f.record_id&&!p.affected_record_ids.includes(f.record_id))result.errors.push(p.id+': finding record must be listed in affected_record_ids');
 }
 for(const a of get(files,'authorization')){if(seen.has(a.record_id))result.errors.push('Duplicate authorization');seen.add(a.record_id);if(!index.has(a.record_id))result.errors.push('Orphan authorization '+a.record_id);if(!['authorized','unauthorized'].includes(a.state))result.errors.push('Invalid authorization state');if(!/^[a-f0-9]{64}$/.test(a.content_sha256))result.errors.push('Invalid content hash');}
 for(const record of index.values())if(['status','confirmation','source_refs'].some(k=>k in record))result.errors.push('Editorial information in foundation '+record.id);
 return result;
}
export function snapshot(files,revision){return {revision,collections:Object.fromEntries(names.map(n=>[n,files[datasetPath(n)][n]])),authorization:get(files,'authorization'),changes:files['data_storytelling/change.json'],annotations:editorialRows(files,'annotation'),change_reviews:editorialRows(files,'change_review')};}

function approveChanges(original, entries, actor, staged=false) {
 const bad=message=>{const e=new Error(message);e.status=400;throw e;};
 const fail=message=>{const e=new Error(message);e.status=409;throw e;};
 if(!Array.isArray(entries)||!entries.length||entries.length>1000)bad('Select between 1 and 1000 proposals.');
 const files=staged?original:stageFiles(original),index=new Map(records(files).map(r=>[r.id,r]));
 const pending=get(files,'change'),decisions=get(files,'authorization_decision'),auth=get(files,'authorization');
 const seen=new Set(),targetIds=new Set(),selected=[];
 for(const entry of entries){
  if(!entry||typeof entry.change_id!=='string'||typeof entry.proposal_sha256!=='string'||seen.has(entry.change_id))bad('Invalid or duplicate proposal selection.');
  seen.add(entry.change_id);
  const proposal=pending.find(p=>p.id===entry.change_id);
  if(!proposal){
   if(decisions.some(d=>d.action==='approve_change'&&d.change_id===entry.change_id&&d.proposal_sha256===entry.proposal_sha256))continue;
   fail('A selected proposal is no longer pending. Reload and review the changes.');
  }
  if(hash(proposal)!==entry.proposal_sha256)fail('A selected proposal has changed. Reload and review it again.');
  if(proposal.category==='discussion')fail('Discussion entries cannot be authorized. Provide remarks so a concrete change can be proposed.');
  if(latestReview(files,proposal.id,hash(proposal))?.state==='needs_refinement')fail('This proposal needs refinement. Prepare a revised proposal before authorization.');
  if(proposal.category==='schema')fail('Schema proposals require a separately reviewed schema deployment.');
  if(!Array.isArray(proposal.elements)||!proposal.elements.length)bad('A selected proposal has no changes.');
  for(const e of proposal.elements){
   if(!e||!names.includes(e.record_type)||typeof e.record_id!=='string'||e.record_id.split('.')[0]!==e.record_type||!Object.hasOwn(e,'before')||!Object.hasOwn(e,'after'))bad('Invalid proposal element.');
   if(targetIds.has(e.record_id))fail('Selected proposals overlap on '+e.record_id+'. Review and save them separately.');
   targetIds.add(e.record_id);
   if(hash(index.get(e.record_id)??null)!==hash(e.before))fail('A before record has changed. Reload and review the proposal.');
   if(e.after!==null&&(typeof e.after!=='object'||e.after.id!==e.record_id))fail('Record identity cannot change.');
  }
  selected.push(proposal);
 }
 if(!selected.length)return {files,changed:false};
 for(const proposal of selected){
  const dependencies=proposal.depends_on_change_ids||[];
  if(!Array.isArray(dependencies)||dependencies.some(id=>typeof id!=='string'||id===proposal.id))bad('Invalid proposal dependencies.');
  for(const id of dependencies)if(!selected.some(p=>p.id===id)&&!decisions.some(d=>d.action==='approve_change'&&d.change_id===id))fail('Select required proposal '+id+' before authorization.');
 }
 // Apply every selected proposal before validating, allowing references between new records.
 for(const proposal of selected){
  for(const e of proposal.elements){
   const rows=files[datasetPath(e.record_type)][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);
   if(e.after===null){if(i>=0)rows.splice(i,1);}else if(i>=0)rows[i]=e.after;else rows.push(e.after);
  }
  resolveAnnotations(files,proposal,actor);
  pending.splice(pending.indexOf(proposal),1);
  // Retain the existing audit schema: one complete decision per reviewed proposal.
  const id='authorization_decision.'+crypto.randomUUID();
  for(const e of proposal.elements){
   const i=auth.findIndex(a=>a.record_id===e.record_id);if(i>=0)auth.splice(i,1);
   if(e.after)auth.push({id:'authorization.'+e.record_id.replaceAll('.','_'),record_id:e.record_id,state:'authorized',content_sha256:hash(e.after),decision_id:id});
  }
  decisions.push({id,action:'approve_change',actor,decided_at:new Date().toISOString(),change_id:proposal.id,proposal_sha256:hash(proposal),proposal,target:proposal.elements.map(e=>({record_id:e.record_id,before:e.before,after:e.after,content_sha256:e.after?hash(e.after):null}))});
 }
 const result=validate(files);
 if(result.errors.length)fail('The selected changes would make the story invalid: '+result.errors.slice(0,5).join('; '));
 return {files,changed:true};
}

// Stage the entire review in memory; the HTTP layer persists only the final result.
function saveReview(original,request,actor){
 const fail=(message,status=409)=>{throw Object.assign(Error(message),{status});};
 const {approvals=[],removals=[],feedback=[]}=request,seen=new Set();
 if(![approvals,removals,feedback].every(Array.isArray)||![approvals,removals,feedback].some(a=>a.length)||approvals.length+removals.length+feedback.length>1000)fail('Select between 1 and 1000 review decisions.',400);
 for(const entry of [...approvals,...removals,...feedback]){
  if(!entry||typeof entry.change_id!=='string'||!/^[a-f0-9]{64}$/.test(entry.proposal_sha256)||seen.has(entry.change_id))fail('Invalid or duplicate review decision.',400);
  seen.add(entry.change_id);
 }
 let files=stageFiles(original),changed=false;
 const pending=get(files,'change'),decisions=get(files,'authorization_decision'),removed=[];
 for(const entry of removals){
  const proposal=pending.find(p=>p.id===entry.change_id);
  if(!proposal){if(decisions.some(d=>d.action==='remove_change'&&d.change_id===entry.change_id&&d.proposal_sha256===entry.proposal_sha256))continue;fail('A proposal selected for removal is no longer pending. Reload and review the changes.');}
  if(hash(proposal)!==entry.proposal_sha256)fail('A proposal selected for removal has changed. Reload and review it again.');
  removed.push(proposal);
 }
 const removedIds=new Set(removed.map(p=>p.id));
 for(const p of pending)if(!removedIds.has(p.id)&&p.depends_on_change_ids?.some(id=>removedIds.has(id)))fail('Cannot remove a required proposal while '+p.id+' depends on it. Remove its dependents together or revise them first.');
 for(const proposal of removed){
  pending.splice(pending.indexOf(proposal),1);
  decisions.push({id:'authorization_decision.'+crypto.randomUUID(),action:'remove_change',actor,decided_at:new Date().toISOString(),change_id:proposal.id,proposal_sha256:hash(proposal),proposal,target:[]});changed=true;
 }
 if(feedback.length){const result=saveEditorial(files,{action:'save_review_feedback',entries:feedback},actor,true);files=result.files;changed||=result.changed;}
 if(approvals.length){const result=approveChanges(files,approvals,actor,true);files=result.files;changed||=result.changed;}
 const result=validate(files);if(result.errors.length)fail('The review could not be saved: '+result.errors.slice(0,5).join('; '));
 return {files,changed};
}

export function transact(original,request,actor='author'){
 if(request.action==='save_review')return saveReview(original,request,actor);
 if(['save_annotations','save_review_feedback'].includes(request.action)){
  const result=saveEditorial(original,request,actor),validation=validate(result.files);
  if(validation.errors.length)throw Object.assign(Error('Invalid feedback: '+validation.errors.slice(0,5).join('; ')),{status:400});
  return result;
 }
 if(request.action==='approve_changes')return approveChanges(original,request.changes,actor);
 if(request.action==='approve_change')return approveChanges(original,[request],actor);
 const files=stageFiles(original);const index=new Map(records(files).map(r=>[r.id,r]));const auth=get(files,'authorization');const decisions=get(files,'authorization_decision');const targets=[];let proposal=null;
 const fail=message=>{const e=new Error(message);e.status=409;throw e;};
 if(request.action==='authorize_record'||request.action==='authorize_records'){
  const entries=request.action==='authorize_record'?[request]:request.records;
  if(!Array.isArray(entries)||!entries.length||entries.length>1000){const e=new Error('Select between 1 and 1000 records.');e.status=400;throw e;}
  const seen=new Set();
  for(const entry of entries){
   if(!entry||typeof entry.record_id!=='string'||seen.has(entry.record_id))fail('Invalid or duplicate record selection.');
   seen.add(entry.record_id);
   const record=index.get(entry.record_id);if(!record||hash(record)!==entry.content_sha256)fail('A selected record has changed. Reload and review the current content.');
   if(!auth.some(a=>a.record_id===record.id&&a.state==='authorized'&&a.content_sha256===hash(record)))targets.push({record_id:record.id,before:record,after:record});
  }
  if(!targets.length)return {files,changed:false};
 }else{const e=new Error('Unsupported authorization action');e.status=400;throw e;}
 const id='authorization_decision.'+crypto.randomUUID();
 for(const target of targets){const i=auth.findIndex(a=>a.record_id===target.record_id);if(i>=0)auth.splice(i,1);if(target.after)auth.push({id:'authorization.'+target.record_id.replaceAll('.','_'),record_id:target.record_id,state:'authorized',content_sha256:hash(target.after),decision_id:id});}
 decisions.push({id,action:request.action,actor,decided_at:new Date().toISOString(),...(proposal?{change_id:proposal.id,proposal_sha256:hash(proposal),proposal}:{}),target:targets.map(t=>({record_id:t.record_id,before:t.before,after:t.after,content_sha256:t.after?hash(t.after):null}))});
 const result=validate(files);if(result.errors.length)fail('The change would make the story invalid: '+result.errors.slice(0,5).join('; '));
 return {files,changed:true};
}
