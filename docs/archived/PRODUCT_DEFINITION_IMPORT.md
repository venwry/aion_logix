# Product definitions and composition — contract 0.7.0

> **Historical documentation — not current rules, instructions or queue status.** Preserved from main at `606e3f1`; consult the [current documentation index](../README.md) and live storytelling JSON.

The author approved the schema extension and a definition-only import. New technical records are imported with external `unauthorized` entries (the browser's Pending authorization filter). Existing product and manufacturing-capability records change only through individual Changes confirm proposals. Referencing a technical record does not authorize it.

## Scope and ownership

There are now 15 foundation datasets. `base_part.json` contains 450 physical base-part definitions, `device.json` contains 60 devices and `software_edition.json` contains 32 executable editions. The two legacy specification-only components are excluded from physical base parts. Definitions do not assert commercial availability; the two former prototype devices retain definitions without active composition versions.

The pending queue adds 120 existing-product proposals and eight existing-capability proposals. All 63 commercial offerings gain composition histories through that queue. Existing product IDs, facts and authorizations are preserved until review. Old device/chip/software narrative identities link to canonical technical definitions through `technical_identity`. An offering and its software edition remain distinct even where the earlier identity migration merged them.

Products describe supplied configurations; devices own hardware construction; software editions own executable specifications and delivery; base parts are physical leaves. A supplied set stays a set, not an invented list of internal chips. Service entitlements are visible but excluded from physical inventories.

## Time and version selection

All imported composition boundaries are explicitly `unknown`. No old launch, shipment, qualification, retirement or campaign dates are imported. Old dates are used only during conversion to resolve the source graph's original child selections; each resulting child version is pinned explicitly. There are 72 offering, 60 device and 32 edition versions. Later timeline review can connect their boundaries to current events/processes without changing their BOMs silently.

`code/composition.js` is shared by validation and clients. `resolveComposition(records, id, versionNumber)` requires an explicit version, preserves units, conditions and unknown quantities, exposes nonmaterial services separately and rejects cycles/missing versions. The validator also checks references, connection hosts, socket compatibility/capacity, placements, piece counts, RAM arithmetic and framebuffer sizes. Unknown chronology is not an implicit latest-version selector.

## Schema details

All schemas use Draft 2020-12 and closed objects. `composition.schema.json` declares boundaries, typed references, lines, conditions, connections, placements, entitlements and owner-specific versions. `technical.schema.json` declares the imported nested hardware/software profiles with explicit properties and types, preserving rich specifications rather than serializing them into text. Its profiles retain meaningful engineering units and terminology from the source, including explicit byte/KiB/bit fields; the generated foundation specification is the attribute-level reference.

Small implementation refinements to the proposal preserve unresolved facts: `manufacturer_name` retains a supplier designation when no current actor exists; `family_name` preserves software grouping while `family_product_id` remains optional; and upgrade connections can identify an existing customer device rather than invent a supplied host. Device-level technical definitions are permitted only for devices without composition versions. Existing generic product specifications remain compatible; technical links identify the canonical imported detail.

## Excluded source material

No source authorization decisions, confirmation, provenance, editorial/production statuses, historical event/campaign records, investments, pricing, yield forecasts or calculated costs enter the new foundation datasets. Engineering requirements and unknown values are retained. Dated process-recipe variants lose dates and financial estimates but retain physical geometry and current capability links. Narrative product content already in Aion Logix is not overwritten by legacy text.

`product-definition-import-audit.json` records the pinned commit, record coverage, identity mapping and excluded-field paths outside foundation. It contains no imported approval decisions. The source is `venwry/vs_edu1` at `dac733770d8e622d5619bd84bc9d21db6c7ec7ab`.

## Import and verification

`tools/import-product-definitions.py /path/to/vs_edu1` requires the pinned checkout. Run only before review of this import; it regenerates the technical datasets, their pending hashes and the corresponding proposal group. Do not rerun over later authorized edits. The source remains unchanged.

All 164 resolved source inventories were compared independently against the new graph, including exact physical quantities, units and ownership paths. Their regression fingerprints are in `tests/fixtures/product-import-inventories.json`. Tests also check pending authorization hashes, unknown propagation, isolated proposal approval, cycles, missing versions, sockets, temporal bounds and forbidden editorial fields.

Schema deployment requires the browser and saving backend to use 0.7.0 together. `render.yaml` already rebuilds for schema/code changes. The manifest and shared registry are updated atomically with this import. No financial model or archived migration evidence is modified.
