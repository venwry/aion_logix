# Revised standard-family proposals

Status: approved and applied. This document records the reviewed consolidation of the earlier twelve candidates. The subsequently approved schema cleanup is documented in the current model guide; the former relationship dataset/schema has now been retired.

## Review groups

| Existing proposal ID retained | Revised scope |
| --- | --- |
| `change.standard_kind_flexibus` | One atomic FlexiBUS/TUI/AION C consolidation: three core records, six child-record deletions and all affected reference consumers. Shared consumers make separate whole-record proposals overlap. |
| `change.standard_kind_logix_digital_video` | Independent core standard, with explicit baseline, raster profiles and later palette-extension scope. |
| `change.standard_kind_logix_lan100_link` | Independent core standard, separating the shared 1981 protocol, negotiated rates and host qualification. |
| `change.standard_kind_plug_and_execute` | Converted to a discussion. Keep the interface kind until its connector, discovery, driver ABI, resource-allocation and conformance contract is established. |

Eight former candidate proposals are absorbed into these groups. They are removed from the current queue, not left as competing classifications. Their original snapshots remain in review evidence and Git history. The twelve external-product conversion proposals and the three-affiliation deletion proposal remain separate.

## Canonical standard families

| Core ID | Kind | Consolidated material |
| --- | --- | --- |
| `technology.flexibus` | `hardware_standard` | Existing transport plus the later pointing-device class. User-facing button/roller meanings move into TUI. |
| `technology.logix_tui_standard` | `software_standard` | Controls, keyboard/editing core, explicit terminal profiles and the later mouse/pointer extension. |
| `technology.aion_c_portability_framework` | `software_standard` | Source portability, common language rules, Z80/CP/M and ERA/AIONix target profiles, platform API and display-services module. |
| `technology.logix_digital_video` | `hardware_standard` | Shared link/control protocol, raster profiles and later palette-control extension scope. |
| `technology.logix_lan100_link` | `hardware_standard` | Shared physical/data-link protocol, negotiation, recovery and qualification requirements. |

The following child IDs are retired only when the consolidation is approved:

| Retired ID | Canonical replacement |
| --- | --- |
| `technology.flexibus_pointing_device` | `technology.flexibus` |
| `technology.logix_tui_keyboard_standard` | `technology.logix_tui_standard` |
| `technology.logix_tui_mouse` | `technology.logix_tui_standard` |
| `technology.logix_c_target_contract` | `technology.aion_c_portability_framework` |
| `technology.logix_c_api` | `technology.aion_c_portability_framework` |
| `technology.logix_display_api` | `technology.aion_c_portability_framework` |

Reference roles and chapter names preserve whether a reference concerns keyboard behaviour, pointer transport, source contracts or display services. The replacement ID identifies the family; it does not imply that every implementation provides every extension. Reference lists are deduplicated where several child IDs become one parent. Historical authorization decisions and before snapshots retain the original identities.

## Chronological interpretation

- January 1975 establishes a development commitment, not released implementations.
- Aurelia's 5 June 1978 launch and the 6 June developer launch establish the initial commercial interface/TUI/Z80-C environment.
- External qualification begins in November 1978; publication/release of independent compatibility programmes in May 1979 expands ecosystem access. It is not automatically a protocol revision.
- The May 1980 Artemis release provides the ERA/AIONix target. Z80 and ERA profiles coexist; both have target-specific binaries, ABIs and resource limits.
- Networking belongs to the 1981 programme. Link rates are negotiated capabilities within one baseline, not four versions. Presentation does not establish completed host qualification.
- Pointer interaction and the FlexiBUS pointing class are June 1982 extensions. They are not baseline 1978 support and do not imply unrestricted upgrades for all existing CP/M applications.
- Later graphics services and Athena/AIONix2 compatibility remain explicitly scoped. The planned 1983 programme is not evidence that all later capabilities shipped.

The existing platform API label 1.0 is retained. No new protocol or language version numbers are invented. A standard revision requires an actual contract change; an additional host profile or optional capability alone does not establish one.

## Specification organisation and preservation

Each core begins with a scope/chronology chapter. Existing specification material follows in clearly named core, profile or extension sections. Chapter numbers become sequential within the consolidated record. All source parameter keys and technical values are retained. Reference values are redirected to canonical IDs; redundant self-links and repeated child-ID lists become explicit references to the relevant sections, recorded in the coverage evidence. The source-to-destination chapter map is in `data_storytelling/review_evidence/standard-families/coverage.json`.

Specific hardware budgets and capacities are explicitly labelled as implementation examples or qualification targets rather than universal requirements. This proposal does not rewrite the underlying hardware/software implementations. The digital-video proposal flags that the later professional 800×600 integration does not automatically extend the current raster tables; exact link/timing reconciliation requires separate review.

The six child records' useful content is preserved. One explicit relocation moves the pointing class's button and roller interaction meanings from the bus specification into the TUI pointer extension; the wire protocol and host-driver requirements stay under FlexiBUS.

## Validation

`node tools/verify-standard-families.js` checks:

- Current before snapshots and queue consistency.
- Individual approval of each actionable revised proposal, plus batch/reverse batch approval.
- No remaining live references to retired child IDs after approval.
- Source chapter/parameter coverage, including the explicit interaction-semantics relocation.
- Unchanged records outside the proposals and unchanged live input files.
- Independent approval of all remaining foundation proposals after consolidation.

The earlier ecosystem iteration evidence remains a historical snapshot. Its exact-queue verification and preparation tools are superseded for these standard candidates; use the standard-family tools for the current queue.
