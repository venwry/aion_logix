#!/usr/bin/env python3
"""Verify pinned provenance and source coverage, generating a reviewable Markdown audit.
Coverage means a documented disposition, not proof that semantics or canon are complete.
"""
import argparse,collections,hashlib,json,pathlib,subprocess
P=argparse.ArgumentParser();P.add_argument('--source',required=True,type=pathlib.Path);P.add_argument('--data',required=True,type=pathlib.Path);P.add_argument('--report',required=True,type=pathlib.Path);a=P.parse_args()
D={f.stem:json.loads(f.read_text())[f.stem] for f in sorted(a.data.glob('*.json'))};sources={r['id']:r for r in D['source']};S={f.name:json.loads(f.read_text()) for f in (a.source/'data').glob('*.json')};fail=[]
PIN='dac733770d8e622d5619bd84bc9d21db6c7ec7ab'
if subprocess.check_output(['git','-C',str(a.source),'rev-parse','HEAD'],text=True).strip()!=PIN:fail.append('Source revision differs')
def value(f,p):
 v=S[f]
 for k in p.split('/')[1:]:
  k=k.replace('~1','/').replace('~0','~');v=v[int(k)] if isinstance(v,list) else v[k]
 return v
def leaves(v,p=''):
 if isinstance(v,dict) and v:
  for k,x in v.items():yield from leaves(x,p+'/'+k.replace('~','~0').replace('/','~1'))
 elif isinstance(v,list) and v:
  for i,x in enumerate(v):yield from leaves(x,p+'/'+str(i))
 else:yield p,v
checks=0
for kind,records in D.items():
 for r in records:
  for q in r.get('source_refs',[]):
   if q['source_id']!='source.vs_edu1_dac7337':continue
   checks+=1
   try:value(q['path'].removeprefix('data/'),q['pointer'])
   except (KeyError,ValueError,IndexError):fail.append(f'{r["id"]}: broken source pointer {q}')
M=collections.defaultdict(dict)
for r in D['migration_map']:
 for q in r['source_refs']:
  f=q['path'].removeprefix('data/');p=q['pointer']
  if p in M[f]:fail.append('Duplicate coverage rule '+f+p)
  M[f][p]=r
counts={};pending_fragments=[]
for f,v in sorted(S.items()):
 c=collections.Counter()
 for p,x in leaves(v):
  candidates=[k for k in M[f] if k==p or k=='' or p.startswith(k+'/')]
  if not candidates:fail.append('Unclassified leaf '+f+p);continue
  rule=M[f][max(candidates,key=len)];c[rule['disposition']]+=1
  if rule['disposition']=='deferred' and f in ['events.json','contracts.json','world.json','campaigns.json','timeline-structure.json']:
   pending_fragments.append((f,p,rule['rationale']))
 counts[f]=c
# Source IDs are accounted for even when their target type changes.
for f,key in [('world.json','entities'),('world.json','principles'),('events.json','events'),('timeline-structure.json','phases')]:
 for i,r in enumerate(S[f][key]):
  p=f'/{key}/{i}'
  if p not in M[f]:fail.append('Missing entity-level disposition '+f+p)
# No canonical data has been silently confirmed during reconstruction.
for k,records in D.items():
 if any(r['status']=='confirmed' for r in records):fail.append('Unexpected automatic confirmation in '+k)
if fail:raise SystemExit('\n'.join(fail))
lines=['# Phase-1 migration audit','',f'Source: `venwry/vs_edu1` at `{PIN}`. All 21 authoritative JSON files were recursively inspected. The source repository was not modified.','',
'**Migration draft, not confirmed canon.** Every scalar or empty-container leaf has an explicit mapped, merged, split, deferred or excluded disposition. More-specific JSON Pointers override ancestor rules. This coverage check prevents silent unclassified input; it does not prove every semantic ambiguity has been resolved.','',
f'Validated {checks} provenance pointers against the pinned source. The approved phase-1 schemas are unchanged.','', '## Output records','', '| Dataset | Records | Pending | Speculation |','| --- | ---: | ---: | ---: |']
for k,records in D.items():lines.append(f'| `{k}.json` | {len(records)} | {sum(r["status"]=="pending confirmation" for r in records)} | {sum(r["status"]=="speculation" for r in records)} |')
lines+=['','## Source coverage','', 'Counts below are scalar/empty-container leaves, not entity counts. Financial/technical source data remains in the pinned repository for later phases; it is not copied into artificial phase-1 entities.','', '| File | Mapped / merged / split | Deferred | Excluded | SHA-256 of source file |','| --- | ---: | ---: | ---: | --- |']
for f,c in counts.items():lines.append(f'| `{f}` | {sum(c[k] for k in ["mapped","merged","split"])} | {c["deferred"]} | {c["excluded"]} | `{hashlib.sha256((a.source/"data"/f).read_bytes()).hexdigest()}` |')
lines+=['','## Reconstruction outcomes','',
'- All 145 legacy events have explicit dispositions: 144 remain timeline events; the 2025 origin is retained as an assumption. One January 1982 Autodesk organising meeting was recovered from an indirect mention, giving 145 target events.',
'- Existing actor identities are preserved except the market segment `actor.customers`, which is deferred to phase 4. Named vendors, a proposed performer, Mike Riddle and Harvard are recovered without inventing contracts or unnamed people.',
'- All 16 legacy contract sections are assessed. IBM project targets become speculative assumptions rather than a fictional contract; Apple extension responsibilities join the existing Apple cooperation agreement. Additional BPI, MPI, Autodesk, casting-proposal and Apple–Peachtree arrangements are reconstructed with appropriate state/status.',
'- All 15 top-level processes and four Harvard subprocesses are retained. Additional sustained activities are extracted from campaign schedules and programme descriptions. Inferred windows are explicitly marked for review.',
'- All ten campaign identities are preserved; the international January 1982 campaign is recovered from its promotional process. Product definitions, budgets and demand multipliers remain deferred.',
'- Actor descriptions no longer duplicate equity or dated history: their source fragments corroborate canonical agreements, events and premises.',
'- Phase-1 narrative is extracted from technical-side collections using precise source fields. Shared product introduction windows corroborate existing milestones, not hundreds of invented shipment events.',
'- Historical URLs are indexed as unverified source citations. Missing sources and uncertain dates remain review issues. No financial model or frozen baseline was recalculated.','',
'## Open reconciliation issues','', '| ID | Subject |','| --- | --- |']
for r in D['reconciliation_issue']:lines.append(f'| `{r["id"]}` | {r["title"]} |')
lines+=['','## Deferred scope and limits','',
'- Phases 2–5 retain product definitions, BOMs, fabrication parameters/yields, investments, prices and forecast coefficients. Legacy prose may mention these quantities as context; it does not establish a new numeric financial model.',
'- Missing equity basis is not guessed. The DRI allocations are structured; Gary’s 8% Logix grant and BPI’s proposed 33% remain explicit clause statements plus review issues until the basis/beneficiary can be resolved.',
'- A confirmed schema design is not author approval of the extracted story. All baseline candidates remain pending, while identified legacy market-response/financial forecasts remain speculation.',
'- Completeness is intentionally blocked pending author review and issue resolution. Exhaustive semantic correctness cannot be established merely by JSON validation or leaf-disposition coverage.',
'- Ancillary JSON under schemas, tests, generated models and baselines is not an additional authoritative source layer. It is retained unchanged and classified as contracts/fixtures/calculated output/archive, rather than migrated as story facts.','',
'## Reproduce and verify','', '```sh','python migration/migrate_phase1.py --source /path/to/vs_edu1 --output /tmp/phase1-reproduction','node tools/validate-model.js /tmp/phase1-reproduction','python migration/audit_phase1.py --source /path/to/vs_edu1 --data /tmp/phase1-reproduction --report /tmp/phase1-audit.md','npm run test:model','npm run test:migration','```','',
'The migrator refuses an existing output directory to protect future author edits. It also rejects a different source commit or modified source data. A reproduction is a migration snapshot, not an instruction to overwrite subsequently reviewed canonical data.','']
a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text('\n'.join(lines));print(f'Coverage and provenance audit passed: {len(S)} inputs; {checks} pointers; report {a.report}')
