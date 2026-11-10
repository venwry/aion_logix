import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {hash,transact} from '../../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const docs=()=>readDocuments('data_foundation');
test('embedded clauses belong to agreements and current foundation validates',()=>{
 const current=docs();assert.equal(current.clause,undefined);
 for(const a of current.agreement.agreement)for(const c of a.clauses){assert(c.id.startsWith('clause.'));assert.equal(c.agreement_id,undefined);}
 assert.deepEqual(validateDocuments(current).errors,[]);
});
test('agreement_id is optional and singular; arrays and empty strings are rejected',()=>{
 for(const kind of ['event','process'])for(const fields of [{agreement_ids:[]},{agreement_id:[]},{agreement_id:''},{agreement_id:'agreement.missing'}]){
  const d=docs();Object.assign(d[kind][kind][0],fields);assert(validateDocuments(d).errors.length,JSON.stringify(fields));
 }
 const d=docs();delete d.event.event[0].agreement_id;delete d.process.process[0].agreement_id;assert.deepEqual(validateDocuments(d).errors,[]);
});
const legacyDocs=()=>{
 const d=docs();const old=read('archived_no_longer_valid/model_0.4.0_agreement_migration/data_foundation/clause.json').clause;
 for(const a of d.agreement.agreement){a.clauses=old.filter(c=>c.agreement_id===a.id).map(({agreement_id,...c})=>c);}
 return d;
};
test('legacy nested clause fields are rejected without rewriting historical evidence',()=>{
 for(const mutate of [
  a=>a.clauses.push(structuredClone(a.clauses[0])),
  a=>{a.clauses[0].actor_ids=['actor.missing'];},
  a=>{a.clauses[0].supersedes_clause_id='clause.missing';},
  a=>{a.clauses[0].supersedes_clause_id=a.clauses[0].id;},
  a=>{const c=a.clauses.find(c=>c.equity);c.equity.allocation='individual';c.equity.beneficiary_actor_ids=[];},
  a=>{a.clauses[0].agreement_id=a.id;}
 ]){const d=legacyDocs(),a=d.agreement.agreement.find(a=>a.id==='agreement.dri_founding');mutate(a);assert(validateDocuments(d).errors.length);}
 const d=legacyDocs(),clauses=d.agreement.agreement[0].clauses;clauses[0].supersedes_clause_id=clauses[1].id;assert(validateDocuments(d).errors.length);
});
test('whole-agreement authorization covers nested terms and clause edits invalidate its hash',()=>{
 const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>[dir+'/'+p,read(dir+'/'+p)])));
 const agreement=files['data_foundation/agreement.json'].agreement[0],request={action:'authorize_record',record_id:agreement.id,content_sha256:hash(agreement)};
 const approved=transact(files,request).files;assert(approved['data_storytelling/authorization.json'].authorization.some(a=>a.record_id===agreement.id&&a.state==='authorized'&&a.content_sha256===hash(agreement)));
 approved['data_foundation/agreement.json'].agreement[0].clauses[0].statement+=' Revised.';
 assert.throws(()=>transact(approved,request),/changed/);
 assert.throws(()=>transact(files,{...request,record_id:agreement.clauses[0].id}),/changed/);
});
