# Editing and publication guide

Read the [principles](../DATA_MODEL_PRINCIPLES.md), [model guide](data_model/MODEL_GUIDE.md) and [reference rules](data_model/REFERENCE_RULES.md). Current application controls are documented in the [application guide](APPLICATION_GUIDE.md). Historical reports in `docs/archived` are not editing instructions.

## Inspect and prepare

Fetch the latest target branch and use a focused branch or worktree. Preserve unrelated work. Inspect `data_storytelling/change.json`, `annotation.json` and `change_review.json` before editing proposals. Follow feedback revision chains and compare the reviewed hashes with current content. The issue register is an editorial aid, not an authoritative statement that every reference is still current.

Preserve stable IDs unless a migration is necessary. Keep technical definitions separate from commercial identities and software rights. Use only direct, explained references: prerequisites in inputs, deliveries/decisions/qualification in outcomes, and specific ownership/participant/agreement fields for those relationships. Do not mechanically move every subject to an input. Removing loose references must not silently remove meaningful story prose.

Apply saved review feedback to other proposals where the same principle applies. Preserve feedback history and original before snapshots; revise the after snapshots and rationale so the proposal receives a new content hash. For product cleanup, verify each removed technical specification against its canonical device/software destination. For composition lines, merge useful legacy `role` text into descriptive `element_type` and remove `role` in the proposed after snapshot; preserve prior classifications and the exact before snapshot. Keep commercial terms in the product, use repeatable semantic specification types, and put an explanation in `description` and the actual term in `value`. Group inseparable relocations and BOM changes; use explicit prerequisites for shared definitions without overlapping whole-record proposals.

For events/processes, minimize top-level subjects. Document any exception in editorial evidence. Product launch links are authoritative when present; do not remove the only surviving launch association before its replacement exists. Distinguish later promotion and external participation. Delivery processes own meaningful product/implementation outcomes; marketing execution processes do not create their promoted catalogues.

The current model does not support pricing information. Remove prices, fees, discounts, price histories and pricing placeholders from proposed product, event, process and campaign records; check narrative fields as well as specifications. Do not import legacy pricing or relocate it into other record types. Retain non-price service scope, duration and eligibility. Preserve Regular Support’s specifically author-retained 10% depot-repair discount; do not re-propose its removal without a new instruction. Preserve immutable before snapshots and historical decisions so review remains accurate; changes to existing foundation content still require Changes confirm.

Apply the composition and software-distribution defaults in the [model guide](data_model/MODEL_GUIDE.md). Trace first use through pinned version paths, document inferred revision assignments and retain unresolved hardware questions as discussions. Use `simulation_end` only for a final composition end. Migrate assumption text to `topic` and `statements` through complete-record proposals.

Keep the existing date precision. A later-stage resource can be an input to the relevant work without being available at the whole process's start. Do not turn a commitment, pilot or demo into a completed delivery or successful qualification. Keep child categories empty when changing ownership, and include all affected records in the same coherent proposal.

## Proposals and authorization

Existing-record revisions belong in `data_storytelling/change.json`. A proposal has stable `id`, `category`, `title`, `reason` and `elements[]`; each element contains `record_type`, `record_id`, complete `before` and complete `after` snapshots. Use `before: null` for additions and `after: null` for removals. Preserve the current before snapshot when refining a pending proposal; change its after snapshot and explanation.

When a supported edit is not yet available, use a `discussion` entry with `elements: []`, `affected_record_ids` and `findings`. Explain the problem and the decision needed; never fabricate no-op before/after changes just to obtain authorization. The schema is [discussion.schema.json](../schemas/storytelling/discussion.schema.json). Discussions accept remarks and removal but cannot authorize records. When remarks support a concrete edit, preserve the ID and feedback history, replace the discussion-only fields with complete elements, and obtain fresh review of the new hash.

Group inseparable operations, including identity moves and their dependent references, in one proposal. Avoid overlapping whole-record snapshots in separate proposals. Use `depends_on_change_ids` for separable prerequisites; it is not a general scheduling engine. Use exact committed `annotation_ids` where a proposal addresses feedback. Approval resolves only an unchanged current open annotation; preparing a proposal does not resolve it.

Changes confirm selects and saves complete proposals. References do not authorize other records. New records imported directly under an explicit import instruction require `unauthorized` entries with hashes computed by `hash()` in `server/model.js`; existing authorized records and hashes remain untouched until their reviewed changes are applied. Never fabricate approval or update an authorized hash simply to satisfy a validator. Historical decisions are immutable.

Schema deployment is separate from story authorization; the saving API cannot apply schema proposals. Obtain approval when a schema extension is not already authorized. Keep schemas, registry/manifest, runtime consumers, tests and documentation consistent in one deployment.

## Dataset and evidence paths

Use `datasetPath()` from `code/model-contract.js`; do not assume every filename equals its type. `external_product` uses `data_foundation/external_products.json`, while its envelope, ID prefix and proposal type remain singular. Its specification entries have exactly `no`, `description`, one `ref_id` and `ref_role`.

Current editorial evidence may live below `data_storytelling/review_evidence/`. These supporting files are not foundation datasets, authorization targets or a substitute for the live queue. Store per-reference rationale and temporary exceptions there. Historical storytelling reports and superseded proposal narratives belong in `docs/archived/` with an explicit historical label. Existing `archived_no_longer_valid/` snapshots and checksum inventories remain unchanged.

Current documentation belongs in `docs/` and `docs/data_model/`. Update navigation and relative links when moving files. Do not leave obsolete phase-status reports in the active guides. Keep a relocation index for archived material and retain the source commit so original content is recoverable. Archived snapshots may contain original paths; interpret them at their recorded baseline.

## Validation and publishing

Run checks appropriate to the change:

```sh
npm ci
npm run validate:data
node tools/generate-foundation-spec.js
npm run build
node --test tests/model/*.test.js tests/review/*.test.js tests/server/*.test.js
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Migration-evidence tests live in `tests/migration/`; run them when changing archives, links or migration logic. Investigate failures against the unchanged baseline rather than rewriting historical evidence to make them pass. `node tools/validate-foundation.js --complete` additionally requires every foundation record to be authorized and can legitimately fail while pending records exist.

Validate grouped proposals through the real transaction code in memory; never use a production authorization endpoint for tests. Verify no unintended foundation or authorization changes occurred. Regenerate `docs/data_model/FOUNDATION_SPECIFICATION.md` after schema changes. Generated viewer assets are ignored by Git and must be included in static publication.

The optional `npm run validate:catalogue` checks the stricter catalogue target against the live foundation; all current offerings pass it, but future edits can fail it even when the compatibility schema accepts them. It is separate from the active schema and saving service. See [catalogue validation](data_model/CATALOGUE_VALIDATION.md) for proposal simulation and the required activation order.

The maintained branch is `main`. Publish the authorized implementation and reviewable proposals there, leaving content authorization to the author. Check the resulting remote commit. Frontend, backend and `AION_BRANCH` must agree with the schema version; see [Render setup](RENDER_SETUP.md).

For technology specifications, use the [chapter contract](data_model/MODEL_GUIDE.md#technology-specification-chapters). A direct format conversion requires an explicit author instruction. Preserve prior effective authorization states for that lossless conversion, record its instruction and before/after hashes, and append the corresponding decision for previously authorized content; do not promote pending records or authorize the subsequent editorial rewrite. The current technology rewrite proposals are verified with `node tools/verify-technology-chapters.js`, which checks exact conversion, full source coverage and independent/batch approval without applying proposals to disk. Its evidence is a pinned review snapshot.

When refining technology chapters, run `node tools/verify-technology-prose.js` for the current author-feedback revision. The authoring checks reject unused keys, Boolean-valued parameters, sentence-valued parameters and redundant numbered lists. Approval simulations additionally check preserved numeric values, command scopes and video-memory configurations. These prose checks apply to revised proposals; the direct-conversion baseline remains schema-valid until its rewrite is authorized.

For the fixed-composition offering and role-consolidation proposals, run `node tools/verify-fixed-composition-offerings.js`. It checks independent and batch authorization, fixed product contents, platform-specific offerings, unchanged workstation cable quantities, preserved role text and the strict catalogue profile without applying proposals to disk.

The Regular Support amendment is included by `node tools/verify-fixed-composition-offerings.js` when its evidence exists. Authorize the annual service definition before or together with the amended product proposals that remove duplicate entitlement blocks. Preserve their original before snapshots and multi-computer service quantities.

For the unused-field cleanup, run `node tools/verify-unused-field-cleanup.js`. Schema fields already absent from current data are retired now. Authorize the three empty-container proposals before deleting their remaining transitional schema declarations; do not rewrite foundation records or authorization hashes directly. New records omit the transitional containers. Historical snapshots remain immutable, and historical regression fixtures may use an explicit in-memory representation adapter.

For the revised fixed-required composition proposals, run `node tools/verify-required-compositions.js`. The three existing cleanup IDs now cover all 1,000 lines, with the five OEM exclusions and ten associated base parts included in the device group. Each group must authorize independently and in any batch order. Do not create overlapping whole-record proposals or rewrite the original cleanup evidence. Omit `unit` and `supply_condition` from newly authored lines; quantity counts complete referenced items and every line is required. Keep the transitional schema declarations until the current record removals are approved.

For the maturity-description proposals, run `node tools/verify-maturity-description.js`. Verify all 25 stage mentions, unchanged capability subjects, independent and batch authorization, and validity under the proposed schema without `maturity`. The representation change must preserve review/target wording; it does not establish that a qualification succeeded. After data approval, `node tools/retire-maturity-schema.js --apply` removes the temporary schema declaration, advances the contract and regenerates its specification. Publish that schema deployment separately; the saving service does not modify schema files.
