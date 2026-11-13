# Market responses and impact sections

Contract 0.21.0 retains the existing market-response identity, kind, respondents, triggers, `subject_ids` and `description`. The two new optional sections are additive; existing subjects and descriptions will be migrated through later reviewed proposals, not silently rewritten now.

| Section | Reference attribute | Allowed targets |
| --- | --- | --- |
| `impacted_standards[]` | `standard_id` | Existing technology whose kind is `software_standard` or `hardware_standard`. |
| `impacted_products[]` | `product_id` | Existing `product` or `external_product`. |

Each entry has exactly its reference attribute plus:

| Attribute | Required | Meaning |
| --- | --- | --- |
| `direction` | Yes | `strengthens`, `weakens`, `mixed`. For standards: adoption/attractiveness; for products: commercial attractiveness or competitive position. |
| `description` | Yes | Nonblank explanation of the effect, mechanism and conditions, with optional `{key}` substitutions. |
| `parameters` | Yes | Array of `{key, value}` text pairs; may be empty. Keys are nonblank, unique within the entry, contain no braces, and must be used. Every placeholder must resolve. |

A list is omitted when no impact is documented; if present, it is nonempty and has one entry per distinct target. The section may describe several effects in the same entry; use `mixed` where appropriate. The standard reference uses `standard_id` consistently with external products, replacing the early proposal's `technology_id` spelling. The entries are market-response assessments, not the external-product three-paragraph comparison format.

The viewer displays the target name and direction, highlighted parameter substitutions and an expandable Key/Value table. Substitutions are plain text and nonrecursive. Standard and product links remain navigable in the data browser, Timeline details and Changes confirm comparisons.

Strengthening a standard does not imply higher Logix sales: a compatible competitor can increase adoption while reducing Aurelia's relative attractiveness. These descriptions are not numerical sales multipliers. Approximate annual sales belong in the separate [calculation dataset](../../data_calculation/README.md), with no foundation authorization requirement.

No new response timing field is introduced in this iteration. Existing dated story events remain available through their relationships. Do not invent responses or sales forecasts solely to populate the new sections.
