"""Revise pending proposal 5 and propose removal of the approved pilot event."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'data_storytelling/review_evidence/ssg-abacus-feedback'
queue_path = ROOT / 'data_storytelling/change.json'
queue = json.loads(queue_path.read_text())
proposal = next(p for p in queue['change'] if p['id'] == 'change.ssg_abacus_early')
feedback = next(r for r in json.loads((ROOT / 'data_storytelling/change_review.json').read_text())['change_review']
                if r['id'] == 'change_review.1065e77b-8905-4302-a025-0d92b6b6738f')
assert not EVIDENCE.exists(), 'Feedback revision already prepared; preserve its evidence.'
old = copy.deepcopy(proposal)

for element in proposal['elements']:
    r = element['after']
    if r['id'] not in ['software_edition.abacus_1', 'software_edition.abacus_1.model_ii']:
        continue
    for version in r['composition_history']:
        definition = version['technical_definition']
        definition['features'] = [f for f in definition['features'] if f != 'print forms/layout using spreadsheet data']
        del definition['programmatic_file_access']
        definition['data_interchange']['contract'] = (
            'Import versioned SSG General Ledger summary files into ordinary worksheet cells as independent planning inputs. '
            'Map named columns, account identifiers, period, currency and decimal amounts; reconcile control totals. '
            'Validate parsing, rounding, memory and save/reopen. Close General Ledger before loading Abacus. '
            'The import is handled by Abacus itself and requires no scripting runtime, formatted-table object or report-layout engine. '
            'There is no direct ledger write-back, live database link or simultaneous application execution.')
    chapters = r['technical_specification']['chapters']
    chapters[0]['chapter_name'] = 'Sparse worksheet model'
    chapters[0]['description'] = (
        'Abacus 1.x stores one sparse worksheet per document, with formulas and editor-consistent navigation and editing. '
        'Its initial scope is worksheet calculation and printing worksheet results. Formatted table/report layouts and '
        'scripting integration belong to later releases.')
    chapters[1]['chapter_name'] = 'General Ledger summary-file import'
    chapters[1]['description'] = (
        'Abacus imports versioned disk summaries from {accounting_export_id} into ordinary worksheet cells as independent '
        'planning inputs. Map named columns, account identifiers, period, currency and decimal amounts, then reconcile '
        'record counts and control totals. Validate parsing, rounding, memory limits and save/reopen. Close General Ledger '
        'before loading Abacus; there is no ledger write-back, live database access or simultaneous application execution. '
        'This built-in import does not depend on a scripting runtime, formatted-table object or report-layout engine.')
    for parameter in r['technical_specification']['parameters']:
        if parameter['key'] == 'accounting_export_id':
            parameter['ref_role'] = 'SSG General Ledger edition defining the imported accounting summaries'

proposal['title'] = '5. SSG General Ledger — Correct Abacus 1.x scope and retain later Abacus 2 integration'
proposal['reason'] += (
    ' Revised against author feedback change_review.1065e77b-8905-4302-a025-0d92b6b6738f: '
    'Abacus 1.x, including the Model II edition, must not claim Pulse access or formatted table/report layouts. '
    'Remove the legacy programmatic-file-access claim and printed-form feature as well as correcting chapters 1 and 2. '
    'Retain the direct SSG summary-file import into ordinary worksheet cells. Abacus 2 retains its later Pulse and '
    'report/layout capabilities; no advanced Abacus 3 storage/query features are moved into 1.x. '
    'Original before snapshots and feedback history remain unchanged.')

events = json.loads((ROOT / 'data_foundation/event.json').read_text())['event']
processes = json.loads((ROOT / 'data_foundation/process.json').read_text())['process']
pilot = next(r for r in events if r['id'] == 'event.bpi_pilot')
process = next(r for r in processes if r['id'] == 'process.ssg_general_ledger_port')
revised_process = copy.deepcopy(process)
revised_process['steps'] = [s for s in revised_process['steps'] if s.get('event_id') != 'event.bpi_pilot']
assert len(revised_process['steps']) == len(process['steps']) - 1
removal = dict(
    id='change.ssg_remove_pilot', category='data',
    title='12. SSG General Ledger — Remove the business/accountant pilot event',
    reason='The author requests removal of event.bpi_pilot. Remove the already approved event and its owning development-process step atomically. Preserve the separate compiler, financial-regression, recovery and release checks already specified in the port; do not introduce another pilot event or invent a replacement date. The July agreement, August development start, January CBASIC release and June joint launch dates remain unchanged.',
    elements=[
        dict(record_type='event', record_id=pilot['id'], before=pilot, after=None),
        dict(record_type='process', record_id=process['id'], before=process, after=revised_process),
    ])
assert not any(p['id'] == removal['id'] for p in queue['change'])
queue['change'].append(removal)
EVIDENCE.mkdir(parents=True)
def write(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
write(EVIDENCE / 'before-proposal.json', old)
write(EVIDENCE / 'feedback.json', feedback)
write(EVIDENCE / 'proposals.json', {'change': [proposal, removal]})
write(queue_path, queue)
print('Revised proposal 5; added proposal 12. Foundation and authorization files unchanged.')
