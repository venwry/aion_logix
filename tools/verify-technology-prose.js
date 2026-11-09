import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {hash,records,transact,validate} from '../server/model.js';
import {specificationSegments} from '../code/technology-specification.js';
import {checkTechnologyProse} from './technology-prose-rules.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='data_storytelling/review_evidence/technology-prose-refinement/';
const review=read(root+'review.json'),prior=read(review.prior_proposals).change,proposals=read(root+'proposals.json').change;
const files=Object.fromEntries(['data_foundation','data_storytelling'].flatMap(d=>fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>[d+'/'+f,read(d+'/'+f)]))),initial=structuredClone(files);
const pending=files['data_storytelling/change.json'].change,decisions=files['data_storytelling/authorization_decision.json'].authorization_decision,index=new Map(records(files).map(r=>[r.id,r]));
const current=id=>pending.find(p=>p.id===id)||decisions.findLast(d=>d.change_id===id)?.proposal;
assert.deepEqual(validate(files).errors,[]);
const rendered=c=>specificationSegments(c.description,c.parameters).map(p=>p.text).join('');
const find=(ps,id)=>ps.find(p=>p.elements[0].record_id===id).elements[0].after;
for(const p of proposals){
 assert.deepEqual(current(p.id),p);const earlier=prior.find(x=>x.id===p.id);assert(earlier);assert.deepEqual(p.elements[0].before,earlier.elements[0].before);
 const after=p.elements[0].after,before=earlier.elements[0].after;
 assert.deepEqual({...after,specification:[]},{...before,specification:[]},'Only specification may change');
 assert.deepEqual(after.specification.map(c=>c.number),before.specification.map(c=>c.number));assert.deepEqual(checkTechnologyProse(after),[]);
 for(const c of before.specification){
  const next=after.specification.find(n=>n.number===c.number),text=rendered(next)+' '+next.parameters.map(p=>p.key+': '+p.value).join(' ');
  for(const parameter of c.parameters){
   // Scalar quantities and typed IDs must survive the prose edit unchanged.
   if(/^(\d+(\.\d+)?|0x[0-9a-f]+|(?:technology|device|base_part)\.[\w.]+)$/i.test(parameter.value)){
    // Self-references to the owning API are redundant, not technical data.
    if(parameter.value===after.id)continue;
    assert(text.includes(parameter.value),'Lost scalar/reference '+after.id+' '+c.number+' '+parameter.key);
   }
  }
 }
}
const flex=find(proposals,'technology.flexibus'),metadata=flex.specification[0].parameters.find(p=>p.key==='Peripheral ROM metadata');assert.equal(metadata.value,'DEVICE ID, DEVICE TYPE, VENDOR, PROTOCOL VERSION, POWER REQUIREMENTS');assert(rendered(flex.specification[0]).includes(metadata.value));
assert(rendered(flex.specification.find(c=>c.number===9)).includes('Logix commits to forward peripheral compatibility'));
const era=find(proposals,'technology.era2_architecture').specification.find(c=>c.number===47);assert.equal(era.parameters.find(p=>p.key==='Controller target 12mhz four word refill clocks').value,'3, 2, 2, 2');
// Compare every former video configuration with the named allocation alternatives.
for(const c of find(prior,'technology.aurelia_video_profile').specification){
 const next=find(proposals,'technology.aurelia_video_profile').specification.find(x=>x.number===c.number),values=new Map(next.parameters.map(p=>[p.key,p.value]));
 for(const p of c.parameters.filter(p=>/^Configuration \d+$/.test(p.key))){
  const f=Object.fromEntries(p.value.split('; ').map(s=>s.split(': '))),count=f['Text buffer count']||f['Framebuffer count'],name=count==='1'?'Single-page':'Double-page';
  assert.equal(values.get(name+' allocation (bytes)'),f['Allocated bytes']);assert.equal(values.get(name+' spare RAM (bytes)'),f['Remaining video RAM bytes']);assert(['0',values.get('Sprites available')].includes(f['Sprite count']));
 }
}
// Check the binding and scope together, including long aliases and terminal profiles.
for(const c of find(prior,'technology.logix_tui_keyboard_standard').specification){
 const next=find(proposals,'technology.logix_tui_keyboard_standard').specification.find(x=>x.number===c.number),text=rendered(next);
 for(const p of c.parameters.filter(p=>p.value.includes('; scope: '))){const [binding,scope]=p.value.split('; scope: ');assert.equal(next.parameters.find(n=>n.key===p.key).value,binding);assert(text.includes(scope),'Lost command scope '+p.key);}
}
for(const p of review.unrelated_proposals)assert.deepEqual(current(p.id),p);
if(proposals.every(p=>pending.some(q=>q.id===p.id)))for(const [path,sha] of Object.entries(review.preserved_files_sha256))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,'Unrelated data or review history changed '+path);
const waiting=proposals.filter(p=>pending.some(q=>q.id===p.id)),request=ps=>({action:'approve_changes',changes:ps.map(p=>({change_id:p.id,proposal_sha256:hash(p)}))});
for(const p of waiting){assert.deepEqual(p.elements[0].before,index.get(p.elements[0].record_id));assert.deepEqual(validate(transact(files,request([p])).files).errors,[]);}
const apply=ps=>ps.length?transact(files,request(ps)).files:files,result=apply(waiting);assert.deepEqual(records(result),records(apply([...waiting].reverse())));
assert.deepEqual(files,initial);
console.log(JSON.stringify({result:'passed',proposals:proposals.length,chapters:proposals.reduce((n,p)=>n+p.elements[0].after.specification.length,0),parameters_before:prior.reduce((n,p)=>n+p.elements[0].after.specification.reduce((n,c)=>n+c.parameters.length,0),0),parameters_after:proposals.reduce((n,p)=>n+p.elements[0].after.specification.reduce((n,c)=>n+c.parameters.length,0),0),unused_parameters:0,boolean_parameters:0,independent_and_batch_approval:'passed',foundation_and_authorization_unchanged:true},null,2));
