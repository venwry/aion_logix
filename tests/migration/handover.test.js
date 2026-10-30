import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));
test('relocated historical evidence retains byte-exact checksums',()=>{
 for(const item of read('archived_no_longer_valid/inventory.json').files){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(item.archive_path)).digest('hex'),item.sha256,item.archive_path);
  if(item.action==='moved')assert(!fs.existsSync(item.original_path),item.original_path+' remains active');
 }
});
test('open issues reference current records and deferred material stays discoverable',()=>{
 const ids=new Set(fs.readdirSync('data_foundation').flatMap(n=>Object.values(read('data_foundation/'+n))[0]).map(r=>r.id));
 for(const issue of read('data_storytelling/reconciliation_issue.json').reconciliation_issue){assert.equal(issue.state,'open');for(const id of issue.affected_ids)assert(ids.has(id),id);}
 const backlog=fs.readFileSync('docs/REVIEW_BACKLOG.md','utf8');
 for(const item of read('archived_no_longer_valid/data_storytelling/migration_map.json').migration_map.filter(x=>x.disposition==='deferred'))assert(backlog.includes(item.id),item.id);
 for(const item of read('archived_no_longer_valid/data_storytelling/phase1b_migration.json').migration[0].notes)assert(backlog.includes(item.record_id),item.record_id);
});
test('current Markdown links resolve after archive relocation',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
 const files=['README.md','DATA_MODEL_PRINCIPLES.md',...walk('docs').filter(n=>n.endsWith('.md'))];
 for(const file of files){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
  const url=m[1].split('#')[0];if(!url||/^[a-z]+:|^\//i.test(url))continue;
  assert(fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(url))),file+': '+url);
 }}
});
