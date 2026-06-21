# Etap 2 — czysta struktura projektu webowego

## Cel

Przygotowanie stabilnego szkieletu aplikacji bez przenoszenia jeszcze logiki biznesowej. Kod z poprzedniego prototypu nie jest używany przez nowy punkt startowy.

## Założenia

- aplikacja działa jako statyczna strona bez procesu budowania;
- moduły JavaScript są ładowane jako ES Modules;
- nawigacja korzysta z hasha, więc działa na GitHub Pages bez reguł przekierowań;
- brak service workera i brak rejestracji PWA;
- brak zapisu danych w `localStorage`;
- brak atrap obliczeń SAG;
- każdy główny ekran ma osobny moduł.

## Struktura

```text
index.html
src/
  app/
    main.js
    router.js
    routes.js
  components/
    layout/
      app-shell.js
    navigation/
      bottom-navigation.js
    ui/
      stage-card.js
  models/
    index.js
  services/
    index.js
  stores/
    index.js
  styles/
    index.css
    tokens.css
    base.css
    layout.css
    components.css
  utils/
    dom.js
  views/
    measurement/
      measurement-view.js
    history/
      history-view.js
    journal/
      journal-view.js
    more/
      more-view.js
tests/
  README.md
docs/
  ETAP_1_MAPA_APLIKACJI_NATYWNEJ.md
  ETAP_2_STRUKTURA_PROJEKTU.md
```

## Odpowiedzialności

### `src/app`

Uruchomienie aplikacji, definicje tras i zmiana aktywnego widoku. Ten katalog nie powinien zawierać logiki kalkulatora ani trwałego zapisu.

### `src/components`

Elementy wielokrotnego użytku niezależne od konkretnego ekranu, np. powłoka aplikacji i dolna nawigacja.

### `src/views`

Kompozycja ekranów. Każdy główny ekran ma własny katalog. Widok nie powinien bezpośrednio korzystać z IndexedDB ani implementować wzorów SAG.

### `src/models`

Modele domenowe przeniesione ze SwiftUI. Zostaną dodane w etapie 3.

### `src/services`

Czysta logika biznesowa, walidacja, kalkulator, filtry oraz import/eksport.

### `src/stores`

Stan i trwałe magazyny danych. IndexedDB zostanie dodane w etapie 5.

### `src/styles`

Oddzielone tokeny, style bazowe, układ oraz komponenty. Brak stylów wpisanych bezpośrednio do JavaScriptu.

### `src/utils`

Małe funkcje techniczne bez logiki domenowej.

## Nawigacja

Obsługiwane trasy:

- `#/measurement`,
- `#/history`,
- `#/journal`,
- `#/more`.

Nieznana lub pusta trasa prowadzi do Pomiaru.

## Kryteria wykonania

- `index.html` ładuje wyłącznie nowy moduł `src/app/main.js`;
- cztery zakładki mają osobne widoki;
- dolna nawigacja zmienia trasę i aktywny stan;
- każdy widok ma nagłówek i semantyczną sekcję;
- błąd startu aplikacji pokazuje czytelny komunikat;
- nie ma rejestracji service workera;
- nowa struktura nie importuje starych plików `app.js`, `styles.css` ani `components.css` z katalogu głównego;
- logika biznesowa nie została przedwcześnie skopiowana do widoków.

## Uruchomienie lokalne

Moduły ES nie powinny być otwierane przez `file://`. W katalogu projektu należy uruchomić prosty serwer HTTP, np.:

```bash
python3 -m http.server 8080
```

Następnie otworzyć:

```text
http://localhost:8080/#/measurement
```

## Następny etap

Etap 3 doda modele, kalkulator SAG, parser polskich liczb, walidację oraz testy jednostkowe. Interfejs pozostanie nadal prosty, dopóki logika nie będzie przetestowana.
