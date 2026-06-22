# Etap 6 — kompletna Historia pomiarów

## Cel

Zastąpienie pustego widoku Historii kompletnym odpowiednikiem aplikacji SwiftUI. Widok korzysta bezpośrednio z trwałego `MeasurementStore` utworzonego w etapie 5.

## Główne pliki

```text
src/services/measurement-history-query.js
src/services/measurement-form.js
src/utils/date-formatters.js
src/views/history/history-view.js
src/views/history/history-filters.js
src/views/history/history-row.js
src/views/history/measurement-detail-dialog.js
src/views/history/measurement-edit-dialog.js
src/views/history/history-confirmation-dialog.js
src/styles/history.css
```

## Pusty stan

Gdy nie ma zapisanych pomiarów, Historia pokazuje:

- jednoznaczny komunikat,
- wyjaśnienie, gdzie pojawią się wyniki,
- działanie `Wykonaj pomiar`, które przechodzi do ekranu Pomiar.

## Lista pomiarów

Każdy wiersz pokazuje:

- historyczną nazwę roweru albo `Bez profilu`,
- typ zawieszenia,
- aktualny SAG,
- datę i godzinę,
- ciśnienie albo informację o jego braku,
- interpretację wyniku,
- działania `Szczegóły` i `Usuń`.

Lista korzysta ze snapshotu nazwy zapisanego w pomiarze. Usunięcie lub zmiana profilu nie zmienia starego wpisu Historii.

## Filtry

### Rower

Dostępne opcje:

- wszystkie rowery,
- każdy historyczny identyfikator roweru występujący w pomiarach,
- osobna opcja `Bez profilu`, jeżeli istnieją takie pomiary.

Nazwy opcji pochodzą z historycznych snapshotów, a nie wyłącznie z aktualnego magazynu profili. Dzięki temu można filtrować również pomiary usuniętego profilu.

Jeżeli aktywny filtr przestaje istnieć po usunięciu ostatniego pasującego pomiaru, filtr automatycznie wraca do `Wszystkie rowery`.

### Zawieszenie

Dostępne opcje:

- wszystkie,
- widelec,
- damper.

Aktywny wybór jest oznaczony wizualnie i przez `aria-pressed`.

### Sortowanie

- od najnowszych,
- od najstarszych.

Przy jednakowej dacie kolejność jest stabilizowana przez identyfikator pomiaru.

### Licznik i czyszczenie

Widok pokazuje liczbę widocznych oraz wszystkich pomiarów. Przycisk czyszczenia przywraca wszystkie rowery i oba typy zawieszenia, zachowując wybraną kolejność sortowania — tak samo jak aplikacja natywna.

## Brak wyników filtrów

Jeżeli Historia zawiera dane, ale żaden pomiar nie spełnia filtrów, aplikacja pokazuje osobny stan braku wyników i przycisk `Pokaż wszystkie pomiary`.

## Szczegóły pomiaru

Okno szczegółów zawiera:

- status i wyjaśnienie interpretacji,
- datę,
- historyczną nazwę roweru,
- typ zawieszenia,
- skok,
- ugięcie,
- ciśnienie lub brak danych,
- docelowy SAG,
- aktualny SAG,
- docelowe ugięcie,
- różnicę w punktach procentowych,
- różnicę w milimetrach,
- identyfikator rekordu,
- edycję,
- usunięcie,
- przekazanie pomiaru do szkicu wpisu Dziennika.

Przycisk Dziennika jest niedostępny, jeśli nie istnieje żaden profil roweru. Pełny formularz wpisu powstanie w etapie 7, ale wybrany pomiar jest już przekazywany do osobnego `rideDraftStore` jako niezależna kopia.

## Edycja pomiaru

Formularz pozwala zmienić:

- typ zawieszenia,
- skok,
- ugięcie,
- opcjonalne ciśnienie,
- docelowy SAG.

Walidacja wykorzystuje te same funkcje co ekran Pomiar:

- przecinek i kropka są akceptowane,
- skok musi być większy od zera,
- ugięcie nie może być ujemne ani większe od skoku,
- SAG musi być większy od 0 i mniejszy od 100,
- ciśnienie, jeżeli podane, musi być dodatnie.

Po zapisie wynik jest przeliczany od początku. Zachowane pozostają:

- oryginalny identyfikator,
- oryginalna data,
- identyfikator roweru,
- historyczny snapshot nazwy roweru.

Błąd zapisu do IndexedDB nie zamyka formularza i jest komunikowany użytkownikowi.

## Usuwanie

### Pojedynczy pomiar

Usuwanie jest dostępne z listy oraz szczegółów. Zawsze wymaga potwierdzenia.

Usunięcie źródłowego pomiaru nie usuwa jego niezmiennej kopii zapisanej wcześniej we wpisie Dziennika.

### Cała Historia

Działanie `Usuń wszystko` usuwa całą kolekcję pomiarów, także rekordy ukryte przez aktywne filtry. Operacja wymaga osobnego potwierdzenia i po sukcesie czyści filtry.

## Trwałość i synchronizacja

Historia subskrybuje `MeasurementStore`:

- nowy pomiar pojawia się bez przeładowania,
- edycja natychmiast aktualizuje listę i otwarte szczegóły,
- usunięcie natychmiast aktualizuje licznik oraz filtry,
- wszystkie operacje pozostają po ponownym uruchomieniu aplikacji.

Widok subskrybuje również `BikeStore`, aby poprawnie włączać lub wyłączać działanie tworzenia wpisu Dziennika.

## Dostępność i responsywność

- semantyczne sekcje i nagłówki,
- etykiety pól i filtrów,
- `aria-pressed` dla segmentów,
- `aria-live` dla licznika,
- komunikaty błędów z `role="alert"`,
- status interpretacji z `role="status"`,
- minimalne cele dotykowe,
- układ kart dostosowany do wąskich ekranów,
- identyfikator może być zawijany bez poziomego przewijania,
- komunikaty nie są przekazywane wyłącznie kolorem.

## Testy

Dodano 19 testów obejmujących:

- filtrowanie po rowerze i zawieszeniu,
- filtr `Bez profilu`,
- sortowanie,
- historyczne opcje rowerów,
- nieprawidłowy filtr po usunięciu danych,
- przygotowanie danych formularza,
- walidację edycji,
- ponowne obliczenie wszystkich wyników,
- zachowanie ID, daty i snapshotu,
- trwałość edycji po ponownym uruchomieniu store,
- usuwanie pojedyncze i całościowe,
- niezależną kopię pomiaru przekazaną do szkicu Dziennika,
- poprawne ładowanie modułów Historii.

Cały zestaw uruchamia GitHub Actions przez:

```bash
npm test
```

## Ograniczenia etapu

- pełny formularz i lista Dziennika powstaną w etapie 7,
- Historia nie ma jeszcze wyszukiwania tekstowego, ponieważ aplikacja natywna go nie posiada,
- eksport i import danych będą podłączone w Ustawieniach,
- testy E2E w Safari i na iPhonie pozostają do wykonania,
- service worker i PWA pozostają wyłączone,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 7 zbuduje kompletny Dziennik jazd: listę, wyszukiwanie, filtry, szczegóły, dodawanie, edycję i wybór pomiarów.
