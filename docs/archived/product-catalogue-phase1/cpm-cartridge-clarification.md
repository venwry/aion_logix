# CP/M: licensed software and Logix cartridge

> **Historical documentation — not current rules, instructions or queue status.** Preserved from main at `606e3f1`; consult the [current documentation index](../../README.md) and live storytelling JSON.

Phase-1 amendment, 8 November 2026. This updates the assessment at source commit `a0cf5b8`; it does not modify foundation records, schemas or authorizations.

The original recommendation to move `product.software_cpm_aurelia` wholesale into external products conflated software ownership with ownership of the manufactured offering. The user's clarification establishes the intended commercial identity: a Logix/AION physical ROM cartridge produced under DRI licence. Retain the existing product ID and redefine its commercial meaning through Changes confirm later.

## Separate identities and responsibilities

| Layer | Proposed treatment | Evidence and limits |
| --- | --- | --- |
| Customer-facing cartridge offering | Retain `product.software_cpm_aurelia`; proposed display name “Logix CP/M ROM cartridge for Aurelia”. Define the commercial composition around one versioned cartridge device. | The user establishes the intended identity. Current `kind`, name, DRI provider and software `technical_identity` still describe the software layer and need a reviewed revision. Logix is the existing device provider; do not invent an AION manufacturing site or legal supplier. |
| Physical cartridge | Preserve `device.rom_cartridge.cpm_aurelia`. It owns the physical BOM and assembly requirements. | Existing provider is `actor.logix`; composition version 1 includes ROM/media selection, PCB/connector, shell/label/instructions and software edition version 1. |
| Software implementation | Preserve `software_edition.cpm_aurelia`, its versioned technical definition and dependencies. | The cartridge already references this edition. The edition describes CP/M and platform services, documentation and a licence-document item. A licence document is a supplied artefact, not the grant of rights itself. |
| DRI commercial software identity | Introduce provisional `external_product.cpm_aurelia` separately, described as licensed DRI software. | Direct specification references identify DRI as owner/licensor, the software edition as implementation, and the agreement as the source of rights. This is a split of meanings, not a replacement of the Logix cartridge product. |
| Rights and collaboration | Preserve `agreement.dri_cpm` and its clauses. | DRI owns the resulting CP/M version and its CP/M enhancements and can license them non-exclusively. Logix supplies platform requirements/integration; hardware obligations and ownership are separate. Technical responsibility labels do not override these terms. |

The intended composition is:

`product.software_cpm_aurelia` → `device.rom_cartridge.cpm_aurelia` → physical base parts + `software_edition.cpm_aurelia`.

The software edition need not be duplicated as a second product composition line merely to record licensing. Preserve existing system compositions, which already include the cartridge device directly. Do not insert product wrappers into technical BOMs. Use the existing agreement for rights; phase 1 does not introduce a new licence entity, royalty schedule, licence quantity or sales model.

## Impact on reference migration

All 12 incoming foundation references remain inventoried. Their proposed destinations are now recorded individually in `migration-map.json` under `reference_disposition_proposals`:

- The 1978 launch event, campaign and campaign process can retain the Logix cartridge product as a commercial subject. This does not independently establish separate retail availability.
- The DRI development agreement event concerns the licensed software deliverable, so it should reference the external software identity rather than the physical cartridge offering.
- DRI portability/release events and the ecosystem outcome concern software available beyond Logix. Their references need software scope review: an Aurelia implementation must not be presented as the implementation for every third-party machine. Broaden the descriptive external identity or use the exact relevant edition only when justified by the source context.
- The 1982 TUI update and Aurelia implementation process references concern software development/integration. Prefer the appropriate software edition/version; add a cartridge product reference only when physical delivery is actually part of the statement. An update does not automatically create another product or launch.

The retained product will still need explicit campaign and launch-event links in phase 5. Sharing the Aurelia campaign/event is a candidate supported by current associations, not a new assignment made here. Replacement, upgrade or separately sold packaging remains to be defined; this clarification does not invent dates, prices or an independently launched cartridge SKU.

## Effect on phase-1 totals and related findings

- Retained peripheral/expansion/cartridge offerings needing definition: **8 → 9**; total retention recommendations: **76 → 77**.
- Whole-product external moves: **12 → 11**, consolidating to **eight** external identities.
- One additional external DRI software identity is separated from the retained cartridge product, so the total remains **nine provisional external identities**.
- The inventory remains **145 existing products and 590 incoming foundation references**. No new product record is required for this correction.
- D15 records the resolved interpretation and pending migration work; G09 records the missing commercial definition. The other 14 decision entries remain, with D03 narrowed to the four unresolved OS/package cases.

Apply the same layer distinction when reviewing the networking edition. `device.rom_cartridge.cpm_aurelia_networking` already exists in `product.aurelia_network_upgrade`; this supports physical delivery but does not by itself establish a separately sold networking cartridge. Its classification stays under review. Likewise, a third-party software provider or a physical medium alone cannot decide whether other licensed software records denote external software or a distinct Logix offering; assess the supplied package and commercial responsibility before migration.

The existing physical cartridge BOM remains incomplete in its choice of ROM/media technology and image size. Its assembly requirements explicitly call for those choices to be fixed; this amendment does not silently choose ROM capacity, storage technology or manufacturing parameters.

## Implementation boundary

This amendment updates the phase-1 report, machine-readable map, decision/gap register and verification results only. Later schema support must permit separate software rights, technical implementation and physical delivery relationships without duplicating them. The eventual product redefinition and dependent reference changes must form a coherent Changes confirm transaction; any new external record starts Pending authorization under the agreed workflow. Historical source snapshots and authorization decisions remain unchanged.
