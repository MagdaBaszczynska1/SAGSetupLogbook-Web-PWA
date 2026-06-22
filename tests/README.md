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
- wyszukiwanie i filtry Dziennika,
- sortowanie Dziennika,
- grupowanie kandydatów pomiarów,
- automatyczne sugerowanie pomiarów z dnia jazdy,
- ograniczenie do jednego pomiaru danego typu,
- granicę siedmiu dni dla pomiarów historycznych,
- walidację formularza wpisu,
- zachowanie snapshotów podczas edycji,
- potwierdzenie zapisu bez pomiaru po zmianie kontekstu,
- obsługę usuniętego profilu,
- lokalne daty kalendarzowe,
- trwałość dodawania, edycji i usuwania wpisów,
- niezależność kopii zwracanych przez magazyn,
- poprawne ładowanie modułów Dziennika,
- kodowanie danych użytkownika przed wstawieniem do HTML,
- odrzucanie brakujących i powtarzających się identyfikatorów.

W etapie 7 dodano 36 testów dotyczących Dziennika, wyboru pomiarów, dat, snapshotów i trwałości operacji. Pełny zestaw `npm test` został uruchomiony przez GitHub Actions i zakończył się powodzeniem.

Workflow:

```text
.github/workflows/web-tests.yml
```

Kolejne poziomy:

- `integration/` — współpraca widoków z prawdziwym IndexedDB w przeglądarce,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
