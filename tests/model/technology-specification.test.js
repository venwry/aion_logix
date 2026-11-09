import test from 'node:test';import assert from 'node:assert/strict';
import {migrateTechnologySpecification,specificationSegments} from '../../code/technology-specification.js';
import {readDocuments,validateDocuments} from '../../tools/validate-model.js';
const chapter=()=>({number:1,chapter_name:'Physical link',description:'Startup is {Rate} bps; maximum is {Rate} bps.',parameters:[{key:'Rate',value:'125000'}]});
const documents=()=>{const d=readDocuments('data_foundation');d.technology.technology[0].specification=[chapter()];return d;};
test('direct technology conversion preserves numbers and retains only distinct textual values',()=>{
 const source=[{number:17,type:'limit',description:'128',value:128},{number:25,type:'host',description:'Compatible host.',value:'device.example'},{number:40,type:'enabled',description:'True',value:true},{number:50,type:'note',description:'Keep this prose.'}];
 const result=migrateTechnologySpecification(source);
 assert.deepEqual(result.map(x=>x.number),[17,25,40,50]);assert.deepEqual(result[0].parameters,[]);assert.deepEqual(result[1].parameters,[{key:'value',value:'device.example'}]);assert.deepEqual(result[2].parameters,[{key:'value',value:'true'}]);assert.deepEqual(result[3].parameters,[]);
 assert.equal(result[1].description,source[1].description);assert.deepEqual(migrateTechnologySpecification(result),result);
});
test('placeholders are exact, local and nonrecursive; unknown keys remain visible',()=>{
 const parts=specificationSegments('{Value} / {Value} / {value}',[{key:'Value',value:'<img>{nested}</img>'}]);
 assert.deepEqual(parts.filter(p=>p.key).map(p=>p.text),['<img>{nested}</img>','<img>{nested}</img>']);assert.equal(parts.at(-1).text,'{value}');assert.equal(parts.at(-1).missing,'value');
});
test('technology chapter schema and model checks reject ambiguous structures',()=>{
 assert.deepEqual(validateDocuments(documents()).errors,[]);
 for(const edit of [r=>r.specification[0].parameters.push({key:'Rate',value:'250000'}),r=>r.specification[0].parameters[0].key=' ',r=>r.specification[0].parameters[0].key='{Rate}',r=>r.specification[0].description='{Missing}',r=>r.specification[0].parameters[0].value=125000,r=>r.specification.push(chapter()),r=>r.specification[0]={number:1,type:'old',description:'old',value:'old'}]){
  const d=documents();edit(d.technology.technology[0]);assert(validateDocuments(d).errors.length,'Invalid chapter was accepted');
 }
 const d=documents();d.technology.technology[0].specification.push({...chapter(),number:2});assert.deepEqual(validateDocuments(d).errors,[],'Keys may repeat in separate chapters');
});
