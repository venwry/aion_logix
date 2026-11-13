import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')&&f!=='authorization_decision.json').map(f=>[d+'/'+f,read(d+'/'+f)])));
files['data_storytelling/authorization_decision.json']={authorization_decision:[]};
const fingerprint=hash(files),original=new Map(records(files).map(r=>[r.id,r]));
const root='data_storytelling/review_evidence/standard-families/';
const ps=read(root+'proposals.json').change,coverage=read(root+'coverage.json');
const actionable=ps.filter(p=>p.category==='foundation'),retired=Object.keys(coverage.redirects);
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
assert.deepEqual(validate(files).errors,[]);
const touched=new Set();
for(const p of ps){assert.deepEqual(files['data_storytelling/change.json'].change.find(q=>q.id===p.id),p);for(const e of p.elements){assert(!touched.has(e.record_id));touched.add(e.record_id);assert.deepEqual(e.before,original.get(e.record_id));assert.notDeepEqual(e.before,e.after);}}
for(const p of actionable)assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
const result=transact(files,request(actionable)).files;assert.deepEqual(validate(result).errors,[]);
assert.deepEqual(records(result),records(transact(files,request([...actionable].reverse())).files));
const index=new Map(records(result).map(r=>[r.id,r]));
for(const id of retired){assert(!index.has(id));for(const r of index.values())assert(!JSON.stringify(r).includes(id),r.id+' retains '+id);}
for(const r of index.values())if(!touched.has(r.id))assert.deepEqual(r,original.get(r.id));
for(const id of ['technology.flexibus','technology.logix_tui_standard','technology.aion_c_portability_framework'])assert(index.get(id).kind.endsWith('_standard'));
assert.equal(index.get('technology.plug_and_execute').kind,original.get('technology.plug_and_execute').kind);
const remap=value=>Object.entries(coverage.redirects).reduce((s,[from,to])=>s.replaceAll(from,to),value);
for(const entry of coverage.chapters){
 const source=original.get(entry.source_id).specification.find(c=>c.number===entry.source_number),target=index.get(entry.target_id).specification.find(c=>c.number===entry.target_number);
 if(entry.method.startsWith('User-facing'))continue;
 assert.deepEqual(target.parameters,source.parameters.map(p=>({...p,value:coverage.parameter_revisions.find(v=>v.target_id===entry.target_id&&v.target_number===entry.target_number&&v.key===p.key)?.after??remap(p.value)})));
 if(entry.source_id==='technology.flexibus_pointing_device'&&entry.source_number===5){
  const phrase='Primary button focuses/selects/activates; secondary opens context actions where provided. Middle-finger roller scrolls vertically; thumb roller scrolls horizontally. Wheels have no implicit press buttons.';
  assert(index.get('technology.logix_tui_standard').specification.some(c=>c.description.includes(phrase)));
  for(const paragraph of source.description.split('\n\n').filter(p=>p!==phrase))assert(target.description.includes(remap(paragraph)));
 }else assert(target.description.includes(remap(source.description)),entry.source_id+' chapter '+entry.source_number);
}
// Other queued foundation proposals must remain individually approvable after consolidation.
let remaining=0;
for(const p of result['data_storytelling/change.json'].change)if(p.category==='foundation'&&p.elements?.length){assert.deepEqual(validate(transact(result,request([p])).files).errors,[],p.id);remaining++;}
assert.equal(hash(files),fingerprint);
console.log(JSON.stringify({result:'passed',actionable_proposals:actionable.length,discussion:1,record_operations:touched.size,retired_records:retired.length,chapter_coverage:coverage.chapters.length,remaining_proposals_checked:remaining,foundation_and_authorization:'unchanged'}));
