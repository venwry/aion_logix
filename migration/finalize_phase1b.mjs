// Finalize fingerprints with the same JavaScript canonical serializer as the API.
// Only run immediately after migration, before accepting any changed story content.
import fs from 'node:fs';import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');
const records=new Map(fs.readdirSync('data_foundation').filter(f=>f.endsWith('.json')).flatMap(f=>Object.values(read('data_foundation/'+f))[0]).map(r=>[r.id,r]));
const previous=new Map(fs.readdirSync('data_storytelling/history/phase1b-0.3.0/foundation').flatMap(f=>Object.values(read('data_storytelling/history/phase1b-0.3.0/foundation/'+f))[0]).map(r=>[r.id,r]));
const auth=read('data_storytelling/authorization.json');for(const a of auth.authorization){if(a.state==='authorized'&&hash(records.get(a.record_id))!==a.content_sha256)throw Error('Cannot change an authorized fingerprint');if(a.state==='unauthorized')a.content_sha256=hash(records.get(a.record_id));}write('data_storytelling/authorization.json',auth);
const report=read('data_storytelling/phase1b_migration.json');for(const r of report.migration[0].review){r.before_sha256=previous.has(r.record_id)?hash(previous.get(r.record_id)):null;r.after_sha256=hash(records.get(r.record_id));}write('data_storytelling/phase1b_migration.json',report);
