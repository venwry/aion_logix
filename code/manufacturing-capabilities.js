import {validateTechnicalSpecifications,renderTechnicalSpecification} from './technical-specification.js';

export function validateManufacturingCapabilities(records){
 const errors=[];
 for(const record of records.values()){
  if(!record.id.startsWith('manufacturing_capability.'))continue;
  const fail=message=>errors.push(record.id+': '+message);
  if(record.production_line_id){
   const line=records.get(record.production_line_id);
   if(line?.capability_kind!=='production_line')fail('production_line_id must reference a production line');
   else if(line.actor_id!==record.actor_id||line.location_id!==record.location_id)fail('recipe and production line must have the same operator and location');
  }
  let previous=null;const versions=new Set();
  for(const config of record.configuration_history||[]){
   if(versions.has(config.version_number))fail('duplicate configuration version');versions.add(config.version_number);
   if(config.effective_until!==null&&config.effective_from>=config.effective_until)fail('configuration period must have positive duration');
   if(previous&&(previous.effective_until===null||previous.effective_until>config.effective_from||previous.version_number>=config.version_number))fail('configuration history must be ordered and non-overlapping');
   if(new Set(config.equipment.map(e=>e.id)).size!==config.equipment.length)fail('duplicate equipment group in configuration');
   if(new Set(config.constraints.map(e=>e.number)).size!==config.constraints.length)fail('duplicate constraint number');
   // Reuse the shared parameter/reference checks without treating a configuration as a foundation record.
   errors.push(...validateTechnicalSpecifications(records,[{id:record.id,technical_specification:config.technical_specification}]));
   previous=config;
  }
 }
 return errors;
}

export function renderManufacturingConfigurations(configurations,renderValue,registerCleanup=()=>{}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const host=el('section'),label=el('label','Production-line configuration '),select=el('select'),panel=el('div');host.className='manufacturing-configurations';select.className='manufacturing-configuration-select';select.setAttribute('aria-label','Production-line configuration');label.append(select);host.append(label,panel);
 for(const [i,c] of configurations.entries()){const option=el('option',`${c.version_number} - ${c.description} (${c.effective_from} – ${c.effective_until||'no recorded successor'})`);option.value=i;select.append(option);}
 const cleanups=[],clear=()=>{for(const cleanup of cleanups)cleanup();cleanups.length=0;};registerCleanup(clear);
 function render(){clear();panel.replaceChildren();const c=configurations[Number(select.value)];if(!c)return;panel.append(renderTechnicalSpecification(c.technical_specification,renderValue));for(const [key,title] of [['equipment','Equipment groups'],['constraints','Operating constraints']]){panel.append(el('h3',title),renderValue(c[key],cleanups));}}
 select.onchange=render;render();return host;
}
