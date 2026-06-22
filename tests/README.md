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
- synchronizację profili z ekranem Pomiar.

W etapie 5 dodano 20 testów dotyczących profili, magazynów i migracji. Repozytorium zawiera workflow `.github/workflows/web-tests.yml`, który uruchamia cały zestaw przez `npm test` przy zmianach na gałęzi przebudowy i w pull requestach.

Kolejne poziomy:

- `integration/` — współpraca widoków z trwałymi magazynami danych w prawdziwym IndexedDB,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
