# SAG Setup Logbook — prototyp PWA

To osobny projekt webowy. Nie zmienia repozytorium ani kodu aplikacji iOS.

## Zawiera
- kalkulator SAG dla widelca i dampera,
- profile rowerów,
- historię pomiarów,
- zapis lokalny w przeglądarce,
- eksport i import JSON,
- manifest PWA,
- działanie offline po pierwszym otwarciu.

## Uruchomienie lokalne
W katalogu projektu uruchom:

```bash
python3 -m http.server 8080
```

Następnie otwórz `http://localhost:8080`.

## Publikacja
Katalog można opublikować jako statyczną stronę HTTPS, np. w Cloudflare Pages, Netlify albo GitHub Pages.
