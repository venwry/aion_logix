import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
import {validateCampaigns} from '../../code/campaigns.js';
import {validateProductLaunches} from '../../code/product-launches.js';
const original=readDocuments('data_foundation');
const proposal=JSON.parse(fs.readFileSync('data_storytelling/review_evidence/campaign-timelines/proposals.json')).change[0];
function converted(){const docs=structuredClone(original);for(const e of proposal.elements){const rows=docs[e.record_type][e.record_type];rows[rows.findIndex(r=>r.id===e.record_id)]=structuredClone(e.after);}return docs;}
const errors=d=>validateDocuments(d).errors.join('\n');
test('legacy and mixed campaign formats validate while hybrid records fail',()=>{
 assert.equal(errors(original),'');assert.equal(errors(converted()),'');
 for(const field of ['process_id','launch_event_id','claim_policy','presentation']){const d=converted();d.campaign.campaign[0][field]=original.campaign.campaign[0][field];assert.match(errors(d),/additional properties/);}
});
test('campaign dates preserve precision and reject event boundaries, invalid days and reversed periods',()=>{
 for(const start of [{value:'event.aurelia_launch',precision:'event'},{value:'1978-02-30',precision:'day'},{value:'1984-01-01',precision:'day'}]){const d=converted();d.campaign.campaign[0].period.start=start;assert(errors(d));}
 const d=converted();d.campaign.campaign[0].period.start={value:null,precision:'unknown'};assert(errors(d).includes('known event and campaign process dates'));
});
test('presentation parameters require one value or reference, a real target, and matching unique placeholders',()=>{
 const changes=[b=>b.parameters.push({key:'bad',ref_id:'actor.missing'}),b=>b.parameters.push({key:'bad',value:'x',ref_id:'actor.logix'}),b=>b.parameters.push({key:'unused',value:'x'}),b=>b.description+=' {missing}',b=>b.event_id='event.aurelia_launch',b=>b.parameters.push({key:'bad',ref_id:'actor.logix',ref_role:'speaker'})];
 for(const change of changes){const d=converted();change(d.campaign.campaign[0].marketing_steps[0].marketing_presentation[0]);assert(errors(d));}
});
const period={start:{value:'1980-01-01',precision:'day'},end:{value:'1980-12-31',precision:'day'}};
function graph(){const c={id:'campaign.new',period,marketing_steps:[{id:'premiere',number:1,type:'presentation',description:'Launch.',reference_id:'event.launch',marketing_presentation:[]}]};return new Map([c,{id:'event.launch',time:{value:'1980-06-01',precision:'day'}},{id:'product.new',launch_campaign_id:c.id,launch_event_id:'event.launch'}].map(r=>[r.id,r]));}
test('future ownership validates single owner, cycles, repeated children and containment',()=>{
 const g=graph();assert.deepEqual(validateCampaigns(g),[]);assert.deepEqual(validateProductLaunches(g),[]);
 g.set('process.old',{id:'process.old',steps:[{event_id:'event.launch'}]});assert.match(validateCampaigns(g).join('\n'),/single parent/);
 g.delete('process.old');g.get('campaign.new').marketing_steps.push({...g.get('campaign.new').marketing_steps[0],id:'other',number:2});assert.match(validateCampaigns(g).join('\n'),/only one marketing step/);
 const cycle=graph();cycle.get('campaign.new').marketing_steps[0].reference_id='process.child';cycle.set('process.child',{id:'process.child',period,steps:[{campaign_id:'campaign.new'}]});assert.match(validateCampaigns(cycle).join('\n'),/cycle/);
 const outside=graph();outside.get('event.launch').time.value='1981-01-01';assert.match(validateCampaigns(outside).join('\n'),/outside/);
});
test('new campaigns cannot borrow arbitrary old execution-process launches',()=>{
 const g=graph();g.get('campaign.new').marketing_steps=[];g.set('process.old',{id:'process.old',period,steps:[{event_id:'event.launch'}]});assert.match(validateProductLaunches(g).join('\n'),/must belong/);
});
test('process steps cannot specify campaign and event/process ownership together',()=>{
 const d=converted();const parent=d.process.process.find(r=>r.id===proposal.elements[1].record_id);parent.steps.at(-1).event_id='event.aurelia_launch';assert(errors(d));
});
