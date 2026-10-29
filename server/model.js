import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import crypto from 'node:crypto';
import {validateDocuments} from '../tools/validate-model.js';
const editorialValidator=new Ajv2020({allErrors:true,strict:false});addFormats(editorialValidator);
const checks=Object.fromEntries(['authorization','authorization_decision'].map(n=>[n,editorialValidator.compile(JSON.parse(fs.readFileSync(new URL('../schemas/storytelling/'+n+'.schema.json',import.meta.url))))]));
export const names=['actor','assumption','event','agreement','clause','campaign','process','programme','actor_relationship','location','narrative_period'];
export const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
export const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
export const records=files=>names.flatMap(n=>files[`data_foundation/${n}.json`][n]);
export const get= (files,name)=>files[`data_storytelling/${name}.json`][name];
export function validate(files){
 const result=validateDocuments(Object.fromEntries(names.map(n=>[n,files[`data_foundation/${n}.json`]])));
 for(const [name,check] of Object.entries(checks))if(!check(files[`data_storytelling/${name}.json`]))result.errors.push(name+': '+editorialValidator.errorsText(check.errors));
 const index=new Map(records(files).map(r=>[r.id,r]));const seen=new Set();
 for(const a of get(files,'authorization')){if(seen.has(a.record_id))result.errors.push('Duplicate authorization');seen.add(a.record_id);if(!index.has(a.record_id))result.errors.push('Orphan authorization '+a.record_id);if(!['authorized','unauthorized'].includes(a.state))result.errors.push('Invalid authorization state');if(!/^[a-f0-9]{64}$/.test(a.content_sha256))result.errors.push('Invalid content hash');}
 for(const record of index.values())if(['status','confirmation','source_refs'].some(k=>k in record))result.errors.push('Editorial information in foundation '+record.id);
 return result;
}
export function snapshot(files,revision){return {revision,collections:Object.fromEntries(names.map(n=>[n,files[`data_foundation/${n}.json`][n]])),authorization:get(files,'authorization'),changes:files['data_storytelling/change.json']};}
export function transact(original,request,actor='author'){
 const files=structuredClone(original);const index=new Map(records(files).map(r=>[r.id,r]));const auth=get(files,'authorization');const decisions=get(files,'authorization_decision');const targets=[];let proposal=null;
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
 }else if(request.action==='approve_change'){
  const list=get(files,'change');proposal=list.find(p=>p.id===request.change_id);
  if(!proposal){if(decisions.some(d=>d.change_id===request.change_id&&d.proposal_sha256===request.proposal_sha256))return {files,changed:false};fail('This proposal is no longer pending.');}
  if(hash(proposal)!==request.proposal_sha256)fail('This proposal has changed. Reload and review it again.');
  if(proposal.category==='schema')fail('Schema proposals require a separately reviewed schema deployment.');
  for(const e of proposal.elements){if(!names.includes(e.record_type)||e.record_id.split('.')[0]!==e.record_type||hash(index.get(e.record_id)??null)!==hash(e.before))fail('A before record has changed. Reload and review the proposal.');if(e.after&&e.after.id!==e.record_id)fail('Record identity cannot change.');targets.push(e);}
  for(const e of targets){const rows=files[`data_foundation/${e.record_type}.json`][e.record_type];const i=rows.findIndex(r=>r.id===e.record_id);if(e.after===null){if(i>=0)rows.splice(i,1);}else if(i>=0)rows[i]=e.after;else rows.push(e.after);}
  list.splice(list.indexOf(proposal),1);
 }else{const e=new Error('Unsupported authorization action');e.status=400;throw e;}
 const id='authorization_decision.'+crypto.randomUUID();
 for(const target of targets){const i=auth.findIndex(a=>a.record_id===target.record_id);if(i>=0)auth.splice(i,1);if(target.after)auth.push({id:'authorization.'+target.record_id.replaceAll('.','_'),record_id:target.record_id,state:'authorized',content_sha256:hash(target.after),decision_id:id});}
 decisions.push({id,action:request.action,actor,decided_at:new Date().toISOString(),...(proposal?{change_id:proposal.id,proposal_sha256:hash(proposal),proposal}:{}),target:targets.map(t=>({record_id:t.record_id,before:t.before,after:t.after,content_sha256:t.after?hash(t.after):null}))});
 const result=validate(files);if(result.errors.length)fail('The change would make the story invalid: '+result.errors.slice(0,5).join('; '));
 return {files,changed:true};
}
