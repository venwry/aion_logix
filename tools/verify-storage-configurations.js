import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {hash,records,transact,validate} from '../server/model.js';
import {datasets,datasetPath} from '../code/model-contract.js';
import {validateCatalogue} from './validate-catalogue.js';
import {storageCostAssumptions} from './apply-storage-cost-assumptions.js';
import {buildCostRows,costDates,costSourceRecords,createCostEstimator} from '../code/manufacturing-cost-model.js';
import {costHash} from './generate-manufacturing-costs.js';
import {validateManufacturingCosts} from './validate-manufacturing-costs.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='data_storytelling/review_evidence/storage-configurations/',summary=read(root+'summary.json'),baseline=read(root+'baseline.json');
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(dir=>fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[dir+'/'+f,read(dir+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const proposals=files['data_storytelling/change.json'].change.filter(p=>summary.proposal_ids.includes(p.id));
assert.equal(proposals.length,4);
const oldDiscussions=structuredClone(baseline.existing_proposals);
const discussion=oldDiscussions.find(p=>p.id==='change.closeout_descriptive_scope');
discussion.affected_record_ids=discussion.affected_record_ids.filter(id=>id!=='product.artemis_budget_128');
discussion.findings=discussion.findings.filter(f=>f.record_id!=='product.artemis_budget_128');
discussion.reason=discussion.reason.replace('106 previously','105 previously');
discussion.reason+=' The Budget Colour Office description is now handled by its concrete removal proposal and is no longer a separate discussion finding.';
assert.deepEqual(files['data_storytelling/change.json'].change.filter(p=>!summary.proposal_ids.includes(p.id)),oldDiscussions);
const index=new Map(records(files).map(r=>[r.id,r]));
for(const p of proposals)for(const e of p.elements)assert.deepEqual(e.before,index.get(e.record_id)??null);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of proposals){const required=proposals.filter(x=>p.depends_on_change_ids?.includes(x.id));assert.doesNotThrow(()=>transact(files,request([...required,p])));}
const after=transact(files,request(proposals)).files,next=new Map(records(after).map(r=>[r.id,r]));
assert.deepEqual(validate(after).errors,[]);
assert.deepEqual(validateCatalogue(Object.fromEntries(datasets.map(n=>[n,after[datasetPath(n)]]))).errors,[]);
const sorted=f=>records(f).sort((a,b)=>a.id.localeCompare(b.id));
assert.deepEqual(sorted(transact(files,request([...proposals].reverse())).files),sorted(after));
assert.equal(transact(after,request(proposals)).changed,false);
assert(!next.has('product.artemis_budget_128'));
for(const id of summary.artemis_products){
 const before=index.get(id),p=next.get(id),last=p.composition_history.at(-1);
 for(const old of before.composition_history){
  const current=p.composition_history.find(v=>v.version_number===old.version_number);
  if(old.effective_from.event_id!=='event.ncc82_graphics_mouse'&&old.effective_from.event_id!=='event.autodesk_comdex'){
   const expected=structuredClone(old);
   if(old===before.composition_history.at(-1))expected.effective_until={kind:'event',event_id:summary.storage_cutover_event};
   if(id==='product.proposed_artemis_accounts'&&old.version_number===2)expected.composition_definition.find(l=>l.target.record_id==='device.rom_cartridge.aionix_server').target.record_id='device.rom_cartridge.aionix';
   assert.deepEqual(current,expected,'Historical configuration '+id+'/'+old.version_number);
  }
 }
 for(const host of last.composition_definition.filter(l=>['device.base_computer.artemis','device.base_computer.artemis_pro'].includes(l.target.record_id))){
  const drives=last.composition_definition.filter(l=>l.connection?.host_line_id===host.id&&l.connection.socket_id==='internal_drive');
  assert.equal(drives.length,2);assert.equal(drives.find(l=>l.target.record_id.includes('floppy')).quantity,host.quantity);
  assert.equal(drives.find(l=>l.target.record_id==='device.storage.miniscribe_4010').quantity,host.quantity);
 }
}
assert.deepEqual(next.get('product.athena'),index.get('product.athena'));
assert.deepEqual(next.get('product.athena_server'),index.get('product.athena_server'));
const assumptions=storageCostAssumptions(read('data_calculation/manufacturing_cost_assumptions.json'),next);
const estimator=createCostEstimator(next,assumptions);
assert.equal(estimator.partQuote('base_part.miniscribe_4010','1982-06-15').unit_cost,625);
assert(Math.abs(estimator.partQuote('base_part.quantum_q540','1983-06-15').unit_cost-1485)<1e-8);
let sequential=files;
for(const p of [...proposals].sort((a,b)=>(a.depends_on_change_ids?.length||0)-(b.depends_on_change_ids?.length||0)))sequential=transact(sequential,request([p])).files;
assert.deepEqual(sorted(sequential),sorted(after));
const costRows=buildCostRows(next,assumptions);
const doc={model_version:assumptions.model_version,currency:assumptions.currency,currency_basis:assumptions.currency_basis,foundation_revision:baseline.commit,foundation_sha256:costHash(costSourceRecords(next)),assumptions_sha256:costHash(assumptions),generated_at:new Date().toISOString(),dates:costDates,manufacturing_costs:costRows};
assert.deepEqual(validateManufacturingCosts(doc,assumptions,next).errors,[]);
for(const [p,digest] of Object.entries(baseline.protected_sha256)){
 if(['data_calculation/manufacturing_costs.json','data_calculation/ram_cost_scenarios.json'].includes(p)){
  const old=JSON.parse(execFileSync('git',['show',baseline.commit+':'+p],{encoding:'utf8',maxBuffer:20*1024*1024})),current=read(p);
  for(const key of ['foundation_revision','foundation_sha256','generated_at']){delete old[key];delete current[key];}
  assert.deepEqual(current,old,'Only stale calculation provenance refreshed');
 }else assert.equal(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),digest,p);
}
console.log(JSON.stringify({result:'passed',proposals:proposals.length,records:proposals.reduce((n,p)=>n+p.elements.length,0),artemis_offerings:summary.artemis_products.length,projected_cost_products:costRows.length,independent_with_dependencies_combined_reverse_and_retry:true,pre_ncc_configurations_preserved:true,foundation_authorization_and_cost_assumptions_unchanged:true,existing_calculation_provenance_refreshed:true},null,2));
