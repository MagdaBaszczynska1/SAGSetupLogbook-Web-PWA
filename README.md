# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Wierne przeniesienie aplikacji natywnej zostało przygotowane na gałęzi `rebuild-from-ios-source` jako wersja `1.0.0-rc.1`.

## Status

Etap 10: końcowy audyt i release candidate.

Gotowe są:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- kalkulator SAG, walidacja i parser polskich liczb,
- kompletny ekran Pomiar,
- trwały zapis profili, pomiarów i wpisów Dziennika w IndexedDB,
- wersjonowany schemat bazy i migracje,
- kompletne profile rowerów,
- kompletna Historia pomiarów,
- kompletny Dziennik jazd,
- poradnik, prywatność i wygląd jasny, ciemny oraz systemowy,
- pełny eksport JSON i raport CSV,
- walidowany import JSON z kopią ratunkową oraz rollbackiem,
- manifest instalacyjny PWA,
- ikony zwykłe, maskowalne i ikona iOS,
- instalacja przez natywny prompt albo instrukcję Safari,
- pełny app shell działający offline,
- wersjonowane cache i bezpieczne aktualizacje,
- migracja ze starego service workera,
- Content Security Policy i polityka `no-referrer`,
- testy jednostkowe,
- testy integracyjne i E2E w Chromium oraz WebKit/iPhone,
- automatyczny audyt WCAG 2.2 AA,
- test responsywności, klawiatury, IndexedDB, importu i offline,
- workflow GitHub Actions blokujące błędne wydanie.

Aktualne automatyczne kontrole `Web tests` i `Browser audit` zakończyły się powodzeniem. Przed publikacją produkcyjną zalecane jest jeszcze ręczne zatwierdzenie wyglądu i test na fizycznym iPhonie.

## Uruchomienie lokalne

Uruchom w katalogu projektu:

`python3 -m http.server 8080`

Następnie otwórz:

`http://localhost:8080/#/measurement`

Nie otwieraj pliku `index.html` bezpośrednio przez `file://`. Service worker działa wyłącznie w bezpiecznym kontekście HTTPS albo na `localhost`.

## Testy

Testy jednostkowe:

`npm test`

Testy integracyjne, E2E, dostępności i offline:

`npm run test:e2e`

Pełny zestaw:

`npm run test:all`

Workflow:

- `.github/workflows/web-tests.yml`
- `.github/workflows/browser-audit.yml`

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
- `docs/ETAP_10_AUDYT_I_TESTY_KONCOWE.md`

Gałąź `main` nadal pozostaje wersją opublikowaną. Pull request jest przygotowany do review i zalecanego scalenia metodą `Squash and merge` po ręcznej akceptacji właścicielki aplikacji.
