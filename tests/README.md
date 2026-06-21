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
- reset, zapis oraz ochronę przed identycznym duplikatem.

W etapie 4 dodano 10 testów kontrolera Pomiaru. Zostały uruchomione lokalnie: 10 zaliczonych, 0 niezaliczonych.

Kolejne poziomy:

- `integration/` — współpraca widoków z trwałymi magazynami danych,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
