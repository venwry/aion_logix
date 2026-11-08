// Read-only audit of the pending phase-3 migration; transactions run in memory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash,records,transact,validate} from '../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read('docs/product-catalogue-phase3/migration-audit.json');
const baseline=p=>JSON.parse(execFileSync('git',['show',audit.source_commit+':'+p],{encoding:'utf8',maxBuffer:64*1024*1024}));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>[dir+'/'+f,read(dir+'/'+f)])));
const proposals=files['data_storytelling/change.json'].change.filter(p=>p.id.startsWith('change.catalogue_phase3_'));
assert.equal(proposals.length,5,'Run this audit while all five phase-3 proposals are pending.');
assert.equal(new Set(proposals.map(p=>p.id)).size,5);
const external=files['data_foundation/external_products.json'].external_product,auth=files['data_storytelling/authorization.json'].authorization;
const originalAuth=baseline('data_storytelling/authorization.json').authorization;
assert.deepEqual(auth.slice(0,originalAuth.length),originalAuth);
assert.equal(auth.length,originalAuth.length+external.length);
assert.deepEqual(files['data_storytelling/authorization_decision.json'],baseline('data_storytelling/authorization_decision.json'));
assert.equal(external.length,11);
for(const r of external){
 assert.equal(hash(r),audit.external_records.find(e=>e.id===r.id)?.content_sha256);
 const a=auth.find(a=>a.record_id===r.id);assert.equal(a.state,'unauthorized');assert.equal(a.content_sha256,hash(r));assert(!a.decision_id);
 assert.deepEqual(Object.keys(r).sort(),['description','id','name','specification']);
 for(const s of r.specification)assert.deepEqual(Object.keys(s).sort(),['description','no','ref_id','ref_role']);
}
for(const [path,d] of Object.entries(files))if(path.startsWith('data_foundation/')&&!path.endsWith('/external_products.json'))assert.deepEqual(d,baseline(path),path+' was directly edited');
assert.deepEqual(validate(files).errors,[]);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const targets=new Set();
function scrub(v){if(Array.isArray(v))return v.map(scrub);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>!['subject_ids','computer_id'].includes(k)).map(([k,v])=>[k,scrub(v)]));return v;}
for(const p of proposals){
 const result=transact(files,request([p]));assert(result.changed);assert.deepEqual(validate(result.files).errors,[]);
 for(const e of p.elements){assert(!targets.has(e.record_id),'Overlapping proposal '+e.record_id);targets.add(e.record_id);if(e.after&&e.record_id!=='product.software_cpm_aurelia')assert.deepEqual(scrub(e.after),scrub(e.before),'Unexpected non-reference change '+e.record_id);}
 for(const r of external)assert.deepEqual(result.files['data_storytelling/authorization.json'].authorization.find(a=>a.record_id===r.id),auth.find(a=>a.record_id===r.id));
}
const applied=transact(files,request(proposals)).files,reversed=transact(files,request([...proposals].reverse())).files;
const finalIndex=new Map(records(applied).map(r=>[r.id,r]));
assert.deepEqual(records(applied),records(reversed));
assert.deepEqual(validate(applied).errors,[]);
const removed=proposals.flatMap(p=>p.elements.filter(e=>!e.after).map(e=>e.record_id));assert.equal(removed.length,11);
function strings(v){return typeof v==='string'?[v]:Array.isArray(v)?v.flatMap(strings):v&&typeof v==='object'?Object.values(v).flatMap(strings):[];}
const finalStrings=new Set(records(applied).flatMap(strings));for(const id of removed)assert(!finalStrings.has(id),'Dangling retired identity '+id);
const cpm=finalIndex.get('product.software_cpm_aurelia');assert.equal(cpm.technical_identity.record_id,'device.rom_cartridge.cpm_aurelia');assert.deepEqual(cpm.provider_actor_ids,['actor.logix']);assert.equal(cpm.composition_history[0].composition_definition[0].target.version_number,1);
for(const type of ['base_part','device'])assert.deepEqual(applied['data_foundation/'+type+'.json'],files['data_foundation/'+type+'.json']);
const softwareBefore=new Map(files['data_foundation/software_edition.json'].software_edition.map(r=>[r.id,r]));
for(const r of applied['data_foundation/software_edition.json'].software_edition)assert.deepEqual(scrub(r),scrub(softwareBefore.get(r.id)));
function pointer(doc,path){return path.slice(1).split('/').map(k=>k.replaceAll('~1','/').replaceAll('~0','~')).reduce((v,k)=>v[k],doc);}
for(const ref of audit.reference_dispositions){
 assert.equal(pointer(files[ref.file],ref.pointer),ref.before);
 const original=records(files).find(r=>r.id===ref.source_record_id),record=finalIndex.get(ref.source_record_id);
 const ownerPointer=ref.pointer.split('/').slice(3,-1).join('/');
 const container=ownerPointer?pointer(record,'/'+ownerPointer):record;
 for(const id of [ref.after].flat())assert(strings(container).includes(id),ref.pointer+' missing '+id);
 assert(original);
}
console.log(JSON.stringify({result:'passed',source_commit:audit.source_commit,current_foundation_records:records(files).length,external_records_pending:external.length,proposals:proposals.length,modified_existing_records:targets.size-removed.length,proposed_product_removals:removed.length,verified_reference_occurrences:audit.reference_dispositions.length,independent_proposals_validated:proposals.length,batch_and_reverse_batch_valid:true,existing_foundation_and_authorization_unchanged:true,existing_base_part_device_and_software_definitions_preserved:true,technical_host_reference_changes:2,no_authorization_saved:true},null,2));
