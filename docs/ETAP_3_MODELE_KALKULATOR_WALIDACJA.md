# Etap 3 — modele, kalkulator SAG i walidacja

## Cel

Przeniesienie logiki domenowej z aplikacji SwiftUI do niezależnych modułów JavaScript, bez łączenia jej jeszcze z interfejsem i trwałym magazynem danych.

## Dodane modele

### Typ zawieszenia

`src/models/suspension-type.js`

- Widelec i Damper,
- polskie nazwy pól,
- teksty pomocy,
- kontrola nieznanego typu.

### Profil roweru

`src/models/bike-profile.js`

- wszystkie pola z `BikeProfile.swift`,
- nazwa wyświetlana `nazwa — model`,
- osobne odczyty skoku, celu i ciśnienia dla widelca i dampera.

### Pomiar SAG

`src/models/sag-measurement.js`

- wszystkie wejścia i wyniki obliczenia,
- snapshot nazwy roweru,
- trzy interpretacje: blisko celu, za mały, za duży,
- polskie treści statusów.

### Wpis Dziennika i snapshoty

`src/models/ride-journal-entry.js`

- warunki jazdy,
- snapshot profilu roweru,
- snapshot pomiaru,
- zgodność starszego pojedynczego snapshotu z nową tablicą,
- ograniczenie oceny do 1–5,
- status: brak pomiaru, ten sam dzień, pomiar historyczny.

## Parser liczb

`src/services/localized-number-parser.js`

Parser:

- akceptuje przecinek i kropkę,
- usuwa białe znaki na początku i końcu,
- rozpoznaje puste pole,
- odrzuca tekst, zapis wykładniczy, kilka separatorów i liczby nieskończone,
- obsługuje regułę liczby dodatniej i procentu między 0 a 100.

## Konfiguracja suwaków

`src/services/sag-slider-configuration.js`

| Pole | Widelec | Damper |
|---|---|---|
| Skok | 80–220 mm, krok 1, domyślnie 160 | 20–100 mm, krok 0,5, domyślnie 55 |
| Ugięcie | 0–skok, krok 1 | 0–skok, krok 0,5 |
| Cel SAG | 10–40%, krok 1, domyślnie 25 | 10–40%, krok 1, domyślnie 30 |
| Ciśnienie | 30–200 PSI, domyślnie 80 | 50–400 PSI, domyślnie 180 |

Moduł zapewnia również:

- ograniczenie wartości do zakresu,
- zaokrąglenie do kroku,
- rozszerzenie zakresu o wartość profilu,
- skalę ugięcia z 21 równymi znacznikami.

## Uzupełnianie z profilu

`src/services/calculator-profile-prefill.js`

- używa wartości wybranego roweru,
- nie przenosi danych między widelcem a damperem,
- przy braku danych wraca do wartości domyślnych,
- informuje, czy skok pochodzi z profilu.

## Kalkulator i walidacja

`src/services/sag-calculator.js`

Wzory:

```text
currentSag = measuredCompression / suspensionTravel × 100
targetCompression = suspensionTravel × targetSag / 100
differencePercentagePoints = currentSag − targetSag
differenceMillimeters = measuredCompression − targetCompression
```

Tolerancja wynosi ±1 punkt procentowy włącznie.

Walidacja obejmuje:

- brak wartości,
- tekst zamiast liczby,
- skok mniejszy lub równy 0,
- ugięcie ujemne,
- ugięcie większe niż skok,
- cel poza zakresem 0–100,
- niepoprawne opcjonalne ciśnienie,
- liczby nieskończone.

Obliczenie na żywo pozostaje ukryte, dopóki użytkownik świadomie nie ustawi ugięcia.

Przeniesiono też:

- szybkie cele 20%, 25%, 30% i Inny,
- stany przycisku zapisu: niedostępny, gotowy, zapisywanie, zapisany.

## Testy

Dodano `package.json` bez zewnętrznych zależności. Testy korzystają z `node:test`.

Uruchomienie:

```bash
npm test
```

Zestaw zawiera 32 testy jednostkowe w plikach:

- `tests/unit/localized-number-parser.test.js`,
- `tests/unit/sag-calculator.test.js`,
- `tests/unit/models.test.js`.

Sprawdzone przypadki obejmują między innymi:

- `40 / 160 = 25%`,
- przecinek i kropkę,
- brak danych,
- ugięcie większe od skoku,
- wartości ujemne i nieskończone,
- granicę tolerancji 1 punktu,
- osobne ustawienia widelca i dampera,
- snapshoty po zmianie profilu,
- status pomiaru z tego samego dnia i historycznego,
- ograniczenie oceny do 1–5.

Wszystkie 32 testy przeszły lokalnie przed zapisaniem zmian w repozytorium.

## Czego etap nie zmienia

- interfejs nadal pokazuje ekrany strukturalne z etapu 2,
- kalkulator nie jest jeszcze podłączony do ekranu Pomiar,
- brak IndexedDB i zapisu pomiarów,
- brak service workera i PWA,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 4 połączy sprawdzoną logikę z kompletnym ekranem Pomiar, ale zapis będzie jeszcze korzystał z tymczasowego interfejsu magazynu do czasu etapu 5.
