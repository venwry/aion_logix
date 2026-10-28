import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const schemaDir = fileURLToPath(new URL('../schemas/archive/0.2.0/', import.meta.url));
const schemas = Object.fromEntries(fs.readdirSync(schemaDir).filter(f => f.endsWith('.schema.json')).map(f => [f.replace('.schema.json',''), JSON.parse(fs.readFileSync(path.join(schemaDir,f)))]));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
for (const schema of Object.values(schemas)) ajv.addSchema(schema);
for (const schema of Object.values(schemas)) ajv.getSchema(schema.$id); // Compile all schemas, including empty datasets.
export const datasetNames = Object.keys(schemas).filter(n => n !== 'common');
export function recordHash(record) {
  const { confirmation, ...content } = record;
  function stable(value) { return Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value; }
  return crypto.createHash('sha256').update(JSON.stringify(stable(content))).digest('hex');
}
export function readDocuments(dir) {
  if (dir instanceof URL) dir = fileURLToPath(dir);
  return Object.fromEntries(fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => [f.slice(0,-5), JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))]));
}
export function validateDocuments(documents, { complete = false } = {}) {
  const errors = [], records = new Map(); let count = 0;
  const report = message => errors.push(message);
  for (const [name,doc] of Object.entries(documents)) {
    if (!datasetNames.includes(name)) { report(`Unknown dataset ${name}`); continue; }
    const check = ajv.getSchema(schemas[name].$id);
    if (!check(doc)) { for (const error of check.errors) report(`${name}${error.instancePath}: ${error.message}`); continue; }
    for (const record of doc[name]) {
      count++;
      if (records.has(record.id)) report(`Duplicate ID ${record.id}`);
      else records.set(record.id,record);
    }
  }
  if (errors.length) return {errors,count};
  function resolve(reference, root) {
    const [url,fragment] = reference.split('#');
    const target = url ? Object.values(schemas).find(s => s.$id === url) : root;
    return [fragment ? fragment.slice(1).split('/').reduce((v,k)=>v[k],target) : target, target];
  }
  function walk(value, schema, root, at) {
    if (schema.$ref) { const [target,newRoot] = resolve(schema.$ref,root); walk(value,target,newRoot,at); return; }
    if (schema['x-ref']) {
      const target = records.get(value);
      if (!target) report(`${at}: unresolved reference ${value}`);
      else if (!schema['x-ref'].includes(value.split('.')[0])) report(`${at}: wrong reference type ${value}`);
    }
    if (schema['x-date']) {
      const length={year:4,month:7,day:10}[value.precision];
      if (value.value.length !== length) report(`${at}: precision does not match date`);
      const full=value.value+(value.precision==='year'?'-01-01':value.precision==='month'?'-01':'');
      const date = new Date(full+'T00:00:00Z');
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==full) report(`${at}: invalid calendar date`);
      if (full < '1972-01-01') report(`${at}: story time precedes 1972-01-01`);
    }
    if (schema['x-period']) {
      // Compare uncertainty bounds, not fabricated exact dates.
      const lower = p => p.value+(p.precision==='year'?'-01-01':p.precision==='month'?'-01':'');
      const upper = p => p.precision==='year'?p.value+'-12-31':p.precision==='month'?p.value+'-31':p.value;
      if (lower(value.start)>upper(value.end)) report(`${at}: reversed period`);
    }
    if (Array.isArray(value) && schema.items) value.forEach((v,i)=>walk(v,schema.items,root,`${at}/${i}`));
    else if (value && typeof value==='object') for (const [key,v] of Object.entries(value)) if (schema.properties?.[key]) walk(v,schema.properties[key],root,`${at}/${key}`);
  }
  for (const [name,doc] of Object.entries(documents)) walk(doc,schemas[name],schemas[name],name);
  for (const record of records.values()) {
    if (record.status === 'confirmed') {
      const source=records.get(record.confirmation.source_id);
      if (source?.kind !== 'author_decision') report(`${record.id}: confirmation requires an author_decision source`);
      if (record.confirmation.record_sha256 !== recordHash(record)) report(`${record.id}: confirmation hash no longer matches content`);
    }
    if (record.id.startsWith('review_decision.')) {
      if (records.get(record.source_id)?.kind !== 'author_decision') report(`${record.id}: review requires an author_decision source`);
      if (record.decision === 'confirm') for (const target of record.target) {
        const item=records.get(target.record_id);
        if (item && recordHash(item)!==target.record_sha256) report(`${record.id}: reviewed content hash mismatch for ${item.id}`);
      }
    }
    for (const key of ['parent_process_id','parent_location_id','supersedes_agreement_id','supersedes_clause_id']) {
      let item=record;const seen=new Set();
      while (item?.[key]) { if (seen.has(item.id)) {report(`${record.id}: cycle in ${key}`);break;} seen.add(item.id);item=records.get(item[key]); }
    }
    if (record.equity) {
      const e=record.equity,n=e.beneficiary_actor_ids.length;
      if ((e.allocation==='individual'&&n!==1)||(e.allocation==='joint_unsplit'&&n<2)||(e.allocation==='unallocated_reserve'&&n!==0)) report(`${record.id}: equity beneficiary/allocation mismatch`);
    }
    if (record.id.startsWith('migration_map.')) {
      if (['mapped','merged'].includes(record.disposition)&&record.target_ids.length===0) report(`${record.id}: mapped item needs a target`);
      if (record.disposition==='split'&&record.target_ids.length<2) report(`${record.id}: split needs at least two targets`);
    }
    if (complete) {
      if (record.status!=='confirmed') report(`${record.id}: ${record.status}; review incomplete`);
      if (record.id.startsWith('reconciliation_issue.')&&record.state!=='resolved') report(`${record.id}: unresolved reconciliation issue`);
      if (record.id.startsWith('migration_map.')&&record.disposition==='deferred') report(`${record.id}: deferred migration item`);
      if (record.occurrence==='unknown'||record.state==='unknown'||record.completion_state==='unknown') report(`${record.id}: unresolved story state`);
    }
  }
  if (complete && count===0) report('No records: an empty graph cannot establish completeness');
  return {errors,count};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const dir=process.argv.slice(2).find(a=>!a.startsWith('--')) || 'examples/phase-1';
    const result=validateDocuments(readDocuments(dir),{complete:process.argv.includes('--complete')});
    if (result.errors.length) {console.error(result.errors.join('\n'));process.exitCode=1;}
    else console.log(`Validated ${result.count} records in ${dir}. ${process.argv.includes('--complete')?'Scoped review completeness passed; source coverage still requires migration audit.':'Structural validity does not imply confirmation or migration completeness.'}`);
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
