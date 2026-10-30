#!/usr/bin/env python3
"""One-shot 0.3 -> 0.4 migration. Run at repo root with --source /path/to/vs_edu1.
Source is pinned; all original foundation/schema files are archived before edits.
No source repository writes, calculations or implicit authorizations.
"""
import argparse,copy,hashlib,json,pathlib,re,shutil,subprocess
P=argparse.ArgumentParser();P.add_argument('--source',required=True,type=pathlib.Path);args=P.parse_args()
root=pathlib.Path('.');source=args.source
read=lambda p:json.loads(pathlib.Path(p).read_text())
def write(p,x):
 p=pathlib.Path(p);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
manifest=read('data_storytelling/manifest.json')
assert manifest['manifest'][0]['schema_version']=='0.3.0','Migration already applied or unsupported version'
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()=='dac733770d8e622d5619bd84bc9d21db6c7ec7ab','Use pinned legacy snapshot'
assert not subprocess.check_output(['git','-C',str(source),'status','--porcelain','--','data'],text=True).strip(),'Legacy data is modified'
old={p.stem:read(p)[p.stem]for p in pathlib.Path('data_foundation').glob('*.json')};data=copy.deepcopy(old)
archive=pathlib.Path('data_storytelling/history/phase1b-0.3.0');assert not archive.exists(),'Archive already exists'
for p in pathlib.Path('data_foundation').glob('*.json'):write(archive/'foundation'/p.name,read(p))
for n in ['authorization','authorization_decision','manifest','change']:write(archive/(n+'.json'),read('data_storytelling/'+n+'.json'))
for p in pathlib.Path('schemas').glob('*.json'):
 dst=pathlib.Path('schemas/archive/0.3.0')/p.name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dst)
legacy={p.stem:read(p)for p in (source/'data').glob('*.json')}
oldindex={r['id']:r for rows in old.values()for r in rows};evidence=[];notes=[];mapping={}
def note(owner,description):notes.append({'record_id':owner,'description':description})
def record_source(target,file,pointer):evidence.append({'record_id':target,'source_id':'source.vs_edu1_dac7337','path':'data/'+file+'.json','pointer':pointer})
def numbered(items):
 for i,x in enumerate(items,1):x['number']=i
 return items
def item(description,kind='requirement',**kwargs):return {'number':1,'type':kind,'description':description,**kwargs}
def unknown():return {'value':None,'precision':'unknown'}
def anchor(id):return {'value':id,'precision':'event'}
def period_unknown():return {'start':unknown(),'end':unknown()}
def addunique(rows,row):
 if not any(r.get('description')==row.get('description')and r.get('type')==row.get('type')for r in rows):rows.append(row)
def clean_description(s):
 return re.sub(r'^(?:Legacy outcome \d+|Source detail \d+):\s*','',str(s)).strip()
def slug(s):return re.sub(r'[^a-z0-9_.-]+','_',s.lower()).strip('_')
# Canonical remappings, including duration events.
programme_map={
'organisation_buildout':'organisation_buildout','academy':'academy','open_compatibility':'open_compatibility','aionix':'aionix_development','smc_transfer':'smc_transfer','sgs_transfer':'sgs_transfer','clone_partnerships':'clone_partnerships','team_development':'team_development','autodesk_development':'autodesk_development','athena_1983':'athena_1983','aurelia_memory':'aurelia_memory','bpi_launch':'bpi_launch','tandy_cooperation':'tandy_cooperation'}
mapping.update({'programme.'+k:['process.'+v]for k,v in programme_map.items()})
for r in old['event']:
 if 'period'in r:mapping[r['id']]=['process.'+r['id'].split('.',1)[1]]
for r in old['narrative_period']:mapping[r['id']]=[]
# Product identity registry: catalogue + technical editions + named services.
products=[];technologies=[];productmap={};product_source={};actor_names={}
for a in data['actor']:
 for name in [a.get('name',''),*a.get('aliases',[])]:actor_names[name.casefold()]=a['id']
actor_names.update({'logix':'actor.logix','aion labs':'actor.labs','aion':'actor.aion','aion software':'actor.aion','dri':'actor.dri','bpi':'actor.bpi','bpi systems':'actor.bpi','tandy':'actor.tandy'})
def actors(value):
 result=[]
 for part in re.split(r'\s*(?:/|,| and | with )\s*',str(value or '')):
  a=actor_names.get(part.casefold())
  if a and a not in result:result.append(a)
 return result
excluded={'status','policy_file','source','sources','source_ref','source_refs','date','introduced','available_from','effective_from','valid_from','valid_to','launch_date','event_start_date','customer_release_date','timeline_note','date_precision','date_source','historical_date_source','cost','costs','price','pricing','composition_history','composition_definition','bom','bom_ref','metadata','used_by','open_decisions'}
def flatten(value,prefix=''):
 if isinstance(value,dict):
  for k,v in value.items():
   if k in excluded or any(w in k for w in ['_usd','status','_date','source','cost','yield','composition','bom']):continue
   yield from flatten(v,(prefix+'.'if prefix else '')+k)
 elif isinstance(value,list):
  for i,v in enumerate(value):yield from flatten(v,prefix+'['+str(i+1)+']')
 elif value is not None:yield prefix,value
def specifications(value):return numbered([{'number':1,'type':key or 'feature','description':str(v),'value':v}for key,v in flatten(value)])
def addproduct(r,file,pointer,kind=None):
 oldid=r['id'];newid=oldid if oldid.startswith('product.')else 'product.'+oldid.replace('.','_')
 if kind=='software_edition':
  match=next((p for p in products if p['kind']=='software' and p['name'].casefold()==r.get('name','').casefold()),None)
  if match:
   productmap[oldid]=match['id'];match['technology_ids']=list(dict.fromkeys(match['technology_ids']+r.get('technology_refs',[])))
   match['specification']+=specifications({k:r[k]for k in ['features','execution_target','platform_support','minimum_resources']if k in r})
   match['specification']=numbered(match['specification']);record_source(match['id'],file,pointer);note(match['id'],'Exact-name commercial offering / technical edition identities consolidated; legacy edition '+oldid+' maps here.');return match['id']

 if newid in {p['id']for p in products}:return newid
 productmap[oldid]=newid;product_source[newid]=r
 p={'id':newid,'name':r.get('name',oldid),'kind':kind or {'computer':'computer','computer_system':'computer','computer_software_bundle':'bundle','software':'software'}.get(r.get('category'),'hardware'),'description':r.get('positioning')or r.get('description')or r.get('name',oldid),'provider_actor_ids':actors(r.get('vendor')),'technology_ids':list(dict.fromkeys(r.get('technology_refs',[]))),'specification':specifications({k:r[k]for k in ['features','specification','execution_target','platform_support','minimum_resources','requirements','exclusions']if k in r})}
 if r.get('specification_ref','').startswith('technology.'):p['technology_ids'].append(r['specification_ref'])
 if r.get('manufacturing_process_ref','').startswith('technology.'):p['technology_ids'].append(r['manufacturing_process_ref'])
 if isinstance(r.get('version'),(str,int,float)):p['version']=str(r['version'])
 products.append(p);record_source(newid,file,pointer);return newid
for i,r in enumerate(legacy['product-catalog']['products']):addproduct(r,'product-catalog','/products/'+str(i))
for i,r in enumerate(legacy['software-editions']['software_editions']):addproduct(r,'software-editions','/software_editions/'+str(i),'software_edition')
for i,r in enumerate(legacy['services']['services']):addproduct(r,'services','/services/'+str(i),'service')
# Only devices/parts actually named by narrative/technical records, never traverse BOM composition.
lookup={r['id']:(r,file,'/'+key+'/'+str(i))for file,key in [('devices','devices'),('components','components')]for i,r in enumerate(legacy[file][key])}
def strings(x):
 if isinstance(x,str):yield x
 elif isinstance(x,list):
  for v in x:yield from strings(v)
 elif isinstance(x,dict):
  for k,v in x.items():
   if 'composition'not in k and 'bom'not in k and 'cost'not in k:yield from strings(v)
needed=set()
for file in ['events','contracts','programmes','campaigns','standards','ecosystem-inputs']:
 for s in strings(legacy[file]):
  if s in lookup:needed.add(s)
for id in sorted(needed):
 r,f,ptr=lookup[id];addproduct(r,f,ptr,'chip'if r.get('category','').endswith('_ic')else 'hardware')
for key in ['external_platforms','external_partner_products']:
 for i,r in enumerate(legacy['ecosystem-inputs'].get(key,[])):addproduct(r,'ecosystem-inputs','/'+key+'/'+str(i),'computer'if key=='external_platforms'else 'hardware')
for i,r in enumerate(legacy['standards']['technologies']):
 t={'id':r['id'],'name':r['name'],'kind':'fabrication'if r.get('category')=='semiconductor_manufacturing'else 'architecture'if 'architecture'in r.get('category','')else 'interface','description':r['name'],'owner_actor_ids':actors(r.get('owner')),'related_technology_ids':[],'specification':specifications(r.get('specification',{}))}
 if t['kind']=='fabrication':
  spec=r['specification'];t['fabrication']={'feature_size_um':spec['node_um'],'wafer_diameter_mm':spec['wafer_diameter_mm'],'lithography_method':spec['lithography']};t['specification']=specifications({k:v for k,v in spec.items()if k not in ['node_um','wafer_diameter_mm','lithography']})
 technologies.append(t);record_source(t['id'],'standards','/technologies/'+str(i))
data['product']=products;data['technology']=technologies
knowntech={t['id']for t in technologies}
for t in technologies:
 t['related_technology_ids']=list(dict.fromkeys(v for v in strings(next(r for r in legacy['standards']['technologies']if r['id']==t['id']).get('specification',{}))if v in knowntech and v!=t['id']))
for p in products:p['technology_ids']=list(dict.fromkeys(x for x in p['technology_ids']if x in knowntech))
# Convert events. Dates stay point-valued; action prose is narrative, not fictitious completion.
events=[];processes=[]
for r in old['event']:
 desc=' '.join(a['description']for a in r.get('action',[]))
 common={'title':r['title'],'kind':r['kind'],'description':desc or r['title'],'participant':copy.deepcopy(r.get('participant',[])),'subject_ids':list(dict.fromkeys(r.get('subject_ids',[])+r.get('agreement_ids',[]))),'inputs':[],'outcomes':numbered([item(o['description'],'result')for o in r.get('outcome',[])])}
 if 'period'in r:
  nr={'id':mapping[r['id']][0],**common,'kind':'activity','period':copy.deepcopy(r['period']),'steps':[item(desc or r['title'],'action')],'agreement_ids':r.get('agreement_ids',[])};processes.append(nr)
 else:
  nr={'id':r['id'],**common,'time':copy.deepcopy(r['time'])}
  for k in ['agreement_ids','process_ids','location_ids']:
   if r.get(k):nr[k]=copy.deepcopy(r[k])
  events.append(nr)
 note(nr['id'],'Former event occurrence: '+r['occurrence']+'. No authorization inferred from this historical label.')
for r in old['process']:
 nr={'id':r['id'],'title':r['title'],'kind':r['kind'],'description':r['title'],'participant':copy.deepcopy(r.get('participant',[])),'period':copy.deepcopy(r.get('period',period_unknown())),'inputs':[],'outcomes':[],'steps':[],'agreement_ids':[],'subject_ids':[]}
 for k in ['parent_process_id']: 
  if k in r:nr[k]=r[k]
 if r.get('programme_id') and mapping[r['programme_id']][0]!=r['id']:nr['related_process_ids']=[mapping[r['programme_id']][0]]
 for step in r.get('step',[]):
  desc=step['description'];label=step.get('label','')
  if 'timing qualification'in label.lower() or 'precision: unspecified'in desc:note(r['id'],desc);continue
  if label.lower().startswith('legacy outcome'):nr['outcomes'].append(item(desc,'result'));continue
  x=item(desc,'action')
  if step.get('event_id'):x['event_id']=step['event_id']
  nr['steps'].append(x)
 for gate in r.get('acceptance_gate',[]):nr['inputs'].append(item(gate['description'],'acceptance_criterion',**({'event_id':gate['evidence_event_id']}if gate.get('evidence_event_id')else {})))
 note(r['id'],'Former completion_state: '+r['completion_state']+'. Whole-record review remains required after restructuring.')
 if 'period'not in r:note(r['id'],'Unknown boundaries retained explicitly; no dates inferred from before/after prose.')
 processes.append(nr)
procindex={r['id']:r for r in processes};eventindex={r['id']:r for r in events}
# Merge programme content into processes. Retain actual steps; classify fragments rather than renaming rows.
for r in old['programme']:
 id=mapping[r['id']][0]
 if id not in procindex:
  nr={'id':id,'title':r['title'],'kind':'coordination','description':r['objective'],'period':period_unknown(),'participant':[],'inputs':[],'outcomes':[],'steps':[],'agreement_ids':[],'subject_ids':[]};procindex[id]=nr;processes.append(nr);note(id,'Programme has no authoritative interval; boundaries await review.')
 nr=procindex[id]
 if r['objective']not in nr['description']:nr['description']+=' '+r['objective']
 nr['agreement_ids']=list(dict.fromkeys(nr['agreement_ids']+r.get('agreement_ids',[])))
 for a in r['sponsor_actor_ids']:
  if not any(p['actor_id']==a and p['role']=='sponsor'for p in nr['participant']):nr['participant'].append({'actor_id':a,'role':'sponsor'})
 for g in r.get('acceptance_gate',[]):
  desc=g['description']
  if 'qualification status:'in desc or 'manufacturing costs, investments'in desc:note(id,desc);continue
  desc=re.sub(r'^(?:acceptance|qualification gates|open decisions) / \d+:\s*','',desc)
  addunique(nr['inputs'],item(desc,'acceptance_criterion'))
 for d in r.get('deliverable',[]):
  desc=d['description'];low=desc.lower()
  if any(x in low for x in ['status:','date basis:','historical distinction:','date source:','conference start:','conference end:','premiere date:','established date:','announcement date:']):note(id,desc);continue
  if 'event ref:'in low:
   eid=desc.split(':',1)[1].strip()
   if eid in eventindex:addunique(nr['steps'],item(eventindex[eid]['title'],'milestone',event_id=eid))
   continue
  if low.startswith('sponsor:'):continue
  if low.startswith('courses /') or low.startswith('completion /'):
   note(id,'Academy legacy service/policy detail preserved for explicit decomposition: '+desc)
   continue
  desc=re.sub(r'^(?:transfer deliverables) / \d+:\s*','',desc)
  desc=re.sub(r'^(?:objective|delivery|title):\s*','',desc)
  dest='inputs'if any(x in low for x in ['team environment','funding:','rights:','supply','mask','test structures','reference silicon','process recipes'])else 'outcomes'
  addunique(nr[dest],item(desc,'resource'if dest=='inputs'else 'deliverable'))
# Academy service definitions are already separate products; keep policy content as a separately reviewable assumption.
academy=[d['description']for r in old['programme']if r['id']=='programme.academy'for d in r['deliverable']if d['description'].startswith('completion /')]
if academy:
 policy={'id':'assumption.academy_course_completion_policy','kind':'policy','statement':' '.join(re.sub(r'^completion / ','',x)for x in academy)};data['assumption'].append(policy);procindex['process.academy']['inputs'].append(item('Apply the Academy course-completion and purchase-credit policy.','requirement',subject_ids=[policy['id']]))
 procindex['process.academy']['subject_ids']=[p['id']for p in products if p['kind']=='service'and any(s in p['name'].lower()for s in ['course','academy','training','fundamentals'])]
courses={}
for r in old['programme']:
 if r['id']!='programme.academy':continue
 for d in r['deliverable']:
  match=re.match(r'courses / (\d+) / ([^:]+): (.*)',d['description'])
  if match:
   number,key,value=match.groups();courses.setdefault(number,{})[key]=value
for number,course in courses.items():
 id='product.academy_course_'+str(int(number)+1)
 products.append({'id':id,'name':course['name'],'kind':'service','description':course['name']+' training course.','provider_actor_ids':['actor.academy'],'technology_ids':[],'specification':specifications({k:v for k,v in course.items()if k!='name'})})
 procindex['process.academy']['outcomes'].append(item('Provide '+course['name']+'.','deliverable',subject_ids=[id]))
 procindex['process.academy']['subject_ids'].append(id)
for r in data['assumption']:
 if r['id']=='assumption.academy_course_completion_policy':r['statement']='Course completion earns the Aurelia Driving License. The standalone two-day Aurelia Fundamentals course provides a purchase credit of 50% of tuition, valid for six months for one system, redeemable through Academy direct sales or participating authorised dealers. Logix reimburses the dealer without reducing its agreed margin. Purchase is optional. The other before-you-buy courses retain their $150 vouchers; the credits do not stack. Redeemed credit is recorded once as promotional expense, outside recurring manufacturing costs.'
# Tie only defensible exact event boundaries. Never equate a relative "before/after" with equality.
for pid,start,end in [('process.autodesk_development','event.autodesk_agreement','event.autodesk_comdex'),('process.team_development','event.team_engineering','event.team_launch'),('process.tandy_cooperation','event.tandy_contact','event.tandy_release')]:
 if start in eventindex and end in eventindex:
  procindex[pid]['period']={'start':anchor(start),'end':anchor(end)};note(pid,'Boundary links proposed from explicit programme milestones; narrower than continuing support obligations. Requires whole-record authorization.')
# Clause effective dates have one existing authoritative event.
for r in data['clause']:
 if r.get('effective_time'):
  assert r['effective_time']['value']=='1978-10-12';r.pop('effective_time');r['effective_event_id']='event.logix_share_transfer_1978'
# Common subject mapping from exact source identifiers.
def subject_refs(x):
 refs=[]
 for val in strings(x):
  if val in productmap:refs.append(productmap[val])
  elif val in knowntech:refs.append(val)
 return list(dict.fromkeys(refs))
sourceevents={r['id']:r for r in legacy['events']['events']}
for e in events:
 if e['id']in sourceevents:e['subject_ids']=list(dict.fromkeys(e['subject_ids']+subject_refs(sourceevents[e['id']])))
# Campaigns: recover presentation structure from source and move real execution to steps.
sourcecampaigns={v['id']:v for v in legacy['campaigns'].values()if isinstance(v,dict)and 'id'in v}
presentation_prefixes=('premiere','presentation','hero demo','technical sessions','speed demonstration','abacus demonstration','business sessions')
marketing_prefixes=('television commercial','positioning','messages','qa','claims','benchmark','booth zones','press kit','call to action','commercial tactics','claim limits','claim controls','disclosure','compatibility policy','profiles','migration','eight bit outlook','manufacturer assessment','peripheral programme','software update policy','availability','commercial configurations','packages','office configuration','developer program','autodesk claim','hands on invitation','strategy','commercial policy','partner policy','mono pro campaign','artemis configuration policy','academy')
def text(value):
 if isinstance(value,str):return value
 if isinstance(value,list):return ' '.join(text(x)for x in value)
 if isinstance(value,dict):return ' '.join(k.replace('_',' ')+': '+text(v)for k,v in value.items()if k not in ['id','date','status','metadata','historical_date_source'])
 return str(value)
for c in data['campaign']:
 src=sourcecampaigns.get(c['id'],{});pid='process.'+c['id'].split('.',1)[1]+'_campaign'
 execution={'id':pid,'title':c['title']+' — execution','kind':'campaign_execution','description':c['objective'],'participant':[{'actor_id':a,'role':'marketing_lead'}for a in c['lead_actor_ids']],'period':period_unknown(),'inputs':[],'outcomes':[],'steps':[],'agreement_ids':[],'subject_ids':[]}
 pres={'stage':[]};raw=src.get('premiere')or src.get('presentation')or src.get('hero_demo')
 if raw:
  if isinstance(raw,dict):
   if isinstance(raw.get('duration_minutes_before_questions',raw.get('duration_minutes')),int):pres['duration_minutes']=raw.get('duration_minutes_before_questions',raw.get('duration_minutes'))
   stages=raw.get('stages',raw.get('script',[]))
  else:stages=raw
  for i,st in enumerate(stages):
   v={'label':(st.get('id')or 'Stage '+str(i+1))if isinstance(st,dict)else 'Stage '+str(i+1),'description':(st.get('description')or st.get('content')or st.get('action')or text(st))if isinstance(st,dict)else st}
   if isinstance(st,dict):
    duration=st.get('minutes')
    if isinstance(duration,int):v['duration_minutes']=duration
    elif 'start_minute'in st:v['duration_minutes']=st['end_minute']-st['start_minute']
   pres['stage'].append(v)
 for session in src.get('technical_sessions',[]):pres['stage'].append({'label':session['topic'],'description':session['content']})
 # Original source text is supplemented by every current fragment; no accepted edit is silently overwritten.
 c['presentation']=pres;c['marketing_content']=[]
 for a in c.pop('activity',[]):
  desc=a['description'];ref=a.get('event_id')or a.get('process_id');prefix=desc.split(':',1)[0].lower()
  if ref:
   target=mapping.get(ref,[ref])[0];s=item(desc,'action');s['event_id'if target.startswith('event.')else 'process_id']=target
   # Drop duplicated timeline-prefixed date prose while preserving the original snapshot.
   if '; activity:'in desc:s['description']=desc.split('; activity:',1)[1].strip()
   elif '; action:'in desc:s['description']=desc.split('; action:',1)[1].strip()
   execution['steps'].append(s)
  elif prefix.startswith(presentation_prefixes):
   if any(x in prefix for x in ['/ date','duration minutes','/ minutes',' / id']):note(c['id'],desc);continue
   # Preserve current wording not already present in reconstructed stages as supplemental presentation content.
   value=desc.split(':',1)[-1].strip()
   if not any(value==st['description']for st in pres['stage']):pres['stage'].append({'label':desc.split(':',1)[0],'description':value})
  elif any(x in prefix for x in ['metadata','status','date source','budget','economics','cost boundary','measurement','metrics','targets','financial','cost snapshot']):note(c['id'],desc)
  elif prefix.startswith('broadcast program / deliverables'):execution['outcomes'].append(item(desc.split(':',1)[-1].strip(),'deliverable'))
  elif prefix.startswith(marketing_prefixes):c['marketing_content'].append(item(desc.split(':',1)[-1].strip(),slug(desc.split(':',1)[0])))
  elif 'acceptance'in prefix or 'launch gates'in prefix:execution['inputs'].append(item(desc.split(':',1)[-1].strip(),'acceptance_criterion'))
  else:execution['steps'].append(item(desc,'action'))
 c['marketing_content']=numbered(c['marketing_content'])
 if src.get('booth_zones'):
  c['booth']=[{'name':b['name'],'description':b.get('demo')or b.get('purpose')or text(b),**({'call_to_action':b['conversion']}if b.get('conversion')else {})}for b in src['booth_zones']]
 c['process_id']=pid;c.pop('programme_id',None)
 c['subject_ids']=list(dict.fromkeys(subject_refs(src)+[p['id']for p in products if product_source.get(p['id'],{}).get('launch_campaign_ref')==c['id']]))
 # Campaign wrappers still get concrete platform/technology subjects from their associated launch event.
 launch=c.get('launch_event_id')
 if launch in eventindex:
  c['subject_ids']=list(dict.fromkeys(c['subject_ids']+eventindex[launch]['subject_ids']))
  if not any(s.get('event_id')==launch for s in execution['steps']):execution['steps'].append(item('Deliver the campaign launch presentation.','milestone',event_id=launch))
 # Bound the execution only by documented linked activity dates; exclude inferred after/before claims.
 candidates=[]
 for s in execution['steps']:
  eid=s.get('event_id');pr=procindex.get(s.get('process_id'))
  if eid in eventindex:candidates.append((eventindex[eid]['time']['value'],anchor(eid)))
  if pr:
   for point in pr['period'].values():
    if point.get('value')and point['precision']not in ['event','unknown']:candidates.append((point['value'],point))
 if candidates:
  candidates.sort(key=lambda x:x[0]);execution['period']={'start':copy.deepcopy(candidates[0][1]),'end':copy.deepcopy(candidates[-1][1])};note(pid,'Execution bounds cover documented linked milestones only; broader follow-up timing remains an explicit review question.')
 execution['subject_ids']=c['subject_ids'];processes.append(execution);procindex[pid]=execution
# Minimal subject fallbacks for campaign wrappers and platform concepts absent from explicit legacy refs.
families={'aurelia':'Aurelia platform','artemis':'Artemis platform','athena':'Athena platform','team_edition':'AION Development System — Team Edition'}
for key,name in families.items():
 id='product.family_'+key;products.append({'id':id,'name':name,'kind':'family','description':name+' as a narrative product family; individual offerings retain separate identities.','provider_actor_ids':['actor.aion'if key=='team_edition'else 'actor.logix'],'technology_ids':[],'specification':[]});note(id,'Narrative family extracted from repeated platform names; contains no composition.')
familycampaign={'ncc1978':'aurelia','ncc1979':'aurelia','comdex1979':'aurelia','ncc1980':'artemis','comdex1980':'artemis','ncc1981':'artemis','ncc1982':'artemis','comdex1982':'artemis','comdex1981':'team_edition','ncc1983':'athena','clone_january1982':'artemis'}
for c in data['campaign']:
 c['subject_ids']=[x for x in c['subject_ids']if x.split('.')[0]in ['product','technology','actor','agreement','manufacturing_capability','market_response']]
 family='product.family_'+familycampaign[c['id'].split('.',1)[1]]
 if family not in c['subject_ids']:c['subject_ids'].append(family)
 procindex[c['process_id']]['subject_ids']=c['subject_ids']
# Scoped manufacturing capabilities; maturity is stored only in dated event outcomes.
caps=[]
for t in technologies:
 if t['kind']!='fabrication':continue
 cap={'id':'manufacturing_capability.aion_'+t['id'].split('.')[-1]+'_logic','name':t['name']+' — AION logic','actor_id':'actor.labs','technology_id':t['id'],'recipe_kind':'logic','product_ids':[],'description':'Logic-process capability scoped to AION Labs; memory and partner qualification are separate.','qualification_requirements':[item('Qualify lithography, electrical behaviour and repeatable production for the scoped logic recipe.','acceptance_criterion')]};caps.append(cap)
recipes=legacy['manufacturing-processes']['memory_manufacturing']['memory_recipes']
nodekey={'3.0':'3um','2.75':'275um','2.0':'2um','1.5':'15um'}
for i,r in enumerate(recipes):
 cap={'id':'manufacturing_capability.'+r['id'],'name':r['id'].replace('_',' '),'actor_id':'actor.labs','technology_id':'technology.nmos_'+nodekey[r['node_um']],'recipe_kind':'DRAM','product_ids':[productmap[x]for x in ['part.aion_4164']if x in productmap],'description':'64K DRAM recipe '+r['id']+'. Qualification and release are separate dated assertions.','qualification_requirements':numbered([item(x,'acceptance_criterion')for x in legacy['manufacturing-processes']['memory_manufacturing']['qualification']])};caps.append(cap);record_source(cap['id'],'manufacturing-processes','/memory_manufacturing/memory_recipes/'+str(i))
for e in events:
 suffix=e['id'].split('.',1)[1];cap=None;stage=None
 for prefix,st in [('pilot_','pilot'),('production_','production_released'),('mature_','repeatable_production')]:
  if suffix.startswith(prefix):
   node=suffix[len(prefix):];cap='manufacturing_capability.aion_nmos_'+{'275':'275um','2':'2um','15':'15um'}.get(node,'missing')+'_logic';stage=st
 drammap={'dram_control_release':'dram64_3um_control','dram_repair_release':'dram64_3um_repair','dram_275_review':'dram64_275um_repair','dram_2_release':'dram64_2um_repair','dram_15_release':'dram64_15um_repair'}
 if suffix in drammap:cap='manufacturing_capability.'+drammap[suffix];stage='qualified'if suffix=='dram_275_review'else 'production_released'
 if cap and cap in {c['id']for c in caps}:e['outcomes'].append(item(e['title'],'maturity_transition',subject_ids=[cap],maturity={'capability_id':cap,'stage':stage}));note(e['id'],'Maturity assertion extracted from the legacy milestone; remains pending until the entire record is authorized.')
data['manufacturing_capability']=caps
# Qualitative external responses, not numerical forecast coefficients or internal AION planning.
responses=[]
exclude={'event.aionix_preliminary','event.team_engineering','event.capacity_orders_1982','event.peak_readiness','event.financial_review_1980','event.financial_review_1981','event.financial_review_1982'}
for i,r in enumerate(legacy['demand-inputs']['market_reactions']['events']):
 eid=r['event_ref'];e=eventindex.get(eid)
 if not e or eid in exclude:continue
 rid='market_response.'+eid.split('.',1)[1]
 mr={'id':rid,'title':e['title'],'kind':'partnership'if any(x in eid for x in ['tandy','agreement'])else 'market_response','respondent_actor_ids':list(dict.fromkeys(p['actor_id']for p in e['participant']if p['actor_id']not in ['actor.adam','actor.aion','actor.labs','actor.logix'])),'subject_ids':list(e['subject_ids']),'trigger_ids':list(e.get('agreement_ids',[])),'description':e['description']}
 responses.append(mr);e['outcomes'].append(item('Establish the response described in '+e['title']+'.','market_response',subject_ids=[rid]));record_source(rid,'demand-inputs','/market_reactions/events/'+str(i))
data['market_response']=responses
# Programme goals and transfer scope now have concrete subjects, not just prose.
goals={
 'process.autodesk_development':['product.autocad_1_artemis','technology.artemis_professional_graphics'],
 'process.aionix_development':['product.software_aionix','technology.aionix_os_model'],
 'process.team_development':['product.aion_development_team'],
 'process.athena_1983':['product.athena','product.athena_server','technology.era2_architecture'],
 'process.era2_development':['product.part_era2_12mhz','technology.era2_architecture'],
 'process.athena_integration':['product.athena','technology.era2_architecture'],
 'process.aurelia_memory':['product.part_aion_4164'],
 'process.open_compatibility':['technology.flexibus','technology.logix_c_api'],
 'process.smc_transfer':['technology.flexibus','technology.nmos_3um'],
 'process.sgs_transfer':['technology.nmos_3um','technology.era1_isa'],
 'process.tandy_cooperation':['product.computer_trs80_model_ii','product.device_model_ii_flexibus','technology.flexibus']}
knownsubjects={p['id']for p in products}|knowntech
for pid,ids in goals.items():
 if pid not in procindex:continue
 ids=[id for id in ids if id in knownsubjects];pr=procindex[pid];pr['subject_ids']=list(dict.fromkeys(pr['subject_ids']+ids))
 for outcome in pr['outcomes']:
  if not outcome.get('subject_ids'):outcome['subject_ids']=ids
 if not pr['outcomes']:pr['outcomes'].append(item(pr['description'],'deliverable',subject_ids=ids))
# Map semiconductor development processes to their scoped capability subjects.
for suffix,node in [('process_275','275um'),('process_2','2um'),('process_15','15um')]:
 pr=procindex['process.'+suffix];cap='manufacturing_capability.aion_nmos_'+node+'_logic';pr['subject_ids'].append(cap)
 pr['outcomes'].append(item('Establish the scoped manufacturing capability through the linked qualification milestones.','deliverable',subject_ids=[cap]))
# All references remapped; deleted grouping references are removed, never silently assigned to arbitrary processes.
def remap(x):
 if isinstance(x,str):return mapping.get(x,[x])[0]if mapping.get(x,[x])else None
 if isinstance(x,list):return [v for z in x if (v:=remap(z))is not None]
 if isinstance(x,dict):return {k:remap(v)for k,v in x.items()if k not in ['narrative_period_ids']}
 return x
data['event']=events;data['process']=processes;data.pop('programme');data.pop('narrative_period');data=remap(data)
# Fix typed reference slots when a duration-event changed to a process.
def typed_slots(x):
 if isinstance(x,dict):
  for k in list(x):
   v=x[k]
   if k=='event_id'and isinstance(v,str)and v.startswith('process.'):x['process_id']=x.pop(k)
   else:typed_slots(v)
 elif isinstance(x,list):
  for v in x:typed_slots(v)
typed_slots(data)
for rows in data.values():
 for r in rows:
  for key in ['steps','inputs','outcomes','marketing_content']:
   if key in r:r[key]=numbered(r[key])
# Remove obsolete temporal fields from schemas later; no data silently loses live timestamps.
for name in ['assumption','agreement','actor_relationship']:
 for r in data[name]:assert not any(k in r for k in ['valid_time','period']),r['id']
for p in pathlib.Path('data_foundation').glob('*.json'):p.unlink()
for name,rows in data.items():write('data_foundation/'+name+'.json',{name:rows})
# Preserve exact approvals only. Changed data returns to pending; archive old decisions untouched.
auth=read(archive/'authorization.json')['authorization'];oldauth={a['record_id']:a for a in auth};newauth=[];review=[]
for name,rows in data.items():
 for r in rows:
  before=oldindex.get(r['id']);a=oldauth.get(r['id']);unchanged=before==r
  if unchanged and a:newauth.append(a)
  else:newauth.append({'id':'authorization.'+r['id'].replace('.','_'),'record_id':r['id'],'state':'unauthorized','content_sha256':digest(r)})
  if not unchanged:review.append({'record_id':r['id'],'before_sha256':digest(before)if before else None,'after_sha256':digest(r),'previously_authorized':bool(a and a['state']=='authorized'),'reason':'New phase-1B subject'if before is None else 'Restructured whole record; authorization must cover all current content.'})
write('data_storytelling/authorization.json',{'authorization':newauth})
manifest['manifest'][0]['schema_version']='0.4.0';manifest['manifest'][0]['foundation_datasets']=list(data);write('data_storytelling/manifest.json',manifest)
changes=read('data_storytelling/change.json');assert not changes['change'],'Pending proposals must be rebased before migrating';changes['metadata']['description']='Pending story changes awaiting whole-record authorization.';changes['metadata']['applied_summary']='Historical proposals remain in review archives; phase-1B migration is documented separately.';write('data_storytelling/change.json',changes)
write('data_storytelling/phase1b_migration.json',{'migration':[{'id':'migration.phase1b','from_version':'0.3.0','to_version':'0.4.0','baseline_commit':'52dc739','source_commit':'dac733770d8e622d5619bd84bc9d21db6c7ec7ab','id_mapping':[{'old_id':k,'new_ids':v}for k,v in mapping.items()],'product_mapping':[{'legacy_id':k,'record_id':v}for k,v in productmap.items()],'review':review,'notes':notes,'source_refs':evidence,'counts':{k:len(v)for k,v in data.items()},'archive':'data_storytelling/history/phase1b-0.3.0'}]})
print('Migrated:',{k:len(v)for k,v in data.items()});print('Unchanged authorized records:',sum(a['state']=='authorized'for a in newauth));print('Records requiring review:',len(review))
