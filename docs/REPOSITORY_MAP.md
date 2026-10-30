# Repository map

Every maintained file is listed below. Historical files are separately enumerated in the [archive inventory](../archived_no_longer_valid/inventory.json), with original paths and checksums; see its [guide](../archived_no_longer_valid/README.md). The repository root is the static publication root. `data_calculation/` is reserved, not an implemented calculation engine.

Generated/untracked files are not source: `node_modules/` contains installed dependencies; `assets/app.js` and `assets/chunks/` are built documentation bundles; `test-results/` and `playwright-report/` are test output. Local `.env` files must stay outside Git. Rebuild the documentation assets for publishing.

| File | Purpose |
| --- | --- |
| [.dockerignore](../.dockerignore) | Excludes local dependencies, secrets and Git metadata from the Docker build context. |
| [.gitignore](../.gitignore) | Excludes dependencies, generated viewer bundles, test output and local environment files. |
| [DATA_MODEL_PRINCIPLES.md](../DATA_MODEL_PRINCIPLES.md) | Authoritative modeling and whole-record authorization principles. |
| [Dockerfile](../Dockerfile) | Node 24 production backend image; does not build the documentation viewer bundle. |
| [README.md](../README.md) | Repository objective, standards, directory guide and entry instructions. |
| [assets/aion-favicon.png](../assets/aion-favicon.png) | Browser/favorites icon derived from the AION A emblem, including its red dot. |
| [assets/logix-aion.png](../assets/logix-aion.png) | Original author-supplied combined Logix/AION artwork used unchanged in all story application headers. |
| [assets/main.js](../assets/main.js) | Documentation viewer navigation, Markdown/Mermaid/JSON rendering and sandboxed local prototypes. |
| [assets/style.css](../assets/style.css) | Documentation viewer presentation and layout. |
| [code/api-client.js](../code/api-client.js) | Saving-service connection, session credentials and authenticated API requests. |
| [code/app.css](../code/app.css) | Shared story application styling and responsive split panels. |
| [code/browser.html](../code/browser.html) | Data browser page structure. |
| [code/browser.js](../code/browser.js) | Dataset selection, filters, sorting, detail view and batch authorization. |
| [code/changes-confirm.html](../code/changes-confirm.html) | Proposal review page structure. |
| [code/changes-confirm.js](../code/changes-confirm.js) | Before/after proposal tables, persistent checkbox selection and one-commit batch save. |
| [code/compact-details.js](../code/compact-details.js) | Shared compact details, content-weighted autofit, resizable tables, 1–3 column reference grids and cross-page record links. |
| [code/index.html](../code/index.html) | Application-directory redirect to timeline. |
| [code/model-contract.js](../code/model-contract.js) | Current schema version and shared dataset registry. |
| [code/review-log.js](../code/review-log.js) | Active stable serialization and browser hashing; no longer a report-export module. |
| [code/shared.js](../code/shared.js) | Data loading, foundation/authorization join, relationship and detail helpers. |
| [code/temporal.js](../code/temporal.js) | Event-based process boundary resolution and precision-preserving date bounds. |
| [code/timeline.html](../code/timeline.html) | Timeline page structure. |
| [code/timeline-layout.js](../code/timeline-layout.js) | Explicit membership, campaign/execution merging, shared calendar coordinates and overlap packing. |
| [code/timeline.js](../code/timeline.js) | Nested parallel event/process/campaign rendering, fixed date rail, full-screen mode, filtering and shared details. |
| [data_calculation/.gitkeep](../data_calculation/.gitkeep) | Placeholder for future assessment data; no calculation model implemented. |
| [data_foundation/actor.json](../data_foundation/actor.json) | People, organizations and groups. |
| [data_foundation/actor_relationship.json](../data_foundation/actor_relationship.json) | Roles and affiliations. |
| [data_foundation/agreement.json](../data_foundation/agreement.json) | Identified arrangements and parties. |
| [data_foundation/assumption.json](../data_foundation/assumption.json) | Premises, policies and constraints. |
| [data_foundation/campaign.json](../data_foundation/campaign.json) | Marketing content linked to execution processes. |
| [data_foundation/clause.json](../data_foundation/clause.json) | Independently reviewable agreement terms. |
| [data_foundation/event.json](../data_foundation/event.json) | Single-date occurrences and milestones. |
| [data_foundation/location.json](../data_foundation/location.json) | Places and geographic hierarchy. |
| [data_foundation/manufacturing_capability.json](../data_foundation/manufacturing_capability.json) | Scoped fabrication capability and qualification. |
| [data_foundation/market_response.json](../data_foundation/market_response.json) | Qualitative adoption and commercial responses. |
| [data_foundation/process.json](../data_foundation/process.json) | Work over time, steps, inputs and outcomes. |
| [data_foundation/product.json](../data_foundation/product.json) | Products, services and families without composition. |
| [data_foundation/technology.json](../data_foundation/technology.json) | Technical identities, fabrication and specifications. |
| [data_storytelling/.gitkeep](../data_storytelling/.gitkeep) | Original directory placeholder; has no runtime role. |
| [data_storytelling/authorization.json](../data_storytelling/authorization.json) | Current whole-record content hashes and author acceptance. See the storytelling file reference. |
| [data_storytelling/authorization_decision.json](../data_storytelling/authorization_decision.json) | Preserved direct-save decision snapshots. See the storytelling file reference. |
| [data_storytelling/change.json](../data_storytelling/change.json) | Pending before/after proposals. See the storytelling file reference. |
| [data_storytelling/manifest.json](../data_storytelling/manifest.json) | Model version and dataset inventory. See the storytelling file reference. |
| [data_storytelling/reconciliation_issue.json](../data_storytelling/reconciliation_issue.json) | Unresolved editorial questions referencing current records. See the storytelling file reference. |
| [data_storytelling/source.json](../data_storytelling/source.json) | Source bibliography; inherited historical evidence fields. See the storytelling file reference. |
| [docs/APPLICATION_GUIDE.md](../docs/APPLICATION_GUIDE.md) | Current page navigation, timeline and shared detail controls, filtering, keyboard access and saving. |
| [docs/EDITING_GUIDE.md](../docs/EDITING_GUIDE.md) | Editing, schema approval, authorization, validation and handover workflow. |
| [docs/MULTI_PHASE_PROCESS.md](../docs/MULTI_PHASE_PROCESS.md) | Agreed phase 1, 1B, 2–5 and recurring assessment process. |
| [docs/RENDER_SETUP.md](../docs/RENDER_SETUP.md) | Authentication, Render deployment, direct saving and static publication. |
| [docs/REPOSITORY_MAP.md](../docs/REPOSITORY_MAP.md) | This complete maintained-file inventory. |
| [docs/REVIEW_BACKLOG.md](../docs/REVIEW_BACKLOG.md) | Open issue index, phase 1B note owners and all deferred mapping IDs. |
| [docs/data-model/FOUNDATION_SPECIFICATION.md](../docs/data-model/FOUNDATION_SPECIFICATION.md) | Generated hierarchical schemas, diagrams and reference catalogue. |
| [docs/data-model/MODEL_GUIDE.md](../docs/data-model/MODEL_GUIDE.md) | Accepted model rationale and temporal/campaign discipline. |
| [docs/data-model/STORYTELLING_FILE_REFERENCE.md](../docs/data-model/STORYTELLING_FILE_REFERENCE.md) | Active editorial file structures, purposes and references. |
| [docs/review/README.md](../docs/review/README.md) | Current application review and authorization instructions. |
| [docs/viewer.html](../docs/viewer.html) | Documentation viewer shell; loads the generated assets/app.js bundle. |
| [index.html](../index.html) | Root redirect to the story timeline. |
| [package-lock.json](../package-lock.json) | Exact npm dependency resolution for reproducible installation. |
| [package.json](../package.json) | Dependencies, package metadata and build/start/validation/test commands. |
| [playwright.config.cjs](../playwright.config.cjs) | Browser-test discovery, Chromium selection and local HTTP server setup. |
| [render.yaml](../render.yaml) | Render Blueprint, build filters, health endpoint and environment configuration. |
| [schemas/actor.schema.json](../schemas/actor.schema.json) | Strict actor dataset contract; see the generated foundation specification. |
| [schemas/actor_relationship.schema.json](../schemas/actor_relationship.schema.json) | Strict actor_relationship dataset contract; see the generated foundation specification. |
| [schemas/agreement.schema.json](../schemas/agreement.schema.json) | Strict agreement dataset contract; see the generated foundation specification. |
| [schemas/assumption.schema.json](../schemas/assumption.schema.json) | Strict assumption dataset contract; see the generated foundation specification. |
| [schemas/campaign.schema.json](../schemas/campaign.schema.json) | Strict campaign dataset contract; see the generated foundation specification. |
| [schemas/clause.schema.json](../schemas/clause.schema.json) | Strict clause dataset contract; see the generated foundation specification. |
| [schemas/common.schema.json](../schemas/common.schema.json) | Shared nested value objects, references, dates and process boundaries. |
| [schemas/event.schema.json](../schemas/event.schema.json) | Strict event dataset contract; see the generated foundation specification. |
| [schemas/location.schema.json](../schemas/location.schema.json) | Strict location dataset contract; see the generated foundation specification. |
| [schemas/manufacturing_capability.schema.json](../schemas/manufacturing_capability.schema.json) | Strict manufacturing_capability dataset contract; see the generated foundation specification. |
| [schemas/market_response.schema.json](../schemas/market_response.schema.json) | Strict market_response dataset contract; see the generated foundation specification. |
| [schemas/process.schema.json](../schemas/process.schema.json) | Strict process dataset contract; see the generated foundation specification. |
| [schemas/product.schema.json](../schemas/product.schema.json) | Strict product dataset contract; see the generated foundation specification. |
| [schemas/storytelling/authorization.schema.json](../schemas/storytelling/authorization.schema.json) | Current record authorization shape. |
| [schemas/storytelling/authorization_decision.schema.json](../schemas/storytelling/authorization_decision.schema.json) | Direct-save decision and target snapshot shapes. |
| [schemas/technology.schema.json](../schemas/technology.schema.json) | Strict technology dataset contract; see the generated foundation specification. |
| [server/github.js](../server/github.js) | GitHub snapshot reads and atomic multi-file commits with concurrency protection. |
| [server/index.js](../server/index.js) | HTTP authentication, origin checks, API endpoints and restricted static serving. |
| [server/model.js](../server/model.js) | Current story/editorial validation, hashing and authorization/change transactions. |
| [tests/details-controls.spec.cjs](../tests/details-controls.spec.cjs) | Shared detail table autofit/resizing, reference grids and linked-name navigation on both pages. |
| [tests/application.spec.cjs](../tests/application.spec.cjs) | Timeline, browser, navigation, split-panel and loading-error browser tests. |
| [tests/browser-batch.spec.cjs](../tests/browser-batch.spec.cjs) | Browser selection persistence, compact details and batch-saving tests. |
| [tests/migration/handover.test.js](../tests/migration/handover.test.js) | Archive byte integrity, active issue/backlog coverage and documentation links. |
| [tests/migration/phase1.test.js](../tests/migration/phase1.test.js) | Pre-separation identity and evidence preservation checks. |
| [tests/migration/phase1b.test.js](../tests/migration/phase1b.test.js) | Retired identity mappings and phase 1B migration fingerprint checks. |
| [tests/model/phase1b.test.js](../tests/model/phase1b.test.js) | Temporal boundaries, retired-field rejection, numbered items and campaign constraints. |
| [tests/model/timeline-layout.test.js](../tests/model/timeline-layout.test.js) | Timeline membership, interval packing, unknown dates and cycle protection. |
| [tests/model/schemas.test.js](../tests/model/schemas.test.js) | Current schema validation, editorial-field rejection and broken references. |
| [tests/review.spec.cjs](../tests/review.spec.cjs) | Visible before/after review and group-save browser tests. |
| [tests/review/import.test.js](../tests/review/import.test.js) | Original approval payload fingerprints; reads archived importer helpers. |
| [tests/review/proposals.test.js](../tests/review/proposals.test.js) | Pending proposal before/after consistency and resulting foundation validity. |
| [tests/server/authorization.test.js](../tests/server/authorization.test.js) | Authorization, group changes, HTTP authentication and GitHub concurrency. |
| [tests/server/batch.test.js](../tests/server/batch.test.js) | Atomic multi-record authorization, stale requests and idempotency. |
| [tests/server/proposal-batch.test.js](../tests/server/proposal-batch.test.js) | Atomic selected-proposal saves, combined graph validation, overlapping edits, replay and single-commit persistence. |
| [tests/timeline-layout.spec.cjs](../tests/timeline-layout.spec.cjs) | Nested campaign/process rendering, date-rail pinning, year-line layering, full-screen controls and cross-page details. |
| [tests/viewer.spec.cjs](../tests/viewer.spec.cjs) | Documentation, archives, diagrams, local-file sanitization and sandbox tests. |
| [tools/generate-foundation-spec.js](../tools/generate-foundation-spec.js) | Generates the current foundation Markdown specification from schemas. |
| [tools/validate-foundation.js](../tools/validate-foundation.js) | Validates foundation and current authorization; optional complete-authorization check. |
| [tools/validate-model.js](../tools/validate-model.js) | Foundation schema compilation and semantic/reference/date validation. |

There are 99 maintained files in this handover inventory. Update this map whenever files are introduced or retired. The JSON specification documents every foundation field; the storytelling reference documents every active editorial file.
