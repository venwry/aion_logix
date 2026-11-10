import {removeUnfittedLegacyGraphics} from './base-computer-graphics-boundary.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {resolveComposition} from '../code/composition.js';
import {validateCatalogue} from './validate-catalogue.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/technical-narrative-refinement/';
const boundaryFile='data_storytelling/review_evidence/base-computer-graphics-boundary/proposals.json';
const boundaryProposals=fs.existsSync(boundaryFile)?read(boundaryFile).change:[];
const proposals=read(root+'proposals.json').change.map(p=>boundaryProposals.find(q=>q.id===p.id)||p);
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)])));
const request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
const queue=files['data_storytelling/change.json'].change,waiting=proposals.filter(p=>queue.some(q=>q.id===p.id));
const before=new Map(records(files).map(r=>[r.id,r]));for(const p of proposals)for(const e of p.elements)before.set(e.record_id,e.before);
const originalHash=hash(files),all=waiting.length?transact(files,request(waiting)).files:files,after=new Map(records(all).map(r=>[r.id,r]));
assert.deepEqual(validate(files).errors,[]);assert.deepEqual(validate(all).errors,[]);
const touched=new Set();let sockets=0,modeCount=0,explicitModes=0;
for(const p of proposals){
 assert.deepEqual(queue.find(q=>q.id===p.id)||files['data_storytelling/authorization_decision.json'].authorization_decision.findLast(d=>d.change_id===p.id)?.proposal,p);
 if(waiting.includes(p))assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);
 for(const e of p.elements){
  assert(!touched.has(e.record_id));touched.add(e.record_id);
  const actual=after.get(e.record_id);assert.deepEqual(actual,e.after);
  const restored=structuredClone(actual);delete restored.technical_specification;delete restored.graphic_modes_specification;
  for(const v of restored.composition_history||[])if(v.expansion_socket_groups){v.technical_definition.expansion_socket_groups=v.expansion_socket_groups;delete v.expansion_socket_groups;sockets++;}
  const expectedLegacy=removeUnfittedLegacyGraphics(structuredClone(e.before));
  assert.deepEqual(restored,expectedLegacy,'Only new sections, socket relocation and reviewed unfitted-graphics cleanup may change');
  for(const v of actual.composition_history||[])assert.deepEqual(resolveComposition(after,e.record_id,v.version_number),resolveComposition(before,e.record_id,v.version_number));
  const references=value=>{const found=new Set();function walk(x){if(typeof x==='string'&&before.has(x))found.add(x);else if(x&&typeof x==='object')for(const v of Object.values(x))walk(v);}walk(value);return found;};
  const priorRefs=references([expectedLegacy.technical_definition,...(expectedLegacy.composition_history||[]).map(v=>v.technical_definition)]);
  const migratedRefs=references([actual.technical_specification,actual.graphic_modes_specification,...(actual.composition_history||[]).map(v=>v.expansion_socket_groups)]);
  for(const id of priorRefs)if(id!==e.record_id)assert(migratedRefs.has(id),e.record_id+': migration lost direct technical reference '+id);
  const modeSource=[];function find(x){if(!x||typeof x!=='object')return;for(const [k,v] of Object.entries(x)){if(['text_modes','bitmap_modes'].includes(k))modeSource.push(...v);else find(v);}}
  find(expectedLegacy.technical_definition);for(const v of expectedLegacy.composition_history||[])find(v.technical_definition);
  explicitModes+=modeSource.length;modeCount+=actual.graphic_modes_specification?.length||0;
  for(const old of modeSource){const mode=actual.graphic_modes_specification.find(m=>m.id===old.id);assert(mode);assert.equal(mode.width,old.width);assert.equal(mode.height,old.height);assert.equal(mode.framebuffer_size,old.ram_bytes_per_page??old.bytes_per_framebuffer??old.framebuffer_bytes);if(old.double_buffering!==undefined)assert.equal(mode.double_buffering,old.double_buffering);if(old.sprites_available!==undefined)assert.equal(mode.sprites_available,old.sprites_available);assert(!('configurations' in mode));assert(!('required_raster_ids' in mode));}
 }
}
// Batch order and independently saved approvals must yield the same foundation.
const ordered=f=>records(f).sort((a,b)=>a.id.localeCompare(b.id));
if(waiting.length)assert.deepEqual(ordered(transact(files,request([...waiting].reverse())).files),ordered(all));
let sequential=files;for(const p of [...waiting].reverse())sequential=transact(sequential,request([p])).files;
assert.deepEqual(ordered(sequential),ordered(all));
for(const r of records(all))if(!touched.has(r.id))assert.deepEqual(r,before.get(r.id));
assert.deepEqual(validateCatalogue(Object.fromEntries(Object.entries(all).filter(([p])=>p.startsWith('data_foundation/')).map(([,d])=>[Object.keys(d)[0],d]))).errors,[]);
assert.equal(hash(files),originalHash);
const result={result:'passed',proposals:proposals.length,pending:waiting.length,records:touched.size,socket_groups_relocated_versions:sockets,applicable_explicit_modes_preserved:explicitModes,mode_entries_including_professional_inheritance:modeCount,independent_batch_reverse_sequential_approval:'passed',direct_technical_references:'preserved; redundant self references removed',resolved_boms:'unchanged',live_foundation_and_authorization:'unchanged'};
console.log(JSON.stringify(result,null,2));
