# Aion Logix

A structured alternative-history project with technical product definitions, a timeline, a data browser and author-controlled review. The story is stored in JSON; application displays and documentation do not authorize it.

Start with the [current documentation](docs/README.md), [model principles](DATA_MODEL_PRINCIPLES.md), [reference rules](docs/data_model/REFERENCE_RULES.md) and [editing guide](docs/EDITING_GUIDE.md).

The current schema contract is **0.21.0**, with fifteen foundation datasets. The catalogue migration is accepted. The optional strict catalogue profile passes, while the runtime schema retains compatibility with earlier record shapes; see [catalogue validation](docs/data_model/CATALOGUE_VALIDATION.md). Live records, proposals, feedback and exact-content authorizations determine the current state; old phase reports do not.

| Layer | Location |
| --- | --- |
| World entities and technical definitions | `data_foundation/` |
| Author review, decisions, sources and evidence | `data_storytelling/` |
| Revisable annual sales estimates, outside foundation authorization | [`data_calculation/`](data_calculation/README.md) |
| Schemas, application and saving backend | `schemas/`, `code/`, `server/` |
| Current guides and model documentation | `docs/`, `docs/data_model/` |
| Historical documentation | [docs/archived](docs/archived/README.md) |
| Earlier immutable model/source evidence | [archived_no_longer_valid](archived_no_longer_valid/README.md) |

The [repository map](docs/REPOSITORY_MAP.md) explains runtime entry points and supporting files.

```sh
npm ci
npm run build
npm run preview
```

Serve the repository root over HTTP. Open `/` for Timeline, `/code/browser.html` for Data browser, `/code/product-catalog.html` for Product Catalog, `/code/changes-confirm.html` for concrete proposals and discussion entries, or `/docs/viewer.html` for documentation. The documentation viewer requires generated assets; story pages use native JavaScript modules.

The [application guide](docs/APPLICATION_GUIDE.md) explains navigation, annotations, comparisons and saving. [Render setup](docs/RENDER_SETUP.md) explains the GitHub saving service and static publication. The backend holds the GitHub credential; the browser uses a separate access key. Tests simulate transactions and never authorize live data.

```sh
npm run validate:data
npm run validate:catalogue
npm run validate:calculation
node --test tests/model/*.test.js tests/review/*.test.js tests/server/*.test.js
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Run migration-evidence checks when changing archives or migration logic. Follow the editing guide for validation of complete proposal groups and generated schema documentation.

[Manufacturing costs](code/manufacturing-costs.html) compares all internal offerings at June/December snapshots from 1978 through 1983, in nominal dollars for each date. The [calculation guide](data_calculation/MANUFACTURING_COSTS.md) documents assumptions, yield inputs and regeneration; estimates do not require authorization.
