# Aion Logix — an alternative history

This repository develops a coherent alternative history of a time traveller who arrives on **1 January 1972** and progressively builds a computer-industry empire. His knowledge of future demand helps him introduce ideas, products and standards years ahead of their historical dates. We follow the affected world's linear history through the end of the 1980s, rather than tracking time-travel jumps.

The story is modelled in interconnected JSON datasets. A timeline and data browser let the author explore and authorize that account. Author-approved story facts take precedence over real-world history within this fictional setting. Imported or inferred content remains pending until the author accepts the entire record.

## Start here

1. Read the [modeling principles](DATA_MODEL_PRINCIPLES.md) and [model guide](docs/data-model/MODEL_GUIDE.md).
2. Follow the [editing guide](docs/EDITING_GUIDE.md), including whole-record authorization, schema approval and validation.
3. Consult the [complete schema specification and diagram](docs/data-model/FOUNDATION_SPECIFICATION.md) for fields and relationships.
4. Use the [multi-phase process](docs/MULTI_PHASE_PROCESS.md) and [current review backlog](docs/REVIEW_BACKLOG.md) to continue the work.

The current contract is **0.4.0**. The handover baseline contains 13 foundation datasets and 653 records (54 authorized, 599 pending). These are dated inventory counts, not a completed story. Product composition, quantitative fabrication economics, later ecosystem work and overall economics remain for phases 2–5. Sales, market coverage and ROI will be separately reassessed whenever the foundational story changes.

## Repository contents

| Directory or file | Purpose |
| --- | --- |
| `data_foundation/` | Story-only entities: people, agreements, events, processes, marketing, products, technologies and responses. |
| `data_storytelling/` | Current authorization, proposals, source catalogue and unresolved editorial issues. See the [file reference](docs/data-model/STORYTELLING_FILE_REFERENCE.md). |
| `data_calculation/` | Reserved for future derived assessments; currently empty. |
| `schemas/` | Strict current JSON Schemas for story data and authorization. |
| `code/` | Timeline, browser and Changes confirm application. |
| `assets/` | Documentation viewer source, stylesheet and locally generated bundles. |
| `server/` | Authenticated service that validates and commits author decisions to GitHub. |
| `docs/` | Current model, editing, process, deployment and handover documentation. |
| `tools/` | Current validation and schema-documentation generation. |
| `tests/` | Model, migration-evidence, authorization and browser regression checks. |
| `archived_no_longer_valid/` | Earlier models, migrations and review evidence; not current instructions. See its [archive index](archived_no_longer_valid/README.md). |
| Root configuration | Entry page, package/build/test configuration, Docker and Render deployment. |

The [repository map](docs/REPOSITORY_MAP.md) documents **every maintained file**, including root configuration, and links to the archive's complete file inventory.

## Run and review

```sh
npm ci
npm run build
npm run preview
```

Open `/` for the timeline, `/code/browser.html` for data, `/code/changes-confirm.html` for proposed changes, or `/docs/viewer.html` for documentation. Serve the repository root over HTTP. The documentation viewer needs generated assets; the story pages use native JavaScript modules.

For direct saving, follow [GitHub Pages and Render setup](docs/RENDER_SETUP.md). The backend holds the GitHub credential. The browser uses a separate backend access key. Selecting records and pressing **Authorize and save** writes one Git commit; downloading approval logs is a retired workflow.

```sh
npm run validate:data
node --test tests/model/*.test.js tests/migration/*.test.js tests/review/*.test.js tests/server/*.test.js
CHROMIUM_PATH=/usr/bin/chromium npm test
```

Set `CHROMIUM_PATH` to an installed Chromium executable, or install Playwright's browser. Browser tests start a local HTTP server. Tests do not authorize live story records. See the editing guide for documentation checks and completeness validation.

## Timeline presentation

Dated processes occupy boxes from their start to end, with parallel work beside them. Explicit parent-process links and step references place events/sub-processes inside their owner; campaigns share one box with their execution process. The Campaign and Process labels select either record independently. Mixed authorization means the two records have different authorization states.

Years expand with content. Horizontal scrolling reveals parallel work; year lines pass behind process boxes. Filters preserve linked context using dashed borders. Undated work remains in a separate section, and a child outside its parent's stated dates stays separate rather than changing either date. When a record has multiple memberships, explicit parent links take precedence, then campaign steps, other process steps, and event process references; equal-priority ties use stable IDs. Details retain all relationships. The timeline and browser share compact details, with reference labels shown as `id - Name`.

The timeline toolbar includes **Full screen**, which hides navigation, service connection, title and filters while keeping the details and timeline panes. Press **Exit full screen** or Escape to restore them. A vertical date axis preserves chronological order with compact, non-proportional spacing. Process start dates appear at the top and end dates at the bottom; date precision is retained. All pages use an AION A emblem as their browser/favorites icon.
