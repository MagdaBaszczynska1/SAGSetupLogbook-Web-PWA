import { createElement } from "../../utils/dom.js";
import { createBikesView } from "../bikes/bikes-view.js";

export function createMoreView({ bikeStore, persistence }) {
  const screen = createElement("section", {
    className: "screen more-screen",
    attributes: { "aria-labelledby": "more-heading" }
  });

  const intro = createElement("div", {
    className: "screen__intro",
    children: [
      createElement("h2", { className: "screen__title", text: "Więcej", attributes: { id: "more-heading" } }),
      createElement("p", { className: "screen__subtitle", text: "Zarządzaj profilami rowerów oraz ustawieniami aplikacji." })
    ]
  });

  const storageStatus = createElement("div", {
    className: "storage-status app-card",
    attributes: { role: "status" },
    children: [
      createElement("strong", { text: persistence.isPersistent ? "Dane są zapisywane na urządzeniu" : "Tryb sesyjny" }),
      createElement("span", {
        text: persistence.isPersistent
          ? "Profile, pomiary i wpisy Dziennika korzystają z trwałej bazy IndexedDB."
          : "Dane znikną po zamknięciu karty. Sprawdź ustawienia prywatności przeglądarki."
      })
    ]
  });
  storageStatus.dataset.tone = persistence.isPersistent ? "success" : "warning";

  const future = createElement("section", {
    className: "more-links app-card",
    children: [
      createElement("h3", { text: "Pozostałe funkcje" }),
      createElement("p", { text: "Poradnik, ustawienia, prywatność i kopie danych zostaną podłączone w kolejnych etapach." })
    ]
  });

  screen.append(intro, storageStatus, createBikesView({ bikeStore }), future);
  return screen;
}
