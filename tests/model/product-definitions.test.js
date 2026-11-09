import {migrateTechnologySpecification} from '../../code/technology-specification.js';
import {datasetPath,datasetForFile} from '../../code/model-contract.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {hash,transact} from '../../server/model.js';import {resolveComposition} from '../../code/composition.js';
const read=p=>JSON.parse(fs.readFileSync(p));const docs=readDocuments('data_foundation');
// Reconstruct the original pending-import review fixture from preserved decisions.
// Author approvals on main must not invalidate a regression test's starting state.
const pending=read('data_storytelling/change.json').change,decisions=read('data_storytelling/authorization_decision.json').authorization_decision;
// Later approved cartridge/BOM corrections are valid current data, but are not
// part of the pinned import inventory. Restore the entire graph to the end of
// that import before reconstructing its original pending proposals.
const importEnd=decisions.findLastIndex(d=>d.change_id?.startsWith('change.product_definition_import_'));
if(importEnd>=0)for(const d of decisions.slice(importEnd+1).filter(d=>d.action==='approve_change').reverse())for(const e of d.proposal?.elements||[]){const rows=docs[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(e.before===null){if(i>=0)rows.splice(i,1);}else if(i>=0)rows[i]=structuredClone(e.before);else rows.push(structuredClone(e.before));}
const proposals=[...new Map([...decisions.map(d=>d.proposal).filter(Boolean),...pending].filter(p=>p.id.startsWith('change.product_definition_import_')).map(p=>[p.id,p])).values()];
for(const p of proposals)for(const e of p.elements){const rows=docs[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);if(e.before===null){if(i>=0)rows.splice(i,1);}else if(i>=0)rows[i]=structuredClone(e.before);else rows.push(structuredClone(e.before));}
// The inventory fixture predates the author-directed technology format migration.
// Adapt only that unrelated representation; preserve the pinned BOM inventory.
for(const r of docs.technology.technology)r.specification=migrateTechnologySpecification(r.specification);
const files=Object.fromEntries(Object.entries(docs).map(([n,d])=>[datasetPath(n),d]));for(const n of ['authorization','authorization_decision','change','manifest','annotation','change_review'])files['data_storytelling/'+n+'.json']=read('data_storytelling/'+n+'.json');
files['data_storytelling/change.json']={change:proposals};
const fixtureRecords=new Map(Object.values(docs).flatMap(d=>Object.values(d)[0]).map(r=>[r.id,r]));
files['data_storytelling/authorization.json'].authorization=files['data_storytelling/authorization.json'].authorization.filter(a=>fixtureRecords.has(a.record_id)).map(a=>({id:a.id,record_id:a.record_id,state:'unauthorized',content_sha256:hash(fixtureRecords.get(a.record_id))}));
const result=transact(files,{action:'approve_changes',changes:proposals.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const applied=Object.fromEntries(Object.entries(result.files).filter(([p])=>p.startsWith('data_foundation/')).map(([p,d])=>[datasetForFile(p.split('/')[1]),d]));
const index=new Map(Object.values(applied).flatMap(d=>Object.values(d)[0]).map(r=>[r.id,r]));
test('all 164 imported composition inventories match the independent pinned-source audit',()=>{
 const fixtures=read('tests/fixtures/product-import-inventories.json');assert.equal(fixtures.length,164);
 for(const f of fixtures){const r=resolveComposition(index,f.record_id,f.version_number);const inventory=r.leaves.map(l=>JSON.stringify([l.record_id,l.quantity,l.unit,l.path.map(x=>x.id)])).sort();assert.equal(inventory.length,f.leaf_paths);assert.equal(crypto.createHash('sha256').update(JSON.stringify(inventory)).digest('hex'),f.inventory_sha256,f.record_id);}
});
test('new definitions are unauthorized with exact current hashes and no legacy editorial fields',()=>{
 const auth=new Map(files['data_storytelling/authorization.json'].authorization.map(a=>[a.record_id,a]));
 function inspect(v){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){assert(!/^(status|qualification_status|production_status|manufacturing_status|introduced|valid_from|valid_to|source_refs|source_commit|confirmation|cost_rollup_status)$/.test(k),k);inspect(x);}}
 for(const n of ['base_part','device','software_edition'])for(const r of docs[n][n]){const a=auth.get(r.id);assert.equal(a.state,'unauthorized');assert.equal(a.content_sha256,hash(r));assert(!a.decision_id);inspect(r);for(const v of r.composition_history||[]){assert.deepEqual(v.effective_from,{kind:'unknown'});assert.deepEqual(v.effective_until,{kind:'unknown'});}}
});
test('quantity unknowns survive traversal and services never become physical leaves',()=>{
 const r=resolveComposition(index,'product.retail.cpm_migration',1);assert(r.leaves.some(l=>l.quantity===null));assert.equal(r.quantities_complete,false);assert(r.leaves.every(l=>l.record_id.startsWith('base_part.')));
});
test('cycles, missing child versions and fractional piece quantities are rejected',()=>{
 const d=structuredClone(applied);const r=d.device.device.find(r=>r.id==='device.base_computer.artemis');r.composition_history[0].composition_definition[0].target={record_id:r.id,version_number:1};assert.match(validateDocuments(d).errors.join('\n'),/cycle/i);
 const e=structuredClone(applied);e.device.device[0].composition_history[0].composition_definition[0].quantity=.5;assert.match(validateDocuments(e).errors.join('\n'),/integers/);
 const f=structuredClone(applied);f.product.product.find(r=>r.id==='product.artemis_128_mono').composition_history[0].composition_definition[0].target.version_number=999;assert.match(validateDocuments(f).errors.join('\n'),/Missing composition version/);
});
test('host capacities, explicit version boundaries and recursive editorial fields are checked',()=>{
 const d=structuredClone(applied);const p=d.product.product.find(r=>r.id==='product.artemis_128_mono');p.composition_history[0].composition_definition.find(l=>l.connection?.socket_id==='internal_drive').quantity=100;assert.match(validateDocuments(d).errors.join('\n'),/capacity exceeded/);
 const e=structuredClone(applied);e.device.device[0].composition_history[0].effective_from={kind:'open'};assert.match(validateDocuments(e).errors.join('\n'),/start cannot be open/);
 const f=structuredClone(applied);f.base_part.base_part[0].technical_definition.status='authorized';assert.match(validateDocuments(f).errors.join('\n'),/additional properties/);
});
test('each existing-record proposal is independently applicable and never approves its referenced definitions',()=>{
 for(const p of proposals){const r=transact(files,{action:'approve_changes',changes:[{change_id:p.id,proposal_sha256:hash(p)}]});assert(r.changed);assert(r.files['data_storytelling/authorization.json'].authorization.filter(a=>/^(base_part|device|software_edition)\./.test(a.record_id)).every(a=>a.state==='unauthorized'));}
});
