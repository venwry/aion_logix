# External products and standards

Contract 0.21.0 includes `software_standard` and `hardware_standard` technology kinds. Stable technology IDs identify available standards. Approved core standards are eligible for `impacted_standards`; other technology kinds remain ineligible.

## External products

`external_product` requires `id`, `name`, `description`, `specification`, `kind` (`computer`, `peripheral`, `software`, `service`, `other`) and nonempty unique `provider_actor_ids`. Direct `release` date, `impacted_standards` and `impacted_products` are optional. The required top-level `description` may be empty: consolidate unique descriptive content into specification chapters, and remove repeated summaries. Do not leave product or standards impact prose in intrinsic specification chapters.

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

### Impacted standards and products

One dictionary per distinct target within each section; repeated assessments of the same target over time are not supported. `impacted_products` has exactly the standard-impact shape except that `product_id` replaces `standard_id`. Targets may be either internal `product.*` or `external_product.*`; self-references are rejected.

| Attribute | Type | Required |
| --- | --- | --- |
| `standard_id` | existing `technology.*` of kind `software_standard` or `hardware_standard` | Yes |
| `product_id` | existing `product.*` or `external_product.*`; replaces `standard_id` in `impacted_products` | Yes for product impacts |
| `relationship` | one of the six values below | Yes for new/revised entries; see transition rule |
| `date` | direct assessment date with preserved precision | Yes |
| `assumption_description` | nonblank narrative: alternate-scenario performance assumptions | Yes |
| `comparison_description` | nonblank narrative: overlap, coexistence or competition with the standard | Yes |
| `outcomes_description` | nonblank narrative: performance perception and commercial consequences | Yes |
| `parameters` | array of `{key, value}` text pairs | Yes; may be empty |

Keys are local to the entire impact entry and can be shared by its three descriptions. Keys must be unique, used and resolvable; substitutions are nonrecursive plain text. Sales effects are qualified assessments, not measured sales or automatic multipliers. Do not infer support from a publisher, announcement, or generic CP/M compatibility. Do not populate an assessment without an authored basis.

Relationships are directed **from this external product to its target**, not the reverse. For product targets, apply the same meanings to the product's implementation, platform or interoperability scope.

| Value | Meaning |
| --- | --- |
| `implements` | Supplies an implementation of the referenced standard or product design. |
| `requires` | Requires the referenced standard/platform or product to operate in the stated scope. |
| `supports` | Interoperates with products using the standard, or with the referenced product, within the stated scope. |
| `extends` | Adds capabilities beyond the target; explain whether ordinary compatibility is preserved. |
| `competes_with` | Offers an alternative that may reduce adoption of the target. |
| `incompatible_with` | Cannot interoperate in the explicitly described scope. |

Missing qualification is not proof of incompatibility. Sharing an underlying interface is not proof of interoperability. Application use of a standard is not an implementation of that standard. Do not insert an impact row merely to record no demonstrated impact; retain the reasoning in editorial evidence. Distinguish historical commercial products from fictional adaptations, and preserve chronology when applying later capabilities.

**Transition rule:** product impacts require `relationship` in the schema. Approved standard impacts without it remain schema-valid while their Changes confirm conversions await approval. Every new or revised impact in the conversion proposals supplies it. This preserves exact-content authorization without rewriting approved foundation records. Remove the legacy omission allowance only after all live and pending records have been migrated.

The UI shows the target name followed by the date in brackets, and a relationship label, then three narrative paragraphs headed **Base assumptions:**, **Relation to standard:** (or **Relation to product:**) and **Commercial consequences:**. Values substituted into prose are highlighted. Reference names remain inline; full IDs are available in the expandable parameter table. No extra record or history structure is introduced.

## Current state

The standard-family consolidation and earlier chapter conversions are approved. The description/impact restructuring is pending in Changes confirm; its evidence and source limits are in `data_storytelling/review_evidence/external-impact-revision/`. The three empty affiliation records were deleted through Changes confirm; the unused dataset, schema and registry entry are now retired. Historical decisions and evidence remain intact. Plug and Execute remains a discussion and retains its interface kind.

The active campaign schema now accepts only the timeline shape. Its temporary launch-ownership bridge remains where existing campaigns still need it; schema cleanup does not rewire story ownership.

[Market-response impact sections](MARKET_RESPONSES.md) and [annual sales calculations](../../data_calculation/README.md) are implemented separately. Existing response subjects and descriptions await a later reviewed migration.

## Core families and chronology

| Core technology ID | Standard scope |
| --- | --- |
| `technology.flexibus` | Peripheral transport; later pointing-device class. |
| `technology.logix_tui_standard` | Controls and keyboard/editing core; later pointer interaction. |
| `technology.aion_c_portability_framework` | Common language/source contracts, target profiles, portable API and display services. |
| `technology.logix_digital_video` | Display link/control contract, raster profiles and palette extensions. |
| `technology.logix_lan100_link` | Shared physical/data-link contract and negotiated rates. |

These are the approved families, not a list of every interface or implementation technology. Plug and Execute retains kind `interface` pending a sufficiently defined contract. Z80/CP/M and ERA/AIONix are coexisting AION C profiles; source portability does not imply cross-target binary compatibility. The platform API's existing 1.0 label is retained without inventing a standard version for each OS release.

Chronology is expressed in scoped specification chapters: the June 1978 commercial baseline, May 1979 independent compatibility programmes, May 1980 ERA/AIONix target, 1981 networking programme and June 1982 pointer/graphics extensions remain distinct. Development commitments and planned programmes do not establish completed qualification or shipment. No `revisions[]` schema or automatic as-of-date capability resolver exists; readers and assessments must respect the stated scope.
