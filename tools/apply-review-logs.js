import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {recordHash, readDocuments} from './validate-model.js';
export const stable = x => Array.isArray(x) ? x.map(stable) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k,stable(x[k])])) : x;
export const transportHash = x => crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
export function verifyLogs(documents, schemas, manifest, confirmations, approvals) {
 const index=new Map(Object.values(documents).flatMap(d=>Object.values(d).find(Array.isArray)).map(r=>[r.id,r]));
 const proposals=new Map(manifest.change.map(p=>[p.id,p]));
 const seen=new Set(), changed=new Set();
 for(const [log,kind] of [[confirmations,'record-confirmations'],[approvals,'change-approvals']]) {
  if(log.format!=='aion-author-review'||log.format_version!==1||log.repository!=='venwry/aion_logix'||log.kind!==kind||!Array.isArray(log.decisions))throw Error('Unsupported approval log');
  for(const d of log.decisions){
   if(!Number.isFinite(Date.parse(d.approved_at)))throw Error('Invalid approval timestamp');
   if(kind==='record-confirmations'){
    if(d.action!=='confirm_record'||d.requested_status!=='confirmed'||d.record_id!==d.record?.id||d.previous_status!==d.record.status||d.record_type!==d.record_id.split('.')[0]||!same(index.get(d.record_id),d.record)||transportHash(d.record)!==d.record_sha256)throw Error('Stale or invalid confirmation: '+d.record_id);
    if(seen.has(d.record_id))throw Error('Duplicate confirmation');seen.add(d.record_id);
   }else{
    const p=proposals.get(d.change_id);
    if(!p||!same(p,d.proposal)||transportHash(p)!==d.proposal_sha256||d.action!==(p.category==='schema'?'approve_schema_extension':'approve_change'))throw Error('Stale or invalid proposal: '+d.change_id);
    if(seen.has(d.change_id))throw Error('Duplicate approval');seen.add(d.change_id);
    for(const e of p.elements){
     const current=e.record_type==='schema'?e.path.split('/').slice(1).reduce((v,k)=>v?.[k],schemas[e.record_id])??null:index.get(e.record_id)??null;
     if(!same(current,e.before))throw Error('Stale before snapshot: '+e.record_id);
     if(e.record_type!=='schema'){if(changed.has(e.record_id))throw Error('Overlapping change groups');changed.add(e.record_id);}
    }
   }
  }
 }
 return [...changed].filter(id=>confirmations.decisions.some(d=>d.record_id===id));
}
export function applyLogs(documents, schemas, manifest, confirmations, approvals, {confirmRevised=false}={}) {
 const overlap=verifyLogs(documents,schemas,manifest,confirmations,approvals);
 const docs=structuredClone(documents), nextSchemas=structuredClone(schemas);
 const index=new Map(Object.values(docs).flatMap(d=>Object.values(d).find(Array.isArray)).map(r=>[r.id,r]));
 const sourceId='source.author_review_20261027';
 const source={id:sourceId,status:'confirmed',kind:'author_decision',title:'Author confirmation and change approval logs, 27 October 2026',citation:'User-submitted approval files archived under docs/review/history/2026-10-27/. Exact transport hashes and before snapshots verified against ed069bd.'};
 source.confirmation={source_id:sourceId,record_sha256:recordHash(source)};docs.source.source.push(source);
 function review(key,decision,record,note){const r={id:'review_decision.'+key,status:'confirmed',source_refs:[{source_id:sourceId,note}],source_id:sourceId,decision,target:[{record_id:record.id,record_sha256:recordHash(record)}],rationale:note};r.confirmation={source_id:sourceId,record_sha256:recordHash(r)};docs.review_decision.review_decision.push(r);}
 for(const d of approvals.decisions){
  for(const e of d.proposal.elements){
   if(e.record_type==='schema'){const keys=e.path.split('/').slice(1);const field=keys.pop();const parent=keys.reduce((v,k)=>v[k],nextSchemas[e.record_id]);parent[field]=structuredClone(e.after);continue;}
   const list=docs[e.record_type][e.record_type], i=list.findIndex(r=>r.id===e.record_id), r=structuredClone(e.after);
   if(i<0)list.push(r);else list[i]=r;index.set(r.id,r);
   review(d.change_id.replace('change.','revise_')+'_'+e.record_id.replaceAll('.','_'),'revise',r,'Author approved '+d.change_id+' at '+d.approved_at+'. Edit approval does not independently confirm revised story content.');
  }
 }
 for(const d of confirmations.decisions){
  if(overlap.includes(d.record_id)&&!confirmRevised)continue;
  const r=index.get(d.record_id);r.status='confirmed';r.confirmation={source_id:sourceId,record_sha256:recordHash(r),note:'Explicit record confirmation at '+d.approved_at+(overlap.includes(r.id)?'; revised content explicitly reconfirmed in chat.':'.')};
  review('confirm_'+r.id.replaceAll('.','_'),'confirm',r,'Author confirmed the record in the uploaded log'+(overlap.includes(r.id)?' and explicitly confirmed its revised description in chat.':'.'));
 }
 nextSchemas.common.$defs.metadata.properties.schema_version={enum:['0.1.0','0.2.0']};
 for(const d of Object.values(docs))d.metadata.schema_version='0.2.0';
 return {documents:docs,schemas:nextSchemas,overlap,deferred_confirmations:confirmRevised?[]:overlap};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const dir=process.argv[2];if(!dir)throw Error('Usage: node tools/apply-review-logs.js HISTORY_DIRECTORY [--confirm-revised]');
 const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
 const result=applyLogs(readDocuments('data'),Object.fromEntries(Object.entries(readDocuments('schemas')).map(([name,s])=>[name.replace('.schema',''),s])),read('proposals.json'),read('record-confirmations.json'),read('change-approvals.json'),{confirmRevised:process.argv.includes('--confirm-revised')});
 // All approval preconditions have been checked before any writes.
 for(const [name,doc] of Object.entries(result.documents))fs.writeFileSync('data/'+name+'.json',JSON.stringify(doc,null,2)+'\n');
 for(const [name,schema] of Object.entries(result.schemas))fs.writeFileSync('schemas/'+name+'.schema.json',JSON.stringify(schema,null,2)+'\n');
 console.log(JSON.stringify({overlap:result.overlap,deferred_confirmations:result.deferred_confirmations}));
}
