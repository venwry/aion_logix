import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateCatalogue} from './validate-catalogue.js';
const root='data_storytelling/review_evidence/aurelia-three-party/';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[`${d}/${f}`,read(`${d}/${f}`)])));
const originalHash=hash(files),prior=read(root+'pre-expansion-pending.json').change;
const ids=['change.aurelia_aion_c_ide','change.aurelia_aion_c_ide_packages','change.aurelia_c_ide_launch'],queue=files['data_storytelling/change.json'].change;
const ps=ids.map(id=>queue.find(p=>p.id===id));assert.ok(ps.every(Boolean));
const unsplit=read(root+'ide-before-split.json');
assert.deepEqual(ps.slice(0,2).flatMap(p=>p.elements),unsplit.elements);
for(const p of prior){const current=ps.filter(x=>x.id===p.id || (p.id===unsplit.id && x.id==='change.aurelia_aion_c_ide_packages')).flatMap(x=>x.elements);assert.deepEqual(current.map(e=>[e.record_id,e.before]),p.elements.map(e=>[e.record_id,e.before]));}
const pendingIds=new Set(ids);
for(const p of ps)for(const id of p.depends_on_change_ids||[])if(!pendingIds.has(id))assert.ok(files['data_storytelling/authorization_decision.json'].authorization_decision.some(d=>d.action==='approve_change'&&d.change_id===id));
assert.deepEqual(validate(files).errors,[]);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const applied=transact(files,request(ps),'simulation-only').files;
let sequential=files;
for(const p of ps){sequential=transact(sequential,request([p]),'simulation-only').files;assert.deepEqual(validate(sequential).errors,[]);}
assert.deepEqual(records(sequential),records(applied));
for(const p of ps.slice(1))assert.throws(()=>transact(files,request([p])),/Select required proposal/);
assert.deepEqual(validateCatalogue(Object.fromEntries(Object.entries(applied).filter(([f])=>f.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]))).errors,[]);
const before=new Map(records(files).map(r=>[r.id,r])),after=new Map(records(applied).map(r=>[r.id,r]));
const touched=new Set(ps.flatMap(p=>p.elements.map(e=>e.record_id)));
for(const [id,r] of before){const n=after.get(id);assert.ok(n);if(!touched.has(id))assert.deepEqual(n,r);if(r.time)assert.deepEqual(n.time,r.time);if(r.launch_event_id)assert.equal(n.launch_event_id,r.launch_event_id);if(r.launch_campaign_id)assert.equal(n.launch_campaign_id,r.launch_campaign_id);if(r.composition_history)assert.deepEqual(n.composition_history.map(v=>[v.version_number,v.effective_from,v.effective_until]),r.composition_history.map(v=>[v.version_number,v.effective_from,v.effective_until]));}
const ide=after.get('software_edition.simple_c_z80');assert.equal(ide.version,'1.0');assert.deepEqual(ide.provider_actor_ids,['actor.aion']);
assert.deepEqual(ide.composition_history[0].technical_definition.toolchain.targets,['z80_cpm']);
for(const phrase of ['syntax','peephole','assembly','bitmap','dropdown','Tab/Shift-Tab','qualification'])assert.ok(JSON.stringify(ide).toLowerCase().includes(phrase.toLowerCase()));
assert.deepEqual(after.get('software_edition.cpm_aurelia'),before.get('software_edition.cpm_aurelia'));
assert.deepEqual(after.get('agreement.dri_cpm'),before.get('agreement.dri_cpm'));
assert.equal(hash(files),originalHash);
const report={result:'passed',proposals:ps.map(p=>({id:p.id,proposal_sha256:hash(p),records:p.elements.length})),sequential_and_batch_equivalent:true,dependencies_enforced:true,original_before_snapshots_preserved:true,dates_and_existing_authorized_records_preserved:true,strict_catalogue:'passed',source_and_authorization_unchanged:true};
if(process.argv.includes('--write-report'))fs.writeFileSync(root+'ide-expansion-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
