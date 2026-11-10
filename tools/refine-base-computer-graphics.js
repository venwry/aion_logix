import fs from 'node:fs';import assert from 'node:assert/strict';
import {hash} from '../server/model.js';
import {correctBaseComputerGraphics,unfittedGraphicsHosts} from './base-computer-graphics-boundary.js';
const read=p=>JSON.parse(fs.readFileSync(p)),file='data_storytelling/change.json',queue=read(file),id='change.technical_specifications_device_3';
const proposal=queue.change.find(p=>p.id===id);assert(proposal,'Pending proposal not found');
const root='data_storytelling/review_evidence/base-computer-graphics-boundary';
assert(!fs.existsSync(root+'/proposals.json'),'Refinement already exists; do not overwrite review evidence');
const devices=new Map(read('data_foundation/device.json').device.map(r=>[r.id,r]));
const previous=structuredClone(proposal),audit={feedback_id:'change_review.daba3e88-f7bc-425c-83a2-e1ecf51c2231',previous_proposal_sha256:hash(previous),records:[]};
for(const e of proposal.elements){
 if(!unfittedGraphicsHosts[e.record_id])continue;
 assert.deepEqual(e.before,devices.get(e.record_id));
 const cardId=unfittedGraphicsHosts[e.record_id],card=devices.get(cardId),graphics=e.after.composition_history[0].technical_definition.technical_profile.video;
 assert.deepEqual(graphics,card.composition_history[0].technical_definition.specification,'Host copy differs from its card definition');
 assert(e.after.composition_history.every(v=>!v.composition_definition.some(l=>/video_card|professional_video|\.video$/.test(l.target.record_id))),'Base computer already has a video device');
 audit.records.push({record_id:e.record_id,graphics_definition_retained_at:cardId,removed_mode_entries:e.after.graphic_modes_specification.length,removed_chapters:e.after.technical_specification.chapters.filter(c=>['Display architecture','Display memory and sprites','Scanout pipeline','Memory arbitration and display qualification'].includes(c.chapter_name)).map(c=>c.chapter_name)});
 correctBaseComputerGraphics(e.after);
}
assert.equal(audit.records.length,4);
proposal.reason=proposal.reason.replace('Legacy technical definitions remain unchanged for step 5;', 'Legacy technical definitions remain for step 5, except the copied unfitted-card graphics removed by this amendment;');
proposal.reason+=' Author feedback clarification: Artemis, Artemis PRO, Athena and Athena Server are base computers without an installed graphics card. Remove their copied card implementation chapters, parameters and all graphics modes, including the equivalent legacy video blocks and fixed-mode claims. Preserve the host video-slot interface, compatibility lists and installation requirements. Corresponding card records already own the exact removed implementations. Leave integrated Aurelia/Aurelia+ video, all BOMs, version boundaries and the other 16 elements unchanged.';
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(root+'/before-proposal.json',JSON.stringify({change:[previous]},null,2)+'\n');fs.writeFileSync(root+'/proposals.json',JSON.stringify({change:[proposal]},null,2)+'\n');fs.writeFileSync(root+'/audit.json',JSON.stringify(audit,null,2)+'\n');fs.writeFileSync(file,JSON.stringify(queue,null,2)+'\n');
console.log(JSON.stringify({proposal:id,affected_records:audit.records.map(r=>r.record_id),removed_modes:audit.records.reduce((sum,r)=>sum+r.removed_mode_entries,0)},null,2));
