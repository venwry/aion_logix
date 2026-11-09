// Optional strict catalogue profile. Never applies pending proposals or saves approvals.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readDocuments,validateDocuments} from './validate-model.js';
const schemaDir=new URL('../schemas/',import.meta.url);
const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
for(const f of fs.readdirSync(schemaDir).filter(f=>f.endsWith('.schema.json')))ajv.addSchema(JSON.parse(fs.readFileSync(new URL(f,schemaDir))));
const check=ajv.compile(JSON.parse(fs.readFileSync(new URL('profiles/catalogue-product.schema.json',schemaDir))));
export function validateCatalogueProduct(product){
 if(check(product))return [];
 return check.errors.map(e=>`${product.id}${e.instancePath}: ${e.message}`);
}
export function validateCatalogue(documents){
 const result=validateDocuments(documents);
 for(const p of documents.product?.product||[])result.errors.push(...validateCatalogueProduct(p));
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=validateCatalogue(readDocuments(process.argv[2]||'data_foundation'));
 if(result.errors.length){console.error(result.errors.join('\n'));process.exitCode=1;}
 else console.log(`Catalogue profile passed (${result.count} foundation records). Qualification, commercial scope and descriptive reference directness still require author review.`);
}
