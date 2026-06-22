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
- Widelec/Damper, suwaki, presety celu i ciśnienie,
- reset, zapis oraz ochronę przed identycznym duplikatem,
- walidację formularza profilu roweru,
- CRUD trwałych magazynów,
- migrację starszych danych z `localStorage`,
- filtrowanie Historii po rowerze, „Bez profilu” i zawieszeniu,
- sortowanie Historii,
- historyczne opcje rowerów,
- walidację i pełne przeliczanie edytowanego pomiaru,
- zachowanie ID, daty i snapshotu roweru podczas edycji,
- trwałość edycji oraz usuwania pomiarów,
- przekazywanie kopii pomiaru do szkicu Dziennika,
- kodowanie danych użytkownika przed wstawieniem do HTML,
- odrzucanie brakujących i powtarzających się identyfikatorów,
- poprawne ładowanie modułów Historii.

W etapie 6 dodano 19 testów dotyczących zapytań Historii, edycji, trwałości operacji i integracji modułów. Pełny zestaw `npm test` jest uruchamiany przez GitHub Actions.

Workflow:

```text
.github/workflows/web-tests.yml
```

Kolejne poziomy:

- `integration/` — współpraca widoków z prawdziwym IndexedDB w przeglądarce,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
