# AION memory manufacture — review evidence

This is a proposed alternative-history change set, not evidence of real laboratory measurements. Foundation records remain unchanged until the author approves and saves the proposal in Changes confirm. Schema 0.21.0 supplies the shared-line representation and detail renderer.

One atomic proposal contains **32 record changes: 7 additions, 22 updates and 3 removals**. The process ownership, removed event references, qualifications and supplied BOMs must change together. The payload is approximately 125 kB; the real save transaction has been simulated locally.

## Record-by-record list

| File | Record | Change | Purpose |
|---|---|---|---|
| `data_foundation/location.json` | `location.aion_cambridge_fab` | add | Identify the physical factory independently of the city and recipe capabilities. |
| `data_foundation/assumption.json` | `assumption.secret_facility` | update | Clarify the design advantage without assuming a hidden production fab. |
| `data_foundation/assumption.json` | `assumption.aion_memory_supply_1978` | add | Make demand, funding, allocations, inventory and expansion assumptions explicit while preserving the established 5% capacity policy. |
| `data_foundation/technology.json` | `technology.aion_fab_process_control` | update | Replace repeated generalities with a controlled factory method and explicit yield denominators. |
| `data_foundation/technology.json` | `technology.aion_memory_test` | update | Specify recipe-specific test coverage, qualification and failure handling without assuming future redundancy. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_cambridge_nmos_line` | add | Create one dated owner of equipment, staffing envelope, bottlenecks and capacity constraints. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_nmos_3um_logic` | update | Attach recipe qualification to the shared factory; keep density and grade acceptance distinct. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_mask_rom_3um` | update | Attach recipe qualification to the shared factory; keep density and grade acceptance distinct. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_sram_3um` | update | Attach recipe qualification to the shared factory; keep density and grade acceptance distinct. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_dram16_3um` | update | Attach recipe qualification to the shared factory; keep density and grade acceptance distinct. |
| `data_foundation/manufacturing_capability.json` | `manufacturing_capability.aion_sram4_3um` | add | Give the 4 Kbit sprite SRAM its own release and production qualification instead of inheriting 1 Kbit SRAM maturity. |
| `data_foundation/base_part.json` | `base_part.aion_2102` | add | Identify the early revenue-producing SRAM density as a real base part without inventing a customer order or undefined speed grade. |
| `data_foundation/base_part.json` | `base_part.aion_4116` | update | Define the qualified Aurelia memory interface, package and grade while retaining honest die-area planning estimates. |
| `data_foundation/base_part.json` | `base_part.aion_2114` | update | Define the qualified Aurelia memory interface, package and grade while retaining honest die-area planning estimates. |
| `data_foundation/process.json` | `process.aion_fab_establishment` | update | Bring staff, utilities, masked test structures and matched tools together during 1975. |
| `data_foundation/process.json` | `process.aion_rom_sram_business` | update | Start revenue learning in 1976 and qualify 4 Kbit SRAM separately before Aurelia. |
| `data_foundation/process.json` | `process.aion_dram16_development` | update | Start DRAM engineering in 1975 and release silicon in September 1977, leaving time for production learning. |
| `data_foundation/process.json` | `process.aion_yield_engineering` | update | Start control and failure analysis during pilot construction and own sustained supply acceptance before launch. |
| `data_foundation/process.json` | `process.aion_manufacturing_maturation` | update | Align the existing six-workstream programme with early memory supply; retain later CPU and stepper dates. |
| `data_foundation/process.json` | `process.aion_memory_scaling` | update | Protect the qualified Aurelia memory schedule from the May 1978 research programme. |
| `data_foundation/event.json` | `event.aion_pilot_line_acceptance` | update | Make the dated acceptance scope, prerequisite and manufacturing result explicit. |
| `data_foundation/event.json` | `event.aion_rom_sram_release` | update | Make the dated acceptance scope, prerequisite and manufacturing result explicit. |
| `data_foundation/event.json` | `event.aion_sram4_release` | add | Add a major acceptance gate needed to establish separately qualified memory supply. |
| `data_foundation/event.json` | `event.aion_dram16_release` | update | Make the dated acceptance scope, prerequisite and manufacturing result explicit. |
| `data_foundation/event.json` | `event.aion_3um_repeatable` | update | Make the dated acceptance scope, prerequisite and manufacturing result explicit. |
| `data_foundation/event.json` | `event.aion_aurelia_memory_supply` | add | Add a major acceptance gate needed to establish separately qualified memory supply. |
| `data_foundation/event.json` | `event.aion_fab_team_hired` | remove | Consolidate this recruitment milestone into dated process steps, preserving roles while avoiding excess timeline events. |
| `data_foundation/event.json` | `event.aion_dram_team_hired` | remove | Consolidate this recruitment milestone into dated process steps, preserving roles while avoiding excess timeline events. |
| `data_foundation/event.json` | `event.aion_yield_team_hired` | remove | Consolidate this recruitment milestone into dated process steps, preserving roles while avoiding excess timeline events. |
| `data_foundation/event.json` | `event.aurelia_launch` | update | Make accepted memory supply a direct launch prerequisite without asserting complete-system production qualification. |
| `data_foundation/device.json` | `device.subsystem.aurelia.base_memory` | update | Specify released AION 4116 memory in the actual Aurelia BOM and qualify refresh across all mapped/hidden pages. |
| `data_foundation/device.json` | `device.aurelia_ram_16kb_card` | update | Specify released AION 4116 memory in the actual Aurelia BOM and qualify refresh across all mapped/hidden pages. |

## Assessment

**Completeness: pass within requested memory-manufacturing scope.** capital and working capital, staffing and legitimate recruitment, design/mask transfer and local qualification, clean utilities and contamination, projection/resist/thermal/implant/deposition/wet/metal tooling, metrology and failure analysis, ROM and separately identified 1 Kbit/4 Kbit SRAM, 16 Kbit DRAM electrical interface and qualification, wafer, electrical and assembly yield denominators, reliability, test coverage and grade release, probe, package assembly and final-test loading, two qualified wafer supply routes and incoming-material buffer, tool outage, spares and alternate routes, cycle-time and WIP/inventory separation, 32 DRAM + 2 SRAM Aurelia BOM plus optional card, external supply allocations without invented orders, protected engineering and later expansion

**Deduplication: pass.** One physical line owns equipment and configurations; recipes reference it. Technologies own methods, assumptions own planning cases, processes own actions, events own dated accepted results. Three recruitment events become dated steps. The existing stepper process is unchanged. Generic capacity discussion retains only work outside this early-memory case.

**Chronology: pass.** 1975 pilot and early DRAM/yield hiring; September 1976 initial ROM/1 Kbit SRAM; March 1977 4 Kbit SRAM; September 1977 16 Kbit DRAM; December 1977 four-tool provisioning; March 1978 sustained acceptance; May 1978 inventory and integration; June 5 launch. Released-product inventory cohorts begin before the March capacity gate, respecting up to 45+14 days elapsed production time. Six major events have single process ownership and dates within their owning periods.

**Technical manufacturing feasibility: pass as a demanding, funded alternative-history programme with explicit acceptance gates.** Use conservative 190 candidate DRAM die per 75 mm wafer rather than the earlier illustrative 200. At 90% wafer completion, 60% accepted electrical yield and 95% assembly/final yield, 6,000 starts yield 584,820 accepted DRAMs, exceeding the 575,000 gate. SRAM capacity is separately checked. No repair or later stepper advantage is credited. Physical tool counts alone do not prove full-route throughput; the gate requires actual route loading, mask maps, lot evidence and additional test equipment if necessary.

**Story consistency: pass.** Preserves finance forecast+5% headroom exactly once, secret-facility design-only role, existing six subprocesses, later 1979 stepper/64 Kbit and 1980 ERAv1 dates, generic external DRAM and unrelated records. No prices, invented customer agreements or sales actuals. RAM-card first commercial date remains unresolved. Memory acceptance does not claim all custom chips or complete-system production readiness.

## Numerical checks

The inherited finance policy is forecast demand plus 5% good-output capacity. It replaces the earlier illustrative 10% internal allowance. Inventory and outage protection are calculated separately.

| Computers/month | Accepted DRAM capacity needed | Accepted 4 Kbit SRAM capacity needed | DRAM starts at 60% / 50% electrical yield | SRAM starts at 50% |
|---|---:|---:|---:|---:|
| 10,000 | 466,200 | 31,500 | 4,784 / 5,740 | 461 |
| 20,000 | 827,400 | 52,500 | 8,489 / 10,187 | 768 |

The nominal line has 6,000 DRAM and 500 4 Kbit SRAM starts within an 8,000-start shared schedule. Four aligners support a calculated 10,296 wafer starts at the specified acceptance rate; three support 7,722. A one-tool outage preserves the 7,000 memory starts by pausing engineering and some logic work, rather than claiming full-factory redundancy. Actual recipe visits and all other bottlenecks must pass measured loading checks.

The 10,000-computer case is supported by the proposed initial allocations; the 20,000 case requires expansion of both memory routes. Launch stock is 344,000 DRAMs and 20,000 4 Kbit SRAMs for internal demand, separate from external orders.

## Review boundaries

The capacity calculations assess internal arithmetic and a plausible production envelope. They are not measurements. Acceptance events are proposed story outcomes and explicitly require the full-route evidence described in the factory and recipe records. Unresolved unrelated catalogue, custom-chip, full-system and later-capacity questions remain open.

See [machine-readable assessment](assessment.json), [capacity scenarios](capacity-scenarios.json), [save and graph verification](verification.json) and [exact proposal](proposals.json). Original discussion wording is preserved in the two `*-discussion-before.json` snapshots.

Run `node tools/verify-aion-memory-proposal.js` while this proposal is pending to repeat the atomic-save, chronology, BOM and arithmetic checks.


## Application and save verification

The shared-line schema, parameter validation and all three detail views are covered by five model tests and three browser tests. Backend connection, batch-save and review-decision tests pass, along with documentation, calculation and build checks. Four historical migration tests fail identically at baseline `6653618`; they reintroduce retired schema fields and references, while the live and proposed foundation both validate.

Three mocked GitHub saves using the production 160 MiB V8 heap limit peak at **278 MiB RSS**, below the 512 MiB Render limit. The read-only full-archive audit has a different, larger memory profile; production uses the indexed history path. The existing memory probe was updated to include history-shard paths in its mocked Git tree. See [validation](validation.json) and [save memory profile](save-memory-profile.json).

The runtime and manifest contract is **0.21.0**. Render must deploy this commit before saving the new capability records; the local connection/schema test passes, but live deployment is not claimed verified.
