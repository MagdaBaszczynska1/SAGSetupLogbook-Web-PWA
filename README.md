# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 5: trwałe magazyny danych i kompletna obsługa profili rowerów.

Na tej gałęzi działają obecnie:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- kalkulator SAG, walidacja i parser polskich liczb,
- kompletny ekran Pomiar,
- trwały zapis profili, pomiarów i wpisów Dziennika w IndexedDB,
- wersjonowany schemat bazy i migracje,
- migracja danych starszego prototypu z `localStorage`,
- dodawanie, edycja, szczegóły i usuwanie profili rowerów,
- osobne ustawienia widelca i dampera,
- zachowanie pomiarów po usunięciu profilu,
- automatyczna synchronizacja profili z ekranem Pomiar,
- awaryjny tryb sesyjny, gdy IndexedDB jest niedostępne,
- testy jednostkowe oraz workflow GitHub Actions.

Profile rowerów są dostępne w zakładce `Więcej`. Historia i Dziennik korzystają już z trwałych magazynów, ale ich kompletne interfejsy powstaną w kolejnych etapach. PWA i service worker pozostają wyłączone.

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

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
