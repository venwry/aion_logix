import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const proposal=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/aion-memory-production/proposals.json')).change[0];
const lineId='manufacturing_capability.aion_cambridge_nmos_line';
function fixture(){const docs=readDocuments('data_foundation');for(const e of proposal.elements){const list=docs[e.record_type][e.record_type],i=list.findIndex(r=>r.id===e.record_id);if(i>=0)list.splice(i,1);if(e.after)list.push(structuredClone(e.after));}return docs;}
function check(change){const docs=fixture(),line=docs.manufacturing_capability.manufacturing_capability.find(r=>r.id===lineId);change(line,docs);return validateDocuments(docs).errors.join('\n');}
test('legacy recipes and proposed shared production line both validate',()=>{assert.deepEqual(validateDocuments(readDocuments('data_foundation')).errors,[]);assert.equal(check(()=>{}),'');});
test('recipe links must resolve to a physical line at the same operator and location',()=>{
 for(const mutate of [r=>r.production_line_id='manufacturing_capability.aion_sram_3um',r=>r.location_id='location.cambridge',r=>r.actor_id='actor.logix'])assert.match(check((_,d)=>mutate(d.manufacturing_capability.manufacturing_capability.find(r=>r.id==='manufacturing_capability.aion_dram16_3um'))),/production line|same operator/);
});
test('production lines cannot silently become recipes or create equipment on recipes',()=>{
 for(const mutate of [r=>r.recipe_kind='DRAM',r=>r.production_line_id=lineId,r=>r.base_part_ids=['base_part.aion_4116'],r=>delete r.configuration_history,r=>r.capability_kind='recipe'])assert(check(mutate));
});
test('configuration dates, versions, equipment counts and identities are checked',()=>{
 for(const mutate of [r=>r.configuration_history[0].effective_from='1975-02-30',r=>r.configuration_history[0].effective_until=null,r=>r.configuration_history[0].effective_until='1978-01-01',r=>r.configuration_history[1].version_number=1,r=>r.configuration_history[0].equipment[0].quantity=0,r=>r.configuration_history[0].equipment.push({...r.configuration_history[0].equipment[0]}),r=>r.configuration_history[0].constraints.push({...r.configuration_history[0].constraints[0]})])assert(check(mutate));
});
test('configuration narratives use the shared parameter and reference contract',()=>{
 for(const mutate of [s=>s.chapters[0].description+=' {missing}',s=>s.parameters.push({key:'unused',value:1}),s=>s.parameters.push({...s.parameters[0]}),s=>{s.parameters[0]={key:'wafer_diameter_mm',ref_id:'base_part.missing',ref_role:'Wafer input'};}])assert(check(r=>mutate(r.configuration_history[0].technical_specification)));
 assert.equal(check(r=>{const s=r.configuration_history[0].technical_specification;s.parameters.push({key:'dram',ref_id:'base_part.aion_4116',ref_role:'Recipe output example'});s.chapters[0].description+=' Example output: {dram}.';}),'');
});
