# Aion Logix — pracownia dokumentacji

Statyczna witryna do przeglądania modelu danych i prototypów. Stroną startową są zasady modelu. Aplikacja nie zmienia danych i nie zapisuje otwartych plików na serwerze.

## Uruchomienie

W katalogu repozytorium, przy użyciu Node.js 24 i Pythona 3:

```sh
npm ci
npm run build
npm run start
```

Otwórz port 8000 w swojej przeglądarce. Witryna wymaga HTTP: otwieranie `index.html` bezpośrednio z dysku nie obsługuje pobierania dokumentów. Zależności są dołączane podczas budowania; działająca witryna nie wymaga CDN.

## Dostępne widoki

- **Markdown:** formatowany tekst, tabele i diagramy w blokach `mermaid`.
- **HTML/JS:** działający, samodzielny prototyp w ramce.
- **JSON:** rozwijane drzewo obiektów i list.
- **Kod źródłowy:** pełna treść wybranego pliku.

Przycisk wyboru pliku pozwala otworzyć lokalne pliki MD, HTML, JS i JSON bez wysyłania ich na serwer. Samodzielny plik JS może tworzyć elementy przez `document`; sam `console.log` nie tworzy widocznego podglądu.

Markdown jest oczyszczany z aktywnego HTML. Prototypy działają w `iframe` z `sandbox="allow-scripts"`, bez uprawnień do originu witryny. Polityka CSP blokuje połączenia sieciowe, formularze i zewnętrzne zasoby: CSS i JS muszą znajdować się wewnątrz pliku HTML, a obrazy mogą korzystać z adresów `data:`. Otwarcie pojedynczego lokalnego pliku nie udostępnia plików z jego sąsiedniego katalogu. Ramka nie chroni przed skryptem zużywającym nadmiernie CPU — uruchamiaj znane prototypy.

## Rozbudowa

Lista dokumentów znajduje się w `assets/main.js` w tablicy `entries`. Dodaj plik i wpis z unikalnym `id`, tytułem, względną ścieżką oraz typem `md`, `json` lub `html`, następnie przebuduj witrynę. Linki nawigacji zachowują wybór w adresie strony.

## Testy

```sh
npx playwright install chromium
npm test
```

W tym środowisku Chromium jest już dostępne: uruchom `CHROMIUM_PATH=/usr/bin/chromium npm test`, bez pobierania przeglądarki. Jeśli domyślny katalog cache npm jest niezapisywalny, użyj `npm ci --cache /tmp/aion-npm-cache`.

Testy uruchamiają własny serwer HTTP i sprawdzają Markdown, Mermaid, interakcje prototypu, JSON oraz lokalne pliki.

## Publikacja

Po `npm ci` i `npm run build` witrynę można opublikować na hostingu statycznym, np. GitHub Pages. Artefakt publikacji powinien zawierać `index.html`, `assets/app.js`, `assets/chunks/`, `assets/style.css`, `examples/`, `docs/`, `README.md` oraz `DATA_MODEL_PRINCIPLES.md`. Ścieżki względne wspierają publikację w podkatalogu repozytorium. Publikacja nie została jeszcze skonfigurowana ani wykonana.

## Phase-1 data schemas

The current design is documented in [SCHEMA_DESIGN.md](docs/data-model/SCHEMA_DESIGN.md), with a [field reference](docs/data-model/FIELD_REFERENCE.md). Run `npm run validate:model` and `npm run test:model`. The linked DRI fixture under `examples/phase-1/` is pending author confirmation and is not live migrated data. `node tools/validate-model.js examples/phase-1 --complete` intentionally fails until review is complete.

## Migrated phase-1 story

The `data/` directory contains the phase-1 migration draft from the pinned `vs_edu1` snapshot. Review [MIGRATION_REPORT.md](docs/data-model/MIGRATION_REPORT.md) for source coverage, extracted entities, deferred later-phase data and unresolved issues. The viewer includes every dataset.

Run `npm run validate:data` and `npm run test:migration`. The stricter command `node tools/validate-model.js data --complete` intentionally fails while author confirmation and reconciliation remain pending. Do not treat this as a broken structural migration.

`migration/migrate_phase1.py` recreates the draft in a **fresh** directory; it must not overwrite author edits. `migration/audit_phase1.py` verifies provenance pointers and documented source dispositions against the pinned legacy checkout. Neither script modifies the source repository or recalculates financial forecasts.

When publishing the viewer, include `data/` as well as the documentation and existing assets.

## Story application

Open [`docs/index.html`](docs/index.html) through the repository HTTP server to enter the new light-theme application. The root page remains the documentation viewer. `docs/index.hml` is also supplied as a redirect alias.

- **Timeline:** events, processes and campaigns on one shared axis, with content-sized years and horizontal year boundaries across duration spans. Filter by text, record type, confirmation status, actor and year range. Undated records appear separately. Campaign ranges inferred from linked activities are labelled; they do not change the source records. Expand a year's ongoing list to select overlapping spans.
- **Data browser:** all 15 datasets, sortable record/dataset/status/date columns, 75-row pagination, and text/dataset/kind/status/actor filters. Select a row to inspect every field, raw JSON, provenance and linked records. Reference buttons open the related record.
- Drag either divider or focus it and use arrow keys (Home/End for limits). Width preferences persist in the browser. Narrow screens stack the panes. Record links preserve selection in the URL.

These pages fetch the current `data/*.json` files and require no build step or external libraries. Serve the repository root, not `docs/` alone, so relative data paths resolve. Include both `docs/` and `data/` when deploying to static hosting. They are read-only: confirmation and editing workflows remain in the source data.

`npm test` also checks timeline filters and spans, browser sorting and linked records, pagination, adjustable panes, mobile overflow, navigation and failed data requests.

## Author confirmations and proposed changes

The [Changes confirm page](docs/changes-confirm.html) contains before/after story proposals and separately approvable schema extensions. Select proposals, download an approval log and return it in chat. The data browser's right-hand details panel also lets you approve changing the current record to `confirmed` and download a separate confirmation log. Selections persist in the browser; content changes invalidate stale selections. These pages collect decisions for review and do not write to GitHub directly.

See [the review workflow](docs/review/README.md) for approval semantics, schema proposals, remaining questions and import checks. Include `schemas/` when publishing the application: the review page checks proposed extensions against the current schema files.
