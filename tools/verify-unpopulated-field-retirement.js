import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {hash,records,transact,validate} from '../server/model.js';
import {validateCatalogue} from './validate-catalogue.js';
const root='data_storytelling/review_evidence/unpopulated-field-retirement/';
const read=p=>JSON.parse(fs.readFileSync(p));
const audit=read(root+'audit.json'),proposals=read(root+'proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const initial=hash(files),queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.deepEqual(validate(files).errors,[]);
const touched=new Set();
for(const p of proposals){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,p);
 for(const e of p.elements){
  assert(!touched.has(e.record_id),'Overlapping record '+e.record_id);touched.add(e.record_id);
  const expected=structuredClone(e.before),changes=audit.deletions.filter(d=>d.record_id===e.record_id);
  assert(changes.length);
  for(const d of changes){const parts=d.path.slice(1).split('/'),key=parts.pop(),parent=parts.reduce((v,k)=>v[k],expected);assert.deepEqual(parent[key],d.before);assert(parent[key]===null||Array.isArray(parent[key])&&parent[key].length===0);delete parent[key];}
  assert.deepEqual(expected,e.after,'Only audited nulls/empty lists may be removed');
 }
 if(queue.some(q=>q.id===p.id))assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
}
const waiting=proposals.filter(p=>queue.some(q=>q.id===p.id));
const apply=ps=>ps.length?transact(files,request(ps)).files:files;
const applied=apply(waiting),reverse=apply([...waiting].reverse());
assert.deepEqual(records(applied),records(reverse));
const docs=Object.fromEntries(Object.entries(applied).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]));
assert.deepEqual(validateCatalogue(docs).errors,[]);
for(const r of records(files))if(!touched.has(r.id))assert.deepEqual(records(applied).find(x=>x.id===r.id),r);
// Compile the complete final contract independently from the transitional runtime.
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
for(const f of fs.readdirSync(root+'final-schemas'))ajv.addSchema(read(root+'final-schemas/'+f));
for(const [kind,d] of Object.entries(docs)){const check=ajv.getSchema(`https://aion-logix.invalid/schemas/${kind}.schema.json`);assert(check(d),kind+': '+ajv.errorsText(check.errors));}
for(const d of audit.deletions){
 const original=records(files).find(r=>r.id===d.record_id);
 // A shared capacity declaration remains in use elsewhere; all other restored
 // null/[] payloads must be rejected by the final contract.
 if(d.path.endsWith('/technical_definition/specification/capacity_kb'))continue;
 const kind=original.id.split('.')[0],record=structuredClone(records(applied).find(r=>r.id===original.id));
 const path=d.path.slice(1).split('/'),key=path.pop();path.reduce((v,k)=>v[k],record)[key]=d.before;
 assert(!ajv.getSchema(`https://aion-logix.invalid/schemas/${kind}.schema.json`)({[kind]:[record]}),'Final schema accepted retired '+d.path);
}
assert.equal(hash(files),initial,'Verification must not mutate source snapshots');
const watched=['data_foundation','schemas'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>d+'/'+f)).concat(['data_storytelling/authorization.json','data_storytelling/authorization_decision.json','data_storytelling/change.json','data_storytelling/manifest.json','code/model-contract.js']);
const before=new Map(watched.map(p=>[p,fs.readFileSync(p)]));
const guard=spawnSync('python3',['tools/retire-unpopulated-fields.py','--final'],{encoding:'utf8'});
assert.equal(guard.status,waiting.length?1:0,guard.stdout+guard.stderr);
for(const [p,bytes] of before)assert(bytes.equals(fs.readFileSync(p)),p+' mutated by dry-run');
// Exercise actual final retirement in a disposable checkout after simulated
// author approval. The working repository is never authorized by this verifier.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aion-retirement-'));
try{
 for(const dir of ['schemas','code','server','tools','docs'])fs.cpSync(dir,path.join(temp,dir),{recursive:true});
 for(const file of ['package.json','README.md','DATA_MODEL_PRINCIPLES.md'])fs.copyFileSync(file,path.join(temp,file));
 fs.symlinkSync(path.resolve('node_modules'),path.join(temp,'node_modules'),'dir');
 for(const [file,value] of Object.entries(applied)){const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value));}
 fs.mkdirSync(path.join(temp,root),{recursive:true});fs.copyFileSync(root+'audit.json',path.join(temp,root+'audit.json'));
 execFileSync('python3',['tools/retire-unpopulated-fields.py','--final','--apply'],{cwd:temp,stdio:'pipe'});
 const version=read(path.join(temp,'data_storytelling/manifest.json')).manifest[0].schema_version;
 const previousVersion=read('data_storytelling/manifest.json').manifest[0].schema_version;
 const alreadyRetired=fs.readdirSync(root+'final-schemas').every(file=>hash(read('schemas/'+file))===hash(read(root+'final-schemas/'+file)));
 const [major,minor]=previousVersion.split('.').map(Number);
 const expectedVersion=alreadyRetired?previousVersion:`${major}.${minor+1}.0`;
 assert.equal(version,expectedVersion);
 for(const file of fs.readdirSync(root+'final-schemas'))assert.deepEqual(read(path.join(temp,'schemas',file)),read(root+'final-schemas/'+file));
 const replay=execFileSync('python3',['tools/retire-unpopulated-fields.py','--final','--apply'],{cwd:temp,encoding:'utf8'});assert.match(replay,/already applied/);
 assert.equal(read(path.join(temp,'data_storytelling/manifest.json')).manifest[0].schema_version,version);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({result:'passed',proposals:proposals.length,pending:waiting.length,records:touched.size,deletions:audit.deletions.length,independent_and_reverse_batch_approval:'passed',strict_catalogue:'passed',final_schema_validation:'passed',restored_empty_fields_rejected:'passed',retirement_guard:'passed',actual_retirement_and_idempotency:'passed in disposable checkout',foundation_and_authorization_unchanged:true},null,2));
