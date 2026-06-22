# Etap 8 — Więcej, Ustawienia i kopie danych

## Cel

Ukończenie zakładki `Więcej` poprzez dodanie poradnika, ustawień wyglądu, informacji o prywatności oraz kompletnej obsługi eksportu i bezpiecznego importu danych.

## Główne pliki

```text
src/stores/app-settings-store.js
src/services/data-backup.js
src/utils/downloads.js
src/views/more/more-view.js
src/views/more/guide-dialog.js
src/views/more/settings-dialog.js
src/views/more/privacy-dialog.js
src/views/more/data-management-view.js
src/styles/more.css
```

Rozszerzono także:

```text
src/app/data-context.js
src/styles/tokens.css
src/styles/base.css
src/styles/index.css
index.html
```

## Ekran Więcej

Zakładka zawiera teraz:

- status trwałości danych,
- kompletną obsługę profili rowerów,
- poradnik,
- ustawienia wyglądu,
- informacje o prywatności,
- licznik profili, pomiarów i wpisów,
- eksport JSON,
- eksport CSV,
- import JSON,
- informacje o aplikacji i ograniczeniach kalkulatora.

## Poradnik

Poradnik jest podzielony na rozwijane sekcje:

1. dodawanie profilu roweru,
2. przygotowanie i wykonanie pomiaru SAG,
3. interpretacja wyniku,
4. korzystanie z Historii,
5. korzystanie z Dziennika,
6. tworzenie kopii danych,
7. ograniczenia i bezpieczeństwo ustawień zawieszenia.

Tekst rozróżnia skok dampera od skoku tylnego koła i przypomina, że kalkulator nie zastępuje instrukcji producenta ani profesjonalnego serwisu.

## Wygląd

Dostępne są trzy tryby:

- systemowy,
- jasny,
- ciemny.

Ustawienie:

- jest stosowane natychmiast,
- jest zapisywane w `localStorage`,
- jest odczytywane przed załadowaniem arkusza stylów, aby ograniczyć migotanie niewłaściwego motywu,
- może zostać dołączone do kopii JSON.

Tryb systemowy korzysta z `prefers-color-scheme`. Aplikacja nadal respektuje `prefers-reduced-motion` oraz `prefers-contrast`.

## Prywatność

Ekran prywatności jasno informuje, że:

- aplikacja nie wymaga konta,
- profile, pomiary i Dziennik są przechowywane lokalnie w IndexedDB,
- wygląd jest zapisywany w localStorage,
- dane nie są wysyłane na serwer,
- nie ma analityki, śledzenia ani reklam,
- pliki powstają wyłącznie po świadomym eksporcie,
- czyszczenie danych witryny może usunąć lokalną bazę,
- regularny eksport JSON jest zalecaną kopią bezpieczeństwa.

## Eksport JSON

Pełna kopia zawiera:

```text
format
schemaVersion
exportedAt
appVersion
data.bikes
data.measurements
data.rides
settings.appearanceMode
```

Aktualny format:

```text
sag-setup-logbook-backup
```

Aktualna wersja schematu kopii:

```text
1
```

Plik JSON zachowuje:

- profile rowerów,
- kompletne pomiary,
- wpisy Dziennika,
- snapshoty profili,
- snapshoty pomiarów,
- ustawienie wyglądu.

## Eksport CSV

CSV jest raportem do arkusza kalkulacyjnego. Zawiera wspólną tabelę z rekordami typu:

- `bike`,
- `measurement`,
- `ride`.

Raport rozpoczyna się znacznikiem UTF-8 BOM, dzięki czemu polskie znaki są poprawnie odczytywane przez popularne arkusze.

Pola tekstowe zaczynające się od:

```text
=
+
-
@
```

są zabezpieczane przed interpretacją jako formuły arkusza. CSV nie jest formatem importu, ponieważ nie przechowuje pełnej struktury snapshotów.

## Walidacja importu

Import przyjmuje wyłącznie kopię JSON zgodną ze schematem.

Przed pokazaniem potwierdzenia sprawdzane są:

- maksymalny rozmiar 10 MB,
- poprawność JSON,
- nazwa formatu,
- wersja schematu,
- daty,
- wymagane teksty,
- dodatnie wartości skoku i ciśnienia,
- SAG w zakresie większym od 0 i mniejszym od 100,
- typ zawieszenia,
- ugięcie nie większe od skoku,
- warunki i ocena Dziennika,
- unikalność identyfikatorów kolekcji,
- unikalność snapshotów,
- najwyżej jeden pomiar widelca i jeden dampera na wpis.

Wyniki SAG z pliku nie są bezwarunkowo uznawane za prawidłowe. Aplikacja ponownie oblicza:

- aktualny SAG,
- docelowe ugięcie,
- różnicę w punktach procentowych,
- różnicę w milimetrach,
- interpretację.

Dzięki temu zmodyfikowany plik nie może wprowadzić niespójnych wyników przy prawidłowych danych wejściowych.

## Bezpieczny import i rollback

Import zawsze zastępuje wszystkie trzy kolekcje:

- profile,
- pomiary,
- wpisy Dziennika.

Nie jest to operacja łączenia rekordów.

Przebieg:

1. cały plik jest walidowany bez zmiany bazy,
2. użytkownik widzi liczbę rekordów i ostrzeżenie,
3. aplikacja pobiera aktualną kopię ratunkową JSON,
4. aktualne dane są zachowywane w pamięci jako punkt rollbacku,
5. kolekcje są zastępowane w jednej transakcji,
6. wszystkie store są ponownie odczytywane,
7. ustawienie wyglądu jest stosowane po poprawnym imporcie.

Jeżeli zapis albo odświeżenie danych nie powiedzie się, aplikacja próbuje automatycznie przywrócić poprzednie kolekcje i ponownie odczytać store.

Jeżeli zawiedzie również rollback, użytkownik otrzymuje osobny komunikat krytyczny. Pobrana przed importem kopia ratunkowa pozostaje wtedy zewnętrznym zabezpieczeniem.

## Tryb sesyjny

Eksport działa również w awaryjnym magazynie pamięciowym. Pozwala to zapisać dane przed zamknięciem karty.

Import do trybu sesyjnego jest możliwy, ale dane nadal znikną po zamknięciu karty. Status na ekranie Więcej informuje o tym ograniczeniu.

## Dostępność i responsywność

- dialogi posiadają nazwy i przyciski zamknięcia,
- wygląd jest wybierany przez przyciski z `aria-pressed`,
- operacje plikowe mają komunikaty statusu i błędów,
- sekcje poradnika wykorzystują natywne `details` i `summary`,
- komunikaty nie opierają się wyłącznie na kolorze,
- przyciski mają cele dotykowe co najmniej 48 px,
- karty i liczniki przechodzą do jednej kolumny na małych ekranach,
- dodano globalną klasę `sr-only` dla poprawnych etykiet niewidocznych wizualnie.

## Testy

Etap dodaje 15 testów obejmujących:

- domyślny wygląd systemowy,
- zapis i natychmiastowe stosowanie motywu,
- powrót do trybu systemowego,
- błędy localStorage,
- pełny round-trip kopii,
- ponowne obliczanie wyniku SAG podczas importu,
- błędny JSON, format i wersję,
- duplikaty identyfikatorów,
- nieprawidłowe wartości SAG i ciśnienia,
- powtarzające się typy snapshotów,
- ochronę CSV przed formułami,
- atomowe zastąpienie danych,
- odświeżenie magazynów,
- rollback po błędzie,
- poprawne ładowanie modułów Więcej.

Pełny zestaw `npm test` zakończył się powodzeniem w GitHub Actions.

## Ograniczenia etapu

- import CSV nie jest obsługiwany celowo,
- aplikacja nie synchronizuje danych między urządzeniami,
- nie ma chmury ani kont użytkowników,
- test pobierania plików i wyboru pliku w mobilnym Safari pozostaje do wykonania,
- service worker i instalacja PWA pozostają wyłączone,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 9 uruchomi PWA, bezpieczny service worker, manifest, instalację na iPhonie oraz testy zachowania online i offline bez blokowania aktualizacji aplikacji.
