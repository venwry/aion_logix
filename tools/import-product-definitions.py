"""Deterministic definition-only import from the pinned vs_edu1 snapshot.
Run from repository root: python tools/import-product-definitions.py /path/to/vs_edu1
No legacy chronology or authorization is imported. Existing records are proposals.
"""
import json, pathlib, sys, subprocess, re, hashlib, copy, collections
ROOT=pathlib.Path.cwd(); SRC=pathlib.Path(sys.argv[1]); PIN='dac733770d8e622d5619bd84bc9d21db6c7ec7ab'
assert subprocess.check_output(['git','-C',str(SRC),'rev-parse','HEAD'],text=True).strip()==PIN
read=lambda p:json.loads(pathlib.Path(p).read_text())
def write(p,d):
 p=pathlib.Path(p)
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
source={p.name:read(p) for p in (SRC/'data').glob('*.json')}
sets={n:source[f+'.json'][k] for n,f,k in [('base_part','components','components'),('device','devices','devices'),('software_edition','software-editions','software_editions'),('product','product-catalog','products')]}
old={r['id']:r for rs in sets.values() for r in rs}
for doc in source.values():
 for value in doc.values():
  if isinstance(value,list):
   for r in value:
    if isinstance(r,dict) and 'id' in r:old.setdefault(r['id'],r)
prior_auth=read(ROOT/'data_storytelling/authorization.json')['authorization']
assert not any(a['state']=='authorized' and a['record_id'].split('.')[0] in ['base_part','device','software_edition'] for a in prior_auth), 'Do not overwrite reviewed technical definitions with a legacy reimport.'
current={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') if p.stem not in ['base_part','device','software_edition'] for rows in read(p).values() for r in rows}
migration=read(ROOT/'archived_no_longer_valid/data_storytelling/phase1b_migration.json')['migration'][0]
product_map={m['legacy_id']:m['record_id'] for m in migration['product_mapping']}
# Canonical technical IDs are separate from preserved product identities.
ids={}
for n,rs in sets.items():
 for r in rs:
  if n=='base_part':
   if r['bom_role']!='material':continue
   ids[r['id']]='base_part.'+r['id'].split('.',1)[1]
  elif n=='device':ids[r['id']]=r['id']
  elif n=='software_edition':ids[r['id']]='software_edition.'+r['id'].split('.',1)[1]
  else:ids[r['id']]=product_map[r['id']]
for x in old:
 if x in ids:continue
 if x in current:ids[x]=x
 elif x in product_map and product_map[x] in current:ids[x]=product_map[x]
for m in migration.get('id_mapping',[]):
 if len(m['new_ids'])==1 and m['new_ids'][0] in current:ids.setdefault(m['old_id'],m['new_ids'][0])
for d in sets['device']:
 if d['id'].startswith('device.base_computer.'):ids['computer.'+d['id'].split('.')[-1]]=d['id']
actors={re.sub(r'[^a-z0-9]','',r.get('name','').lower()):r['id'] for r in current.values() if r['id'].startswith('actor.')}
actors.update({'logix':'actor.logix','aion':'actor.aion','aionlabs':'actor.labs','aionsoftware':'actor.aion','bpisystems':'actor.bpi','digit alresearch'.replace(' ',''):'actor.dri'})
def actor(name):return actors.get(re.sub(r'[^a-z0-9]','',str(name).lower()))
excluded=[];unmapped=[]
blocked=re.compile(r'(^\$|status|authoriz|confirmation|provenance|^source|_source|^introduced$|^origin$|^used_in$|^bundled_with$|^sold_with$|^offered_with$|^optional_with$|^superseded_by$|^availability$|^public_roadmap$|^lifecycle_policy$|^dated_revisions$|^composition_history$|date|effective_|valid_from|valid_to|campaign|programme|program_ref|cost|price|royalt|sales|revenue|profit|roi|investment|funding|forecast|maturity_multiplier|yield|repair_fraction|gross_usable|good_packaged|financial|^partner_distribution$|^launch_|^planned_for$|^alternate_history|^roadmap|^development_lineage$|^business_module_lineage$|^design_continuity|^independent_implementation_policy$|^ecosystem_policy$|^training_available$|ncc_19|^company_and_support$|^commercial_policy$|^positioning$|^licensing$)',re.I)
# Requirements are engineering facts; editorial claims and dated historical clauses are omitted.
nontechnical=re.compile(r'\b(author[- ](?:approved|confirmed|specified)|authorisation|authorization|approved|accepted|historical snapshot|story|Adam|Vincent|investment|COMDEX|NCC|revenue|royalt|cost snapshot|financial|forecast|licen[cs]e agreement)\b|\b(?:19[789]\d|20[0-2]\d)(?:-\d\d)?\b|\b\w[\w-]*\.json\b',re.I)
def clean(value,path=''):
 if isinstance(value,dict):
  # Resolve legacy technical-profile pointers into actual technical content.
  if 'source_ref' in value and 'path' in value:
   target=old.get(value['source_ref'])
   try:
    for key in value['path']:target=target[key]
    return clean(target,path+'/resolved')
   except (KeyError,TypeError):excluded.append({'path':path,'reason':'unresolved technical projection'});return None
  out={}
  for k,v in value.items():
   if k=='production_revisions':
    out['recipe_variants']=[]
    for label,variant in v.items():
     item=clean(variant,path+'/recipe_variants')
     cap='manufacturing_capability.'+variant.get('id','')
     if cap in current:item['manufacturing_capability_id']=cap
     out['recipe_variants'].append(item)
    excluded.append({'path':path+'/'+k,'reason':'date-keyed recipes converted to undated technical variants'})
    continue
   if blocked.search(k):excluded.append({'path':path+'/'+k,'reason':'editorial, chronology, reverse relation or economics'});continue
   result=clean(v,path+'/'+k)
   if result is None and v is not None:continue
   if k.endswith('_ref') and isinstance(v,str):
    if v in ids:out[k[:-4]+'_id']=ids[v]
    else:out[k[:-4]+'_description']=old.get(v,{}).get('name',v.replace('.',' '));unmapped.append({'path':path+'/'+k,'source_id':v})
   elif k.endswith('_refs') and isinstance(v,list):
    out[k[:-5]+'_ids']=[ids[x] for x in v if x in ids]
    missing=[old.get(x,{}).get('name',x.replace('.',' ')) for x in v if x not in ids]
    if missing:out[k[:-5]+'_descriptions']=missing
   else:out[ids.get(k,k)]=result
  return out
 if isinstance(value,list):return [r for i,v in enumerate(value) if (r:=clean(v,path+'/'+str(i))) is not None or v is None]
 if isinstance(value,str):
  if value in ids:return ids[value]
  sentences=re.split(r'(?<=[.!?])\s+',value)
  retained=[s for s in sentences if not nontechnical.search(s) and not re.search(r'\b(costs?|prices?|shipping date)\b',s,re.I)]
  if len(retained)!=len(sentences):excluded.append({'path':path,'reason':'historical, editorial or financial prose'})
  value=' '.join(retained)
  if not value:return None
  def sub(m):
   s=m.group();return ids.get(s,old.get(s,{}).get('name',s.replace('.',' ')))
  return re.sub(r'\b(?:part|device|software|edition|computer|technology|service|product)\.[a-z0-9_.]+',sub,value)
 return value
req=lambda texts:[{'number':i+1,'kind':'testing','description':s} for i,s in enumerate(texts) if isinstance(s,str) and s]
def requirements(r):return req(clean(r.get('requirements',[])+r.get('manufacturing_requirements',[]),r['id']+'/requirements'))
# Only technical source fields enter these definitions; all other source properties are audited.
hardware_fields={'specification','processor','form_factor','io_and_expansion','expansion_socket_groups','configuration_requirements','memory_constraints','technical_profile','connection','capacity_kb','memory_mapping','physical_population','memory_interface','firmware_contents','slot_count','compatible_with','compatible_computers','planned_compatible_with','host_qualification','athena_qualification','integration_requirements','compatibility_note','packaging','role','specification_ref','manufacturing_planning','recommended_software_ref'}
software_fields={'features','technology_ref','portability_contract','programmatic_file_access','data_interchange','architecture','implementation','specification','contents','release_scope','abacus_file_integration','platform_policy','toolchain','artemis_native_extensions','explicitly_not_assumed','reporting','features_ref','embedded_abacus_integration_ref','forward_compatibility_commitment','components','extensions','base_version','vanilla_architecture','internal_organization','internal_relationships','logix_requirements','tui_features','compatibility_notes','tui_ownership','memory_discovery_ref','adds','subcomponents','runtime_notes','system_dependencies','relationship','tui_integration','compatibility_policy','execution_target','role','platform_support','minimum_resources','dependency_refs','distribution','api_compatibility','network_link_policy','portable_runtime','modules','validation','mouse_update'}
def technical(r,version=None,software=False):
 fields=software_fields if software else hardware_fields
 d={k:copy.deepcopy(v) for k,v in r.items() if k in fields}
 # Revision specifications apply only to the explicitly linked composition version.
 for rev in r.get('dated_revisions',[]):
  if rev.get('composition_version_number')==version:
   update={k:v for k,v in rev.items() if k not in ['effective_from','composition_version_number','name']}
   if 'modes' in update:
    update['bitmap_modes']=update.pop('modes');d.setdefault('specification',{}).pop('memory_policy',None)
   d.setdefault('specification',{}).update(update)
 return clean(d,r['id']+'/technical')
new={'base_part':[],'device':[],'software_edition':[]};proposals=[];version_map={r['id']:r['composition_history'] for n in ['device','software_edition','product'] for r in sets[n]}
def child_version(ref,date):
 matches=[v for v in version_map[ref] if v['valid_from'] and v['valid_from']<=date<v['valid_to']]
 assert len(matches)==1,(ref,date)
 return matches[0]['version_number']
def compositions(r,software=False,product=False):
 result=[]
 for v in r['composition_history']:
  lines=v['composition_definition'];local={l['ref']:f'line_{i+1}' for i,l in enumerate(lines)};newlines=[]
  for i,l in enumerate(lines):
   target={'record_id':ids[l['ref']]}
   if l['ref'] in version_map:target['version_number']=child_version(l['ref'],v['valid_from'])
   cond=clean(l.get('condition','always'),r['id']+'/condition')
   # A condition must never be silently made unconditional.
   if cond is None:cond='Supply condition requires definition.'
   line={'id':local[l['ref']],'target':target,'quantity':l['quantity'],'unit':l.get('unit','each'),'role':clean(l.get('role','')) or '', 'supply_condition':{'kind':'always'} if cond=='always' else {'kind':'conditional','description':cond},'requirements':[]}
   if product:line['element_type']=l['element_type']
   if l.get('used_socket'):
    host=l.get('connected_to') or next((x['ref'] for x in lines if x.get('element_type')=='main_product'),None)
    line['connection']=({'host_line_id':local[host],'socket_id':l['used_socket']} if host in local else {'host_scope':'existing_customer_device','socket_id':l['used_socket']})
   if l.get('placements'):
    placements=[]
    for a in l['placements']:
     for instance in range(1,int(a['quantity'])+1):placements.append({'host_line_id':local[a['connected_to']],'host_instance':instance,'socket_id':a['used_socket'],'quantity':1})
    line['placements']=placements
   if l.get('duration_years') is not None:line['entitlement']={'kind':'service','count':l['quantity'],'scope':'supplied service','duration_value':l['duration_years'],'duration_unit':'year'}
   newlines.append(line)
  meta=v.get('bom_assembly_metadata',{})
  t=technical(r,v['version_number'],software) if not product else {}
  result.append({'version_number':v['version_number'],'description':'Product definition revision '+str(v['version_number']), 'effective_from':{'kind':'unknown'},'effective_until':{'kind':'unknown'},'technical_definition':t,'composition_definition':newlines,'assembly_requirements':req(clean(meta.get('requirements',[]),r['id']+'/assembly_requirements'))})
 return result
for r in sets['base_part']:
 if r['bom_role']!='material':excluded.append({'path':r['id'],'reason':'nonmaterial superseded specification, not a physical base part'});continue
 a=actor(r.get('manufacturer') or r.get('vendor'));supply='supplied_set' if any(x in r['category'] for x in ['assembly','allowance','kit']) else 'individual_part'
 kind='integrated_circuit' if r['category'].endswith('_ic') else next((kind for token,kind in [('pcb','pcb'),('connector','connector'),('cable','cable'),('documentation','documentation'),('packaging','packaging'),('media','physical_media'),('diode','discrete_semiconductor'),('passive','passive'),('power_supply','power_supply'),('assembly','supplied_assembly')] if token in r['category']), 'supplied_assembly' if supply=='supplied_set' else 'material')
 new['base_part'].append({'id':ids[r['id']],'name':r['name'],'kind':kind,'description':r['name'],'supply_form':supply,'manufacturer_actor_id':a,'supplier_actor_ids':[a] if a else [],'manufacturer_part_number':r.get('manufacturer_part_number'),'manufacturer_name':r.get('manufacturer') or r.get('vendor'),'technology_ids':[ids[x] for x in [r.get('manufacturing_process_ref'),r.get('specification_ref')] if x in ids and ids[x].startswith('technology.')],'manufacturing_capability_ids':[],'technical_definition':technical(r),'specification':[],'requirements':requirements(r)})
kind_map={'video_expansion_card':'expansion_card','memory_expansion':'memory_module','io_interface_expansion':'expansion_card','network_interface_card':'expansion_card','network_hub_repeater':'network_device','firmware_memory':'firmware_bank','memory_assembly':'internal_subsystem','video_interface_assembly':'internal_subsystem','processor_expansion':'expansion_card','floppy_drive_mechanism':'storage_device','hard_disk_drive':'storage_device','external_floppy_drive':'storage_device'}
for r in sets['device']:
 a=actor(r.get('vendor'));new['device'].append({'id':ids[r['id']],'name':r['name'],'kind':kind_map.get(r['category'],r['category']),'description':clean(r.get('description',r['name'])) or r['name'],'provider_actor_ids':[a] if a else [],'technology_ids':[ids[x] for x in r.get('technology_refs',[]) if x in ids],'composition_history':compositions(r),'requirements':requirements(r),**({'technical_definition':technical(r)} if not r['composition_history'] else {})})
for r in sets['software_edition']:
 a=actor(r.get('vendor'));new['software_edition'].append({'id':ids[r['id']],'name':r['name'],'version':str(r['version']),'edition':r['edition'],'family_name':r['software_line_name'],'description':clean(r.get('description',r['name'])) or r['name'],'provider_actor_ids':[a] if a else [],'technology_ids':[ids[x] for x in r.get('technology_refs',[]) if x in ids],'composition_history':compositions(r,software=True)})
# Existing products retain their entire current content; proposed extensions add definitions.
changes={}
for r in sets['product']:
 target=ids[r['id']];after=changes.setdefault(target,copy.deepcopy(current[target]));after['offering_category']=r['category'];after['composition_history']=compositions(r,product=True)
for n in ['base_part','device','software_edition']:
 for r in sets[n]:
  target=product_map.get(r['id'])
  if r['id'] not in ids or target not in current:continue
  after=changes.setdefault(target,copy.deepcopy(current[target]));after['technical_identity']={'record_id':ids[r['id']]}
for record in current.values():
 if not record['id'].startswith('manufacturing_capability.'):continue
 parts=[ids[oldid] for oldid,pid in product_map.items() if pid in record.get('product_ids',[]) and oldid.startswith('part.') and oldid in ids]
 if parts:
  after=changes.setdefault(record['id'],copy.deepcopy(record));after['base_part_ids']=sorted(set(parts))
for id,after in changes.items():
 proposals.append({'id':'change.product_definition_import_'+id.replace('.','_'),'category':'story','title':'Product definition — '+after.get('name',id),'reason':'Add product composition and technical-definition links only. Existing narrative content is preserved. Composition versions have explicit child selections and unknown temporal boundaries; legacy chronology, approvals and financial projections are not imported. Related technical records remain pending their own authorization.','depends_on_ids':[],'elements':[{'record_type':id.split('.')[0],'record_id':id,'before':current[id],'after':after}]})
for n,rs in new.items():write(ROOT/'data_foundation'/f'{n}.json',{n:rs})
auth=read(ROOT/'data_storytelling/authorization.json');import_ids={r['id'] for rs in new.values() for r in rs};auth['authorization']=[a for a in auth['authorization'] if a['record_id'] not in import_ids]
# Match the application's canonical JSON hashing, including JavaScript numeric serialization.
node_hash="import crypto from 'node:crypto';let s='';for await(const c of process.stdin)s+=c;const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;console.log(JSON.stringify(Object.fromEntries(JSON.parse(s).map(r=>[r.id,crypto.createHash('sha256').update(JSON.stringify(stable(r))).digest('hex')]))));"
hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',node_hash],input=json.dumps([r for rs in new.values() for r in rs]),text=True))
for r in [r for rs in new.values() for r in rs]:auth['authorization'].append({'id':'authorization.'+r['id'].replace('.','_'),'record_id':r['id'],'state':'unauthorized','content_sha256':hashes[r['id']]})
write(ROOT/'data_storytelling/authorization.json',auth)
queue=read(ROOT/'data_storytelling/change.json');queue['change']=[p for p in queue['change'] if not p['id'].startswith('change.product_definition_import_')];assert not any(e['record_id'] in changes for p in queue['change'] for e in p['elements']);queue['change']+=proposals;write(ROOT/'data_storytelling/change.json',queue)
# Evidence is deliberately outside foundation; the audit contains no old approval decisions.
coverage=[{'source_id':r['id'],'source_collection':n,'target_id':ids.get(r['id']),'fields':list(r),'composition_versions':len(r.get('composition_history',[]))} for n,rs in sets.items() for r in rs]
report={'record_coverage':coverage,'source_commit':PIN,'counts':{n:len(v) for n,v in new.items()},'product_proposals':len(proposals),'source_records':sum(map(len,sets.values())),'id_mapping':ids,'excluded_fields':excluded,'unmapped_designations':unmapped,'policy':'Definitions only. Legacy timing is used solely to pin original child versions, then discarded. No old authorization or historical event is imported.'}
write(ROOT/'data_storytelling/review_evidence/product-definition-import/audit.json',report)
print(json.dumps({'counts':report['counts'],'proposals':len(proposals),'excluded':len(excluded),'unmapped':len(unmapped)}))
