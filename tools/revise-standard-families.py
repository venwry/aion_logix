"""Revise pending standard candidates; never modify live foundation records."""
import copy,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'data_storytelling/review_evidence/standard-families'
def read(p):return json.loads((ROOT/p).read_text())
def write(p,v):(ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
queue=read('data_storytelling/change.json')
original=E/'queue-before.json'
if not original.exists():original.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
index={r['id']:r for p in (ROOT/'data_foundation').glob('*.json') for rows in json.loads(p.read_text()).values() for r in rows}
T='technology.'
redirect={T+'flexibus_pointing_device':T+'flexibus',T+'logix_tui_keyboard_standard':T+'logix_tui_standard',T+'logix_tui_mouse':T+'logix_tui_standard',T+'logix_c_api':T+'aion_c_portability_framework',T+'logix_display_api':T+'aion_c_portability_framework',T+'logix_c_target_contract':T+'aion_c_portability_framework'}
pattern=re.compile('|'.join(re.escape(k) for k in sorted(redirect,key=len,reverse=True))+r'(?![a-z0-9_.-])')
def remap(v):
 if isinstance(v,str):return pattern.sub(lambda m:redirect[m.group()],v)
 if isinstance(v,list):
  values=[remap(x) for x in v]
  # Reference arrays become many-to-one; retain each target once, in source order.
  if values and all(isinstance(x,str) and re.fullmatch(r'[a-z_]+\.[a-z0-9_.-]+',x) for x in values):return list(dict.fromkeys(values))
  return values
 if isinstance(v,dict):return {k:remap(x) for k,x in v.items()}
 return v
proposed={k:remap(copy.deepcopy(v)) for k,v in index.items() if k not in redirect}
coverage=[]
def intro(title,text):return dict(number=1,chapter_name=title,description=text,parameters=[])
def combine(root,kind,name,description,opening,parts):
 r=proposed[T+root];r['kind']=kind;r['name']=name;r['description']=description;r['specification']=[intro('Scope, chronology and compatibility',opening)]
 related=[]
 for source,prefix,scope in parts:
  src=index[T+source];related.extend(remap(src.get('related_technology_ids',[])))
  for c in src['specification']:
   chapter=remap(copy.deepcopy(c));chapter['number']=len(r['specification'])+1;chapter['chapter_name']=prefix+' — '+c['chapter_name'];chapter['description']=scope+'\n\n'+chapter['description']
   r['specification'].append(chapter);coverage.append({'source_id':src['id'],'source_number':c['number'],'target_id':r['id'],'target_number':chapter['number'],'method':'Preserved source chapter with explicit chronological/profile scope; referenced IDs redirected.'})
 r['related_technology_ids']=[x for x in dict.fromkeys(related) if x!=r['id']]
combine('flexibus','hardware_standard','FlexiBUS peripheral standard','Shared peripheral transport, discovery and device-class contracts; pointing devices are a later optional class, not another core standard.',
 'FlexiBUS v1 defines the peripheral transport used at the Aurelia launch on 5 June 1978. The January 1975 agreement is a development commitment, not proof of release. Independent compatibility programmes are explicitly published on 5 May 1979; wider publication and new host implementations do not establish a new transport version. The pointing-device class is introduced with the NCC presentation on 7 June 1982 and uses the existing transport. It is not part of the 1978 baseline and does not imply unrestricted hot-plugging. Transport requirements, class extensions and measured implementation qualification remain distinct. TUI owns user-facing keyboard and pointer meanings.',[
 ('flexibus','Core transport','1978 baseline and later published compatibility programme. Requirements and qualification gates are not assertions of completed tests.'),
 ('flexibus_pointing_device','1982 pointing-device class','Optional class introduced at NCC on 7 June 1982. Existing transport framing and rates apply; this does not create FlexiBUS v2.')])
combine('logix_tui_standard','software_standard','Logix TUI interaction standard','Common controls, keyboard/editing conventions and later pointer interaction, with explicit host and terminal profiles.',
 'The Aurelia launch on 5 June 1978 establishes the commercial keyboard/control baseline. The developer launch follows on 6 June. Keyboard conventions are core TUI requirements, not a separate ecosystem standard. External CP/M extension qualification begins on 10 November 1978 and portable extensions are released on 5 May 1979. ERA/AIONix is a later platform implementation at the Artemis launch on 19 May 1980; it does not retroactively give Aurelia multiple concurrent applications. Pointer interaction is an optional extension introduced on 7 June 1982, retaining keyboard operation. No separately released TUI 2.0 is established by these records. Software editions and qualified builds implement the standard; optional terminal profiles do not redefine native TUI shortcuts.',[
 ('logix_tui_standard','Common interaction','Common contract across supported hosts. Mouse references apply only from June 1982; ERA/AIONix-specific capabilities apply to the later host profile, not the 1978 Aurelia baseline.'),
 ('logix_tui_keyboard_standard','Keyboard and editing core','Native keyboard/editing requirements belong to the TUI core. Terminal and application-lifecycle profiles apply only where the host implements them; later operating-system terminology is design context, not a historical release claim.'),
 ('logix_tui_mouse','1982 pointer extension','Optional extension introduced at NCC on 7 June 1982. Older applications require the qualified service-update or relink path described here; no blanket retrofit is promised.')])
combine('aion_c_portability_framework','software_standard','AION C language and portable platform standard','Shared C source-level contracts, platform services, display services and distinct target profiles; no cross-target binary compatibility is implied.',
 'The Z80/enhanced-CP/M developer environment launches on 6 June 1978. ERA/AIONix exploratory work begins on 1 February 1978, but its commercial developer environment belongs to the Artemis launch on 19 May 1980. These are coexisting target profiles of one source-portability contract, not successive standard versions. The platform API is explicitly labelled 1.0; this is not evidence that every module or later operating system has the same release number. Each target retains its own compiler, libraries, ABI and resource constraints. Optional graphics capabilities must be queried. Networking belongs to the 1981 programme; mouse/professional graphics integration belongs to the 1982 programme. Athena/AIONix2 compatibility is a later planning/qualification commitment, not a released capability of the original standard. A new contract revision requires a documented semantic or compatibility change; no new revision numbers are invented.',[
 ('aion_c_portability_framework','Source portability and build profiles','Cross-platform family overview. Z80/CP/M availability is June 1978; ERA/AIONix availability is May 1980. Later-host features do not become available on earlier computers through source portability alone.'),
 ('logix_c_target_contract','Language and target profiles','The common language contract has separate Z80/CP/M and ERA/AIONix data models and ABIs. The ERA profile is a later target, not a replacement for the Z80 profile.'),
 ('logix_c_api','Portable platform API','Shared source API 1.0 semantics with host-specific implementations. Aurelia and Artemis profiles coexist; Athena/AIONix2 policies are later commitments and remain subject to qualification.'),
 ('logix_display_api','Display-services module','Capability-based services within AION C, usable independently of TUI controls. Hardware capacities are implementation examples, not universal standard requirements. Artemis profiles begin in 1980; later optional rendering, pointer and professional-graphics services must not be assumed at the 1978 launch.')])
# Move user-interface semantics out of the FlexiBUS class description and into TUI.
f=proposed[T+'flexibus'];control=next(c for c in f['specification'] if c['chapter_name'].endswith('Controls and host compatibility'))
semantics='Primary button focuses/selects/activates; secondary opens context actions where provided. Middle-finger roller scrolls vertically; thumb roller scrolls horizontally. Wheels have no implicit press buttons.'
assert semantics in control['description'];control['description']=control['description'].replace(semantics,'Button and roller reports carry input data. User-facing selection, focus and scrolling meanings belong to the 1982 pointer extension in technology.logix_tui_standard.')
tui=proposed[T+'logix_tui_standard'];pointer=next(c for c in tui['specification'] if c['chapter_name'].endswith('Standard controls and pointer interaction'));pointer['description']+='\n\n'+semantics
coverage.append({'source_id':T+'flexibus_pointing_device','source_number':5,'target_id':tui['id'],'target_number':pointer['number'],'method':'User-facing button/roller meanings relocated verbatim from the bus class to the TUI pointer extension.'})
# Preserve section meaning instead of leaving duplicate/self-referential ID lists.
parameter_revisions=[]
section_values={
 (T+'logix_tui_standard','Keyboard standard reference'):'the Keyboard and editing core sections of this standard',
 (T+'logix_tui_standard','Mouse extension reference'):'the 1982 pointer extension sections of this standard',
 (T+'logix_tui_standard','Related technology references'):'this TUI standard; technology.aion_c_portability_framework; technology.flexibus',
 (T+'logix_tui_standard','Base standard reference'):'the keyboard and control baseline of this TUI standard',
 (T+'aion_c_portability_framework','Shared contract references'):'the language/target profiles, portable platform API and display-services module of this standard; technology.logix_tui_standard'
}
for (id,key),value in section_values.items():
 for chapter in proposed[id]['specification']:
  for parameter in chapter['parameters']:
   if parameter['key']==key:
    parameter_revisions.append({'target_id':id,'target_number':chapter['number'],'key':key,'before':parameter['value'],'after':value})
    parameter['value']=value
def element(id):return {'record_type':id.split('.')[0],'record_id':id,'before':index[id],'after':None if id in redirect else proposed[id]}
changed=[id for id in index if id in redirect or proposed[id]!=index[id]]
main={'id':'change.standard_kind_flexibus','category':'foundation','title':'Consolidate FlexiBUS, TUI and AION C into chronological standard families','reason':'Revises the earlier independent kind proposals. Preserve three core standard IDs; incorporate pointing-device, keyboard, mouse and C/API specifications as scoped sections, profiles and dated extensions. Remove six redundant child technology records and redirect their references atomically, preserving source descriptions and parameters. Z80/CP/M and ERA/AIONix are coexisting AION C profiles, not successive standard versions. June 1982 mouse support is excluded from the 1978 baseline. Reference consumers overlap across families, so this is one inseparable proposal. No implementation, release event, qualification outcome or software version is invented. See review_evidence/standard-families for chapter coverage.','elements':[element(i) for i in changed]}
# Keep the two independent core standards as existing separate proposals.
updates=[main]
for suffix,title,scope in [
 ('logix_digital_video','Logix digital video standard','The Aurelia June 1978 baseline, later Artemis raster profiles and June 1982 horizontal-retrace palette extension are distinct scopes. Raster sizes are capability profiles, not protocol version numbers. Monitor/controller support must be intersected; a new resolution or palette feature is not automatically present on old monitors. Hardware-specific scaling examples remain explanatory, not universal requirements. The professional 800×600 integration recorded in June 1982 is not silently added to this record’s currently specified raster tables; its exact link/timing contract requires separate review.'),
 ('logix_lan100_link','LogixLAN physical and data-link standard','The networking presentation on 4 May 1981 establishes the programme baseline, not proof that every host/rate has passed qualification. The 100, 250, 500 and 1000 kbit/s rates are negotiated capabilities of the same shared-link baseline, not separate standard versions. The stable ID retains 100 as startup/fallback rate. Host RAM and CPU budgets below are implementation examples or qualification targets, not additional standards.')]:
 id=T+suffix;after=copy.deepcopy(index[id]);after['kind']='hardware_standard';after['name']=title
 for c in after['specification']:c['number']+=1
 after['specification'].insert(0,intro('Scope, chronology and profiles',scope))
 updates.append({'id':'change.standard_kind_'+suffix,'category':'foundation','title':'Define '+title+' with chronological profiles','reason':'Revise the existing kind proposal to distinguish the core contract, optional profiles and implementation qualification. Preserve all existing specification chapters and values; add an explicit scope statement without inventing protocol versions or completed qualification.','elements':[{'record_type':'technology','record_id':id,'before':index[id],'after':after}]})
updates.append({'id':'change.standard_kind_plug_and_execute','category':'discussion','title':'Define the Plug and Execute compatibility contract before classifying it as a standard','reason':'The current record states automatic ROM identification/configuration but does not sufficiently specify independently implementable connector, discovery, driver ABI, resource allocation and conformance rules. Retain its current interface kind pending a concrete contract and chronological scope.','elements':[],'affected_record_ids':[T+'plug_and_execute'],'findings':[{'record_id':T+'plug_and_execute','description':'Determine the common expansion contract versus platform-specific implementations and establish its availability from existing story evidence. Do not assume all generations share a connector, ABI or already-qualified capability.'}]})
oldids={p['id'] for p in json.loads(original.read_text())['change'] if p['id'].startswith('change.standard_kind_')};newids={p['id'] for p in updates};touch={e['record_id'] for p in updates for e in p.get('elements',[])}
for p in queue['change']:
 if p['id'] in oldids:continue
 assert not any(e['record_id'] in touch for e in p.get('elements',[])),'Overlapping proposal '+p['id']
 # Editorial discussion links must remain valid after the child records are retired.
 if p.get('category')=='discussion':
  before=copy.deepcopy(p);revised=remap(p);p.clear();p.update(revised)
  if before!=p:write('data_storytelling/review_evidence/standard-families/'+p['id']+'-before.json',before)
queue['change']=[p for p in queue['change'] if p['id'] not in oldids]+updates
write('data_storytelling/change.json',queue)
write('data_storytelling/review_evidence/standard-families/proposals.json',{'change':updates})
write('data_storytelling/review_evidence/standard-families/coverage.json',{'baseline_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'redirects':redirect,'chapters':coverage,'parameter_revisions':parameter_revisions,'consolidation_record_operations':len(changed),'retired_proposal_ids':sorted(oldids-newids)})
print('Revised to',len(updates),'entries; consolidation operations',len(changed))
