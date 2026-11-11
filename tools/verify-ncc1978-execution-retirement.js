import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateProductLaunches,indexProductLaunches} from '../code/product-launches.js';
import {legacyCampaignExecutions} from '../code/campaign-transition.js';
import {timelineTree} from '../code/timeline-layout.js';
import {timing} from '../code/shared.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const unchangedHash=hash(files),before=new Map(records(files).map(r=>[r.id,r]));
const p=read('data_storytelling/review_evidence/ncc1978-execution-retirement/proposals.json').change[0];
assert.deepEqual(files['data_storytelling/change.json'].change.find(q=>q.id===p.id),p);
const touched=new Set();for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,before.get(e.record_id));assert.notDeepEqual(e.before,e.after);}
assert.deepEqual(validate(files).errors,[]);
const request={action:'approve_changes',changes:[{change_id:p.id,proposal_sha256:hash(p)}]};
const result=transact(files,request).files;assert.deepEqual(validate(result).errors,[]);
const after=new Map(records(result).map(r=>[r.id,r])),retired='process.ncc1978_campaign';assert(!after.has(retired));
for(const r of after.values()){assert(!JSON.stringify(r).includes(retired));if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));}
assert(!legacyCampaignExecutions['campaign.ncc1978']);assert.deepEqual(validateProductLaunches(after),[]);
const c=after.get('campaign.ncc1978'),old=before.get(c.id),steps=new Map(c.marketing_steps.map(s=>[s.id,s]));
assert.deepEqual(c.period,old.period);assert(!steps.has('readiness'));
assert.equal(steps.get('bpi-session').marketing_presentation.filter(b=>b.parameters.some(p=>p.key==='pilot_businesses'&&p.value==='10–15')).length,1);
assert.match(JSON.stringify(steps.get('bpi-session')),/payroll jurisdiction/);
assert.match(JSON.stringify(steps.get('customer-follow-up')),/year-end|Year-end/);
assert.match(JSON.stringify(steps.get('customer-follow-up')),/consent/);
assert.match(JSON.stringify(steps.get('customer-follow-up')),/Model II.*future negotiation/);
const launch=after.get('event.aurelia_launch'),originalLaunch=before.get(launch.id);
assert.deepEqual(launch.outcomes.slice(0,-1),originalLaunch.outcomes);assert.equal(launch.outcomes.length,originalLaunch.outcomes.length+1);
for(const content of ['broadcast feature','station-ready','separate narration/audio','product/Academy press sheet','full edited presentations','post-presentation'])assert(launch.outcomes.at(-1).description.includes(content));
const parent=after.get('process.aurelia_foundation');assert.deepEqual(parent.steps,before.get(parent.id).steps.filter(s=>s.process_id!==retired));
const products=indexProductLaunches(after.values());
for(const s of c.marketing_steps)if(s.reference_id?.startsWith('event.')){
 const e=after.get(s.reference_id);assert.equal(e.kind==='launch',products.has(e.id));assert.deepEqual(e.time,before.get(e.id).time);
}
assert.match(after.get('event.academy_launch').outcomes[1].description,/follow-up plans for year-end preparation, module-upgrade demonstrations and expansion based on verified customer results/);
assert.equal(after.get('event.aurelia_developer_presentation').kind,'premiere');assert.equal(after.get('event.aurelia_sales_premiere').kind,'premiere');
const tree=timelineTree([...after.values()].filter(r=>/^(campaign|event|process)\./.test(r.id)).map(record=>({record,type:record.id.split('.')[0],date:timing(record,after)})));
assert.equal(tree.nodes.get(c.id).parent,parent.id);
for(const s of c.marketing_steps)if(s.reference_id)assert.equal(tree.nodes.get(s.reference_id).parent,c.id);
assert.equal(hash(files),unchangedHash);assert.deepEqual(transact(result,request).files,result);
console.log('Verified execution retirement: seven atomic record operations, complete step/outcome coverage, three product launch events, unchanged dates/products, direct ownership, and unchanged live foundation/authorization inputs.');
