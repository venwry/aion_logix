# Product catalogue cleanup — phase 3

Prepared against main commit [`2cc577b`](https://github.com/venwry/aion_logix/commit/2cc577be0c8334bf7668fa9a8ee3e38c5f1de884), 8 November 2026. This phase introduces external commercial identities and proposes their dependent migrations. It does not apply or authorize the proposed changes to existing records.

## What is available for review

`data_foundation/external_products.json` now contains **11 records**, each with a matching **Pending authorization** entry. The existing 1,109 foundation records and their authorization entries are unchanged. Historical authorization decisions, annotations and review feedback are unchanged.

The new records are:

| External identity | Meaning |
| --- | --- |
| `external_product.autocad_1_artemis` | Autodesk AutoCAD 1.0 for Artemis/AIONix, distinct from Logix CAD bundles. |
| `external_product.bpi_suite` | BPI business applications for CP/M. |
| `external_product.bpi_suite.era` | BPI business applications for AIONix. |
| `external_product.bpi_client_server` | One BPI commercial package with three preserved technical editions and existing package artefacts. |
| `external_product.cpm_aurelia` | DRI-owned/licensed Aurelia CP/M software, distinct from the Logix cartridge offering. |
| `external_product.cpm_platform_extensions` | Optional portable DRI extensions for non-Logix manufacturers, not the Aurelia ROM image. |
| `external_product.cpm_model_ii` | DRI CP/M for the Tandy cooperation configuration. |
| `external_product.microsoft_basic_aurelia` | Independently licensed Microsoft BASIC for Aurelia CP/M. |
| `external_product.trs80_model_ii` | Tandy's Model II cooperation configuration and native hardware. |
| `external_product.model_ii_flexibus` | Tandy's qualified Model II-specific FlexiBUS option. |
| `external_product.apple_ii` | The Apple II host already named in partner and competition activity. |

The nine phase-1 migration destinations are retained. The two additions address explicit source evidence: the missing Apple II host (G06), and the portable DRI extension release, whose implementation must not be confused with an Aurelia-specific cartridge. No historical IBM configuration, speculative supplier offering or OEM sales model is invented.

Specifications contain exactly `no`, `description`, one `ref_id` and `ref_role`. Each reference describes a direct publisher/licensor, implementation, supplied package item, host, implemented interface or governing agreement. Existing technical definitions retain their specifications and BOMs; external records provide descriptive commercial identities.

## Changes confirm proposals

There are **five independently applicable, non-overlapping proposals**. In total they contain **56 existing-record revisions and 11 product-alias removals**. Every revision includes its complete current `before` snapshot. Removal is represented by `after: null`.

| Proposal ID suffix | Review scope | Elements |
| --- | --- | ---: |
| `apple_ii_host` | Add the Apple II host to four directly related events and the Apple business-response process. Logix expansion/video products remain Logix offerings. | 5 |
| `autodesk` | Replace commercial AutoCAD references with the external identity, use the technical edition for build/integration/acceptance references, and remove the old product wrapper. | 9 |
| `bpi_client_server` | Consolidate four product wrappers into the external package; preserve its CP/M client, AIONix client and server editions. Integration/recovery work references all three implementations. Deduplicate campaign subjects. | 8 |
| `partners_and_cpm` | Reconcile shared BPI, DRI, Microsoft and Tandy records; remove five external-product wrappers; redefine the retained Logix CP/M cartridge; update the two Model II technical host references. | 42 |
| `bpi_aionix` | Move the BPI AIONix commercial wrapper and its two campaign/process references to the external identity. | 3 |

Full IDs start with `change.catalogue_phase3_`. The 42-element group is intentionally inseparable: several migrations share the same campaign, foundation and ecosystem records. Splitting it into competing whole-record snapshots would create stale proposals or incomplete identity moves. The other groups share no changed records and can be approved in any order.

Approving a proposal authorizes only its resulting revised records. **It does not authorize the referenced external records.** Review those in Data browser separately, individually or as a selected group. Until proposal approval, the old product wrappers remain in the active catalogue alongside the pending external candidates. This temporary duplication makes the migration reviewable without silently changing accepted content.

## CP/M and technical preservation

The proposed `product.software_cpm_aurelia` revision keeps its ID, names the Logix ROM cartridge, uses Logix as provider, and points to `device.rom_cartridge.cpm_aurelia`. Its commercial composition supplies one cartridge at existing device version 1. The device's physical parts and `software_edition.cpm_aurelia` remain unchanged. A software requirement links the DRI commercial software identity and existing development/licensing agreement; no new royalty amount, seat count, manufacturing recipe or separate-sale date is introduced.

The Aurelia presentation keeps its cartridge subject. DRI development and software-marketing references use the licensed software identity. Non-Logix portability/release references use `external_product.cpm_platform_extensions`. Engineering/TUI integration references use the existing software edition. Launch campaign/event assignments remain phase 5 work.

BPI's package retains direct references to all three supplied editions, its existing licence document and packaging. The licence document is an artefact, not a new grant of rights. Internal Logix bundle compositions already use the technical editions and are not rewritten into external commercial descriptions.

The Model II host has no separate canonical device definition. Its existing descriptive hardware facts are preserved in the external host record. The two software-edition platform references (`software_edition.abacus_1.model_ii` and `software_edition.cpm_model_ii`) are proposed to target that host; the rest of both technical definitions is unchanged.

## Narrow compatibility update

Contract **0.9.1** extends only `technical.software.platform_support[].computer_id` to accept `external_product` alongside `device` and the transitional `product` type. This is necessary to preserve the two existing Model II host relationships during the migration. It does not permit external descriptions as physical BOM targets or change any current story reference directly. Frontend/backend registry versions and the manifest are updated together.

## Verification

The [machine-readable audit](migration-audit.json) lists all imported record hashes and source evidence, proposal membership and **100 existing reference occurrences**, including retained CP/M cartridge references. The [verification results](verification.json) confirm:

- All 11 new records have exact hashes and remain unauthorized; pre-existing authorization entries and decisions are unchanged.
- Every old foundation record is unchanged before proposal approval.
- Each of the five proposals passes the real server transaction validator independently in memory.
- All proposals pass together in forward and reverse order, producing the same resulting foundation graph without dangling retired IDs.
- Existing base-part/device definitions and technical software content survive; only the two explicit host links change in software editions.
- Changes outside the CP/M offering are limited to direct reference fields. Dates, process ownership, categories, prices and launch assignments are preserved.

The model/review/server suites passed all 64 checks before the final host-reference regression was added; the final targeted model/proposal run passed all seven checks, including that regression. All 24 targeted browser checks passed, covering the live proposal shapes and the existing annotation/review workflow. The five previously documented historical/viewer baseline failures are outside this migration.

Run `node tools/verify-catalogue-phase3.js` from a checkout containing the pinned baseline commit while all five proposals are pending. It performs no network calls and writes no authorizations or foundation data; simulated approvals remain in memory. After approvals, use the preserved report as the audit of this proposal snapshot rather than rerunning the pending-queue assertion.

## Later phases

This phase leaves technical chip/internal-device aliases, artificial product families, Team Edition, unresolved standalone offerings and explicit launch mapping to later phases. The networking CP/M cartridge remains under its existing offering review. Potential Disk II, Apple–Peachtree package and scenario-specific IBM identities require their own direct modelling scope; they are not silently added here.
