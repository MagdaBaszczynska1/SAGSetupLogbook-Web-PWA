# Etap 7 — kompletny Dziennik jazd

## Cel

Zastąpienie ekranu technicznego pełnym Dziennikiem jazd opartym na trwałym `RideJournalStore`. Implementacja zachowuje historyczne kopie ustawień roweru i pomiarów, dzięki czemu późniejsza edycja lub usunięcie źródłowych danych nie zmienia starych wpisów.

## Główne pliki

```text
src/services/ride-journal-query.js
src/services/ride-journal-form.js
src/services/ride-measurement-candidates.js
src/stores/ride-draft-store.js
src/views/journal/journal-view.js
src/views/journal/journal-filters.js
src/views/journal/journal-row.js
src/views/journal/ride-entry-dialog.js
src/views/journal/ride-detail-dialog.js
src/views/journal/journal-confirmation-dialog.js
src/styles/journal.css
```

Rozszerzono również:

```text
src/utils/date-formatters.js
src/app/data-context.js
src/app/main.js
src/components/layout/app-shell.js
```

## Pusty stan

Pusty Dziennik rozróżnia dwie sytuacje.

### Brak profili

Użytkownik otrzymuje informację, że wpis wymaga profilu roweru, oraz działanie prowadzące do zakładki `Więcej`.

### Profil istnieje, ale brak wpisów

Widok pokazuje działanie `Dodaj pierwszy wpis`.

## Lista wpisów

Każda karta pokazuje:

- nazwę trasy lub miejsca,
- datę jazdy,
- historyczną nazwę roweru,
- warunki,
- ocenę od 1 do 5,
- status pomiarów,
- szczegóły,
- usuwanie.

Status pomiarów rozróżnia:

- bez pomiaru,
- pomiar z dnia jazdy,
- pomiar historyczny.

Za historyczny uznawany jest pomiar z innego dnia albo pomiar bez przypisanego profilu.

## Wyszukiwanie

Wyszukiwanie obejmuje:

- nazwę trasy lub miejsca,
- historyczną nazwę roweru,
- notatkę,
- nazwę warunków.

Wyszukiwanie ignoruje wielkość liter i białe znaki na początku oraz końcu.

## Filtry

### Rower

Opcje rowerów są budowane z wpisów Dziennika, a nie wyłącznie z aktualnych profili. Dzięki temu pozostaje możliwe filtrowanie wpisów roweru, którego profil został później usunięty.

### Warunki

Dostępne wartości:

- Sucho,
- Mokro,
- Błoto,
- Mieszane.

### Sortowanie

- od najnowszych,
- od najstarszych,
- najwyżej ocenione.

Przy jednakowej ocenie sortowanie `Najwyżej ocenione` pokazuje najpierw nowszą jazdę.

### Licznik

Widok pokazuje:

- liczbę widocznych wpisów,
- liczbę wszystkich wpisów,
- liczbę aktywnych filtrów.

Przycisk `Wyczyść` resetuje wyszukiwanie, rower i warunki, zachowując kolejność sortowania.

## Formularz dodawania i edycji

Pola:

- profil roweru — wymagany,
- trasa lub miejsce — wymagane,
- data jazdy — wymagana,
- warunki — wymagane,
- ocena 1–5 — wymagana,
- notatka — opcjonalna,
- pomiary SAG — opcjonalne.

Walidacja pokazuje błędy przy odpowiednich polach. Nieudany zapis do IndexedDB nie zamyka formularza.

## Wybór pomiarów

Do jednego wpisu można wybrać maksymalnie:

- jeden pomiar widelca,
- jeden pomiar dampera.

Wybranie drugiego pomiaru tego samego typu zastępuje poprzedni.

Kandydaci są prezentowani w trzech grupach.

### 1. Ten rower i dzień jazdy

Pokazywane są wszystkie pomiary wybranego profilu z dnia jazdy. Najnowszy pomiar każdego dostępnego typu jest zaznaczany automatycznie.

### 2. Brakujący typ z poprzednich siedmiu dni

Jeżeli w dniu jazdy brakuje widelca albo dampera, aplikacja pokazuje najnowszy pomiar brakującego typu z maksymalnie siedmiu wcześniejszych dni.

Taki pomiar nie jest zaznaczany automatycznie.

### 3. Pomiary bez profilu z dnia jazdy

Pomiary wykonane bez profilu są pokazywane osobno i wymagają świadomego wyboru.

## Przejście z Historii

Działanie `Dodaj notatkę z jazdy` w szczegółach Historii przekazuje dokładnie wybrany pomiar do osobnego `rideDraftStore`.

Po wejściu do Dziennika:

- otwiera się formularz nowego wpisu,
- data jest ustawiana na dzień pomiaru,
- profil jest wybierany automatycznie, jeżeli nadal istnieje,
- dokładnie ten pomiar jest zaznaczony,
- pomiar bez profilu pozostaje wybrany jako historyczna kopia i użytkownik musi wskazać profil wpisu.

Szkic jest przechowywany tylko podczas bieżącej sesji nawigacji. Nie jest zapisywany jako wpis bez świadomego zatwierdzenia formularza.

## Snapshoty

Podczas zapisu tworzona jest niezmienna kopia:

- nazwy i modelu roweru,
- ustawień widelca,
- ustawień dampera,
- każdego wybranego pomiaru.

Usunięcie lub zmiana profilu nie aktualizuje starego wpisu. Usunięcie źródłowego pomiaru również nie usuwa kopii zapisanej w Dzienniku.

## Edycja

### Zmiana opisu, oceny, warunków lub notatki

Jeżeli rower i dzień jazdy nie zmieniają się, zachowane zostają istniejące historyczne snapshoty.

### Zmiana roweru lub dnia jazdy

Aplikacja:

- odłącza stare pomiary,
- oblicza nowych kandydatów,
- automatycznie zaznacza pomiary wybranego roweru z nowego dnia,
- pokazuje ostrzeżenie o zmianie kontekstu.

Jeżeli po zmianie kontekstu użytkownik zapisuje wpis bez pomiaru, wymagane jest dodatkowe potwierdzenie.

Powrót do pierwotnego roweru i daty przywraca oryginalne snapshoty.

### Usunięty profil

W edycji starego wpisu usunięty profil pozostaje widoczny jako opcja historyczna. Użytkownik może zmienić trasę, warunki, ocenę i notatkę bez utraty snapshotu.

## Szczegóły wpisu

Widok zawiera:

- trasę,
- datę,
- rower,
- warunki,
- ocenę,
- notatkę,
- status pomiarów,
- pełne dane każdego pomiaru,
- ostrzeżenie o pomiarze historycznym,
- historyczne ustawienia profilu,
- edycję,
- usuwanie.

## Usuwanie

### Pojedynczy wpis

Usuwanie jest dostępne z listy oraz szczegółów i zawsze wymaga potwierdzenia.

Usunięcie wpisu nie usuwa:

- profilu roweru,
- źródłowych pomiarów.

### Cały Dziennik

Działanie `Usuń wszystko` usuwa wszystkie wpisy, także niewidoczne przez aktywne filtry. Profile i pomiary pozostają bez zmian.

## Trwałość i synchronizacja

Widok subskrybuje:

- `RideJournalStore`,
- `BikeStore`,
- `MeasurementStore`,
- `RideDraftStore`.

Dzięki temu:

- nowe wpisy pojawiają się bez przeładowania,
- edycja aktualizuje listę i otwarte szczegóły,
- zmiany profili aktualizują formularz,
- nowe lub usunięte pomiary aktualizują kandydatów,
- dane pozostają po ponownym uruchomieniu aplikacji.

## Dostępność i responsywność

- semantyczne sekcje i nagłówki,
- widoczne etykiety pól,
- `aria-pressed` dla warunków, oceny i wyboru pomiarów,
- `aria-live` dla licznika,
- błędy z `role="alert"`,
- statusy z `role="status"`,
- komunikaty tekstowe niezależne od koloru,
- cele dotykowe o wysokości co najmniej 48 px,
- układ jednokolumnowy na wąskich ekranach,
- zawijanie długich nazw i wartości.

## Bezpieczeństwo danych

Dane użytkownika są umieszczane w DOM przez `textContent` lub właściwości pól formularza. Dynamiczne listy nie składają HTML z nazwy trasy, roweru ani notatki.

Magazyn zwraca głębokie kopie obiektów. Zmiana obiektu odczytanego przez widok nie może zmienić danych bez wywołania operacji `update`.

## Testy

Dodano 36 testów obejmujących:

- wyszukiwanie,
- filtry,
- trzy sposoby sortowania,
- historyczne opcje rowerów,
- grupowanie kandydatów,
- automatyczne sugestie,
- granicę siedmiu dni,
- zastępowanie pomiaru tego samego typu,
- walidację formularza,
- zachowanie snapshotów,
- zmianę kontekstu,
- dodatkowe potwierdzenie,
- usunięty profil,
- lokalne daty kalendarzowe,
- trwałość wpisów,
- niezależność kopii danych,
- import modułów widoków.

Pełny zestaw `npm test` zakończył się powodzeniem w GitHub Actions.

## Ograniczenia etapu

- testy integracyjne z prawdziwym IndexedDB w Safari pozostają do wykonania,
- nie wykonano jeszcze pełnego testu E2E na iPhonie,
- eksport, import, motyw, poradnik i prywatność powstaną w kolejnym etapie,
- service worker i instalacja PWA pozostają wyłączone,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 8 zbuduje kompletne `Więcej` i `Ustawienia`: poradnik, wygląd, prywatność, eksport JSON/CSV, import z walidacją i bezpiecznym rollbackiem.
