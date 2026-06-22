import { createElement } from "../../utils/dom.js";

function guideSection(title, content) {
  const details = createElement("details", { className: "guide-section" });
  const summary = createElement("summary", { text: title });
  const body = createElement("div", { className: "guide-section__body" });
  content.forEach(item => {
    if (item.type === "list") {
      const list = createElement("ol", { className: "guide-list" });
      item.items.forEach(text => list.append(createElement("li", { text })));
      body.append(list);
    } else {
      body.append(createElement("p", { text: item.text }));
    }
  });
  details.append(summary, body);
  return details;
}

export function createGuideDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog more-dialog guide-dialog",
    attributes: { "aria-labelledby": "guide-title" }
  });
  const panel = createElement("div", { className: "dialog-panel more-dialog-panel" });
  const heading = createElement("div", { className: "dialog-heading" });
  heading.append(
    createElement("h3", { text: "Poradnik", attributes: { id: "guide-title" } }),
    createElement("button", { text: "×", attributes: { type: "button", "data-action": "close-guide", "aria-label": "Zamknij poradnik" } })
  );
  const intro = createElement("p", {
    className: "more-dialog-intro",
    text: "Najważniejsze kroki od przygotowania roweru do zapisania ustawień po jeździe."
  });
  const sections = createElement("div", { className: "guide-sections" });
  sections.append(
    guideSection("1. Dodaj profil roweru", [
      { type: "text", text: "W zakładce Więcej dodaj profil i wpisz znane ustawienia widelca oraz dampera. Wszystkie dane zawieszenia są opcjonalne." },
      { type: "list", items: [
        "Dla widelca podaj skok goleni w milimetrach.",
        "Dla dampera podaj skok tłoczyska, nie skok tylnego koła.",
        "Docelowy SAG i ciśnienie możesz zmieniać później."
      ] }
    ]),
    guideSection("2. Wykonaj pomiar SAG", [
      { type: "text", text: "Załóż pełny strój, ustaw rower na płaskim podłożu i odblokuj zawieszenie. O-ring ustaw przy uszczelce." },
      { type: "list", items: [
        "Wybierz profil oraz Widelec albo Damper.",
        "Wprowadź skok i docelowy SAG.",
        "Przyjmij naturalną pozycję na rowerze bez hamowania i bujania.",
        "Zejdź ostrożnie, zmierz przesunięcie O-ringu i wpisz ugięcie.",
        "Zapisz wynik, gdy aplikacja pokaże prawidłowe obliczenie."
      ] }
    ]),
    guideSection("3. Odczytaj wynik", [
      { type: "text", text: "Aplikacja porównuje aktualny SAG z celem. Różnica do 1 punktu procentowego włącznie jest oznaczana jako bliska celowi." },
      { type: "text", text: "Za mały SAG zwykle oznacza zbyt twarde ustawienie, a za duży — zbyt miękkie. Zmieniaj ciśnienie małymi krokami i wykonuj ponowny pomiar." }
    ]),
    guideSection("4. Korzystaj z Historii", [
      { type: "text", text: "Historia przechowuje wszystkie zapisane pomiary. Możesz je filtrować, sortować, otwierać, edytować i usuwać." },
      { type: "text", text: "Stare pomiary zachowują historyczną nazwę roweru nawet po zmianie lub usunięciu profilu." }
    ]),
    guideSection("5. Zapisz jazdę w Dzienniku", [
      { type: "text", text: "Wpis Dziennika zawiera trasę, datę, warunki, ocenę, notatkę i opcjonalne pomiary SAG." },
      { type: "text", text: "Do wpisu można dołączyć najwyżej jeden pomiar widelca i jeden dampera. Aplikacja sugeruje pomiary wybranego roweru z dnia jazdy." }
    ]),
    guideSection("6. Twórz kopie danych", [
      { type: "text", text: "Eksport JSON zawiera pełną kopię profili, pomiarów, Dziennika i wyglądu. Plik CSV jest raportem do arkusza kalkulacyjnego i nie służy do importu." },
      { type: "text", text: "Przed większymi zmianami lub usuwaniem danych zapisz kopię JSON poza przeglądarką." }
    ]),
    guideSection("Ważne ograniczenie", [
      { type: "text", text: "Kalkulator pomaga dokumentować ustawienia, ale nie zastępuje instrukcji producenta ani oceny serwisu. Nie przekraczaj zakresów ciśnienia podanych dla zawieszenia." }
    ])
  );
  panel.append(heading, intro, sections);
  dialog.append(panel);
  return dialog;
}
