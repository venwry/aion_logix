# External products and standards — iteration 1

Contract 0.18.0 adds `software_standard` and `hardware_standard` technology kinds. Stable technology IDs identify available standards. Reclassification is proposed separately for each candidate; until approved, its old kind remains and it cannot be used in `impacted_standards`.

## External products

`external_product` retains `id`, `name`, `description` and required `specification`. Optional additive fields are `kind` (`computer`, `peripheral`, `software`, `service`, `other`), nonempty unique `provider_actor_ids`, direct `release` date and `impacted_standards`. New/migrated records supply kind and providers; optional runtime declarations allow existing records to remain valid until their individual proposals are approved.

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

Compatibility schemas also accept a whole specification in the previous `no`, `description`, `ref_id`, `ref_role` format. Mixed old/new entries are rejected. The read-only adapter displays those existing and historical records as chapters. Migration proposals preserve each original description, use its role as the chapter name, and retain its ID as a named reference parameter. Detailed ownership and support statements remain even where the provider also appears in the dedicated provider list.

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

## Review and deferred work

The standard-kind candidates are now revised into three actionable family proposals and one Plug and Execute discussion; see [the pending consolidation design](../proposals/STANDARD_FAMILY_CONSOLIDATION.md). The 12 external-product conversions and one atomic removal of three redundant affiliation records remain separate. No incoming foundation references to those affiliation IDs remain. Their references in the current authorization-coverage discussion are removed; historical decisions remain unchanged.

The relationship dataset, schema, registry and associated documentation remain in place by the author's instruction. Their deletion is parked until a separate instruction after these tasks. No new market-response structure or sales dataset is deployed in this iteration.

The earlier [ecosystem and sales proposal](../proposals/ECOSYSTEM_AND_SALES_SCHEMA.md) remains a proposal for later market-response and calculation work. This document supersedes its external-product specification, impact and date designs.

Use `node tools/verify-standard-families.js` for the current revised proposal queue. The original `tools/verify-ecosystem-iteration-1.js` verifies the earlier proposal snapshot and is superseded for queue matching. Run `CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/ecosystem-iteration-1.spec.cjs` for rendering checks.
