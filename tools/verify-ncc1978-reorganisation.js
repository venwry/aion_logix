import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {timelineTree} from '../code/timeline-layout.js';
import {timing} from '../code/shared.js';
import {validateProductLaunches} from '../code/product-launches.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const beforeHash=hash(files),before=new Map(records(files).map(r=>[r.id,r]));
const proposals=read('data_storytelling/review_evidence/ncc1978-reorganisation/proposals.json').change;
assert.equal(proposals.length,1);const p=proposals[0];assert.deepEqual(files['data_storytelling/change.json'].change.find(q=>q.id===p.id),p);
const touched=new Set();for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,before.get(e.record_id)??null);assert.notDeepEqual(e.before,e.after);}
assert.deepEqual(validate(files).errors,[]);
const request={action:'approve_changes',changes:[{change_id:p.id,proposal_sha256:hash(p)}]};
const result=transact(files,request).files;assert.deepEqual(validate(result).errors,[]);
const after=new Map(records(result).map(r=>[r.id,r]));
const removed=['process.aurelia_campaign_preparation','process.ncc78_sessions_media','event.bpi_dealer_program'];
for(const id of removed){assert(!after.has(id));for(const r of after.values())assert(!JSON.stringify(r).includes(id),r.id+' retains '+id);}
const expected=['event.aurelia_campaign_teaser','event.aurelia_campaign_advert','event.aurelia_launch','event.aurelia_developer_presentation','event.bpi_launch','event.aurelia_sales_premiere','event.academy_launch'];
const c=after.get('campaign.ncc1978');assert.deepEqual(c.marketing_steps.map(s=>s.reference_id).filter(Boolean),expected);assert.equal(c.marketing_steps.length,8);assert(!c.marketing_steps.some(s=>s.id==='readiness'||s.id==='architecture-session'));
assert.deepEqual(c.marketing_steps.map(s=>s.number),[1,2,3,4,5,6,7,8]);
for(const s of c.marketing_steps)assert.deepEqual(s.marketing_presentation.map(b=>b.number),s.marketing_presentation.map((b,i)=>i+1));
assert.deepEqual(c.period,before.get(c.id).period);
for(const [id,date] of [['event.aurelia_developer_presentation','1978-06-06'],['event.bpi_launch','1978-06-06'],['event.aurelia_sales_premiere','1978-06-14'],['event.academy_launch','1978-06-16']])assert.deepEqual(after.get(id).time,{value:date,precision:'day'});
assert.match(after.get('event.aurelia_developer_presentation').description,/morning/);assert.match(after.get('event.bpi_launch').description,/afternoon/);
assert(!after.get('event.aurelia_sales_premiere').location_ids,'Do not invent a shop address');
for(const id of ['event.aurelia_launch','event.aurelia_developer_presentation','event.bpi_launch'])assert(after.get(id).outcomes.some(o=>o.type==='deliverable'&&/Full-session recordings and production masters/.test(o.description)));
const academy=after.get('event.academy_launch'),oldDealer=before.get('event.bpi_dealer_program');assert.deepEqual(academy.participant,oldDealer.participant);assert.equal(academy.agreement_id,oldDealer.agreement_id);assert.deepEqual(academy.inputs.slice(0,2),oldDealer.inputs);
assert.equal(after.get('product.service_bpi_training').launch_event_id,'event.academy_launch');
for(const r of after.values())if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));
for(const r of before.values())if(r.id.startsWith('product.')&&r.id!=='product.service_bpi_training')assert.deepEqual(after.get(r.id),r);
assert(!/July 17|17 July|1978-07-17/.test(JSON.stringify(c.marketing_steps)),'Old BPI programme date remains in campaign content');
const items=[...after.values()].filter(r=>/^(campaign|event|process)\./.test(r.id)).map(record=>({record,type:record.id.split('.')[0],date:timing(record,after)}));const tree=timelineTree(items);
for(const id of expected){assert.equal(tree.nodes.get(id).parent,c.id);assert.equal(tree.occurrences.get(id).length,1);}
assert.equal(tree.nodes.get(c.id).parent,'process.aurelia_foundation');
assert(tree.nodes.has('process.ncc1978_campaign'));
assert.deepEqual(validateProductLaunches(after),[]);
// Prove this campaign no longer relies on the temporary execution bridge:
// validation must pass even when the retained execution process is omitted.
const withoutExecution=new Map(after);withoutExecution.delete('process.ncc1978_campaign');assert.deepEqual(validateProductLaunches(withoutExecution),[]);
assert.deepEqual(transact(result,request).files,result,'Approval retry must be idempotent');
assert.equal(hash(files),beforeHash,'Simulation mutated live inputs');
console.log(JSON.stringify({result:'passed',proposals:1,record_operations:p.elements.length,added_events:p.elements.filter(e=>!e.before).length,removed_records:removed,direct_campaign_events:expected.length,product_launches:'valid without transition bridge',before_snapshots:'current',foundation_written:false},null,2));
