import fs from 'node:fs';
import path from 'node:path';

// Run from repository root. Only current foundation schemas determine this document.
const names = fs.readdirSync('data_foundation').filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
const schemas = Object.fromEntries([...names, 'common'].map(n => [n, JSON.parse(fs.readFileSync(`schemas/${n}.schema.json`))]));
function resolve(value, owner) {
  if(value['x-boundary'])return [{type:'object',properties:{value:{type:'string | null','x-ref':['event']},precision:{type:'string',enum:['year','month','day','event','unknown']}},required:['value','precision']},owner];
  if (!value.$ref) return [value, owner];
  const [file, pointer] = value.$ref.split('#');
  const target = file ? path.basename(file).replace('.schema.json', '') : owner;
  let node = schemas[target];
  for (const key of pointer.slice(1).split('/')) node = node[key];
  return resolve(node, target);
}
const entities = {};
const refs = [];
for (const name of names) {
  const fields = [];
  function walk(raw, owner, prefix = '', depth = 0) {
    const [object, context] = resolve(raw, owner);
    for (const [key, definition] of Object.entries(object.properties || {})) {
      const [field, fieldOwner] = resolve(definition, context);
      const array = field.type === 'array';
      const [item, itemOwner] = array ? resolve(field.items, fieldOwner) : [field, fieldOwner];
      const fieldPath = prefix + key + (array ? '[]' : '');
      const targets = item['x-ref'] || [];
      fields.push({key, path: fieldPath, depth, required: (object.required || []).includes(key), type: array ? `array<${item.type}>` : field.type, targets, definition: field, item});
      if (targets.length) refs.push({from: name, path: fieldPath, targets});
      if (item.properties) walk(item, itemOwner, fieldPath + '.', depth + 1);
    }
  }
  walk(schemas[name].$defs.record, name);
  entities[name] = fields;
}
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const tree = (name, diagram = false) => entities[name].map(f => `${'│  '.repeat(f.depth)}${f.depth ? '└─ ' : ''}${f.key}${f.required ? '*' : '?'}: ${f.type}${f.targets.length ? ' → ' + (f.targets.length === names.length ? 'any foundation ID' : f.targets.join(' / ')) : ''}`).map(s => diagram ? escape(s) : s);
const lines = [
  '# Foundation dataset specification', '',
  'This document describes the current foundation schema contract (version 0.5.0). It is generated from `schemas/*.schema.json` for every JSON dataset in `data_foundation/`. Shared schema definitions are expanded inside their owning entities. Current authorization, sources and proposed changes belong to `data_storytelling/`; completed migration evidence is preserved in `archived_no_longer_valid/`. Both are deliberately outside this diagram.', '',
  '## Reading the diagram', '',
  '- Each entity represents one dataset file, whose envelope is `{ "dataset_name": [record, ...] }`. The entity contains the hierarchical structure of one record, not a sample record.',
  '- `*` means required within its immediate parent object; `?` means optional there. A required child does not make its optional parent required. Conditional requirements are specified below.',
  '- Indentation shows owned objects and array items. `array<T>` contains zero or more values unless the schema says otherwise. Nested objects are not independent datasets.',
  '- A solid arrow runs from the referencing dataset to the dataset containing the referenced `id`; labels give exact paths, with `[]` denoting array items. Several fields between the same pair share one line.',
  '- Dashed arrows through `Any foundation record` represent polymorphic references: each value chooses one of the ' + names.length + ' target datasets by its ID prefix. They do not require a value from every target dataset. Self-references are included.',
  '- Process boundary `value` references an event only when `precision` is `event`; calendar and unknown variants are not references.',
  '- Embedded clause IDs resolve within agreement.clauses[]; supersedes_clause_id therefore points to an agreement-owned term, not a clause dataset.',
  '- These arrows describe permitted references, not SQL ownership or reverse cardinality. No inverse uniqueness is implied.', '',
  '## Entity and reference diagram', '',
  'The diagram is intentionally comprehensive. Use the per-entity trees and reference catalogue below when reading on a narrow screen.', '',
  '```mermaid', '%%{init: {"flowchart": {"htmlLabels": true, "wrappingWidth": 1200}}}%%', 'flowchart LR', '  classDef schemaEntity font-family:monospace,text-align:left,white-space:pre;'
];
for (const name of names) lines.push(`  ${name}["<pre style='text-align:left;font-family:monospace;white-space:pre;margin:0'>${name}.json<br/>${tree(name, true).join('<br/>')}</pre>"]:::schemaEntity`);
const grouped = new Map();
for (const ref of refs) {
  const targets = ref.targets.length === names.length ? ['any_foundation'] : ref.targets;
  for (const target of targets) {
    const key = ref.from + ':' + (target === 'clause' ? 'agreement' : target);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(ref.path);
  }
}
lines.push('  any_foundation{{"Any foundation record<br/>ID prefix selects one target"}}');
for (const [pair, paths] of grouped) {
  const [from, to] = pair.split(':');
  lines.push(`  ${from} ${to === 'any_foundation' ? '-.' : '--'} "${paths.join('<br/>')}" ${to === 'any_foundation' ? '.->' : '-->'} ${to}`);
}
for (const name of names) lines.push(`  any_foundation -.-> ${name}`);
lines.push('```', '', '## Dataset specifications', '');
const purpose = {
 actor: 'People and organizations participating in the story.',
 actor_relationship: 'Relationships between actors, including dated roles and links to agreements.',
 agreement: 'An arrangement with its own identity, parties and lifecycle. Terms are owned in clauses[] and authorized with the whole agreement.',
 assumption: 'Explicit premises of the alternative world and their scope.',
 campaign: 'Marketing activity with timing, participants, actions and intended or recorded effects.',
 event: 'An occurrence or planned occurrence at a date or over a period, with participants, actions and outcomes.',
 location: 'Named places, including hierarchical containment through a parent location.',
 narrative_period: 'Named intervals used to organize the story.',
 process: 'An activity extending through time, with participants and milestones.',
 programme: 'Historical coordinating activity.',
 product: 'Named product, service or software subject without composition.',
 technology: 'Technical concept or fabrication technology; dated changes belong to events/processes.',
 manufacturing_capability: 'Manufacturer- and recipe-scoped capability; maturity transitions are event outcomes.',
 market_response: 'Qualitative market reaction with timing supplied by its event/process carrier.'
};
function constraints(f) {
  const parts = [];
  for (const [label, v] of [['enum', f.item.enum], ['pattern', f.item.pattern], ['minimum', f.item.minimum], ['maximum', f.item.maximum], ['minLength', f.item.minLength], ['minItems', f.definition.minItems], ['uniqueItems', f.definition.uniqueItems]]) {
    if (v !== undefined) parts.push(`${label}: ${JSON.stringify(v)}`);
  }
  return parts.join('; ') || '—';
}
for (const name of names) {
  lines.push(`### ${name}`, '', purpose[name], '', `File: [${name}.json](../../data_foundation/${name}.json) · Schema: [${name}.schema.json](../../schemas/${name}.schema.json)`, '', '```text', `${name}[]`, ...tree(name), '```', '', '| Field path | Required in parent | Type | Constraints / allowed values |', '| --- | --- | --- | --- |');
  for (const f of entities[name]) lines.push(`| \`${f.path}\` | ${f.required ? 'yes' : 'no'} | \`${f.type}\` | ${constraints(f).replaceAll('|', '\\|')} |`);
  if (name === 'process') lines.push('', '**Boundary union:** calendar value with year/month/day precision, event ID with `precision: event`, or null with `precision: unknown`. The diagram/catalogue value reference applies only to event anchors.');
  if (name === 'agreement') lines.push('', '**Embedded clause conditional rule:** `equity` is required exactly when `kind` is `equity`; it is forbidden for every other kind.');
  lines.push('');
}
lines.push('## Reference catalogue', '', 'Every schema attribute marked `x-ref` appears here, including references inside shared and nested objects. Each target resolves to the target record’s `id`. Polymorphic alternatives are allowed targets, not simultaneous requirements.', '', '| Source dataset | Attribute path | Permitted target datasets |', '| --- | --- | --- |');
for (const ref of refs) lines.push(`| ${ref.from} | \`${ref.path}\` | ${ref.targets.map(t => `\`${t}\``).join(', ')} |`);
lines.push('', '## Contract notes', '',
 'All foundation envelopes and record/value objects reject undeclared properties. IDs are prefixed by their dataset name. Shared dates preserve year, month or day precision; the validator also checks real dates, precision consistency, period ordering and reference existence. Money `basis` describes the story’s financial meaning and is not an editorial authorization status.', '',
 'The schema files and `tools/validate-model.js` remain authoritative for machine validation. This specification documents existing structures; it does not introduce new fields, approve records or alter story content.', '',
 'Regenerate this document after approved schema changes with `node tools/generate-foundation-spec.js` from the repository root.', '');
fs.writeFileSync('docs/data-model/FOUNDATION_SPECIFICATION.md', lines.join('\n'));
console.log(`Documented ${names.length} datasets, ${Object.values(entities).flat().length} fields and ${refs.length} reference attributes.`);
