import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hash} from '../../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const all=dir=>fs.readdirSync(dir).filter(n=>n.endsWith('.json')).flatMap(n=>Object.values(read(dir+'/'+n))[0]);
// This report belongs to the 0.4.0 migration, not the latest authorized story.
const fixture=read('tests/fixtures/phase1b-result-hashes.json');
const current=new Map(Object.entries(fixture.records));
const archived=new Map(all('archived_no_longer_valid/data_storytelling/history/phase1b-0.3.0/foundation').map(r=>[r.id,r]));
const report=read('archived_no_longer_valid/data_storytelling/phase1b_migration.json').migration[0];
test('every retired identity has an explicit migration disposition',()=>{
 const mappings=new Map(report.id_mapping.map(m=>[m.old_id,m.new_ids]));
 for(const id of archived.keys())if(!current.has(id)){
  assert(mappings.has(id),id+' missing migration disposition');
  const targets=mappings.get(id);if(!targets.length)assert(id.startsWith('narrative_period.'));
  for(const target of targets)assert(current.has(target),target);
 }
});
test('migration review fingerprints match archived and pinned post-migration records',()=>{
 const reviewed=new Set(report.review.map(r=>r.record_id));
 for(const [id,r] of current)if(!archived.has(id)||r!==hash(archived.get(id)))assert(reviewed.has(id),id);
 for(const r of report.review){
  assert.equal(r.after_sha256,current.get(r.record_id));
  assert.equal(r.before_sha256,archived.has(r.record_id)?hash(archived.get(r.record_id)):null);
 }
});
