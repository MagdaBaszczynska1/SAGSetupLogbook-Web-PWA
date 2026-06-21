import { createElement } from "../../utils/dom.js";
import { createStageCard } from "../../components/ui/stage-card.js";

export function createJournalView() {
  return createElement("section", {
    className: "screen",
    attributes: { "aria-labelledby": "journal-heading" },
    children: [
      createElement("div", {
        className: "screen__intro",
        children: [
          createElement("h2", {
            className: "screen__title",
            text: "Dziennik",
            attributes: { id: "journal-heading" }
          }),
          createElement("p", {
            className: "screen__subtitle",
            text: "Wpisy z jazd będą zachowywać historyczne kopie ustawień roweru i pomiarów."
          })
        ]
      }),
      createStageCard({
        title: "Czysty ekran Dziennika",
        description: "Ten moduł nie udaje jeszcze gotowej funkcji. Zostanie połączony z profilami i pomiarami po utworzeniu magazynów danych.",
        items: [
          "trasa, data, warunki i ocena",
          "powiązanie pomiarów Widelec/Damper",
          "snapshot ustawień roweru"
        ]
      })
    ]
  });
}
