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
- zachowanie danych po ponownym utworzeniu store,
- zachowanie pomiarów po usunięciu profilu,
- migrację starszych danych z `localStorage`,
- synchronizację profili z ekranem Pomiar,
- kodowanie danych użytkownika przed wstawieniem do HTML.

W etapie 5 dodano 21 testów dotyczących profili, magazynów, migracji i bezpieczeństwa renderowania. Pełny zestaw `npm test` został uruchomiony przez GitHub Actions i zakończył się powodzeniem.

Workflow:

```text
.github/workflows/web-tests.yml
```

Kolejne poziomy:

- `integration/` — współpraca widoków z trwałymi magazynami danych w prawdziwym IndexedDB,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
