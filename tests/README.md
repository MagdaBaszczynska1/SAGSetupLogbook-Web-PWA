# Testy wersji webowej

Projekt korzysta z wbudowanego test runnera Node.js.

Uruchomienie:

```bash
npm test
```

Aktualne testy jednostkowe obejmują:

- parser polskich liczb,
- walidację pól kalkulatora,
- wzory i interpretację SAG,
- zakresy oraz kroki suwaków,
- uzupełnianie danych z profilu roweru,
- stan obliczenia na żywo i przycisku zapisu,
- modele profilu, pomiaru i Dziennika,
- snapshoty historyczne oraz status powiązania pomiaru,
- kontroler ekranu Pomiar,
- profile rowerów i trwałe magazyny,
- migrację starszych danych z `localStorage`,
- kompletną Historię pomiarów,
- kompletny Dziennik jazd,
- lokalne daty kalendarzowe,
- wygląd systemowy, jasny i ciemny,
- zapis ustawień w `localStorage`,
- pełną walidację kopii JSON,
- ponowne przeliczanie wyników SAG podczas importu,
- zabezpieczenie CSV przed formułami arkusza,
- atomowy import i automatyczny rollback,
- manifest oraz ścieżki ikon PWA,
- rejestrację service workera ze scope aplikacji,
- natywny prompt instalacyjny,
- wykrywanie online i offline,
- oczekującą aktualizację i świadome `skipWaiting`,
- kompletność listy precache,
- instalację app shell bez automatycznego przejmowania zwykłych aktualizacji,
- czyszczenie starych cache,
- odpowiedź nawigacyjną offline,
- trwałość dodawania, edycji i usuwania danych,
- niezależność kopii zwracanych przez magazyn,
- poprawne ładowanie modułów Historii, Dziennika i Więcej,
- kodowanie danych użytkownika przed wstawieniem do HTML,
- odrzucanie brakujących i powtarzających się identyfikatorów.

W etapie 9 dodano 13 testów dotyczących manifestu, instalacji, app shell, trybu offline i kontrolowanej aktualizacji. Pełny zestaw `npm test` jest uruchamiany przez GitHub Actions.

Workflow:

```text
.github/workflows/web-tests.yml
```

Kolejne poziomy:

- `integration/` — prawdziwy Cache Storage, service worker i IndexedDB w przeglądarce,
- `e2e/` — instalacja, offline i aktualizacja w Safari oraz na iPhonie.
