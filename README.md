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

Po `npm ci` i `npm run build` witrynę można opublikować na hostingu statycznym, np. GitHub Pages. Artefakt publikacji powinien zawierać `index.html`, `assets/app.js`, `assets/chunks/`, `assets/style.css`, `examples/`, `README.md` oraz `DATA_MODEL_PRINCIPLES.md`. Ścieżki względne wspierają publikację w podkatalogu repozytorium. Publikacja nie została jeszcze skonfigurowana ani wykonana.
