import fs from 'node:fs';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
import {hash,records,transact,validate} from '../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/maturity-description/';
const ps=read(root+'proposals.json').change,audit=read(root+'audit.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const initial=structuredClone(files),queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const ajv=new Ajv2020({strict:false});addFormats(ajv);ajv.addSchema(read(root+'common.schema.after.json'));const check=ajv.getSchema('https://aion-logix.invalid/schemas/common.schema.json#/$defs/item');
const targetSchema=structuredClone(read('schemas/common.schema.json'));delete targetSchema.$defs.item.properties.maturity;assert.deepEqual(targetSchema,read(root+'common.schema.after.json'));
assert.deepEqual(validate(files).errors,[]);let count=0;
for(const p of ps){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,p);
 for(const e of p.elements){
  const expected=structuredClone(e.before),entry=audit.events.find(r=>r.event_id===e.record_id);
  for(const line of entry.items){
   const item=expected[line.field].find(x=>x.number===line.number),after=e.after[line.field].find(x=>x.number===line.number);
   assert.equal(item.maturity.capability_id,line.capability_id);assert.equal(item.maturity.stage,line.stage);
   assert.deepEqual(item.subject_ids,[line.capability_id]);assert.deepEqual(after.subject_ids,item.subject_ids);
   assert(after.description.toLowerCase().includes(line.stage.replaceAll('_',' ')));
   if(/\breview\b/i.test(item.description))assert.match(after.description,/\breview\b/i);
   if(/\btarget\b/i.test(item.description))assert.match(after.description,/\btarget\b/i);
   assert(!check(item),'Final schema must reject legacy maturity');assert(check(after),JSON.stringify(check.errors));
   delete item.maturity;item.description=line.after_description;count++;
  }
  assert.deepEqual(e.after,expected);
 }
 if(queue.some(q=>q.id===p.id))assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
}
assert.equal(count,25);assert.equal(ps.length,21);
const waiting=ps.filter(p=>queue.some(q=>q.id===p.id)),apply=ps=>ps.length?transact(files,request(ps)).files:files;
const result=apply(waiting);assert.deepEqual(records(result),records(apply([...waiting].reverse())));assert.deepEqual(validate(result).errors,[]);
const touched=new Set(ps.flatMap(p=>p.elements.map(e=>e.record_id)));
for(const r of records(result)){
 if(!touched.has(r.id))assert.deepEqual(r,records(files).find(x=>x.id===r.id));
 for(const field of ['inputs','outcomes'])for(const item of r[field]||[])assert(!Object.hasOwn(item,'maturity'));
}
assert.deepEqual(files,initial);
// Exercise the actual post-approval schema cutover in an isolated temporary copy.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aion-maturity-retirement-'));
try{
 for(const dir of ['code','schemas','server'])fs.cpSync(dir,path.join(temp,dir),{recursive:true});
 for(const dir of ['tools','docs/data_model','data_foundation','data_storytelling'])fs.mkdirSync(path.join(temp,dir),{recursive:true});
 for(const file of ['package.json','README.md','DATA_MODEL_PRINCIPLES.md','docs/README.md','docs/data_model/MODEL_GUIDE.md','docs/data_model/REFERENCE_RULES.md','docs/data_model/STORYTELLING_FILE_REFERENCE.md','docs/data_model/CATALOGUE_VALIDATION.md','tools/retire-maturity-schema.js','tools/generate-foundation-spec.js','tools/validate-foundation.js','tools/validate-model.js'])fs.copyFileSync(file,path.join(temp,file));
 fs.symlinkSync(fs.realpathSync('node_modules'),path.join(temp,'node_modules'),'dir');
 for(const [file,doc] of Object.entries(result))fs.writeFileSync(path.join(temp,file),JSON.stringify(doc,null,2)+'\n');
 const output=execFileSync(process.execPath,['tools/retire-maturity-schema.js','--apply'],{cwd:temp,encoding:'utf8'});assert.match(output,/Retired maturity from schema|Maturity is already retired/);
 assert(!read(path.join(temp,'schemas/common.schema.json')).$defs.item.properties.maturity);
 for(const [file,doc] of Object.entries(result))if(file.startsWith('data_foundation/')||/authorization/.test(file))assert.deepEqual(read(path.join(temp,file)),doc);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
console.log(JSON.stringify({result:'passed',events:ps.length,outcomes:count,pending:waiting.length,capability_references:'preserved',stage_mentions:'25 of 25',independent_and_batch_approval:'passed',final_schema_retirement:'passed in isolated copy',live_foundation_and_authorizations:'unchanged'},null,2));
