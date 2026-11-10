// Adapt only in-memory historical import fixtures to the active schema.
// Inventory assertions use a separate untouched historical graph.
import fs from 'node:fs';
const schemas=new Map(fs.readdirSync('schemas').filter(f=>f.endsWith('.schema.json')).map(f=>{const s=JSON.parse(fs.readFileSync('schemas/'+f));return [s.$id,s];}));
function resolve(s,root){if(!s.$ref)return [s,root];const [url,fragment]=s.$ref.split('#');root=url?schemas.get(url):root;return [fragment.slice(1).split('/').reduce((v,k)=>v[k],root),root];}
function prune(value,schema,root){
 [schema,root]=resolve(schema,root);
 if(Array.isArray(value)){if(schema.items)for(const v of value)prune(v,schema.items,root);return;}
 if(!value||typeof value!=='object')return;
 const properties={...(schema.properties||{})};
 for(const key of ['oneOf','anyOf','allOf'])for(const b of schema[key]||[]){const [s]=resolve(b,root);Object.assign(properties,s.properties||{});}
 if(!Object.keys(properties).length)return;
 for(const key of Object.keys(value)){if(!properties[key] || (properties[key].deprecated && (properties[key].type==='null' || properties[key].maxItems===0)))delete value[key];else prune(value[key],properties[key],root);}
}
export function currentImportShape(record){
 if(!record)return;
 const type=record.id.split('.')[0];
 if(type==='device')for(const version of record.composition_history||[]){if(version.technical_definition?.expansion_socket_groups){version.expansion_socket_groups=version.technical_definition.expansion_socket_groups;delete version.technical_definition.expansion_socket_groups;}}
 if(type==='assumption'&&record.statement){record.topic=record.statement.slice(0,70);record.statements=[record.statement];delete record.statement;}
 if(type==='agreement')for(const clause of record.clauses){
  if(!Object.hasOwn(clause,'value'))clause.value=null;
  if(!Object.hasOwn(clause,'unit'))clause.unit=null;
 }
 const schema=schemas.get(`https://aion-logix.invalid/schemas/${type}.schema.json`);
 prune(record,schema.$defs.record,schema);
}
