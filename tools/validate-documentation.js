// Check active guides against executable registry/path contracts; archives remain immutable.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {schemaVersion,datasets,datasetPath} from '../code/model-contract.js';
const root=fileURLToPath(new URL('../',import.meta.url)),errors=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const docs=['README.md','DATA_MODEL_PRINCIPLES.md','data_calculation/README.md','data_calculation/MANUFACTURING_COSTS.md',...['docs','docs/data_model','docs/proposals'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.md')).map(f=>dir+'/'+f))];
for(const file of docs){
 const text=read(file);
 for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
  const url=match[1].trim().replace(/^<|>$/g,'').split(/\s+"/)[0];
  if(/^(?:[a-z]+:|#|\/)/i.test(url))continue;
  const target=decodeURIComponent(url.split('#')[0].split('?')[0]);
  if(target&&!fs.existsSync(path.resolve(root,path.dirname(file),target)))errors.push(file+': broken link '+url);
 }
 if(!file.startsWith('docs/proposals/'))for(const line of text.split('\n').slice(0,10)){
  if(/(?:current|contract|principles|model guide)/i.test(line))for(const match of line.matchAll(/\b0\.\d+\.\d+\b/g))if(match[0]!==schemaVersion)errors.push(file+': stale current-contract version '+match[0]);
 }
}
const manifest=JSON.parse(read('data_storytelling/manifest.json')).manifest[0];
if(manifest.schema_version!==schemaVersion)errors.push('Manifest contract differs from registry');
if(JSON.stringify(manifest.foundation_datasets)!==JSON.stringify(datasets))errors.push('Manifest datasets differ from registry');
for(const name of datasets)for(const p of [datasetPath(name),'schemas/'+name+'.schema.json'])if(!fs.existsSync(path.join(root,p)))errors.push('Missing registry file '+p);
const viewer=read('assets/main.js');
for(const p of ['docs/data_model/CAMPAIGN_TIMELINES.md','docs/data_model/ECOSYSTEM_STANDARDS.md','docs/data_model/MARKET_RESPONSES.md','data_calculation/README.md','data_calculation/annual_sales.json','schemas/calculation/annual_sales.schema.json','data_calculation/MANUFACTURING_COSTS.md','data_calculation/manufacturing_costs.json','data_calculation/manufacturing_cost_assumptions.json'])if(!viewer.includes("path:'"+p+"'"))errors.push('Viewer navigation missing '+p);
for(const match of viewer.matchAll(/path:'([^']+)'/g))if(!fs.existsSync(path.join(root,match[1])))errors.push('Viewer path missing '+match[1]);
const words={15:'fifteen',16:'sixteen'};
if(!read('README.md').includes(words[datasets.length]+' foundation datasets'))errors.push('README foundation count differs from registry');
const count=fs.readdirSync(path.join(root,'data_storytelling')).filter(f=>f.endsWith('.json')).length;
if(!read('docs/data_model/STORYTELLING_FILE_REFERENCE.md').includes(({9:'nine',8:'eight'})[count]+' root JSON files'))errors.push('Storytelling guide root-file count differs from disk');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Validated '+docs.length+' active guides, local file links, viewer entries and contract '+schemaVersion+' ('+datasets.length+' foundation datasets).');
