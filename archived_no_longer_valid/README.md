# Historical archive — not current instructions

This directory preserves earlier models, migrations and review evidence from the repository baseline `828a4f4`, reorganized on 30 October 2026. “No longer valid” means these files do not define the current contract. Approval evidence and source snapshots remain valid for their original point in time.

The [complete inventory](inventory.json) lists every preserved file, its original path, destination, SHA-256 and whether it was moved or snapshotted before updating the active counterpart. File contents are unchanged. The archive mirrors original relative paths. Historical links, embedded paths, hashes and IDs deliberately retain their original meanings; use the inventory to locate relocated files. References to a current counterpart may require leaving this directory. Do not rewrite original approval payloads to repair links.

| Subtree | Contents and purpose |
| --- | --- |
| `docs/data-model/` | Earlier proposals, source inventory, schema/separation/migration reports, and the former storytelling reference. |
| `docs/review/history/` | Original author logs, proposals, decisions and application report. |
| `data_storytelling/` | Old record contexts, decisions, mappings, migration reports, issue snapshot and pre-cleanup metadata. |
| `data_storytelling/history/` | Pre-separation proposal and pre-phase-1B foundation/authorization snapshots. |
| `schemas/archive/` | Historical 0.2 and 0.3 contracts. |
| `schemas/storytelling/` | Record-context snapshot schema. |
| `migration/` | Completed one-shot migrations and audits. |
| `tools/` | Retired import/validation helpers and redundant field-reference generator. |
| `code/` | Unused confirmation panel and duplicate misspelled redirect. |

Do not run these migrations against current data. They assume original paths and baseline contracts. Reproduction requires an isolated checkout of the recorded historical commit. Active tests still verify evidence checksums and original author fingerprints; moving evidence does not retire those protections.

Use the [current model guide](../docs/data-model/MODEL_GUIDE.md), [editing guide](../docs/EDITING_GUIDE.md), [storytelling reference](../docs/data-model/STORYTELLING_FILE_REFERENCE.md) and [review backlog](../docs/REVIEW_BACKLOG.md) for ongoing work. The backlog retains all deferred mapping IDs and an index of every phase 1B note owner. The active issue register keeps unresolved work; current authorization remains outside this archive.
