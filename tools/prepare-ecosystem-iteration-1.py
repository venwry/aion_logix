"""Prepare reviewable conversions without changing foundation or authorization."""
import copy,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
if (ROOT/'data_storytelling/review_evidence/standard-families/proposals.json').exists():
 raise SystemExit('Standard candidates have been revised. Use tools/revise-standard-families.py; do not restore the superseded queue.')
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):(ROOT/p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
evidence='data_storytelling/review_evidence/ecosystem-iteration-1/'
proposals=read(evidence+'draft-proposals.json')['change']
index={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(p.read_text()).values() for r in rows}
for p in proposals:
 for e in p['elements']:assert e['before']==index[e['record_id']],e['record_id']
providers={'autocad_1_artemis':['autodesk'],'bpi_client_server':['bpi'],'bpi_suite':['bpi'],'bpi_suite.era':['bpi'],'cpm_aurelia':['dri'],'cpm_platform_extensions':['dri'],'cpm_model_ii':['dri','tandy'],'microsoft_basic_aurelia':['microsoft'],'model_ii_flexibus':['tandy'],'trs80_model_ii':['tandy'],'apple_ii':['apple']}
for before in read('data_foundation/external_products.json')['external_product']:
 suffix=before['id'].split('.',1)[1]
 after=copy.deepcopy(before)
 # Unknown providers must be inspected, never guessed by name.
 if suffix not in providers:
  actor_entries=[s for s in before['specification'] if s['ref_id'].startswith('actor.') and any(w in s['ref_role'] for w in ['publisher','vendor','provider','seller'])]
  assert len(actor_entries)==1,(suffix,actor_entries)
  provider_ids=[actor_entries[0]['ref_id']]
 else:provider_ids=['actor.'+s for s in providers[suffix]]
 after['kind']='computer' if suffix in ['apple_ii','trs80_model_ii'] else 'peripheral' if suffix=='model_ii_flexibus' else 'software'
 after['provider_actor_ids']=provider_ids
 after['specification']=[{'number':s['no'],'chapter_name':s['ref_role'][0].upper()+s['ref_role'][1:],'description':s['description']+' Related record: {reference}.','parameters':[{'key':'reference','value':s['ref_id']}]} for s in before['specification']]
 # Preserve only explicit release information; no dates inferred from a compatible host.
 dates={'bpi_suite':'1978-06-06','trs80_model_ii':'1979-10-15','cpm_model_ii':'1979-10-15','model_ii_flexibus':'1979-10-15'}
 if suffix in dates:after['release']=dates[suffix]
 proposals.append({'id':'change.external_product_chapters_'+suffix,'category':'foundation','title':'Convert '+before['name']+' to technology-style specification chapters','reason':'Preserve every existing specification description, relationship role and referenced ID in numbered chapters with named text parameters. Add the commercial offering kind and documented providers. Where supplied, release is a direct date already stated in the product or the supported Model II customer-release event. No sales forecasts or new standards-impact assessments are invented.','elements':[{'record_type':'external_product','record_id':before['id'],'before':before,'after':after}]})
queue=read('data_storytelling/change.json');ids={p['id'] for p in proposals};touched={e['record_id'] for p in proposals for e in p['elements']}
for p in queue['change']:
 if p['id'] not in ids:assert not any(e['record_id'] in touched for e in p.get('elements',[])),'Overlapping pending proposal '+p['id']
queue['change']=[p for p in queue['change'] if p['id'] not in ids]+proposals
write('data_storytelling/change.json',queue);write(evidence+'proposals.json',{'change':proposals})
write(evidence+'audit.json',{'baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'proposal_count':len(proposals),'data_operations':sum(len(p['elements']) for p in proposals),'incoming_relationship_references':[],'schema_file_retirement':'Parked until separate user instruction','impact_assessments':'No new commercial-impact assumptions inferred; optional section awaits authored assessments.'})
print(len(proposals),'proposals prepared')
