import test from 'node:test';import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const fresh=()=>readDocuments('data_foundation');
const errors=d=>validateDocuments(d).errors.join('\n');
const product=d=>d.product.product.find(r=>r.composition_history?.length);
const line=d=>product(d).composition_history[0].composition_definition[0];
test('retired fields are rejected while recorded unknown engineering values remain valid',()=>{
 assert.equal(errors(fresh()),'');
 for(const mutate of [
  d=>product(d).family_product_id='product.aurelia_mono',
  d=>product(d).service_definition={description:'Unused service container',entitlements:[],requirements:[]},
  d=>{const p=d.product.product.find(r=>r.specification.length);p.specification[0].unit='year';},
  d=>d.software_edition.software_edition[0].family_product_id='product.aurelia_mono',
  d=>d.process.process[0].parent_process_id=d.process.process[1].id,
  d=>line(d).role='Retired',
  d=>line(d).entitlement={kind:'service',count:1,scope:'test'},
  d=>{const l=d.product.product.flatMap(p=>p.composition_history||[]).flatMap(v=>v.composition_definition).find(l=>l.connection?.host_line_id);l.connection.host_instance=1;},
  d=>product(d).composition_history[0].effective_from={kind:'process_boundary',process_id:d.process.process[0].id,boundary:'start'}
 ]){const d=fresh();mutate(d);assert(errors(d).length);}
 // These nulls record known missing requirements, rather than unused fields.
 assert(fresh().software_edition.software_edition.some(r=>r.composition_history.some(v=>v.technical_definition.minimum_resources?.application_ram_bytes===null)));
});
test('process item schemas retain used references without inheriting unused fields from event items',()=>{
 for(const [field,key,value] of [['inputs','maturity',{capability_id:'manufacturing_capability.test',stage:'pilot'}],['outcomes','event_id','event.aurelia_launch'],['outcomes','process_id','process.birmingham_estate'],['outcomes','maturity',{}],['steps','subject_ids',[]],['steps','maturity',{}]]){
  const d=fresh(),p=d.process.process[0];p[field]=[{number:1,type:'action',description:'Test item',[key]:value}];assert.match(errors(d),/additional properties/);
 }
 const d=fresh(),e=d.event.event[0];e.outcomes=[{number:1,type:'maturity_transition',description:'Test an event-owned maturity result.',maturity:{capability_id:d.manufacturing_capability.manufacturing_capability[0].id,stage:'pilot'}}];assert.equal(errors(d),'');
});
test('empty-container proposals preserve all populated content and validate after removal',async()=>{
 const fs=await import('node:fs');const ps=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/unused-field-cleanup/proposals.json')).change;
 const d=fresh();for(const p of ps)for(const e of p.elements){const rows=d[e.record_type][e.record_type],i=rows.findIndex(r=>r.id===e.record_id);rows[i]=e.after;}
 assert.equal(errors(d),'');
 assert(d.product.product.every(r=>!Object.hasOwn(r,'technology_ids')));
 for(const t of ['product','device','software_edition'])for(const r of d[t][t])for(const v of r.composition_history||[]){if(t==='product')assert(!Object.hasOwn(v,'technical_definition'));if(t==='software_edition')assert(!Object.hasOwn(v,'assembly_requirements'));for(const l of v.composition_definition)assert(!Object.hasOwn(l,'requirements'));}
});
