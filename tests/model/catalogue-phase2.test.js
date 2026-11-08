import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {validateProductLaunches} from '../../code/product-launches.js';
import {datasetPath,datasetFiles,datasets,schemaVersion} from '../../code/model-contract.js';

const external=()=>({id:'external_product.test_cpm',name:'DRI licensed CP/M',description:'DRI software, distinct from the Logix physical cartridge.',specification:[{no:1,description:'DRI licenses this software.',ref_id:'actor.dri',ref_role:'software owner and licensor'}]});
const docs=()=>readDocuments('data_foundation');
test('manifest and filename registry agree; empty and populated external datasets validate',()=>{
 const manifest=JSON.parse(fs.readFileSync('data_storytelling/manifest.json')).manifest[0];
 assert.equal(manifest.schema_version,schemaVersion);assert.deepEqual(manifest.foundation_datasets,datasets);
 for(const n of datasets)assert.equal(manifest.foundation_files?.[n]||n+'.json',datasetFiles[n]);
 assert.equal(datasetPath('external_product'),'data_foundation/external_products.json');
 const d=docs();assert(Array.isArray(d.external_product.external_product));assert.deepEqual(validateDocuments({external_product:{external_product:[]}}).errors,[]);assert.deepEqual(validateDocuments(d).errors,[]);
});
test('external specifications have exactly four fields and resolved, singular role-labelled references',()=>{
 const d=docs();d.external_product.external_product.push(external());
 d.event.event[0].subject_ids.push('external_product.test_cpm');d.campaign.campaign[0].subject_ids.push('external_product.test_cpm');
 assert.deepEqual(validateDocuments(d).errors,[]);
 for(const change of [r=>delete r.specification[0].ref_role,r=>r.specification[0].ref_id=['actor.dri'],r=>r.specification[0].ref_id='actor.missing',r=>r.specification.push({...r.specification[0]}),r=>r.time={value:'1978',precision:'year'},r=>r.composition_history=[],r=>r.status='authorized']){
  const copy=structuredClone(d);change(copy.external_product.external_product.find(r=>r.id==='external_product.test_cpm'));assert(validateDocuments(copy).errors.length);
 }
});
test('launch links are optional as a pair, typed and reference checked',()=>{
 for(const fields of [{launch_campaign_id:'campaign.ncc1978'},{launch_event_id:'event.aurelia_launch'},{launch_campaign_id:'campaign.ncc1978',launch_event_id:'event.missing'}]){
  const d=docs();Object.assign(d.product.product[0],fields);assert(validateDocuments(d).errors.length);
 }
 const d=docs();for(const p of d.product.product.slice(0,2))Object.assign(p,{launch_campaign_id:'campaign.ncc1978',launch_event_id:'event.aurelia_launch'});
 assert.deepEqual(validateDocuments(d).errors,[]);
 // A conference side launch need not equal the campaign's headline launch event.
 d.product.product[1].launch_event_id='event.bpi_launch';
 assert.deepEqual(validateDocuments(d).errors,[]);
});
function graph(){return new Map([
 {id:'process.campaign',period:{start:{value:'1980-06-01',precision:'day'},end:{value:'1980-06-04',precision:'day'}},steps:[{process_id:'process.session'}]},
 {id:'process.session',steps:[{event_id:'event.launch'}]},
 {id:'campaign.test',process_id:'process.campaign',launch_event_id:'event.headline'},
 {id:'event.launch',time:{value:'1980-06-02',precision:'day'}},
 {id:'product.test',launch_campaign_id:'campaign.test',launch_event_id:'event.launch'}
].map(r=>[r.id,r]));}
test('launch validation requires real ownership and temporal containment, not a matching date or subject',()=>{
 assert.deepEqual(validateProductLaunches(graph()),[]);
 for(const mutate of [
  g=>g.get('process.session').steps=[],
  g=>g.get('event.launch').time.value='1980-06-05',
  g=>g.get('event.launch').process_ids=['process.other'],
  g=>g.get('process.campaign').parent_process_id='process.session',
  g=>g.get('process.campaign').period.end={value:null,precision:'unknown'},
  g=>{g.get('process.campaign').steps=[];g.get('process.session').parent_process_id='process.session';},
 ]){const g=graph();mutate(g);assert(validateProductLaunches(g).length);}
 const g=graph();g.get('process.session').steps=[];g.get('process.session').period={start:{value:'event.launch',precision:'event'}};
 assert.deepEqual(validateProductLaunches(g),[]);
 g.get('process.campaign').steps=[];g.get('process.session').parent_process_id='process.campaign';assert.deepEqual(validateProductLaunches(g),[]);
});
test('partial date precision is preserved and overlapping uncertain event dates do not pass full containment',()=>{
 const g=graph();g.get('process.campaign').period={start:{value:'1980-06',precision:'month'},end:{value:'1980-06',precision:'month'}};
 g.get('event.launch').time={value:'1980-06',precision:'month'};assert.deepEqual(validateProductLaunches(g),[]);
 g.get('event.launch').time={value:'1980',precision:'year'};assert.match(validateProductLaunches(g).join(),/outside/);
});

test('software can reference an external computer host without admitting it as a physical BOM target',()=>{
 const d=docs(),host={id:'external_product.test_host',name:'External computer',description:'A third-party host.',specification:[]};
 d.external_product.external_product.push(host);
 const edition=d.software_edition.software_edition.find(r=>r.id==='software_edition.cpm_model_ii');edition.composition_history[0].technical_definition.platform_support[0].computer_id=host.id;
 assert.deepEqual(validateDocuments(d).errors,[]);
 edition.composition_history[0].technical_definition.platform_support[0].computer_id='actor.tandy';assert(validateDocuments(d).errors.length);
 edition.composition_history[0].technical_definition.platform_support[0].computer_id=host.id;
 d.device.device[0].composition_history[0].composition_definition[0].target={record_id:host.id};assert(validateDocuments(d).errors.length);
});
