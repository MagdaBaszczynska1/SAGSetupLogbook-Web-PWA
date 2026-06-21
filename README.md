# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 3: modele, kalkulator SAG, walidacja i testy jednostkowe.

Na tej gałęzi działają obecnie:

- punkt startowy aplikacji,
- cztery główne trasy,
- dolna nawigacja,
- osobne moduły widoków,
- podstawowy system stylów,
- modele profilu roweru, pomiaru i Dziennika,
- parser polskich liczb,
- kompletna logika kalkulatora SAG,
- walidacja i konfiguracja suwaków,
- 32 testy jednostkowe.

Logika nie jest jeszcze podłączona do pełnego ekranu Pomiar. Magazyny danych i PWA zostaną dodane w kolejnych etapach.

## Uruchomienie lokalne

Uruchom w katalogu projektu:

`python3 -m http.server 8080`

Następnie otwórz:

`http://localhost:8080/#/measurement`

Nie otwieraj pliku `index.html` bezpośrednio przez `file://`, ponieważ aplikacja używa modułów JavaScript.

## Testy

`npm test`

## Dokumentacja etapów

- `docs/ETAP_1_MAPA_APLIKACJI_NATYWNEJ.md`
- `docs/ETAP_2_STRUKTURA_PROJEKTU.md`
- `docs/ETAP_3_MODELE_KALKULATOR_WALIDACJA.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
