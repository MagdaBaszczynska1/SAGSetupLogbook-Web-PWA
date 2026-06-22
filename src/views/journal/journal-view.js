import { createElement } from "../../utils/dom.js";
import { createStageCard } from "../../components/ui/stage-card.js";
import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { formatDisplayNumber } from "../../utils/formatters.js";

export function createJournalView({ rideDraftStore }) {
  const screen = createElement("section", {
    className: "screen",
    attributes: { "aria-labelledby": "journal-heading" }
  });

  const intro = createElement("div", {
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
  });

  const selectedMeasurement = createElement("section", {
    className: "app-card",
    attributes: { "data-region": "journal-source-measurement", role: "status", hidden: "" }
  });
  const stage = createStageCard({
    title: "Czysty ekran Dziennika",
    description: "Pełny formularz wpisu zostanie zbudowany w etapie 7. Wybrany pomiar z Historii jest już przekazywany do tego modułu.",
    items: [
      "trasa, data, warunki i ocena",
      "powiązanie pomiarów Widelec/Damper",
      "snapshot ustawień roweru"
    ]
  });

  screen.append(intro, selectedMeasurement, stage);

  rideDraftStore.subscribe(measurement => {
    if (!measurement) {
      selectedMeasurement.hidden = true;
      selectedMeasurement.replaceChildren();
      return;
    }
    const definition = getSuspensionDefinition(measurement.suspensionType);
    selectedMeasurement.hidden = false;
    selectedMeasurement.replaceChildren(
      createElement("strong", { text: "Pomiar wybrany do wpisu Dziennika" }),
      createElement("p", {
        text: `${measurement.bikeNameSnapshot || "Bez profilu"} • ${definition.title} • ${formatDisplayNumber(measurement.currentSag)}% SAG`
      }),
      createElement("p", { text: "Formularz zapisu wpisu zostanie podłączony w etapie 7." })
    );
  });

  return screen;
}
