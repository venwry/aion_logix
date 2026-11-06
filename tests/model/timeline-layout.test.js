import test from 'node:test';import assert from 'node:assert/strict';import {timelineTree,layoutTimeline} from '../../code/timeline-layout.js';
const t=s=>Date.parse(s),item=(id,start,end,extra={})=>({record:{id,...extra},type:id.split('.')[0],date:start?{start:t(start),end:t(end||start),startLabel:start,endLabel:end||start,span:!id.startsWith('event.')}:null});
const boundary=value=>({value,precision:'event'});
test('campaign execution stays one node, while all child cards share a common edge',()=>{
 const tree=timelineTree([item('campaign.a','1978-01-01','1979-12-31',{process_id:'process.a'}),item('process.a','1978-01-01','1979-12-31',{steps:[{event_id:'event.a'},{process_id:'process.child'}]}),item('event.a','1978-06-01'),item('process.child','1978-05-01','1978-08-01')]);
 assert(!tree.nodes.has('process.a'));assert.equal(tree.nodes.get('campaign.a').members.length,2);
 const layout=layoutTimeline(tree.nodes,1978,1979),parent=layout.nodes.get('campaign.a'),child=layout.nodes.get('process.child');
 assert.equal(parent.cardLeft,child.cardLeft);assert.equal(child.bottom-child.top,54);assert(child.anchor>parent.anchor);assert(child.endAnchor<parent.endAnchor);assert.equal(parent.trackCount,2);
});
test('overlapping children have distinct tracks and sequential children reuse them',()=>{
 const tree=timelineTree([item('process.p','1978-01-01','1979-01-01',{steps:['a','b','c'].map(id=>({process_id:'process.'+id}))}),item('process.a','1978-02-01','1978-05-01'),item('process.b','1978-04-01','1978-06-01'),item('process.c','1978-07-01','1978-09-01')]);
 const {nodes}=layoutTimeline(tree.nodes,1978,1979),a=nodes.get('process.a'),b=nodes.get('process.b'),c=nodes.get('process.c');assert.notEqual(a.track,b.track);assert.equal(a.track,c.track);assert.equal(a.cardLeft,b.cardLeft);assert.equal(nodes.get('process.p').trackCount,3);
});
test('global anchors match across roots even when one has same-day nested cards',()=>{
 const d='1978-02-01',tree=timelineTree([item('process.a',d,'1978-06-01',{steps:[{process_id:'process.b'}]}),item('process.b',d,'1978-05-01',{steps:[{event_id:'event.c'}]}),item('event.c',d),item('event.unrelated',d),item('event.next','1978-02-02')]);
 const l=layoutTimeline(tree.nodes,1978,1978),a=l.nodes.get('process.a'),b=l.nodes.get('process.b'),c=l.nodes.get('event.c');assert.equal(a.anchor,b.anchor);assert.equal(b.anchor,c.anchor);assert.equal(c.anchor,l.nodes.get('event.unrelated').anchor);assert(a.bottom<b.top);assert(b.bottom<c.top);assert(c.bottom<l.nodes.get('event.next').top);
});
test('parallel root groups never overlap; sequential roots reuse a lane',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1978-06-01'),item('process.b','1978-03-01','1978-08-01'),item('process.c','1978-09-01','1978-12-01')]),l=layoutTimeline(tree.nodes,1978,1978);
 for(const a of l.roots)for(const b of l.roots)if(a!==b&&a.groupTop<b.groupBottom&&a.groupBottom>b.groupTop)assert(a.left+a.width<=b.left||b.left+b.width<=a.left);
 assert.equal(l.nodes.get('process.a').left,l.nodes.get('process.c').left);
});
test('unknown and outside dates are not invented; cycles cannot recurse',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1978-12-31',{steps:[{event_id:'event.early'},{process_id:'process.unknown'}]}),item('event.early','1977-01-01'),item('process.unknown')]);assert.equal(tree.nodes.get('event.early').parent,null);assert.equal(tree.nodes.get('process.unknown').parent,'process.a');assert(!layoutTimeline(tree.nodes,1977,1979).nodes.has('process.unknown'));
 const cycle=timelineTree([item('process.a','1978-01-01','1979-01-01',{parent_process_id:'process.b'}),item('process.b','1978-01-01','1979-01-01',{parent_process_id:'process.a'})]);assert.equal(layoutTimeline(cycle.nodes,1978,1979).roots.length,1);
});
test('start and end occurrences bracket all same-day descendants without changing anchors',()=>{
 const d='1978-01-01',tree=timelineTree([item('process.p',d,d,{period:{start:boundary('event.start'),end:boundary('event.end')},steps:[{process_id:'process.child'}]}),item('process.child',d,d,{steps:[{event_id:'event.step'}]}),...['start','end','step'].map(id=>item('event.'+id,d))]),l=layoutTimeline(tree.nodes,1978,1978),list=l.roots[0].entries;
 assert.deepEqual(list.map(n=>n.record.id),['process.p','event.start','process.child','event.step','event.end']);
 assert(list.every(n=>n.anchor===list[0].anchor));for(let i=1;i<list.length;i++)assert(list[i-1].bottom<list[i].top);
});
test('shared boundary retains its underlying record and both owning roles',()=>{
 const tree=timelineTree([item('process.a','1978-01-01','1978-02-01',{period:{end:boundary('event.move')}}),item('process.b','1978-02-01','1978-03-01',{period:{start:boundary('event.move')}}),item('event.move','1978-02-01')]);assert(!tree.nodes.has('event.move'));assert.equal(tree.occurrences.get('event.move').length,2);
 const l=layoutTimeline(tree.nodes,1978,1978);assert.equal(l.nodes.get(tree.occurrences.get('event.move')[0]).anchor,l.nodes.get(tree.occurrences.get('event.move')[1]).anchor);
});
test('range clipping has explicit continuation flags and month labels retain precision',()=>{
 const tree=timelineTree([item('process.a','1977-01-01','1980-01-01'),item('event.month','1978-06-01',null)]);tree.nodes.get('event.month').date.startLabel='1978-06';
 const l=layoutTimeline(tree.nodes,1978,1978),p=l.nodes.get('process.a');assert(p.clippedStart&&p.clippedEnd);assert.equal(p.begin,t('1978-01-01'));assert(l.ticks.some(t=>t.labels.includes('1978-06')));assert(!l.ticks.some(t=>t.labels.includes('1978-06-01')));
});
