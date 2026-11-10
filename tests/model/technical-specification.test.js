import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateTechnicalSpecifications} from '../../code/technical-specification.js';
import {validateCompositions} from '../../code/composition.js';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const proposals=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/technical-narrative-refinement/proposals.json')).change;
const migrated=new Map(proposals.flatMap(p=>p.elements.map(e=>[e.record_id,e.after])));
const allDocs=readDocuments('data_foundation');
for(const p of proposals)for(const e of p.elements){const rows=allDocs[e.record_type][e.record_type];rows[rows.findIndex(r=>r.id===e.record_id)]=e.after;}
const index=new Map(Object.values(allDocs).flatMap(d=>Object.values(d).flat().map(r=>[r.id,r])));
function changed(id,edit){const copy=new Map(index),r=structuredClone(index.get(id));edit(r);copy.set(id,r);return copy;}
const ram='device.ram_64kb_x32',chip='base_part.dram_16kbit',card='device.artemis_video_card_64kb';
test('both current and migrated catalogue validate including typed reference branches',()=>{
 assert.deepEqual(validateDocuments(readDocuments('data_foundation')).errors,[]);assert.deepEqual(validateDocuments(allDocs).errors,[]);
 const docs=structuredClone(allDocs);docs.device.device.find(r=>r.id===ram).technical_specification.parameters.find(p=>p.key==='chip_type_id').ref_id='technology.missing';assert(validateDocuments(docs).errors.some(x=>/unresolved reference|chip_type_id/.test(x)));
});
test('RAM checks use canonical keys independent of order and chapter labels',()=>{
 let copy=changed(ram,r=>{r.technical_specification.parameters.reverse();r.technical_specification.chapters[0].chapter_name='Memory';});assert.deepEqual(validateTechnicalSpecifications(copy),[]);
 for(const [key,value] of [['chips','32'],['chips',31],['capacity_kb',63]]){copy=changed(ram,r=>r.technical_specification.parameters.find(p=>p.key===key).value=value);assert(validateTechnicalSpecifications(copy).some(x=>/numeric|arithmetic/.test(x)));}
 copy=changed(ram,r=>r.technical_specification.parameters=r.technical_specification.parameters.filter(p=>p.key!=='chips'));assert(validateTechnicalSpecifications(copy).some(x=>/missing RAM parameter chips/.test(x)));
 copy=changed(chip,r=>r.technical_specification.parameters=r.technical_specification.parameters.filter(p=>p.key!=='capacity_kbit'));assert(validateTechnicalSpecifications(copy).some(x=>/chip needs capacity_kbit/.test(x)));
 copy=changed(ram,r=>r.technical_specification.parameters.find(p=>p.key==='capacity_kb').value=null);assert.deepEqual(validateTechnicalSpecifications(copy),[]);
});
test('parameter names, placeholders, reference roles and unused values are validated',()=>{
 for(const edit of [r=>r.technical_specification.parameters.push({...r.technical_specification.parameters[0]}),r=>r.technical_specification.chapters[0].description+=' {missing}',r=>r.technical_specification.parameters.push({key:'unused',value:1}),r=>r.technical_specification.parameters.find(p=>p.ref_id).ref_role=''])assert(validateTechnicalSpecifications(changed(ram,edit)).length);
});
test('text pages retain allocation padding and bitmap stride/framebuffer checks remain active',()=>{
 assert.deepEqual(validateTechnicalSpecifications(index),[]);
 for(const edit of [r=>r.graphic_modes_specification.find(m=>m.type==='bitmap').parameters.find(p=>p.key==='stride_bytes').value=1,r=>r.graphic_modes_specification.find(m=>m.type==='bitmap').framebuffer_size=1,r=>r.graphic_modes_specification.find(m=>m.type==='text').framebuffer_size=1,r=>r.graphic_modes_specification[0].parameters.push({key:'width',value:9})])assert(validateTechnicalSpecifications(changed(card,edit)).length);
 const text=index.get(card).graphic_modes_specification.find(m=>m.type==='text'&&m.width===640);assert.equal(text.framebuffer_size,4096);
});
test('relocated sockets still enforce compatibility, capacity and installation multiples',()=>{
 assert.deepEqual(validateCompositions(index),[]);
 const bad=changed('device.base_computer.artemis',r=>r.composition_history[0].expansion_socket_groups.find(g=>g.id==='memory').sockets[0].capacity=1);
 assert(validateCompositions(bad).some(x=>/socket capacity exceeded/.test(x)));
 const compatibility=changed('device.base_computer.artemis',r=>r.composition_history[0].expansion_socket_groups.find(g=>g.id==='memory').sockets[0].compatible_device_ids=['device.logix_mouse']);
 assert(validateCompositions(compatibility).some(x=>/incompatible device/.test(x)));
});
test('professional card explicitly includes inherited modes without duplicate equivalent bitmaps',()=>{
 const modes=migrated.get('device.artemis_professional_video_128kb').graphic_modes_specification;
 assert.equal(modes.length,17);assert.equal(modes.filter(m=>m.type==='text').length,4);
 const special=modes.find(m=>m.id==='professional_800_600_2bpp');assert.equal(special.framebuffer_size,120000);assert.equal(special.double_buffering,false);assert.equal(special.sprites_available,5);
 assert.equal(modes.filter(m=>m.type==='bitmap'&&m.width===640&&m.height===400&&m.parameters.some(p=>p.key==='bits_per_pixel'&&p.value===2)).length,1);
});
test('authored narratives keep socket structures out of root prose and consolidate numeric lists',()=>{
 for(const r of migrated.values()){
  const s=r.technical_specification;
  assert(!JSON.stringify(s).includes('expansion_socket_groups'),r.id);
  assert(!s.parameters.some(p=>/(?:_item_\d+|supported_rates_kbps_\d+|supply_rails_v_\d+|internal_relationships_\d+)/.test(p.key)),r.id);
  assert(!s.chapters.some(c=>['Slot count','Connection','Specification','Host qualification'].includes(c.chapter_name)),r.id);
 }
 const nic=migrated.get('device.network_card_artemis').technical_specification;
 assert.equal(nic.parameters.filter(p=>p.key==='supported_rates_kbps').length,1);
 assert.equal(nic.parameters.find(p=>p.key==='supported_rates_kbps').value,'100, 250, 500, 1000');
 assert.equal(nic.chapters.map(c=>c.description).join(' ').match(/\{supported_rates_kbps\}/g).length,1);
 assert.equal(migrated.get('base_part.aion_4116').technical_specification.parameters.find(p=>p.key==='supply_rails_v').value,'12, 5, -5');
});
