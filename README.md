# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 8: kompletne Więcej i Ustawienia.

Na tej gałęzi działają obecnie:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- kalkulator SAG, walidacja i parser polskich liczb,
- kompletny ekran Pomiar,
- trwały zapis profili, pomiarów i wpisów Dziennika w IndexedDB,
- wersjonowany schemat bazy i migracje,
- kompletne profile rowerów,
- kompletna Historia pomiarów,
- kompletny Dziennik jazd,
- ekran Więcej z poradnikiem i informacjami o prywatności,
- wygląd systemowy, jasny i ciemny zapisywany lokalnie,
- pełny eksport JSON,
- raport CSV zabezpieczony przed formułami arkusza,
- import JSON z walidacją całego pliku przed zapisem,
- kopia ratunkowa pobierana przed importem,
- atomowe zastępowanie kolekcji i automatyczny rollback po błędzie,
- odświeżenie wszystkich magazynów po imporcie,
- awaryjny tryb sesyjny, gdy IndexedDB jest niedostępne,
- testy jednostkowe oraz workflow GitHub Actions.

PWA, service worker, pełne testy przeglądarkowe i końcowy audyt pozostają do kolejnych etapów.

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
- `docs/ETAP_8_WIECEJ_USTAWIENIA_KOPIE.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
