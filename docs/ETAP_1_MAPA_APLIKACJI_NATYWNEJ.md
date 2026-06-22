# Etap 1 — kompletna mapa aplikacji natywnej do wersji webowej

## 1. Cel dokumentu

Ten dokument traktuje kod aplikacji SwiftUI jako **jedyne źródło prawdy** dla nowej wersji webowej. Zrzuty ekranu służą jedynie do kontroli wyglądu. Nie należy ponownie budować funkcji na podstawie samego obrazu ani wcześniejszego prototypu PWA.

Analizowany zakres: aplikacja **SAG Setup Logbook 1.0.0, build 19** z repozytorium `MagdaBaszczynska1/SAGSetupLogbook`.

## 2. Najważniejszy wniosek

Aplikacja nie jest tylko kalkulatorem. Składa się z czterech powiązanych obszarów:

1. **Pomiar** — kalkulator SAG i zapis pomiaru.
2. **Historia** — filtrowanie, szczegóły, edycja i usuwanie pomiarów.
3. **Dziennik** — wpisy z jazd, oceny, warunki i historyczne kopie pomiarów oraz ustawień roweru.
4. **Więcej** — profile rowerów, poradnik, ustawienia, prywatność, eksport i import.

Wersja webowa musi zachować nie tylko wygląd, ale również relacje danych, snapshoty historyczne, walidację, kolejność działań, komunikaty błędów i odporność na utratę danych.

---

# 3. Architektura aplikacji natywnej

## 3.1. Uruchomienie aplikacji

`SAGSetupLogbookApp.swift`:

- tworzy trzy globalne magazyny danych:
  - `MeasurementStore`,
  - `BikeStore`,
  - `RideJournalStore`;
- wstrzykuje je do wszystkich ekranów;
- odczytuje motyw z `appAppearance`;
- pokazuje ekran startowy przez około 1,1 sekundy;
- respektuje systemowe ustawienie ograniczenia ruchu.

### Odpowiednik webowy

- `src/app/bootstrap.*` — uruchomienie aplikacji;
- `src/stores/*` — trzy magazyny domenowe;
- `src/app/theme-store.*` — motyw systemowy/jasny/ciemny;
- ekran startowy może zostać dodany po ustabilizowaniu głównych funkcji.

## 3.2. Główna nawigacja

`ContentView.swift` definiuje cztery główne zakładki:

- `measurement` → **Pomiar**,
- `history` → **Historia**,
- `rideJournal` → **Dziennik**,
- `more` → **Więcej**.

Zakładka „Więcej” prowadzi do:

- profili rowerów,
- poradnika,
- ustawień.

### Odpowiednik webowy

- jeden stabilny router lub kontroler nawigacji;
- dolna nawigacja widoczna na czterech głównych ekranach;
- ekrany szczegółów i edycji otwierane jako osobne widoki/dialogi;
- przejście z pustej Historii do Pomiaru;
- przejście z pustego Dziennika do profili rowerów.

---

# 4. Modele danych

## 4.1. Typ zawieszenia — `SuspensionType`

Wartości:

- `fork` — Widelec,
- `shock` — Damper.

Typ steruje:

- nazwami pól,
- zakresami suwaków,
- krokami wartości,
- domyślnym celem SAG,
- zakresem ciśnienia,
- ikonami i tekstami pomocy.

## 4.2. Profil roweru — `BikeProfile`

Pola:

- `id: UUID`,
- `name: String` — wymagane,
- `model: String` — opcjonalne,
- `forkTravel: Double?`,
- `shockTravel: Double?`,
- `forkTargetSag: Double?`,
- `shockTargetSag: Double?`,
- `forkPressure: Double?`,
- `shockPressure: Double?`,
- `createdAt: Date`.

Nazwa wyświetlana:

- sama nazwa, jeżeli model jest pusty;
- `nazwa — model`, jeżeli model istnieje.

## 4.3. Pomiar — `SagMeasurement`

Pola:

- `id`, `date`,
- opcjonalne `bikeID`,
- `bikeNameSnapshot`,
- `suspensionType`,
- `suspensionTravel`,
- `measuredCompression`,
- `targetSag`,
- opcjonalne `pressure`,
- `currentSag`,
- `targetCompression`,
- `differencePercentagePoints`,
- `differenceMillimeters`,
- `interpretation`.

Ważne: pomiar zachowuje nazwę roweru jako snapshot, dzięki czemu pozostaje czytelny po usunięciu profilu.

## 4.4. Interpretacja SAG — `SagInterpretation`

Wartości:

- `closeToTarget`,
- `tooLow`,
- `tooHigh`.

Interpretacja zawiera:

- krótki status,
- wyjaśnienie,
- ikonę,
- rolę sukcesu lub ostrzeżenia.

## 4.5. Warunki jazdy — `TrailConditions`

Wartości:

- sucho,
- mokro,
- błoto,
- mieszane.

## 4.6. Snapshot profilu — `BikeProfileSnapshot`

Niezmienna kopia ustawień roweru z chwili zapisania wpisu w Dzienniku:

- nazwa i model,
- skok, cel i ciśnienie widelca,
- skok, cel i ciśnienie dampera.

Późniejsza edycja lub usunięcie profilu nie może zmieniać starego wpisu Dziennika.

## 4.7. Snapshot pomiaru — `SagMeasurementSnapshot`

Niezmienna kopia pomiaru przypięta do wpisu Dziennika. Zachowuje wszystkie wartości obliczone oraz identyfikator źródłowego pomiaru.

## 4.8. Wpis Dziennika — `RideJournalEntry`

Pola:

- `id`, `createdAt`, `rideDate`,
- `bikeID`,
- `bikeNameSnapshot`,
- opcjonalny `bikeProfileSnapshot`,
- starsze pole `measurementSnapshot`,
- nowe pole `measurementSnapshots`,
- `routeName`,
- `conditions`,
- `rating` od 1 do 5,
- `notes`.

Status pomiaru:

- bez pomiaru,
- pomiar z dnia jazdy,
- pomiar historyczny.

Za historyczny uznawany jest pomiar bez profilu albo wykonany innego dnia niż jazda.

## 4.9. Kopia zapasowa — `AppBackupPackage`

Zawiera komplet:

- profili rowerów,
- pomiarów,
- wpisów Dziennika.

Metadane:

- `formatVersion = 1`,
- `application = "SAG Setup Logbook"`,
- data eksportu.

---

# 5. Logika kalkulatora SAG

## 5.1. Zakresy i kroki

### Skok zawieszenia

| Typ | Zakres | Krok | Domyślna wartość |
|---|---:|---:|---:|
| Widelec | 80–220 mm | 1 mm | 160 mm |
| Damper | 20–100 mm | 0,5 mm | 55 mm |

### Ugięcie

- zakres: od `0` do aktualnego skoku;
- krok:
  - widelec: 1 mm,
  - damper: 0,5 mm;
- zmniejszenie skoku poniżej ugięcia automatycznie ogranicza ugięcie.

### Docelowy SAG

- zakres niestandardowy: 10–40%;
- krok: 1 punkt procentowy;
- domyślna wartość:
  - widelec: 25%,
  - damper: 30%;
- szybkie wybory: 20%, 25%, 30%, „Inny”.

### Ciśnienie

- opcjonalne;
- widelec: 30–200 PSI, domyślnie 80 PSI;
- damper: 50–400 PSI, domyślnie 180 PSI;
- nie wpływa na wynik SAG.

## 5.2. Wzory

```text
currentSag = measuredCompression / suspensionTravel × 100
targetCompression = suspensionTravel × targetSag / 100
differencePercentagePoints = currentSag − targetSag
differenceMillimeters = measuredCompression − targetCompression
```

Tolerancja wyniku „blisko celu”: **±1 punkt procentowy włącznie**.

## 5.3. Walidacja

- skok musi być skończoną liczbą większą od 0;
- ugięcie musi być skończoną liczbą równą lub większą od 0;
- ugięcie nie może przekraczać skoku;
- docelowy SAG musi być większy od 0 i mniejszy od 100;
- opcjonalne ciśnienie, gdy podane, musi być większe od 0;
- parser akceptuje przecinek i kropkę jako separator dziesiętny;
- parser odrzuca zapis wykładniczy, tekst i liczby nieskończone.

## 5.4. Świadome ustawienie ugięcia

Wynik nie może pojawić się tylko dlatego, że ugięcie ma domyślną wartość `0`. Użytkownik musi najpierw poruszyć suwakiem albo nacisnąć przycisk korekty. Dopiero wtedy wykonywane jest aktywne obliczenie.

## 5.5. Wczytywanie profilu

Wybranie profilu albo przełączenie Widelec/Damper:

- wczytuje skok,
- wczytuje cel,
- wczytuje opcjonalne ciśnienie,
- oznacza, czy skok pochodzi z profilu,
- zeruje ugięcie,
- przywraca stan „Nie ustawiono”,
- ukrywa wynik,
- czyści stan zapisu.

Wybranie „Bez profilu” używa wartości domyślnych.

## 5.6. Zapis i ochrona przed duplikatem

Przycisk ma cztery stany:

1. niedostępny,
2. gotowy,
3. zapisywanie,
4. zapisany.

Po zapisaniu tworzona jest sygnatura obejmująca:

- profil roweru,
- typ zawieszenia,
- skok,
- ugięcie,
- cel,
- ciśnienie.

Ponowne kliknięcie bez zmiany danych nie może utworzyć duplikatu. Zmiana dowolnej wartości ponownie uaktywnia zapis.

Po sukcesie:

- przy profilu roweru można utworzyć wpis Dziennika z dokładnie tym zapisanym pomiarem;
- bez profilu użytkownik otrzymuje informację, że Dziennik wymaga profilu.

---

# 6. Mapa ekranów i funkcji

## 6.1. Pomiar — `CalculatorView` i `CalculatorSections`

Elementy obowiązkowe:

- wybór profilu lub „Bez profilu”;
- Widelec/Damper;
- karta skoku i osobny edytor skoku;
- karta ugięcia z dużą wartością, suwakiem, skalą, `−` i `+`;
- stan „Nie ustawiono” przed pierwszą interakcją;
- szybki wybór celu i niestandardowy suwak;
- pomoc dla docelowego SAG;
- zwijana sekcja „Dodatkowe dane”;
- obecnie jedyną zaimplementowaną dodatkową daną jest **ciśnienie**;
- wynik widoczny dopiero po ustawieniu ugięcia;
- bieżący SAG, cel, interpretacja, docelowe ugięcie oraz dwie różnice;
- stały pasek zapisu nad dolną nawigacją;
- reset formularza z potwierdzeniem;
- pełna instrukcja pomiaru w siedmiu krokach.

Nie należy dodawać reboundu, kompresji tłumienia ani notatki do kalkulatora na tym etapie — kod natywny ma tylko przygotowane miejsce na przyszłość.

## 6.2. Historia — `HistoryView`

Funkcje:

- pusty stan z działaniem „Wykonaj pomiar”;
- filtrowanie według roweru;
- osobna opcja „Bez profilu”;
- filtrowanie: wszystkie / widelec / damper;
- sortowanie: najnowsze / najstarsze;
- licznik widocznych i wszystkich wyników;
- czyszczenie filtrów;
- stan braku wyników;
- usuwanie elementu z aktualnie przefiltrowanej listy;
- usunięcie wszystkich pomiarów z potwierdzeniem;
- komunikaty odzyskania lub błędu danych.

Wiersz historii pokazuje:

- rower,
- rodzaj zawieszenia,
- aktualny SAG,
- datę,
- ciśnienie lub jego brak,
- interpretację.

## 6.3. Szczegóły i edycja pomiaru

Szczegóły:

- status i wyjaśnienie,
- data,
- dane wejściowe,
- wyniki,
- identyfikator UUID,
- dodanie wpisu Dziennika,
- edycja,
- usunięcie.

Edycja:

- typ zawieszenia,
- skok,
- ugięcie,
- ciśnienie,
- cel;
- ponowne pełne przeliczenie wyniku;
- zachowanie oryginalnego ID, daty i snapshotu roweru.

## 6.4. Profile rowerów

Lista:

- pusty stan i dodanie pierwszego roweru;
- sortowanie alfabetyczne po nazwie wyświetlanej;
- wejście do szczegółów;
- usuwanie pojedyncze;
- usuwanie wszystkich z potwierdzeniem;
- komunikaty odzyskania/błędu.

Formularz dodawania i edycji:

- nazwa — wymagana;
- marka/model — opcjonalne;
- dla widelca i dampera osobno:
  - skok,
  - docelowy SAG,
  - ciśnienie;
- wszystkie wartości zawieszenia są opcjonalne;
- wartości liczbowe muszą spełniać regułę dodatnią, a SAG mieścić się między 0 a 100;
- dla dampera musi być widoczne objaśnienie, że chodzi o skok tłoczyska, nie skok tylnego koła.

Usunięcie profilu nie usuwa pomiarów ani wpisów Dziennika — pozostają snapshoty nazw i danych.

## 6.5. Dziennik jazd

Lista:

- pusty stan zależny od tego, czy istnieje profil roweru;
- wyszukiwanie;
- filtry roweru i warunków;
- sortowanie:
  - najnowsze,
  - najstarsze,
  - najwyżej ocenione;
- licznik wyników i aktywnych filtrów;
- stan braku wyników;
- usuwanie z potwierdzeniem;
- status: bez pomiaru / z pomiarem / pomiar historyczny.

Wiersz pokazuje:

- trasę,
- datę,
- rower,
- warunki,
- ocenę 1–5,
- status pomiaru.

### Dodawanie wpisu

Pola:

- profil roweru — wymagany,
- nazwa trasy lub miejsce — wymagane,
- data jazdy,
- warunki,
- ocena 1–5,
- notatka — opcjonalna,
- wybór pomiarów SAG.

Dobór pomiarów odbywa się w grupach:

1. pomiary wybranego roweru z dnia jazdy;
2. najnowszy brakujący typ zawieszenia z maksymalnie siedmiu wcześniejszych dni;
3. pomiary bez profilu z dnia jazdy.

Automatycznie sugerowane są tylko pomiary wybranego roweru z dnia jazdy. Starsze i nieprzypisane wymagają świadomego wyboru. Dla jednego wpisu może zostać wybrany maksymalnie jeden pomiar danego typu zawieszenia.

### Edycja wpisu

- zmiana samej trasy, oceny, warunków lub notatki zachowuje historyczne snapshoty;
- zmiana roweru albo dnia jazdy odłącza stare pomiary i wymaga wyboru nowych kandydatów;
- zapis bez pomiaru po zmianie kontekstu wymaga dodatkowego potwierdzenia;
- usunięty profil może pozostać widoczny jako historyczna nazwa.

### Szczegóły wpisu

- podsumowanie trasy, roweru i daty;
- warunki i ocena;
- notatka;
- status pomiarów;
- skrót pomiarów i rozwijane pełne szczegóły;
- ostrzeżenie przy pomiarze historycznym;
- historyczna kopia ustawień profilu;
- edycja i usunięcie;
- usunięcie wpisu nie usuwa źródłowych pomiarów.

## 6.6. Poradnik

Pięć głównych kroków:

1. przygotowanie roweru,
2. przesunięcie pierścienia,
3. przyjęcie pozycji do jazdy,
4. ostrożne zejście,
5. zmierzenie ugięcia.

Dodatkowo:

- ostrzeżenie o skoku tłoczyska dampera;
- informacja, że zalecany SAG zależy od producenta i modelu.

Kalkulator ma również bardziej szczegółową instrukcję siedmiopunktową.

## 6.7. Ustawienia

Sekcje:

1. **Kopia danych**
   - eksport JSON,
   - eksport CSV,
   - import JSON;
2. **Wygląd**
   - systemowy,
   - jasny,
   - ciemny;
3. **Pomoc**
   - poradnik,
   - prywatność i dane;
4. **Informacje**
   - nazwa,
   - wersja,
   - numer builda.

Prywatność:

- dane przetwarzane lokalnie;
- brak konta;
- brak wysyłania na serwer;
- usunięcie danych aplikacji usuwa lokalne dane, dlatego istotny jest eksport.

---

# 7. Przechowywanie i odporność danych

Natywna aplikacja przechowuje trzy oddzielne pliki JSON:

- `bikes.json`,
- `measurements.json`,
- `ride-journal.json`.

Mechanizm `SafeJSONPersistence` zapewnia:

- jeden katalog danych,
- migrację starszych plików,
- zapis atomowy,
- kopię poprzedniej poprawnej wersji,
- odzyskanie z kopii,
- zachowanie uszkodzonego pliku zamiast nadpisania,
- cofnięcie nieudanego importu.

### Odpowiednik webowy

W wersji webowej wymagane jest **IndexedDB**, nie samo `localStorage`.

Proponowane magazyny:

- `bikes`,
- `measurements`,
- `rideJournalEntries`,
- `metadata`.

Wymagania:

- transakcyjny zapis;
- wersjonowanie schematu;
- migracje;
- kopia danych przed importem;
- pełny rollback, jeżeli którykolwiek magazyn nie zostanie zapisany;
- komunikat o błędzie bez czyszczenia istniejących danych;
- nie przechowywać danych domenowych wyłącznie w pamięci widoku.

---

# 8. Eksport, import i bezpieczeństwo plików

## JSON

- maksymalny rozmiar: 50 MiB;
- właściwa nazwa aplikacji;
- obsługiwana wersja formatu;
- maksymalnie 100 000 rekordów w każdej kolekcji;
- unikalne identyfikatory;
- walidacja wszystkich liczb;
- sprawdzenie, czy zapisane wyniki SAG zgadzają się z danymi wejściowymi;
- tolerancja kontroli obliczeń: 0,02;
- jeden snapshot pomiaru na typ zawieszenia we wpisie Dziennika;
- import zastępuje cały zestaw danych dopiero po potwierdzeniu;
- import musi być atomowy dla wszystkich trzech magazynów.

## CSV

Eksportuje typy rekordów:

- `bike_profile`,
- `measurement`,
- `ride`,
- `ride_measurement`.

Wymagane jest zabezpieczenie przed formułami arkusza: tekst zaczynający się od `=`, `+`, `-`, `@`, tabulatora lub powrotu karetki musi zostać poprzedzony apostrofem, jeżeli nie jest liczbą.

---

# 9. Formatowanie i lokalizacja

## Liczby

- wejście przyjmuje `27,5` oraz `27.5`;
- grupowanie tysięcy jest wyłączone;
- wynik standardowy pokazuje jedno miejsce po przecinku;
- format kompaktowy pokazuje od zera do jednego miejsca;
- format edycyjny do dwóch miejsc;
- wartości różnic mają jawny `+`, `−` lub zero.

## Daty

Potrzebne są trzy formaty:

- data,
- długa data,
- data i czas.

## Język

- interfejs jest po polsku;
- techniczne klucze lokalizacji nie mogą być widoczne;
- komunikaty powinny pozostać krótkie i naturalne;
- polskie formy liczebników muszą działać w licznikach.

---

# 10. System wizualny, responsywność i dostępność

Stałe:

- promień karty: 18;
- promień kompaktowy: 12;
- minimalny obszar dotyku: 48;
- odstęp ekranu: 16;
- paleta: grafit/czerń/zieleń;
- jasny i ciemny motyw.

Wymagania do wersji webowej:

- minimalny cel dotykowy 48 × 48 CSS px;
- brak informacji przekazywanej wyłącznie kolorem;
- aktywny cel SAG ma znacznik wyboru;
- wyraźny focus klawiatury;
- poprawne etykiety pól;
- statusy z rolami informacji, sukcesu, ostrzeżenia i błędu;
- układy adaptacyjne przy dużym tekście;
- przyciski `−/+` mogą przechodzić pod suwak;
- brak poziomego przewijania;
- respektowanie `prefers-reduced-motion`;
- respektowanie `prefers-contrast` tam, gdzie jest dostępne;
- odpowiedniki etykiet i opisów VoiceOver przez semantyczny HTML i ARIA;
- ikony dekoracyjne ukryte przed czytnikiem ekranu.

---

# 11. Mapa plików SwiftUI → moduły webowe

| Plik/obszar natywny | Odpowiedzialność | Docelowy moduł webowy |
|---|---|---|
| `SAGSetupLogbookApp.swift` | start, magazyny, motyw, splash | `src/app/bootstrap`, `theme-store`, `splash-view` |
| `ContentView.swift` | zakładki i Więcej | `src/app/router`, `app-shell`, `bottom-navigation` |
| `DesignSystem.swift` | tokeny i komponenty | `src/styles/tokens`, `src/components/ui` |
| `BikeProfile.swift` | model roweru | `src/models/bike-profile` |
| `SagMeasurement.swift` | typ zawieszenia i pomiar | `src/models/sag-measurement` |
| `RideJournalEntry.swift` | wpis i snapshoty | `src/models/ride-journal-entry` |
| `SAGCalculator.swift` | walidacja i obliczenia | `src/services/sag-calculator` |
| `CalculatorView.swift` | stan i przepływ Pomiaru | `src/views/measurement/measurement-controller` |
| `CalculatorSections.swift` | komponenty Pomiaru | `src/views/measurement/components/*` |
| `MeasurementStore.swift` | CRUD pomiarów | `src/stores/measurement-store` |
| `BikeStore.swift` | CRUD profili | `src/stores/bike-store` |
| `RideJournalStore.swift` | CRUD wpisów | `src/stores/ride-journal-store` |
| `SafeJSONPersistence.swift` | bezpieczny zapis | `src/persistence/indexed-db`, migracje i transakcje |
| `BikesView.swift` | lista rowerów | `src/views/bikes/bikes-view` |
| `EditBikeView.swift` | formularz profilu | `src/views/bikes/bike-form` |
| `BikeDetailView.swift` | szczegóły profilu | `src/views/bikes/bike-detail` |
| `HistoryView.swift` | lista Historii | `src/views/history/history-view` |
| `MeasurementHistoryQuery.swift` | filtry/sortowanie | `src/services/measurement-history-query` |
| `MeasurementDetailView.swift` | szczegóły pomiaru | `src/views/history/measurement-detail` |
| `EditMeasurementView.swift` | edycja pomiaru | `src/views/history/measurement-form` |
| `RideJournalView.swift` | lista Dziennika | `src/views/journal/journal-view` |
| `RideJournalQuery.swift` | wyszukiwanie/filtry | `src/services/ride-journal-query` |
| `RideMeasurementSelector.swift` | kandydaci pomiarów | `src/services/ride-measurement-selector` |
| `RideMeasurementSelection.swift` | reguły wyboru | `src/services/ride-measurement-selection` |
| `RideEntryEditPolicy.swift` | zachowanie snapshotów | `src/services/ride-entry-edit-policy` |
| `AddRideEntryView.swift` | nowy wpis | `src/views/journal/ride-form` |
| `EditRideEntryView.swift` | edycja wpisu | `src/views/journal/ride-edit-form` |
| `RideJournalDetailView.swift` | szczegóły wpisu | `src/views/journal/ride-detail` |
| `GuideView.swift` | poradnik | `src/views/guide/guide-view` |
| `SettingsView.swift` | ustawienia i kopie | `src/views/settings/settings-view` |
| `AppBackup.swift` | format i walidacja kopii | `src/services/backup` |
| `AppBackupImportCoordinator.swift` | atomowy import | `src/services/backup-import` |
| `LocalizedNumberParser.swift` | parser liczb | `src/utils/localized-number-parser` |
| `AppFormatters.swift` | liczby i daty | `src/utils/formatters` |
| `L10n` i katalog tekstów | lokalizacja | `src/i18n/pl` |
| `SAGSetupLogbookTests` | wymagania regresyjne | `tests/unit`, `tests/integration`, `tests/e2e` |

---

# 12. Testy, które trzeba przenieść

## Jednostkowe

- wzory i interpretacja SAG;
- tolerancja ±1 p.p.;
- zakresy i kroki suwaków;
- profilowe uzupełnianie wartości;
- wynik ukryty przed ustawieniem ugięcia;
- stany przycisku zapisu;
- parser przecinka i kropki;
- formatowanie liczb, znaków i dat;
- filtry i sortowanie Historii;
- filtry, wyszukiwanie i sortowanie Dziennika;
- dobór pomiarów do wpisu;
- zachowanie snapshotów podczas edycji;
- walidacja kopii i CSV.

## Integracyjne

- zapis pomiaru → pojawienie się w Historii;
- zapis pomiaru → utworzenie wpisu Dziennika;
- usunięcie profilu → brak utraty snapshotów;
- edycja pomiaru → ponowne przeliczenie;
- import → pełne zastąpienie albo pełny rollback;
- restart → zachowanie wszystkich danych.

## E2E na Safari/iPhonie

- suwak i `−/+`;
- Widelec/Damper;
- zapis bez wielokrotnego duplikowania;
- profile, Historia, Dziennik, szczegóły i edycja;
- jasny/ciemny motyw;
- duży tekst;
- klawiatura i czytnik ekranu;
- działanie bez połączenia dopiero po etapie PWA.

---

# 13. Rozbieżności wykryte podczas analizy

## 13.1. Wyszukiwanie w Dzienniku

Tekst podpowiedzi sugeruje wyszukiwanie trasy, roweru, warunków lub notatki, ale aktualna logika przeszukuje wyłącznie trasę i nazwę roweru. Ręczny plan testów także oczekuje, że tekst występujący tylko w notatce albo warunkach nie da wyniku.

**Decyzja dla wersji webowej:** zachować logikę trasa + rower i poprawić tekst podpowiedzi, zamiast rozszerzać funkcję bez uzgodnienia.

## 13.2. Granica 100% w imporcie

Formularze wymagają SAG `< 100`, ale walidator importu akceptuje `<= 100` dla zgodności danych.

**Decyzja:** nowe dane użytkownika muszą mieć `< 100`; importer zachowuje tolerancję natywnej aplikacji do czasu ustalenia migracji formatu.

## 13.3. Starsze opisy kalkulatora

Starsze fragmenty dokumentacji wspominają przycisk „Oblicz SAG”. Aktualny kod oblicza wynik automatycznie po świadomym ustawieniu ugięcia.

**Decyzja:** wersja webowa ma obliczać automatycznie; kod builda 19 ma pierwszeństwo przed starymi opisami.

## 13.4. Dodatkowe dane

Wcześniejszy prototyp webowy dodał rebound i notatki w kalkulatorze. Natywna implementacja kalkulatora obsługuje obecnie tylko opcjonalne ciśnienie.

**Decyzja:** usunąć nieistniejące pola z odpowiednika ekranu Pomiar. Rebound i notatki należą do przyszłego zakresu, nie do wiernego portu 1.0.0.

---

# 14. Lista funkcji, których nie wolno pominąć

- [ ] Cztery główne zakładki.
- [ ] Brak backendu i konta użytkownika.
- [ ] Trzy trwałe magazyny danych.
- [ ] Profile z osobnymi ustawieniami widelca i dampera.
- [ ] „Bez profilu” w kalkulatorze i Historii.
- [ ] Świadome ustawienie ugięcia przed pokazaniem wyniku.
- [ ] Dokładne zakresy i kroki suwaków.
- [ ] Automatyczne przeliczanie.
- [ ] Tolerancja ±1 p.p.
- [ ] Opcjonalne ciśnienie bez wpływu na obliczenie.
- [ ] Szybkie cele 20/25/30/Inny.
- [ ] Reset formularza z potwierdzeniem.
- [ ] Cztery stany zapisu i ochrona przed duplikatem.
- [ ] Przejście z zapisanego pomiaru do Dziennika.
- [ ] Filtry i sortowanie Historii.
- [ ] Szczegóły i edycja pomiaru.
- [ ] Snapshot nazwy roweru w pomiarze.
- [ ] Snapshot profilu i pomiarów we wpisie Dziennika.
- [ ] Maksymalnie jeden pomiar każdego typu w jednym wpisie.
- [ ] Reguła siedmiu dni dla kandydatów historycznych.
- [ ] Edycja wpisu bez niszczenia snapshotów.
- [ ] Wyszukiwanie Dziennika po trasie i rowerze.
- [ ] Warunki i ocena 1–5.
- [ ] Eksport JSON i CSV.
- [ ] Walidacja oraz atomowy import.
- [ ] Motyw systemowy, jasny i ciemny.
- [ ] Prywatność i komunikat o lokalnych danych.
- [ ] Polskie liczby, daty i liczebniki.
- [ ] Cele dotykowe minimum 48 px i obsługa dużego tekstu.
- [ ] Brak cache PWA aż do etapu 10.

---

# 15. Kryterium zakończenia etapu 1

Etap 1 jest zakończony, ponieważ:

- zidentyfikowano wszystkie główne ekrany i przepływy;
- zmapowano modele oraz relacje danych;
- spisano reguły kalkulatora i walidacji;
- zmapowano trwałość, import i eksport;
- wskazano wymagania dostępności i testów;
- wykryto rozbieżności, które mogłyby ponownie doprowadzić do niezgodnego prototypu;
- określono mapę plików natywnych do przyszłej struktury webowej.

Następny etap nie powinien implementować funkcji biznesowych. Jego zadaniem jest wyłącznie przygotowanie czystej struktury projektu na gałęzi `rebuild-from-ios-source`, bez service workera i bez publikowania na `main`.
