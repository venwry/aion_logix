import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>JSON.parse(fs.readFileSync(p));
const hits=[];
function scan(value,path){if(!value||typeof value!=='object')return;for(const [key,v] of Object.entries(value)){if(key==='maturity')hits.push(path+'/'+key);scan(v,path+'/'+key);}}
for(const f of fs.readdirSync('data_foundation').filter(f=>f.endsWith('.json')))scan(read('data_foundation/'+f),f);
for(const p of read('data_storytelling/change.json').change)for(const e of p.elements||[])if(e.after)scan(e.after,p.id+'/'+e.record_id+'/after');
if(hits.length){console.error('Schema retirement is blocked until Changes confirm removes '+hits.length+' remaining maturity payload(s). No files changed.');process.exitCode=1;}
else if(!process.argv.includes('--apply'))console.log('Ready: no live or proposed maturity payloads. Use --apply to retire the schema and regenerate documentation.');
else{
 const file='schemas/common.schema.json',schema=read(file);
 if(!schema.$defs.item.properties.maturity){console.log('Maturity is already retired.');process.exit(0);}
 const manifest=read('data_storytelling/manifest.json'),oldVersion=manifest.manifest[0].schema_version;
 const [major,minor]=oldVersion.split('.').map(Number),nextVersion=`${major}.${minor+1}.0`;
 delete schema.$defs.item.properties.maturity;fs.writeFileSync(file,JSON.stringify(schema,null,2)+'\n');
 manifest.manifest[0].schema_version=nextVersion;fs.writeFileSync('data_storytelling/manifest.json',JSON.stringify(manifest,null,2)+'\n');
 for(const p of ['code/model-contract.js','README.md','DATA_MODEL_PRINCIPLES.md','docs/README.md','docs/data_model/REFERENCE_RULES.md','docs/data_model/STORYTELLING_FILE_REFERENCE.md','docs/data_model/CATALOGUE_VALIDATION.md'])fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll(oldVersion,nextVersion));
 const guide='docs/data_model/MODEL_GUIDE.md';let text=fs.readFileSync(guide,'utf8').replace('version '+oldVersion,'version '+nextVersion).replace('The legacy event item maturity payload is transitional, as described below.','Event item maturity payloads are retired; use descriptions and capability subjects.');
 text=text.replace(/## Maturity descriptions and schema retirement[\s\S]*?(?=\n## |$)/,`## Maturity descriptions and schema retirement\n\nContract ${nextVersion} rejects the former maturity object. Outcomes retain the capability reference in subject_ids and the stage in description. Historical before-snapshots and decisions remain immutable. The approved conversion and proposed schema are preserved under data_storytelling/review_evidence/maturity-description/.\n`);
 fs.writeFileSync(guide,text);
 execFileSync(process.execPath,['tools/generate-foundation-spec.js'],{stdio:'inherit'});
 execFileSync(process.execPath,['tools/validate-foundation.js'],{stdio:'inherit'});
 console.log('Retired maturity from schema; contract '+nextVersion+'. Review and publish these schema/runtime documentation changes together. Foundation and authorization data were not edited.');
}
