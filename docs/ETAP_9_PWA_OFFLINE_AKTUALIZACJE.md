# Etap 9 — PWA, offline i bezpieczne aktualizacje

## Cel

Uruchomienie kompletnej Progressive Web App bez powrotu do problemu, w którym stary service worker wyświetlał nowy interfejs z niezgodnymi plikami JavaScript.

Etap obejmuje:

- manifest instalacyjny,
- ikony zwykłe i maskowalne,
- metadane Safari/iOS,
- instalację aplikacji,
- pełny app shell offline,
- globalny status połączenia,
- kontrolowane aktualizacje,
- migrację ze starego service workera,
- testy listy precache i cyklu życia workera.

## Główne pliki

```text
manifest.webmanifest
sw.js
src/pwa/pwa-manager.js
src/components/pwa/pwa-status.js
src/views/more/pwa-install-view.js
src/styles/pwa.css
```

Rozszerzono także:

```text
index.html
src/app/main.js
src/components/layout/app-shell.js
src/views/more/more-view.js
src/styles/index.css
README.md
```

## Manifest

Manifest definiuje:

- stabilny identyfikator aplikacji,
- nazwę pełną i skróconą,
- język polski,
- start w trasie `Pomiar`,
- scope ograniczony do katalogu aplikacji,
- tryb `standalone`,
- orientację pionową,
- kolor tła i motywu,
- kategorie aplikacji,
- ikony 192 px, skalowalną ikonę zwykłą i maskowalną,
- skróty do Pomiaru, Historii oraz Dziennika.

Wszystkie adresy są względne. Dzięki temu manifest działa zarówno na własnej domenie, jak i pod ścieżką repozytorium GitHub Pages.

## iPhone i iPad

`index.html` zawiera:

- `apple-mobile-web-app-capable`,
- tytuł aplikacji dla ekranu początkowego,
- styl paska statusu,
- `apple-touch-icon`,
- standardowy manifest,
- ikony SVG i PNG.

Safari nie udostępnia natywnego zdarzenia instalacyjnego używanego przez część przeglądarek. Dlatego ekran `Więcej` pokazuje instrukcję:

1. otwórz stronę w Safari,
2. wybierz `Udostępnij`,
3. wybierz `Do ekranu początkowego`,
4. zatwierdź przez `Dodaj`.

Jeżeli przeglądarka udostępnia zdarzenie `beforeinstallprompt`, aplikacja zamiast instrukcji pokazuje przycisk instalacji.

## Zakres service workera

Adres workera i scope są obliczane względem `import.meta.url` modułu PWA. Nie zakładają, że aplikacja znajduje się w katalogu głównym domeny.

Rejestracja używa:

```text
updateViaCache: none
```

Skrypt service workera jest więc sprawdzany z pominięciem zwykłego cache HTTP. Zmniejsza to ryzyko, że przeglądarka nie zauważy nowej wersji.

## App shell offline

Service worker zapisuje przed aktywacją:

- dokument aplikacji,
- manifest,
- ikony,
- wszystkie arkusze stylów,
- główny moduł JavaScript,
- router i kontekst danych,
- modele,
- usługi,
- magazyny,
- narzędzia,
- wszystkie cztery widoki,
- wszystkie dialogi i komponenty PWA.

Instalacja workera kończy się niepowodzeniem, jeżeli choć jeden wymagany zasób nie może zostać pobrany. Nie jest wtedy aktywowana niekompletna wersja offline.

Po udanej instalacji każda nawigacja w scope aplikacji otrzymuje zapisany `index.html`. Routing po fragmencie `#/...` działa identycznie online i offline.

## Strategie żądań

### Nawigacja

Cache-first do wersjonowanego app shell. Zapewnia spójność dokumentu z modułami aktywnego workera.

### Zasoby app shell

Cache-first z cache konkretnej wersji. Aktywny worker nie miesza plików pochodzących z dwóch wdrożeń.

### Pozostałe żądania tej samej domeny

Network-first z fallbackiem do cache.

### Zewnętrzne domeny

Service worker ich nie przechwytuje.

### Operacje zapisu

Żądania inne niż `GET` nie są przechwytywane. Dane aplikacji nadal trafiają bezpośrednio do IndexedDB.

## Wersjonowanie cache

Każde wydanie app shell ma nową nazwę cache, na przykład:

```text
sag-setup-logbook-app-v9-20260622-2
```

Podczas aktywacji usuwane są stare cache o prefiksach:

```text
sag-setup-logbook-
sag-logbook-
```

Drugi prefiks pochodzi ze starszej, opublikowanej wersji aplikacji.

Obce cache tej samej domeny nie są usuwane.

## Bezpieczna aktualizacja

Zwykła aktualizacja nie wywołuje automatycznie `skipWaiting`.

Przebieg:

1. przeglądarka wykrywa inny plik `sw.js`,
2. nowy worker pobiera kompletny app shell do nowego cache,
3. worker przechodzi w stan oczekiwania,
4. aplikacja pokazuje komunikat `Dostępna nowa wersja`,
5. użytkownik wybiera `Zaktualizuj`,
6. aplikacja wysyła komunikat `SKIP_WAITING`,
7. nowy worker aktywuje się i przejmuje klientów,
8. strona przeładowuje się jeden raz,
9. wszystkie moduły pochodzą z jednej wersji cache.

Takie rozwiązanie zapobiega przełączeniu workera w trakcie edycji formularza albo zapisu danych.

## Sprawdzanie aktualizacji

Aplikacja sprawdza aktualizację:

- po rejestracji workera,
- po powrocie karty na pierwszy plan,
- po odzyskaniu połączenia,
- po ponownym ustawieniu fokusu na oknie,
- ręcznie z zakładki `Więcej`.

Automatyczne sprawdzanie jest ograniczone czasowo, aby seria zdarzeń `focus` i `visibilitychange` nie powodowała nadmiernej liczby zapytań.

## Migracja starej opublikowanej PWA

Stary interfejs nie posiadał kontrolowanego komunikatu aktualizacji. Nowy worker podczas instalacji sprawdza obecność cache z prefiksem:

```text
sag-logbook-
```

Jeżeli go znajdzie, traktuje instalację jako jednorazową migrację i może pominąć oczekiwanie. Po aktywacji usuwa stare cache i przejmuje aplikację.

To zachowanie dotyczy wyłącznie migracji z architektury legacy. Wszystkie kolejne aktualizacje wersji przebudowanej ponownie wymagają decyzji użytkownika.

## Status offline

Po utracie połączenia aplikacja pokazuje globalny komunikat:

```text
Tryb offline
```

Komunikat wyjaśnia, że używana jest zapisana wersja aplikacji. Nie sugeruje utraty danych, ponieważ profile, pomiary i Dziennik korzystają z lokalnej bazy.

Po odzyskaniu sieci komunikat znika, a aplikacja sprawdza dostępność aktualizacji.

## Ekran instalacji w Więcej

Sekcja pokazuje:

- obsługę lub brak obsługi service workera,
- stan przygotowania plików offline,
- wykrycie uruchomienia w trybie standalone,
- natywny przycisk instalacji, jeśli jest dostępny,
- instrukcję Safari,
- ręczne sprawdzenie aktualizacji,
- przycisk aktywacji oczekującej wersji,
- komunikaty błędów rejestracji.

Brak service workera nie blokuje podstawowej aplikacji. Użytkownik otrzymuje informację, że wymagane będzie połączenie.

## Dostępność

- komunikaty offline i aktualizacji używają `aria-live`,
- przyciski mają jednoznaczne etykiety,
- instrukcja instalacji jest listą kroków,
- status gotowości zawiera tekst, a nie tylko kolor,
- baner aktualizacji pozostaje dostępny z klawiatury,
- ustawienie ograniczenia ruchu nadal wyłącza animacje,
- banery nie zasłaniają dolnej nawigacji i uwzględniają safe area iPhone’a.

## Testy

Etap dodaje testy obejmujące:

- wymagane pola manifestu,
- istnienie każdej ikony,
- poprawność skrótów tras,
- brak Service Worker API,
- scope oraz `updateViaCache`,
- oczekującą aktualizację,
- świadome wysłanie `SKIP_WAITING`,
- jednokrotne przeładowanie po `controllerchange`,
- natywny prompt instalacji,
- zmiany online i offline,
- istnienie każdego pliku precache,
- pobranie kompletnego app shell,
- brak automatycznego przejęcia zwykłej aktualizacji,
- czyszczenie wyłącznie cache aplikacji,
- odpowiedź nawigacyjną offline,
- obsługę komunikatów workera.

Pełny zestaw `npm test` jest uruchamiany w GitHub Actions.

## Ograniczenia etapu

- testy workera w Node sprawdzają logikę, ale nie zastępują prawdziwego Cache Storage,
- instalacja na iPhonie musi zostać potwierdzona ręcznie w Safari,
- trzeba wykonać próbę zamknięcia i ponownego uruchomienia aplikacji bez sieci,
- trzeba sprawdzić aktualizację z wersji zainstalowanej na ekranie początkowym,
- cache PWA nie jest kopią danych użytkownika; za kopię odpowiada eksport JSON,
- gałąź `main` nie została zmieniona.

## Następny etap

Etap 10 przeprowadzi testy integracyjne i E2E w przeglądarce, audyt dostępności, bezpieczeństwa, responsywności oraz końcową kontrolę zgodności z aplikacją natywną.
