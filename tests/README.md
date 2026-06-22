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
- odrzucanie błędnego formatu, wersji i duplikatów,
- zabezpieczenie CSV przed formułami arkusza,
- atomowy import wszystkich kolekcji,
- odświeżenie store po imporcie,
- automatyczny rollback po błędzie,
- trwałość dodawania, edycji i usuwania danych,
- niezależność kopii zwracanych przez magazyn,
- poprawne ładowanie modułów Historii, Dziennika i Więcej,
- kodowanie danych użytkownika przed wstawieniem do HTML,
- odrzucanie brakujących i powtarzających się identyfikatorów.

W etapie 8 dodano 15 testów dotyczących wyglądu, kopii JSON, CSV, walidacji importu i rollbacku. Pełny zestaw `npm test` został uruchomiony przez GitHub Actions i zakończył się powodzeniem.

Workflow:

```text
.github/workflows/web-tests.yml
```

Kolejne poziomy:

- `integration/` — współpraca widoków z prawdziwym IndexedDB w przeglądarce,
- `e2e/` — pełne ścieżki użytkownika w Safari i na iPhonie.
