# Manufacturing cost estimates

The [Manufacturing costs page](../code/manufacturing-costs.html) lists every internal `product.*` offering against June 15 and December 15, from June 1978 through December 1983. **Every amount is nominal USD for its column date**, suitable for comparison with a selling price in dollars of that same period. These are recurring supply-cost estimates, not retail prices, recorded expenditure or net-profit figures. No authorization or Changes confirm step is required.

## Files and regeneration

- `manufacturing_cost_assumptions.json`: editable per-part procurement/fabrication allowances, dated fabrication learning states, labour, assembly operations, service scope, licensing allowances and currency indices.
- `manufacturing_costs.json`: generated estimates with product/launch references, composition version, category breakdown, sensitivity range and source fingerprints.
- [Assumption schema](../schemas/calculation/manufacturing_cost_assumptions.schema.json) and [estimate schema](../schemas/calculation/manufacturing_costs.schema.json) validate these calculation-only files. They do not extend the foundation contract.

Edit assumptions directly, reassess their relationship to current foundation data, then run:

```sh
npm run calculate:manufacturing
npm run validate:calculation
node --test tests/calculation/manufacturing-costs.test.js
```

Generation never writes foundation records or authorizations. Assumptions exist for each base part and each assembly/software/product operation; there is no silent unpriced-component fallback. A missing component, quantity, dated root composition or fabrication route stops generation. Input hashes detect stale foundation or assumption data. A calculation-only schema version is stored independently of the foundation runtime version.

## Dates, currency and product identity

A snapshot is populated only on or after the product's launch event. A June 16 launch therefore has an empty June 15 cell. Each dated root composition is selected using start-inclusive/end-exclusive bounds. Descendant composition versions remain those explicitly pinned in the BOM; the engine does not substitute the latest module or processor. Unknown or conflicting child revision dates are retained as visible calculation flags. A future foundation revision must be reviewed before regenerating.

The model continues to estimate the cost of supplying the recorded offering through 1983, without asserting continued sales or production. External products are not separate rows, although third-party software supplied within an internal offering can contribute a licence allowance. Assemblies are recursively expanded; only their incremental assembly/test operations are added to their constituent parts.

Internal monetary anchors are expressed in June 1978 dollars. Component-specific real price changes, process learning and yield changes are applied first. The result is converted **once** to nominal dollars using the relevant month's US CPI-U divided by June 1978 CPI-U. This also applies to service labour, licence allowances and purchased components. Costs need not decline monotonically: inflation, changed bundles or new parts can outweigh production improvements.

The twelve historical index observations are from [BLS CPI-U, all items, U.S. city average, not seasonally adjusted, via FRED (CPIAUCNS)](https://fred.stlouisfed.org/data/CPIAUCNS), retrieved 13 November 2026. June/December monthly averages approximate the corresponding 15th; there is no daily CPI observation. This retrospective convention does not imply the full month's index was available on the 15th. CPI is a broad dollar-cost escalation proxy, not a semiconductor purchasing index. Cambridge costs are dollar-denominated planning budgets without a separate sterling exchange-rate model. The real component-price assumptions supply the industry-specific learning effects.

## Manufacturing and fulfilment scope

Included: purchased components/materials, AION fabricated chips, incremental assembly/testing, assembly-site overhead, unrecovered assembly/rework loss, third-party licensing allowances and expected delivery of included services. Internal AION-to-Logix transfer profit is excluded. Wafer processing costs include raw wafers, fab labour, utilities, maintenance and normal depreciation; these costs are not charged again at final assembly.

Excluded: retail/dealer margins, sales tax, corporate marketing and general administration, non-recurring R&D/mask/launch work, outbound freight, finance and additional idle/expansion capital. A selling price less this estimate is a **modelled unit contribution before those exclusions**, not net company profit. Manufacturing and service costs included in a computer are not separately added again when interpreting its total.

For an AION chip:

```text
accepted die per wafer start = gross candidate die × wafer completion × electrical yield × grade fraction
cost per accepted packaged chip = (loaded wafer cost / accepted die per start + package/test cost) / final acceptance yield
```

Use the declared wafer diameter and available die-size parameters. Where the accepted early-memory plan supplies candidate die counts, use those counts: 190 for 16 Kbit DRAM and 160 for 4 Kbit SRAM. Other routes use an area/edge-loss estimate. The 1978 DRAM model uses 90% wafer completion, 60% electrical yield and 95% final acceptance; SRAM uses 50% electrical yield. Subsequent numerical learning is an explicit estimate.

Later 64 Kbit routes are gated by their actual release/review events. A month-only June release becomes available at June 30, so it cannot improve the June 15 estimate. The initial route receives no repair benefit. Repair approximates recovery of a stated share of single-defect die, not a validated redundancy simulator. The 2.75 µm review is a conditional cost candidate: select it only if cheaper than an available qualified route. The generic 4164 can use the lowest-cost released compatible recipe; an explicitly 2 µm part remains on that route. ERAv1 remains 3 µm, including the 8 MHz grade. Conservative grade costing gives no credit for selling rejected/lower-speed bins. Process availability is not proof of a particular custom chip's electrical qualification.

The existing 4164 planning anchors of $235/$255 per wafer have no recorded currency base. This calculation explicitly interprets them as June 1978-dollar anchors before CPI conversion. ERA²/Athena receives provisional estimates despite the legacy note excluding it from earlier cost studies; the calculation does not claim new production qualification or modify that note.

## Uncertainty and service units

Purchased parts use explicit engineering allowances, not supplier quotations. A generic functional-set record is costed as its named set, while individual keyboard switches, keycaps and diodes follow their individual BOM quantities. The unresolved CP/M module RAM implementation uses an explicit eight-chip AION 64K×1 allowance plus local interconnect, confined to calculation inputs. Existing generic packout lines remain included; possible overlap requires separate foundation review.

Software estimates cover media/documentation, duplication, fulfilment and applicable third-party rights. Estimated royalties are not signed contractual terms. Support costs are expected delivery per covered year; unlimited reasonable support does not imply every customer consumes unlimited labour. Cartridge exchanges include the replacement BOM and handling, with no assumed salvage credit.

Training is costed per student enrolment using eight students per class and the defined course duration; Pulse and General Ledger courses use explicitly provisional two-/three-day assumptions. Undefined compatibility-support and certification offerings use stated eight-/24-engineer-hour budget units. These assumptions do not establish commercial entitlements. Updating them does not require foundation authorization.

The displayed range is 70%–150% of the central estimate, an initial sensitivity allowance rather than a statistical confidence interval. The page exposes cost categories, component/activity quantities, assumptions and fabrication inputs. Small rounding differences between detailed lines and category totals can arise because categories are rounded only after summing their unrounded constituents.

## Page behaviour

Search and offering-type filters retain the full date grid. Product names link to Data browser. Selecting an amount opens its saved breakdown and, when source hashes match, its detailed reproducible calculation. Source changes produce a visible stale-estimate notice and disable detailed live recomputation; the saved breakdown remains available. Current launch dates still suppress pre-launch cells. A new product without estimates displays **Not estimated**, not an empty pre-launch cell. CSV export includes the visible products, unit convention and nominal-dollar basis. Saving service visibility follows the other application pages, but calculation editing and regeneration happen directly in Git.
