import fs from 'node:fs';
const names=fs.readdirSync('schemas').filter(n=>n.endsWith('.schema.json')&&n!=='common.schema.json').sort();
const lines=['# Schema field reference','','Generated from schema version 0.2.0. Version 0.1.0 metadata remains accepted for historical fixtures. Objects reject undeclared fields; consult schemas for exact constraints.',''];
function type(p){return p.enum?.join(', ')||p.$ref?.split('/').at(-1)||p.type||'composite';}
function table(properties,required=[],prefix=''){
 for(const [key,p] of Object.entries(properties||{})){
  const field=prefix+key;lines.push(`| \`${field}\` | ${required.includes(key)?'yes':key==='confirmation'?'conditional':'no'} | ${type(p)}${p['x-ref']?' → '+p['x-ref'].join(', '):''} |`);
  if(p.properties)table(p.properties,p.required,field+'.');
  if(p.items?.properties)table(p.items.properties,p.items.required,field+'[].');
 }
}
for(const file of names){const s=JSON.parse(fs.readFileSync('schemas/'+file));lines.push('## '+file.replace('.schema.json',''),'','| Field | Required | Type / allowed values |','| --- | --- | --- |');table(s.$defs.record.properties,s.$defs.record.required);lines.push('');}
fs.writeFileSync('docs/data-model/FIELD_REFERENCE.md',lines.join('\n'));
