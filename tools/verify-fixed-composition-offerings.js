import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {validateCatalogue} from './validate-catalogue.js';
import {resolveComposition} from '../code/composition.js';
const root='data_storytelling/review_evidence/fixed-composition-offerings/';
const read=p=>JSON.parse(fs.readFileSync(p));
const review=read(root+'review.json'),proposals=read(root+'proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const initial=structuredClone(files),queue=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision;
const pending=proposals.filter(p=>queue.some(q=>q.id===p.id));
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.deepEqual(validate(files).errors,[]);
for(const p of proposals){
 assert.deepEqual(queue.find(q=>q.id===p.id)||decisions.findLast(d=>d.change_id===p.id)?.proposal,p);
 if(pending.includes(p))assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
}
const applied=pending.length?transact(files,request(pending)).files:files;
const reverse=pending.length?transact(files,request([...pending].reverse())).files:files;
assert.deepEqual(records(applied).sort((a,b)=>a.id.localeCompare(b.id)),records(reverse).sort((a,b)=>a.id.localeCompare(b.id)));
const docs=Object.fromEntries(Object.entries(applied).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]));
assert.deepEqual(validateCatalogue(docs).errors,[]);
const index=new Map(records(applied).map(r=>[r.id,r]));
const versions=id=>index.get(id).composition_history;
const lines=id=>versions(id).flatMap(v=>v.composition_definition);
for(const r of index.values())if(['product','device','software_edition'].includes(r.id.split('.')[0]))for(const v of r.composition_history||[])for(const l of v.composition_definition){
 assert(!Object.hasOwn(l,'role'),'Unretired role '+r.id);
 if(r.id.startsWith('product.'))assert.equal(l.supply_condition.kind,'always','Conditional commercial composition '+r.id);
}
for(const m of review.role_transformations){
 const line=versions(m.record_id).find(v=>v.version_number===m.version_number).composition_definition.find(l=>l.id===m.line_id);
 assert.equal(line.element_type??null,m.after_element_type);
 if(m.before_role.trim())assert(line.element_type.includes(m.before_role));
 if(m.before_element_type)assert(line.element_type.startsWith(m.before_element_type));
}
for(const l of lines('product.artemis_budget_128_hdd'))assert(!['software_edition.abacus_3','device.network_card_artemis'].includes(l.target.record_id));
for(const [id,software] of [['product.ncc82_mouse_learning','software_edition.entertainment_suite'],['product.ncc82_mouse_learning_aionix','software_edition.entertainment_suite.era']]){
 assert.deepEqual(lines(id).map(l=>l.target.record_id),['device.logix_mouse',software]);
 assert(index.get('process.ncc1982_campaign').outcomes[0].subject_ids.includes(id));
}
for(const [id,target,host] of [['product.software_aionix2','device.athena.system_rom','Athena'],['product.software_aionix2_server','device.athena_server.system_rom','Athena Server']]){
 const r=index.get(id);assert.equal(r.kind,'service');assert.equal(r.technical_identity.record_id,target);assert.deepEqual(lines(id).map(l=>l.target.record_id),[target]);assert.equal(r.specification.find(s=>s.type==='compatibility').value,host);
}
const cable=lines('product.retail.connect_office')[0];assert.equal(cable.quantity,1);assert.equal(cable.unit,'each');assert.equal(cable.target.record_id,'base_part.logix_network_cable_2m');assert.equal(index.get(cable.target.record_id).specification[0].value,'2 m');
const cpm=lines('product.retail.cpm_migration')[0];assert.equal(cpm.quantity,1);assert.equal(cpm.target.record_id,'device.artemis_cpm80_module');
// Workstation and network-card contents must not gain another cable or change their supplied part.
for(const id of ['product.retail.developer_workstation','device.network_card_artemis','device.network_card_aurelia']){
 const p=proposals.find(p=>p.elements.some(e=>e.record_id===id));const e=p.elements.find(e=>e.record_id===id);
 const strip=r=>r.composition_history.map(v=>v.composition_definition.map(({role,element_type,...l})=>l));assert.deepEqual(strip(e.after),strip(e.before));
}
const workstation=resolveComposition(index,'product.retail.developer_workstation',1);assert.equal(workstation.leaves.filter(l=>l.record_id==='base_part.logix_network_cable').reduce((n,l)=>n+l.quantity,0),1);
assert.equal(workstation.leaves.filter(l=>l.record_id==='base_part.logix_network_cable_2m').length,0);
// Entitlements and all unrelated structures survive the role-only proposals unchanged.
for(const p of proposals.filter(p=>p.id.startsWith('change.merge_composition_roles_')))for(const e of p.elements){
 const strip=r=>{const copy=structuredClone(r);for(const v of copy.composition_history)for(const l of v.composition_definition){delete l.role;delete l.element_type;}return copy;};assert.deepEqual(strip(e.before),strip(e.after));
}
assert.deepEqual(files,initial,'Simulation must not mutate source data');
console.log(JSON.stringify({result:'passed',proposals:proposals.length,pending:pending.length,record_edits_and_additions:proposals.reduce((n,p)=>n+p.elements.length,0),independent_and_batch_approval:'passed',strict_catalogue:'passed',remaining_conditional_product_lines:0,remaining_legacy_composition_roles:0,workstation_cables:1,workstation_new_cables:0},null,2));
