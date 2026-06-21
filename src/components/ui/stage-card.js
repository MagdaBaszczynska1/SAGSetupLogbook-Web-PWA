import { createElement } from "../../utils/dom.js";

export function createStageCard({ title, description, items = [] }) {
  const list = createElement("ul", { className: "stage-card__list" });
  for (const item of items) {
    list.append(createElement("li", { text: item }));
  }

  return createElement("section", {
    className: "stage-card",
    children: [
      createElement("span", {
        className: "stage-card__eyebrow",
        text: "Etap 2 — struktura"
      }),
      createElement("h2", { className: "stage-card__title", text: title }),
      createElement("p", { className: "stage-card__description", text: description }),
      list
    ]
  });
}
