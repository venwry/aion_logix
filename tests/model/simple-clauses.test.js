import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {hash,transact} from '../../server/model.js';
const fixture=()=>readDocuments('data_foundation');
const simple=()=>({id:'clause.simple_test',kind:'rights',statement:'The founders manage the company independently.',value:null,unit:null});
function withClause(c){const d=fixture();d.agreement.agreement[0].clauses=[c];return d;}
test('simple clauses accept quantities, ranges, targets and non-quantitative terms',()=>{
 for(const c of [simple(),{...simple(),value:30,unit:'percent of fully diluted DRI shares'},{...simple(),kind:'target_funding',value:'25–35',unit:'percent target sourcing share'}])assert.deepEqual(validateDocuments(withClause(c)).errors,[]);
});
test('simple clauses reject missing fields, hybrids, invalid targets and unpaired units',()=>{
 const missing=simple();delete missing.value;
 for(const c of [missing,{...simple(),assertion_mode:'commitment'},{...simple(),actor_ids:[]},{...simple(),kind:'target_unrecognized'},{...simple(),unit:'USD'},{...simple(),value:100},{...simple(),value:100,unit:''}])assert(validateDocuments(withClause(c)).errors.length,JSON.stringify(c));
});
test('legacy clause representation is rejected after retirement',()=>{
 const c={id:'clause.legacy_test',kind:'rights',statement:'Legacy term.',assertion_mode:'commitment',actor_ids:['actor.adam']};
 assert(validateDocuments(withClause(c)).errors.length);
 assert(validateDocuments(withClause({...c,actor_ids:['actor.missing']})).errors.length);
});
test('new clause duplicates remain invalid and whole agreement hash covers quantities',()=>{
 const d=withClause(simple());d.agreement.agreement[0].clauses.push(simple());assert(validateDocuments(d).errors.some(e=>e.includes('Duplicate ID')));
 const a=withClause(simple()).agreement.agreement[0],before=hash(a);a.clauses[0].value=30;a.clauses[0].unit='percent';assert.notEqual(hash(a),before);
});
test('a simplified agreement can be approved alongside current agreements',()=>{
 const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>[dir+'/'+p,JSON.parse(fs.readFileSync(dir+'/'+p))])));
 const before=files['data_foundation/agreement.json'].agreement[0],after={...structuredClone(before),clauses:[simple()]};
 const proposal={id:'change.simple_clause_test',category:'story',title:'Simplify clauses',reason:'Test transition',elements:[{record_type:'agreement',record_id:before.id,before,after}]};
 files['data_storytelling/change.json'].change=[proposal];
 const result=transact(files,{action:'approve_change',change_id:proposal.id,proposal_sha256:hash(proposal)});
 assert(result.changed);assert.deepEqual(result.files['data_foundation/agreement.json'].agreement[0],after);
 assert(result.files['data_storytelling/authorization.json'].authorization.some(a=>a.record_id===after.id&&a.content_sha256===hash(after)));
});
