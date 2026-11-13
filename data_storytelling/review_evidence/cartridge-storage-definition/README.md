# Cartridge ROM storage definitions

Six independent Changes confirm proposals cover six base-part storage sets and their six cartridge devices. Each proposal updates both records atomically. This implements the agreed definition approach without authorizing foundation changes or claiming completed qualification.

## Proposed scope

- Preserve stable IDs, composition lines, quantities, software ownership and effective dates.
- Describe each base part as a named `supplied_assembly` / `supplied_set`. Logix supplies the set; the narrative distinguishes the intended AION mask-ROM manufacture from purchased EPROM alternatives.
- Keep one set per cartridge. Its internal device count is not the BOM quantity.
- Prefer mask ROM for stable production, with independently qualified EPROMs for development and small correction batches. No default EEPROM or in-system programming is assumed.
- Limit the storage set to packaged ROM devices. PCB, connectors, sockets, decoder/buffer hardware, decoupling and mechanical integration belong to the carrier set. Enclosure, label, packout, software licence and documentation retain their existing owners.
- Define image allocation, chip population, electrical/package contract, image installation, verification, revision control and the inputs needed for manufacturing costing in the existing technical-specification format.

Only Business Tools Aurelia has an established storage capacity: 16,384 bytes. Its two 8 KiB ×8 / four 4 KiB ×8 organizations are alternatives to evaluate, not selected or qualified parts. Other capacities and all actual chip populations remain open. The Artemis four-lane 32-bit XIP layout is a preferred evaluation baseline, not evidence of the cartridge pinout, qualified ROM speed or zero-wait operation.

The AION mask-ROM recipe and 1976 release establish a manufacturing route, not every later density, package or image. Approval of these definitions cannot supply die area, measured yields, image binaries, programming times or unit prices. Volatile costing inputs remain outside foundation records. No calculation schema or annual-sales records are changed.

AIONix Server stores the complete base-system-plus-networking image. Networking CP/M still needs an explicit decision on whether its physical image incorporates base CP/M or relies on separately resident code; its software dependency must not be counted as an additional cartridge without evidence.

## Evidence and validation

`baseline.json` records the main revision, prior queue and protected-file hashes. Existing discussions and review feedback are unchanged. `summary.json` identifies the six proposal IDs. `verification.json` records independent and combined approval simulations, reverse order, retry safety, schema/catalogue validation and preservation checks.

The version-aware composition traversal reaches 36 distinct offerings. Per-set product lists are recorded in `verification.json`; their counts overlap and must not be summed. This trace uses actual composition membership, not loose references or software dependencies.

Run `node tools/verify-cartridge-storage-proposals.js` against this proposal baseline. Later approvals or foundation changes require a new assessment rather than overwriting these snapshots.
