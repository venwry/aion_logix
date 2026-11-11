#!/usr/bin/env python3
"""Prepare individually reviewable campaign conversions; never authorize foundation records."""
import copy, json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
def read(p): return json.loads((ROOT / p).read_text())
def write(p, data):
    path = ROOT / p; path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
cs = read('data_foundation/campaign.json')['campaign']
ps = read('data_foundation/process.json')['process']
es = read('data_foundation/event.json')['event']
index = {r['id']: r for r in cs + ps + es}
proposals, audits = [], []
def clean(s):
    # Remove import-path labels, retaining the actual message or requirement.
    return re.sub(r'^(?:Legacy acceptance wording \(not new confirmation\) / )?[^:]+: ', '', s, count=1) if re.match(r'^(?:positioning|tagline:|messages /|headline:|subheadline:|call to action:|campaign message:|campaign promise:|acceptance gates|claims /|launch gates|claim limits|claim policy:|partner policy|commercial policy|strategy:|disclosure /|compatibility policy|broadcast policy:)', s) else s
for c in cs:
    if 'process_id' not in c: raise SystemExit('Preparation requires the pinned legacy campaigns; do not regenerate after approval.')
    name = c['id'].split('.',1)[1]; process = index[c['process_id']]
    after = {k: copy.deepcopy(c[k]) for k in ['id','title','objective','lead_actor_ids']}
    for k in ['message','audience']:
        values = list(dict.fromkeys(clean(s) for s in c.get(k,[])))
        if values: after[k] = values
    def date(point):
        return copy.deepcopy(index[point['value']]['time'] if point['precision']=='event' else point)
    after['period'] = {k: date(v) for k,v in process['period'].items()}
    parents = [p for p in ps if any(s.get('process_id')==process['id'] for s in p['steps'])]
    assert len(parents)<=1
    if not parents and process.get('category'): after['category']=process['category']
    steps=[]; coverage={}; dropped=[]
    arrays={'stage':c.get('presentation',{}).get('stage',[]),'marketing_content':c.get('marketing_content',[]),'claim_policy':c.get('claim_policy',[]),'booth':c.get('booth',[])}
    def source(kind, i):
        assert (kind,i) not in coverage,(name,kind,i)
        coverage[kind,i]='retained';v=arrays[kind][i]
        return clean(v if isinstance(v,str) else v['description'])
    def omit(kind,i,reason):
        assert (kind,i) not in coverage,(name,kind,i)
        coverage[kind,i]='removed';dropped.append({'source':f'{kind}/{i}','reason':reason})
    def block(description, **params):
        return {'number':0,'description':description,'parameters':[dict(key=k,**({'ref_id':v[1]} if isinstance(v,tuple) else {'value':v})) for k,v in params.items()]}
    def add(id,type,description,blocks):
        for i,b in enumerate(blocks,1):b['number']=i
        steps.append({'id':id,'number':len(steps)+1,'type':type,'description':description,'marketing_presentation':blocks})
    def stage(i):
        text=source('stage',i);item=arrays['stage'][i];params={}
        if 'duration_minutes' in item:
            text='Allow {duration_minutes} minutes for this block. '+text;params['duration_minutes']=item['duration_minutes']
        if 'Adam' in text:
            text=text.replace('Adam’s','{presenter}’s').replace('Adam','{presenter}');params['presenter']=('ref','actor.adam')
        return block(text,**params)
    def claims(indices):return [block(source('claim_policy',i)) for i in indices]
    def content(indices):return [block(source('marketing_content',i)) for i in indices]
    if name=='ncc1978':
        after['audience']=[clean(c['message'][2])];after['message']=[clean(c['message'][i]) for i in [0,1,3]]
        omit('claim_policy',0,'Historical acceptance/status statement; its unresolved contracts and demonstration gates are retained in the preparation blocks.')
        add('readiness','preparation','Qualify the demonstrations, operating limits and public commitments.',claims(range(1,10)))
        film=[source('marketing_content',i) for i in range(5)]
        add('advertising','advertising','Invite business customers to the Aurelia premiere and demonstrations.',[
            block('The proposed advertisement is a {duration_seconds}-second film trailer, with {lead} proposed as its lead. In the final {reveal_seconds} seconds, show Aurelia, Abacus, a printed result, the logo and the June 5 premiere date. Include a recognisable, independently branded BPI report; explain accounting in print and follow-up films. Casting remains subject to contract.',duration_seconds=60,lead=film[1],reveal_seconds='10–15'),
            block(' '.join(film[2:]))])
        keynote=[stage(i) for i in range(9)]
        source('stage',12)
        keynote[6]['description']=keynote[6]['description'].replace('with {presenter} investment and AION/Logix cooperation disclosed','with {presenter}’s investment, AION/Logix cooperation and AION’s C/TUI redevelopment commitments disclosed')
        # Make the role explicit without changing the separately recorded BPI launch slot.
        keynote += [stage(i) for i in [11,13,14]]
        add('aurelia-premiere','presentation','Introduce Aurelia as a business assistant at NCC on 5 June 1978.',keynote)
        add('architecture-session','workshop','Explain Aurelia architecture and third-party peripheral development.',[stage(9)])
        add('developer-session','workshop','Demonstrate the Aurelia development environment and SDK.',[stage(10)]+claims([11,12]))
        for i in [15,16]:omit('stage',i,'Topic duplicates the corresponding technical-session block.')
        source('stage',17);topic=source('stage',18)
        add('bpi-session','presentation','Present the independent BPI business applications on 6 June 1978.',[stage(19),block('{provider} covers '+topic[0].lower()+topic[1:]+'.',provider=('ref','external_product.bpi_suite'))])
        vals=[source('marketing_content',i) for i in range(5,13)]
        add('academy','workshop','Turn initial interest into informed configuration choices and supported training.',[
            block('The Academy was established on {established_date} and is announced publicly on {announcement_date}. Launch in {city_count} US cities with a {fundamentals_days}-day Fundamentals course. '+vals[4]+' '+vals[5],established_date=vals[0],announcement_date=vals[1],city_count=int(vals[2]),fundamentals_days=int(vals[3])),
            block('BPI-authorised training starts on {start_date}. '+vals[7],start_date=vals[6])])
        add('broadcast','advertising','Make the NCC programme available for television coverage.',claims([10]))
        # 44 is the combined duration of the nine timed keynote blocks (37) and BPI session (7).
        duration_note='Legacy duration 44 minutes is preserved as 37 minutes across the nine timed Aurelia blocks plus the separate 7-minute BPI session; untimed sessions and questions are not assigned invented lengths.'
    elif name=='ncc1979':
        add('disclosure','preparation','Qualify partner claims and protect the next-generation architecture disclosure.',claims(range(9)))
        add('premiere','presentation','Demonstrate independent customer choices at NCC 1979.',[stage(i) for i in range(8)])
        add('compatibility-guides','advertising','Explain the separate software, peripheral and display compatibility profiles.',content(range(4)))
        add('supplier-programme','follow_up','Recruit independent implementers under explicit terms and governance.',content([4,5]+list(range(12,17))))
        add('migration','advertising','Explain source migration, legacy support and the continuing eight-bit market.',content(range(6,12)))
        add('demonstration-preparation','preparation','Prepare the actual transfer demonstration, venue and architecture answers.',content([17,18,19]))
        add('adoption-review','review','Evaluate manufacturer adoption against stated targets.',content([20]))
    elif name=='ncc1980':
        omit('claim_policy',0,'Remove historical acceptance status; demonstration qualification remains explicit in the readiness step.')
        announced=source('claim_policy',1);until=source('claim_policy',2);source('claim_policy',6)
        policy=[block('Announce the compatibility commitment on {announcement_date}, with support through {support_end}. This is a commitment; future fulfilment remains to be demonstrated.',announcement_date=announced,support_end=until)]+claims([3,4,5])
        keynote=[stage(i) for i in range(9)]
        for i in range(9,19):omit('stage',i,'Redundant cumulative timing; the nine durations preserve the 0–55 minute programme exactly.')
        keynote[6]['description']+=' '+policy[0]['description'];keynote[6]['parameters']+=policy[0]['parameters']
        keynote[6]['description']+=' '+' '.join(b['description'] for b in policy[1:])
        keynote += content([0,7])
        add('artemis-premiere','presentation','Introduce Artemis, demonstrate its workflows and explain the compatibility commitment.',keynote)
        machines=[source('marketing_content',i) for i in [1,2,3]]
        add('benchmark','demonstration','Compare computation and display workloads under reproducible conditions.',[block('Compare {systems}, using separately measured computation and rendering paths.',systems=', '.join(machines))]+content([4,5,6]))
        add('readiness','preparation','Qualify application, licensing, resource and support claims before publication.',claims(range(7,17)))
    elif name=='comdex1979':
        omit('claim_policy',0,'Remove historical alternative-history acceptance label; retain qualification requirements throughout the programme.')
        main=[stage(i) for i in range(8)]
        for i in [8,9]:source('stage',i)
        explain=source('stage',10);cube=source('stage',11)
        main[1]['description']+=' Use {explanation_minutes} minute for explanation and {animation_minutes} minutes for the live shaded cube.'
        main[1]['parameters'] += [{'key':'explanation_minutes','value':int(explain)},{'key':'animation_minutes','value':int(cube)}]
        main[1]['description']+=' '+' '.join(source('stage',i) for i in range(12,21))
        main[2]['description']+=' Demonstrate charts and document layouts populated by spreadsheet field values.'
        for i in [21,22]:omit('stage',i,'Headline features merged into the Abacus presentation block.')
        main[2]['description']+=' '+' '.join(source('stage',i) for i in range(23,37))
        add('premiere','presentation','Present Aurelia+, Abacus 2 and qualified partner applications at COMDEX 1979.',main)
        add('partner-preparation','preparation','Keep independent supplier roles and qualified configurations explicit.',claims(range(1,4)))
        add('customer-follow-up','follow_up','Explain upgrades, continued support and independent manufacturer participation.',claims(range(4,10)))
        reveal=source('claim_policy',10)
        add('disclosure','preparation','Explain migration without disclosing the future architecture early.',[block('Full architecture disclosure is scheduled for {reveal_date}.',reveal_date=reveal)]+claims([11,12]))
    elif name in ['comdex1982','ncc1982']:
        add('readiness','preparation','Qualify configurations and distinguish demonstrations from release commitments.',claims(range(len(arrays['claim_policy']))))
        add('main-demonstration','demonstration','Show the CAD workflow from drawing to plotted output.' if name=='comdex1982' else 'Show mouse-driven business work and compatible colour upgrades.',[stage(i) for i in range(len(arrays['stage']))])
        booths=[]
        for i,b in enumerate(arrays['booth']):
            text=source('booth',i);booths.append(block(b['name']+': '+text+(' '+b['call_to_action'] if b.get('call_to_action') else '')))
        add('hands-on','workshop','Offer focused visitor trials and configuration consultations.',booths)
        duplicate_count=8 if name=='comdex1982' else 9
        for i in range(duplicate_count):omit('marketing_content',i,'Exact booth name, purpose or conversion text consolidated into the hands-on step.')
        if name=='comdex1982':
            add('press','advertising','Provide a reproducible CAD press kit and clear support responsibilities.',content(range(8,13)))
            add('dealer-follow-up','follow_up','Convert drawing evaluations into qualified configurations and training.',content(range(13,18)))
        else:add('developer-clinics','workshop','Demonstrate Team Edition and offer qualified porting support.',content([9]))
    elif name=='comdex1980':
        for i,(sid,typ,title) in enumerate([('advance-advertising','advertising','Invite customers and dealers to the November presentation.'),('rehearsal','preparation','Rehearse qualified Artemis business workflows.'),('premiere','presentation','Introduce native applications and Budget Hard-Disk Office at COMDEX.')]):add(sid,typ,title,content([i]))
    elif name=='comdex1981':
        add('readiness','preparation','Prepare qualified whole-team development demonstrations.',[block(process['steps'][0]['description'])]+claims([0]))
        add('premiere','presentation','Introduce Team Edition at COMDEX on 19 November 1981.',[block(c['objective'])])
        add('follow-up','follow_up','Prepare the workshop and trade programme starting on 1 December.',[block(process['steps'][2]['description'])])
    elif name=='ncc1981':
        add('premiere','presentation','Present networked business computing at NCC on 4 May 1981.',[block(process['description'])])
        add('pilot-follow-up','follow_up','Prepare dealer and BPI pilots with explicit recovery requirements.',[block(process['steps'][1]['description'])])
    elif name=='ncc1983':
        add('planned-premiere','presentation','Plan the ERA² and Logix Athena premiere at NCC 1983.',[block('The programme concerns the planned ERA² and Logix Athena premiere. Presentation blocks and timings have not been specified.')])
    elif name=='clone_january1982':
        add('preparation','preparation','Coordinate previews, translated press materials and dealer readiness.',[block(process['steps'][0]['description'])])
        add('premiere','presentation','Present independent national brands in the coordinated January launch.',[block(process['steps'][1]['description'])])
        add('roadshows','workshop','Run dealer roadshows and Academy workshops through 31 March.',[block(process['steps'][3]['description'])])
        add('review','review','Assess the campaign and partner readiness at the 90-day review.',[block(process['outcomes'][0]['description'])]+claims([0]))
    elif name=='tandy_model_ii_1979':
        # Earlier author feedback explicitly requests no detailed Tandy programme.
        pass
    else:raise AssertionError(name)
    # Preserve actual programme durations without inventing individual block lengths.
    duration=c.get('presentation',{}).get('duration_minutes')
    if duration and name!='ncc1978':
        target=next(s for s in steps if s['type'] in ['presentation','demonstration'])
        target['marketing_presentation'].insert(0,block('Allow {programme_minutes} minutes for the presentation programme; questions and follow-up are separate.',programme_minutes=duration))
    # Retain each meaningful former subject as a narrated participation or demonstration reference.
    reference_roles={
        'external_product.bpi_suite':'The independent business application presented is {subject}; retain its own branding, licensing and support.',
        'external_product.bpi_suite.era':'The independent native business application presented is {subject}; its qualification and support remain separate.',
        'external_product.cpm_aurelia':'Mouse updates for {subject} apply to existing licensed users and tested application paths.',
        'external_product.bpi_client_server':'The networked business demonstration involves {subject}; configuration-specific recovery qualification still gates sales.',
        'technology.logix_tcpip_lan':'The networking workflow uses {subject}; demonstrate only qualified configurations.',
        'technology.abacus_formatted_tables':'Use {subject} in the prepared Artemis business examples.',
        'technology.abacus_embedded_pulse':'Demonstrate repeatable automation using {subject}, stating tested recovery and correctness limits.',
        'technology.flexibus':'Explain implementation and qualification requirements for {subject}.',
        'technology.logix_tui_standard':'Explain supported interaction behaviour under {subject}.',
        'product.aurelia_sdk':'Present {subject} to developers implementing supported interfaces.',
        'technology.logix_c_api':'Explain source portability through {subject}, with recompilation and testing still required.',
        'technology.logix_display_api':'Distinguish graphics API compatibility under {subject} from qualified display hardware.',
        'technology.logix_digital_video':'Explain the qualified monitor connection defined by {subject}; this is not a consumer television interface.'}
    for subject in c.get('subject_ids',[]):
        if subject=='external_product.bpi_suite':target=next(s for s in steps if s['id']==('bpi-session' if name=='ncc1978' else 'premiere'))
        elif name=='comdex1982':target=next(s for s in steps if s['id']=='dealer-follow-up')
        elif name=='ncc1979':target=next(s for s in steps if s['id']=='compatibility-guides')
        elif name=='ncc1980':target=next(s for s in steps if s['id']=='artemis-premiere')
        else:target=next(s for s in steps if s['type'] in ['presentation','demonstration','preparation'])
        if name=='comdex1982':
            role=('The CAD workflow demonstrates {subject} under separate Autodesk licensing and support.' if subject=='external_product.autocad_1_artemis' else 'The developer desk explains the workflow supported by {subject}.' if subject=='product.aion_development_team' else 'Include {subject} in follow-up configuration demonstrations and dealer consultations; participation here does not establish its initial launch.')
        else:role=reference_roles[subject]
        # Do not repeat an existing explicit reference parameter.
        if not any(p.get('ref_id')==subject for s in steps for b in s['marketing_presentation'] for p in b['parameters']):target['marketing_presentation'].append(block(role,subject=('ref',subject)))
    for step in steps:
        for i,b in enumerate(step['marketing_presentation'],1):b['number']=i
    after['marketing_steps']=steps
    for kind,items in arrays.items():assert all((kind,i) in coverage for i in range(len(items))),(name,kind,[i for i in range(len(items)) if (kind,i) not in coverage])
    elements=[{'record_type':'campaign','record_id':c['id'],'before':c,'after':after}]
    if parents:
        parent=parents[0];updated=copy.deepcopy(parent)
        updated['steps'].append({'number':max([s['number'] for s in updated['steps']]+[0])+1,'type':'action','description':'Coordinate the marketing campaign: '+c['title']+'.','campaign_id':c['id']})
        elements.append({'record_type':'process','record_id':parent['id'],'before':parent,'after':updated})
    rationale='Convert this campaign to an independent dated timeline object. Dates are resolved from its execution process without changing precision. Preserve all existing event/subprocess ownership; marketing-step reference_id is absent throughout. Consolidate presentations, campaign material and useful claim-policy requirements into narrated steps; remove historical acceptance labels and duplicate import fragments. Product-owned launch links remain authoritative and validated through the explicit transitional execution mapping.'
    if parents:rationale+=' Add the campaign alongside the unchanged execution-process step in '+parents[0]['id']+'.'
    if name=='ncc1978':rationale+=' '+duration_note+' Both source mentions of BPI leadership are retained; this proposal does not decide a later programme change.'
    if name=='tandy_model_ii_1979':rationale+=' Keep the marketing programme empty as requested in the earlier Model II review; no Tandy presentation details are invented.'
    proposals.append({'id':'change.campaign_timeline_'+name,'category':'foundation','title':'Campaign timeline — '+c['title'],'reason':rationale,'elements':elements})
    audits.append({'campaign_id':c['id'],'source_process_id':process['id'],'parent_process_id':parents[0]['id'] if parents else None,'coverage':[{'source':f'{k}/{i}','disposition':v} for (k,i),v in coverage.items()],'removed':dropped,'source_subjects':c.get('subject_ids',[]),'marketing_steps':len(steps),'presentation_blocks':sum(len(s['marketing_presentation']) for s in steps)})
if '--apply' not in sys.argv:
    print('Prepared',len(proposals),'proposals in memory. Pass --apply to update the review queue and evidence; foundation remains unchanged.')
    raise SystemExit()
queue=read('data_storytelling/change.json')
newids={p['id'] for p in proposals};affected={e['record_id'] for p in proposals for e in p['elements']}
for p in queue['change']:
    if p['id'] not in newids:assert not any(e['record_id'] in affected for e in p['elements']), 'Overlapping proposal '+p['id']
    else:assert [e['before'] for e in p['elements']]==[e['before'] for e in next(n for n in proposals if n['id']==p['id'])['elements']], 'Stale proposal baseline'
queue['change']=[p for p in queue['change'] if p['id'] not in newids]+proposals
write('data_storytelling/change.json',queue)
write('data_storytelling/review_evidence/campaign-timelines/proposals.json',{'change':proposals})
write('data_storytelling/review_evidence/campaign-timelines/audit.json',{'baseline_commit':'06fcd5c','campaigns':audits})
print('Prepared',len(proposals),'campaign proposals; foundation and authorizations untouched.')
