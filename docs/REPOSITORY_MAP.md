# Repository map

This is the current organisation of the maintained repository. [Current documentation](README.md) explains behavior and standards; [archived documentation](archived/README.md) records superseded activities without acting as instructions.

| Location | Responsibility |
| --- | --- |
| `data_foundation/` | Fifteen typed collections of world entities and technical definitions. |
| `data_storytelling/` | Nine root editorial JSON files, including the authorization decision index, plus immutable decision shards. |
| `data_storytelling/review_evidence/` | Supporting audits and proposal rationale; excluded from foundation discovery and authorization. |
| `data_calculation/` | Annual sales estimates and their authoring guide; outside foundation authorization. |
| `schemas/` | Current foundation schemas and shared technical/composition structures. |
| `schemas/calculation/` | Annual-sales structure; validated independently of foundation. |
| `schemas/storytelling/` | Authorization, feedback and problem-only discussion schemas. |
| `code/` | Native-module Timeline, Data browser and Changes confirm application. |
| `server/` | Authenticated GitHub reading, validation, feedback and authorization transactions. |
| `assets/` | Documentation viewer source, styles, images and ignored generated bundles. |
| `docs/` | Current application, editing, workflow and deployment guides. |
| `docs/data_model/` | Current model guide, reference rules, generated specification and storytelling contract. |
| `docs/archived/` | Historical storytelling reports, proposal packs, migrations and superseded guides, with a relocation index. |
| `archived_no_longer_valid/` | Earlier immutable model/source snapshots and checksum inventory. |
| `tools/` | Validation, schema-documentation generation and explicitly scoped audit/import tools. |
| `tests/` | Model, review, server, migration-evidence and browser checks. |

## Runtime entry points

- `index.html`, `code/index.html`: application entry/redirects.
- `code/timeline.html` and `timeline.js`: timeline, selection history and annotations; `timeline-layout.js`, `timeline-lanes.js` and `temporal.js` support display.
- `code/browser.html` and `browser.js`: browsing, filtering and batch record authorization.
- `code/changes-confirm.html` and `changes-confirm.js`: grouped JSON/detail comparisons, discussion findings, saved remarks, refinement feedback and authorization.
- `code/shared.js`, `compact-details.js`, `composition.js`: loading, references and versioned technical detail rendering.
- `code/model-contract.js`: schema version, dataset types, filenames and path helpers.
- `code/product-launches.js`: product launch validation and derived launched-product lists.
- `code/technology-specification.js`, `technical-specification.js`, `external-products.js`, `market-impacts.js`: narrative specifications, highlighted parameters, standards/product effects and semantic checks.
- `code/campaign-transition.js`: the remaining launch-validation bridge, not a legacy campaign schema or visual owner.
- `code/api-client.js`, `annotations.js`, `editorial.js`, `review-log.js`: saving connection, drafts, feedback and canonical client hashes. `code/review-log.js` remains a current hash helper despite its historical filename.
- `server/index.js`: HTTP API and static server; `server/model.js`: schema/graph validation and atomic transactions; `server/editorial.js`: revision/conflict handling; `server/github.js`: non-forced GitHub commits.
- `docs/viewer.html`, `assets/main.js`, `assets/style.css`: documentation viewer and navigation.

## Tools, configuration and verification

`tools/validate-model.js` validates schema references, dates and graph rules. `tools/validate-foundation.js` adds editorial validation and optional complete authorization checks. `tools/generate-foundation-spec.js` generates `docs/data_model/FOUNDATION_SPECIFICATION.md`. Import tools are deliberately scoped and guarded; do not run them to overwrite reviewed data.

`tools/validate-calculation.js` checks annual sales without authorization. `tools/validate-documentation.js` checks current guide links, contract/count assertions and viewer entries.

`tools/validate-catalogue.js` provides the optional strict product profile. `tools/verify-closeout-audit.js` and the migration verifiers target saved editorial cohorts; inspect their baseline before running them. Phase-specific `verify-catalogue-phase*.js` tools retain historical expectations and may reconstruct saved proposals or require their original pending cohort; they are not substitutes for current validation. Run only the audit tool applicable to the queue being reviewed.

`package.json` and `package-lock.json` define dependencies and commands. `playwright.config.cjs` configures browser tests and their local server. `Dockerfile`, `render.yaml` and `.dockerignore` configure deployment; `.gitignore` excludes generated assets, dependencies, test outputs and secrets. See the [editing guide](EDITING_GUIDE.md) for checks and [Render setup](RENDER_SETUP.md) for publication.

Current user-facing standards are linked from [docs/README.md](README.md). The [documentation relocation index](archived/relocation-index.json) records moved paths and source checksums. Archived paths and proposal statuses describe their recorded snapshots; current truth comes from the live files and schemas.
