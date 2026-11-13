"""Rebuild this reviewed migration from its pinned baseline; never authorizes data."""
import copy, json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
E=ROOT/'data_storytelling/review_evidence/external-impact-revision'
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
base=json.loads((E/'baseline.json').read_text());queue=copy.deepcopy(base['pending_proposals'])
catalog=read('data_storytelling/review_evidence/external-peripherals-1979/catalog.json');items={x['id']:x for x in catalog['items']}
assessments={x['record_id']:x for x in read('data_storytelling/review_evidence/external-peripherals-1979/assessment.json')['entries']}
live={r['id']:r for r in read('data_foundation/external_products.json')['external_product']}
records={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(p.read_text()).values() if isinstance(rows,list) for r in rows if isinstance(r,dict) and 'id' in r}
# Comparison boundaries read from current canonical implementation specifications.
targets={
'product.device_s100_flexibus_card':('device.s100_flexibus_card','The alternative is a two-port S-100 FlexiBUS adapter. Existing-disk driver loading is its baseline; FlexiBUS boot needs a separately qualified ROM. It does not include a disk drive, serial modem or Disk II controller.'),
'product.device_flexidisk':('device.flexidisk','The alternative is a complete 5.25-inch drive with a FlexiBUS device controller. A native controller alone is not an equivalent complete purchase; compare the host adapter, drive, media format and boot/driver path together.'),
'product.device_flexidisk_ii':('device.flexidisk_ii','The alternative is a FlexiBUS 5.25-inch drive with recorded Aurelia and Apple II-compatible formats. Apple operation needs the Logix Apple II adapter; matching media formats does not make the electrical interfaces interchangeable.'),
'product.device_apple2_expansion_card':('device.apple2_expansion_card','The alternative adds two FlexiBUS ports and a Disk II-compatible controller to Apple II using native 6502 drivers. It provides neither a generic serial/parallel port nor Z80/CP/M execution.'),
'product.device_s100_video_card':('device.s100_video_card','The alternative uses the Aurelia video controller, 16 KiB local video memory and separate sprite storage. It needs a qualified digital monitor; 80-column output requires a compatible 640-pixel display. Its console configuration also needs input hardware. It includes no monitor or FlexiBUS ports.'),
'product.device_flexibus_keyboard':('device.flexibus_keyboard','The alternative is a FlexiBUS keyboard, not a complete terminal. Compare a working console including host, display and interface; a conventional keyboard or terminal is not directly attachable through the keyboard device protocol.'),
'product.device_flexiprint40':('device.flexiprint40','The alternative combines the MPI MP40 mechanism with a FlexiBUS device controller. Compare actual print width, character repertoire, quality, paper handling and qualified driver support; the current definition establishes no universal speed or output-quality advantage.'),
'product.device_mono_monitor_1':('device.mono_monitor_1','The alternative belongs to the Logix digital-display configuration. An analogue/composite monitor does not become electrically compatible because its diagonal or visible text is similar; compare the matching source, raster and connection.'),
'product.device_mono_monitor_2':('device.mono_monitor_2','The alternative belongs to the Logix digital-display configuration. Monitor reuse depends on the actual digital source and accepted raster, not on screen size alone.')}
# New checks use period primary sources where accessible. A source pointer is not a verified fact.
sources={
 'tarbell_brochure':{'url':'https://deramp.com/downloads/mfe_archive/010-S100%20Computers%20and%20Boards/01-Tarbell/10-Tarbell%20S100%20Boards/Tarbell%201011%20SD%20Disk%20Interface/Tarbell_Floppy_Disk_Interface_Brochure.pdf','finding':'Manufacturer describes programmed I/O, a bootstrap and standard-size single-density floppy drives; do not compare this controller alone with a complete FlexiDisk drive.','access':'indexed manufacturer brochure text'},
 'apple_disk_manual':{'url':'https://manuals.plus/m/c15aa34d3241b9db915ffdda5a4b6afa8efa78217936e8e64e737c831a45fe9e','finding':'Apple installation manual separates the Disk II drive from its Apple II controller and software.','access':'indexed manufacturer manual text'},
 'vector_mdos':{'url':'https://deramp.com/downloads/mfe_archive/010-S100%20Computers%20and%20Boards/00-Vector%20Graphic/40-VG%20Software/Vector_Users_Guide_to_56K_Vector_Graphic_Systems_Using_MDOS_Oct79.pdf','finding':'1979 manufacturer guide distinguishes parallel Centronics and serial Diablo/Teletype printer paths and specifies Bitstreamer cabling, firmware and software configuration.','access':'indexed manufacturer guide text'},
 'matrox_byte':{'url':'https://vintageapple.org/byte/pdf/197805_Byte_Magazine_Vol_03-05_Graphics_in_Depth.pdf','finding':'May 1978 product description distinguishes ALT-256 graphics from ALT-2480 alphanumeric display and describes their combined use.','access':'indexed period text; full PDF fetch exceeded tool size limit'},
 'swtpc_catalog':{'url':'https://deramp.com/swtpc.com/Catalog1976CP/Catalog1976CP.htm','finding':'Manufacturer catalogue separates CT-64 terminal, PR-40 printer and the host-specific peripheral families.','access':'catalogue index opened; detailed numerical claims not added'},
 'vt100_manual':{'url':'https://bitsavers.org/pdf/dec/terminal/vt100/EK-VT100-UG-001_VT100_User_Guide_Aug78.pdf','finding':'1978 manufacturer guide documents ANSI and VT52 terminal programming. This is not evidence of the fictional TUI application API.','access':'indexed manual text; direct PDF request denied'},
 'ssg_advert':{'url':'https://vintageapple.org/byte/pdf/197906_Byte_Magazine_Vol_04-06_Artificial_Intelligence.pdf','finding':'SSG advertisement, printed page 5, offers General Ledger for 8080/Z80 CP/M-compatible systems. It does not establish a historical AION C port or the fictional 1978 launch date.','access':'indexed period advertisement text'},
 'autodesk_letter':{'url':'https://fourmilab.ch/autofile/e5/chapter2_11.html','finding':'July 1982 founder letter distinguishes AutoCAD development in C on 8086 and PL/I on Z80; the Artemis/ERA port is an alternative-history assumption.','access':'primary text opened'},
 'model2_manual':{'url':'https://manuals.plus/m/08033a5c94ced268a747f44b9eefcca96d8ebae1741d4eaa5840a2f7cc42775b','finding':'Tandy technical manual describes Model II-specific hardware and 32K/64K configurations. It does not document a historical FlexiBUS option.','access':'indexed manufacturer manual text'},
 'ssm_io4':{'url':'https://www.manualslib.com/manual/4131890/Ssm-Io4.html','finding':'SSM IO4 manual documents a native S-100 I/O board with UART/parallel hardware; no evidence of a FlexiBUS implementation.','access':'indexed manufacturer manual text'},
 'northstar_manual':{'url':'https://hartetechnologies.com/manuals/Northstar/','finding':'Archive distinguishes original MDS-A single-density and later double-density manuals. No disk-format interchangeability is inferred from S-100 membership.','access':'manual inventory, not verification of every capacity'},
 'heath_h19':{'url':'https://www.manualslib.com/manual/3016379/Heathkit-H19.html','finding':'1979 Heath manufacturer manual identifies H19 as a video terminal. Terminal hardware is not the TUI application contract.','access':'indexed manufacturer manual text'}
}
source_map={
'external_product.tarbell_floppy_interface':['tarbell_brochure'], 'external_product.apple_disk_ii':['apple_disk_manual'],
'external_product.matrox_alt256':['matrox_byte'],'external_product.matrox_alt2480':['matrox_byte'],
'external_product.dec_vt100':['vt100_manual'],'external_product.heath_h19':['heath_h19'],
'external_product.northstar_micro_disk':['northstar_manual'],'external_product.ssm_io4':['ssm_io4'],
'external_product.autocad_1_artemis':['autodesk_letter'], 'external_product.trs80_model_ii':['model2_manual'],'external_product.model_ii_flexibus':['model2_manual'],'external_product.cpm_model_ii':['model2_manual'],
'external_product.ssg_general_ledger_cbasic':['ssg_advert'],'external_product.bpi_suite':['ssg_advert'],'external_product.bpi_suite.era':['ssg_advert'],'external_product.bpi_client_server':['ssg_advert']}
for k in ['vector_bitstreamer_ii','diablo_1610','qume_sprint_5_45_ro','nec_spinwriter_5510','ti_810','dec_la36','teletype_33_asr','hazeltine_1500']:source_map['external_product.'+k]=['vector_mdos']
for k in ['swtpc_ct64','swtpc_pr40','swtpc_ac30','swtpc_mf68']:source_map['external_product.'+k]=['swtpc_catalog']
# No invented bridge or competing standard where the model has no equivalent class.
remove_standard_profiles={'none_memory','none_host','none_firmware','none_cassette','none_mechanism','none_specialist','none_legacy','none_component','none_development','modem','apple_comms','hard_disk','plotter','apple_bridge'}
remove_product_profiles={'apple_comms','apple_bridge'}
no_direct_overlap={'external_product.cromemco_4pio','external_product.percom_ci812'}
# All descriptions below preserve unique content, with ownership kept in existing chapters.
unique={
'external_product.autocad_1_artemis':('CAD application scope','The Artemis/AIONix edition provides 2D CAD with typed coordinates, validated geometry, a dual-display command/status and {drawing_workspace} drawing workspace, mouse input, professional line/blit acceleration, drawing exchange and supported pen-plotter output. Autodesk retains its independent cross-platform business.',[{'key':'drawing_workspace','value':'800 × 600'}]),
'external_product.bpi_suite':('Application scope and data exchange','The Aurelia/Aurelia+ General Ledger uses native Z80 AION C code and ROM TUI services, with its scenario release on {release_date}. It covers General Ledger, not an expanded accounting suite. Reconciled, versioned disk exports transfer selected balances and period totals to Abacus. Specialist application support remains with SSG.',[{'key':'release_date','value':'1978-06-06'}]),
'external_product.bpi_suite.era':('Application scope and data exchange','The Artemis/AIONix General Ledger is a separately built native ERA implementation. It covers General Ledger, not an expanded accounting suite. Reconciled, versioned disk exports transfer selected balances and period totals to Abacus. Specialist application support remains with SSG.',[])
}
unique.update({
'external_product.bpi_client_server':('Client/server operation and delivery','An Artemis PRO/AIONix server executes ledger queries, validation, posting and durable transactions. AIONix and CP/M thin clients submit bounded operations. Supported configurations depend on authentication, locking, backup and crash-recovery qualification. Engineering delivery ends with acceptance, maintainer training and source/build handover. The package includes three implementation editions and the recorded licence/packaging items; it adds no per-seat policy or accounting modules.',[]),
'external_product.cpm_aurelia':('Platform services and distribution','The {cpm_lineage} software supports Aurelia and Aurelia+ with CP/M application/file services, text-mode TUI, smart-device integration, XIP cartridge support and named user areas. DRI licenses the enhanced version non-exclusively. Its physical Logix ROM cartridge is a separate offering. AION retains cross-platform reuse rights; Logix supplies boot firmware and hardware drivers.',[{'key':'cpm_lineage','value':'CP/M 1.4-derived'}]),
'external_product.cpm_platform_extensions':('Optional platform services','Optional services for non-Logix manufacturers cover text-mode interaction, capability discovery and peripheral adapters. Ordinary CP/M remains usable without them. Each host needs its own driver integration and qualification; this offering supplies neither an Aurelia ROM cartridge nor one identical binary image for every manufacturer. DRI may adapt and distribute the accepted AION-developed TUI under the recorded agreement.',[]),
'external_product.cpm_model_ii':('Model II runtime scope','The cooperation configuration supplies Model II boot, disk and printer BIOS integration, a native display/keyboard TUI adapter, bounded clipboard and required application services. AION funds, qualifies and maintains this CP/M-80 port under the cooperation agreement. It implies no x86 CP/M commitment.',[]),
'external_product.model_ii_flexibus':('Model II option scope','The internal option provides {ports} FlexiBUS ports, subject to slot, power, timing and attachment qualification. It retains native Model II video and interfaces and is not S-100 compatible. Powered-on attachment requires a qualified quiescent port. Initial supply uses AION chips; SMC substitution requires per-part qualification.',[{'key':'ports','value':'2'}]),
'external_product.trs80_model_ii':('Cooperation configuration','The Tandy configuration has a {processor} and {installed_ram} installed RAM, retaining its native 80-column display, keyboard, eight-inch disks and ports. It adds supported CP/M, Abacus and a qualified internal FlexiBUS option without requiring a Logix video controller, video RAM or monitor. Tandy handles first-line customer support, escalating operating-system issues to DRI and application issues to AION.',[{'key':'processor','value':'4 MHz Z80'},{'key':'installed_ram','value':'64 KB'}]),
'external_product.apple_ii':('Role in the product ecosystem','Apple II is the independent host used in business-software, dealer-demonstration and compatibility work. Disk II business configurations and Peachtree cooperation remain separate from Logix-branded Apple II expansion and video cards. This identity specifies neither an additional hardware revision nor a Logix computer offering.',[]),
'external_product.ssg_general_ledger_cbasic':('Runtime and application scope','The independently maintained ledger runs on ordinary 8080/Z80 CP/M systems and is the functional reference for the Aurelia port. Its scenario release is {release_date}. CBASIC compiles to intermediate code executed by its runtime interpreter, not native Z80 code; the accounting environment uses {precision} arithmetic. Exact ledger, compiler and runtime revisions remain unspecified. The application needs no Aurelia ROM TUI.',[{'key':'release_date','value':'1978-01-15'},{'key':'precision','value':'14-digit'}])
})

def chap(name,description,parameters=None):return {'number':1,'chapter_name':name,'description':description,'parameters':parameters or []}
def std_relationship(id,sid):
 if id=='external_product.model_ii_flexibus':return 'implements'
 if id.startswith('external_product.cpm_'):return 'implements' if sid=='technology.logix_tui_standard' else 'supports'
 if id in ['external_product.apple_ii','external_product.trs80_model_ii','external_product.ssg_general_ledger_cbasic']:return 'competes_with'
 if sid=='technology.flexibus':return 'supports'
 return 'requires'
def product_relationship(id,pid):
 if id=='external_product.apple_ii':return 'competes_with' if pid=='product.aurelia_mono' else 'supports'
 if id=='external_product.trs80_model_ii':return 'competes_with' if 'aurelia' in pid else 'supports'
 if id=='external_product.ssg_general_ledger_cbasic':return 'competes_with'
 if id=='external_product.microsoft_basic_aurelia' and pid=='product.simple_c_z80':return 'competes_with'
 if id=='external_product.autocad_1_artemis' and pid in ['product.device_artemis_professional_video_128kb','product.device_logix_mouse']:return 'requires'
 return 'supports'

# Specific findings supplement, rather than replace, the conservative profile comparisons.
findings={
 'apple_parallel_printer_card':'The Apple manufacturer brochure describes parallel data with strobe/acknowledge handshaking; its printer interface is distinct from a FlexiBUS message transport.',
 'apple_centronics_card':'The 1979 Apple catalogue distinguishes the Centronics wiring and carriage-return/line-feed behaviour from the general-purpose parallel card. Existing printer/cable reuse is the relevant comparison.',
 'apple_serial_card':'The Apple serial card addresses serial printers and local equipment; it is not the later Super Serial Card. Modem and printer requirements must not be conflated.',
 'apple_communications_card':'The original communications-card function is distinct from the later multifunction serial card and from the Logix Disk II/FlexiBUS adapter.',
 'hayes_micromodem_ii':'Hayes manufacturer material identifies an Apple-slot modem with an external telephone coupler. No FlexiBUS modem class or qualified bridge is recorded.',
 'hayes_micromodem_100':'The November 1979 Hayes manual distinguishes the S-100 host interface and Bell 103 modem operation. Telephone service does not substitute for the recorded FlexiBUS peripheral classes.',
 'cromemco_4fdc':'The 1977 manufacturer manual includes 5-inch and 8-inch drive support, a serial channel and resident RDOS/bootstrap. The disk purchase path therefore includes capabilities beyond a bare controller chip.',
 'cromemco_tuart':'The 1978 manufacturer manual establishes a native S-100 digital interface. Serial/parallel electrical signals are not equivalent to FlexiBUS peripheral messages.',
 'cromemco_4pio':'The isolated parallel-port function is directed at external equipment and instrumentation. A FlexiBUS host adapter is not a demonstrated replacement; remove the generic competition link.',
 'northstar_micro_disk':'The original manufacturer advertisement includes a Shugart drive, S-100 controller, PROM bootstrap and software. Compare complete systems and preserve the original density/format rather than importing later revisions.',
 'tarbell_floppy_interface':'The manufacturer describes programmed I/O and a bootstrap for standard-size single-density drives. Compare the complete configured subsystem, not the board alone against a supplied external drive.',
 'sd_versafloppy':'Search results also identify VersaFloppy II and a 1980 revised manual. Those do not establish the original VersaFloppy specifications; retain the original identity and withhold later-density claims.',
 'processor_technology_3ps':'The manufacturer manual identifies a native input/output module. Any printer substitution depends on its actual port wiring and host software, not the S-100 connector alone.',
 'ssm_io4':'The IO4 native UART/parallel interfaces do not implement FlexiBUS. Reusing existing peripherals may favour the native board, but only a qualified equivalent task establishes competition.',
 'ssm_vb3':'VB3 and VB3A descriptions differ in display-attribute hardware. Do not transfer VB3A capabilities or optional character mappings to the undifferentiated VB3 record.',
 'matrox_alt256':'The manufacturer-authored May 1978 description specifies a 256-by-256 graphics board. Compare graphics capability and local software rather than treating it as an 80-column terminal replacement.',
 'matrox_alt2480':'The October 1979 distributor listing identifies a 24-by-80 S-100 character controller. Combining it with a separate Matrox graphics board is an additional configuration, not an intrinsic capability of this card.',
 'vector_flashwriter_ii':'The period description identifies memory-mapped character output. Existing terminal software needs an appropriate driver; a similar display width does not establish identical APIs.',
 'vector_bitstreamer_ii':'The manufacturer guide exposes native I/O registers and system configuration. Port decoding and matching printer/terminal software are material to reuse.',
 'dec_vt100':'The 1978 guide defines ANSI/VT52 terminal operation. Its serial console is not the fictional TUI application API, and its own display is not a directly attachable Logix digital monitor.',
 'soroc_iq120':'The 1977 vendor advertisement describes a complete 24-by-80 terminal with cursor addressing and field handling. Compare the whole console rather than equating terminal controls with the TUI application contract.',
 'lear_siegler_adm31':'The 1978 manufacturer brochure documents a complete character terminal with editing functions. Existing console software and terminal configuration remain necessary.',
 'intertec_intertube_ii':'The September 1979 vendor advertisement describes a 24-by-80 terminal, keyboard and serial printer connection. Those form a console alternative, not direct digital-video interoperability.',
 'televideo_912':'The September 1979 manufacturer advertisement separates TVI-912 from the extra keys on TVI-920. Only the recorded model is compared.',
 'heath_h14':'A contemporary SOL user report supplies H14-specific CP/M I/O handshakes. This supports the need for a named driver; it does not establish universal printer interchangeability.',
 'swtpc_pr40':'The historical PR-40 is a 40-column alphanumeric printer. This narrows its output use case; the FlexiPrint40 definition still does not establish an unqualified quality or throughput advantage.',
 'diablo_1610':'The manufacturer documentation distinguishes 1610/1620 configurations. The comparison concerns the recorded printer, not an assumed keyboard-equipped terminal or a generic matrix-printer substitute.',
 'qume_sprint_5_45_ro':'The 1979 listing separates receive-only and keyboard send/receive models. The RO identity must retain its printer scope.',
 'ids_440_paper_tiger':'The December 1979 advertisement includes adjustable tractor feed and serial/parallel options. Selected interface and output requirements matter more than a generic printer-category match.',
 'comprint_912':'The July 1979 vendor advertisement places the printer in hardcopy and data-logging roles. No FlexiBUS compatibility or throughput comparison is established.',
 'centronics_microprinter_p1':'The 1979 technical survey distinguishes the P1 parallel interface from the S1 serial version and identifies an electrosensitive printing process. Consumables and interface variants are material to substitution.',
 'ti_745_silent700':'The TI advertisement describes a portable dial-up data terminal with printed output. FlexiPrint40 competes only for an overlapping hardcopy task, not portability, keyboard input or telephone communications.',
 'ti_820_ksr':'The KSR identity combines keyboard input and printing. Later manual revisions are not evidence that all their capabilities existed in 1979.',
 'netronics_ascii_keyboard':'The 1979 distributor advertisement describes ASCII and selectable handshaking. This is not the FlexiBUS keyboard protocol or proof of a TUI implementation.',
 'percom_ci812':'The recorded cassette and terminal-interface functions do not overlap a qualified FlexiBUS disk/printer connection closely enough to retain the generic competition link.',
 'huh_mpa':'An expansion backplane/host bridge does not by itself replace a FlexiBUS/Disk II adapter; no direct product or standard impact is asserted.',
 'microproducts_apple_pr40':'The exact named interface was not independently located in the new search. Keep the original period-source pointer and treat the Apple/PR-40 purchase comparison as conditional on that identity and configuration being confirmed.',
 'atari_cx853':'A new secondary-source chronology places the module on sale in 1980. The prior 1978–79 availability assumption is not independently confirmed; no 1979 sales or impact is inferred and no release date is invented.',
 'cromemco_16ktp':'The readily located manual is a later revision. It cannot establish the full 1979 capability set. No counterpart or new impact is inferred from memory capacity alone.'
}
findings={'external_product.'+k:v for k,v in findings.items()}

audit=[]
def convert(r):
 original=copy.deepcopy(r);r=copy.deepcopy(r);id=r['id'];a=assessments[id];item=items.get(id);profile=item.get('assessment_profile') if item else None
 removed=[];retained=[]
 for c in r['specification']:
  # These chapters concern effects, not intrinsic specifications.
  impact=c['chapter_name'] in ['Product impact','Standards impact','Supported text-user-interface contract','Bus supported by platform adapters','Peripheral bus implemented by the option']
  if impact:removed.append(c)
  else:retained.append(c)
 r['specification']=retained
 if item:
  # Existing descriptions repeat name, type and the host already specified in chapter 1.
  decision='Removed repeated identity/type/host summary; retained hardware and host chapter.'
 elif id in unique:
  name,desc,ps=unique[id];r['specification'].append(chap(name,desc,ps));decision='Consolidated unique scope in a new chapter, avoiding repeated ownership/agreement prose.'
 else:
  # Preserve substantive prose verbatim where deleting it could lose application/delivery constraints.
  r['specification'].append(chap('Product scope and delivery',r['description']));decision='Moved substantive scope/delivery description into a chapter; existing direct-role references retained.'
 r['description']=''
 for i,c in enumerate(r['specification'],1):c['number']=i
 products=[];standards=[];dropped=[]
 for impact in a['product_impacts']:
  pid=impact['product_id']
  if profile in remove_product_profiles or id in no_direct_overlap:
   dropped.append({'target':pid,'reason':'No established direct substitute: the Logix adapters expose FlexiBUS device classes rather than this communications, isolated instrumentation, cassette/terminal or expansion-backplane function.'});continue
  if item:
   implementation,comparison=targets[pid]
   assumption='Assess the recorded {host} configuration with its required controller, cabling and software. '+item['features']
   relationship='supports' if profile=='apple_disk' and pid=='product.device_apple2_expansion_card' else 'competes_with'
   if relationship=='supports':comparison='The Logix Apple II adapter includes a Disk II-compatible controller path as well as FlexiBUS. Retaining the native disk path could support an incremental upgrade, subject to drive, firmware and format qualification; the Disk II drive is not thereby a FlexiBUS device.'
   if profile=='terminal':comparison+=' Competition is at complete-console level; the terminal does not separately replace both a keyboard and a video card in an already assembled system.'
   products.append({'product_id':pid,'relationship':relationship,'date':a['assessment_date'],'assumption_description':assumption,'comparison_description':comparison+' The canonical implementation is {implementation}.','outcomes_description':impact['description']+' This is a conditional purchase-path assessment, not evidence of measured market share or superior performance.','parameters':[{'key':'host','value':item['compatible_ecosystem']},{'key':'implementation','value':implementation}]})
  else:
   products.append({'product_id':pid,'relationship':product_relationship(id,pid),'date':a['assessment_date'],'assumption_description':'Assess the explicitly recorded alternative-history edition and the referenced offering at this date. Historical manufacturer documentation establishes the original platform or application lineage, not this fictional port or cooperation.','comparison_description':impact['description'],'outcomes_description':'The described integration or substitution can affect the appeal of this offering only within its recorded host, resource and delivery scope. Qualification, migration effort and customer demand remain conditions; no sales volume or market-share change is established.','parameters':[]})
 for impact in a['standards_impacts']:
  sid=impact['standard_id']
  if id in no_direct_overlap or profile in remove_standard_profiles or profile in ['terminal','printing_terminal','keyboard'] and sid=='technology.logix_tui_standard':
   dropped.append({'target':sid,'reason':'No demonstrated implementation, dependency or direct alternative to this standard in the recorded scope. A terminal/keyboard transport does not establish application TUI semantics; absent device classes and bridges are not assumed.'});continue
  effect=copy.deepcopy(impact);effect['relationship']='competes_with' if item else std_relationship(id,sid)
  if item:
   effect['assumption_description']='Assess {historical_product} in its recorded {host} configuration. '+effect['assumption_description']
   effect['parameters']=[{'key':'historical_product','value':item['name']},{'key':'host','value':item['compatible_ecosystem']}]
   effect['comparison_description']+=' The relationship concerns alternative complete configurations, not proven direct compatibility with this standard.'
  if id=='external_product.autocad_1_artemis':effect['assumption_description']+=' The historical 1982 Autodesk work separated 8086 C and Z80 PL/I builds; the ERA/AIONix implementation is a scenario-specific development.'
  if id in ['external_product.bpi_suite','external_product.bpi_suite.era','external_product.bpi_client_server']:effect['assumption_description']+=' Period SSG material establishes the CP/M application lineage, not this native AION or client/server implementation.'
  standards.append(effect)
 if products:r['impacted_products']=products
 else:r.pop('impacted_products',None)
 if standards:r['impacted_standards']=standards
 else:r.pop('impacted_standards',None)
 audit.append({'record_id':id,'profile':profile,'description_decision':decision,'relocated_chapters':removed,'omitted_relationships':dropped,'no_product_impact_reason':a.get('product_no_impact_reason') if not products else None,'no_standard_impact_reason':a.get('standards_no_impact_reason') if not standards else None,'source_ids':source_map.get(id,[]),'prior_source_urls':[catalog['sources'][s]['url'] for s in item.get('source_ids',[]) if 'url' in catalog['sources'][s]] if item else [],'research_status':'Specific named-product web search completed; source candidates are not treated as proof. Accepted findings, limitations and canonical-model comparisons are recorded separately.', 'research_finding':findings.get(id,'No new detailed historical claim added. Retain the recorded function and original period-source pointers; no direct impact is inferred outside a named, comparable product/standard scope.'), 'search_log_record_id':id if item else None,'comparison_record_ids':sorted({x['product_id'] for x in products}|{x['standard_id'] for x in standards}|{p['value'] for x in products for p in x['parameters'] if p['key']=='implementation'}),'after':r})
 return r
updated=[];pending_ids=set()
for p in queue:
 es=[e for e in p['elements'] if e['record_type']=='external_product' and e['after']]
 if not es:continue
 for e in es:
  assert e['before']==live.get(e['record_id']), 'stale pending snapshot '+e['record_id']
  e['after']=convert(e['after']);pending_ids.add(e['record_id'])
 p['reason']+=' Revised for explicit product/standard relationships: consolidate descriptions into specification, relocate impact prose, compare canonical implementation boundaries and retain source/qualification limits. Historical documentation cannot establish fictional implementations or measured adoption. Per-record evidence: data_storytelling/review_evidence/external-impact-revision/assessment.json.'
 updated.append(p['id'])
new=[]
for id,r in live.items():
 if id in pending_ids:continue
 after=convert(r)
 p={'id':'change.external_impacts.'+id.split('.',1)[1],'category':'story','title':'Restructure external product impacts — '+r['name'],'reason':'Consolidate descriptive content and move assessed product/standard effects into typed impact sections. Preserve historical interfaces, fictional-world boundaries and qualification limits. Evidence: data_storytelling/review_evidence/external-impact-revision/assessment.json.','elements':[{'record_type':'external_product','record_id':id,'before':r,'after':after}]}
 queue.append(p);new.append(p['id'])
write(ROOT/'data_storytelling/change.json',{'change':queue})
searches={e['record_id']:e for e in json.loads((E/'search-log.json').read_text())['entries']}
for entry in audit:
 if entry['record_id'] in searches:entry['research_candidates']=searches[entry['record_id']]['candidate_source_urls']
write(E/'assessment.json',{'baseline_revision':base['revision'],'policy':'Research distinguishes historical sources, prior unverified specifications, canonical alternative-history definitions and conditional commercial inference. No sales values or new hardware compatibility are inferred. Source URLs support only the stated findings. No-impact findings live in evidence rather than spurious target entries.','sources':sources,'entries':audit})
write(E/'summary.json',{'updated_proposals':updated,'new_proposals':new,'external_products':len(audit),'product_impacts':sum(len(a['after'].get('impacted_products',[])) for a in audit),'standard_impacts':sum(len(a['after'].get('impacted_standards',[])) for a in audit)})
print(json.dumps({'updated':len(updated),'new':len(new),'records':len(audit)},indent=2))
