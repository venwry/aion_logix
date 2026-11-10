#!/usr/bin/env python3
"""Read-only schema field coverage audit. Run from the repository root.

JSON-pointer segments are preserved (including literal dots in object keys).
`*` represents every array item. Union branches are inventoried, not asserted
applicable to every record. Missing parents produce no nested observations.
"""
import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = {s['$id']: s for p in (ROOT / 'schemas').glob('*.json')
           if '$id' in (s := json.loads(p.read_text()))}
MISSING = object()


def resolve(schema, document):
    if '$ref' in schema:
        url, _, fragment = schema['$ref'].partition('#')
        document = SCHEMAS[url] if url else document
        schema = document
        for key in fragment.strip('/').split('/') if fragment else []:
            schema = schema[key.replace('~1', '/').replace('~0', '~')]
    return schema, document


def paths(schema, document, prefix=(), stack=()):
    schema, document = resolve(schema, document)
    if id(schema) in stack:
        raise ValueError('Recursive schema needs an explicit audit policy')
    stack = (*stack, id(schema))
    for key, child in schema.get('properties', {}).items():
        path = (*prefix, key)
        yield path
        yield from paths(child, document, path, stack)
    if isinstance(schema.get('items'), dict):
        yield from paths(schema['items'], document, (*prefix, '*'), stack)
    for union in ('allOf', 'anyOf', 'oneOf'):
        for child in schema.get(union, []):
            yield from paths(child, document, prefix, stack)


def values(records, path):
    current = records
    for segment in path:
        if segment == '*':
            current = [item for value in current if isinstance(value, list) for item in value]
        else:
            current = [value.get(segment, MISSING) for value in current if isinstance(value, dict)]
    return current


def state(value):
    if value is MISSING:
        return 'absent'
    if value is None:
        return 'null'
    if value == []:
        return 'empty_list'
    if value == {}:
        return 'empty_dict'
    if isinstance(value, str) and not value.strip():
        return 'blank'
    return 'populated'  # Includes zero and false.


def pointer(path):
    return '/' + '/'.join(key.replace('~', '~0').replace('/', '~1') for key in path)


def audit():
    result = {}
    for file in sorted((ROOT / 'data_foundation').glob('*.json')):
        data = json.loads(file.read_text())
        kind = next(iter(data))
        records = data[kind]
        schema = SCHEMAS[f'https://aion-logix.invalid/schemas/{kind}.schema.json']
        declared = sorted(set(paths(schema['$defs']['record'], schema)))
        empty = []
        for path in declared:
            counts = collections.Counter(map(state, values(records, path)))
            if not counts['populated']:
                empty.append({'path': pointer(path), 'segments': list(path),
                              'parent_instances': sum(counts.values()), 'counts': dict(counts)})
        branches = []
        for row in sorted(empty, key=lambda row: (len(row['segments']), row['path'])):
            if not any(row['segments'][:len(parent['segments'])] == parent['segments'] for parent in branches):
                branches.append(row)
        result[kind] = {'file': str(file.relative_to(ROOT)), 'records': len(records),
                        'schema_paths': len(declared), 'empty_paths': empty,
                        'empty_branches': sorted(branches, key=lambda row: row['path'])}
    return {'method': 'Missing, null, blank strings, [] and {} count as empty. Zero and false are populated. Paths traverse $ref and union branches. Absent union alternatives are not validation errors. Descendants of wholly empty sections are included in empty_paths and collapsed in empty_branches. A zero parent_instances count means no parent object exists.',
            'datasets': result}


if __name__ == '__main__':
    print(json.dumps(audit(), indent=2))
