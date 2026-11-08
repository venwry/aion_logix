// Read-only audit of the four remaining phase-4 proposals after partial approval.
// Approval simulations use the real transaction code exclusively in memory.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {hash, records, transact, validate} from '../server/model.js';
import {latestReview} from '../server/editorial.js';
const read = path => JSON.parse(fs.readFileSync(path));
const evidence = read('data_storytelling/review_evidence/catalogue-phase4/remaining-feedback.json');
const files = Object.fromEntries(['data_foundation', 'data_storytelling'].flatMap(dir => fs.readdirSync(dir)
 .filter(path => path.endsWith('.json')).map(path => [dir+'/'+path, read(dir+'/'+path)])));
const original = structuredClone(files);
const proposals = files['data_storytelling/change.json'].change;
assert.deepEqual(proposals.map(p => p.id), evidence.feedback_actions.map(f => f.change_id), 'Run while the four recorded follow-up proposals are pending.');
for (const [path, sha] of Object.entries(evidence.preserved_files_sha256)) {
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'), sha, 'Unexpected source edit: '+path);
}
assert.deepEqual(validate(files).errors, []);
const before = new Map(records(files).map(r => [r.id, r]));
const targets = new Set();
for (const p of proposals) {
 const feedback = evidence.feedback_actions.find(f => f.change_id === p.id);
 const review = files['data_storytelling/change_review.json'].change_review.find(r => r.id === feedback.review_id);
 assert.equal(review.proposal_sha256, feedback.reviewed_proposal_sha256);
 assert.equal(hash(p), feedback.revised_proposal_sha256);
 assert.notEqual(hash(p), review.proposal_sha256);
 assert.equal(latestReview(files, p.id, hash(p)), undefined, 'Old feedback must not block the revised proposal.');
 for (const e of p.elements) {
  assert(!targets.has(e.record_id), 'Overlapping proposals: '+e.record_id);
  targets.add(e.record_id);
  assert.deepEqual(e.before, before.get(e.record_id) ?? null);
  if (e.record_type === 'event') {
   assert.deepEqual(e.after.time, e.before.time, 'Do not change chronology.');
   assert(!e.after.category, 'Owned events cannot have a category.');
   assert(!/\.json|\.md|\$\d|alternate.history/i.test(e.after.description), 'Story prose contains editorial or pricing material.');
  }
  if (e.record_type === 'product' && e.after) {
   assert.deepEqual(e.after.technology_ids, []);
   for (const s of e.after.specification) {
    assert(Object.hasOwn(s, 'value'));
    assert(!/[\[\]/]/.test(s.type), 'Imported specification path');
    assert(s.description.trim());
   }
  }
 }
 const approved = files['data_storytelling/authorization_decision.json'].authorization_decision;
 for (const id of p.depends_on_change_ids || []) assert(approved.some(d => d.change_id === id), 'Prerequisite not already approved: '+id);
}
const request = selected => ({action:'approve_changes', changes:selected.map(p => ({change_id:p.id, proposal_sha256:hash(p)}))});
for (const p of proposals) assert.deepEqual(validate(transact(files, request([p])).files).errors, [], p.id);
const applied = transact(files, request(proposals)).files;
const reverse = transact(files, request([...proposals].reverse())).files;
assert.deepEqual(validate(applied).errors, []);
assert.deepEqual(records(applied), records(reverse));
for (const order of [proposals, [...proposals].reverse()]) {
 let sequential = files;
 for (const p of order) sequential = transact(sequential, request([p])).files;
 assert.deepEqual(records(sequential), records(applied));
}
const after = new Map(records(applied).map(r => [r.id, r]));
// All technical definitions, including both professional engineering/retail
// revisions and the independent June handover, must survive byte-equivalently.
for (const r of before.values()) if (!targets.has(r.id)) assert.deepEqual(after.get(r.id), r);
for (const r of before.values()) if (/^(device|base_part|software_edition|technology|manufacturing_capability)\./.test(r.id)) assert.deepEqual(after.get(r.id), r);
assert.deepEqual(after.get('event.autodesk_professional_handover'), before.get('event.autodesk_professional_handover'));
const professional = ['product.device_mono_pro_17', 'product.device_artemis_professional_video_128kb', 'product.comdex82_professional_hardware'];
for (const id of professional) {
 const p = after.get(id);
 assert.equal(p.launch_campaign_id, 'campaign.comdex1982');
 assert.equal(p.launch_event_id, 'event.autodesk_comdex');
 assert(!after.get('campaign.comdex1982').subject_ids.includes(id));
 for (const line of p.composition_history[0].composition_definition) if (line.target.record_id !== 'device.logix_mouse') assert.equal(line.target.version_number, 2);
}
for (const id of evidence.ncc_product_ids) {
 assert.equal(after.get(id).launch_campaign_id, 'campaign.ncc1982');
 assert.equal(after.get(id).launch_event_id, 'event.ncc82_graphics_mouse');
}
const bannedNcc = /mono_pro_17|professional_video_128kb|ncc82_professional_graphics|Mono Pro 17|128\s*(KiB|KB)|AutoCAD|Autodesk|800x600|\.json|alternate.history|\$\d/i;
for (const id of evidence.ncc_record_ids) {
 const record = after.get(id);
 assert(!bannedNcc.test(JSON.stringify(record)), 'Out-of-scope professional offering or editorial content: '+id);
 if (id.startsWith('event.')) {
  assert.deepEqual(record.subject_ids, []);
  assert(!/product\./.test(JSON.stringify(record)), 'Repeated product list on marketing event: '+id);
 }
}
assert(!after.has('product.ncc82_professional_graphics'));
assert(!records(applied).some(r => JSON.stringify(r).includes('product.ncc82_professional_graphics')));
assert.deepEqual(after.get('process.autodesk_development').period.end, before.get('event.autodesk_comdex').time);
assert(after.get('process.comdex1982_campaign').steps.some(s => s.event_id === 'event.autodesk_comdex'));
// The amount has a currency and cadence; periods are successive rates, not host tiers.
for (const [suffix, values] of Object.entries({service_customer_care:[49], service_professional_support:[249,299], service_professional_business_onsite:[449]})) {
 const product = after.get('product.'+suffix);
 const prices = product.specification.filter(s => s.type === 'price');
 assert.deepEqual(prices.map(s => s.value), values);
 assert(prices.every(s => s.unit === 'USD/year'));
 assert.equal(product.specification.find(s => s.type === 'duration').value, '1 year');
 assert.match(product.specification.find(s => s.type === 'eligibility').value, /initial year/);
}
assert.match(after.get('product.service_professional_support').specification.filter(s => s.type === 'price')[1].description, /replaces the earlier rate/);
assert.deepEqual(files, original, 'Approval simulation mutated its source.');
console.log(JSON.stringify({result:'passed', source_commit:evidence.source_commit, revised_proposals:proposals.length, proposal_elements:targets.size, individual_batch_reverse_and_sequential_approvals_valid:true, current_before_snapshots_match:true, feedback_history_and_authorization_unchanged:true, technical_definitions_and_june_handover_unchanged:true, ncc_scope_and_comdex_ownership_valid:true, no_authorization_saved:true}, null, 2));
