"""Prepare review proposals only; never write foundation or authorization files."""
import copy
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'data_storytelling/review_evidence/ssg-general-ledger'
before = {}
for path in (ROOT / 'data_foundation').glob('*.json'):
    for rows in json.loads(path.read_text()).values():
        if isinstance(rows, list):
            for r in rows:
                if isinstance(r, dict) and 'id' in r:
                    before[r['id']] = r

# Stable record IDs preserve references and review history. Publisher/product
# names change; legacy bpi IDs are not aliases or claims about the new publisher.
def rewrite(x):
    if isinstance(x, dict):
        return {k: rewrite(v) for k, v in x.items()}
    if isinstance(x, list):
        return [rewrite(v) for v in x]
    if not isinstance(x, str):
        return x
    x = x.replace('BPI Systems', 'Structured Systems Group')
    x = x.replace('BPI Products training', 'SSG General Ledger training')
    x = x.replace('BPI business applications', 'SSG General Ledger')
    x = x.replace('BPI client-server', 'SSG General Ledger client-server')
    x = x.replace('BPI applications', 'SSG General Ledger')
    x = x.replace('BPI application', 'SSG General Ledger application')
    x = x.replace('BPI (', 'SSG General Ledger (')
    x = re.sub(r'\bBPI\b', 'SSG', x)
    x = x.replace('consumer_bpi_suite', 'consumer_ssg_general_ledger')
    return x

after = {k: rewrite(v) for k, v in before.items()}
def rec(id): return after[id]
def item(n, t, description, **kw): return dict(number=n, type=t, description=description, **kw)
def participant(id, role): return dict(actor_id=id, role=role)
def date(value): return dict(value=value, precision='day')
def chapter(n, title, description): return dict(number=n, chapter_name=title, description=description)
def clause(key, kind, text): return dict(id='clause.ssg_'+key, kind=kind, statement=text, value=None, unit=None)
def add(record):
    assert record['id'] not in before
    after[record['id']] = record

rec('actor.bpi').update(name='Structured Systems Group', aliases=['SSG'], description='Independent software publisher in Oakland, California. Owns General Ledger, its CBASIC original and the AION C adaptations; maintains its own management, licensing, customer relationships and application support.')
add(dict(id='actor.keith_parsons', kind='person', name='Keith Parsons', description='President of Structured Systems Group; leads its commercial agreement and independent publishing commitments.'))
add(dict(id='actor.alan_cooper', kind='person', name='Alan Cooper', description='Structured Systems Group software developer and systems-development leader; directs General Ledger application semantics and acceptance within the porting partnership.'))

agreement = rec('agreement.bpi_offer')
agreement.update(title='AION Software–SSG General Ledger porting, distribution and training agreement', kind='cooperation', state='executed',
    description='AION Software and Structured Systems Group agree a funded adaptation of SSG General Ledger to native Z80 AION C and the Aurelia ROM TUI. SSG continues its original CBASIC product independently. AION funds tools, porting and qualification work to demonstrate its development platform; SSG retains the accounting product and its commercial proceeds. Logix provides the platform and distribution channel, with Academy training after its establishment.',
    party=[participant('actor.aion','funding and compiler/TUI engineering partner'), participant('actor.bpi','independent application owner and publisher'), participant('actor.logix','platform, distribution and training-channel partner')],
    clauses=[
        clause('scope','responsibility','Port the existing General Ledger work in progress to native Z80 C with Aurelia TUI interaction. Preserve its ledger rules and reporting, adapting implementation and user interaction rather than commissioning a new accounting suite. Receivables, payables, inventory and payroll modules are outside this agreement.'),
        clause('schedule','term','Sign on 28 July 1977; form the joint team and start development on 12 August 1977. SSG independently releases its vanilla CP/M CBASIC General Ledger on 15 January 1978. Release the Aurelia C/TUI edition during the joint AION C IDE morning presentation on 6 June 1978.'),
        clause('funding','funding','AION funds the agreed port, platform integration, qualification and documentation through milestones for a reconciled core, integrated TUI, pilot acceptance and release handover. This is development sponsorship, not an equity subscription or acquisition. SSG sales are not pledged to repay the sponsorship.'),
        clause('ownership','rights','SSG retains General Ledger application source, adaptations, branding, licensing, customer relationships and sales proceeds and profits. Adam, AION and Logix receive no equity, accounting-product ownership or application revenue share. There is no share-buyback arrangement.'),
        clause('reusable_tools','rights','AION retains its pre-existing compiler, libraries and reusable platform components. SSG receives continuing rights to build, distribute and maintain the supported General Ledger editions using the agreed redistributable runtime components. Confidential source access and demonstration permissions do not transfer application ownership to AION. Reusable tooling and public APIs remain available to competing publishers on the normal developer terms.'),
        clause('ssg_responsibility','responsibility','SSG supplies its CBASIC source and specifications as available, accounting expertise, representative test data and report baselines. It controls accounting policy, product acceptance, licensing, releases, defects and specialist customer support. Its vanilla CP/M release remains independently managed.'),
        clause('aion_responsibility','responsibility','Alex d’Agapeyeff assigns a protected London engineering team for the C port, tuned assembly kernels, TUI integration and test tooling without displacing the TUI, AION C IDE and Abacus teams. Gordon Letwin coordinates toolchain, ABI and DRI interfaces. Supply a stable development compiler and documented C/assembly and TUI contracts for the August start; remaining work on the public IDE concentrates on optimization, testing and product completion.'),
        clause('financial_acceptance','qualification','Match chart-of-accounts handling, journal posting, corrections, periods, balances, control totals and reports against SSG-approved reference cases. Preserve decimal amounts, required range and rounding, including cases exercising the original CBASIC 14-digit arithmetic. Use explicit decimal or suitably wide scaled-integer routines; ordinary binary floating point or 16-bit arithmetic is not a substitute for the financial contract.'),
        clause('performance','qualification','Compare the released CBASIC program and C/TUI port on the same named Aurelia hardware, disks and datasets. Match financial results first, then time validation, searches, posting and report preparation separately from disk and printer waits. Report build, configuration, memory and executable sizes. Do not promise a speed multiplier or attribute every interface gain to compilation; measure shared-ROM TUI calls and optimized libraries separately where practical.'),
        clause('support','responsibility','SSG maintains application defects, accounting behaviour and specialist support. Dealers handle installation enquiries, Logix supports hardware, and AION supports its compiler and platform interfaces. After its establishment, Logix Computer Academy provides SSG-authorised General Ledger training, setup assistance and distribution under SSG licensing authority; software licences, courses and setup services remain distinct.'),
        clause('later_work','term','Treat subsequent platform and client/server adaptations as separately scoped phases with acceptance and source/build handover. Client/server work demonstrates networking and recovery; it does not turn AION into an accounting-software vendor. No automatic Apple II release, universal portability, statutory payroll coverage or continuing engineering retainer is included.'),
        clause('handover','responsibility','At each phase completion, deliver source, build scripts, interface documentation, regression data and maintainer training to SSG. End the special application-development assignment after accepted delivery and agreed defect correction; SSG then develops and supports the product independently while ordinary platform support remains available.'),
    ])
cap=rec('agreement.cap_acquisition')
for c in cap['clauses']:
    if c['id']=='clause.cap_programme': c['statement']='Maintain a separately budgeted product programme for the CP/M TUI API, AION C IDE and Abacus, with capacity for independently owned application ports. Continuing CAP work and Alex’s initiatives must preserve the programme’s agreed staffing and delivery commitments. Any later SSG General Ledger work is governed by a separate agreement, not by this acquisition.'

offer=rec('event.bpi_offer')
offer.update(title='AION Software and SSG sign General Ledger porting agreement', time=date('1977-07-28'),
    description='AION Software and SSG sign the General Ledger C/TUI porting agreement. Alex d’Agapeyeff commits London engineering capacity; Keith Parsons represents the independent publisher. SSG supplies its existing General Ledger development and accounting expertise while retaining the separate CBASIC release. AION funds the agreed adaptation and qualification, with no equity stake or share of application sales. The Aurelia port will launch with AION C IDE on the morning of 6 June 1978.',
    participant=[participant('actor.aion','funding and development partner'),participant('actor.alex_dagapeyeff','AION Software CEO'),participant('actor.bpi','application owner and publisher'),participant('actor.keith_parsons','SSG president'),participant('actor.logix','platform and distribution partner')],
    inputs=[item(1,'resource','SSG brings General Ledger source under development and accounting specifications; this is not yet its January 1978 commercial CBASIC release.'),item(2,'resource','AION Software’s London product programme supplies compiler, TUI and integration engineering capacity.',event_id='event.cap_acquisition_closed')],
    outcomes=[item(1,'decision','Commission the funded General Ledger port, its joint team, acceptance tests and June 1978 release. SSG retains all application ownership and independent commercial operations.')])
kickoff=rec('event.bpi_cooperation')
kickoff.update(title='Joint SSG–AION General Ledger team formed; port development starts',kind='activity',time=date('1977-08-12'),
    description='SSG and AION form the porting team and begin work. Alan Cooper leads SSG application design and accounting acceptance; Alex assigns London C/application, assembly-library, TUI and test engineers, with Gordon Letwin coordinating tools and platform interfaces. SSG continues the CBASIC branch. The team baselines the working C compiler, numeric and file formats, ABI and TUI interface, then starts a headless ledger port and automated result comparisons before integrating forms.',
    participant=[participant('actor.bpi','application source and domain expertise'),participant('actor.alan_cooper','SSG application technical lead'),participant('actor.aion','port and test engineering'),participant('actor.alex_dagapeyeff','staffing and delivery sponsor'),participant('actor.letwin','compiler, ABI and DRI liaison')],
    inputs=[item(1,'resource','The signed agreement authorises funded development and defines ownership and acceptance.',event_id='event.bpi_offer'),item(2,'requirement','A working development compiler, linker, assembly interoperability and stable interface baseline are available for the port; optimizer tuning and public IDE packaging continue without changing the agreed application contracts.')],
    outcomes=[item(1,'result','The joint team starts implementation with a shared source, build and regression process. Application acceptance remains SSG’s responsibility; platform interface defects are assigned to AION or DRI through Letwin.')])

add(dict(id='external_product.ssg_general_ledger_cbasic',name='SSG General Ledger — vanilla CP/M / CBASIC edition',
    description='SSG’s independently published General Ledger for ordinary 8080/Z80 CP/M systems, released on 15 January 1978. CBASIC compiles source to intermediate code executed by its runtime interpreter; this is not native Z80 compilation. The accounting environment provides 14-digit arithmetic. The exact General Ledger revision, CBASIC compiler revision and runtime revision are unspecified. It needs no Aurelia ROM TUI and remains a separately maintained product and the functional reference for the Aurelia port.',
    specification=[dict(no=1,description='SSG publishes, licenses and supports the original CBASIC application.',ref_id='actor.bpi',ref_role='application owner and publisher')]))
add(dict(id='event.ssg_cbasic_release',title='SSG releases General Ledger for vanilla CP/M',kind='launch',time=date('1978-01-15'),
    description='SSG releases General Ledger written in CBASIC for vanilla CP/M. Its compiled intermediate code runs under the CBASIC runtime interpreter. The original remains available independently while the joint team continues the native C/TUI Aurelia port. Preserve this release as the controlled accounting and performance baseline; no exact numbered application or runtime revision is assigned.',
    participant=[participant('actor.bpi','independent publisher')],inputs=[],outcomes=[item(1,'result','The original CP/M/CBASIC General Ledger is commercially released under SSG ownership and support.',subject_ids=['external_product.ssg_general_ledger_cbasic'])]))
pilot=rec('event.bpi_pilot')
pilot.update(title='SSG General Ledger business and accountant pilot programme',description='Target 10–15 pilot businesses and several accounting practices for the Aurelia C/TUI General Ledger. Reconcile the January CBASIC release and port against identical records, including postings, corrections, period-end totals and reports. Exercise TUI data entry, backup/restore, interruption recovery, disk-full and memory limits. Pilot participation does not itself establish acceptance.')
pilot['inputs']=[item(1,'resource','The native C/TUI candidate is the application under test.',subject_ids=['software_edition.bpi_suite']),item(2,'resource','The released vanilla CP/M/CBASIC application provides the reference results and comparison baseline.',subject_ids=['external_product.ssg_general_ledger_cbasic'])]
pilot['outcomes']=[item(1,'qualification','Record reconciled financial results, supported resource limits and unresolved defects. Measure responsiveness on the same Aurelia configuration without inferring speed from language alone; approve only configurations that pass recovery and financial checks.',subject_ids=['software_edition.bpi_suite'])]
add(dict(id='process.ssg_general_ledger_port',title='SSG General Ledger AION C/TUI port',kind='development',description='Develop and qualify the Aurelia adaptation of SSG’s General Ledger. The existing ledger work supplies the application semantics; AION contributes tools, integration and focused implementation support. The CBASIC release and C/TUI port remain distinct products.',
    participant=[participant('actor.bpi','application owner and acceptance authority'),participant('actor.aion','funded porting and tools engineering'),participant('actor.alan_cooper','application technical lead'),participant('actor.letwin','platform interface liaison')],
    period=dict(start=date('1977-08-12'),end=date('1978-06-06')),
    inputs=[item(1,'resource','The agreement establishes the port scope and funded responsibilities.',event_id='event.bpi_offer')],
    steps=[item(1,'milestone','Form the joint team and begin development.',event_id='event.bpi_cooperation'),item(2,'action','Port ledger logic and explicit decimal routines first; use regression fixtures while SSG independently completes its CBASIC release.'),item(3,'milestone','SSG releases the vanilla CP/M edition; freeze a copy and its runtime for regression and same-machine comparisons.',event_id='event.ssg_cbasic_release'),item(4,'action','Integrate bounded TUI forms, lists, account tables, selection controls and buttons with shared editing, Tab navigation, shortcuts and copy/paste. Link measured assembly kernels and use the ROM TUI through documented bank-safe calls.'),item(5,'milestone','Run business and accountant qualification pilots.',event_id='event.bpi_pilot'),item(6,'action','Complete reconciled reports, migration checks, error/recovery tests, resource measurements and instructor preparation. Hand over a reproducible release build for the June 6 joint presentation.')],
    outcomes=[item(1,'deliverable','Deliver SSG’s native Z80 C/TUI General Ledger adaptation, source/build material, reconciled regression suite and maintenance documentation for its June 6 release. Qualification records identify supported configurations; SSG retains release and application ownership.',subject_ids=['software_edition.bpi_suite'])]))

inc=rec('process.computer_business_incorporation')
inc['description']=inc['description'].replace('DRI, SSG and others','DRI and other early partners')
inc['participant']=[p for p in inc['participant'] if p['actor_id']!='actor.bpi']
inc['steps']=[s for s in inc['steps'] if s.get('event_id')!='event.bpi_cooperation']
inc['outcomes'][1]['description']='Cooperation with DRI is established under its agreements while preserving its specified independence and rights. The later SSG agreement belongs to Aurelia’s partnership programme.'
foundation=rec('process.aurelia_foundation')
foundation['description']='Establish Aurelia’s CP/M, printer, retail and Academy partnerships and sponsor the independent SSG General Ledger C/TUI port. The SSG agreement is signed on 28 July 1977 and its development team starts on 12 August. Coordinate the June 1978 launch campaign and Academy follow-up through 17 July, including cleared presentation recordings.'
foundation['outcomes'][1]['description']='The funded SSG port and qualification programme support an independently owned General Ledger release, dealer preparation and Academy training. SSG retains application ownership, licensing, sales proceeds and specialist support; there is no AION equity or share-buyback arrangement.'
foundation['steps']=[s for s in foundation['steps'] if s.get('event_id')!='event.bpi_pilot' and s['number'] not in [6,7,8]]
foundation['steps'][0]['description']='Sign the funded SSG General Ledger porting agreement on 28 July 1977.'
foundation['steps'].append(item(12,'action','Form the joint team on August 12 and deliver the SSG General Ledger port through its development and qualification programme.',process_id='process.ssg_general_ledger_port'))
for s in foundation['steps']:
    if s['number']==11:s['description']='Alex protects the London TUI, AION C IDE and Abacus teams from 1975 onward. A working compiler and stable library/ABI contracts support application development in 1977; optimization, testing and IDE completion continue toward the June 1978 public release. Allocate the separate SSG port team in August 1977 and review integration and staffing without displacing inherited CAP customer commitments.'
ass=rec('assumption.open_ecosystem')
ass['statements']=[s for s in ass['statements'] if 'ownership separation around 1985' not in s]
ass['statements'] += ['SSG owns General Ledger and its adaptations throughout; AION sponsors defined porting and networking work without equity, application ownership or a share of application sales. Competing accounting publishers can use the same published platform interfaces.']
ass=rec('assumption.clone_localisation')
ass['statements']=[s.replace('WordStar, dBASE and SSG; statutory accounting/payroll adaptation requires separate local qualification.','WordStar, dBASE and SSG General Ledger; local accounting requirements and language editions require separate publisher approval and qualification.') for s in ass['statements']]

# The Aurelia release and later native edition remain ledger applications, not
# five-module suites. Preserve supported hosts and native/legacy separation.
ledger_features=['custom charts of accounts','single or multiple departments','validated journal entry and posting','corrections and audit records','period balances and trial balance','customisable financial reports','backup, restore and reconciled summary export']
for id in ['software_edition.bpi_suite','software_edition.bpi_suite.era']:
    r=rec(id); era=id.endswith('.era')
    r['family_name']='SSG General Ledger'
    r['description']='SSG-owned General Ledger implemented in AION C with the shared TUI, explicit decimal accounting rules and versioned record files. '+('The separate native ERA/AIONix build requires target-specific qualification.' if era else 'The Aurelia port executes native Z80 application code and calls assembler-written ROM TUI services in XIP mode; writable application state remains in RAM.')
    td=r['composition_history'][0]['technical_definition']
    td['implementation'].update(database='Versioned ledger record files with bounded buffers and application-level access routines; no general relational engine is required for this standalone edition.')
    td['modules']=[dict(name='SSG General Ledger',features=ledger_features)]
    td['specification']['summary_export']['scope']='Selected account balances and monthly totals become independent Abacus planning inputs through a versioned disk file. Close General Ledger before loading Abacus; there is no automatic ledger write-back or live database link.'
    td['specification']['financial_correctness']='Use explicit decimal or sufficiently wide scaled-integer routines with documented range, rounding and overflow handling. Reconcile CBASIC reference reports and cases exercising 14-digit precision before timing the port. Preserve posting and recovery semantics.'
    td['specification']['tui']='Bounded text fields, lists, account tables, selection dropdowns and buttons use Tab/Shift-Tab, shortcuts, shared selection/editing and copy/paste. Composite controls may be SDK helpers over ROM primitives. Text mode is the baseline; bitmap rendering is optional only on qualified configurations.'
    td['specification']['performance']='Measure native code, selected C/assembly libraries and ROM TUI call/bank-switch costs. Compare identical datasets and financial outputs on the same hardware; report CPU work separately from disk and printer waits without a promised speed ratio.'
    for line in r['composition_history'][0]['composition_definition']:
        if line['id']=='line_3':line['quantity']=1
    ch=r['technical_specification']['chapters']
    ch[0]=chapter(1,'General Ledger implementation','General Ledger maintains custom charts of accounts, departments, journal entries, corrections, period balances and financial reports. The AION C implementation uses versioned record files and bounded buffers; the standalone release does not depend on a general relational database or include receivables, payables, inventory or payroll modules. Performance-critical string, record and decimal routines may be written in assembly and linked through the published ABI. Application code and state run in RAM; shared assembler-written TUI code executes from the system ROM through bank-safe calls.')
    if era:ch[0]['description']=ch[0]['description'].replace('Application code and state run in RAM; shared assembler-written TUI code executes from the system ROM through bank-safe calls.','This native ERA build uses AIONix-mediated TUI and display services with target-specific runtime libraries; it does not reuse Z80 binaries or assume the Aurelia ROM-bank arrangement.')
    ch[1]['description']=td['specification']['summary_export']['scope']+' Reconcile counts and control totals, validate decimals and quoting, and test disk-full, memory exhaustion and save/reopen. Label prepared demonstration data.'
    ch[3]['description']=ch[3]['description'].replace('application suite','General Ledger application')+' One distribution diskette is the package assumption; installation, working-data space and any media exchanges require qualification.'
    ch += [chapter(5,'Financial equivalence and recovery',td['specification']['financial_correctness']+' Test maximum balances, reversals, period closing, interrupted updates, disk-full handling and backup restoration. On-disk values use explicit encodings, not raw C structures.'),chapter(6,'Forms and measured performance',td['specification']['tui']+' '+td['specification']['performance'])]
    # These authored chapters are canonical; do not extend the frozen legacy
    # compatibility-object schema with new specification properties.
    for key in ['financial_correctness','tui','performance']:del td['specification'][key]
    if not era:r['composition_history'][0]['effective_from']=dict(kind='event',event_id='event.aurelia_developer_presentation')
    external=rec('external_product.bpi_suite'+('.era' if era else ''))
    external['description']=('SSG General Ledger for Artemis/AIONix uses a separately built native ERA implementation.' if era else 'SSG General Ledger for Aurelia and Aurelia+ uses a native Z80 AION C implementation and the shared ROM TUI; its Aurelia release is on 6 June 1978.')+' SSG owns and licenses the application and maintains specialist support. The package covers General Ledger, not a five-module accounting suite. Selected ledger balances and period totals can be exported to Abacus through a reconciled, versioned disk file. AION engineering sponsorship and Logix distribution confer no application ownership.'
    for s in external['specification']:s['description']=s['description'].replace('implementation, modules,','implementation, ledger functions,').replace('these business applications','General Ledger')
tech=rec('technology.bpi_relational_database')
tech.update(name='SSG General Ledger data and transaction architecture',description='Ledger file and numeric contracts, with a separately qualified client/server transaction service for the later network edition.',kind='software_method',specification=[dict(number=1,chapter_name='Standalone ledger data',description='Standalone SSG General Ledger uses explicitly encoded chart, journal and balance records, bounded access buffers, consistent decimal rules and auditable corrections. Its 1978 C/TUI port preserves the original application semantics without requiring a relational database engine or additional accounting modules.',parameters=[]),dict(number=2,chapter_name='Later network transaction service',description='The later client/server edition moves ledger validation, posting, queries and durable transactions to the server. Its defined relational service, logging, checkpoint, duplicate-request handling and restoration design require independent qualification; these capabilities are not attributed to the January or June 1978 standalone releases.',parameters=[])])

# Merge the partner release into the existing morning developer event. All
# references to the retired afternoon event are changed in the same review unit.
after['event.bpi_launch']=None
joint=rec('event.aurelia_developer_presentation')
joint.update(title='NCC morning launch: AION C IDE and SSG General Ledger for Aurelia',description='On the morning of 6 June 1978 at NCC in Anaheim, AION, Logix and SSG jointly launch AION C IDE, the Software Developer Package and the Aurelia C/TUI port of SSG General Ledger. The developer workflow edits, builds and debugs a RAM application, links an assembly library and shows bounded forms with tested text/bitmap presentation. SSG then demonstrates the port of its already released CP/M application, reconciled summary export to Abacus and a same-Aurelia comparison with the January CBASIC original. The combined presentation retains separate publisher branding, licensing and support and ends with shared questions; there is no separate afternoon accounting presentation.')
joint['participant'] += [participant('actor.bpi','independent publisher presenting General Ledger'),participant('actor.alan_cooper','application and port demonstration'),participant('actor.keith_parsons','SSG ownership, sales and support explanation')]
joint['inputs'] += [item(2,'resource','The qualified C/TUI build supplies the independently licensed General Ledger demonstration.',subject_ids=['software_edition.bpi_suite']),item(3,'resource','The released CBASIC program and its retained runtime provide the original-edition comparison.',subject_ids=['external_product.ssg_general_ledger_cbasic'])]
joint['outcomes'][0]['description']='AION C IDE and its development package launch alongside SSG General Ledger for Aurelia. Show identical financial results before measured timings and resource figures; demonstrate the contribution of native code, tuned libraries and the ROM TUI without an unverified speed multiplier.'
joint['outcomes'][1]['description']='Supply full-session recordings and production masters of the combined tools and General Ledger presentation and questions for cleared redistribution, retaining SSG branding and application-support responsibilities.'
joint['outcomes'].append(item(3,'result','SSG releases its independently owned Aurelia General Ledger port; software licences and Academy training remain distinct from the computer and development-tool purchases.',subject_ids=['external_product.bpi_suite']))
rec('event.aurelia_launch')['description']='Aurelia premieres on 5 June 1978 with startup, common editing, safe peripheral attachment, Business Tools and the eight-minute Abacus demonstration. Partners explain their roles; Academy and dealer configurations follow, with the official Academy launch announced for 16 June. Announce the combined AION C IDE, Software Developer Package and SSG General Ledger port launch for the following morning, June 6. Questions follow the premiere presentation.'
rec('software_edition.simple_c_z80')['composition_history'][0]['effective_from']=dict(kind='event',event_id='event.aurelia_developer_presentation')
rec('software_edition.simple_c_z80')['technical_specification']['chapters'][-1]['description'] += ' SSG General Ledger is an external acceptance workload: reconcile CBASIC and C financial results, measure native application work and ROM TUI overhead separately, and keep the publisher’s source and accounting rules outside the reusable IDE product.'
for id in ['event.academy_launch','product.proposed_aurelia_accounts']:
    def launchrefs(x):
        if isinstance(x,dict):return {k:launchrefs(v) for k,v in x.items()}
        if isinstance(x,list):return [launchrefs(v) for v in x]
        return 'event.aurelia_developer_presentation' if x=='event.bpi_launch' else x
    after[id]=launchrefs(after[id])

c=rec('campaign.ncc1978')
c['message'][-1]='Business Tools organise office work; Abacus supports planning; independently owned SSG General Ledger maintains accounting records. AION supplies tools and porting support while SSG owns and sells the application.'
premiere=next(s for s in c['marketing_steps'] if s['id']=='aurelia-premiere')
for b in premiere['marketing_presentation']:
    if b['number']==10:b['description']=b['description'].replace('Aurelia pricing','Aurelia configurations')
    if b['number']==11:
        b['description']='{speaker} introduces {ide} and announces a single joint tools and General Ledger presentation on {developer_session}. {software_company} and {application_company} have adapted the independently owned ledger to native C and the shared TUI; the morning session releases the port and demonstrates how it was built.'
        b['parameters']=[p for p in b['parameters'] if p['key']!='business_session']
    if b['number']==13:
        b['description']=b['description'].replace(' under {certification_terms}','')
        b['parameters']=[p for p in b['parameters'] if p['key']!='certification_terms']
    if b['number']==14:
        b['description']='Close with questions. Keep reminders on screen for the joint AION C IDE and SSG General Ledger launch ({developer_session}), ComputerLand sales premiere ({retail_date}) and Logix Academy launch ({academy_date}).'
        b['parameters']=[p for p in b['parameters'] if p['key']!='business_session']
dev=next(s for s in c['marketing_steps'] if s['id']=='developer-session')
dev['description']='Launch AION C IDE, the Software Developer Package and SSG General Ledger for Aurelia together on the morning of 6 June 1978.'
dev['marketing_presentation'] += [dict(number=4,description='SSG demonstrates its General Ledger port within the same presentation: select a chart and department, enter and validate a balanced journal, correct an entry, review account balances and print a report. Show bounded forms, account tables, dropdown selection, Tab navigation, shortcuts and shared editing/copy-paste. This is a port of the separately released CBASIC product, not the launch of an accounting suite.',parameters=[]),dict(number=5,description='Compare the original CP/M/CBASIC release and native C/TUI port on the same Aurelia configuration with identical data and financial outputs. Identify runtime/build versions actually tested, compiler options, RAM, drives and cache conditions. Time validation, lookup, posting and report preparation separately from physical printing. Measure ROM TUI and assembly-library contributions; publish measured results only, with no promised multiplier or claim that language alone explains all responsiveness.',parameters=[]),dict(number=6,description='Export selected ledger balances and period totals through the documented disk file, close General Ledger, then open Abacus and reconcile imported control totals. SSG explains independent ownership, licensing, sales and specialist support. Finish the combined presentation with shared questions and record the full session under the agreed partner clearances.',parameters=[])]
c['marketing_steps']=[s for s in c['marketing_steps'] if s['id']!='bpi-session']
for s in c['marketing_steps']:
    if s['id']=='academy':
        s['description']='Launch Logix Computer Academy and SSG General Ledger training on 16 June 1978.'
        s['marketing_presentation'][1]['description']='The {launch_date} Academy launch includes SSG-authorised General Ledger courses, direct distribution, dealer preparation and access to SSG specialist help. Teach chart setup, journal entry, corrections, reports, period-end work, backup/restore and reconciled Abacus summary export. Dealers handle installation, SSG handles application defects and accounting questions, and Logix handles hardware. Software licences, courses and setup services are separate offerings.'
    if s['id']=='customer-follow-up':
        s['marketing_presentation'][0]['description']='Prepare General Ledger year-end workshops and supported-edition update demonstrations. Keep customer data under customer control and obtain consent before using case studies or endorsements. This is follow-up planning, not a claim that year-end work is complete within the campaign period.'
        s['marketing_presentation'][1]['description']='Expand demonstrations and qualified support using verified General Ledger customer results. Any SSG Model II or Apple II port requires a separate scope, build and qualification; the existing Tandy agreement covers Abacus only.'
    # Clarify prose which referred to an unspecified range of accounting titles.
    for b in s['marketing_presentation']:
        b['description']=b['description'].replace('SSG applications','SSG General Ledger').replace('SSG report','SSG General Ledger report').replace('SSG programme','SSG General Ledger programme')

academy=rec('event.academy_launch')
academy['title']='Official Logix Computer Academy launch, including SSG General Ledger training'
academy['description']='On 16 June 1978, Logix Computer Academy launches its public programme, including Aurelia Fundamentals and SSG-authorised General Ledger courses and distribution. Teach setup, journal entry, corrections, reporting, period-end work, backup/restore and Abacus summary export. Each initial centre has access to SSG specialist help. Dealers handle installation enquiries, SSG handles application defects and accounting support, Logix supports hardware and AION supports platform tools. Courses, setup services and software licences remain separate offerings.'
academy['inputs'][0]['description']='The combined June 6 AION C IDE and SSG General Ledger presentation releases the Aurelia port used in the courses and dealer demonstrations.'
academy['inputs'][1]['description']='SSG’s separately licensed General Ledger for Aurelia is the application taught and distributed; the Academy does not own the accounting product.'
academy['outcomes'][1]['description']='SSG-authorised General Ledger courses, distribution and dealer preparation begin with defined support boundaries. Plan later year-end workshops and supported-edition updates based on verified customer results.'
training=rec('product.service_bpi_training')
training['description']='SSG-authorised practical General Ledger training supplied by Logix Computer Academy, initially for the Aurelia C/TUI edition. Later native and network courses use only released, qualified editions. Application licensing and specialist accounting support remain with SSG.'
training['specification'] += [dict(number=2,type='scope',description='Practical General Ledger workflows taught with a reconciled sample company.',value='Chart setup, journal entry, corrections, balances and reports, period-end procedures, backup/restore and Abacus summary export'),dict(number=3,type='exclusion',description='Keep software licensing and unrelated accounting modules outside the course entitlement.',value='Separate SSG software licence; no payroll, inventory, receivables or payables course implied'),dict(number=4,type='support',description='Explain the support route used after training.',value='Dealers: installation; SSG: accounting and application defects; Logix: hardware; AION: platform tools')]
for id in ['product.proposed_aurelia_accounts','product.proposed_aurelia_plus_accounts','product.retail.business_accounts','product.proposed_artemis_accounts','product.computer_system_retail_connected_office','product.computer_system_proposed_artemis_pro_small_office']:
    r=rec(id)
    r['description']=r['name']+' combines the recorded hardware and software configuration with the separately identified SSG General Ledger edition. SSG retains application licensing and specialist support; the bundle does not imply additional accounting modules or transfer application ownership to Logix.'
for id,r in after.items():
    if r and id.startswith('base_part.') and 'bpi' in id:
        r['description'] += ' Supplied for the SSG General Ledger edition under SSG publishing authority; Logix physical fulfilment does not confer software ownership.'

# Later network service remains deliberately scoped, with the existing recovery
# design preserved rather than rebranding an unsubstantiated full application suite.
for id in ['software_edition.bpi_client_server','software_edition.bpi_client_server.era_client','software_edition.bpi_client_server.era_server']:
    r=rec(id);r['family_name']='SSG General Ledger'
    r['description']=r['name']+' provides the separately qualified networked ledger generation. SSG owns the application; AION supplies finite platform/integration assistance followed by source/build handover. Journal validation, posting and durable data changes execute on the server.'
    def network_scope(x):
        if isinstance(x,dict):return {k:network_scope(v) for k,v in x.items()}
        if isinstance(x,list):return [network_scope(v) for v in x]
        if not isinstance(x,str):return x
        return x.replace('post invoice/payment/journal','post journal/reversal').replace('Cross-module posting','Journal and balance posting').replace('Cross-module postings','Journal and balance postings').replace('Concurrent invoice/payment updates','Concurrent journal postings and account inquiries').replace('posting a payment twice','posting a journal twice').replace('post the same payment twice','post the same journal twice').replace('SSG transactional client/server v1','SSG General Ledger transactional client/server v1')
    after[id]=network_scope(r)
    after[id]['technical_specification']['chapters'][0]['description']='The scope is SSG General Ledger journals, balances, queries and reports. '+after[id]['technical_specification']['chapters'][0]['description']
rec('external_product.bpi_client_server')['description']='SSG’s General Ledger client/server package combines an Artemis PRO/AIONix server with AIONix and CP/M clients. Thin clients submit bounded ledger operations; queries, validation, journal posting and durable transactions execute on the server. Authentication, locking, backup and crash-recovery qualification govern supported configurations. SSG retains application ownership, licences, sales and specialist support. AION’s separately scoped engineering work ends with acceptance, maintainer training and source/build handover. The package supplies the three implementation editions and existing licence/packaging items; no new per-seat licensing policy or additional accounting modules are implied.'
net=rec('process.artemis_networking_development')
net['steps'][1]['description']='Integrate the SSG General Ledger client/server adaptation, preserving ledger correctness and bounded clients. Prepare configuration-specific authentication, locking, durable posting, duplicate-retry, backup and crash-recovery tests.'
net['steps'].append(item(5,'action','At acceptance of the separately scoped SSG networking phase, hand over source, reproducible builds, regression/recovery tests and maintainer training. End the special application-development assignment after agreed defect correction; SSG alone owns future product development and specialist support.'))
net['outcomes'][0]['description']=net['outcomes'][0]['description'].replace(' or forecast revenue from unpriced larger storage','')
net['outcomes'].append(item(4,'result','The finite networking demonstration partnership defines acceptance and handover to SSG. Unfinished qualification postpones acceptance rather than creating an indefinite AION accounting-product obligation.'))
rec('event.network_launch')['description']='Present TCP/IP networking, Artemis PRO and Aurelia/Artemis network upgrades with the separately licensed SSG General Ledger client/server generation. Demonstrate shared ledger work through bounded clients and a server transaction service; durable posting, recovery and configuration-specific capacity require qualification.'
rec('event.network_pilots')['description']=rec('event.network_pilots')['description'].replace('larger storage remains unpriced and contributes no forecast revenue','larger repositories require separately qualified storage')+' SSG retains General Ledger acceptance and maintenance, and the funded integration phase closes only after its agreed recovery tests and source/build handover.'
rec('market_response.network_pilots')['description']=rec('market_response.network_pilots')['description'].replace('larger storage remains unpriced and contributes no forecast revenue','larger repositories require separately qualified storage')

# Keep the independent Abacus payslip/layout example, but do not pretend GL is
# its payroll engine. The partner demo is a separate ledger-summary workflow.
plus=rec('event.plus_launch')
plus['description']=plus['description'].replace('The head of independent SSG follows Abacus with the source payroll and reconciled file-exchange workflow, and joins the partner segment.','SSG follows Abacus with General Ledger account balances and a separate reconciled summary-export workflow, and joins the partner segment. The fictitious precalculated payslip data is an Abacus layout example, not output from an SSG payroll product.')
plus['inputs'][0]['description']='SSG General Ledger supplies ledger balances and a reconciled summary file for a separate Abacus planning demonstration. It does not calculate the fictitious payslip example. This is later promotion of the existing Aurelia edition.'
comdex=rec('campaign.comdex1979')
for s in comdex['marketing_steps']:
    for b in s['marketing_presentation']:
        b['description']=b['description'].replace('Reconcile SSG-exported values with source totals through documented versioned disk-file exchange','Reconcile the separately demonstrated SSG General Ledger balances through versioned disk-file exchange; the fictitious employee values in this layout demonstration are not an SSG payroll export')
        b['description']=b['description'].replace('The head of independent SSG demonstrates SSG Payroll as the source of calculated values, documented file exchange and reconciled totals.','An SSG representative demonstrates General Ledger balances, period reports and a separate reconciled export to Abacus. No SSG payroll module or payroll calculation is presented.')
artemis=rec('campaign.ncc1980')
for s in artemis['marketing_steps']:
    for b in s['marketing_presentation']:
        b['description']=b['description'].replace('independent SSG head demonstrates accounting','SSG demonstrates General Ledger on its qualified CP/M legacy path; a native ERA port remains a separately qualified later edition').replace('Native Abacus 2, Business Tools and qualified independent SSG editions.','Native Abacus 2 and Business Tools; SSG General Ledger uses its qualified CP/M legacy path at this presentation. The separate native ERA edition is not claimed released here.')
        for p in b['parameters']:
            if p.get('ref_id')=='external_product.bpi_suite.era':p['ref_id']='external_product.bpi_suite'
rec('event.artemis_launch')['description']=rec('event.artemis_launch')['description'].replace('The head of independent Structured Systems Group presents after Abacus and joins the partner section; SSG retains separate branding, licences, support and receipts.','SSG demonstrates General Ledger after Abacus on a qualified CP/M compatibility configuration and joins the partner section; its native ERA edition requires separate release and qualification. SSG retains separate branding, licences, support and receipts.')
# Pure legacy references may not need edits; meaningful product prose must be explicit.
for id,r in list(after.items()):
    if r and id.startswith(('campaign.','process.','event.')):
        def explicit(x):
            if isinstance(x,dict):return {k:explicit(v) for k,v in x.items()}
            if isinstance(x,list):return [explicit(v) for v in x]
            if not isinstance(x,str):return x
            return x.replace('SSG applications','SSG General Ledger').replace('SSG editions','SSG General Ledger editions').replace('SSG records','SSG General Ledger records').replace('Show SSG only','Show SSG General Ledger only')
        after[id]=explicit(r)

# Each record is owned by exactly one small proposal. The launch rewiring is
# atomic; unchanged stable IDs allow the other groups to be reviewed separately.
groups=[
 ('agreement','Agreement, independent ownership and the 1977–78 development schedule',[
  'actor.bpi','actor.keith_parsons','actor.alan_cooper','agreement.bpi_offer','agreement.cap_acquisition','event.bpi_offer','event.bpi_cooperation','event.bpi_pilot','event.ssg_cbasic_release','external_product.ssg_general_ledger_cbasic','process.ssg_general_ledger_port','process.computer_business_incorporation','process.aurelia_foundation','assumption.open_ecosystem','assumption.clone_localisation']),
 ('aurelia_edition','Define the native C/TUI General Ledger port and its acceptance contract',['software_edition.bpi_suite','external_product.bpi_suite','technology.bpi_relational_database']),
 ('joint_launch','Combine the June 6 morning launches and align Academy announcement',['campaign.ncc1978','event.aurelia_launch','event.aurelia_developer_presentation','event.bpi_launch','event.academy_launch','product.proposed_aurelia_accounts','software_edition.simple_c_z80']),
 ('training_packages','Align SSG General Ledger training, bundles and distribution materials',[id for id in before if (id.startswith('base_part.') and 'bpi' in id) or id in ['product.service_bpi_training','product.proposed_aurelia_plus_accounts','product.retail.business_accounts','product.proposed_artemis_accounts','product.computer_system_retail_connected_office','product.computer_system_proposed_artemis_pro_small_office']]),
 ('abacus_early','Use SSG ledger summaries in Abacus 1 and Abacus 2',['software_edition.abacus_1','software_edition.abacus_1.model_ii','software_edition.abacus_2']),
 ('abacus_platform','Align later Abacus imports and shared platform services',['software_edition.abacus_2.era','software_edition.abacus_3','software_edition.cpm_aurelia','software_edition.cpm_aurelia_networking','software_edition.aionix_server']),
 ('native_edition','Define the separate native AIONix General Ledger edition',['software_edition.bpi_suite.era','external_product.bpi_suite.era']),
 ('network_clients','Scope network clients to SSG General Ledger',['software_edition.bpi_client_server','software_edition.bpi_client_server.era_client']),
 ('network_server','Scope the transaction server and package to SSG General Ledger',['software_edition.bpi_client_server.era_server','external_product.bpi_client_server']),
 ('later_presentations','Align 1979–80 partner demonstrations and remove the payroll implication',['campaign.ncc1979','campaign.comdex1979','campaign.ncc1980','event.plus_launch','event.artemis_launch','process.comdex1979_preparation','process.comdex1979_campaign','process.ncc1980_campaign']),
 ('network_handover','Align networking, recovery pilots and independent maintenance handover',['campaign.ncc1981','event.network_launch','event.network_pilots','event.clone_january_launch','market_response.network_pilots','process.ncc1981_campaign','process.artemis_networking_development']),
]
proposals=[];used=set()
for number,(suffix,title,ids) in enumerate(groups,1):
    elements=[]
    for id in ids:
        assert id not in used,id
        used.add(id)
        if before.get(id)==after.get(id):continue
        elements.append(dict(record_type=id.split('.')[0],record_id=id,before=before.get(id),after=after.get(id)))
    assert elements
    deps=[] if number==1 else ['change.ssg_agreement']
    if number>=3:deps.append('change.ssg_aurelia_edition')
    if suffix=='joint_launch':pass
    if suffix in ['training_packages','later_presentations']:deps.append('change.ssg_joint_launch')
    if suffix=='network_handover':deps += ['change.ssg_network_clients','change.ssg_network_server']
    p=dict(id='change.ssg_'+suffix,category='data',title=f'{number}. SSG General Ledger — {title}',reason='Replace the former BPI scenario with the author-requested independent SSG General Ledger partnership. Use the confirmed story dates: agreement 1977-07-28, team/development 1977-08-12, vanilla CP/M/CBASIC release 1978-01-15 and joint AION C/General Ledger Aurelia launch on the morning of 1978-06-06. SSG retains application ownership and sales; AION funds bounded porting and later networking work, not an equity investment. Preserve stable legacy record IDs for reference and review continuity; displayed identities and product scope are SSG General Ledger. Exact original GL/runtime revisions and speed ratios remain unverified. See review_evidence/ssg-general-ledger for source distinctions, scope and validation.',elements=elements)
    if deps:p['depends_on_change_ids']=deps
    proposals.append(p)
unassigned=[id for id in after if before.get(id)!=after.get(id) and id not in used]
assert not unassigned,unassigned
queue_path=ROOT/'data_storytelling/change.json'
queue=json.loads(queue_path.read_text())
if '--refresh' in sys.argv:
    saved=json.loads((EVIDENCE/'proposals.json').read_text())['change']
    assert [p for p in queue['change'] if p['id'].startswith('change.ssg_')]==saved
    queue['change']=[p for p in queue['change'] if not p['id'].startswith('change.ssg_')]
    old_discussions=json.loads((EVIDENCE/'discussion-before.json').read_text())['change']
    for old in old_discussions:
        queue['change']=[old if p['id']==old['id'] else p for p in queue['change']]
assert not any(p['id'].startswith('change.ssg_') for p in queue['change']), 'Already prepared; revise snapshots explicitly instead.'
# Existing discussion must not retain a removed target after launch approval.
# It is editorial feedback, not a foundation change or an authorization.
discussion_before=[]
for p in queue['change']:
    if 'event.bpi_launch' in json.dumps(p):
        assert p['category']=='discussion'
        discussion_before.append(copy.deepcopy(p))
        def redirect(x):
            if isinstance(x,dict):return {k:redirect(v) for k,v in x.items()}
            if isinstance(x,list):
                out=[redirect(v) for v in x]
                return list(dict.fromkeys(out)) if all(isinstance(v,str) for v in out) else out
            return 'event.aurelia_developer_presentation' if x=='event.bpi_launch' else x
        p.update(redirect(p))
        for finding in p.get('findings',[]):
            if finding.get('record_id')=='event.aurelia_developer_presentation' and 'external_product.bpi_suite' in finding.get('description',''):
                finding['path']='/outcomes'
                finding['description']='Review the proposed external SSG General Ledger release relationship in the joint June 6 presentation. change.ssg_joint_launch replaces the separate partner event and its loose subject list with an explained release outcome. This editorial retargeting does not approve that proposal.'
queue['change'] += proposals
if '--apply' not in sys.argv:
    print('Review-only generator: pass --apply to write proposals and evidence, never foundation.');sys.exit()
EVIDENCE.mkdir(parents=True,exist_ok=True)
queue_path.write_text(json.dumps(queue,indent=2,ensure_ascii=False)+'\n')
(EVIDENCE/'proposals.json').write_text(json.dumps(dict(change=proposals),indent=2,ensure_ascii=False)+'\n')
(EVIDENCE/'discussion-before.json').write_text(json.dumps(dict(change=discussion_before),indent=2,ensure_ascii=False)+'\n')
print(json.dumps([dict(id=p['id'],records=len(p['elements']),bytes=len(json.dumps(p,ensure_ascii=False).encode())) for p in proposals],indent=2))
