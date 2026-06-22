# Etap 5 — trwałe dane i profile rowerów

## Cel

Zastąpienie danych testowych oraz magazynu sesyjnego trwałą bazą IndexedDB. Etap obejmuje również kompletną obsługę profili rowerów i połączenie ich z ekranem Pomiar.

## Trwałe magazyny

Aplikacja ma trzy niezależne magazyny domenowe:

- `bikes` — profile rowerów,
- `measurements` — pomiary SAG,
- `rides` — wpisy Dziennika.

Dodatkowy magazyn `meta` przechowuje informacje techniczne, np. stan migracji.

Pliki:

```text
src/persistence/indexed-db.js
src/persistence/memory-database.js
src/persistence/legacy-migration.js
src/stores/observable-store.js
src/stores/bike-store.js
src/stores/measurement-store.js
src/stores/ride-journal-store.js
src/app/data-context.js
```

## IndexedDB

Nazwa bazy:

```text
sag-setup-logbook-web
```

Aktualna wersja schematu:

```text
2
```

### Migracja schematu 1

Tworzy magazyny:

- `bikes`,
- `measurements`,
- `rides`,
- `meta`.

Każdy magazyn domenowy używa pola `id` jako klucza. Magazyn techniczny używa pola `key`.

### Migracja schematu 2

Dodaje indeksy:

- profile: `createdAt`,
- pomiary: `date`, `bikeID`, `suspensionType`,
- Dziennik: `rideDate`, `bikeID`.

Kod wykonuje wszystkie brakujące migracje po kolei. Nowa instalacja przechodzi zarówno migrację 1, jak i 2.

## Bezpieczeństwo operacji

Zmiany są najpierw zapisywane do bazy. Stan widoczny w aplikacji jest aktualizowany dopiero po zakończeniu transakcji.

Dzięki temu błąd zapisu nie pozostawia w interfejsie danych, których faktycznie nie ma w bazie.

Dostępne operacje:

- odczyt całej kolekcji,
- dodawanie lub zapis rekordu,
- aktualizacja,
- usuwanie pojedynczego rekordu,
- usuwanie całej kolekcji,
- pełne zastąpienie kolekcji,
- atomowe zastąpienie kilku kolekcji w jednej transakcji.

Ostatnia operacja będzie wykorzystana podczas importu kopii zapasowej.

## Tryb awaryjny

Jeżeli przeglądarka blokuje IndexedDB, aplikacja uruchamia magazyn pamięciowy.

Użytkownik otrzymuje wyraźny komunikat, że dane znikną po zamknięciu karty. Kalkulator i profile nadal działają, ale aplikacja nie udaje, że zapis jest trwały.

Błąd migracji starszych danych nie wyłącza działającej bazy IndexedDB. Aplikacja zachowuje trwały magazyn i pokazuje komunikat o nieudanym przeniesieniu danych.

## Migracja starego prototypu

Przy pierwszym uruchomieniu sprawdzane są klucze:

```text
sagSetupLogbookWeb.v2
sagSetupLogbookWeb.v1
```

Migracja:

- działa tylko, gdy nowa baza nie zawiera jeszcze profili ani pomiarów,
- przenosi profile i pomiary,
- przelicza brakujące szczegóły wyniku SAG,
- ignoruje niepoprawne rekordy pomiarów,
- toleruje brak lub błędną datę,
- zapisuje profile i pomiary atomowo,
- usuwa stare klucze dopiero po udanym zapisie,
- zapisuje znacznik, dzięki któremu operacja nie powtarza się.

Nie są przenoszone pola rebound i notatki starego prototypu, ponieważ nie należą do aktualnego modelu natywnego pomiaru.

## Magazyny aplikacji

Każdy magazyn udostępnia:

- `initialize`,
- `add`,
- `update`,
- `delete`,
- `deleteAll`,
- `replaceAll`,
- `getAll`,
- `getById`,
- `subscribe`.

Magazyny publikują również:

- gotowość,
- komunikat błędu,
- komunikat informacyjny.

### Sortowanie

- profile: alfabetycznie według nazwy wyświetlanej,
- pomiary: od najnowszego,
- wpisy Dziennika: od najnowszego dnia jazdy.

## Profile rowerów

Kompletna obsługa jest dostępna w zakładce `Więcej`.

### Lista i pusty stan

Widok pokazuje:

- nazwę,
- opcjonalną markę i model,
- skrót skoku widelca i dampera,
- pusty stan z przyciskiem utworzenia pierwszego profilu,
- komunikaty o błędach i migracji danych.

### Dodawanie i edycja

Formularz zawiera:

- wymaganą nazwę profilu,
- opcjonalną markę i model,
- skok widelca,
- docelowy SAG widelca,
- ciśnienie widelca,
- skok dampera,
- docelowy SAG dampera,
- ciśnienie dampera.

Wszystkie ustawienia zawieszenia są opcjonalne.

Walidacja:

- przyjmuje przecinek i kropkę,
- wymaga wartości dodatnich dla skoku i ciśnienia,
- wymaga wartości SAG większej od 0 i mniejszej od 100,
- przypisuje błąd do konkretnego pola,
- zachowuje identyfikator i datę utworzenia podczas edycji.

### Szczegóły

Szczegóły pokazują wszystkie ustawienia widelca i dampera. Brak wartości jest prezentowany jako `Nie ustawiono`.

### Usuwanie

Dostępne jest:

- usuwanie pojedynczego profilu,
- usuwanie z poziomu szczegółów,
- usuwanie wszystkich profili,
- potwierdzenie każdej operacji destrukcyjnej.

Usunięcie profilu nie usuwa pomiarów ani wpisów Dziennika. Historyczne snapshoty zachowują nazwę i ustawienia roweru.

## Synchronizacja z Pomiarem

Ekran Pomiar subskrybuje magazyn profili.

- nowy profil natychmiast pojawia się na liście,
- edycja wybranego profilu wczytuje nowe ustawienia i zeruje bieżące ugięcie,
- usunięcie wybranego profilu przełącza kalkulator na `Bez profilu`,
- zapis pomiaru korzysta z trwałego `MeasurementStore`.

Dane formularza Pomiaru pozostają w pamięci przy zmianie zakładek. Zapisane pomiary pozostają po pełnym przeładowaniu strony.

## Bezpieczeństwo interfejsu

Dane wpisane przez użytkownika nie są wstawiane do HTML bez zabezpieczenia. Nazwa, model, podsumowanie i identyfikator profilu są kodowane przed użyciem w szablonie.

Pozostałe miejsca korzystają z `textContent` albo właściwości `value` pól formularza.

## Testy

Etap dodaje testy:

- formularza profilu,
- dodawania, edycji i usuwania,
- sortowania profili,
- zachowania stanu po ponownym utworzeniu store,
- błędu zapisu bez zmiany stanu aplikacji,
- zachowania pomiarów po usunięciu profilu,
- migracji starego `localStorage`,
- jednokrotnego wykonania migracji,
- synchronizacji profili z ekranem Pomiar.

Łącznie dodano 20 nowych testów. Cały zestaw jest uruchamiany poleceniem:

```bash
npm test
```

Dodany workflow:

```text
.github/workflows/web-tests.yml
```

## Ograniczenia etapu

- interfejs Historii zostanie wykonany w etapie 6,
- interfejs Dziennika zostanie wykonany w etapie 7,
- import i eksport kopii danych zostaną ukończone wraz z Ustawieniami,
- service worker i tryb offline pozostają wyłączone,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 6 zbuduje pełną Historię pomiarów: listę, filtry, sortowanie, szczegóły, edycję i usuwanie.
