import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {datasets,datasetPath} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='data_storytelling/review_evidence/ncc1979-consolidation/',baseline=read(root+'baseline.json'),summary=read(root+'summary.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const queue=files['data_storytelling/change.json'].change,p=queue.find(p=>p.id===summary.proposal_id);
assert(p);assert.equal(p.elements.length,3);
const ignored=new Set([...summary.discussion_ids,summary.proposal_id]);
assert.deepEqual(queue.filter(p=>!ignored.has(p.id)),baseline.existing_proposals.filter(p=>!ignored.has(p.id)));
const before=new Map(records(files).map(r=>[r.id,r]));
for(const e of p.elements)assert.deepEqual(e.before,before.get(e.record_id));
const request={action:'approve_changes',changes:[{change_id:p.id,proposal_sha256:hash(p)}]};
const result=transact(files,request).files,index=new Map(records(result).map(r=>[r.id,r]));
assert.deepEqual(validate(result).errors,[]);
assert.deepEqual(validateCatalogue(Object.fromEntries(datasets.map(n=>[n,result[datasetPath(n)]]))).errors,[]);
assert.equal(transact(result,request).changed,false);
assert(!index.has('process.ncc1979_campaign'));
for(const r of index.values())assert(!JSON.stringify(r).includes('process.ncc1979_campaign'),'Dangling reference '+r.id);
const parent=index.get('process.ncc1979_development'),campaign=index.get('campaign.ncc1979');
assert.deepEqual(parent.period.start,{value:'1979-01-09',precision:'day'});
assert.equal(parent.steps.filter(s=>s.campaign_id===campaign.id).length,1);
assert(!parent.subject_ids.includes(campaign.id));
const old=before.get('process.ncc1979_campaign');
const originallyOwned=[old.period.start.value,...old.steps.filter(s=>s.event_id).map(s=>s.event_id),old.period.end.value];
assert.deepEqual(summary.owned_event_ids,originallyOwned);
assert.deepEqual(campaign.marketing_steps.map(s=>s.reference_id),originallyOwned);
const owners=new Map();
const own=(child,id)=>owners.set(child,[...(owners.get(child)||[]),id]);
for(const r of index.values()){
 if(r.id.startsWith('process.')){for(const s of r.steps||[])for(const key of ['event_id','process_id','campaign_id'])if(s[key])own(s[key],r.id);for(const b of Object.values(r.period||{}))if(b.precision==='event')own(b.value,r.id);}
 if(r.id.startsWith('campaign.'))for(const s of r.marketing_steps||[])if(s.reference_id)own(s.reference_id,r.id);
}
for(const id of originallyOwned){assert.deepEqual(owners.get(id),[campaign.id]);assert.deepEqual(index.get(id),before.get(id),'Event facts/dates unchanged');}
assert.deepEqual(owners.get(campaign.id),[parent.id]);
for(const r of index.values())if(r.id.startsWith('product.')||r.id.startsWith('external_product.'))assert.deepEqual(r,before.get(r.id));
assert.equal(Object.keys(summary.process_step_mapping).length,old.steps.length);
assert.equal(Object.keys(summary.old_campaign_step_mapping).length,before.get(campaign.id).marketing_steps.length);
const steps=new Set(campaign.marketing_steps.map(s=>s.id));
for(const targets of Object.values(summary.old_campaign_step_mapping))for(const id of [].concat(targets))assert(steps.has(id));
for(const id of Object.values(summary.process_step_mapping))assert(steps.has(id));
const presentation=campaign.marketing_steps.find(s=>s.id==='premiere').marketing_presentation;
const params=presentation.flatMap(b=>b.parameters),duration=params.filter(p=>p.key==='duration_minutes').reduce((n,p)=>n+p.value,0);
assert.equal(duration,54);assert.equal(params.find(p=>p.key==='programme_minutes').value,duration);
for(const [key,id] of [['bridge','external_product.centronics_aurelia_bridge'],['printer','external_product.epson_tx80_aurelia'],['leedex','external_product.leedex_video100_aurelia'],['sanyo','external_product.sanyo_vm4209_aurelia']]){
 const block=presentation.find(b=>b.parameters.some(p=>p.key===key&&p.ref_id===id));assert(block);assert(block.description.includes('candidate paths in June, not shipping products'));assert(index.get(id).release>'1979-06-04');
}
assert(index.get('external_product.bpi_suite').release<'1979-06-04');
// No verbatim copying of discarded input/outcome statements.
const descriptions=campaign.marketing_steps.flatMap(s=>[s.description,...s.marketing_presentation.map(b=>b.description)]);
for(const discarded of [...old.inputs,...old.outcomes])assert(!descriptions.includes(discarded.description));
for(const [path,digest] of Object.entries(baseline.protected_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),digest,path);
console.log(JSON.stringify({result:'passed',proposals:1,foundation_records:3,owned_milestones:originallyOwned.length,process_removed_without_dangling_references:true,development_start:'1979-01-09',presentation_minutes:duration,strict_catalogue_and_launch_ownership_valid:true,process_and_campaign_step_coverage_complete:true,external_release_dates_preserved:true,foundation_authorization_calculations_and_feedback_unchanged:true},null,2));
