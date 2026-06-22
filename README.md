# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 6: kompletna Historia pomiarów.

Na tej gałęzi działają obecnie:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- kalkulator SAG, walidacja i parser polskich liczb,
- kompletny ekran Pomiar,
- trwały zapis profili, pomiarów i wpisów Dziennika w IndexedDB,
- wersjonowany schemat bazy i migracje,
- kompletne profile rowerów,
- lista Historii połączona z trwałym magazynem,
- filtrowanie według roweru, „Bez profilu” i typu zawieszenia,
- sortowanie od najnowszych albo najstarszych,
- licznik wyników i czyszczenie filtrów,
- szczegóły pomiaru,
- edycja z pełnym ponownym przeliczeniem SAG,
- usuwanie pojedyncze i usuwanie całej Historii z potwierdzeniem,
- przekazanie pomiaru z Historii do szkicu wpisu Dziennika,
- awaryjny tryb sesyjny, gdy IndexedDB jest niedostępne,
- testy jednostkowe oraz workflow GitHub Actions.

Profile rowerów są dostępne w zakładce `Więcej`. Pełny interfejs Dziennika powstanie w etapie 7. PWA i service worker pozostają wyłączone.

## Uruchomienie lokalne

Uruchom w katalogu projektu:

`python3 -m http.server 8080`

Następnie otwórz:

`http://localhost:8080/#/measurement`

Nie otwieraj pliku `index.html` bezpośrednio przez `file://`, ponieważ aplikacja używa modułów JavaScript.

## Testy

`npm test`

Automatyczne testy są skonfigurowane w `.github/workflows/web-tests.yml`.

## Dokumentacja etapów

- `docs/ETAP_1_MAPA_APLIKACJI_NATYWNEJ.md`
- `docs/ETAP_2_STRUKTURA_PROJEKTU.md`
- `docs/ETAP_3_MODELE_KALKULATOR_WALIDACJA.md`
- `docs/ETAP_4_EKRAN_POMIAR.md`
- `docs/ETAP_5_TRWALE_DANE_I_PROFILE.md`
- `docs/ETAP_6_HISTORIA_POMIAROW.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
