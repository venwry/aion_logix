import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {buildCostRows} from '../code/manufacturing-cost-model.js';
import {readCostFoundation} from './generate-manufacturing-costs.js';
const evidence='data_storytelling/review_evidence/storage-configurations/';
export function storageCostAssumptions(original,index){
 const assumptions=structuredClone(original),patch=JSON.parse(fs.readFileSync(evidence+'cost-assumption-patch.json','utf8'));
 for(const p of patch.parts)if(!index.has(p.record_id))throw Error('Approve the storage proposals before applying cost assumptions: missing '+p.record_id);
 for(const id of patch.operations_remove)if(index.has(id))throw Error('Approve the Budget Colour Office removal before applying cost assumptions.');
 for(const key of ['sources','market_series','parts','operations'])for(const row of patch[key]){
  const idKey=['parts','operations'].includes(key)?'record_id':'id';
  const i=assumptions[key].findIndex(x=>x[idKey]===row[idKey]);
  if(i<0)assumptions[key].push(row);else assumptions[key][i]=row;
 }
 assumptions.operations=assumptions.operations.filter(x=>!patch.operations_remove.includes(x.record_id));
 return assumptions;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv.includes('--apply'))throw Error('After approving all four storage proposals, run with --apply to update calculation assumptions and regenerate costs.');
 const queue=JSON.parse(fs.readFileSync('data_storytelling/change.json','utf8')).change;
 const summary=JSON.parse(fs.readFileSync(evidence+'summary.json','utf8')),ids=summary.proposal_ids;
 if(queue.some(p=>ids.includes(p.id)))throw Error('Storage proposals are still pending; no calculation files changed.');
 const decisions=JSON.parse(fs.readFileSync('data_storytelling/authorization_decision_index.json','utf8')).authorization_decision_index;
 for(const id of ids)if(!decisions.some(d=>d.action==='approve_change'&&d.change_id===id&&d.proposal_sha256===summary.proposal_hashes[id]))throw Error('Expected storage proposal approval is missing: '+id);
 const p='data_calculation/manufacturing_cost_assumptions.json';
 const updated=storageCostAssumptions(JSON.parse(fs.readFileSync(p,'utf8')),readCostFoundation());
 buildCostRows(readCostFoundation(),updated); // Preflight all component and operation costs before writing.
 fs.writeFileSync(p,JSON.stringify(updated,null,2)+'\n');
 execFileSync(process.execPath,['tools/generate-manufacturing-costs.js'],{stdio:'inherit'});
 execFileSync(process.execPath,['tools/validate-calculation.js'],{stdio:'inherit'});
}
