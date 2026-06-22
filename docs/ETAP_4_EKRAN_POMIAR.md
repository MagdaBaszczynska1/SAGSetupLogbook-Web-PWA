# Etap 4 — ekran Pomiar

## Cel

Połączenie modeli, kalkulatora i walidacji z działającym ekranem Pomiar. Kod odtwarza przepływ aplikacji SwiftUI, ale nie dodaje jeszcze trwałej bazy IndexedDB.

## Zrealizowane funkcje

### Konfiguracja

- wybór „Bez profilu” albo profilu testowego;
- przełączanie Widelec/Damper;
- osobny skok, cel SAG i ciśnienie dla obu typów;
- reset ugięcia i ukrycie wyniku po zmianie kontekstu;
- informacja, czy skok pochodzi z profilu.

### Skok i ugięcie

- osobne okno edycji skoku;
- właściwe zakresy i kroki;
- przyciski minus/plus;
- suwak ugięcia od 0 do pełnego skoku;
- krok 1 mm dla widelca i 0,5 mm dla dampera;
- dynamiczna skala;
- wynik dopiero po świadomej zmianie ugięcia.

### Docelowy SAG

- 20%, 25%, 30% i „Inny”;
- własny suwak 10–40%;
- domyślnie 25% dla widelca i 30% dla dampera;
- osobne okno pomocy.

### Dodatkowe dane

- zwijana sekcja;
- opcjonalne ciśnienie;
- 30–200 PSI dla widelca;
- 50–400 PSI dla dampera;
- brak reboundu i notatek, ponieważ nie występują w aktualnym kalkulatorze natywnym.

### Wynik

Ekran pokazuje:

- aktualny SAG;
- cel;
- interpretację wyniku;
- docelowe ugięcie;
- różnicę w punktach procentowych i milimetrach.

### Reset, pomoc i zapis

- reset z potwierdzeniem;
- instrukcja pomiaru w siedmiu krokach;
- stany zapisu: niedostępny, gotowy, zapisywanie, zapisany;
- blokowanie ponownego zapisu identycznych danych;
- ponowne uaktywnienie zapisu po zmianie wartości.

## Magazyn tymczasowy

Etap 4 korzysta z `temporaryMeasurementStore`:

- zapis jest rzeczywisty w bieżącej sesji;
- pomiary pozostają podczas przechodzenia między zakładkami;
- znikają po pełnym przeładowaniu strony;
- w etapie 5 magazyn zostanie zastąpiony IndexedDB.

Dostępne są dwa profile testowe: Trek — Slash 8 oraz Rower testowy — Hardtail. Zostaną usunięte po dodaniu prawdziwego magazynu profili.

## Dostępność

- semantyczne sekcje i nagłówki;
- etykiety suwaków i pól;
- `aria-pressed` dla wyborów;
- `aria-expanded` dla dodatkowych danych;
- komunikaty błędów z `role="alert"`;
- interpretacja z `role="status"`;
- cele dotykowe co najmniej 48 px;
- obsługa klawiatury i widoczny focus.

## Pliki

```text
src/views/measurement/
  measurement-view.js
  measurement-controller.js
  measurement-configuration.js
  measurement-controls.js
  measurement-result-card.js
  measurement-save-bar.js
  measurement-render.js
  measurement-events.js
  measurement-travel-dialog.js
  measurement-help-dialogs.js
  measurement-confirmation-dialogs.js

src/stores/
  stage4-demo-data.js
  temporary-measurement-store.js

src/styles/
  measurement-base.css
  measurement-controls.css
  measurement-actions.css
```

## Testy

Dodano 10 testów kontrolera Pomiaru. Obejmują profil, Widelec/Damper, suwaki, cel, ciśnienie, reset, zapis i ochronę przed duplikatem.

Wynik lokalnego uruchomienia nowych testów:

```text
10 zaliczonych
0 niezaliczonych
```

## Ograniczenia

- brak trwałości po przeładowaniu;
- Historia nie korzysta jeszcze z magazynu;
- profile są tylko testowe;
- formularz Dziennika powstanie w etapie 7;
- brak service workera i PWA;
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 5 doda IndexedDB, migracje, trwałe profile rowerów i trwałe pomiary.
