import { createElement } from "../../utils/dom.js";
import { createStageCard } from "../../components/ui/stage-card.js";

export function createMeasurementView() {
  return createElement("section", {
    className: "screen",
    attributes: { "aria-labelledby": "measurement-heading" },
    children: [
      createElement("div", {
        className: "screen__intro",
        children: [
          createElement("h2", {
            className: "screen__title",
            text: "Pomiar SAG",
            attributes: { id: "measurement-heading" }
          }),
          createElement("p", {
            className: "screen__subtitle",
            text: "Tutaj zostanie przeniesiony kalkulator z aplikacji natywnej."
          })
        ]
      }),
      createStageCard({
        title: "Czysty ekran Pomiaru",
        description: "W tym etapie widok nie wykonuje jeszcze obliczeń. Logika kalkulatora zostanie dodana dopiero po przeniesieniu modeli i walidacji.",
        items: [
          "wybór roweru i typu zawieszenia",
          "skok, ugięcie i docelowy SAG",
          "wynik oraz zapis pomiaru"
        ]
      })
    ]
  });
}
