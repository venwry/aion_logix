#!/usr/bin/env python3
"""Stage audited schema retirement, or finish after Changes confirm approval.

--apply: remove already absent declarations and constrain pending empty fields.
--final: check all pending declarations have no live/proposed instances.
--final --apply: retire those declarations and advance the contract.
No foundation, authorization or decision records are edited.
"""
import argparse
import copy
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'data_storytelling/review_evidence/unpopulated-field-retirement'


def read(path):
    return json.loads(path.read_text())


def parent(schema, parts):
    for key in parts:
        schema = schema[int(key)] if isinstance(schema, list) else schema[key]
    return schema


def observed(schemas, candidates):
    by_id = {s['$id']: (name, s) for name, s in schemas.items()}
    targets = {}
    for c in candidates:
        owner = parent(schemas[c['file']], c['parent'])
        targets[(id(owner), c['property'])] = c
    hits = []

    def walk(schema, document, value, location):
        if '$ref' in schema:
            url, _, fragment = schema['$ref'].partition('#')
            document = by_id[url][1] if url else document
            schema = document
            for key in fragment.strip('/').split('/') if fragment else []:
                schema = schema[key.replace('~1', '/').replace('~0', '~')]
        if isinstance(value, dict):
            for key, child in schema.get('properties', {}).items():
                if key not in value:
                    continue
                if (id(schema), key) in targets:
                    hits.append(location + '/' + key)
                walk(child, document, value[key], location + '/' + key)
        if isinstance(value, list) and isinstance(schema.get('items'), dict):
            for i, child in enumerate(value):
                walk(schema['items'], document, child, location + '/' + str(i))
        for union in ('allOf', 'anyOf', 'oneOf'):
            for branch in schema.get(union, []):
                walk(branch, document, value, location)

    for path in (ROOT / 'data_foundation').glob('*.json'):
        data = read(path)
        kind = next(iter(data))
        schema = schemas[kind + '.schema.json']
        walk(schema, schema, data, str(path.relative_to(ROOT)))
    for proposal in read(ROOT / 'data_storytelling/change.json')['change']:
        for element in proposal.get('elements', []):
            if element.get('after'):
                schema = schemas[element['record_type'] + '.schema.json']
                walk(schema['$defs']['record'], schema, element['after'],
                     proposal['id'] + '/after/' + element['record_id'])
    return sorted(set(hits))


def transform(schemas, candidates, final):
    result = copy.deepcopy(schemas)
    for c in candidates:
        owner = parent(result[c['file']], c['parent'])
        key = c['property']
        if key not in owner.get('properties', {}):
            continue
        if c['present'] and not final:
            states = set(c['empty'])
            if states == {'null'}:
                replacement = {'type': 'null'}
            elif states == {'empty_list'}:
                replacement = {'type': 'array', 'maxItems': 0}
            else:
                raise ValueError('Unexpected empty payload ' + str(c))
            owner['properties'][key] = {
                **replacement, 'deprecated': True,
                'description': 'Empty-only compatibility pending Changes confirm cleanup. '
                               'Run tools/retire-unpopulated-fields.py --final --apply after approval.'}
        else:
            del owner['properties'][key]
        if key in owner.get('required', []):
            owner['required'].remove(key)
    assumption = result['assumption.schema.json']['$defs']['record']
    assumption.pop('oneOf', None)
    for key in ('topic', 'statements'):
        if key not in assumption['required']:
            assumption['required'].append(key)
    agreement = result['agreement.schema.json']['$defs']
    agreement['record']['properties']['clauses']['items'] = {'$ref': '#/$defs/clause'}
    agreement.pop('legacy_clause', None)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--final', action='store_true')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    schemas = {p.name: read(p) for p in (ROOT / 'schemas').glob('*.schema.json')}
    candidates = read(EVIDENCE / 'audit.json')['schema_candidates']
    # Final checks cover every current record and every pending after-snapshot,
    # including records created after the original audit.
    if args.final:
        hits = observed(schemas, [c for c in candidates if c['present']])
        if hits:
            print(f'Blocked: {len(hits)} empty-field instances remain in live data or proposed after-snapshots. No files changed.')
            print('\n'.join(hits[:12]))
            return 1
    result = transform(schemas, candidates, args.final)
    changed = {name: s for name, s in result.items() if s != schemas[name]}
    if not changed:
        print('Requested schema retirement is already applied.')
        return 0
    if not args.apply:
        print(f'Ready to update {len(changed)} schemas; add --apply to write.')
        return 0
    destinations = [ROOT / 'schemas' / name for name in changed]
    destinations += [ROOT / name for name in [
        'data_storytelling/manifest.json', 'code/model-contract.js', 'README.md',
        'DATA_MODEL_PRINCIPLES.md', 'docs/README.md',
        'docs/data_model/REFERENCE_RULES.md', 'docs/data_model/STORYTELLING_FILE_REFERENCE.md',
        'docs/data_model/CATALOGUE_VALIDATION.md', 'docs/data_model/MODEL_GUIDE.md',
        'docs/data_model/FOUNDATION_SPECIFICATION.md']]
    backups = {path: path.read_bytes() for path in destinations}
    try:
        for name, schema in changed.items():
            (ROOT / 'schemas' / name).write_text(json.dumps(schema, indent=2) + '\n')
        manifest_path = ROOT / 'data_storytelling/manifest.json'
        manifest = read(manifest_path)
        old = manifest['manifest'][0]['schema_version']
        major, minor, _ = map(int, old.split('.'))
        new = f'{major}.{minor + 1}.0'
        manifest['manifest'][0]['schema_version'] = new
        manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
        docs = ['code/model-contract.js', 'README.md', 'DATA_MODEL_PRINCIPLES.md',
                'docs/README.md', 'docs/data_model/REFERENCE_RULES.md',
                'docs/data_model/STORYTELLING_FILE_REFERENCE.md',
                'docs/data_model/CATALOGUE_VALIDATION.md', 'docs/data_model/MODEL_GUIDE.md']
        for name in docs:
            path = ROOT / name
            path.write_text(path.read_text().replace(old, new))
        if args.final:
            path = ROOT / 'docs/data_model/MODEL_GUIDE.md'
            text = path.read_text().replace(
                'Seven empty-only compatibility declarations remain until the cleanup proposals are approved.',
                'The seven empty-only compatibility declarations are retired after approved cleanup.')
            path.write_text(text)
        subprocess.run(['node', 'tools/generate-foundation-spec.js'], cwd=ROOT, check=True)
        subprocess.run(['node', 'tools/validate-foundation.js'], cwd=ROOT, check=True)
        print(f'Updated {len(changed)} schemas to contract {new}; foundation and authorization unchanged.')
    except BaseException:
        for path, content in backups.items():
            path.write_bytes(content)
        raise
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
