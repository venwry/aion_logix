# Aion Logix

A static story browser and timeline, with an authenticated review service that commits authorized changes to GitHub.

See the [development process with phase 1B](docs/MULTI_PHASE_PROCESS.md) for the agreed scope, iterative review cycle and recurring sales/ROI assessment.

## Directories

- `code/`: timeline, data browser and Changes confirm UI.
- `data_foundation/`: story-only records with stable IDs and no editorial status or provenance.
- `data_storytelling/`: authorization, proposed changes, decisions, sources and migration history.
- `data_calculation/`: reserved for calculation data.
- `schemas/`: current strict foundation schemas; `storytelling/` contains editorial schemas and `archive/` preserves the old contract.
- `server/`: authenticated GitHub writer, intended for Render Docker hosting.
- `docs/`: documentation viewer, model reference, deployment guide and historical review evidence.

## Read-only preview

```sh
npm ci
npm run build
npm run preview
```

Open `/` for the timeline, `/code/browser.html` for records, `/code/changes-confirm.html` for proposals, or `/docs/viewer.html` for documentation. Serve the repository root over HTTP.

## Authorize and save

See [Render setup](docs/RENDER_SETUP.md). The app uses a server-only GitHub credential and a separate backend access key. Saving updates the respective JSON files in one Git commit; no downloadable report is required. The GitHub credential never enters the browser.

Review comparisons are visible Subject / Before / After tables. Authorization and pending changes are joined to the story at display time. Missing or stale authorizations display **Unauthorized**.

Model **0.4.0** implements phase 1B: products, technologies, manufacturing capabilities and market responses, with events/processes carrying dates and campaigns linked to execution processes. See the [implementation and migration report](docs/data-model/PHASE_1B_IMPLEMENTATION.md).

## Foundation specification

See the [foundation dataset specification](docs/data-model/FOUNDATION_SPECIFICATION.md) for the complete hierarchical entity diagram, field constraints and cross-dataset reference catalogue. It is also available in the documentation viewer as **Foundation — entities and references**.

See also the [storytelling file reference](docs/data-model/STORYTELLING_FILE_REFERENCE.md) for authorization, proposals, sources and migration history.

## Model and review history

See [model principles](DATA_MODEL_PRINCIPLES.md), [the separation contract](docs/data-model/SEPARATION.md) and [the generated field reference](docs/data-model/FIELD_REFERENCE.md). The original October approval files and decisions remain in [review history](docs/review/history/2026-10-27/APPLICATION_REPORT.md).

Run `npm run validate:data` for foundation and external authorization validation. `node tools/validate-foundation.js --complete` additionally requires every current record to be authorized. Historical migration scripts describe the former contract and must not overwrite the separated datasets.

## Tests

```sh
node --test tests/model/*.test.js tests/migration/*.test.js tests/review/*.test.js tests/server/*.test.js
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Browser tests start their own HTTP server. Backend tests check authentication, origin checks, stale content, reference validity, grouped changes, idempotent saves and concurrent GitHub updates without writing to the live repository.

## GitHub Pages

Publish the repository root, including `code/`, `data_foundation/`, `data_storytelling/`, `schemas/`, `docs/`, root Markdown files and the built `assets/`. Only the documentation viewer requires `npm run build`; the story app uses native JavaScript modules. The Render backend is deployed separately. Static hosting alone cannot save JSON changes.
