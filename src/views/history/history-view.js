import { createElement } from "../../utils/dom.js";
import { createStageCard } from "../../components/ui/stage-card.js";

export function createHistoryView() {
  return createElement("section", {
    className: "screen",
    attributes: { "aria-labelledby": "history-heading" },
    children: [
      createElement("div", {
        className: "screen__intro",
        children: [
          createElement("h2", {
            className: "screen__title",
            text: "Historia",
            attributes: { id: "history-heading" }
          }),
          createElement("p", {
            className: "screen__subtitle",
            text: "Lista zapisanych pomiarów zostanie podłączona do magazynu danych w kolejnych etapach."
          })
        ]
      }),
      createStageCard({
        title: "Czysty ekran Historii",
        description: "Widok ma już własny moduł i trasę, ale celowo nie korzysta jeszcze ze starych danych prototypu.",
        items: [
          "filtry i sortowanie",
          "szczegóły oraz edycja pomiaru",
          "pusty stan prowadzący do Pomiaru"
        ]
      })
    ]
  });
}
