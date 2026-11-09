import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {validateCompositions} from '../../code/composition.js';
const fresh=()=>readDocuments('data_foundation');
test('assumption topic and statements replace the legacy statement as a complete form',()=>{
 const d=fresh(),r=d.assumption.assumption[0];delete r.statement;r.topic='Secret identity';r.statements=['Preserve the assumed identity.','Keep the origin private.'];
 assert.deepEqual(validateDocuments(d).errors,[]);
 r.statement='Duplicated legacy text';assert(validateDocuments(d).errors.length);delete r.statement;
 r.statements=[];assert(validateDocuments(d).errors.length);r.statements=['Valid'];delete r.topic;assert(validateDocuments(d).errors.length);
});
const version=(n,from,until)=>({version_number:n,effective_from:from,effective_until:until,composition_definition:[],technical_definition:{}});
const event=id=>({kind:'event',event_id:id});
const end={kind:'simulation_end'};
function graph(versions){return new Map([
 ['device.test',{id:'device.test',composition_history:versions}],
 ['event.first',{id:'event.first',time:{value:'1980-01-01',precision:'day'}}],
 ['event.revision',{id:'event.revision',time:{value:'1981-01-01',precision:'day'}}],
 ['event.gap',{id:'event.gap',time:{value:'1981-02-01',precision:'day'}}],
 ['event.horizon',{id:'event.horizon',time:{value:'1995-01-01',precision:'day'}}]
]);}
test('simulation horizon permits contiguous revisions and rejects gaps and misplaced ends',()=>{
 assert.deepEqual(validateCompositions(graph([version(1,event('event.first'),event('event.revision')),version(2,event('event.revision'),end)])),[]);
 assert.match(validateCompositions(graph([version(1,event('event.first'),event('event.revision')),version(2,event('event.gap'),end)])).join('\n'),/share a boundary/);
 assert.match(validateCompositions(graph([version(1,end,end)])).join('\n'),/start cannot/);
 assert.match(validateCompositions(graph([version(1,event('event.first'),end),version(2,event('event.revision'),end)])).join('\n'),/only valid for the final/);
 assert.match(validateCompositions(graph([version(1,event('event.horizon'),end)])).join('\n'),/at or after simulation end/);
});
test('the schema admits the horizon token but rejects arbitrary date fields',()=>{
 const d=fresh(),v=d.product.product.find(r=>r.composition_history?.length).composition_history.at(-1);
 v.effective_until={kind:'simulation_end'};assert.deepEqual(validateDocuments(d).errors,[]);
 v.effective_until.value='1995-01-01';assert(validateDocuments(d).errors.length);
});
