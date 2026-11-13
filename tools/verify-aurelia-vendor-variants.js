// Pinned proposal-cohort verification; approval simulations never write foundation.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';
import {datasets, datasetPath} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';

const root='data_storytelling/review_evidence/aurelia-vendor-variants/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read(root+'baseline.json');
const assessment=read(root+'assessment.json');
const offers=read(root+'offerings.json').offerings;
const proposals=read(root+'proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir)
  .filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const original=new Map(records(files).map(r=>[r.id,r]));
const external=files['data_foundation/external_products.json'].external_product;
const live=files['data_storytelling/change.json'].change;
const ids=new Set(proposals.map(p=>p.id));
const elements=proposals.flatMap(p=>p.elements);
const proposed=new Map(elements.map(e=>[e.record_id,e.after]));
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const simulate=ps=>transact(files,request(ps)).files;
const canonical=f=>records(f).map(r=>[r.id,r]).sort(([a],[b])=>a.localeCompare(b));
const catalogue=f=>Object.fromEntries(datasets.map(n=>[n,f[datasetPath(n)]]));
function preserved(){for(const [p,h] of Object.entries(baseline.preserved_files_sha256))assert.equal(digest(p),h,p+' changed on disk');}
preserved();
assert.deepEqual(validate(files).errors,[]);
assert.deepEqual(validateCatalogue(catalogue(files)).errors,[]);
assert.deepEqual(live.filter(p=>!ids.has(p.id)),baseline.preexisting_pending_proposals);
assert.equal(proposals.length,9);
assert.equal(offers.length,40);
assert.equal(elements.length,86);
assert.equal(proposed.size,elements.length,'Whole-record overlap');
assert.equal(elements.filter(e=>e.before===null).length,40);
assert.equal(elements.filter(e=>e.before!==null).length,46);
assert.equal(assessment.manufacturers.length,68);
assert.equal(new Set(assessment.manufacturers.map(m=>m.actor_id)).size,68);
const peripheralIds=external.filter(p=>p.kind==='peripheral').map(p=>p.id).sort();
assert.deepEqual(assessment.products.map(p=>p.record_id).sort(),peripheralIds,'Incomplete product reassessment');
assert.equal(peripheralIds.length,201);
const sourceIds=offers.flatMap(o=>o.source_record_ids);
assert.equal(new Set(sourceIds).size,sourceIds.length,'A historical source was counted in multiple projects');
const vendors=new Set(offers.map(o=>o.provider_actor_id));
assert.equal(vendors.size,37);
for(const m of assessment.manufacturers){
  if(m.midpoint_percent===null)assert(!vendors.has(m.actor_id));
  else {
    assert.equal(m.midpoint_percent,(m.probability_low_percent+m.probability_high_percent)/2);
    assert.equal(vendors.has(m.actor_id),m.midpoint_percent>=70,'Manufacturer threshold '+m.actor_id);
  }
}
for(const a of assessment.products){
  if(a.midpoint_percent!==null)assert.equal(a.midpoint_percent,(a.probability_low_percent+a.probability_high_percent)/2);
  const selected=a.midpoint_percent!==null&&a.midpoint_percent>=70;
  assert.equal(sourceIds.includes(a.record_id),selected,'Product threshold '+a.record_id);
  assert.equal(a.disposition==='assume_vendor_supply',selected);
  if(!selected)assert(!proposed.has(a.record_id),'Excluded original edited');
}
for(const p of proposals){
  assert.deepEqual(live.find(x=>x.id===p.id),p,'Queue differs from evidence');
  assert(p.elements.length>=5&&p.elements.length<=15);
  for(const e of p.elements){
    assert.equal(e.record_type,'external_product');
    assert.deepEqual(e.before,original.get(e.record_id)??null);
    assert.notDeepEqual(e.before,e.after);
    if(e.before){
      const retained=structuredClone(e.after);
      const link=retained.specification.pop();
      assert.equal(link.chapter_name,'Aurelia-compatible vendor offering');
      assert.deepEqual(retained,e.before,'Historical product changed beyond its variant link');
    }
  }
  // Each complete group must work alone, with no hidden cross-group prerequisites.
  const one=simulate([p]);
  assert.deepEqual(validate(one).errors,[],'Independent group schema '+p.id);
  assert.deepEqual(validateCatalogue(catalogue(one)).errors,[],'Independent group catalogue '+p.id);
}
for(const o of offers){
  const p=proposed.get(o.id);
  assert.equal(p.release,o.estimated_release);
  assert.match(p.release,/^\d{4}-\d{2}$/);
  assert(p.release>='1979-11'&&p.release<='1980-11');
  assert.equal(o.midpoint_percent,(o.probability_low_percent+o.probability_high_percent)/2);
  assert(o.midpoint_percent>=70);
  assert.deepEqual(p.provider_actor_ids,[o.provider_actor_id]);
  assert(p.specification.some(c=>c.description.includes('owns, manufactures, brands, sells and supports')));
  assert(p.specification.some(c=>c.description.includes('estimated scenario month')));
  assert(o.release_basis&&o.rationale&&o.source_evidence_ids.length);
  for(const s of o.source_record_ids){
    assert.deepEqual(original.get(s).provider_actor_ids,p.provider_actor_ids);
    const link=proposed.get(s).specification.at(-1);
    assert(link.parameters.some(x=>x.key==='variant'&&x.value===o.id));
    assert(link.parameters.some(x=>x.key==='release_month'&&x.value===p.release));
    const sourceRelease=original.get(s).release;
    if(sourceRelease)assert(p.release>=sourceRelease,'Variant predates historical source');
  }
  for(const list of [p.impacted_standards,p.impacted_products]){
    const field=list===p.impacted_standards?'standard_id':'product_id';
    assert.equal(new Set(list.map(x=>x[field])).size,list.length);
    for(const effect of list){assert.equal(effect.date,p.release);assert(effect.relationship);}
  }
  assert(!p.impacted_standards.some(s=>s.standard_id==='technology.logix_lan100_link'));
  if(!['printer','bridge','disk','hard_disk','keyboard','monitor'].includes(o.profile)){
    assert(p.specification.some(c=>c.description.includes('vendor-specific device protocol')));
  }
}
const bridge=offers.filter(o=>o.profile==='bridge');
assert.equal(bridge.length,1);
assert.equal(bridge[0].provider_actor_id,'actor.centronics');
assert.equal(bridge[0].source_record_ids.length,2);
for(const source of bridge[0].source_record_ids){
  assert.deepEqual(proposed.get(source).impacted_standards,original.get(source).impacted_standards,
    'Native Centronics printer falsely converted to FlexiBUS');
}
const combined=simulate(proposals);
assert.deepEqual(validate(combined).errors,[]);
assert.deepEqual(validateCatalogue(catalogue(combined)).errors,[]);
assert.equal(combined['data_foundation/external_products.json'].external_product.length,252);
assert.deepEqual(canonical(simulate([...proposals].reverse())),canonical(combined));
let sequential=files;
for(const p of [...proposals].reverse())sequential=transact(sequential,request([p])).files;
assert.deepEqual(canonical(sequential),canonical(combined));
assert.equal(transact(combined,request(proposals)).changed,false,'Retry is not idempotent');
const stale=request(proposals);stale.changes[0].proposal_sha256='0'.repeat(64);
assert.throws(()=>transact(files,stale),/changed/);
const altered=structuredClone(files);
const edited=elements.find(e=>e.before!==null);
altered['data_foundation/external_products.json'].external_product.find(r=>r.id===edited.record_id).name+=' changed';
assert.throws(()=>transact(altered,request(proposals)),/changed|snapshot|match/i,'Stale before snapshot accepted');
const final=new Map(records(combined).map(r=>[r.id,r]));
for(const [id,r] of original)if(!proposed.has(id))assert.deepEqual(final.get(id),r,'Unrelated record changed');
preserved();
console.log(JSON.stringify({result:'passed',baseline:baseline.revision,proposal_count:9,group_sizes:proposals.map(p=>p.elements.length),manufacturers_assessed:68,peripherals_assessed:201,selected_vendors:37,new_vendor_owned_offerings:40,historical_records_linked:46,resulting_external_product_count:252,earliest_estimated_release:'1979-11',latest_estimated_release:'1980-11',independent_combined_reverse_sequential_approval:true,threshold_and_centronics_bridge_checks:true,stale_proposal_and_record_rejected:true,idempotent_retry:true,foundation_authorization_calculations_schemas_unchanged_on_disk:true},null,2));
