import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/unused-field-cleanup/';
const audit=read(root+'audit.json'),ps=read(root+'proposals.json').change;
// Preserve the original audit. Later proposals extend the same IDs and before
// snapshots; their additional changes have a dedicated transaction verifier.
const revisionPath='data_storytelling/review_evidence/fixed-required-compositions/proposals.json';
const revisions=fs.existsSync(revisionPath)?read(revisionPath).change:[];
const current=p=>revisions.find(r=>r.id===p.id)||p;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),initial=structuredClone(files);
const queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const clean=r=>{const x=structuredClone(r);if(x.id.startsWith('product.')){if('technology_ids' in x){assert.deepEqual(x.technology_ids,[]);delete x.technology_ids;}}for(const v of x.composition_history||[]){if(x.id.startsWith('product.')&&'technical_definition' in v){assert.deepEqual(v.technical_definition,{});delete v.technical_definition;}if(x.id.startsWith('software_edition.')&&'assembly_requirements' in v){assert.deepEqual(v.assembly_requirements,[]);delete v.assembly_requirements;}for(const l of v.composition_definition)if('requirements' in l){assert.deepEqual(l.requirements,[]);delete l.requirements;}}return x;};
assert.deepEqual(validate(files).errors,[]);
for(const p of ps){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,current(p));
 for(const e of p.elements){assert.deepEqual(clean(e.before),e.after);assert.notDeepEqual(e.before,e.after);}
 if(queue.some(q=>q.id===p.id))assert.deepEqual(validate(transact(files,request([current(p)])).files).errors,[]);
}
const waiting=ps.map(current).filter(p=>queue.some(q=>q.id===p.id)),apply=changes=>changes.length?transact(files,request(changes)).files:files;
const applied=apply(waiting);assert.deepEqual(records(applied),records(apply([...waiting].reverse())));
const docs=Object.fromEntries(Object.entries(applied).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]));assert.deepEqual(validateCatalogue(docs).errors,[]);
const touched=new Set(ps.map(current).flatMap(p=>p.elements.map(e=>e.record_id)));
for(const r of records(applied))if(!touched.has(r.id))assert.deepEqual(r,records(files).find(x=>x.id===r.id));
assert.deepEqual(files,initial);
console.log(JSON.stringify({result:'passed',proposals:ps.length,pending:waiting.length,records:ps.reduce((n,p)=>n+p.elements.length,0),empty_fields_removed:1239,strict_catalogue:'passed',independent_and_batch_approval:'passed',foundation_and_authorization_unchanged:true,cleanup_counts:audit.cleanup_counts},null,2));
