import fs from 'node:fs';import {validate,names,hash,records} from '../server/model.js';
const files={};for(const dir of ['data_foundation','data_storytelling'])for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json')))files[dir+'/'+name]=JSON.parse(fs.readFileSync(dir+'/'+name));
const result=validate(files);if(process.argv.includes('--complete')){const auth=files['data_storytelling/authorization.json'].authorization;for(const r of records(files))if(!auth.some(a=>a.record_id===r.id&&a.state==='authorized'&&a.content_sha256===hash(r)))result.errors.push('Unauthorized: '+r.id);}
if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}else console.log(`Validated ${result.count} foundation records and external authorization data.`);
