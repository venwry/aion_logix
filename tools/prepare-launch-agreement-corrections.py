#!/usr/bin/env python3
"""Prepare requested product launch and agreement-signing reference corrections."""
import copy,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):
 path=ROOT/p;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
index={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(p.read_text()).values() for r in rows}
def element(after):return {'record_type':after['id'].split('.')[0],'record_id':after['id'],'before':copy.deepcopy(index[after['id']]),'after':after}
def launch(ids,event):
 result=[]
 for id in ids:
  r=copy.deepcopy(index[id]);old=r['launch_event_id'];r['launch_event_id']=event
  # The first commercial product definition starts at its own corrected launch.
  versions=r.get('composition_history',[])
  if versions and versions[0]['effective_from']=={'kind':'event','event_id':old}:versions[0]['effective_from']['event_id']=event
  result.append(element(r))
 return result
courses=['product.academy_course_'+str(i) for i in range(1,5)]
developers=['product.aurelia_sdk','product.service_aurelia_commercial_developer_license','product.proposed_aurelia_developer','product.simple_c_z80']
ps=[{'id':'change.academy_course_launch_event','category':'foundation','title':'Launch all four Academy courses at the June 16 Academy launch','reason':'Set the four named Academy course products’ launch_event_id to event.academy_launch (16 June 1978). Retain their campaign, course content, providers and other terms. The June 5 platform announcement remains distinct from these courses’ own launch.','elements':launch(courses,'event.academy_launch')}]
dev_elements=launch(developers,'event.aurelia_developer_presentation');event=copy.deepcopy(index['event.aurelia_developer_presentation']);event['kind']='launch';dev_elements.append(element(event))
ps.append({'id':'change.aurelia_developer_launch_event','category':'foundation','title':'Launch the Aurelia development offerings at the June 6 developer presentation','reason':'Move the four named development offerings to event.aurelia_developer_presentation (6 June 1978) and set that event’s kind to launch. Align the first commercial composition boundary of the three composed products with their corrected launch; quantities, targets, versions and technical implementation histories remain unchanged. The commercial developer licence has no composition history. The event and all four product links are reviewed together.','elements':dev_elements})
# Each retention is based on the event narrative, not merely its kind label.
keepers={
 'agreement.dri_founding':('event.dri_founding','Founders formalise and finance DRI under agreed founding terms.'),
 'agreement.dri_cpm':('event.dri_cpm','The three parties establish and commit to the development/licensing agreement.'),
 'agreement.bpi_offer':('event.bpi_offer','BPI accepts the investment and redevelopment agreement.'),
 'agreement.retail':('event.retail','The ComputerLand retail agreement is arranged at this milestone.'),
 'agreement.smc':('event.smc_agreement','The parties agree the second-source fabrication and transfer scope.'),
 'agreement.aionix':('event.aionix_agreement','Ownership, staffing and funding are formalised at this commitment event.'),
 'agreement.tandy':('event.tandy_agreement','The parties sign the Model II cooperation agreement.'),
 'agreement.apple_cooperation':('event.apple_cooperation','Apple accepts the limited technical cooperation agreement.'),
 'agreement.sgs_transfer':('event.sgs_transfer_agreement','The accepted transfer framework is executed at this agreement milestone.'),
 'agreement.mpi_oem':('event.mpi','The parties agree the printer-mechanism OEM terms.'),
 'agreement.autodesk_development':('event.autodesk_agreement','The narrative explicitly records Adam and John Walker signing the agreement.'),
 'agreement.comstock_appointment':('event.comstock_appointed','Comstock accepts the CEO appointment and equity commitment.'),
 'agreement.letwin_aion_appointment':('event.letwin','Letwin accepts the contractual appointment and equity grant.'),
 'agreement.cap_acquisition':('event.cap_acquisition_signed','Explicit signing event; the subsequent closing is a distinct execution event.')}
for suffix in ['northstar','vector','sks','goupil','eina']:keepers['agreement.clone_agreement_'+suffix]=('event.clone_agreement_'+suffix,'The named founding agreement is concluded at its dedicated agreement milestone.')
audit=[];removals=[]
for agreement in sorted((r for r in index.values() if r['id'].startswith('agreement.')),key=lambda r:r['id']):
 id=agreement['id'];keeper,why=keepers.get(id,(None,'No supported signing event: the record remains an unsigned offer/negotiation, or only later execution of prior promises is recorded.'))
 refs=[r for r in index.values() if r.get('agreement_id')==id]
 if keeper:assert keeper in [r['id'] for r in refs],(id,keeper)
 removed=[]
 for r in refs:
  if r['id']==keeper:continue
  after=copy.deepcopy(r);del after['agreement_id']
  if r['id']=='event.bpi_cooperation':
   for o in after['outcomes']:o['description']=o['description'].replace('17 July 1978','16 June 1978')
  removals.append(element(after));removed.append(r['id'])
 audit.append({'agreement_id':id,'state':agreement.get('state'),'signing_or_acceptance_event_id':keeper,'basis':why,'removed_from':removed})
ps.append({'id':'change.agreements_signing_events_only','category':'foundation','title':'Reserve agreement_id for signing or contractual acceptance events','reason':'Apply the author’s rule to every agreement: retain agreement_id only at an evidenced signing, formalisation or contractual acceptance event. Remove it from operational/cooperation events, acquisition closing, the Academy launch, implementation processes and the unsigned Apple–Peachtree negotiation. The October Logix share-transfer event records fulfilment of earlier commitments rather than a supported signing event, so its agreement_id is also removed without inventing another event. Retain all agreements, clauses, obligations, narrative relationships and prerequisite links. Correct the BPI cooperation outcome’s stale July 17 training date to the already approved June 16 Academy launch. The current compatibility schemas continue to read old records until approval.','elements':removals})
if '--apply' not in sys.argv:print([(p['id'],len(p['elements'])) for p in ps]);sys.exit()
queue=read('data_storytelling/change.json');ids={p['id'] for p in ps};affected={e['record_id'] for p in ps for e in p['elements']}
for p in queue['change']:
 if p['id'] not in ids:assert not any(e['record_id'] in affected for e in p['elements']),'Overlapping proposal '+p['id']
queue['change']=[p for p in queue['change'] if p['id'] not in ids]+ps
write('data_storytelling/change.json',queue)
write('data_storytelling/review_evidence/launch-agreement-corrections/proposals.json',{'change':ps})
write('data_storytelling/review_evidence/launch-agreement-corrections/audit.json',{'baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'agreements':audit})
print([(p['id'],len(p['elements'])) for p in ps])
