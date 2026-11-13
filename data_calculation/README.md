# Calculation datasets

These files are estimation data outside foundation authorization and Changes confirm. Manufacturing costs use **nominal USD at each snapshot date**; see the [cost model guide](MANUFACTURING_COSTS.md) and [Manufacturing costs page](../code/manufacturing-costs.html). Run `npm run validate:calculation` to validate both datasets.

## Annual sales estimates

`annual_sales.json` has envelope `{"annual_sales": [...]}` and is validated against `schemas/calculation/annual_sales.schema.json`. It is intentionally outside foundation datasets, authorization hashes and Changes confirm. Edit and reassess estimates directly in Git. The initial list is empty: no sales quantities have been invented.

Run `npm run validate:calculation` (or `node tools/validate-calculation.js path/to/file.json`). Validation checks the schema, actual product references, duplicate scopes, consistent units, ranges and pre-release sales warnings. It never writes foundation records or authorization data.

| Attribute | Required | Meaning |
| --- | --- | --- |
| `id` | Yes | Unique `annual_sales.*` ID. |
| `product_id` | Yes | Existing `product.*` or `external_product.*`. |
| `year` | Yes | Calendar year, integer 1–9999. |
| `geography` | Yes | Nonblank geographic label. |
| `segment` | Yes | Nonblank customer segment label. |
| `unit` | Yes | `computer`, `peripheral`, `software_license`, `service_enrolment`, `service_contract`, `other`. |
| `unit_description` | If unit is `other` | Explain what one unit means; also useful for multi-user licences. |
| `estimated_units` | Yes | Nonnegative integer estimate of end-customer sales during the year. |
| `low_units`, `high_units` | No; both together | Nonnegative integers satisfying low ≤ estimate ≤ high. |
| `basis` | Yes | Nonblank explanation of the estimate and counting convention. |
| `scenario` | No | Omission means `baseline`. |
| `assumptions` | No | Nonempty list of nonblank scenario assumptions. |
| `foundation_revision` | No | Full 40-character lowercase Git SHA assessed. |
| `updated_at` | No | RFC 3339 timestamp with timezone. |

Use stable labels such as `US`, `Western Europe`, `World` and `business`, `education`, `all`. Do not mix spelling variants. There are no geography or segment entities.

Within each effective scenario, a product/year/geography/segment combination is unique. Unit must remain consistent across records for a product. Zero is meaningful. Unknown estimates are omitted rather than stored as null or invented quantities.

Do not add World to its constituent regions, all to its constituent segments, different scenarios, or different units. Free-text scopes cannot be proven disjoint by the validator. Select an explicit non-overlapping scope when reporting totals. Do not count both dealer shipments and end-customer resale, or both a computer bundle and its included computer. Optional peripheral sales are not inferred from host sales. Software licences do not necessarily equal computers or unique users.

A partial launch year remains that calendar year; explain the selling period in the basis. Positive estimates before a known release produce reassessment warnings. A foundation update does not automatically recalculate estimates. Prices, revenue, market-share formulas and forecasting engines are outside the annual-sales dataset. Manufacturing cost estimates are maintained separately in the files described above.

Manufacturing model 1.1.0 includes AION chip costs with a 15% markup, equivalent-part cost checks and dated RAM alternatives in `ram_cost_scenarios.json`. The [cost guide](MANUFACTURING_COSTS.md) explains the market evidence, qualification limits and regeneration.
