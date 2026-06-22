import { createElement } from "../../utils/dom.js";
import { createBikesView } from "../bikes/bikes-view.js";
import { createDataManagementView } from "./data-management-view.js";
import { createGuideDialog } from "./guide-dialog.js";
import { createPrivacyDialog } from "./privacy-dialog.js";
import { createSettingsDialog, renderSettingsDialog } from "./settings-dialog.js";

function actionCard({ icon, title, description, action, buttonText }) {
  const card = createElement("section", { className: "more-action-card app-card" });
  const heading = createElement("div", { className: "more-action-card__heading" });
  heading.append(
    createElement("span", { className: "more-action-card__icon", text: icon, attributes: { "aria-hidden": "true" } }),
    createElement("h3", { text: title })
  );
  card.append(
    heading,
    createElement("p", { text: description }),
    createElement("button", {
      className: "secondary-action",
      text: buttonText,
      attributes: { type: "button", "data-action": action }
    })
  );
  return card;
}

export function createMoreView({
  bikeStore,
  measurementStore,
  rideJournalStore,
  database,
  appSettingsStore,
  persistence
}) {
  const screen = createElement("section", {
    className: "screen more-screen",
    attributes: { "aria-labelledby": "more-heading" }
  });

  const intro = createElement("div", {
    className: "screen__intro",
    children: [
      createElement("h2", { className: "screen__title", text: "Więcej", attributes: { id: "more-heading" } }),
      createElement("p", { className: "screen__subtitle", text: "Profile rowerów, poradnik, wygląd, prywatność i kopie danych." })
    ]
  });

  const storageStatus = createElement("div", {
    className: "storage-status app-card",
    attributes: { role: "status" },
    children: [
      createElement("strong", { text: persistence.isPersistent ? "Dane są zapisywane na urządzeniu" : "Tryb sesyjny" }),
      createElement("span", {
        text: persistence.isPersistent
          ? "Profile, pomiary i wpisy Dziennika korzystają z lokalnej bazy IndexedDB."
          : "Dane znikną po zamknięciu karty. Od razu utwórz kopię JSON, jeżeli chcesz je zachować."
      })
    ]
  });
  storageStatus.dataset.tone = persistence.isPersistent ? "success" : "warning";

  const tools = createElement("section", {
    className: "more-tools",
    attributes: { "aria-labelledby": "more-tools-heading" }
  });
  tools.append(
    createElement("h2", { text: "Pomoc i ustawienia", attributes: { id: "more-tools-heading" } }),
    createElement("div", {
      className: "more-action-grid",
      children: [
        actionCard({ icon: "?", title: "Poradnik", description: "Pomiar SAG, interpretacja wyników, Historia i Dziennik krok po kroku.", action: "open-guide", buttonText: "Otwórz poradnik" }),
        actionCard({ icon: "◐", title: "Wygląd", description: "Wybierz wygląd systemowy, jasny albo ciemny.", action: "open-settings", buttonText: "Zmień wygląd" }),
        actionCard({ icon: "⌾", title: "Prywatność", description: "Sprawdź, gdzie zapisywane są dane i jak je usunąć lub zabezpieczyć.", action: "open-privacy", buttonText: "Informacje o prywatności" })
      ]
    })
  );

  const guideDialog = createGuideDialog();
  const settingsDialog = createSettingsDialog();
  const privacyDialog = createPrivacyDialog();
  const dataManagement = createDataManagementView({
    database,
    bikeStore,
    measurementStore,
    rideJournalStore,
    appSettingsStore
  });
  const about = createElement("section", {
    className: "about-card app-card",
    attributes: { "aria-labelledby": "about-heading" },
    children: [
      createElement("div", {
        className: "more-section-heading",
        children: [createElement("div", {
          children: [
            createElement("h2", { text: "O aplikacji", attributes: { id: "about-heading" } }),
            createElement("p", { text: "SAG Setup Logbook — wersja webowa 0.8.0" })
          ]
        })]
      }),
      createElement("p", { text: "Aplikacja pomaga mierzyć SAG, porównywać ustawienia i dokumentować jazdy. Nie zastępuje instrukcji producenta ani profesjonalnego serwisu zawieszenia." })
    ]
  });

  screen.append(
    intro,
    storageStatus,
    createBikesView({ bikeStore }),
    tools,
    dataManagement,
    about,
    guideDialog,
    settingsDialog,
    privacyDialog
  );

  screen.addEventListener("click", event => {
    const button = event.target.closest("button[data-action], button[data-appearance-mode]");
    if (!button) return;
    if (button.dataset.appearanceMode) {
      appSettingsStore.setAppearanceMode(button.dataset.appearanceMode);
      return;
    }
    const action = button.dataset.action;
    if (action === "open-guide") guideDialog.showModal();
    if (action === "close-guide") guideDialog.close();
    if (action === "open-settings") settingsDialog.showModal();
    if (action === "close-settings") settingsDialog.close();
    if (action === "open-privacy") privacyDialog.showModal();
    if (action === "close-privacy") privacyDialog.close();
  });

  appSettingsStore.subscribe(snapshot => renderSettingsDialog(settingsDialog, snapshot));
  return screen;
}
