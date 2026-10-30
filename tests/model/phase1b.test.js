import test from 'node:test';
import assert from 'node:assert/strict';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {pointBounds} from '../../code/temporal.js';
const fresh=()=>readDocuments('data_foundation');
const errors=d=>validateDocuments(d).errors.join('\n');
test('event boundaries preserve partial date precision and reject dangling anchors',()=>{
 const d=fresh(),e=d.event.event[0],p=d.process.process[0];
 e.time={value:'1978',precision:'year'};
 p.period={start:{value:e.id,precision:'event'},end:{value:'1978-02',precision:'month'}};
 assert.equal(errors(d),'');
 const b=pointBounds(p.period.start,new Map([[e.id,e]]));
 assert.equal(new Date(b.start).toISOString(),'1978-01-01T00:00:00.000Z');
 assert.equal(new Date(b.end).toISOString(),'1978-12-31T23:59:59.999Z');
 p.period.start.value='event.missing';assert.match(errors(d),/unresolved/);
});
test('unknown boundaries remain undated and reversed known intervals fail',()=>{
 const d=fresh(),p=d.process.process[0];
 p.period={start:{value:null,precision:'unknown'},end:{value:null,precision:'unknown'}};
 assert.equal(errors(d),'');assert.equal(pointBounds(p.period.start),null);
 p.period={start:{value:'1980',precision:'year'},end:{value:'1979',precision:'year'}};
 assert.match(errors(d),/reversed period/);
});
test('retired occurrence, completion and campaign activity fields are rejected',()=>{
 for(const [dataset,key,value] of [['event','occurrence','occurred'],['event','period',{}],['process','completion_state','completed'],['campaign','activity',[]],['product','time',{value:'1978',precision:'year'}]]){
  const d=fresh();d[dataset][dataset][0][key]=value;assert.match(errors(d),/additional properties/);
 }
});
test('numbered owned items cannot duplicate their numbers',()=>{
 const d=fresh();d.process.process[0].inputs=[1,1].map(number=>({number,type:'requirement',description:'Input'}));
 assert.match(errors(d),/duplicate number in inputs/);
});
test('campaign must reference an execution process',()=>{
 const d=fresh(),p=d.process.process.find(x=>x.kind!=='campaign_execution');
 d.campaign.campaign[0].process_id=p.id;assert.match(errors(d),/campaign needs an execution process/);
});
