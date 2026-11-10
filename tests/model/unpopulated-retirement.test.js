import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const fresh=()=>readDocuments('data_foundation');
test('empty-only compatibility accepts existing payloads and omission but rejects new populated values',()=>{
 const d=fresh();assert.deepEqual(validateDocuments(d).errors,[]);
 const part=d.base_part.base_part[0];delete part.manufacturing_capability_ids;assert.deepEqual(validateDocuments(d).errors,[]);
 part.manufacturing_capability_ids=[d.manufacturing_capability.manufacturing_capability[0].id];assert(validateDocuments(d).errors.length);
 const e=fresh(),resources=e.software_edition.software_edition[0].composition_history[0].technical_definition.minimum_resources;
 delete resources.application_ram_bytes;assert.deepEqual(validateDocuments(e).errors,[]);
 resources.application_ram_bytes=1024;assert(validateDocuments(e).errors.length);
});
test('shared populated capacity fields survive while retired fields reject reintroduction',()=>{
 const d=fresh();
 const version=d.device.device.flatMap(r=>r.composition_history).find(v=>typeof v.technical_definition?.specification?.capacity_kb==='number');
 assert(version,'Populated device capacity must remain supported');assert.deepEqual(validateDocuments(d).errors,[]);
 d.product.product[0].technology_ids=[];assert(validateDocuments(d).errors.some(e=>e.includes('additional properties')));
 const e=fresh();e.campaign.campaign[0].presentation={stage:[{label:'Opening',description:'Opening',actor_ids:[]}]};assert(validateDocuments(e).errors.some(e=>e.includes('additional properties')));
});
