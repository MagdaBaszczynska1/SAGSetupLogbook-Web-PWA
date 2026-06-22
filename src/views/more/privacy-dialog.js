import { createElement } from "../../utils/dom.js";

function privacyItem(title, text) {
  return createElement("section", {
    className: "privacy-item",
    children: [
      createElement("h4", { text: title }),
      createElement("p", { text })
    ]
  });
}

export function createPrivacyDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog more-dialog privacy-dialog",
    attributes: { "aria-labelledby": "privacy-title" }
  });
  const panel = createElement("div", { className: "dialog-panel more-dialog-panel" });
  const heading = createElement("div", { className: "dialog-heading" });
  heading.append(
    createElement("h3", { text: "Prywatność", attributes: { id: "privacy-title" } }),
    createElement("button", { text: "×", attributes: { type: "button", "data-action": "close-privacy", "aria-label": "Zamknij informacje o prywatności" } })
  );
  const intro = createElement("div", {
    className: "privacy-summary",
    attributes: { role: "status" },
    children: [
      createElement("strong", { text: "Dane pozostają w tej przeglądarce" }),
      createElement("span", { text: "Aplikacja nie wymaga konta i nie wysyła profili, pomiarów ani wpisów Dziennika na serwer." })
    ]
  });
  const items = createElement("div", { className: "privacy-items" });
  items.append(
    privacyItem("Przechowywane dane", "Profile rowerów, pomiary SAG i wpisy Dziennika są zapisywane lokalnie w IndexedDB. Ustawienie wyglądu jest zapisywane w localStorage."),
    privacyItem("Brak analityki i reklam", "W tej wersji nie ma systemu logowania, analityki, śledzenia zachowania ani reklam."),
    privacyItem("Kopie danych", "Pliki JSON i CSV powstają dopiero po wybraniu eksportu. To użytkownik decyduje, gdzie je zapisze i komu je udostępni."),
    privacyItem("Import", "Importowany plik jest odczytywany lokalnie. Przed zastąpieniem danych aplikacja sprawdza strukturę pliku i tworzy kopię ratunkową."),
    privacyItem("Usunięcie danych", "Dane można usuwać w odpowiednich sekcjach aplikacji. Usunięcie danych witryny w ustawieniach przeglądarki usuwa również lokalną bazę aplikacji."),
    privacyItem("Ograniczenia przeglądarki", "Tryb prywatny, czyszczenie pamięci witryny albo ograniczenia systemowe mogą spowodować utratę lokalnych danych. Regularny eksport JSON jest najbezpieczniejszą kopią zapasową.")
  );
  panel.append(heading, intro, items);
  dialog.append(panel);
  return dialog;
}
