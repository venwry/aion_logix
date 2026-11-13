# AION C 2.0 and the June 1979 Apple II workflow

Prepared against main `99a5d92`, after fetching the independent storage approvals. These are proposed story changes, not completed implementation or laboratory results. Existing foundation records, authorizations, annotations, review feedback and calculation data remain unchanged.

## Accepted scope

The author confirms that the IDE/compiler runs on Aurelia, emits native MOS 6502 Apple II executables, and writes Apple-format diskettes through FlexiDisk II for execution on an Apple II. The Logix Apple II Video Card provides the full contemporary Aurelia TUI/graphics behaviour with minimal source changes. Separate target-specific C functions continue to expose native Apple graphics, sound and other supported hardware. The S-100 supplied ROM/TUI path requires qualified CP/M with the matching TUI extensions. The repeated `event.ncc79_campaign` in the original request is interpreted as that event plus its associated `campaign.ncc1979`.

Three non-overlapping proposal groups use the existing schema:

1. **Standard profiles (2 records):** add dated Apple II and S-100 profiles to the existing C portability and TUI standards. Compiler release 2.0 does not imply a new TUI standard version. Keep the 1978 baseline, 1980 ERA/AIONix release and 1982 pointer chronology.
2. **Card ROMs and disk transfer (9 records):** update both video cards and their ROM sets/offering descriptions, FlexiDisk II and its existing format-controller/local-firmware sets. Preserve BOM quantities and existing video/sprite RAM. ROM capacity, chip organization, bank timing and working RAM still require engineering measurement. The new controller responsibilities make physical format/read/write distinct from the host export utility's filesystem responsibilities.
3. **Compiler and launch (9 records):** add `software_edition.aion_c_2_cpm`, `product.aion_c_2_cpm` and four edition-specific delivery parts; update the NCC event, campaign and responsible development process. Preserve version 1.0 and all existing bundles. Two installation diskettes follow the author's standing IDE packaging default, with image-fit qualification retained. The existing 1980 AIONix edition is not silently expanded with the Apple target.

The second group depends on the first; the third depends on both. Review them together or in that order. Every modified record retains an exact current `before` snapshot.

## Operational contract

- Host: Aurelia/Aurelia+ under the existing enhanced CP/M environment. Apple is a target, not an IDE host; no CP/M or Z80 processor is required there.
- Build: retain the Z80 backend and add a native 6502 backend, startup/runtime libraries, ABI, assembly support, link maps and target resource reports. Existing host debugging does not automatically debug code executing on Apple.
- Transfer: write Apple DOS 3.2-compatible, 13-sector diskettes on Aurelia FlexiDisk II. The local controller handles physical encoding and timing; host software handles catalogue/allocation and native binary headers. Boot an existing Apple DOS installation, then load/run the generated file. Formatting output media does not provide an Apple DOS boot image.
- Read: moving the disk to compatible Apple Disk II requires no Logix interface on Apple. Using FlexiDisk II attached directly to Apple requires the existing Logix Apple II Expansion Card and its adapter.
- Presentation: common TUI commands, controls and graphics modes match the **June 1979 Aurelia release** on equivalent qualified monitors. This includes the existing sprite facilities, but not future mouse/professional/multitasking extensions. Native CPU throughput and memory budgets differ.
- Input: every logical command remains available. Native Apple/terminal keyboards cannot promise identical modifier information; documented sequences/menu equivalents preserve functionality. Exact Aurelia key gestures require a qualified full-event keyboard path.
- Native access: Apple graphics, speaker, paddles/buttons and documented peripheral hooks remain available through separately named target libraries. Native calls need target adapters when ported to Aurelia; existing hardware-dependent Apple programs are not automatically redirected to Logix video.
- Firmware: banked ROM and fixed call trampolines must restore mapping around disk/UI calls. State, clipboard and control descriptors consume bounded RAM. Full profile implementation may combine ROM primitives and linked helpers; it does not require every control routine to fit one continuously mapped ROM window.

The public demonstration gains four minutes (the expansion/compiler block becomes ten minutes), bringing the eight timed presentation blocks to 54 minutes. Both the headline duration and preparation prose agree. Confidentiality is narrowed to unreleased next-generation targets, leaving the released Apple target demonstrable.

## Historical anchors and engineering boundaries

- [Apple II Reference Manual](https://www.applelogic.org/files/AIIREF.pdf): slot-specific firmware and the shared expansion-ROM window require explicit mapping management. Existing ROM-set quantities establish no linked image capacity.
- [Apple DOS 3.2 manual catalogue](https://www.computinghistory.org.uk/det/1704/Apple-II-DOS-3-2/) identifies the 1979 edition and its machine-language-file, disk-format and memory/interface documentation. [Beneath Apple DOS](https://mirrors.apple2.org.za/Apple%20II%20Documentation%20Project/Books/Beneath%20Apple%20DOS.pdf) supplies a retrospective format/version cross-check. Use the June 1979 13-sector profile, not DOS 3.3's later 16-sector format.
- [MOS MCS6500 Programming Manual, January 1976](https://www.bitsavers.org/components/mosTechnology/6500-50A_MCS6500pgmManJan76.pdf): native CPU addressing and stack constraints require a dedicated ABI/runtime rather than reuse of Z80 machine code or register allocation.

The sources describe real host constraints. They do not establish historical existence of the fictional AION compiler or Logix cards. The author accepts those scenario implementations; conformance, image fit, resource budgets and measured performance remain explicit acceptance work. No new ROM sizes, achieved benchmarks, universal Apple RAM minimum, future DOS support or automatic cross-CPU binary compatibility is asserted.

## Verification and downstream calculations

Run `node tools/verify-aion-c2-proposals.js` against the pending queue. It uses the real transaction code in memory and checks combined, reverse and sequential approvals; dependency rejection; retry behaviour; strict catalogue validity; unchanged 1.0/later existing compiler editions; unchanged physical hardware BOMs; new product BOM and two-diskette quantity; matched presentation timings; and protected file hashes. `verification.json` records the result.

`baseline.json` preserves the original queue, baseline commit and file digests. `summary.json` maps the three proposals to their 20 records. No schema or application display changes are needed.

Calculation data is deliberately not rewritten to describe pending foundation records. After approval, the new edition's four delivery parts and software/product operations will need explicit calculation allowances before manufacturing estimates are regenerated. Do not substitute version 1.0 costs silently or claim a measured ROM manufacturing cost while its image/population remains unresolved.
