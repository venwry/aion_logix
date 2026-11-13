# Ecosystem, standards impact and annual sales — schema proposal

**Status: implemented with revisions.** External products follow [External products and standards](../data_model/ECOSYSTEM_STANDARDS.md). Market responses use [the current impact sections](../data_model/MARKET_RESPONSES.md); annual sales follow [the calculation guide](../../data_calculation/README.md). The original date-or-event design and the response timing field below are not implemented. This document preserves the original design discussion; current schemas and linked guides are authoritative.
Prepared: 12 November 2026. Baseline: main at `4613a3e`.

This document specifies a compact model for third-party offerings, their effect on standards, market reactions and revisable annual sales estimates. Approval of this document would approve the design, not authorize any migrated foundation record. Existing schemas and data remain unchanged.

## 1. Scope and decisions to confirm

| Decision | Proposed choice |
| --- | --- |
| Organisation relationships | Formal commitments remain in `agreement`. Do not extend or introduce dependencies on `actor_relationship`; its eventual retirement is separate work. |
| Third-party offerings | Extend the existing `external_product` record. Both partners and competitors use it. |
| Standards | Reference existing `technology` records; do not create a standards or support dataset. |
| Release dates | Use a calendar date for ordinary releases; reference an event only for important releases. Never require a campaign. |
| Standards impact | Nested sections on external products and market responses. No separate support records or milestone histories. |
| Market reactions | Extend existing `market_response`; do not create one for every release. |
| Sales | New `annual_sales` records under `data_calculation`, outside foundation authorization. |
| Geography and segment | Documented text labels, not new entity types. |
| Compatibility | Deploy additive optional foundation fields first; migrate records through Changes confirm. |

A company is not permanently classified as partner or competitor. It may cooperate on interfaces while selling a competing computer. Product descriptions and agreements explain the scope; market responses describe consequential reactions.

## 2. Shared conventions

- All objects reject undeclared attributes (`additionalProperties: false`).
- New text fields are nonempty after trimming. Optional unknown values are omitted, not represented by null or empty strings.
- New optional arrays are omitted when empty. When present, they contain at least one item. Existing arrays keep their current schema rules unless explicitly changed below.
- References resolve to existing records of the declared type. A reference does not confer authorization.
- Dates preserve known precision. Do not invent a day or month.
- Narrative impact statements express reasons, conditions and limitations; they are not automatic numerical sales multipliers.
- No prices, revenues or margins are introduced by this proposal.

### 2.1 Date-or-event value object

Used by `external_product.release`, external-product standards entries' `available_from`, and `market_response.occurred_at`.

| Attribute | Type | Required | Validation and meaning |
| --- | --- | --- | --- |
| `date` | string | Exactly one of `date`, `event_id` | Valid Gregorian `YYYY`, `YYYY-MM` or `YYYY-MM-DD`. Represents the year, month or day at its recorded precision. |
| `event_id` | event reference | Exactly one of `date`, `event_id` | Existing `event.*`. Resolve its date from `event.time`; never duplicate that date here. |

Examples: `{"date":"1979-10"}` or `{"event_id":"event.tandy_release"}`. Both fields together, neither field, unknown-date placeholders and additional fields are invalid. Omit an optional enclosing attribute if its date is unknown.

This is a new shared value object; it does not replace existing event, process or composition date structures. Implement it once in a shared schema definition.

## 3. External products

Dataset: `data_foundation/external_products.json`. Envelope remains `{"external_product": [...]}`. Schema: `schemas/external_product.schema.json`.

### 3.1 Record attributes

| Attribute | Type | Required in target authoring model | Change and meaning |
| --- | --- | --- | --- |
| `id` | string | Yes | Unchanged. Unique `external_product.*` identity. Preserve existing IDs even where names have changed. |
| `name` | string | Yes | Unchanged. Commercial offering name. |
| `description` | string | Yes | Unchanged. What is offered, to whom, and important scope. |
| `kind` | enum | Yes for new/migrated records | **New:** `computer`, `peripheral`, `software`, `service`, `other`. Classify the commercial offering; explain `other` in the description. |
| `provider_actor_ids` | array of actor references | Yes for new/migrated records | **New:** unique `actor.*` IDs for organisations commercially providing the offering. An engineering contributor is not automatically a provider. |
| `release` | date-or-event object | No | **New:** first customer release of this specific offering, not its announcement or prototype demonstration. Omission means unknown/not established; it does not prove unreleased status. |
| `specification` | array of specification entries | Yes | Existing structure retained, including its ability to be empty. See below. |
| `impacted_standards` | array of standards-impact entries | No | **New:** direct technical relationships and their explained ecosystem implications. Omission means undocumented, not incompatible. |

Deployment schema initially keeps `kind` and `provider_actor_ids` optional so existing approved records remain valid. The authoring rule requires them for new/migrated records. Promote them to runtime-required only after complete reviewed migration.

No withdrawal field, implementation list, market-segment list or campaign link is added in this version. Existing specification references can identify implementations and hosts. Add lifecycle detail later only if actual analysis needs it.

### 3.2 Existing specification entry — retained contract

| Attribute | Type | Required | Meaning |
| --- | --- | --- | --- |
| `no` | integer ≥ 1 | Yes | Item number. Preserve current numbering during unrelated edits. |
| `description` | string | Yes | Explanation of this direct relationship. |
| `ref_id` | foundation reference | Yes | One target using the existing schema's permitted reference types. No new reference types are introduced. |
| `ref_role` | string | Yes | Meaning of that relationship, such as technical implementation, supported host or governing agreement. |

Once `provider_actor_ids` is populated, remove specification entries that merely repeat the provider identity. Preserve distinct ownership, licensing or support facts in the description or an appropriately explained specification entry. Likewise, move duplicated standards assertions into `impacted_standards` without dropping their limitations.

The existing allowed reference union still includes historical `actor_relationship` references. This proposal does not expand or newly depend on them; removing them from the shared contract requires the separate retirement migration.

### 3.3 External-product standards-impact entry

| Attribute | Type | Required | Meaning |
| --- | --- | --- | --- |
| `technology_id` | technology reference | Yes | Existing standard/interface/platform contract, such as `technology.flexibus`. Do not reference an agreement or commercial software offering here. |
| `relationship` | enum | Yes | One of the values in the next table. |
| `description` | string | Yes | Explain the product's relationship to the standard and its likely ecosystem significance. Clearly distinguish established capability from expected effect. |
| `requirements` | string | No | Required configuration, adapter, software version or other conditions. Plain prose; no additional dependency graph. |
| `limitations` | string | No | Partial support, exclusions, portability or interoperability limits. |
| `available_from` | date-or-event object | No | First customer availability of this relationship if later than/different from the product release. If omitted, inherit known `release`; if neither exists, availability is unknown. |

| `relationship` value | Meaning |
| --- | --- |
| `implements` | Supplies an implementation of the standard. |
| `requires` | Requires the standard/platform to operate. |
| `supports` | Interoperates with products using the standard, within stated scope. |
| `extends` | Adds capabilities beyond the standard; explain whether ordinary compatibility is preserved. |
| `competes_with` | Offers an alternative that may reduce adoption of the standard. |
| `incompatible_with` | Cannot interoperate in the explicitly described scope. |

Use one entry per `(technology_id, relationship)`. Multiple configurations for that relationship are described together in requirements/limitations. Distinct commercial editions may have separate external-product identities. Do not manufacture product identities solely to bypass this uniqueness rule.

These entries describe established product properties. Planned adoption belongs in an agreement, process decision or assumption until it becomes an established capability. Do not count an entry as released before its availability date. Date alone does not prove qualification.

AION C source portability does not imply binary compatibility. CP/M support must state relevant version/host limitations. FlexiBUS through an optional board does not apply to every base computer sold. TUI support must state the applicable conventions or implementation scope. Reuse the current AION C, FlexiBUS and TUI technology records; any missing CP/M compatibility-contract record requires its own reviewed content proposal, not a new entity type.

Technical details remain authoritative in existing implementation definitions where present. The product entry is a scoped commercial assertion for ecosystem analysis, not a copied technical specification. Migration must reconcile contradictions rather than treating either narrative as proof.

## 4. Market responses

Dataset and envelope remain `data_foundation/market_response.json` and `{"market_response": [...]}`. Schema: `schemas/market_response.schema.json`.

### 4.1 Record attributes

| Attribute | Type | Required | Change and meaning |
| --- | --- | --- | --- |
| `id` | string | Yes | Unchanged unique `market_response.*` identity. |
| `title` | string | Yes | Unchanged concise reaction heading. |
| `kind` | enum | Yes | Unchanged: `adoption`, `partnership`, `competing_offer`, `compatibility_response`, `purchasing_response`, `channel_response`, `market_response`, `other`. |
| `respondent_actor_ids` | array of actor references | Yes | Unchanged; unique IDs, current empty-list allowance retained. Who reacts. |
| `subject_ids` | array of foundation references | Yes | Unchanged allowed reference union and empty-list allowance. Direct objects affected by the reaction; not a predecessor list. |
| `trigger_ids` | array of references | Yes | Unchanged: `event`, `process`, `campaign` or `agreement`; unique IDs, current empty-list allowance retained. What prompted the response. |
| `description` | string | Yes | Unchanged. Reaction, mechanism, conditions and implications for product attractiveness or willingness to adopt. |
| `occurred_at` | date-or-event object | No; expected when known | **New:** when the reaction became established. It is not necessarily the date of its trigger. |
| `impacted_standards` | array of response standards-impact entries | No | **New:** direction and explanation of the effect on each standard. |

### 4.2 Response standards-impact entry

| Attribute | Type | Required | Meaning |
| --- | --- | --- | --- |
| `technology_id` | technology reference | Yes | Standard affected. Unique within this response's list. |
| `direction` | enum | Yes | `strengthens`, `weakens`, `mixed`. Direction of the effect on adoption/attractiveness of the standard, not automatically on Logix sales. |
| `description` | string | Yes | Explain why, whose willingness changes, conditions and countervailing effects. |

A larger application market may strengthen a standard while making competing computers more attractive. State both effects; do not equate standards adoption with Logix market share. Pure speculation remains in assumptions or calculation scenario notes, not an established historical response.

When an existing event outcome already establishes a response, use that event in `occurred_at`; do not create a duplicate event or date. The reference is explanatory, not timeline ownership. A dated response can be displayed without creating an event record. Keep the established event outcome reference where it explains a genuine result.

Do not duplicate an engineering review or agreement signing as a market reaction unless an actual reaction is described. Existing redundant records require individual review before consolidation or removal.

## 5. Annual sales estimates — calculation data

**New dataset:** `data_calculation/annual_sales.json`.  
**Envelope:** `{"annual_sales": [...]}`.  
**Proposed schema:** `schemas/calculation/annual_sales.schema.json`.

These are approximate customer sales estimates, not foundation facts or authorization targets. They can be edited and reassessed directly. They still receive structural and reference validation. Do not register them as foundation records or add them to the foundation authorization index.

### 5.1 Record attributes

| Attribute | Type | Required | Meaning and validation |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique `annual_sales.*` identity; suffix uses existing lowercase ID conventions. ID has no parsing semantics. |
| `product_id` | product reference | Yes | Existing `product.*` or `external_product.*`. Never an actor, device, standard or aggregate product-family label. |
| `year` | integer | Yes | Calendar year, 1–9999. Partial release years still use the calendar year; basis explains the partial selling period. |
| `geography` | string | Yes | Stable documented geographic label, e.g. `US`, `Western Europe`, `World`. No geography dataset. |
| `segment` | string | Yes | Stable documented segment label, e.g. `business`, `education`, `all`. No segment dataset. |
| `unit` | enum | Yes | Proposed addition to the earlier sketch: `computer`, `peripheral`, `software_license`, `service_enrolment`, `service_contract`, `other`. |
| `unit_description` | string | Required if `unit` is `other`; otherwise optional | Defines what is counted; particularly important for multi-user licences or service contracts. |
| `estimated_units` | integer ≥ 0 | Yes | Central estimate of units sold to customers during that year; not orders, installed base, revenue or production capacity. Zero is meaningful. |
| `low_units` | integer ≥ 0 | Optional, paired with `high_units` | Lower plausible estimate; not a statistical confidence bound unless the basis explicitly defines one. |
| `high_units` | integer ≥ 0 | Optional, paired with `low_units` | Upper plausible estimate. Require `low_units ≤ estimated_units ≤ high_units`. |
| `basis` | string | Yes | Explain the estimate, partial-year availability, supply/channel constraints and counting convention. |
| `scenario` | string | No | Stable scenario label. Omission means `baseline` for validation/filtering. |
| `assumptions` | array of strings | No | Nonempty explanatory assumptions specific to this estimate. Do not turn these into authorized foundation premises automatically. |
| `foundation_revision` | string | No; recommended | Full 40-character Git commit SHA identifying the foundation revision assessed. A newer revision does not silently recalculate the estimate. |
| `updated_at` | RFC 3339 timestamp | No; recommended | Last substantive reassessment time, including timezone. |

For a given effective scenario, `(product_id, year, geography, segment)` is unique. The unit must be consistent across comparable records for that product. Do not store two baseline rows by alternating omission and `scenario: "baseline"`.

### 5.2 Counting and aggregation rules

- Count end-customer sales, not both manufacturer shipments and dealer resale of the same unit.
- Do not sum overlapping territories or segments. `World` is an alternative aggregate scope, not an additional territory to add to `US`.
- Do not sum different scenarios or units.
- Computer sales do not establish optional-board sales. Estimate the board separately when assessing FlexiBUS adoption.
- An application sale is not necessarily a unique new user or computer. State licence/bundle counting in the basis.
- Product bundles and separately listed included components cannot be summed to produce total computer sales.
- Flag sales before a known release; release-date corrections must trigger reassessment rather than silently rewriting estimates. Respect month/year precision rather than inventing dates.
- Historical uncertainty is expressed through basis, assumptions and optional ranges, not fabricated precision.

Geography/segment labels and non-overlapping aggregation conventions should be documented in `data_calculation/README.md`. The initial schema cannot prove that free-text regions or segments are disjoint; reports must select an explicit non-overlapping scope and avoid automatic grand totals.

### 5.3 Illustrative sales record

The quantities below are placeholders demonstrating shape, **not a proposed forecast**.

```json
{
  "id": "annual_sales.model_ii.1979.us.business",
  "product_id": "external_product.trs80_model_ii",
  "year": 1979,
  "geography": "US",
  "segment": "business",
  "unit": "computer",
  "estimated_units": 20000,
  "low_units": 12000,
  "high_units": 30000,
  "basis": "Illustrative shape only; assess the partial selling year and dealer capacity before use.",
  "scenario": "illustrative",
  "assumptions": ["Sales of optional FlexiBUS boards require a separate estimate."]
}
```

## 6. Implementation and migration boundary

1. Confirm or revise this document, especially the field names, relationship enums, target-required provider/kind fields and sales unit convention.
2. Add shared date validation and optional foundation extensions. Add independent calculation validation; do not include calculation data in authorization or foundation mutation APIs.
3. Update record viewers and filters to display direct dates or resolved event dates, standards relationships and impact descriptions. Preserve historical snapshots and existing records during migration.
4. Prepare reviewed external-product and market-response migrations, beginning with Tandy and SSG. Inspect current main again immediately before preparing snapshots. Preserve useful existing content while removing only migrated duplicates.
5. Add calculation documentation and explicitly assessed sales estimates. Reassess directly without Changes confirm. Keep them visibly labelled as estimates.
6. Make new external-product kind/provider fields runtime-required only when all current records comply and relevant pending proposals remain compatible.

No new `actor_relationship`, standard-support, market-segment or scenario entity is introduced. No calculation engine, attractiveness score, automatic sales uplift, pricing model or full support-history model is included. Each could be considered separately if the first implementation demonstrates a concrete need.

## 7. Review checklist

- [ ] External-product fields and required/optional policy.
- [ ] Date-or-event representation and precision.
- [ ] Product standards relationships, requirements and limitations.
- [ ] Market-response timing and standards-effect directions.
- [ ] Annual-sales fields, units, scope and range rules.
- [ ] Calculation data remains editable without foundation authorization.
- [ ] Additive deployment followed by reviewed foundation migration.

Unchecked items indicate that this proposal is awaiting your design decision, not that implementation has begun.
