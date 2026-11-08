import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hash,snapshot,transact,validate} from '../../server/model.js';
import {GitHubStore} from '../../server/github.js';
import {schemaVersion} from '../../code/model-contract.js';
function fixture(){return Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>[dir+'/'+f,JSON.parse(fs.readFileSync(dir+'/'+f))])));}
const record=()=>({id:'external_product.test_cpm',name:'Licensed CP/M',description:'DRI software identity.',specification:[{no:1,description:'Licensor',ref_id:'actor.dri',ref_role:'software licensor'}]});
test('external additions and dependent references authorize atomically through Changes confirm at the plural file path',()=>{
 const f=fixture(),external=record(),before=f['data_foundation/event.json'].event[0],after=structuredClone(before);after.subject_ids.push(external.id);
 const proposal={id:'change.external_test',category:'story',title:'Separate software identity',reason:'Test grouped migration.',elements:[{record_type:'external_product',record_id:external.id,before:null,after:external},{record_type:'event',record_id:before.id,before,after}]};
 f['data_storytelling/change.json'].change=[proposal];
 const request={action:'approve_change',change_id:proposal.id,proposal_sha256:hash(proposal)},result=transact(f,request);
 assert.deepEqual(result.files['data_foundation/external_products.json'].external_product,[external]);assert(!result.files['data_foundation/external_product.json']);
 assert.deepEqual(snapshot(result.files,'test').collections.external_product,[external]);assert.deepEqual(validate(result.files).errors,[]);
 assert(result.files['data_storytelling/authorization.json'].authorization.some(a=>a.record_id===external.id&&a.content_sha256===hash(external)&&a.state==='authorized'));
 assert.equal(transact(result.files,request).changed,false);assert.deepEqual(f['data_foundation/external_products.json'].external_product,[]);
 const broken=structuredClone(f);broken['data_storytelling/change.json'].change[0].elements[0].after.specification[0].ref_id='actor.missing';
 assert.throws(()=>transact(broken,{...request,proposal_sha256:hash(broken['data_storytelling/change.json'].change[0])}),/unresolved reference/);
});
test('new external records are pending without authorization and support direct record authorization',()=>{
 const f=fixture(),r=record();f['data_foundation/external_products.json'].external_product.push(r);
 assert.deepEqual(validate(f).errors,[]);assert(!snapshot(f,'test').authorization.some(a=>a.record_id===r.id));
 const result=transact(f,{action:'authorize_record',record_id:r.id,content_sha256:hash(r)});assert(result.changed);
 assert.deepEqual(result.files['data_foundation/external_products.json'],f['data_foundation/external_products.json']);
});
test('GitHub reader fetches external_products.json and save never introduces a singular filename',async()=>{
 const files=fixture(),paths=Object.keys(files);const calls=[];
 const store=new GitHubStore({repository:'test/repo',token:'test'});
 store.api=async(path,method='GET',body)=>{
  calls.push({path,method,body});
  if(path==='/git/ref/heads/main')return {object:{sha:'head'}};
  if(path==='/git/commits/head')return {tree:{sha:'tree'}};
  if(path==='/git/trees/tree?recursive=1')return {tree:paths.map((p,i)=>({path:p,type:'blob',sha:String(i)}))};
  if(path.startsWith('/git/blobs/'))return {content:Buffer.from(JSON.stringify(files[paths[Number(path.split('/').at(-1))]])).toString('base64')};
  return {sha:method==='POST'?'created':'saved'};
 };
 const previous=await store.read();assert.equal(previous.files['data_storytelling/manifest.json'].manifest[0].schema_version,schemaVersion);
 const next=structuredClone(previous.files);next['data_foundation/external_products.json'].external_product.push(record());await store.save(previous,next);
 const tree=calls.find(c=>c.path==='/git/trees'&&c.method==='POST');assert.deepEqual(tree.body.tree.map(e=>e.path),['data_foundation/external_products.json']);
 assert.equal(calls.at(-1).body.force,false);
});
