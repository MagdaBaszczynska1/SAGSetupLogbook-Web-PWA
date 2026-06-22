# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 9: kompletna Progressive Web App.

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
- pełny eksport JSON i raport CSV,
- walidowany import JSON z kopią ratunkową oraz rollbackiem,
- manifest instalacyjny PWA,
- ikony zwykłe, maskowalne i ikona dla ekranu początkowego iOS,
- instalacja przez natywny prompt albo instrukcję Safari,
- pełny app shell działający offline,
- wersjonowane cache i usuwanie starych cache,
- bezpieczna aktualizacja uruchamiana po decyzji użytkownika,
- jednorazowa migracja ze starego service workera bez trwałego zablokowania aplikacji,
- globalne komunikaty offline i dostępnej aktualizacji,
- awaryjny tryb sesyjny, gdy IndexedDB jest niedostępne,
- testy jednostkowe oraz workflow GitHub Actions.

Pełne testy E2E w mobilnym Safari i końcowy audyt pozostają do kolejnych etapów.

## Uruchomienie lokalne

Uruchom w katalogu projektu:

`python3 -m http.server 8080`

Następnie otwórz:

`http://localhost:8080/#/measurement`

Nie otwieraj pliku `index.html` bezpośrednio przez `file://`. Service worker działa wyłącznie w bezpiecznym kontekście HTTPS albo na `localhost`.

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
- `docs/ETAP_9_PWA_OFFLINE_AKTUALIZACJE.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki testy przeglądarkowe i końcowy audyt nie zostaną ukończone.
