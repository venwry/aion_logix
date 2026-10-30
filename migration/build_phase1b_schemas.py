"""Install the agreed strict 0.4 schemas after the phase-1B data migration."""
import json,pathlib
BASE='https://aion-logix.invalid/schemas/'
def read(n):return json.loads(pathlib.Path('schemas/'+n+'.schema.json').read_text())
def write(n,v):pathlib.Path('schemas/'+n+'.schema.json').write_text(json.dumps(v,indent=2)+'\n')
names=sorted(p.stem for p in pathlib.Path('data_foundation').glob('*.json'))
def ref(*types):return {'type':'string','pattern':'^('+'|'.join(types)+')\\.[a-z0-9][a-z0-9_.-]*$','x-ref':list(types)}
def array(item,minimum=0):return {'type':'array','items':item,'minItems':minimum}
def refs(*types):return {**array(ref(*types)),'uniqueItems':True}
def obj(props,required=()):return {'type':'object','properties':props,'required':list(required),'additionalProperties':False}
def common(n):return {'$ref':BASE+'common.schema.json#/$defs/'+n}
string={'type':'string','minLength':1};num={'type':'integer','minimum':1}
def schema(n,props,required):
 record=obj({'id':{'type':'string','pattern':'^'+n+'\\.[a-z0-9][a-z0-9_.-]*$'},**props},['id',*required]);return {'$schema':'https://json-schema.org/draft/2020-12/schema','$id':BASE+n+'.schema.json',**obj({n:array({'$ref':'#/$defs/record'})},[n]),'$defs':{'record':record}}
c=read('common');defs=c['$defs'];defs['boundary']={'oneOf':[common('date'),obj({'value':ref('event'),'precision':{'const':'event'}},['value','precision']),obj({'value':{'type':'null'},'precision':{'const':'unknown'}},['value','precision'])],'x-boundary':True};defs['period']=obj({'start':common('boundary'),'end':common('boundary')},['start','end']);defs['period']['x-period']=True
item=obj({'number':num,'type':{'type':'string','enum':['action','milestone','resource','requirement','acceptance_criterion','deliverable','result','decision','qualification','maturity_transition','market_response','agreement_basis']},'description':string,'subject_ids':refs(*names),'event_id':ref('event'),'process_id':ref('process'),'maturity':obj({'capability_id':ref('manufacturing_capability'),'stage':{'enum':['pilot','qualified','production_released','repeatable_production','suspended']}},['capability_id','stage'])},['number','type','description']);item['not']={'required':['event_id','process_id']};defs['item']=item
write('common',c)
props={'title':string,'kind':string,'description':string,'participant':array(common('participant')),'subject_ids':refs(*names),'inputs':array(common('item')),'outcomes':array(common('item')),'agreement_ids':refs('agreement')}
write('event',schema('event',{**props,'time':common('date'),'process_ids':refs('process'),'location_ids':refs('location')},['title','kind','description','participant','time','inputs','outcomes']))
write('process',schema('process',{**props,'period':common('period'),'steps':array(common('item')),'parent_process_id':ref('process'),'related_process_ids':refs('process')},['title','kind','description','participant','period','steps','inputs','outcomes']))
for n in ['assumption','actor_relationship','agreement','clause','campaign']:
 s=read(n);r=s['$defs']['record'];p=r['properties']
 for k in ['valid_time','effective_time','period','programme_id','activity']:
  p.pop(k,None)
  if k in r['required']:r['required'].remove(k)
 if n=='clause':p['effective_event_id']=ref('event')
 if n=='actor_relationship':p['process_id']=ref('process')
 if n=='assumption':p['process_id']=ref('process')
 if n=='agreement':p['effective_event_id']=ref('event');p['termination_event_id']=ref('event');p['process_id']=ref('process')
 if n=='campaign':
  p['process_id']=ref('process');r['required'].append('process_id');p['marketing_content']=array(obj({'number':num,'type':string,'description':string},['number','type','description']));p['subject_ids']=refs('product','technology','manufacturing_capability','actor','agreement','market_response')
 # Replace the old all-foundation polymorphic target union (including removed types).
 def upgrade(x):
  if isinstance(x,dict):
   if 'x-ref'in x and ('programme'in x['x-ref']or'narrative_period'in x['x-ref']):x.update(ref(*names))
   for v in x.values():upgrade(v)
  elif isinstance(x,list):
   for v in x:upgrade(v)
 upgrade(s);write(n,s)
spec=array(obj({'number':num,'type':string,'description':{'type':'string'},'value':{'type':['string','number','boolean']},'unit':string},['number','type','description']))
write('product',schema('product',{'name':string,'kind':{'enum':['computer','hardware','software','software_edition','bundle','service','chip','family']},'description':string,'provider_actor_ids':refs('actor'),'family_product_id':ref('product'),'version':string,'technology_ids':refs('technology'),'specification':spec},['name','kind','description','provider_actor_ids','technology_ids','specification']))
write('technology',schema('technology',{'name':string,'kind':{'enum':['protocol','interface','architecture','software_method','fabrication']},'description':string,'owner_actor_ids':refs('actor'),'related_technology_ids':refs('technology'),'specification':spec,'fabrication':obj({'feature_size_um':{'type':'number','exclusiveMinimum':0},'wafer_diameter_mm':{'type':'number','exclusiveMinimum':0},'lithography_method':string},['feature_size_um','lithography_method'])},['name','kind','description','owner_actor_ids','related_technology_ids','specification']))
write('manufacturing_capability',schema('manufacturing_capability',{'name':string,'actor_id':ref('actor'),'location_id':ref('location'),'technology_id':ref('technology'),'recipe_kind':{'enum':['logic','SRAM','DRAM','analogue']},'product_ids':refs('product'),'description':string,'qualification_requirements':array(common('item'))},['name','actor_id','technology_id','recipe_kind','product_ids','description','qualification_requirements']))
write('market_response',schema('market_response',{'title':string,'kind':{'enum':['adoption','partnership','competing_offer','compatibility_response','purchasing_response','channel_response','market_response','other']},'respondent_actor_ids':refs('actor'),'subject_ids':refs(*names),'trigger_ids':refs('event','process','campaign','agreement'),'description':string},['title','kind','respondent_actor_ids','subject_ids','trigger_ids','description']))
for n in ['programme','narrative_period']:pathlib.Path('schemas/'+n+'.schema.json').unlink()
pathlib.Path('code/model-contract.js').write_text('export const schemaVersion = "0.4.0";\nexport const datasets = '+json.dumps(names)+';\n')
