import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {stable} from '../code/review-log.js';
import {buildCostRows,costDates,costSourceRecords} from '../code/manufacturing-cost-model.js';
import {buildRamScenarios} from '../code/ram-cost-scenarios.js';
export const costHash=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export function readCostFoundation(){return new Map(fs.readdirSync('data_foundation').filter(f=>f.endsWith('.json')).flatMap(f=>Object.values(JSON.parse(fs.readFileSync('data_foundation/'+f))).flat()).map(r=>[r.id,r]));}
if(process.argv[1]?.endsWith('/generate-manufacturing-costs.js')){
 const index=readCostFoundation(),assumptions=JSON.parse(fs.readFileSync('data_calculation/manufacturing_cost_assumptions.json'));
 const products=buildCostRows(index,assumptions);
 const doc={model_version:assumptions.model_version,currency:assumptions.currency,currency_basis:assumptions.currency_basis,foundation_revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),foundation_sha256:costHash(costSourceRecords(index)),assumptions_sha256:costHash(assumptions),generated_at:new Date().toISOString(),dates:costDates,manufacturing_costs:products};
 fs.writeFileSync('data_calculation/manufacturing_costs.json',JSON.stringify(doc,null,2)+'\n');
 const {manufacturing_costs,dates,...metadata}=doc;
 fs.writeFileSync('data_calculation/ram_cost_scenarios.json',JSON.stringify({...metadata,...buildRamScenarios(index,assumptions)},null,2)+'\n');
 console.log(`Estimated ${products.length} products across ${costDates.length} dates: ${products.reduce((n,p)=>n+p.estimates.length,0)} populated cells.`);
}
