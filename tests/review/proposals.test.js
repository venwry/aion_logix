import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments, validateDocuments} from '../../tools/validate-model.js';
const manifest=JSON.parse(fs.readFileSync(new URL('../../docs/review/proposals.json',import.meta.url)));
test('all proposed story edits have exact before snapshots and pass the existing model together',()=>{
 const documents=readDocuments(new URL('../../data_foundation/',import.meta.url));
 const ids=new Set();const targets=new Set();
 for(const change of manifest.change){assert(!ids.has(change.id));ids.add(change.id);assert.equal(change.status,'pending confirmation');
  if(change.category==='schema')continue;
  for(const e of change.elements){assert(!targets.has(e.record_id),'overlapping proposals require explicit dependency handling');targets.add(e.record_id);const list=documents[e.record_type][e.record_type];const i=list.findIndex(r=>r.id===e.record_id);assert.deepEqual(i<0?null:list[i],e.before);assert.equal(e.after.id,e.record_id);assert.notEqual(e.after.status,'confirmed');if(i<0)list.push(e.after);else list[i]=e.after;}
 }
 assert.deepEqual(validateDocuments(documents).errors,[]);
});
test('any still-pending schema extensions remain absent from canonical schemas',()=>{
 for(const change of manifest.change.filter(c=>c.category==='schema'))for(const e of change.elements){const schema=JSON.parse(fs.readFileSync(new URL('../../schemas/'+e.record_id+'.schema.json',import.meta.url)));const current=e.path.split('/').slice(1).reduce((v,k)=>v?.[k],schema);assert.equal(current,undefined);assert.equal(e.before,null);assert(e.after.type);}
});
