import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../../server/model.js';
function fixture(){
 const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,JSON.parse(fs.readFileSync(d+'/'+f))])));
 const record=records(files)[0],discussion={id:'change.discussion_test',category:'discussion',title:'Unresolved question',reason:'Provide the intended scope.',elements:[],affected_record_ids:[record.id],findings:[{record_id:record.id,path:'/name',description:'The intended scope is unclear.'}]};
 files['data_storytelling/change.json']={change:[discussion]};return {files,record,discussion};
}
const entry=p=>({change_id:p.id,proposal_sha256:hash(p)});
test('discussion is valid but cannot authorize data through any approval path',()=>{
 const {files,discussion}=fixture();assert.deepEqual(validate(files).errors,[]);
 for(const request of [{action:'approve_change',...entry(discussion)},{action:'approve_changes',changes:[entry(discussion)]},{action:'save_review',approvals:[entry(discussion)]}])assert.throws(()=>transact(files,request),/Discussion entries cannot be authorized/);
});
test('discussion validation rejects hidden edits, missing records and unlisted finding targets',()=>{
 const {files,record,discussion}=fixture();discussion.elements=[{record_type:record.id.split('.')[0],record_id:record.id,before:record,after:record}];assert(validate(files).errors.length);
 discussion.elements=[];discussion.affected_record_ids=['actor.missing'];assert(validate(files).errors.some(e=>e.includes('unknown discussion record')));
 discussion.affected_record_ids=[];assert(validate(files).errors.some(e=>e.includes('finding record')));
});
test('saved discussion remarks and removal retain history without changing authorization',()=>{
 const {files,discussion}=fixture(),before=structuredClone(files);
 const feedback={id:'change_review.discussion_test',...entry(discussion),text:'Use this scope.',supersedes_id:null};
 const saved=transact(files,{action:'save_review',feedback:[feedback]});assert.deepEqual(records(saved.files),records(before));assert.deepEqual(saved.files['data_storytelling/authorization.json'],before['data_storytelling/authorization.json']);
 const removed=transact(saved.files,{action:'save_review',removals:[entry(discussion)]});assert.deepEqual(records(removed.files),records(before));assert.deepEqual(removed.files['data_storytelling/authorization.json'],before['data_storytelling/authorization.json']);assert.deepEqual(removed.files['data_storytelling/change_review.json'],saved.files['data_storytelling/change_review.json']);
 const decision=removed.files['data_storytelling/authorization_decision.json'].authorization_decision.at(-1);assert.equal(decision.action,'remove_change');assert.deepEqual(decision.target,[]);assert.deepEqual(decision.proposal,discussion);assert.deepEqual(validate(removed.files).errors,[]);
 assert.equal(transact(removed.files,{action:'save_review',removals:[entry(discussion)]}).changed,false);
});
test('discussion can become a concrete proposal under the same ID with fresh review',()=>{
 const {files,record,discussion}=fixture();const state=transact(files,{action:'save_review',feedback:[{id:'change_review.discussion_convert',...entry(discussion),text:'Clarify the display name.',supersedes_id:null}]}).files;
 const concrete={id:discussion.id,category:'foundation',title:discussion.title,reason:'Apply the reviewed naming clarification.',elements:[{record_type:record.id.split('.')[0],record_id:record.id,before:record,after:{...record,name:record.name+' clarified'}}]};state['data_storytelling/change.json'].change=[concrete];
 assert.throws(()=>transact(state,{action:'approve_change',...entry(discussion)}),/changed/);
 const result=transact(state,{action:'approve_change',...entry(concrete)});assert.equal(result.changed,true);assert.deepEqual(result.files['data_storytelling/change_review.json'],state['data_storytelling/change_review.json']);
});
test('a mixed batch containing discussion approval rolls back every change',()=>{
 const {files,record,discussion}=fixture(),concrete={id:'change.concrete_test',category:'foundation',title:'Rename',reason:'Test atomic rollback',elements:[{record_type:record.id.split('.')[0],record_id:record.id,before:record,after:{...record,name:record.name+' revised'}}]};files['data_storytelling/change.json'].change.push(concrete);const before=structuredClone(files);
 assert.throws(()=>transact(files,{action:'save_review',approvals:[entry(concrete),entry(discussion)]}),/Discussion entries/);assert.deepEqual(files,before);
});
