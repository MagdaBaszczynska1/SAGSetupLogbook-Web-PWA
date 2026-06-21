# SAG Setup Logbook — wersja webowa

To niezależna wersja webowa aplikacji iOS SAG Setup Logbook.

Prace nad wiernym przeniesieniem aplikacji natywnej odbywają się na gałęzi `rebuild-from-ios-source`.

## Aktualny etap

Etap 4: kompletny ekran Pomiar.

Na tej gałęzi działają obecnie:

- cztery główne trasy i dolna nawigacja,
- modele profilu roweru, pomiaru i Dziennika,
- parser polskich liczb,
- kalkulator SAG i walidacja,
- działający ekran Pomiar,
- wybór profilu oraz Widelec/Damper,
- edycja skoku,
- suwak i przyciski ugięcia,
- cele 20%, 25%, 30% i wartość własna,
- opcjonalne ciśnienie,
- automatyczny wynik i interpretacja,
- reset, pomoc i zapis bez identycznych duplikatów,
- testy jednostkowe logiki i kontrolera Pomiaru.

Pomiary są obecnie przechowywane tylko w pamięci bieżącej sesji. IndexedDB i prawdziwe profile rowerów zostaną dodane w etapie 5. PWA pozostaje wyłączone.

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
- `docs/ETAP_4_EKRAN_POMIAR.md`

Gałąź `main` pozostaje wersją opublikowaną. Gałąź przebudowy nie powinna zostać połączona z `main`, dopóki wszystkie funkcje i testy nie zostaną ukończone.
