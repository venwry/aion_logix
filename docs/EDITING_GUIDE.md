# Editing and handover guide

Start with the [repository objective](../README.md), [principles](../DATA_MODEL_PRINCIPLES.md), [model guide](data-model/MODEL_GUIDE.md) and [multi-phase process](MULTI_PHASE_PROCESS.md). Consult the [backlog](REVIEW_BACKLOG.md) before repeating earlier research.

## Edit story records

1. Fetch the latest target branch and use a focused working branch for substantive story edits. Preserve existing stable IDs unless an explicit migration is necessary.
2. Follow the current schemas. Recover indirectly mentioned facts and reconcile contradictions, but keep source citations and editorial qualifications outside foundation records. Do not silently convert inference into authorized canon.
3. Write who acted, what happened or was committed, and the outcome. Use events/processes for dates; process steps for team actions; campaigns for marketing. Preserve commercial meaning and date precision.
4. Keep each record manageable for whole-record authorization. Decompose independently reviewable content into linked records when necessary.
5. Obtain author approval for schema extensions before adding them. Update schemas, manifest/registry, consumers, documentation and tests together for a breaking model change.

For the current page controls, see the [application guide](APPLICATION_GUIDE.md). Display layout changes do not require a story-schema revision or renewed record authorization.

## Propose and authorize

Create story proposals in `data_storytelling/change.json` with stable ID, category, title, reason and explicit `elements` containing dataset type, record ID, and complete `before`/`after` snapshots. Use `before: null` for additions. Review overlapping proposals and dependencies explicitly; the application does not schedule a dependency graph. Schema proposals cannot be applied by the saving API.

Use Changes confirm to review and save the resulting group. Use the browser's left-list checkboxes and **Authorize and save** to authorize existing records in one commit. Review the entire record first. Plain authorization changes editorial state only; approving a revision also updates story JSON.

Never set `authorized` or refresh an authorized hash merely to make validation pass. Changed content needs renewed authorization. If editing foundation JSON directly, update its editorial entry to `unauthorized` with the hash computed by `hash()` in `server/model.js`; add an entry for a new record and retain previous decision evidence. Remove a deleted record's current authorization entry while preserving historical decisions. Whole-graph validation is required. Prefer the proposal workflow where practical.

An absent or mismatched authorization means pending. Rejected work must not remain presented as accepted story content; document the editorial decision and remove or revise the candidate through a reviewed change. References do not authorize related records.

## Sources, issues and archives

Keep the active source catalogue and unresolved issue register in `data_storytelling/`. Their inherited formats are documented in the [storytelling reference](data-model/STORYTELLING_FILE_REFERENCE.md). Do not reinterpret historical status fields as current authorization. Source paths/JSON pointers refer to the pinned source repository, not this repository.

The [archive inventory](../archived_no_longer_valid/inventory.json) records original paths and SHA-256 checksums. Archived records, logs, schemas and scripts are preserved unchanged. Historical references resolve in their original snapshot. Use the inventory to locate relocated evidence. Never run archived migration scripts against the current foundation.

## Validate and document

```sh
npm ci
npm run validate:data
node tools/generate-foundation-spec.js
npm run build
node --test tests/model/*.test.js tests/migration/*.test.js tests/review/*.test.js tests/server/*.test.js
CHROMIUM_PATH=/usr/bin/chromium npm test
```

`node tools/validate-foundation.js --complete` additionally requires every foundation record to be authorized; it is expected to fail while the story remains incomplete. Update the repository map when adding/removing files and the storytelling reference when editorial formats change. Generated assets are ignored by Git; build them for publication.

## Deploy

The maintained branch is `main`; Render's code deployment and `AION_BRANCH` must agree with the dataset model version. Follow [Render setup](RENDER_SETUP.md). GitHub Pages needs the repository's static files plus built viewer assets. Data-only authorization commits do not trigger Render rebuilds under the current build filter: connected browsing reads GitHub, whereas disconnected browsing uses the deployed snapshot. Deployment access and the backend key must be handed over outside Git.

## Agreement terms and timeline ownership

Edit terms inside the owning agreement’s `clauses[]`; a clause cannot be authorized separately. Keep its stable ID for traceability. For events/processes, set one `agreement_id` or omit the field; never use an empty string or `agreement_ids`. Contextual links to other agreements can stay in generic subject references.

Single-parent cleanup is proposed through Changes confirm, one affected record per proposal. Where an event would otherwise anchor two processes, the non-owning process can retain the same calendar date and precision as a literal boundary. Removing an extra `steps[].event_id` leaves its descriptive step intact. Do not change dates merely to force nesting.


## Timeline categories and swim lanes

Events and processes support an optional `category` string. The permitted non-empty values are `Adam's personal`, `Logix/AION investment`, `Product dev & launch`, `Ecosystem & Partners`, and `Competition`. An omitted field or `""` is empty; `null` and other spellings are invalid.

Assign a category only to a top-level event or process. Children must leave it empty and inherit their root's category. Ownership comes from process steps, event-based period boundaries, `parent_process_id`, or event `process_ids`. Inputs, outcomes, subjects and related-process references do not establish ownership. The model validator rejects a non-empty category on an owned child. When reparenting a root, clear its category in the same approval batch. Campaigns use their execution process's category; they have no separate category field.

The timeline displays five lightly colored vertical lanes, with an additional grey Uncategorised lane when matching records have no category. Each lane has a labeled collapse/expand button above the workspace. Collapse hides the lane and its cards, including undated entries, while leaving its button available. Controls work by keyboard and remain available in full screen. Lane visibility lasts until page reload; filter reset does not change it.

All lanes share the global calendar. Collapsing a lane does not move date anchors. Overlapping root groups occupy parallel columns within their lane; nested work retains compact duration tracks. Horizontal scrolling accommodates wider lanes. Filtering retains inherited categories from the complete ownership tree even when an ancestor falls outside the selected date range. Unknown dates remain in the separate undated section and follow the same lane visibility controls.

Categories describe the root programme's primary purpose. Semiconductor work under stepper installation remains Investment, and competitor events inside ecosystem programmes remain Ecosystem & Partners. Moving individual children into a different lane requires changing ownership, not assigning an override.

Category assignments are story changes: submit one Changes confirm proposal per affected record. The UI and schema can be deployed before those proposals are approved; records remain Uncategorised until their root assignment is authorized.

## Product definitions (0.7.0)

Use `base_part`, `device` and `software_edition` for canonical technical definitions; existing product subjects link through `technical_identity`. Products, devices and editions own complete `composition_history` snapshots with explicit child versions. New imported technical records are externally Unauthorized; product revisions remain Changes confirm proposals. See [definition import and ownership](PRODUCT_DEFINITION_IMPORT.md). Never import old chronology, approvals or financial projections into these definitions. Only events/processes own calendar dates; unknown composition boundaries must remain explicit until reconciled.
