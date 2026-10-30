import test from 'node:test';import assert from 'node:assert/strict';import {timelineTree,layoutTimeline} from '../../code/timeline-layout.js';
const t=s=>Date.parse(s),item=(id,start,end,extra={})=>({record:{id,...extra},type:id.split('.')[0],date:start?{start:t(start),end:t(end||start),span:!id.startsWith('event.')}:null});
test('campaign and execution merge and explicit steps nest without duplicating records',()=>{
 const tree=timelineTree([item('campaign.a','1978-01-01','1979-12-31',{process_id:'process.a'}),item('process.a','1978-01-01','1979-12-31',{steps:[{event_id:'event.a'},{process_id:'process.child'}]}),item('event.a','1978-06-01'),item('process.child','1978-05-01','1978-08-01')]);
 assert(!tree.nodes.has('process.a'));assert.equal(tree.nodes.get('campaign.a').members.length,2);assert.equal(tree.nodes.get('event.a').parent,'campaign.a');assert.equal(tree.nodes.get('process.child').parent,'campaign.a');
 const layout=layoutTimeline(tree.nodes,1978,1979),parent=layout.nodes.get('campaign.a'),child=layout.nodes.get('process.child');assert(child.top>parent.top);assert(child.bottom<parent.bottom);assert(parent.bottom>layout.years[1].top);
});
test('parallel unrelated processes and simultaneous events have nonoverlapping rectangles',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1979-06-01'),item('process.b','1978-03-01','1979-08-01'),item('event.a','1978-06-01'),item('event.b','1978-06-01')]),layout=layoutTimeline(tree.nodes,1978,1979);
 for(const a of layout.roots)for(const b of layout.roots)if(a.id!==b.id&&a.top<b.bottom&&a.bottom>b.top)assert(a.left+a.width<=b.left||b.left+b.width<=a.left);
});
test('unknown or outside dates are never invented or absorbed into a parent range',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1978-12-31',{steps:[{event_id:'event.early'},{process_id:'process.unknown'}]}),item('event.early','1977-01-01'),item('process.unknown')]);assert.equal(tree.nodes.get('event.early').parent,null);assert.equal(tree.nodes.get('process.unknown').parent,'process.a');assert(!layoutTimeline(tree.nodes,1977,1979).nodes.has('process.unknown'));
});
test('cyclic membership cannot create a recursive layout',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1979-01-01',{parent_process_id:'process.b'}),item('process.b','1978-01-01','1979-01-01',{parent_process_id:'process.a'})]);assert.equal(layoutTimeline(tree.nodes,1978,1979).roots.length,1);
});
test('compact anchors preserve room for same-day nested headers, footers and all date labels',()=>{
 const tree=timelineTree([item('process.parent','1978-01-01','1978-01-01',{steps:[{process_id:'process.child'}]}),item('process.child','1978-01-01','1978-01-01',{steps:[{event_id:'event.a'}]}),item('event.a','1978-01-01')]);
 const layout=layoutTimeline(tree.nodes,1978,1978);
 for(const n of layout.nodes.values()){assert(n.bottom-n.top>=58);if(n.parent){const p=layout.nodes.get(n.parent);assert(n.top>=p.top+56);assert(n.bottom<=p.bottom-20);}}
 assert.equal(layout.ticks.length,1);
});
test('sequential processes reuse a column and calendar years do not add proportional whitespace',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1978-03-01'),item('process.b','1978-09-01','1978-12-01')]);const layout=layoutTimeline(tree.nodes,1978,1978);
 assert.equal(layout.nodes.get('process.a').left,layout.nodes.get('process.b').left);assert(layout.height<400);
 for(let i=1;i<layout.ticks.length;i++)assert(layout.ticks[i].top-layout.ticks[i-1].top>=24);
});

const boundary=value=>({value,precision:'event'});
test('boundary occurrences bracket same-day steps and nested processes in campaign boxes',()=>{
 const date='1978-01-01',tree=timelineTree([
  item('campaign.a',date,date,{process_id:'process.a'}),
  item('process.a',date,date,{period:{start:boundary('event.start'),end:boundary('event.end')},steps:[{event_id:'event.step'},{process_id:'process.child'},{event_id:'event.start'}]}),
  item('process.child',date,date,{steps:[{event_id:'event.nested'}]}),
  ...['start','end','step','nested'].map(id=>item('event.'+id,date))
 ]),layout=layoutTimeline(tree.nodes,1978,1978),parent=layout.nodes.get('campaign.a'),children=parent.children.map(id=>layout.nodes.get(id)),first=children[0],last=children.at(-1);
 assert.equal(first.boundary,'start');assert.equal(last.boundary,'end');assert.equal(tree.occurrences.get('event.start').length,1);
 for(const step of children.slice(1,-1)){assert(first.bottom<step.top);assert(step.bottom<last.top);}
 for(const n of layout.nodes.values())if(n.parent){const p=layout.nodes.get(n.parent);assert(n.top>=p.top+56);assert(n.bottom<=p.bottom-20);}
});
test('a shared boundary appears in both processes with one underlying event identity',()=>{
 const tree=timelineTree([
  item('process.a','1978-01-01','1978-02-01',{period:{end:boundary('event.move')}}),
  item('process.b','1978-02-01','1978-03-01',{period:{start:boundary('event.move')}}),item('event.move','1978-02-01')
 ]);
 assert(!tree.nodes.has('event.move'));assert.equal(tree.occurrences.get('event.move').length,2);
 assert.deepEqual(tree.occurrences.get('event.move').map(id=>tree.nodes.get(id).parent),['process.a','process.b']);
 assert(tree.occurrences.get('event.move').every(id=>tree.nodes.get(id).record.id==='event.move'));
});
test('one event can bracket a one-day process and retain a step in another process',()=>{
 const d='1978-01-01',tree=timelineTree([item('event.a',d),item('event.step',d),
  item('process.a',d,d,{period:{start:boundary('event.a'),end:boundary('event.a')},steps:[{event_id:'event.step'}]}),
  item('process.b',d,d,{steps:[{event_id:'event.a'}]})]);
 assert.equal(tree.occurrences.get('event.a').length,3);
 const layout=layoutTimeline(tree.nodes,1978,1978),children=layout.nodes.get('process.a').children.map(id=>layout.nodes.get(id));
 assert(children[0].bottom<children[1].top);assert(children[1].bottom<children[2].top);
});
