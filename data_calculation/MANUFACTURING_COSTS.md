# Product Pricing and manufacturing estimates

The [Product Pricing page](../code/manufacturing-costs.html) lists every internal `product.*` offering against June 15 and December 15, from June 1978 through December 1983. **Every amount is nominal USD for its column date**, suitable for comparison with a selling price in dollars of that same period. These are recurring supply-cost estimates, not retail prices, recorded expenditure or net-profit figures. No authorization or Changes confirm step is required.

## Files and regeneration

- `manufacturing_cost_assumptions.json`: editable per-part procurement/fabrication allowances, dated fabrication learning states, labour, assembly operations, service scope, licensing allowances and currency indices.
- `manufacturing_costs.json`: generated estimates with product/launch references, composition version, category breakdown, sensitivity range and source fingerprints.
- `ram_cost_scenarios.json`: reproducible dated chip, complete RAM assembly and host-population alternatives; does not replace the recorded product BOMs. Its [schema](../schemas/calculation/ram_cost_scenarios.schema.json) is calculation-only.
- [Assumption schema](../schemas/calculation/manufacturing_cost_assumptions.schema.json) and [estimate schema](../schemas/calculation/manufacturing_costs.schema.json) validate these calculation-only files. They do not extend the foundation contract.

Edit assumptions directly, reassess their relationship to current foundation data, then run:

```sh
npm run calculate:manufacturing
npm run validate:calculation
node --test tests/calculation/*.test.js
```

Generation never writes foundation records or authorizations. Assumptions exist for each base part and each assembly/software/product operation; there is no silent unpriced-component fallback. A missing component, quantity, dated root composition or fabrication route stops generation. Input hashes detect stale foundation or assumption data. A calculation-only schema version is stored independently of the foundation runtime version.

## Dates, currency and product identity

A snapshot is populated only on or after the product's launch event. A June 16 launch therefore has an empty June 15 cell. Each dated root composition is selected using start-inclusive/end-exclusive bounds. Descendant composition versions remain those explicitly pinned in the BOM; the engine does not substitute the latest module or processor. Unknown or conflicting child revision dates are retained as visible calculation flags. A future foundation revision must be reviewed before regenerating.

The model continues to estimate the cost of supplying the recorded offering through 1983, without asserting continued sales or production. External products are not separate rows, although third-party software supplied within an internal offering can contribute a licence allowance. Assemblies are recursively expanded; only their incremental assembly/test operations are added to their constituent parts.

Engineering monetary anchors are expressed in June 1978 dollars. Dated historical RAM market observations instead use nominal dollars directly; they are normalized internally and converted back exactly once, without an extra inflation charge. Component-specific real price changes, process learning and yield changes are applied first. The result is converted **once** to nominal dollars using the relevant month's US CPI-U divided by June 1978 CPI-U. This also applies to service labour, licence allowances and purchased-component engineering allowances; it does not re-inflate the dated nominal market series. Costs need not decline monotonically: inflation, changed bundles or new parts can outweigh production improvements.

The twelve historical index observations are from [BLS CPI-U, all items, U.S. city average, not seasonally adjusted, via FRED (CPIAUCNS)](https://fred.stlouisfed.org/data/CPIAUCNS), retrieved 13 November 2026. June/December monthly averages approximate the corresponding 15th; there is no daily CPI observation. This retrospective convention does not imply the full month's index was available on the 15th. CPI is a broad dollar-cost escalation proxy, not a semiconductor purchasing index. Cambridge costs are dollar-denominated planning budgets without a separate sterling exchange-rate model. The real component-price assumptions supply the industry-specific learning effects.

## Manufacturing and fulfilment scope

Included: purchased components/materials, AION fabricated chips, incremental assembly/testing, assembly-site overhead, unrecovered assembly/rework loss, third-party licensing allowances and expected delivery of included services. AION chip costs include the user-specified **15% markup on manufacturing cost**, shown separately as `aion_chip_markup`: transfer price = manufacturing cost × 1.15. This is a markup, not a 15% selling-price margin. It is charged once on every fabricated AION chip and explicitly AION-made ROM/BIOS allowance, including chips inside composite assemblies. Purchased commercial chips and complete modules do not receive another AION markup. These are costs to Logix; a consolidated Logix/AION profit calculation would eliminate the internal markup. Wafer processing costs include raw wafers, fab labour, utilities, maintenance and normal depreciation; these costs are not charged again at final assembly.

Excluded: retail/dealer margins, sales tax, corporate marketing and general administration, non-recurring R&D/mask/launch work, outbound freight, finance and additional idle/expansion capital. A selling price less this estimate is a **modelled unit contribution before those exclusions**, not net company profit. Manufacturing and service costs included in a computer are not separately added again when interpreting its total.

For an AION chip:

```text
accepted die per wafer start = gross candidate die × wafer completion × electrical yield × grade fraction
manufacturing cost per accepted packaged chip = (loaded wafer cost / accepted die per start + package/test cost) / final acceptance yield
AION transfer cost per chip = manufacturing cost × 1.15
```

Use the declared wafer diameter and available die-size parameters. Where the accepted early-memory plan supplies candidate die counts, use those counts: 190 for 16 Kbit DRAM and 160 for 4 Kbit SRAM. Other routes use an area/edge-loss estimate. The 1978 DRAM model uses 90% wafer completion, 60% electrical yield and 95% final acceptance; SRAM uses 50% electrical yield. Subsequent numerical learning is an explicit estimate.

Later 64 Kbit routes are gated by their actual release/review events. A month-only June release becomes available at June 30, so it cannot improve the June 15 estimate. The initial route receives no repair benefit. Repair approximates recovery of a stated share of single-defect die, not a validated redundancy simulator. The 2.75 µm review is a conditional cost candidate: select it only if cheaper than an available qualified route. The generic 4164 can use the lowest-cost released compatible recipe; an explicitly 2 µm part remains on that route. ERAv1 remains 3 µm, including the 8 MHz grade. Conservative grade costing gives no credit for selling rejected/lower-speed bins. Process availability is not proof of a particular custom chip's electrical qualification.

The existing 4164 planning anchors of $235/$255 per wafer have no recorded currency base. This calculation explicitly interprets them as June 1978-dollar anchors before CPI conversion. ERA²/Athena receives provisional estimates despite the legacy note excluding it from earlier cost studies; the calculation does not claim new production qualification or modify that note.

## Uncertainty and service units

Purchased parts use explicit engineering allowances, not supplier quotations. A generic functional-set record is costed as its named set, while individual keyboard switches, keycaps and diodes follow their individual BOM quantities. The unresolved CP/M module RAM implementation uses an explicit eight-chip AION 64K×1 allowance plus local interconnect, confined to calculation inputs. Existing generic packout lines remain included; possible overlap requires separate foundation review.

Software estimates cover media/documentation, duplication, fulfilment and applicable third-party rights. Estimated royalties are not signed contractual terms. Support costs are expected delivery per covered year; unlimited reasonable support does not imply every customer consumes unlimited labour. Cartridge exchanges include the replacement BOM and handling, with no assumed salvage credit.

Training is costed per student enrolment using eight students per class and the defined course duration; Pulse and General Ledger courses use explicitly provisional two-/three-day assumptions. Undefined compatibility-support and certification offerings use stated eight-/24-engineer-hour budget units. These assumptions do not establish commercial entitlements. Updating them does not require foundation authorization.

The product displayed range is 70%–150% of the central estimate, an initial sensitivity allowance rather than a statistical confidence interval. The page exposes cost categories, component/activity quantities, assumptions and fabrication inputs. Small rounding differences between detailed lines and category totals can arise because categories are rounded only after summing their unrounded constituents.

## Page behaviour

Search and offering-type filters retain the full date grid. Product names link to Data browser. Selecting an amount opens its saved breakdown and, when source hashes match, its detailed reproducible calculation. Source changes produce a visible stale-estimate notice and disable detailed live recomputation; the saved breakdown remains available. Current launch dates still suppress pre-launch cells. A new product without estimates displays **Not estimated**, not an empty pre-launch cell. CSV export includes the visible products, unit convention and nominal-dollar basis. Saving service visibility follows the other application pages, but calculation editing and regeneration happen directly in Git.

## Reassessed monetary bases and equivalent parts

Calculation model 1.1.0 fixes two unsupported discrepancies. The Athena and Athena Server 256 KiB ROM storage banks now share the same $35 June-1978-dollar allowance at their June-1983 learning anchor. The physical chip organization remains unresolved: equality removes an unsupported Server discount, but does not turn that allowance into a quote. All five Shugart SA450 identities use the same bare-mechanism price curve, including the Athena drives. Controller/cable and integration costs remain separate. `equivalent_cost_groups` is validated to prevent the same part acquiring a different cost because its host name changes.

Eighteen AION-made ROM/BIOS allowances had previously been treated as purchased materials: twelve records name AION as manufacturer, and the six newly authorized cartridge storage definitions identify AION mask-ROM manufacture as the production baseline. They now use provisional AION manufacturing allowances and receive the same 15% markup. Their legacy monetary amounts are retained until image size, chip count, masks/programming and yield are specified (Business Tools Aurelia now fixes 16 KiB, but its two candidate chip populations are not yet released); the markup does not establish those missing facts.

The remaining large functional sets, unquoted purchased mechanisms, generic operation times and flat assembly loss remain estimates. Shared price curves correct internal inconsistencies; they are not evidence of supplier commitments. Six cartridge storage definitions still lack complete chip organization, and Athena mainboard sets still need costed internal scope. The model does not automatically invent those technical definitions.

RAM module conversion now distinguishes package counts: 0.08 handling hours plus 0.0015 placement hours per DRAM, followed by 0.20 operator test hours. A 64-chip module therefore no longer receives the same placement allowance as a 32-chip module. These are explicit production-planning assumptions, not observed factory timings; PCB dimensions and batch fixture throughput remain unresolved.

## RAM market evidence and comparisons

The previous smooth purchased-RAM learning curve is replaced by dated nominal acquisition scenarios. `sources` and `market_series` in the assumptions record the provenance and basis for each observation. Historical evidence comes from a [transcription of Jameco/JDR advertisements](https://stardot.org.uk/forums/viewtopic.php?t=12982), indexed [April 1978 BYTE advertising](https://vintageapple.org/byte/pdf/197804_Byte_Magazine_Vol_03-04_The_TDL_System.pdf), indexed [June 1983 Radio-Electronics advertising](https://www.worldradiohistory.com/Archive-Radio-Electronics/80s/1983/Radio-Electronics-1983-06.pdf), and the [1979 Mostek databook](https://www.bitsavers.org/components/mostek/_dataBooks/1979_Mostek_Memory_Data_Book_and_Designers_Guide.pdf). Accessed 13 November 2026; original advertisement scans were not independently verified. These remain low-confidence inputs, not wholesale contracts.

Where only small-lot advertised prices are available, the central scenario assumes acquisition at 80% of that price. This OEM allowance is a modelling choice. The June 1982 16-Kbit observation uses the transcribed 100-piece price directly, with no additional discount. Early values without a suitable dated quotation are explicitly labelled planning estimates. Dates supported only by later evidence identify that evidence as a retrospective cross-check. Commercial 64-Kbit comparisons start in June 1980, conservatively after a 1979 catalogue entry; this does not claim that no samples existed earlier or that production-volume supply was assured.

The 16-Kbit curve targets the 150/200 ns access class. A cheaper 250 ns access device can have a 410 ns cycle and is not automatically compatible with AION's 375 ns-cycle contract. For 64-Kbit sources the quoted access grade varies with the evidence. Access, cycle, setup/hold, power rails, pinout, refresh and loading still need complete electrical qualification. AION 4164 itself has open electrical release details in the foundation. Price comparison is not a substitute for qualification.

**RAM comparisons** on the cost page shows:

- Chip acquisition cost, with AION manufacturing cost and markup separated.
- Full module or fixed-memory-subsystem alternatives, including their actual chip quantity, PCB/passives, conversion and assembly loss.
- Exact-capacity host populations, restricted to dated host-listed modules, matched pairs, declared socket count and RAM limit. If the maximum socket count is unknown, use no more than the recorded fitted population.
- Excluded module options and their reasons. One 256 KiB module does not replace two matched 128 KiB modules, and a 64-Kbit chip is not treated as a drop-in 16-Kbit replacement.
- A lowest central estimate and sensitivity result. Commercial chip costs vary by −25%/+25%; AION manufacturing costs vary by −20%/+25%, with markup following the changed cost. Board/conversion costs stay fixed in this comparison. These are scenario ranges, not statistical confidence intervals or assurance of a supplier order.

The comparison covers DRAM modules and Aurelia/Aurelia+ main-memory subsystems. It does not redesign graphics/sprite memories or create an unsourced commercial SRAM alternative. Prototypes with unknown release dates are omitted from dated choices. Hypothetical host capacity targets come from recorded product compositions across their versions; availability still follows the host and module dates, not an assertion that every target was sold on every date. The recorded BOM remains the main product-cost grid; alternatives require separate technical review before changing product definitions.

## Product Pricing and competition reassessment

The page is now **Product Pricing**; `code/manufacturing-costs.html` remains its stable URL. Each eligible date shows manufacturing cost, competition price, retail price and profit. The existing manufacturing breakdown and RAM alternatives remain available. `npm run calculate:pricing` (or the retained `calculate:manufacturing` alias) regenerates manufacturing, RAM and pricing datasets together. `npm run validate:calculation` checks all three outputs.

The author confirmed that the ComputerLand fee is **20% of manufacturing cost**, not 20% of retail price:

```text
fee = round(manufacturing cost × 0.20, 2)
break-even = manufacturing cost + fee
competition = arithmetic mean of normalized comparable retail baskets
retail = round((competition + break-even) / 2, 2)
profit = retail − break-even
```

Amounts are nominal USD, rounded to cents. Profit is unit contribution before the excluded corporate expenses, development, financing and tax; it is not accounting net profit. The midpoint is not clamped: competition below break-even produces a negative contribution. A zero-cost offering can still have a positive market price. Pre-launch dates remain empty.

`product_pricing_assumptions.json` stores independently editable, dated competition profiles, evidence links and explicit scope mappings. `product_pricing.json` stores the four amounts, fee, break-even and full comparison basket for each product/date. Their schemas are in `schemas/calculation/`. These files are calculation data and do not create foundation prices or require Changes confirm. Fingerprints cover the foundation, manufacturing output and pricing assumptions; stale inputs produce a page warning, and stale pricing files are not paired with new costs. CSV includes all four fields for every date.

### What the competition figures mean

The author explicitly authorized **clearly labelled provisional estimates from comparable components/services** where documented equivalent offerings are unavailable. All current comparisons carry that label. They are functional retail equivalents, not quotations for an identical Logix configuration and not claims of interface or processor-performance equivalence.

The calculation walks the approved dated product composition, retaining pinned descendant revisions and actual quantities. At a mapped complete device/software/service it stops: its internal BOM is not charged a second time. For each supplied element it averages the independently specified comparable retail alternatives after explicit scope normalization, then sums those averages. This equals the average across every complete basket formed from those independent alternatives; it is **not** a market-share-weighted survey of named competing systems. Included certificates and packout have an intentional zero incremental retail price. Training uses the same course duration and per-student unit as the cost model; engineering and support comparisons keep their declared engagement/year units.

Profiles use nominal annual planning observations, held through June and December of that year. Historical references include Apple II/Disk II, Microsoft's SoftCard and mouse, AutoCAD and the March 1983 IBM retail list. Earlier-year trajectories, non-identical hardware, advanced host premiums, network products, server rights and service rates are explicitly provisional. Later evidence may inform a retrospective earlier planning allowance; it does **not** establish that the later competitor existed then. No extra CPI is applied to these nominal retail profiles, and none is derived from our manufacturing cost. The page exposes each anchor, source, scope adjustment and quantity. Narrower contemporary quotes should replace the corresponding profile observations as evidence improves.

Larger RAM, graphics and hub profiles use explicit capacity/port multipliers. They do not establish linear performance scaling or physical interchangeability, and can overestimate a more integrated competitor's price. Advanced 32-bit/server host allowances are particularly uncertain. The model is a transparent pricing scenario, not proof of market willingness to pay; a TUI/standards premium is not silently added. Switching `allow_planning` off leaves unsupported competition/retail/profit unpriced instead of inventing zero prices.

### Current manufacturing refresh

The approved storage definitions now use the staged nominal MiniScribe 4010 $625 and Quantum Q540 $1,485 procurement assumptions, with their documented date/quantity caveats. Dated Artemis definitions switch to one FDD and one HDD from NCC 1982; earlier compositions remain intact. Athena Server receives the Q540 even though formatted capacity is below its raw 43 MB. The removed Budget Colour Office offering is excluded. AION C 2.0 has explicit documentation/media/fulfilment assumptions using its actual two-disk BOM; compiler development is excluded as non-recurring work.

All current compositions are re-expanded. Existing manufacturing learning, chip yield, assembly, licensing and service assumptions remain provisional where current specifications provide no stronger evidence; recalculation does not turn unresolved ROM chip populations, functional sets or production timings into supplier quotations. Existing low/high manufacturing sensitivity ranges remain available in details.
