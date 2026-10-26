#!/usr/bin/env python3
"""Reproducible, read-only migration of the pinned legacy source into a fresh output directory.
Usage: python migration/migrate_phase1.py --source /workspace/vs_edu1 --output data
Refuses to overwrite an existing output. Review corrections belong in the target, not this rerun.
"""
import argparse, collections, hashlib, json, pathlib, re, subprocess
P=argparse.ArgumentParser();P.add_argument('--source',type=pathlib.Path,required=True);P.add_argument('--output',type=pathlib.Path,required=True);args=P.parse_args()
ROOT=args.source;OUT=args.output;PIN='dac733770d8e622d5619bd84bc9d21db6c7ec7ab';SID='source.vs_edu1_dac7337'
if OUT.exists():raise SystemExit('Output exists; choose a fresh directory. Never overwrite reviewed records.')
if subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()!=PIN:raise SystemExit('Source HEAD differs from reviewed snapshot')
if subprocess.check_output(['git','-C',str(ROOT),'status','--porcelain','--','data'],text=True).strip():raise SystemExit('Source data has local modifications')
S={p.name:json.loads(p.read_text()) for p in sorted((ROOT/'data').glob('*.json'))}
NAMES=['assumption','actor','actor_relationship','event','campaign','agreement','clause','process','programme','location','narrative_period','source','review_decision','migration_map','reconciliation_issue']
D={k:{} for k in NAMES};MAP={};SNAP={}
def slug(s):return re.sub(r'[^a-z0-9]+','_',s.lower()).strip('_')
def ptr(s):return str(s).replace('~','~0').replace('/','~1')
def sr(f,p,note=None):
 x={'source_id':SID,'path':'data/'+f,'pointer':p}
 if note:x['note']=note
 return x
def source_value(f,p):
 v=S[f]
 for bit in p.split('/')[1:]:
  key=bit.replace('~1','/').replace('~0','~');v=v[int(key)] if isinstance(v,list) else v[key]
 return v
def add(kind,id,fields,f=None,p='',status='pending confirmation',extra=None):
 key=id if id.startswith(kind+'.') else kind+'.'+id
 if key in D[kind]:raise ValueError('duplicate '+key)
 r={'id':key,'status':status}
 if f:r['source_refs']=[sr(f,p)]
 if extra:r.setdefault('source_refs',[]).extend(extra)
 r.update(fields);D[kind][key]=r;return r
def cite(r,f,p,note=None):
 q=sr(f,p,note)
 if q not in r.setdefault('source_refs',[]):r['source_refs'].append(q)
def mapping(f,p,targets=(),disposition=None,reason='',legacy=None):
 targets=list(dict.fromkeys(targets));disposition=disposition or ('split' if len(targets)>1 else 'mapped' if targets else 'excluded')
 key=(f,p);MAP[key]={'targets':targets,'disposition':disposition,'reason':reason or 'Represented in phase-1 narrative fields; preserve source precision and qualifications.','legacy':legacy}
def append_mapping(f,p,ids,reason):
 old=MAP.get((f,p));targets=list(old['targets']) if old and old['disposition'] in ('mapped','split','merged') else []
 mapping(f,p,targets+list(ids),reason=reason)
def issue(key,title,description,affected,f,p,kind='classification',extra=None,candidates=None):
 fields={'title':title,'kind':kind,'description':description,'affected_ids':list(dict.fromkeys(affected)),'state':'open'}
 if candidates:fields['candidate']=[{'statement':s,'source_refs':[sr(ff,pp)]} for s,ff,pp in candidates]
 return add('reconciliation_issue',key,fields,f,p,extra=extra)
def leaves(v,p=''):
 if isinstance(v,dict) and v:
  for k,x in v.items():yield from leaves(x,p+'/'+ptr(k))
 elif isinstance(v,list) and v:
  for i,x in enumerate(v):yield from leaves(x,p+'/'+str(i))
 else:yield p,v

def text_lines(v,label=''):
 """Human-readable owned details, not an opaque JSON blob; source pointers retain original structure."""
 result=[]
 for p,x in leaves(v):
  if x in ([],{},None):continue
  lead=' / '.join([label]+[k.replace('_',' ') for k in p.split('/')[1:]]).strip(' /')
  result.append((lead+': ' if lead else '')+(str(x).lower() if isinstance(x,bool) else str(x)))
 return result

def point(v,basis='legacy_scenario',qualifier=None):
 if not isinstance(v,str) or not re.fullmatch(r'\d{4}(?:-\d{2}){0,2}',v):return None
 r={'value':v,'precision':{4:'year',7:'month',10:'day'}[len(v)],'basis':basis}
 if qualifier:r['qualifier']=qualifier
 return r

def interval(v):
 q=v.get('qualifier');basis='inferred' if 'provisional' in str(v).lower() or 'inferred' in str(v).lower() else 'legacy_scenario'
 a=point(v.get('start'),basis,q);b=point(v.get('end'),basis,q)
 return {'start':a,'end':b} if a and b else None

def actor_ids(ids):return list(dict.fromkeys(x for x in ids if x in D['actor']))
def participant(items):return [{'actor_id':x['actor_ref'],'role':x.get('role','participant')} for x in items if x.get('actor_ref') in D['actor']]
def actor_mentions(v):
 s=' '.join(text_lines(v));return actor_ids(re.findall(r'actor\.[a-z0-9_]+',s))

D['source'][SID]={'id':SID,'status':'pending confirmation','kind':'repository_snapshot','title':'Legacy phase-1 input snapshot','url':'https://github.com/venwry/vs_edu1','commit':PIN,'citation':'All 21 authoritative data JSON files inspected recursively. Citations do not imply author confirmation or external-source verification.'}
# Default coverage explicitly defers source material; more specific mappings override these.
DEFER={
'components.json':'Phase 2 component specifications/BOM and phase 3 process data. Actor identities, launch evidence and second-source narrative extracted separately.',
'devices.json':'Phase 2 device/composition specifications and phase 3 qualification details. Narrative milestones extracted separately.',
'software-editions.json':'Phase 2 software/edition specifications; phase-1 development and rights extracts override this deferral.',
'product-catalog.json':'Phase 2 commercial definitions/composition; phase 5 prices. Launch references are checked separately.',
'services.json':'Phase 2 service offerings/entitlements and phase 5 pricing; programme and cooperation narrative extracted separately.',
'standards.json':'Phase 2 technical standards and phase 3 engineering targets; technical ownership is not automatically legal ownership.',
'cost-inputs.json':'Phase 3/5 technical cost and pricing inputs; no cost forecast imported as history.',
'investment-inputs.json':'Phase 5 financial provisions; selected narrative corroboration extracted separately.',
'manufacturing-processes.json':'Phase 3 fabrication recipes, yield and engineering gates; not completed production facts.',
'demand-inputs.json':'Phase 4 proposed market responses and later sales/ROI forecasts. Narrative date policy extracted separately.',
'ecosystem-inputs.json':'Phase 4 external product/market forecasts and assumptions; actor names and existing milestones extracted separately.',
'programmes.json':'Technical and financial subfields deferred to phases 2–5 unless explicitly mapped below.',
'campaigns.json':'Campaign field must be explicitly classified; unresolved fields stay deferred.',
'world.json':'World field must be explicitly classified; unresolved fields stay deferred.',
'events.json':'Event field must be explicitly classified; unresolved fields stay deferred.',
'contracts.json':'Contract field must be explicitly classified; unresolved fields stay deferred.',
'sourcing.json':'Supplier terms and scope; technical part definitions deferred to phase 2.',
 'timeline-structure.json':'Timeline structure must be explicitly classified.',
 'assemblies.json':'Empty active assembly collection; no narrative facts.',
 'retired_assemblies.json':'Historical archive; not current BOM or narrative truth.',
 'site.json':'Presentation/navigation configuration, not story canon.'}
for f in S:
 mapping(f,'',(), 'excluded' if f in ['assemblies.json','retired_assemblies.json','site.json'] else 'deferred',DEFER[f])
 for k in ['$schema','schema_version']:
  if k in S[f]:mapping(f,'/'+k,(),reason='Legacy schema bookkeeping, replaced by approved target metadata.')

# Actors: retain identity, leave market segment outside actor model.
W=S['world.json'];E=S['events.json']['events'];EI={x['id']:i for i,x in enumerate(E)}
for i,x in enumerate(W['entities']):
 p=f'/entities/{i}'
 if x['type']=='market':
  mapping('world.json',p,(), 'deferred','Market segment, not an actor; phase-4 market model.',x['id']);continue
 r=add('actor',x['id'],{'kind':{'person':'person','company':'organisation','group':'group'}[x['type']],'name':x['name'],'aliases':x.get('aliases',[]),'description':x.get('description','')},'world.json',p)
 mapping('world.json',p,[r['id']],legacy=x['id'])
# Explicitly named organisations/people only. Multi-company vendor labels are not new legal entities.
ACTOR_NAMES={
'Ball Brothers':('ball_brothers','organisation'),'Motorola':('motorola','organisation'),'NEC':('nec','organisation'),'Seagate Technology':('seagate','organisation'),'Sony':('sony','organisation'),'Thorn–Brimar':('thorn_brimar','organisation'),'Zilog':('zilog','organisation'),'Altos':('altos','organisation'),'Cromemco':('cromemco','organisation'),'Heath/Heathkit':('heath','organisation'),'Intertec':('intertec','organisation'),'Rodime':('rodime','organisation'),'Shugart Associates':('shugart','organisation')}
ALIASES={a:D['actor'][id]['id'] for id in D['actor'] for a in [D['actor'][id]['name']]+D['actor'][id].get('aliases',[])}
ALIASES.update({'North Star':'actor.northstar','Standard Microsystems Corporation (SMC)':'actor.smc'})
for f,v in S.items():
 for p,x in leaves(v):
  if p.split('/')[-1] not in ['vendor','manufacturer','partner'] or not isinstance(x,str):continue
  if x in ACTOR_NAMES:
   key,kind=ACTOR_NAMES[x];aid='actor.'+key
   if aid not in D['actor']:add('actor',aid,{'kind':kind,'name':x,'description':'Named legacy vendor/manufacturer; no additional contract, ownership or qualification is inferred.'},f,p)
   else:cite(D['actor'][aid],f,p)
   ALIASES[x]=aid
  if x in ALIASES:append_mapping(f,p,[ALIASES[x]],'Named actor identity extracted; supplier/product relationship remains in the later-phase source.')
for key,name,kind,f,p,desc in [
 ('michael_douglas','Michael Douglas','person','campaigns.json','/aurelia_1978_campaign/television_commercial/proposed_lead','Proposed advertising lead only; no casting contract or availability established.'),
 ('mike_riddle','Mike Riddle','person','programmes.json','/team_development_program/autodesk_sponsored_deployment/commercial_terms','Named Interact contributor; rights need clearance, not an assumed licence.'),
 ('harvard','Harvard University','organisation','timeline-structure.json','/processes/0/actions/0','Institution explicitly named in the economics-study process.')]:
 r=add('actor',key,{'kind':kind,'name':name,'description':desc},f,p);append_mapping(f,p,[r['id']],'Actor identity recovered from an indirect narrative mention; no extra contract inferred.')

# Assumptions preserve world premises and policies, including background rather than a jump log.
for i,x in enumerate(W['principles']):
 id='assumption.'+x['id'].split('.',1)[1];kind='policy' if x['id'].startswith('principle.') else 'world_premise'
 statement=x['description'];fields={'kind':kind,'statement':statement,'scope_ids':actor_ids(x.get('actor_refs',[]))}
 if x.get('equipment'):fields['statement']+='\n'+'\n'.join(text_lines(x['equipment'],'Future equipment'))
 if x.get('context'):fields['statement']+='\n'+'\n'.join(text_lines({k:v for k,v in x['context'].items() if not k.endswith('_refs')},'Context'))
 r=add('assumption',id,fields,'world.json',f'/principles/{i}',status='speculation' if id=='assumption.market_expansion' else 'pending confirmation')
 mapping('world.json',f'/principles/{i}',[id],legacy=x['id'])
 for k in ['product_refs','phase_refs','related_event_refs']:
  if k in x.get('context',{}):mapping('world.json',f'/principles/{i}/context/{k}',(), 'deferred','Legacy technical/narrative links resolved where targets exist; original evidence retained.')
# Full scenario premise and editorial conventions are deliberately distinct.
r=add('assumption','scenario',{'kind':'world_premise','statement':'\n'.join(text_lines(W['scenario']))},'world.json','/scenario');mapping('world.json','/scenario',[r['id']])
mapping('world.json','/metadata',(),reason='Legacy catalog metadata; not authoritative new story records.')
mapping('world.json','/conventions',(),reason='Legacy editorial conventions superseded by approved phase-1 model; retained in source for review, not imported as story facts.')
x=E[EI['event.power']];r=add('assumption','future_origin',{'kind':'world_premise','statement':f"Background premise, not a world-timeline milestone: {x['date']['start']}. "+' '.join(a['description'] for a in x['actions']),'scope_ids':['actor.adam']},'events.json',f"/events/{EI['event.power']}")
mapping('events.json',f"/events/{EI['event.power']}",[r['id']],reason='User requires a linear world story from 1972; future origin retained as premise, not a tracked time jump.',legacy='event.power')

# Narrative bands.
T=S['timeline-structure.json'];phase_events=collections.defaultdict(list)
for i,x in enumerate(T['phases']):
 id='narrative_period.'+x['id'].split('.',1)[1]
 r=add('narrative_period',id,{'title':x['title'],'period':interval(x['period']),'display_order':i+1},'timeline-structure.json',f'/phases/{i}')
 mapping('timeline-structure.json',f'/phases/{i}',[id],legacy=x['id'])
 for e in x.get('event_refs',[]):phase_events[e].append(id)

# Events: keep claimed occurrences distinct from plans, conditional gates and numerical forecast narrative.
SPEC_EVENTS=set('apple_business_initiative apple_dealer_demos apple_search apple_peachtree apple_business_promotions ibm_investigate apple_compatibility_review ibm_project ibm_os_review apple_business tandy_response native_validation ibm_os_program adapter_response financial_review_1980 capacity_orders_1982 portable_cpm_pressure network_pilots recession_response ibm_qualification unix_competition financial_review_1981 dri_68k_program x86_protection_review ibm_alternative_launch tandy_68k_review application_competition peak_readiness compatibility_review financial_review_1982'.split())
PLANNED=set('stepper_order stepper_accept pilot_275 production_275 dram_control_release dram_repair_release dram_275_review pilot_2 production_2 dram_2_release mature_2 pilot_15 production_15 dram_15_release mature_15 autodesk_comdex autodesk_beta sgs_controller_gate clone_release_gate autodesk_professional_handover'.split())
for i,x in enumerate(E):
 if x['id']=='event.power':continue
 key=x['id'].split('.',1)[1];typ=x['event_type'];date=x['date'];qual=date.get('qualifier')
 fields={'kind':{'organization':'founding','agreement':'agreement_milestone','offer':'agreement_milestone','recruitment':'recruitment','launch':'launch','release':'launch','service_launch':'launch','policy':'decision','release_and_policy':'launch','plan':'activity','action':'activity'}.get(typ,'activity'),'title':x['title'],'occurrence':'planned' if typ in ['plan','offer','commitment'] or key in SPEC_EVENTS|PLANNED else 'occurred','participant':participant(x['participants']),'action':[{'description':a['description'],'actor_ids':actor_ids(a.get('actor_refs',[]))} for a in x['actions']],'outcome':[{'description':o['description']} for o in x.get('outcomes',[])],'conditions':[]}
 fields['kind']='arrival' if key=='identity' else fields['kind']
 if date['start']==date['end']:fields['time']=point(date['start'],qualifier=qual)
 else:fields['period']=interval(date)
 if phase_events[x['id']]:fields['narrative_period_ids']=phase_events[x['id']]
 related=[('assumption.future_origin' if e=='event.power' else e) for e in x.get('related_event_refs',[])]
 if related:fields['subject_ids']=list(dict.fromkeys(related))
 if x.get('metrics'):fields['conditions']+=text_lines(x['metrics'],'Legacy metric (interpret in source context, not measured automatically)')
 r=add('event',x['id'],fields,'events.json',f'/events/{i}',status='speculation' if key in SPEC_EVENTS else 'pending confirmation')
 mapping('events.json',f'/events/{i}',[r['id']],legacy=x['id'])
 if x.get('product_refs'):mapping('events.json',f'/events/{i}/product_refs',(), 'deferred','Phase 2/4 product identity reconciliation; narrative descriptions retained without dangling technical IDs.')
 for j,part in enumerate(x['participants']):
  if part['actor_ref']=='actor.customers':mapping('events.json',f'/events/{i}/participants/{j}',(), 'deferred','Legacy market segment is not an actor; phase-4 market scope.')
 if r['occurrence']=='planned':r['conditions'].append('Occurrence classified as planned/conditional for migration; no completion or shipment inferred from the date. Review alongside cited source wording.')
 if r['status']=='speculation':r['conditions'].append('Legacy forecast/market-response assertion; requires explicit author adoption before becoming baseline history. Numerical reassessment is deferred.')

# Legacy contracts: distinguish unilateral targets from actual agreements.
CON=S['contracts.json'];AG_EVENT={};DRI_KEYS=['ip_rights','joint_equity','adam_equity','employee_reserve','capital','responsibilities']
for event_id,terms in CON.items():
 if not isinstance(terms,list):continue
 if event_id=='event.ibm_project':
  for j,t in enumerate(terms):
   val='; '+', '.join(text_lines({'value':t['value'],'unit':t['unit']})) if t.get('value') is not None else ''
   r=add('assumption',f'ibm_project_target_{j+1}',{'kind':'target','statement':t['description']+val,'scope_ids':['actor.ibm','event.ibm_project']},'contracts.json','/'+event_id+'/'+str(j),status='speculation')
   mapping('contracts.json','/'+event_id+'/'+str(j),[r['id']],reason='Unilateral project target, not an agreement with another party.')
  continue
 # Apple extension responsibility is an additional clause under existing cooperation.
 aid='agreement.apple_cooperation' if event_id=='event.apple_extensions' else 'agreement.'+event_id.split('.',1)[1].removesuffix('_agreement')
 if aid not in D['agreement']:
  e=E[EI[event_id]];members=actor_ids([p['actor_ref'] for p in e['participants']]+[a for t in terms for a in t.get('actor_refs',[])])
  kind='founding' if event_id=='event.dri_founding' else 'distribution' if event_id=='event.retail' else 'licence' if event_id in ['event.smc_agreement','event.sgs_transfer_agreement','event.dri_cpm'] else 'development' if event_id=='event.aionix_agreement' else 'cooperation'
  r=add('agreement',aid,{'title':e['title'],'kind':kind,'state':'offer' if event_id=='event.bpi_offer' else 'executed','party':[{'actor_id':a,'role':'participant in source; exact legal capacity to review'} for a in members],'description':'Agreement identity reconstructed from the event and terms. Signing/other milestones remain separate events.'},'contracts.json','/'+event_id,extra=[sr('events.json',f'/events/{EI[event_id]}')])
 AG_EVENT[event_id]=aid;D['event'][event_id].setdefault('agreement_ids',[]).append(aid)
 mapping('events.json',f'/events/{EI[event_id]}/agreement_ref',[aid],reason='Legacy event-key agreement ref replaced with independent agreement identity.')
 for j,t in enumerate(terms):
  cid='clause.dri_'+DRI_KEYS[j] if event_id=='event.dri_founding' else 'clause.'+event_id.split('.',1)[1]+'_'+slug(t['type'])+'_'+str(j+1)
  kind={'ownership':'rights','equity':'other','equity_offer':'other','reuse_right':'rights','porting_right':'rights','responsibility':'responsibility','funding':'funding','cash_offer':'funding','testing':'qualification','target_launch':'term','target_price':'term'}.get(t['type'],'other')
  mode='proposal' if event_id=='event.bpi_offer' or (event_id=='event.sgs_transfer_agreement' and j==5) else 'target' if t['type'].startswith('target_') or (event_id=='event.sgs_transfer_agreement' and j==4) else 'commitment'
  statement=t['description']
  if t.get('value') is not None:statement+='\nSource value: '+', '.join(text_lines(t['value']))+'; unit: '+str(t.get('unit'))+'.'
  fields={'agreement_id':aid,'kind':kind,'statement':statement,'assertion_mode':mode,'actor_ids':actor_ids(t.get('actor_refs',[]))}
  if event_id=='event.dri_founding' and j in [1,2,3]:
   fields['kind']='equity';fields['equity']={'company_actor_id':'actor.dri','beneficiary_actor_ids':[] if j==3 else actor_ids(t['actor_refs']),'percentage':t['value'],'basis':'fully_diluted','allocation':{1:'joint_unsplit',2:'individual',3:'unallocated_reserve'}[j]}
  if t.get('effective_date') and point(t['effective_date']):fields['effective_time']=point(t['effective_date'])
  r=add('clause',cid,fields,'contracts.json','/'+event_id+'/'+str(j));mapping('contracts.json','/'+event_id+'/'+str(j),[cid])
  if t['type'] in ['equity','equity_offer'] and fields['kind']!='equity':issue(cid.split('.',1)[1]+'_basis','Equity semantics require clarification', 'The numeric percentage is retained in the clause statement, but the source does not state issued/voting/fully-diluted basis. No structured equity basis or unstated beneficiary is invented.',[cid,aid],'contracts.json','/'+event_id+'/'+str(j))
# Derived agreements absent from the legacy contract file.
def derived_agreement(key,title,kind,members,event_ids,descriptions,f,p,state='executed'):
 aid='agreement.'+key;r=add('agreement',aid,{'title':title,'kind':kind,'state':state,'party':[{'actor_id':a,'role':role} for a,role in members],'description':'Reconstructed from narrative mentions; source-specific terms and legal capacity remain subject to review.'},f,p)
 for eid in event_ids:
  D['event'][eid].setdefault('agreement_ids',[]).append(aid);cite(r,'events.json',f'/events/{EI[eid]}')
 ids=[aid]
 for key2,kind2,statement,fp,pp,mode in descriptions:
  c=add('clause',key+'_'+key2,{'agreement_id':aid,'kind':kind2,'statement':statement,'assertion_mode':mode,'actor_ids':[a for a,_ in members]},fp,pp);ids.append(c['id']);append_mapping(fp,pp,[c['id']],'Term extracted from indirect narrative mention, distinct from the agreement event.')
 append_mapping(f,p,ids,'Agreement and terms reconstructed from narrative, not created as an unsupported signed contract.')
 return aid
BPI=E[EI['event.bpi_cooperation']]
derived_agreement('bpi_cooperation','BPI operational cooperation','cooperation',[('actor.bpi','independent software partner'),('actor.adam','proposing investor'),('actor.aion','engineering support'),('actor.logix','distribution and training')],['event.bpi_cooperation','event.bpi_training'], [('operating_independence','rights',BPI['actions'][0]['description'],'events.json',f"/events/{EI['event.bpi_cooperation']}/actions/0",'commitment'),('support','responsibility',S['software-editions.json']['software_editions'][13]['specification']['company_and_support'],'software-editions.json','/software_editions/13/specification/company_and_support','commitment')],'events.json',f"/events/{EI['event.bpi_cooperation']}")
derived_agreement('mpi_oem','MPI printer-mechanism OEM arrangement','supply',[('actor.logix','OEM customer'),('actor.mpi','mechanism supplier')],['event.mpi'],[('supply','responsibility',E[EI['event.mpi']]['actions'][0]['description'],'events.json',f"/events/{EI['event.mpi']}/actions/0",'commitment')],'events.json',f"/events/{EI['event.mpi']}")
AUT=S['programmes.json']['team_development_program']['autodesk_sponsored_deployment'];AP='/team_development_program/autodesk_sponsored_deployment'
descriptions=[('rights','rights',AUT['commercial_terms'],'programmes.json',AP+'/commercial_terms','commitment'),('funding','funding',AUT['funding'],'programmes.json',AP+'/funding','commitment'),('delivery','term',AUT['objective'],'programmes.json',AP+'/objective','target')]
for k,v in AUT['team_environment'].items():descriptions.append(('deployment_'+k,'responsibility',v,'programmes.json',AP+'/team_environment/'+k,'commitment'))
for j,v in enumerate(AUT['acceptance']):descriptions.append((f'acceptance_{j+1}','qualification',v,'programmes.json',AP+'/acceptance/'+str(j),'commitment'))
derived_agreement('autodesk_development','Autodesk funded development and distribution agreement','development',[('actor.adam','sponsor'),('actor.logix','distribution and hardware'),('actor.aion','development support'),('actor.labs','hardware support'),('actor.autodesk','April adopting company; January founders capacity unresolved')],['event.autodesk_agreement','event.autodesk_incorporation'],descriptions,'programmes.json',AP)
issue('autodesk_signatories','Autodesk January signatory capacity','Source names Autodesk in January before incorporation and describes April adoption. Agreement is reconstructed as one continuing arrangement; do not invent the founders who signed or their legal capacity. Mike Riddle is named for rights clearance, not asserted as a signatory.',['agreement.autodesk_development','event.autodesk_agreement','event.autodesk_incorporation'],'programmes.json',AP,kind='indirect_mention')
# Additional only-proposed casting agreement: no fictional signed contract.
TV=S['campaigns.json']['aurelia_1978_campaign']['television_commercial']
derived_agreement('aurelia_casting_proposal','Aurelia television casting proposal','cooperation',[('actor.logix','campaign proposer'),('actor.michael_douglas','proposed performer')],[],[('casting','term',TV['casting_status'],'campaigns.json','/aurelia_1978_campaign/television_commercial/casting_status','proposal')],'campaigns.json','/aurelia_1978_campaign/television_commercial',state='offer')
# Named Apple-Peachtree cooperation recovered from the separate market-response event; stays speculative.
pa=derived_agreement('apple_peachtree','Apple–Peachtree business-software cooperation','cooperation',[('actor.apple','platform partner'),('actor.peachtree','software partner')],['event.apple_peachtree'],[('scope','responsibility',' '.join(a['description'] for a in E[EI['event.apple_peachtree']]['actions']),'events.json',f"/events/{EI['event.apple_peachtree']}/actions",'proposal')],'events.json',f"/events/{EI['event.apple_peachtree']}",state='negotiating')
D['agreement'][pa]['status']='speculation';D['clause']['clause.apple_peachtree_scope']['status']='speculation'

# Programmes: coordinated work with explicit narrative sources, not cost ledgers.
def programme(key,title,objective,sponsors,f,p,agreements=()):
 r=add('programme',key,{'title':title,'objective':objective,'sponsor_actor_ids':sponsors,'agreement_ids':list(agreements),'deliverable':[],'acceptance_gate':[]},f,p);return r
PROGRAMMES=[
('organisation_buildout','Organisation and engineering buildout',W['principles'][6]['description'],['actor.adam'],'world.json','/principles/6',()),
('academy','Logix Computer Academy launch and training','Establish training, demonstrations and authorised direct sales, keeping service capacity and customer outcomes distinct.',['actor.academy','actor.logix'],'campaigns.json','/aurelia_1978_campaign/academy',('agreement.bpi_cooperation',)),
('open_compatibility','Open compatibility and independent manufacturers','Develop documented implementation, conformance and support arrangements without treating invitations as signed commitments.',['actor.dri','actor.logix'],'campaigns.json','/ncc_1979_campaign/governance',('agreement.dri_cpm','agreement.apple_cooperation')),
('aionix','AIONix development and portability','Develop AIONix under the separately agreed ownership and later non-ERA porting rights.',['actor.aion','actor.dri'],'contracts.json','/event.aionix_agreement',('agreement.aionix',)),
('smc_transfer','SMC second-source transfer','Transfer manufacturing knowledge and qualify independent chip sales individually.',['actor.labs','actor.logix','actor.smc'],'sourcing.json','/supplier_programs/0',('agreement.smc',)),
('sgs_transfer','SGS second-source transfer','Audit, transfer, pilot and qualify the agreed chip portfolio; preserve fallback AION supply.',['actor.labs','actor.sgs'],'timeline-structure.json','/processes/10',('agreement.sgs_transfer',)),
('clone_partnerships','International clone preparation and launch','Coordinate five independent manufacturers, localisation, service readiness and the January 1982 launch.',['actor.logix','actor.aion'],'timeline-structure.json','/processes/8',tuple('agreement.clone_agreement_'+x for x in ['northstar','vector','sks','goupil','eina'])),
('team_development','Team Edition engineering and qualification','Develop and qualify the team environment; retail deployment and Autodesk sponsorship remain separate.',['actor.aion','actor.logix'],'programmes.json','/team_development_program',()),
('autodesk_development','Autodesk sponsored development',AUT['objective'],['actor.adam','actor.logix','actor.aion','actor.labs'],'programmes.json',AP,('agreement.autodesk_development',)),
('athena_1983','ERA² and Athena programme','Develop and qualify the planned NCC 1983 platform; a premiere is not proof of volume shipment.',['actor.logix','actor.labs','actor.aion'],'programmes.json','/athena_1983_program',()),
('aurelia_memory','Aurelia+ memory integration','Complete shared development and integration qualification for the Aurelia+ memory scenario.',['actor.labs','actor.logix'],'programmes.json','/aurelia_plus_aion_memory',()),
('bpi_launch','BPI launch qualification, training and dealer programme','Prepare independently licensed BPI applications, qualification, support and training.',['actor.bpi','actor.academy','actor.logix'],'campaigns.json','/aurelia_1978_campaign/business_sessions',('agreement.bpi_cooperation',)),
('tandy_cooperation','Model II software and interface cooperation','Prepare native-display CP/M, Abacus and a qualified Model-II-specific FlexiBUS option.',['actor.tandy','actor.dri','actor.aion','actor.logix'],'events.json',f"/events/{EI['event.tandy_agreement']}",('agreement.tandy',))]
for key,title,objective,sponsors,f,p,ags in PROGRAMMES:
 r=programme(key,title,objective,sponsors,f,p,ags)
 # Do not claim a whole mixed section as fully migrated merely because its programme is extracted.
 append_mapping(f,p,[r['id']],'Programme identity and narrative objective extracted. More specific deferred mappings below retain out-of-scope financial/technical fields.')

# Processes preserve each substantive child, and events carry related process references.
P_PROGRAM={'clone_product_preparation':'clone_partnerships','clone_localisation':'clone_partnerships','clone_channel_readiness':'clone_partnerships','clone_launch_campaign':'clone_partnerships','sgs_transfer':'sgs_transfer','era2_development':'athena_1983','athena_integration':'athena_1983','artemis_engineering':'organisation_buildout','apple_compatibility':'open_compatibility'}
def migrate_process(x,p,parent=None):
 key=x['id'].split('.',1)[1];steps=[{'label':f'Action {i+1}','description':a['description']} for i,a in enumerate(x.get('actions',[]))]
 if x.get('period'):steps.append({'label':'Legacy timing qualification','description':'; '.join(text_lines({k:v for k,v in x['period'].items() if k not in ['start','end']})) or 'Legacy timing'})
 if x.get('outcomes'):steps += [{'label':f'Legacy outcome {i+1}','description':a['description']} for i,a in enumerate(x['outcomes'])]
 r=add('process',x['id'],{'title':x['title'],'kind':'study' if 'harvard' in key or key=='economics_studies' else 'transfer' if 'transfer' in key else 'development','completion_state':'planned','participant':participant(x.get('participants',[])),'step':steps},'timeline-structure.json',p)
 period=interval(x.get('period',{}))
 if period:r['period']=period
 else:issue(key+'_timing','Process timing is relative or unspecified','The approved schema permits omission of a process period, but cannot encode this relative window as a date. Original qualifier retained in step; no exact boundary fabricated.',[r['id']],'timeline-structure.json',p+'/period')
 if parent:r['parent_process_id']=parent
 if key in P_PROGRAM:r['programme_id']='programme.'+P_PROGRAM[key]
 for eid in x.get('related_event_refs',[]):
  if eid in D['event']:D['event'][eid].setdefault('process_ids',[]).append(r['id'])
 mapping('timeline-structure.json',p,[r['id']],legacy=x['id'])
 for k in ['product_refs','phase_refs']:
  if x.get(k):mapping('timeline-structure.json',p+'/'+k,(), 'deferred','Product references deferred; narrative bands are navigation context, not process dates.')
 for i,child in enumerate(x.get('subprocesses',[])):migrate_process(child,p+f'/subprocesses/{i}',r['id'])
for i,x in enumerate(T['processes']):migrate_process(x,f'/processes/{i}')
issue('harvard_source','Missing Harvard date citation','HARVARD_ACADEMIC_DATES.md is referenced but absent from the pinned repository root. First two academic-year opening dates are explicitly provisional. Existing exact-looking dates retain inferred basis and require review.',['process.economics_studies','process.harvard_year_1','process.harvard_year_2'],'timeline-structure.json','/processes/0',kind='missing_source')

# Programmes' granular detail extraction, with costs and product specifications explicitly deferred.
def programme_detail(pid,f,p,label=None,gate=False):
 r=D['programme']['programme.'+pid];v=source_value(f,p)
 field='acceptance_gate' if gate else 'deliverable'
 for line in text_lines(v,label or p.split('/')[-1].replace('_',' ')):r[field].append({'description':line})
 cite(r,f,p);append_mapping(f,p,[r['id']],'Programme requirement or qualification detail; no achieved result or cost approval inferred.')
for k in ['objective','sponsor','team_environment','acceptance','funding','historical_distinction','professional_hardware_revision']:
 programme_detail('autodesk_development','programmes.json',AP+'/'+k,gate=k=='acceptance')
for k in ['agreement_date','date_basis','commercial_terms','financial_boundary','historical_sources','product_refs','comdex_offering_ref']:
 if (('programmes.json',AP+'/'+k) not in MAP):mapping('programmes.json',AP+'/'+k,(), 'deferred' if k in ['financial_boundary','product_refs','comdex_offering_ref'] else 'excluded','Specific dates/rights retained in agreement/event sources; finance and product relations require later phases.')
for k in S['programmes.json']['team_development_program']:
 p='/team_development_program/'+k
 if k=='autodesk_sponsored_deployment':continue
 if k in ['title','date_basis']:programme_detail('team_development','programmes.json',p)
 else:mapping('programmes.json',p,(), 'deferred','Phase 5 financial allowances/pricing or historical calculation status; not programme execution evidence.')
for k in S['programmes.json']['athena_1983_program']:
 p='/athena_1983_program/'+k
 if k in ['status','open_decisions','launch']:programme_detail('athena_1983','programmes.json',p,gate=k=='open_decisions')
 else:mapping('programmes.json',p,(), 'deferred','Phase 2/3 specification and BOM; not an additional phase-1 event.')
for k in S['programmes.json']['aurelia_plus_aion_memory']:
 p='/aurelia_plus_aion_memory/'+k
 if k in ['development','status']:programme_detail('aurelia_memory','programmes.json',p)
 else:mapping('programmes.json',p,(), 'deferred','Phase 2/3/5 technical/capacity parameters, not confirmed production history.')
for k in ['rights','transfer_deliverables','qualification_status','unqualified_values']:
 if k in S['sourcing.json']['supplier_programs'][0]:programme_detail('smc_transfer','sourcing.json','/supplier_programs/0/'+k,gate='qualif' in k)
for k in S['sourcing.json']['supplier_programs'][0]:
 if ('sourcing.json','/supplier_programs/0/'+k) not in MAP:mapping('sourcing.json','/supplier_programs/0/'+k,(), 'deferred','Supplier identifier/part linkage and technical details retained for phase 2/3; milestone corroboration below.')
# Add policy narrative from precise technical-side fields, keeping real technical payload deferred.
POLICIES=[('software-editions.json','/software_editions/7/forward_compatibility_commitment'),('software-editions.json','/software_editions/10/development_lineage'),('software-editions.json','/software_editions/10/ecosystem_policy'),('software-editions.json','/software_editions/25/compatibility_policy'),('devices.json','/devices/39/lifecycle_policy'),('services.json','/services/10/openness_policy'),('services.json','/services/13/commercial_policy'),('services.json','/services/14/commercial_policy'),('programmes.json','/product_strategy/software_platform_policy_from_november_1980'),('demand-inputs.json','/market_reactions/date_policy')]
for i,(f,p) in enumerate(POLICIES):
 try:v=source_value(f,p)
 except KeyError:continue
 r=add('assumption','source_policy_'+str(i+1),{'kind':'policy','statement':'\n'.join(text_lines(v))},f,p);mapping(f,p,[r['id']],reason='Narrative policy recovered from a technical-side collection; technical specification remains deferred.')
for j in [4,5,6,7,9]:
 r=S['services.json']['services'][j]
 for k in ['courses','completion','launch_program','delivery','description','availability_note']:
  if k in r:programme_detail('academy' if j!=9 else 'bpi_launch','services.json',f'/services/{j}/'+k)
# Existing Autodesk/BPI side records corroborate, rather than duplicate, agreement terms.
for aid,cid,f,p in [
('agreement.autodesk_development','clause.autodesk_development_rights','software-editions.json','/software_editions/31/specification/ownership'),
('agreement.autodesk_development','clause.autodesk_development_delivery','software-editions.json','/software_editions/31/specification/release_target'),
('agreement.autodesk_development','clause.autodesk_development_deployment_support','software-editions.json','/software_editions/26/specification/sponsored_deployment')]:
 cite(D['clause'][cid],f,p);mapping(f,p,[cid],disposition='merged',reason='Corroborating fragment joined to its canonical clause, not a duplicate agreement.')

# Campaigns retain owned creative details; numeric budgets, product definitions and forecast effects stay deferred.
CAMP=S['campaigns.json'];COST_KEYS={'cost_boundary','economics','budget','budget_rows','financial_boundary','budget_subtotal_usd','contingency_rate','contingency_usd','budget_total_usd','cost_snapshot','commercial_configurations','packages','office_configuration','artemis_configuration_policy','offering_ref','offering_refs'}
MESSAGE_KEYS={'positioning','messages','headline','subheadline','hands_on_invitation','campaign_message','campaign_promise','call_to_action'}
POLICY_KEYS={'acceptance_gates','claim_policy','claim_limits','claim_controls','disclosure_policy','disclosure','governance','compatibility_policy','claims','launch_gates','partner_policy','commercial_policy','strategy','software_update_policy','autodesk_claim','status','availability','financial_boundary','evidence','targets','manufacturer_assessment','eight_bit_outlook'}
for key,x in CAMP.items():
 if not isinstance(x,dict):continue
 cid=x['id'];f='campaigns.json';p='/'+key;title=x.get('title',x.get('metadata',{}).get('title',x.get('headline',key.replace('_',' '))))
 main=x.get('main_launch_event_ref');leader=['actor.logix']
 if cid=='campaign.comdex1982':leader.append('actor.autodesk')
 r=add('campaign',cid,{'title':title,'objective':x.get('headline',x.get('campaign_promise','Communicate the launch, qualify demonstrations and coordinate follow-up described by the source campaign.')),'lead_actor_ids':leader,'audience':[],'message':[],'activity':[],'claim_policy':[]},f,p)
 if main in D['event']:r['launch_event_id']=main
 mapping(f,p,[cid],legacy=cid)
 for field,v in x.items():
  fp=p+'/'+field
  if field in COST_KEYS:mapping(f,fp,(), 'deferred','Phase 2 offering/composition or phase 5 cost/budget ownership; no numeric model copied into campaign narrative.');continue
  if field in ['id','title']:continue
  if field=='metadata':
   r['claim_policy']+=text_lines({k:a for k,a in v.items() if k=='status'},'Legacy acceptance wording (not new confirmation)')
   mapping(f,fp,(),reason='Legacy document metadata; status wording is retained only as review context, not author confirmation.');continue
  if field in ['event_refs','main_launch_event_ref','launch_date']:
   for eid in ([v] if field=='main_launch_event_ref' else v if field=='event_refs' else []):
    if eid in D['event'] and not any(a.get('event_id')==eid for a in r['activity']):r['activity'].append({'event_id':eid,'description':D['event'][eid]['title']})
   if field=='launch_date' and main in D['event']:
    ev=D['event'][main];date=ev.get('time',ev.get('period',{}).get('start',{})).get('value')
    if date!=v:issue(slug(cid)+'_date','Campaign and event dates differ',f'Campaign date {v}; event date {date}. Retain both source statements for author reconciliation.',[cid,main],f,fp,kind='conflict',candidates=[(str(v),f,fp),(str(date),'events.json',f'/events/{EI[main]}/date')])
   continue
  if field in MESSAGE_KEYS:r['message']+=text_lines(v,field.replace('_',' '));continue
  if field in POLICY_KEYS:r['claim_policy']+=text_lines(v,field.replace('_',' '));continue
  if field in ['primary_audiences','secondary_audiences']:r['audience']+=text_lines(v,field);continue
  if field=='schedule' and isinstance(v,list):
   for i,row in enumerate(v):
    desc='; '.join(text_lines({k:a for k,a in row.items() if k!='event_ref'}))
    item={'description':desc}
    if row.get('event_ref') in D['event']:item['event_id']=row['event_ref'];cite(D['event'][row['event_ref']],f,fp+'/'+str(i))
    r['activity'].append(item)
   continue
  if field=='mono_pro_campaign':
   r['activity'] += [{'description':line} for line in text_lines({k:a for k,a in v.items() if k=='scope'},'Mono Pro campaign')]
   mapping(f,fp,(), 'deferred','Phase-5 marketing provision and demand-uplift coefficients; campaign scope extracted below.')
   mapping(f,fp+'/scope',[cid]);continue
  # Rich owned creative content rendered as labelled details; no opaque serialized JSON payload.
  r['activity'] += [{'description':line} for line in text_lines(v,field.replace('_',' '))]
 # Small legacy shells carry no marketing objectives beyond their event; make that visible.
 if len(x)<=5:issue(slug(cid)+'_scope','Campaign detail is minimal','Legacy campaign is only an identity/launch wrapper. No audience, creative content or outcome is invented; expand if this campaign needs full narrative definition.',[cid],f,p)

# Reconstruct campaign processes that have dates/windows but no independent legacy records.
def new_process(key,title,f,p,participants,programme_id=None,start=None,end=None,events=()):
 v=source_value(f,p);r=add('process',key,{'title':title,'kind':'preparation','completion_state':'planned','participant':[{'actor_id':a,'role':'programme participant'} for a in participants],'step':[{'label':'Source detail '+str(i+1),'description':s} for i,s in enumerate(text_lines(v))]},f,p)
 if start and end:r['period']={'start':point(start), 'end':point(end)}
 if programme_id:r['programme_id']='programme.'+programme_id
 for eid in events:
  if eid in D['event']:D['event'][eid].setdefault('process_ids',[]).append(r['id'])
 append_mapping(f,p,[r['id']],'Sustained activity recovered from an indirect mention; precision retained and completion not inferred.')
 return r
NEW_PROCS=[
('ncc1980_preparation','NCC 1980 partner qualification and launch preparation','campaigns.json','/ncc_1980_campaign/activities/0',['actor.logix','actor.aion'],None,None,None,()),
('ncc1980_followup','NCC 1980 dealer and Academy follow-up','campaigns.json','/ncc_1980_campaign/activities/2',['actor.logix','actor.academy'],None,'1980-05','1980-06',()),
('ncc1980_roadshows','1980 regional roadshows and certification workshops','campaigns.json','/ncc_1980_campaign/activities/3',['actor.logix','actor.academy'],'open_compatibility','1980-07','1980-10',()),
('comdex1979_preparation','COMDEX 1979 dealer rehearsal and qualification','campaigns.json','/comdex_1979_campaign/activities/0',['actor.logix','actor.bpi'],None,'1979-10','1979-11',()),
('comdex1979_followup','COMDEX 1979 dealer and Academy follow-up','campaigns.json','/comdex_1979_campaign/activities/3',['actor.logix','actor.academy'],None,'1979-12','1980-01',()),
('compatibility1980_workshops','Manufacturer porting workshops','campaigns.json','/comdex_1979_campaign/activities/4',['actor.logix','actor.dri'],'open_compatibility','1980-01','1980-03',()),
('autodesk_development','Autodesk funded development and acceptance','programmes.json',AP,['actor.autodesk','actor.aion','actor.logix'],'autodesk_development','1982-01','1982-11',('event.autodesk_agreement','event.autodesk_professional_handover','event.autodesk_beta','event.autodesk_comdex')),
('smc_transfer','SMC engineering transfer and first-sale qualification','sourcing.json','/supplier_programs/0',['actor.labs','actor.smc','actor.logix'],'smc_transfer','1978-07','1979-10',('event.smc_agreement','event.smc_sales')),
('bpi_qualification','BPI pilot and launch qualification','events.json',f"/events/{EI['event.bpi_qualification']}",['actor.bpi','actor.aion'],'bpi_launch','1978-03','1978-06',('event.bpi_pilot','event.bpi_qualification','event.bpi_launch')),
('aionix_development','AIONix exploratory and formal development','events.json',f"/events/{EI['event.aionix_preliminary']}",['actor.aion','actor.dri'],'aionix',None,None,('event.aionix_preliminary','event.aionix_agreement','event.artemis_launch')),
('team_development','Team Edition implementation and qualification','events.json',f"/events/{EI['event.team_engineering']}",['actor.aion','actor.logix'],'team_development','1980-12','1981-11',('event.team_engineering','event.team_pilots','event.team_launch'))]
for spec in NEW_PROCS:
 r=new_process(*spec)
 if spec[2]=='campaigns.json':
  cid=CAMP[spec[3].split('/')[1]]['id'];D['campaign'][cid]['activity'].append({'description':r['title'],'process_id':r['id']})
 if r['id'] in ['process.autodesk_development','process.bpi_qualification','process.team_development']:
  # The programme interval is a proposed synthesis of milestones, not an exact assertion from one fragment.
  issue(r['id'].split('.',1)[1]+'_interval','Reconstructed programme interval','Month-precision interval groups source milestones; review as an inferred planning window, not a newly verified start/completion date.',[r['id']],spec[2],spec[3],kind='indirect_mention')
  for endpoint in r.get('period',{}).values():endpoint['basis']='inferred'
# Preserve the narrower source coverage decisions overwritten when deriving processes from mixed sections.
for k in ['part_refs','unqualified_values']:
 if k in S['sourcing.json']['supplier_programs'][0]:mapping('sourcing.json','/supplier_programs/0/'+k,(), 'deferred','Part identities/technical qualification values: phases 2/3.')
# Broader process descriptions must not embed a full mixed programme as JSON/prose duplication.
D['process']['process.autodesk_development']['step']=[{'label':'Delivery objective','description':AUT['objective']},{'label':'Qualification','description':'Meet programme acceptance gates; commercial shipment remains conditional on acceptance.'}]
D['process']['process.smc_transfer']['step']=[{'label':'Manufacturing transfer','description':v} for v in S['sourcing.json']['supplier_programs'][0].get('transfer_deliverables',[])]+[{'label':'Qualification','description':S['sourcing.json']['supplier_programs'][0]['qualification_status']}]
# Campaign implied by the clone process, not present in campaigns.json.
CP=T['processes'][12]
r=add('campaign','clone_january1982',{'title':CP['title'],'objective':'Your local computer. A shared software future.','lead_actor_ids':['actor.logix','actor.aion'],'programme_id':'programme.clone_partnerships','launch_event_id':'event.clone_january_launch','message':[a['description'] for a in CP['actions']],'activity':[{'description':D['event'][e]['title'],'event_id':e} for e in ['event.clone_campaign_preview','event.clone_january_launch','event.clone_campaign_roadshows','event.clone_90day_review']]+[{'description':CP['title'],'process_id':'process.clone_launch_campaign'}],'claim_policy':['No automatic campaign uplift, shipment count or simultaneous SGS qualification is inferred.']},'timeline-structure.json','/processes/12')
append_mapping('timeline-structure.json','/processes/12',[r['id']],'Campaign identity reconstructed from explicit promotional process and linked events.')
# Post-NCC broadcast distribution has a relative start, not a fabricated calendar day.
r=new_process('ncc1978_broadcast','Post-NCC 1978 recording, editing and television distribution','campaigns.json','/aurelia_1978_campaign/broadcast_program',['actor.logix'],None,None,None,('event.ncc78_sessions_media',))
D['campaign']['campaign.ncc1978']['activity'].append({'description':r['title'],'process_id':r['id']})

# Recover an indirect dated meeting, without adding a time-jump ledger.
r=add('event','autodesk_organising_meeting',{'kind':'activity','title':'Autodesk founders organising meeting','occurrence':'occurred','time':point('1982-01-30',basis='inferred',qualifier='Legacy note calls this a historical meeting; external citation not independently verified.'),'participant':[],'action':[{'description':'Founders organising meeting referenced by the January 31 agreement date basis. Attendees are not identified by that source.'}],'conditions':['Recovered indirect mention; historical occurrence and participant identities need author review.']},'programmes.json',AP+'/date_basis')
append_mapping('programmes.json',AP+'/date_basis',[r['id']],'Distinct organising meeting recovered from the agreement date basis; not confused with January 31 signing.')

# Relationships have only roles explicitly supported by source text; no invented employer or legal control.
REL=[
('adam_identity','identity_assumption',['actor.adam'],'actor.original_adam','Vincent operates under the original Adam Pleskot identity.','event.identity','events.json',f"/events/{EI['event.identity']}"),
('kildall_dri','operating_role',['actor.kildall'],'actor.dri','Gary leads CP/M engineering. Ownership rights remain in the agreement clauses.','event.dri_founding','events.json',f"/events/{EI['event.dri_founding']}/actions/0"),
('dorothy_dri','operating_role',['actor.dorothy'],'actor.dri','Dorothy leads operations; no individual share of the joint 60% allocation is invented.','event.dri_founding','events.json',f"/events/{EI['event.dri_founding']}/actions/0"),
('adam_dri','operating_role',['actor.adam'],'actor.dri','Adam supplies capital, strategy and OEM relationships; equity remains a separately reviewable clause.','event.dri_founding','events.json',f"/events/{EI['event.dri_founding']}/actions/0"),
('adam_harvard','affiliation',['actor.adam'],'actor.harvard','Economics student in the source study process.',None,'timeline-structure.json','/processes/0'),
('letwin_recruitment','affiliation',['actor.letwin'],'actor.adam','Adam recruits Gordon Letwin; this does not infer an unstated legal employer.','event.letwin','events.json',f"/events/{EI['event.letwin']}"),
('paterson_recruitment','affiliation',['actor.paterson'],'actor.adam','Adam recruits Tim Paterson; this does not infer an unstated legal employer.','event.paterson','events.json',f"/events/{EI['event.paterson']}")]
for key,kind,subjects,object_,desc,eid,f,p in REL:
 fields={'kind':kind,'subject_actor_ids':subjects,'object_actor_id':object_,'description':desc}
 if eid:fields['established_by_event_id']=eid
 r=add('actor_relationship',key,fields,f,p);append_mapping(f,p,[r['id']],'Actor role/affiliation recovered; agreement-owned equity is not duplicated.')

# Places explicitly named in narrative. Parent geography is documented as an inference, not an actor fact.
PLACES=[
('uk','United Kingdom','country',None,'world.json','/entities/3'),('us','United States','country',None,'world.json','/entities/2'),('denmark','Denmark','country',None,'events.json',f"/events/{EI['event.companies']}"),
('san_jose','San Jose','city','us','events.json',f"/events/{EI['event.companies']}"),('cambridge','Cambridge','city','uk','world.json','/entities/3'),('copenhagen','Copenhagen','city','denmark','events.json',f"/events/{EI['event.companies']}"),
('anaheim','Anaheim, California','city','us','programmes.json','/athena_1983_program/launch/location'),('houston','Houston, Texas','city','us','campaigns.json','/ncc_1982_campaign/conference/venue'),('astrodomain','Astrodomain','venue','houston','campaigns.json','/ncc_1982_campaign/conference/venue'),('las_vegas','Las Vegas','city','us','campaigns.json','/comdex_1982_campaign/location'),('secret_facility','Secret future-equipped facility','facility',None,'world.json','/principles/4')]
for key,name,kind,parent,f,p in PLACES:
 fields={'name':name,'kind':kind,'description':'Named narrative location; no coordinates, property ownership or production capacity inferred.'}
 if parent:fields['parent_location_id']='location.'+parent;fields['description']+=' Geographic parent is a migration inference subject to review.'
 if key=='denmark':fields['description']='Country inferred from Copenhagen; not an independently sourced historical event.'
 r=add('location',key,fields,f,p);append_mapping(f,p,[r['id']],'Reusable place extracted from a narrative mention; geographic parent explicitly qualified.')
for eid,locs in {'event.companies':['san_jose','cambridge','copenhagen'],'event.facility':['secret_facility'],'event.aurelia_launch':['anaheim'],'event.ncc82_graphics_mouse':['astrodomain'],'event.autodesk_comdex':['las_vegas'],'event.ncc83_athena_premiere':['anaheim']}.items():D['event'][eid]['location_ids']=['location.'+l for l in locs]

# Corroborate introduction dates across technical collections; do not create hundreds of duplicate launches.
DATE_EVENT={'1978-06-05':'event.aurelia_launch','1979-06-04':'event.ncc79_campaign','1979-12-03':'event.plus_launch','1980-05-19':'event.artemis_launch','1980-11-19':'event.software32','1981-05-04':'event.network_launch','1981-11-19':'event.team_launch','1982-06-07':'event.ncc82_graphics_mouse','1982-11-29':'event.autodesk_comdex','1983-05-16':'event.ncc83_athena_premiere','1979-05-30':'event.tandy_announcement','1979-10-15':'event.tandy_release','1978-03-25':'event.academy','1978-06-12':'event.bpi_training'}
intro_unresolved=[]
for f in ['components.json','devices.json','software-editions.json','services.json','standards.json','ecosystem-inputs.json']:
 def inspect(v,p=''):
  if isinstance(v,dict):
   if isinstance(v.get('introduced'),dict):
    intro=v['introduced'];date=intro.get('event_start_date');eid=DATE_EVENT.get(date);ip=p+'/introduced'
    if v.get('id')=='software.microsoft_basic_aurelia':eid='event.basic_launch'
    if v.get('id')=='software.bpi_suite':eid='event.bpi_launch'
    if eid:
     cite(D['event'][eid],f,ip,'Corroborates a shared introduction window only; does not assert per-product shipment or qualification.')
     mapping(f,ip,[eid],disposition='merged',reason='Shared introduction-window evidence linked to existing milestone; not a duplicate product release.')
    else:intro_unresolved.append((f,ip,intro))
   for k,x in v.items():inspect(x,p+'/'+ptr(k))
  elif isinstance(v,list):
   for i,x in enumerate(v):inspect(x,p+'/'+str(i))
 inspect(S[f])
for f,p,intro in intro_unresolved:
 # Technical introductions with no named matching story event stay explicit later-phase tasks.
 mapping(f,p,(), 'deferred','Technical introduction with no safely matched phase-1 milestone; reconcile in phase 2 rather than invent a launch. '+str(intro.get('event_name',''))+' / '+str(intro.get('event_start_date','')))
# Record references/URLs from every input, including technical source documents, without fetching their content.
urls={}
for f,v in S.items():
 for p,x in leaves(v):
  if isinstance(x,str) and re.match(r'^https?://\S+$',x):urls.setdefault(x,[]).append(sr(f,p))
for url,refs_ in sorted(urls.items()):
 id='source.external_'+hashlib.sha256(url.encode()).hexdigest()[:12]
 D['source'][id]={'id':id,'status':'pending confirmation','source_refs':refs_,'kind':'historical_document','title':'External citation recorded by legacy data','url':url,'citation':'URL found in source JSON. Not independently retrieved or verified during this structural migration; does not confirm the alternative story.'}

# Reconciliation findings: represent ambiguity rather than silently inventing a corrected history.
issue('bpi_offer_not_closing','BPI proposed ownership is not a closed investment','Preserve the $150,000/33% offer separately from March operational cooperation. The source explicitly says no final ownership closing is asserted. Do not resolve independent operations as independent ownership.',['agreement.bpi_offer','agreement.bpi_cooperation'],'events.json',f"/events/{EI['event.bpi_cooperation']}",kind='classification',extra=[sr('contracts.json','/event.bpi_offer')])
issue('academy_service_start','Academy formation versus service availability','March 25 is the Academy formation date. Service records use it as introduction while the event says city names and first course dates are unspecified. Preserve formation; do not silently claim all courses started that day.',['programme.academy','event.academy'],'services.json','/services/4/introduced',kind='conflict',candidates=[('Service introduction: 1978-03-25','services.json','/services/4/introduced'),('First course dates and city names remain unspecified','events.json',f"/events/{EI['event.academy']}/actions/0")])
issue('dri_paid_in','DRI capital commitment versus payment evidence','Contract promises formation and installment funding; investment input labels the initial amount paid-in. Phase 1 preserves the commitment. A realised payment event needs explicit evidence/approval; no new payment date is invented.',['agreement.dri_founding','clause.dri_capital'],'investment-inputs.json','/manufacturing_programs/dri_founding',kind='conflict',candidates=[('Commitment: $150,000 at formation; $100,000 installments','contracts.json','/event.dri_founding/4'),('initial_paid_in_usd: 150000','investment-inputs.json','/manufacturing_programs/dri_founding/initial_paid_in_usd')])
issue('aion_tech_ownership','Aion Tech ownership and financing unspecified','UK distribution and service preparation exist in the narrative; neither ownership nor consolidation is established. Do not assign a parent company or include its revenue automatically.',['actor.aion_tech_uk','event.aion_tech_uk_setup'],'world.json','/entities/28')
issue('sgs_terms','SGS targets and negotiable economics','The transfer framework does not establish a final royalty rate, complete portfolio qualification, or realised 25–35% sourcing share. Individual clauses retain proposal/target semantics. Costed budgets and production measurements belong to later phases.',['agreement.sgs_transfer','programme.sgs_transfer'],'contracts.json','/event.sgs_transfer_agreement')
issue('bpi_investment_wording','BPI investment wording versus unclosed proposal','Software specification describes Adam investment without a qualification; the cooperation event explicitly leaves the earlier investment offer unclosed. Preserve source statements and require author reconciliation before treating equity as acquired.',['agreement.bpi_offer','agreement.bpi_cooperation','clause.bpi_cooperation_support'],'software-editions.json','/software_editions/13/specification/company_and_support',kind='conflict',candidates=[(S['software-editions.json']['software_editions'][13]['specification']['company_and_support'],'software-editions.json','/software_editions/13/specification/company_and_support'),(BPI['actions'][0]['description'],'events.json',f"/events/{EI['event.bpi_cooperation']}/actions/0")])
issue('capacity_reserve','Different capacity headroom assumptions','Source programmes use 10% installed good-output reserve while later demand planning uses 5% commercial headroom plus separate protections. These may be different measures, not a proven contradiction. Defer numerical reconciliation to phases 3/5; do not combine percentages or alter history.',['programme.aurelia_memory','event.capacity_orders_1982'],'programmes.json','/aurelia_plus_aion_memory/capacity',extra=[sr('events.json',f"/events/{EI['event.capacity_orders_1982']}")])
issue('forecast_adoption','Legacy forecast narrative needs explicit adoption','Market-response and financial-checkpoint events retain speculation status. They are available for author review but do not become baseline facts merely because they were written into the old timeline.',['event.ibm_alternative_launch','event.financial_review_1982','assumption.market_expansion'],'events.json',f"/events/{EI['event.ibm_alternative_launch']}")
issue('campaign_prep_dates','Aurelia preview window exceeds event month','Campaign schedule says late May to early June, while the single preparation event has May-only precision. Keep the original milestone and the wider campaign window; decide whether this should be a separate process rather than silently shifting dates.',['campaign.ncc1978','event.aurelia_campaign_preparation'],'campaigns.json','/aurelia_1978_campaign/schedule/2',kind='conflict',candidates=[('Late May to early June 1978','campaigns.json','/aurelia_1978_campaign/schedule/2/period'),('1978-05 milestone','events.json',f"/events/{EI['event.aurelia_campaign_preparation']}/date")])
# Agreement terms concerning rights are canonical in clauses; no duplicate equity relationship rows.
# Phase-specific technical reference extraction is intentionally delayed; all missing targets remain source mappings.



# Cross-file corroboration and additional narrative fragments outside the principal collections.
for f,p,eid in [
 ('sourcing.json','/supplier_programs/0/agreement_date','event.smc_agreement'),
 ('sourcing.json','/supplier_programs/0/initial_sales_date','event.smc_sales'),
 ('programmes.json','/manufacturing_programs/smc_transfer/agreement_date','event.smc_agreement'),
 ('programmes.json','/manufacturing_programs/smc_transfer/initial_sales_date','event.smc_sales')]:
 cite(D['event'][eid],f,p);mapping(f,p,[eid],'merged','Independent collection corroborates the existing month-precision milestone.')
for f,p,cid in [
 ('programmes.json','/product_strategy/aurelia_1978_campaign','campaign.ncc1978'),
 ('programmes.json','/product_strategy/ncc_1982','campaign.ncc1982'),
 ('programmes.json','/product_strategy/ncc_1982_offering','campaign.ncc1982'),
 ('programmes.json','/product_strategy/comdex_1982','campaign.comdex1982')]:
 v=source_value(f,p)
 for k,x in v.items():
  if k in ['tagline','broadcast_policy','headline','availability','positioning']:
   D['campaign'][cid]['message' if k in ['tagline','headline','positioning'] else 'claim_policy']+=text_lines(x,k.replace('_',' '));cite(D['campaign'][cid],f,p+'/'+k);mapping(f,p+'/'+k,[cid],'merged','Corroborating campaign narrative joined to its canonical campaign.')
for k in ['qualification_gates']:
 if k in S['sourcing.json']['supplier_programs'][0]:programme_detail('smc_transfer','sourcing.json','/supplier_programs/0/'+k,gate=True)
for i,product in enumerate(S['product-catalog.json']['products']):
 cid=product.get('launch_campaign_ref')
 if cid in D['campaign']:
  p=f'/products/{i}/launch_campaign_ref';cite(D['campaign'][cid],'product-catalog.json',p,'Product-to-campaign association retained as provenance until phase-2 product entities exist.');mapping('product-catalog.json',p,[cid],'merged','Existing launch-campaign identity corroborated; product definition remains deferred.')
# Recover a department relocation process without fabricating an actual move date.
r=new_process('aionix_relocation','AIONix department relocation','contracts.json','/event.aionix_agreement/6',['actor.aion'],'aionix')
D['event']['event.aionix_agreement'].setdefault('process_ids',[]).append(r['id'])
issue('aionix_relocation_date','Department relocation date unspecified','The agreement mentions moving the department from Copenhagen near DRI headquarters, but does not establish a completed move or dated relocation event. Represented as a planned process; no fabricated occurrence date.',[r['id'],'agreement.aionix'],'contracts.json','/event.aionix_agreement/6',kind='indirect_mention')
# Narrative-band kind/display are presentation aids, not missing story fields.
for i,band in enumerate(T['phases']):
 if 'kind' in band:mapping('timeline-structure.json',f'/phases/{i}/kind',(),reason='Legacy navigation category; narrative band identity, order and dates retained.')
 if 'display' in band.get('period',{}):mapping('timeline-structure.json',f'/phases/{i}/period/display',(),reason='Derived date label; structured date precision retained.')


# Party-specific commitments occur in agreement-event actions as well as in contracts.json.
for key in ['northstar','vector','sks','goupil','eina']:
 eid='event.clone_agreement_'+key;aid='agreement.clone_agreement_'+key;event=E[EI[eid]]
 r=add('clause','clone_'+key+'_initial_scope',{'agreement_id':aid,'kind':'term','statement':' '.join(x['description'] for x in event['actions']),'assertion_mode':'target','actor_ids':actor_ids([x['actor_ref'] for x in event['participants']])},'events.json',f'/events/{EI[eid]}/actions')
 append_mapping('events.json',f'/events/{EI[eid]}/actions',[r['id']],'Partner-specific initial range and preparations extracted from the agreement event; target is not a shipment or sales commitment.')
for eid,aid,key in [('event.tandy_agreement','agreement.tandy','tandy_delivery_scope'),('event.bpi_training','agreement.bpi_cooperation','bpi_training_responsibilities')]:
 event=E[EI[eid]];r=add('clause',key,{'agreement_id':aid,'kind':'responsibility','statement':' '.join(x['description'] for x in event['actions']),'assertion_mode':'commitment','actor_ids':actor_ids([x['actor_ref'] for x in event['participants']])},'events.json',f'/events/{EI[eid]}/actions')
 append_mapping('events.json',f'/events/{EI[eid]}/actions',[r['id']],'Responsibility/acceptance scope recovered from an indirect agreement mention; dates stay on the event.')

# Actor identity does not duplicate agreement ownership, employment or dated history.
ACTOR_DESCRIPTION_TARGETS={
'adam':['assumption.identity'], 'original_adam':['event.identity'],
'logix':['event.companies'], 'labs':['event.companies'], 'aion':['event.companies'],
'academy':['event.academy'], 'bpi':['agreement.bpi_cooperation','agreement.bpi_offer'],
'dri':['agreement.dri_founding','event.dri_founding'], 'microsoft':['event.basic_launch'],
'apple':['agreement.apple_cooperation'], 'ibm':['assumption.strategy'],
'peachtree':['agreement.apple_peachtree'], 'mpi':['agreement.mpi_oem'],
'computerland':['agreement.retail'], 'letwin':['event.letwin'], 'paterson':['event.paterson'],
'kildall':['event.dri_founding','agreement.aionix'], 'others':['assumption.market_monitoring'],
'dorothy':['event.dri_founding'], 'smc':['agreement.smc'], 'tandy':['agreement.tandy'],
'northstar':['agreement.clone_agreement_northstar'], 'vector':['agreement.clone_agreement_vector'],
'sks':['agreement.clone_agreement_sks'], 'goupil':['agreement.clone_agreement_goupil'],
'eina':['agreement.clone_agreement_eina'], 'sgs':['agreement.sgs_transfer'],
'aion_tech_uk':['event.aion_tech_uk_setup'], 'autodesk':['agreement.autodesk_development']}
for i,a in enumerate(W['entities']):
 key=a['id'].split('.',1)[1]
 if key not in ACTOR_DESCRIPTION_TARGETS:continue
 D['actor'][a['id']].pop('description',None)
 targets=ACTOR_DESCRIPTION_TARGETS[key]
 for target in targets:cite(D[target.split('.')[0]][target],'world.json',f'/entities/{i}/description','Legacy actor summary corroborates this canonical narrative record; not an additional independent assertion.')
 mapping('world.json',f'/entities/{i}/description',targets,'merged' if len(targets)==1 else 'split','Identity kept on actor; dated history/rights moved to the canonical event, premise or agreement.')

# Ensure schema reference arrays are unique and remove empty optional strings.
for name,records in D.items():
 for r in records.values():
  for k,v in list(r.items()):
   if k.endswith('_ids') and isinstance(v,list):r[k]=list(dict.fromkeys(v))
   if v=='':del r[k]
# Emit a compact mapping for every source classification. More-specific JSON Pointers override ancestors.
for (f,p),m in sorted(MAP.items()):
 key='source_'+hashlib.sha256((f+'#'+p).encode()).hexdigest()[:16]
 fields={'target_ids':m['targets'],'disposition':m['disposition'],'rationale':m['reason']}
 if m['legacy']:fields['legacy_id']=m['legacy']
 add('migration_map',key,fields,f,p)
# All provenance pointers are checked against the pinned source before writing.
for records in D.values():
 for r in records.values():
  for q in r.get('source_refs',[]):
   if q['source_id']==SID:source_value(q['path'].removeprefix('data/'),q['pointer'])
OUT.mkdir(parents=True)
for name,records in D.items():
 metadata={'description':f'Phase-1 migrated {name} records from vs_edu1 at {PIN}. Pending author review; speculation is not canon. Source coverage is documented in migration_map.','schema_version':'0.1.0','used_by_pages':['migration_'+name],'used_by_calculations':[]}
 (OUT/(name+'.json')).write_text(json.dumps({name:list(records.values()),'metadata':metadata},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({name:len(records) for name,records in D.items()},indent=2))
