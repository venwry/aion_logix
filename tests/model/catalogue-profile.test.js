import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCatalogueProduct} from '../../tools/validate-catalogue.js';
const service=()=>({id:'product.example',name:'Example support',kind:'service',description:'Customer support offering',provider_actor_ids:['actor.logix'],technology_ids:[],specification:[],offering_category:'service',launch_campaign_id:'campaign.example',launch_event_id:'event.example'});
const device=()=>({...service(),kind:'hardware',offering_category:'peripheral',composition_history:[{version_number:1,description:'Supplied device',effective_from:{kind:'unknown'},effective_until:{kind:'unknown'},technical_definition:{},composition_definition:[{id:'line_1',target:{record_id:'device.example',version_number:1},element_type:'main_product',quantity:1,unit:'each',role:'Supplied device',supply_condition:{kind:'always'},requirements:[]}],assembly_requirements:[]}]});
test('catalogue profile accepts a service and a composed device offering',()=>{
 assert.deepEqual(validateCatalogueProduct(service()),[]);
 assert.deepEqual(validateCatalogueProduct(device()),[]);
});
test('every offering needs provider, commercial category and both launch links',()=>{
 for(const key of ['offering_category','launch_campaign_id','launch_event_id']){const p=service();delete p[key];assert(validateCatalogueProduct(p).length,key);}
 const p=service();p.provider_actor_ids=[];assert(validateCatalogueProduct(p).length);
});
test('technical aliases, families and product technology lists fail the profile',()=>{
 for(const kind of ['chip','family','software_edition'])assert(validateCatalogueProduct({...service(),kind}).length,kind);
 assert(validateCatalogueProduct({...service(),family_product_id:'product.family'}).length);
 assert(validateCatalogueProduct({...service(),technology_ids:['technology.example']}).length);
});
test('semantic specification labels and explanatory descriptions replace imported paths',()=>{
 const p=service();p.specification=[{number:1,type:'support_entitlement',description:'Assistance with the supplied system.',value:'Telephone support'}];assert.deepEqual(validateCatalogueProduct(p),[]);
 for(const type of ['features[1]','specification.controller_ref','platform_support/0']){p.specification[0].type=type;assert(validateCatalogueProduct(p).length,type);}
 p.specification[0].type='support_entitlement';p.specification[0].description='  ';assert(validateCatalogueProduct(p).length);
});
test('non-service products require delivery composition; technical identity alone is insufficient',()=>{
 const p=device();delete p.composition_history;p.technical_identity={record_id:'device.example'};assert(validateCatalogueProduct(p).length);
 p.composition_history=[];assert(validateCatalogueProduct(p).length);
 assert(validateCatalogueProduct({...service(),offering_category:'peripheral'}).length);
});
