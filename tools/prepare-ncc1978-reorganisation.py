#!/usr/bin/env python3
"""Prepare the requested NCC 1978 reorganisation as one atomic review proposal."""
import copy, json, pathlib, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):
 path=ROOT/p;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
index={r['id']:r for path in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(path.read_text()).values() for r in rows}
get=lambda id:copy.deepcopy(index[id])
c=get('campaign.ncc1978');old={s['id']:s for s in c['marketing_steps']}
assert all(k in old for k in ['readiness','advertising','aurelia-premiere','architecture-session','developer-session','bpi-session','academy','broadcast']), 'Campaign changed; review the current programme before regenerating.'
prep=get('process.aurelia_campaign_preparation');media=get('process.ncc78_sessions_media');dealer=get('event.bpi_dealer_program')
assert not prep['inputs'] and not prep['outcomes'] and not media['inputs'], 'New source inputs/outcomes require a deliberate destination review.'
changes=[]
def revise(after):
 before=index.get(after['id']);assert before!=after
 changes.append({'record_type':after['id'].split('.')[0],'record_id':after['id'],'before':copy.deepcopy(before),'after':after})
def remove(id):changes.append({'record_type':id.split('.')[0],'record_id':id,'before':get(id),'after':None})
def block(text,**params):return {'number':0,'description':text,'parameters':[dict(key=k,**({'ref_id':v[1]} if isinstance(v,tuple) else {'value':v})) for k,v in params.items()]}
def step(id,type,description,blocks,reference=None):
 s={'id':id,'number':0,'type':type,'description':description,'marketing_presentation':blocks}
 if reference:s['reference_id']=reference
 return s
press=step('press-campaign','advertising','Introduce Aurelia through newspaper and business-press teasers, then invite customers and press to the premiere.',[
 block('Begin newspaper and business-press teasers on {start_date}, introducing Aurelia as a personal assistant in business. Start with “coming this spring”, then publish the {premiere_date} premiere date and invite brochure and presentation-invitation requests.',start_date=index['event.aurelia_campaign_teaser']['time']['value'],premiere_date='1978-06-05'),
 block('Follow the teasers with explanatory print advertisements about Aurelia, Abacus and independently branded BPI applications. Prioritise markets with demonstration, support and Academy coverage, so readers can act on the campaign through local demonstrations and training enquiries.'),
 block('During late May and early June, organise press previews, prepare dealers and demonstration staff, issue launch invitations and rehearse the Aurelia presentation. Staff telephone enquiries, mailed brochures, demonstration appointments and Academy bookings.')
], 'event.aurelia_campaign_teaser')
ad=old['advertising'];ad['description']='Run the cinematic Aurelia television commercial and direct viewers to demonstrations.';ad['reference_id']='event.aurelia_campaign_advert'
ad['marketing_presentation'][0]['description']=ad['marketing_presentation'][0]['description'].replace('explain accounting in print and follow-up films.','explain accounting in the accompanying press campaign and follow-up films.')
main=old['aurelia-premiere'];main['reference_id']='event.aurelia_launch'
main['marketing_presentation'][7]['description']=main['marketing_presentation'][7]['description'].replace('Show selected locations, first course dates once finalised. BPI-authorised courses and the dealer programme start July 17; specialist support is provided by BPI.', 'Announce the official Academy launch on June 16, including BPI-authorised training, direct distribution and the dealer programme. Present confirmed course locations and schedules; specialist support is provided by BPI.')
main['marketing_presentation'][8]['description']=main['marketing_presentation'][8]['description'].replace('announce the two technical sessions.', 'announce the June 6 morning developer presentation and afternoon BPI session, the June 14 ComputerLand sales premiere and the June 16 Academy launch.')
main['marketing_presentation'].append(block('Rehearse the digital-video projection and recording path, display readability, lighting and sound in the hired room. Have a backup demonstration system and an explicitly identified recorded fallback available.'))
dev=old['developer-session'];dev['type']='presentation';dev['description']='Present AION C IDE and the Software Developer Package on the morning of 6 June 1978.';dev['reference_id']='event.aurelia_developer_presentation'
dev['marketing_presentation']=[
 block('Introduce the platform interfaces that the Software Developer Package exposes: FlexiBUS, display interfaces, implementation and licensing, compatibility and third-party peripheral development. Explain how those interfaces support application and peripheral work on Aurelia.'),
 block('Use {ide} with {sdk} to edit a small application with syntax highlighting and diagnostic navigation. Build it using a qualified optimization profile, link an assembly library and debug the application in RAM. Explain C source portability and the need for separate target builds rather than promising universal binary compatibility.',ide=('ref','product.simple_c_z80'),sdk=('ref','product.aurelia_sdk')),
 block('Demonstrate keyboard-operated TUI forms with bounded data controls and calls into the shared ROM TUI. Show text and bitmap presentation in tested modes, distinguishing SDK composite helpers from native ROM services. Publish measured memory, disk and performance results; shared source and API contracts do not imply that future targets have already been released.')]
bpi=old['bpi-session'];bpi['reference_id']='event.bpi_launch';bpi['description']='Present the independent BPI business applications on the afternoon of 6 June 1978.'
sales=step('sales-premiere','presentation','Hold the official Aurelia sales premiere at a ComputerLand shop on 14 June 1978.',[
 block('{dealer} hosts the official Aurelia sales premiere with {logix}. Introduce the retail offering, demonstrate the business-assistant workflow and help visitors choose a suitable system and associated software. Keep separately licensed BPI applications and training distinct from the computer purchase.',dealer=('ref','actor.computerland'),logix=('ref','actor.logix'))
], 'event.aurelia_sales_premiere')
academy=old['academy'];academy['type']='presentation';academy['description']='Officially launch Logix Computer Academy and its BPI programme on 16 June 1978.';academy['reference_id']='event.academy_launch'
a=academy['marketing_presentation'][0];a['description']=a['description'].replace('Launch in {city_count} US cities', 'Officially launch on {launch_date} with an initial {city_count}-city US programme');a['parameters'].append({'key':'launch_date','value':'1978-06-16'})
academy['marketing_presentation'][1]=block('The {launch_date} Academy launch includes BPI-authorised practical courses and direct distribution, dealer qualification, accountant demonstration access, permission-based case studies and defined setup assistance. Each initial Academy centre has access to a BPI specialist. Dealers handle first-line installation enquiries, BPI handles software defects and specialist support, and Logix supports hardware. Training, setup services and software licences remain separate offerings.',launch_date='1978-06-16')
broadcast=old['broadcast'];broadcast['description']='Record the NCC presentations and distribute cleared television coverage.'
broadcast['marketing_presentation']=[
 block('Before NCC, contact television stations and arrange presenter, partner, music and production rights for redistribution. Include Michael Douglas commercial footage only if it is separately cleared for that use.'),
 block('Throughout 5–8 June 1978, use a professional multi-camera crew to record every Logix NCC presentation and hands-on demonstration, including the premiere, technical and developer content, partner appearances, additional sessions and questions. Capture clean presenter audio, audience reactions and close-ups of the computer, display, connections and printouts. Retain full-session recordings and production masters.'),
 block('Preserve demonstration fidelity: do not accelerate startup or recalculation, hide failures with misleading cuts or present recorded footage as a live result. Identify edited excerpts and any recorded fallback.'),
 block('After NCC, prepare a business-user broadcast feature, short station-ready news and demonstration excerpts, clean captioned footage, separate narration or audio where practical, a factual product and Academy press sheet, and full edited presentations for longer technical coverage. Offer cleared, Logix-identified material to any television station wishing to broadcast it; Logix arranges normal duplication, dispatch and station-compatible copies. Distribution follows editing and clearance. Stations choose their own participation, schedules and editorial selection; no airtime or endorsement is guaranteed.')]
c['marketing_steps']=[press,ad,main,dev,bpi,sales,academy,broadcast]
c['objective']='Introduce Aurelia and its business software through press and television advertising, NCC presentations, a ComputerLand sales premiere and the public launch of Logix Computer Academy.'
for i,s in enumerate(c['marketing_steps'],1):
 s['number']=i
 for j,b in enumerate(s['marketing_presentation'],1):b['number']=j
revise(c)
# Record the three public NCC sessions individually. Morning/afternoon belongs in
# narrative: the existing temporal schema records dates, not invented clock times.
launch=get('event.aurelia_launch')
launch['description']=launch['description'].replace('Academy and dealer configurations follow.', 'Academy and dealer configurations follow, with the official Academy launch announced for 16 June.').replace('BPI’s dedicated application launch session takes place the following day at NCC.', 'The next morning’s AION C IDE/Software Developer Package presentation and afternoon BPI application session continue the NCC programme.')
launch['outcomes'].append({'number':max(x['number'] for x in launch['outcomes'])+1,'type':'deliverable','description':'Full-session recordings and production masters of the Aurelia premiere, partner appearances and questions are supplied for subsequent cleared editing and television redistribution.'})
revise(launch)
def event(id,title,description,date,participants,inputs,outcomes,**extra):
 return dict(id=id,title=title,kind='presentation',description=description,time={'value':date,'precision':'day'},participant=participants,inputs=inputs,outcomes=outcomes,**extra)
devent=event('event.aurelia_developer_presentation','NCC morning presentation: AION C IDE and Software Developer Package',
 'On the morning of 6 June 1978 at NCC in Anaheim, AION and Logix present the Aurelia development environment and Software Developer Package. The presentation explains platform and peripheral interfaces, edits and builds an application, links an assembly library, debugs a RAM application and demonstrates TUI forms and tested text/bitmap presentation. It reports measured resource use and distinguishes SDK helpers from ROM services.',
 '1978-06-06',[{'actor_id':'actor.aion','role':'developer tools presenter'},{'actor_id':'actor.logix','role':'organiser and platform presenter'}],
 [{'number':1,'type':'resource','description':'The Aurelia C IDE and Developer Package supply the tools and documented interfaces used in the presentation.','subject_ids':['product.simple_c_z80','product.aurelia_sdk']}],
 [{'number':1,'type':'result','description':'Developers see the Aurelia editing, compilation, library, debugging and TUI workflow with its measured resource limits and supported interface boundaries.'},
 {'number':2,'type':'deliverable','description':'Full-session recordings and production masters of the developer presentation and questions are supplied for subsequent cleared editing and redistribution.'}],location_ids=['location.anaheim'])
revise(devent)
bevent=get('event.bpi_launch');bevent['description']=bevent['description'].replace('On 6 June 1978,','On the afternoon of 6 June 1978,');bevent['location_ids']=['location.anaheim'];bevent['outcomes'].append({'number':max(x['number'] for x in bevent['outcomes'])+1,'type':'deliverable','description':'Full-session recordings and production masters of the BPI presentation and questions are supplied for subsequent cleared editing and redistribution, retaining BPI branding and support responsibilities.'});revise(bevent)
sevent=event('event.aurelia_sales_premiere','Official Aurelia sales premiere at ComputerLand',
 'On 14 June 1978, a ComputerLand shop hosts the official Aurelia sales premiere with Logix, following the NCC platform announcement. Visitors see the business-assistant workflow and receive configuration and software advice. The particular shop and city are not specified.',
 '1978-06-14',[{'actor_id':'actor.computerland','role':'retail host'},{'actor_id':'actor.logix','role':'platform presenter'}],
 [{'number':1,'type':'resource','description':'The NCC platform launch supplies the announced Aurelia offering for the subsequent shop sales premiere.','event_id':'event.aurelia_launch'}],
 [{'number':1,'type':'result','description':'The official Aurelia retail sales premiere takes place at a ComputerLand shop; no sales volume or wider stock availability is implied.'}]);sevent['kind']='launch';revise(sevent)
aevent=dealer;aevent['id']='event.academy_launch';aevent['title']='Official Logix Computer Academy launch, including BPI training and distribution';aevent['kind']='launch';aevent['time']={'value':'1978-06-16','precision':'day'}
aevent['description']=aevent['description'].replace('On 17 July 1978, Academy begins', 'On 16 June 1978, Logix Computer Academy officially launches its public training programme, including Aurelia Fundamentals and BPI-authorised offerings. Academy begins')
aevent['inputs'].append({'number':3,'type':'resource','description':'The Academy company and its preparation of the initial five-city programme provide the organisation and facilities basis for the public launch.','event_id':'event.academy'})
aevent['outcomes'][0].pop('subject_ids',None)
aevent['outcomes'].insert(0,{'number':1,'type':'result','description':'The Academy publicly launches hands-on Aurelia training, configuration advice and direct ordering; customer-site delivery remains an option and immediate collection depends on stock.'})
for i,o in enumerate(aevent['outcomes'],1):o['number']=i
revise(aevent)
training=get('product.service_bpi_training');training['launch_event_id']='event.academy_launch';revise(training)
execution=get('process.ncc1978_campaign')
execution['description']='From 26 March to 17 July 1978, Logix coordinates the remaining campaign support, demonstration qualification and follow-up production work. Public press, advertising and launch activities are owned directly by the Aurelia campaign. The Academy and BPI training/distribution programme launch on 16 June. Undated follow-up plans for year-end workshops and customer-led expansion do not assert completion of later work by July.'
# Preserve the independently recorded process/campaign envelope; removing its old
# event anchor must not make the replacement Academy event structurally owned here.
execution['period']['end']=copy.deepcopy(index['event.bpi_dealer_program']['time'])
execution['steps']=[s for s in execution['steps'] if s.get('process_id')!='process.aurelia_campaign_preparation']
# Advertising and broadcast work now live in the campaign. Retain the still-needed
# operational qualification and future customer follow-up in the execution process.
execution['steps']=[s for s in execution['steps'] if s['number'] not in [1,7]]
for i,s in enumerate(execution['steps'],1):s['number']=i
revise(execution)
for id in ['process.aurelia_campaign_preparation','process.ncc78_sessions_media','event.bpi_dealer_program']:remove(id)
proposal={'id':'change.ncc1978_campaign_reorganisation','category':'foundation','title':'Reorganise Aurelia 1978 campaign and directly own its public events','reason':'Remove the editorial readiness step. Retain and directly own the April press teaser and May advertising events, and consolidate the two retired preparation/session processes into campaign activities. Directly own the June 5 Aurelia launch, June 6 morning developer and afternoon BPI presentations, June 14 ComputerLand sales premiere and June 16 Academy/BPI launch. Transfer NCC recording deliverables to the respective presentation events; the retired processes have no inputs to relocate. Replace the July 17 BPI dealer event and retarget BPI Products training to June 16. Keep existing June 5 product announcements and the March 25 Academy company formation distinct from subsequent demonstrations, retail premiere and public Academy launch. Retain the calendar campaign/process end of July 17 for the remaining support/follow-up work, but remove the execution process’s old event-valued end so it cannot also own the new Academy launch. No particular ComputerLand shop, city, clock time or first course date is invented. All ownership edits, additions and removals are one atomic proposal to avoid dangling links or double owners.','elements':changes}
base=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
evidence={'baseline_commit':base,'removed_readiness_blocks':len(old['readiness']['marketing_presentation']),'source_mapping':[
 {'source':'campaign.ncc1978/marketing_steps/readiness','disposition':'Removed as obsolete editorial remarks, as requested; none of these nine blocks is relocated.'},
 {'source':'process.aurelia_campaign_preparation/steps/1-2','destination':'campaign.ncc1978/marketing_steps/press-campaign and advertising','disposition':'Consolidated press previews, dealer/staff preparation, invitations and advertising; retained teaser and advertising events as direct campaign children.'},
 {'source':'process.aurelia_campaign_preparation/steps/3','destination':'campaign.ncc1978/marketing_steps/broadcast','disposition':'Preserved station outreach and separate commercial-footage rights.'},
 {'source':'process.aurelia_campaign_preparation/steps/4','destination':'campaign.ncc1978/marketing_steps/aurelia-premiere','disposition':'Preserved projection/recording rehearsal, backup system and labelled recorded fallback.'},
 {'source':'process.aurelia_campaign_preparation/steps/5','destination':'campaign.ncc1978/marketing_steps/aurelia-premiere, developer-session, bpi-session and broadcast','disposition':'Removed obsolete wrapper ownership after transferring its activities.'},
 {'source':'process.ncc78_sessions_media/steps/1-3','destination':'campaign.ncc1978/marketing_steps/aurelia-premiere, developer-session and bpi-session','disposition':'Consolidated presentation content; merged architecture/interface overview into the morning developer presentation.'},
 {'source':'process.ncc78_sessions_media/steps/4-5','destination':'campaign.ncc1978/marketing_steps/broadcast','disposition':'Preserved professional recording, coverage, clean audio and demonstration fidelity.'},
 {'source':'process.ncc78_sessions_media/outcomes/1','destination':'event.aurelia_launch, event.aurelia_developer_presentation, event.bpi_launch / outcomes','disposition':'Scoped the full-session recording/master deliverable to each presentation. Source inputs are empty.'},
 {'source':'event.bpi_dealer_program','destination':'event.academy_launch and campaign.ncc1978/marketing_steps/academy','disposition':'Preserved training, distribution, partner roles, support, agreement, inputs and outcome; moved to the author-specified June 16 Academy launch.'},
 {'source':'process.ncc1978_campaign/steps/1,2,7','destination':'campaign.ncc1978/marketing_steps/press-campaign, advertising and broadcast','disposition':'Removed redundant advertising, wrapper and broadcast execution steps; retained operational qualification and future follow-up work.'}],
 'date_decisions':{'developer':'1978-06-06 morning','bpi':'1978-06-06 afternoon','retail':'1978-06-14; specific store unspecified','academy':'1978-06-16, superseding the separate July 17 BPI programme event','existing_product_announcements':'Unchanged except BPI Products training, whose removed launch event is replaced.','campaign_and_remaining_execution_end':'1978-07-17 unchanged as a calendar boundary, independent of the June 16 launch.'}}
if '--apply' not in sys.argv:print('Prepared',len(changes),'record operations in memory. Use --apply to write only proposals/evidence.');sys.exit()
queue=read('data_storytelling/change.json');affected={e['record_id'] for e in changes}
for p in queue['change']:
 if p['id']!=proposal['id']:assert not any(e['record_id'] in affected for e in p['elements']),'Overlapping proposal '+p['id']
queue['change']=[p for p in queue['change'] if p['id']!=proposal['id']]+[proposal]
write('data_storytelling/change.json',queue)
write('data_storytelling/review_evidence/ncc1978-reorganisation/proposals.json',{'change':[proposal]})
write('data_storytelling/review_evidence/ncc1978-reorganisation/audit.json',evidence)
print('Prepared one atomic proposal with',len(changes),'record operations; foundation/authorization untouched.')
