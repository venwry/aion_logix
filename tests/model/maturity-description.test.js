import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';import addFormats from 'ajv-formats';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
test('maturity outcome uses prose and a capability subject without requiring the old payload',()=>{
 const docs=readDocuments('data_foundation'),e=docs.event.event[0],cap=docs.manufacturing_capability.manufacturing_capability[0].id;
 e.outcomes=[{number:1,type:'maturity_transition',description:'Review the capability for the production released stage.',subject_ids:[cap]}];
 assert.deepEqual(validateDocuments(docs).errors,[]);
 e.outcomes[0].subject_ids=[];assert.match(validateDocuments(docs).errors.join('\n'),/capability reference/);
 e.outcomes[0].subject_ids=[docs.technology.technology[0].id];assert.match(validateDocuments(docs).errors.join('\n'),/capability reference/);
});
test('final item schema rejects the entire maturity field and retains the stage-bearing prose form',()=>{
 const ajv=new Ajv2020({strict:false});addFormats(ajv);const s=read('data_storytelling/review_evidence/maturity-description/common.schema.after.json');ajv.addSchema(s);
 const check=ajv.getSchema(s.$id+'#/$defs/item');
 for(const p of read('data_storytelling/review_evidence/maturity-description/proposals.json').change)for(const e of p.elements)for(const before of e.before.outcomes.filter(o=>o.maturity)){
  const after=e.after.outcomes.find(o=>o.number===before.number);assert(check(after));assert(!check(before));
  assert.deepEqual(after.subject_ids,before.subject_ids);assert(after.description.toLowerCase().includes(before.maturity.stage.replaceAll('_',' ')));
 }
});
