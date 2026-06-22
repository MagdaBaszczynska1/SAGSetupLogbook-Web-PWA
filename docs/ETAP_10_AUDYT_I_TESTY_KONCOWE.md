# Etap 10 — końcowy audyt, testy integracyjne i gotowość do scalenia

## Wynik

Wersja `1.0.0-rc.1` jest przygotowana do przeglądu i bezpiecznego scalenia z `main` po zatwierdzeniu pull requestu.

Automatyczne kontrole obejmują:

- testy jednostkowe,
- audyt zależności npm,
- testy integracyjne w prawdziwej przeglądarce,
- pełne ścieżki E2E,
- Chromium na komputerze,
- WebKit z profilem iPhone 13,
- automatyczny audyt WCAG 2.2 AA,
- jasny i ciemny wygląd,
- responsywność i brak poziomego przewijania,
- obsługę klawiatury,
- IndexedDB,
- eksport i import,
- service worker, Cache Storage i działanie offline,
- integralność wydania i zgodność numerów wersji.

## Znalezione i naprawione problemy

### Krytyczne

Nie pozostał znany problem krytyczny.

### Wysokie

1. **Niespójne wersje aplikacji i service workera**
   - dodano jeden moduł `src/app/version.js`,
   - test integralności porównuje wersję pakietu, aplikacji i workera.

2. **Ryzyko uruchomienia skryptów inline**
   - kod inicjalizujący motyw przeniesiono do osobnego pliku,
   - dodano restrykcyjną Content Security Policy,
   - dodano politykę `no-referrer`.

3. **Niepełna weryfikacja PWA**
   - testy przeglądarkowe sprawdzają prawdziwy service worker, Cache Storage, scope i nawigację offline.

### Średnie

1. **Problemy dostępności formularzy i etykiet**
   - ujednolicono identyfikatory kontrolek i powiązania etykiet,
   - poprawiono semantykę okien dialogowych,
   - usunięto zewnętrzny `aria-live` z całej aplikacji, który powodował nadmierne komunikaty czytnika ekranu.

2. **Kontrast w ciemnym motywie**
   - audyt axe wykrył niewystarczający kontrast oznaczenia `Offline gotowe`,
   - kolor został zmieniony na token dostosowany do jasnego i ciemnego tła,
   - ponowny audyt Chromium i WebKit zakończył się powodzeniem.

3. **Ryzyko poziomego przewijania**
   - testy sprawdzają wszystkie cztery główne trasy na telefonie i komputerze,
   - długie nazwy profili są zawijane.

## Audyt funkcjonalny

### Pomiar

Sprawdzono:

- wybór profilu,
- widelec i damper,
- skok i docelowy SAG,
- ugięcie,
- walidację błędnych wartości,
- zapis pomiaru,
- ponowne odczytanie po przeładowaniu.

### Profile rowerów

Sprawdzono:

- dodawanie,
- edycję,
- usuwanie,
- puste i nieprawidłowe pola,
- automatyczne użycie profilu w kalkulatorze,
- zachowanie historycznych nazw i snapshotów.

### Historia

Sprawdzono:

- listę,
- wyszukiwanie,
- filtry,
- sortowanie,
- szczegóły,
- edycję,
- usuwanie pojedyncze i zbiorcze,
- przekazanie pomiaru do Dziennika.

### Dziennik

Sprawdzono:

- dodawanie wpisu z zapisanego pomiaru,
- edycję notatki,
- szczegóły,
- usuwanie wpisu,
- zachowanie źródłowego pomiaru po usunięciu wpisu,
- trwałość po przeładowaniu.

### Kopie danych

Sprawdzono:

- eksport JSON,
- eksport CSV,
- walidację importu,
- zastąpienie danych,
- odtworzenie profili, pomiarów i Dziennika,
- rollback po symulowanym błędzie.

## Audyt PWA i offline

Test w przeglądarce potwierdza:

- dostępność manifestu,
- rejestrację workera w prawidłowym scope,
- przejęcie strony przez service worker,
- istnienie wersjonowanego cache,
- obecność najważniejszych plików app shell,
- ponowne uruchomienie Chromium bez sieci,
- dostępność profilu i wszystkich tras offline,
- globalny komunikat offline,
- brak żądań do zewnętrznych domen.

WebKit w CI sprawdza działanie już kontrolowanej aplikacji po przejściu offline. Playwright WebKit nie emuluje w pełni ponownego uruchomienia aplikacji z ekranu początkowego iOS.

## Audyt dostępności

Automatyczny audyt axe działa dla:

- Pomiaru,
- Historii,
- Dziennika,
- Więcej,
- formularza profilu,
- ustawień wyglądu,
- jasnego motywu,
- ciemnego motywu,
- Chromium,
- WebKit/iPhone.

Blokowane są naruszenia o wpływie `serious` i `critical` dla reguł WCAG 2.0, 2.1 i 2.2 na poziomie A oraz AA.

Dodatkowo testowana jest:

- widoczność fokusu,
- obsługa głównej nawigacji klawiaturą,
- brak poziomego przewijania.

## Audyt bezpieczeństwa i prywatności

### Content Security Policy

Dokument startowy ogranicza źródła do własnej domeny:

```text
default-src 'self'
base-uri 'self'
object-src 'none'
script-src 'self'
style-src 'self'
img-src 'self' data:
connect-src 'self'
font-src 'self'
worker-src 'self'
manifest-src 'self'
form-action 'self'
```

### Dane użytkownika

- brak kont i chmury,
- brak analityki, reklam i zewnętrznych trackerów,
- brak żądań do zewnętrznych domen w testowanej ścieżce,
- dane pozostają w IndexedDB,
- eksport jest świadomą operacją użytkownika,
- CSV chroni tekst przed uruchamianiem jako formuły,
- import ponownie oblicza wyniki SAG,
- import ma walidację i rollback.

### Zależności

CI uruchamia:

```text
npm audit --audit-level=high
```

Scalenie jest blokowane przez podatność wysoką lub krytyczną.

## Audyt struktury i utrzymania

Projekt pozostaje podzielony na:

- modele,
- usługi i walidację,
- store,
- warstwę trwałości,
- widoki,
- komponenty,
- style funkcjonalne,
- moduł PWA,
- testy jednostkowe i E2E.

Nie dodano frameworka aplikacyjnego. Dla obecnej wielkości projektu modułowa architektura JavaScript pozostaje proporcjonalna i łatwa do wdrożenia na statycznym hostingu.

## Automatyzacja przed scaleniem

### Web tests

Workflow sprawdza:

- instalację zależności z lockfile,
- `npm audit`,
- wszystkie testy jednostkowe.

### Browser audit

Workflow sprawdza:

- Chromium,
- WebKit,
- testy integracyjne,
- E2E,
- dostępność,
- offline,
- eksport/import.

Przy błędzie zapisuje raport HTML, zrzuty ekranu, wideo oraz trace Playwrighta.

## Warunki bezpiecznego scalenia

Przed scaleniem pull requestu muszą być spełnione wszystkie warunki:

- [x] `Web tests` zakończone powodzeniem,
- [x] `Browser audit` zakończony powodzeniem,
- [x] brak nierozwiązanych komentarzy review,
- [x] brak konfliktów z `main`,
- [x] pull request jest możliwy do scalenia,
- [x] wersja ma oznaczenie release candidate,
- [x] dokumentacja etapów 1–10 jest obecna,
- [ ] ręczna akceptacja wyglądu przez właścicielkę aplikacji,
- [ ] opcjonalny test na fizycznym iPhonie przed publikacją produkcyjną.

## Zalecany sposób scalenia

Użyć **Squash and merge**, aby 259 małych commitów etapowych zamienić w jeden czytelny commit wydania.

Proponowany tytuł commita:

```text
release: rebuild SAG Setup Logbook web app from iOS source
```

Po scaleniu:

1. poczekać na publikację GitHub Pages,
2. otworzyć stronę w Safari bez używania starej ikony,
3. potwierdzić pojawienie się nowej wersji,
4. wykonać jeden pomiar testowy,
5. sprawdzić ponowne uruchomienie offline,
6. dopiero wtedy usunąć starą ikonę i dodać aplikację ponownie do ekranu początkowego.

## Ograniczenia końcowe

- CI nie jest fizycznym iPhonem,
- zachowanie systemowego arkusza udostępniania i instalacji musi zostać potwierdzone ręcznie,
- dane nie synchronizują się między urządzeniami,
- cache aplikacji nie zastępuje kopii JSON,
- aplikacja nie zastępuje instrukcji producenta ani serwisu zawieszenia.
