import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineTree,layoutTimeline} from '../../code/timeline-layout.js';
import {arrangeSwimlanes,timelineCategories} from '../../code/timeline-lanes.js';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const item=(id,extra={})=>({type:id.split('.')[0],record:{id,...extra},date:{start:Date.UTC(1980,0,1),end:Date.UTC(1980,6,1),span:!id.startsWith('event.')}});
test('campaign aliases, boundaries and descendants inherit only ownership categories',()=>{
 const tree=timelineTree([item('process.root',{category:'Product dev & launch',steps:[{process_id:'process.child'}]}),item('process.child',{period:{start:{precision:'event',value:'event.start'}}}),item('event.start'),item('campaign.alias',{process_id:'process.root'}),item('event.context',{inputs:[{process_id:'process.root'}]})]);
 assert.equal(tree.nodes.get('campaign.alias').category,'Product dev & launch');
 assert.equal(tree.nodes.get('process.child').category,'Product dev & launch');
 assert.equal(tree.nodes.get(tree.occurrences.get('event.start')[0]).category,'Product dev & launch');
 assert.equal(tree.nodes.get('event.context').category,'');
 const filtered=new Map([...tree.nodes].filter(([id])=>id==='process.child'));
 assert.equal(arrangeSwimlanes(layoutTimeline(filtered,1980,1980)).roots[0].laneId,'product');
});
test('horizontal swim-lane packing separates categories and preserves supplied calendar geometry',()=>{
 const tree=timelineTree([item('process.a',{category:timelineCategories[0].label}),item('process.b',{category:timelineCategories[0].label}),item('process.c',{category:timelineCategories[1].label}),item('event.unknown')]);
 const full=arrangeSwimlanes(layoutTimeline(tree.nodes,1980,1980));
 assert.equal(full.lanes.length,6);
 for(const lane of full.lanes)for(const root of lane.groups){assert(root.left>=lane.left);assert(root.left+root.width<=lane.left+lane.width);}
 const a=full.nodes.get('process.a'),b=full.nodes.get('process.b');assert(a.left+a.width<=b.left||b.left+b.width<=a.left);
 const hidden=arrangeSwimlanes(layoutTimeline(tree.nodes,1980,1980),new Set(['personal']));
 assert(!hidden.roots.some(r=>r.laneId==='personal'));assert(hidden.width<full.width);
 assert.deepEqual(hidden.ticks,full.ticks);assert.equal(hidden.nodes.get('process.c').anchor,full.nodes.get('process.c').anchor);
});
test('category schema accepts empty values and rejects unknown labels and child overrides',()=>{
 const docs=readDocuments(new URL('../../data_foundation/',import.meta.url));
 const root=docs.process.process.find(r=>r.id==='process.harvard_education'),child=docs.process.process.find(r=>r.id==='process.harvard_year_1');
 root.category="Adam's personal";child.category='';assert.deepEqual(validateDocuments(docs).errors,[]);
 child.category='Competition';assert(validateDocuments(docs).errors.some(e=>e.includes('inherit')));
 delete child.category;root.category='Other';assert(validateDocuments(docs).errors.some(e=>e.includes('category')));
});
