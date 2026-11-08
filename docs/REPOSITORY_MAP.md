# Repository map

This is the current organisation of the maintained repository. [Current documentation](README.md) explains behavior and standards; [archived documentation](archived/README.md) records superseded activities without acting as instructions.

| Location | Responsibility |
| --- | --- |
| `data_foundation/` | Sixteen typed collections of world entities and technical definitions. |
| `data_storytelling/` | Eight root editorial files: authorization, decisions, proposals, manifest, annotations, change reviews, sources and issues. |
| `data_storytelling/review_evidence/` | Supporting audits and proposal rationale; excluded from foundation discovery and authorization. |
| `data_calculation/` | Reserved for separately designed derived assessments. |
| `schemas/` | Current foundation schemas and shared technical/composition structures. |
| `schemas/storytelling/` | Authorization and feedback schemas. |
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
- `code/changes-confirm.html` and `changes-confirm.js`: grouped JSON/detail comparisons, selection, refinement feedback and authorization.
- `code/shared.js`, `compact-details.js`, `composition.js`: loading, references and versioned technical detail rendering.
- `code/model-contract.js`: schema version, dataset types, filenames and path helpers.
- `code/product-launches.js`: validation of populated product launch relationships.
- `code/api-client.js`, `annotations.js`, `editorial.js`, `review-log.js`: saving connection, drafts, feedback and canonical client hashes. `code/review-log.js` remains a current hash helper despite its historical filename.
- `server/index.js`: HTTP API and static server; `server/model.js`: schema/graph validation and atomic transactions; `server/editorial.js`: revision/conflict handling; `server/github.js`: non-forced GitHub commits.
- `docs/viewer.html`, `assets/main.js`, `assets/style.css`: documentation viewer and navigation.

## Tools, configuration and verification

`tools/validate-model.js` validates schema references, dates and graph rules. `tools/validate-foundation.js` adds editorial validation and optional complete authorization checks. `tools/generate-foundation-spec.js` generates `docs/data_model/FOUNDATION_SPECIFICATION.md`. Import tools are deliberately scoped and guarded; do not run them to overwrite reviewed data.

`tools/verify-catalogue-phase3.js` and `tools/verify-catalogue-phase4.js` are read-only audits of their respective catalogue proposal sets, using evidence under `data_storytelling/review_evidence/`. They simulate approval in memory against the recorded source baseline. The phase-4 audit also checks independent offering approvals and prerequisite-gated reverse-link cleanup. These tools require their complete proposal sets to remain pending; use the normal validators after those proposals are approved.

`package.json` and `package-lock.json` define dependencies and commands. `playwright.config.cjs` configures browser tests and their local server. `Dockerfile`, `render.yaml` and `.dockerignore` configure deployment; `.gitignore` excludes generated assets, dependencies, test outputs and secrets. See the [editing guide](EDITING_GUIDE.md) for checks and [Render setup](RENDER_SETUP.md) for publication.

Current user-facing standards are linked from [docs/README.md](README.md). The [documentation relocation index](archived/relocation-index.json) records moved paths and source checksums. Archived paths and proposal statuses describe their recorded snapshots; current truth comes from the live files and schemas.
