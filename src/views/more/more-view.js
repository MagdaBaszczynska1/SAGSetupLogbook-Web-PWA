import { createElement } from "../../utils/dom.js";
import { createStageCard } from "../../components/ui/stage-card.js";

export function createMoreView() {
  return createElement("section", {
    className: "screen",
    attributes: { "aria-labelledby": "more-heading" },
    children: [
      createElement("div", {
        className: "screen__intro",
        children: [
          createElement("h2", {
            className: "screen__title",
            text: "Więcej",
            attributes: { id: "more-heading" }
          }),
          createElement("p", {
            className: "screen__subtitle",
            text: "Profile rowerów, poradnik i ustawienia mają osobne miejsce w strukturze aplikacji."
          })
        ]
      }),
      createStageCard({
        title: "Czysty ekran Więcej",
        description: "W następnym zakresie pojawią się osobne widoki konfiguracji zamiast funkcji doklejonych do jednego pliku.",
        items: [
          "profile rowerów",
          "poradnik pomiaru",
          "ustawienia, prywatność i kopia danych"
        ]
      })
    ]
  });
}
