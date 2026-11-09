import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {checkTechnologyProse} from '../../tools/technology-prose-rules.js';
const record=(parameters,description)=>({id:'technology.prose_test',specification:[{number:1,chapter_name:'Link',description,parameters}]});
test('prose authoring checks require explained data rather than Boolean flags and statements',()=>{
 assert.deepEqual(checkTechnologyProse(record([{key:'Rates',value:'125000, 500000'}],'Supported rates are {Rates} bps.')),[]);
 assert(checkTechnologyProse(record([{key:'Feature',value:'true'}],'Feature: {Feature}.')).some(e=>e.includes('Boolean')));
 assert(checkTechnologyProse(record([{key:'Policy',value:'Logix commits to compatibility.'}],'{Policy}')).some(e=>e.includes('statement-valued')));
 assert(checkTechnologyProse(record([{key:'Rate',value:'125000'}],'Serial transport.')).some(e=>e.includes('unused')));
 assert(checkTechnologyProse(record([{key:'Rate 1',value:'125000'},{key:'Rate 2',value:'500000'}],'{Rate 1}, {Rate 2}')).some(e=>e.includes('numbered list')));
 assert(checkTechnologyProse(record([],'{Missing}')).some(e=>e.includes('missing')));
});
test('the reviewed prose fixture covers every parameter and retains meaningful repeated sequence values',()=>{
 const proposals=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/technology-prose-refinement/proposals.json')).change;
 assert.equal(proposals.length,35);for(const p of proposals)assert.deepEqual(checkTechnologyProse(p.elements[0].after),[]);
 const era=proposals.find(p=>p.elements[0].record_id==='technology.era2_architecture').elements[0].after;
 assert.equal(era.specification.find(c=>c.number===47).parameters.find(p=>p.key==='Controller target 12mhz four word refill clocks').value,'3, 2, 2, 2');
});
