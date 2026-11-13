# External products and standards — iteration 1

Contract 0.19.0 adds `software_standard` and `hardware_standard` technology kinds. Stable technology IDs identify available standards. Approved core standards are eligible for `impacted_standards`; other technology kinds remain ineligible.

## External products

`external_product` requires `id`, `name`, `description`, `specification`, `kind` (`computer`, `peripheral`, `software`, `service`, `other`) and nonempty unique `provider_actor_ids`. Direct `release` date and `impacted_standards` remain optional.

Both `release` and impact `date` are direct Gregorian strings with year, month or day precision (`1979`, `1979-10`, `1979-10-15`). They never contain event-reference objects. Omit release when unknown. Impact date identifies when the assessment applies, not necessarily product release. Calendar validity is enforced, including leap years.

### Specification

New specification entries have exactly the technology chapter shape:

| Attribute | Type | Required |
| --- | --- | --- |
| `number` | unique positive integer within this specification | Yes |
| `chapter_name` | nonblank text | Yes |
| `description` | plain text with `{key}` substitutions | Yes |
| `parameters` | array of `{key, value}` objects; both fields text | Yes; may be empty |

Descriptions and values are rendered by the same component as technology specifications, including expandable Key/Value tables, highlighted substitutions and reference navigation. Keys are unique within their chapter. Every key must be used and every placeholder must resolve. Known typed record IDs used as values must resolve.

The former role-labelled specification schema is retired after all twelve approved conversions. The read-only renderer retains its adapter for historical before snapshots; new live records require the chapter format. The conversion preserved descriptions, roles and referenced IDs. Detailed ownership and support statements remain distinct from the dedicated provider list.

### Impacted standards

One dictionary per distinct standard; repeat assessments over time are outside this iteration's scope.

| Attribute | Type | Required |
| --- | --- | --- |
| `standard_id` | existing `technology.*` of kind `software_standard` or `hardware_standard` | Yes |
| `date` | direct assessment date with preserved precision | Yes |
| `assumption_description` | nonblank narrative: alternate-scenario performance assumptions | Yes |
| `comparison_description` | nonblank narrative: overlap, coexistence or competition with the standard | Yes |
| `outcomes_description` | nonblank narrative: performance perception and commercial consequences | Yes |
| `parameters` | array of `{key, value}` text pairs | Yes; may be empty |

Keys are local to the entire impact entry and can be shared by its three descriptions. Keys must be unique, used and resolvable; substitutions are nonrecursive plain text. Sales effects are qualified assessments, not measured sales or automatic multipliers. Do not infer support from a publisher, announcement, or generic CP/M compatibility. Do not populate an assessment without an authored basis.

The UI shows the technology name followed by the date in brackets, then exactly three paragraphs headed **Base assumptions:**, **Relation to standard:** and **Commercial consequences:**. Values substituted into prose are highlighted. Reference names remain inline; full IDs are available in the expandable parameter table. No extra record or history structure is introduced.

## Current state

The standard-family consolidation and external-product conversions are approved. The three empty affiliation records were deleted through Changes confirm; the unused dataset, schema and registry entry are now retired. Historical decisions and evidence remain intact. Plug and Execute remains a discussion and retains its interface kind.

The active campaign schema now accepts only the timeline shape. Its temporary launch-ownership bridge remains where existing campaigns still need it; schema cleanup does not rewire story ownership.

[Market-response impact sections](MARKET_RESPONSES.md) and [annual sales calculations](../../data_calculation/README.md) are implemented separately. Existing response subjects and descriptions await a later reviewed migration.
