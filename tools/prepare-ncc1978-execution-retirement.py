#!/usr/bin/env python3
"""Preserve remaining NCC 1978 content and propose execution-process retirement."""
import copy,json,pathlib,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):
 path=ROOT/p;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
index={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(p.read_text()).values() for r in rows}
get=lambda id:copy.deepcopy(index[id])
source=get('process.ncc1978_campaign');campaign=get('campaign.ncc1978');steps={s['id']:s for s in campaign['marketing_steps']}
assert len(source['steps'])==4 and len(source['outcomes'])==5,'Review changed execution content before regeneration.'
assert 'customer-follow-up' not in steps
# Keep this content within the existing relevant activities, not a new editorial readiness step.
steps['bpi-session']['marketing_presentation'].append({'number':3,'description':'Use pilot demonstrations with {pilot_businesses} businesses and several accounting practices to prepare representative BPI workflows. Reconcile their results against existing records, checking data volumes, disk and RAM requirements, posting, corrections, backup and restore, payroll jurisdiction coverage and the summary export to Abacus. Publish measured capacity and supported configurations without treating pilot targets as completed results.','parameters':[{'key':'pilot_businesses','value':'10–15'}]})
press=steps['press-campaign']['marketing_presentation'][2]
assert 'organise press previews' in press['description'];press['description']=press['description'].replace('organise press previews','organise joint Logix/BPI press previews')
academy=steps['academy']['marketing_presentation'][1];academy['description']+=' Train instructors and dealers to explain advertised modules, published requirements and support boundaries.'
campaign['marketing_steps'].append({'id':'customer-follow-up','number':9,'type':'follow_up','description':'Plan year-end workshops and customer-led expansion after the launch.','marketing_presentation':[
 {'number':1,'description':'Prepare year-end workshops and module-upgrade demonstrations, specifying payroll update coverage and maintenance terms. Keep customer data under customer control and obtain consent before presenting referrals as accountant endorsements. This is follow-up planning, not a claim that year-end work is complete within the campaign period.','parameters':[]},
 {'number':2,'description':'Plan expansion of demonstrations and qualified support using verified customer results, explaining the module-to-suite upgrade route. BPI support for the Model II remains a separate future negotiation; the existing Tandy agreement covers Abacus only.','parameters':[]}]})
launch=get('event.aurelia_launch')
assert not any('broadcast feature' in o['description'] for o in launch['outcomes'])
launch['outcomes'].append({'number':max(o['number'] for o in launch['outcomes'])+1,'type':'deliverable','description':'The subsequent launch-media programme delivers an edited broadcast feature with a business-user narrative; short station-ready news packages and demonstration excerpts; clean captioned footage with separate narration/audio where practical and a factual product/Academy press sheet; and full edited presentations for longer technical coverage. These are post-presentation outputs made from the recorded NCC material, not completed films claimed to be available during the June 5 presentation.'})
# Launch facts and recording masters already exist in their own events. Preserve them unchanged.
parent=get('process.aurelia_foundation');matches=[s for s in parent['steps'] if s.get('process_id')==source['id']];assert len(matches)==1
parent['steps']=[s for s in parent['steps'] if s.get('process_id')!=source['id']]
assert any(s.get('campaign_id')==campaign['id'] for s in parent['steps'])
# Preserve unaffected step numbers; removal leaves a valid gap rather than renumbering unrelated work.
launch_events={r['launch_event_id'] for r in index.values() if r['id'].startswith('product.') and r.get('launch_event_id')}
changes=[]
def revise(r):
 if r!=index[r['id']]:changes.append({'record_type':r['id'].split('.')[0],'record_id':r['id'],'before':get(r['id']),'after':r})
revise(campaign);revise(launch);revise(parent)
academy_event=get('event.academy_launch')
academy_event['outcomes'][1]['description']+=' The programme also establishes follow-up plans for year-end preparation, module-upgrade demonstrations and expansion based on verified customer results; this does not assert completion of those later activities.'
revise(academy_event)
kind_changes=[]
for s in campaign['marketing_steps']:
 id=s.get('reference_id')
 if not id or not id.startswith('event.'):continue
 event=get(id);old=event['kind']
 event['kind']='launch' if id in launch_events else ('activity' if event['kind']=='activity' else 'premiere')
 if event['kind']!=old:kind_changes.append({'record_id':id,'before':old,'after':event['kind']});revise(event)
changes.append({'record_type':'process','record_id':source['id'],'before':source,'after':None})
proposal={'id':'change.ncc1978_execution_retirement','category':'foundation','title':'Retire NCC 1978 execution process after consolidating its remaining content','reason':'Preserve the remaining pilot outreach, joint press preparation, instructor/dealer training and undated follow-up plans in the relevant campaign steps, without restoring the removed editorial readiness section. Add the four complementary edited-media deliverables as one post-presentation outcome on the Aurelia launch; existing event outcomes already cover the platform and BPI presentations, recording masters and Academy/BPI operations. Enrich the Academy programme outcome with the retained future follow-up plans. The Academy establishment prerequisite is already present in the launch-event inputs. Remove the obsolete execution-process step from its parent while retaining the campaign step, then delete process.ncc1978_campaign. Within this campaign, only the three events referenced by products retain kind launch; the developer presentation and ComputerLand sales premiere become premiere. Preserve all product launch links, event dates, campaign period and unrelated parent steps. This is one atomic removal group, not direct data authorization.','elements':changes}
audit={'baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'step_mapping':[
 {'source_number':1,'destination':'campaign.ncc1978 / bpi-session / block 3','decision':'Preserve 10–15 pilot-business target, accounting practices, reconciliation, resource/correctness/recovery/jurisdiction scope; do not assert qualification success.'},
 {'source_number':2,'destination':'bpi-session block 3, press-campaign block 3, academy block 2','decision':'Consolidate module/export demonstration requirements, joint press preview and staff training into existing activities.'},
 {'source_number':3,'destination':'customer-follow-up block 1','decision':'Preserve year-end planning, payroll maintenance coverage, customer data control and consent.'},
 {'source_number':4,'destination':'customer-follow-up block 2','decision':'Preserve verified customer expansion, upgrades and the distinct future BPI Model II negotiation.'}],
 'outcome_mapping':[
 {'source_numbers':[1,2,3,4],'destination':'event.aurelia_launch / outcomes / 4','decision':'One coherent edited-media deliverable; existing raw recordings and masters remain separate. Production follows NCC, not completed at the June 5 presentation.'},
 {'source_numbers':[5],'destination':'Existing event.aurelia_launch and event.bpi_launch outcomes; enriched event.academy_launch outcome 2; customer-follow-up campaign step','decision':'Do not repeat already recorded launch/programme results. Preserve the previously missing future follow-up plan in the Academy programme outcome and its campaign activity.'}],
 'input_mapping':[{'source_number':1,'destination':'Existing event.aurelia_launch input 1 and event.academy_launch input 3','decision':'Academy establishment prerequisite already represented; no duplicate added.'}],
 'event_kind_changes':kind_changes,'launch_event_ids':sorted(id for id in launch_events if any(s.get('reference_id')==id for s in campaign['marketing_steps']))}
if '--apply' not in sys.argv:print('Prepared',len(changes),'operations in memory; --apply writes proposals/evidence only.');sys.exit()
queue=read('data_storytelling/change.json');affected={e['record_id'] for e in changes}
for p in queue['change']:
 if p['id']!=proposal['id']:assert not any(e['record_id'] in affected for e in p['elements']),'Overlapping proposal '+p['id']
queue['change']=[p for p in queue['change'] if p['id']!=proposal['id']]+[proposal]
write('data_storytelling/change.json',queue)
write('data_storytelling/review_evidence/ncc1978-execution-retirement/proposals.json',{'change':[proposal]})
write('data_storytelling/review_evidence/ncc1978-execution-retirement/audit.json',audit)
print('Prepared',len(changes),'operations; foundation and authorizations unchanged.')
