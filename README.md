# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 7: kompletny Dziennik jazd.

Na tej gałęzi działają obecnie:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- kalkulator SAG, walidacja i parser polskich liczb,
- kompletny ekran Pomiar,
- trwały zapis profili, pomiarów i wpisów Dziennika w IndexedDB,
- wersjonowany schemat bazy i migracje,
- kompletne profile rowerów,
- kompletna Historia pomiarów,
- lista Dziennika połączona z trwałym magazynem,
- wyszukiwanie po trasie, rowerze, notatce i warunkach,
- filtrowanie według roweru i warunków,
- sortowanie od najnowszych, najstarszych albo najwyżej ocenionych,
- dodawanie i edycja wpisów,
- wybór maksymalnie jednego pomiaru widelca i jednego dampera,
- automatyczne sugerowanie pomiarów tego roweru z dnia jazdy,
- kandydaci historyczni z poprzednich siedmiu dni oraz pomiary bez profilu,
- historyczne snapshoty profilu i pomiarów,
- szczegóły wpisu, edycja i usuwanie,
- potwierdzenie zapisu bez pomiaru po zmianie roweru lub dnia jazdy,
- przekazanie dokładnego pomiaru z Historii do nowego wpisu,
- awaryjny tryb sesyjny, gdy IndexedDB jest niedostępne,
- testy jednostkowe oraz workflow GitHub Actions.

PWA, service worker, kompletne Ustawienia oraz eksport i import danych pozostają wyłączone do kolejnych etapów.

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
- `docs/ETAP_7_DZIENNIK_JAZD.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
