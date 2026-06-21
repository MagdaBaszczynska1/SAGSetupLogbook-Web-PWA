import { createElement } from "../../utils/dom.js";
import { stage4BikeProfiles } from "../../stores/stage4-demo-data.js";
import { temporaryMeasurementStore } from "../../stores/temporary-measurement-store.js";
import { createMeasurementController } from "./measurement-controller.js";
import { createMeasurementHeaderActions, createConfigurationCards } from "./measurement-configuration.js";
import { createCompressionCard, createTargetCard, createAdditionalDataCard } from "./measurement-controls.js";
import { createResultsSection } from "./measurement-result-card.js";
import { createSaveBar } from "./measurement-save-bar.js";
import { createTravelDialog } from "./measurement-travel-dialog.js";
import { createMeasurementHelpDialog, createTargetHelpDialog } from "./measurement-help-dialogs.js";
import { createResetDialog, createSavedDialog } from "./measurement-confirmation-dialogs.js";
import { bindMeasurementEvents } from "./measurement-events.js";
import { renderMeasurement } from "./measurement-render.js";

export function createMeasurementView() {
  const controller = createMeasurementController({
    bikes: stage4BikeProfiles,
    measurementStore: temporaryMeasurementStore
  });

  const screen = createElement("section", {
    className: "screen measurement-screen",
    attributes: { "aria-labelledby": "measurement-heading" }
  });
  screen.headerActions = createMeasurementHeaderActions();

  const stack = createElement("div", { className: "measurement-stack" });
  stack.append(
    createConfigurationCards(),
    createCompressionCard(),
    createTargetCard(),
    createAdditionalDataCard(),
    createResultsSection()
  );

  const notice = createElement("div", {
    className: "stage4-notice",
    attributes: { role: "status", hidden: "" }
  });

  screen.append(
    stack,
    createSaveBar(),
    notice,
    createTravelDialog(),
    createMeasurementHelpDialog(),
    createTargetHelpDialog(),
    createResetDialog(),
    createSavedDialog()
  );

  bindMeasurementEvents(screen, controller);
  controller.subscribe(snapshot => renderMeasurement(screen, snapshot));

  screen.addEventListener("measurement:add-ride", () => {
    notice.hidden = false;
    notice.textContent = "Pomiar jest gotowy. Formularz Dziennika zostanie podłączony w etapie 7.";
    window.clearTimeout(screen.noticeTimer);
    screen.noticeTimer = window.setTimeout(() => {
      notice.hidden = true;
    }, 4200);
  });

  return screen;
}
