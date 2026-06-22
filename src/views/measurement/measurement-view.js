import { createElement } from "../../utils/dom.js";
import { createMeasurementController } from "./measurement-controller.js";
import { createMeasurementToolbar, createConfigurationCards } from "./measurement-configuration.js";
import { createCompressionCard, createTargetCard, createAdditionalDataCard } from "./measurement-controls.js";
import { createResultsSection } from "./measurement-result-card.js";
import { createSaveBar } from "./measurement-save-bar.js";
import { createTravelDialog } from "./measurement-travel-dialog.js";
import { createMeasurementHelpDialog, createTargetHelpDialog } from "./measurement-help-dialogs.js";
import { createResetDialog, createSavedDialog } from "./measurement-confirmation-dialogs.js";
import { bindMeasurementEvents } from "./measurement-events.js";
import { renderMeasurement } from "./measurement-render.js";

export function createMeasurementView({ bikeStore, measurementStore, onAddRide = () => {} }) {
  const controller = createMeasurementController({
    bikes: bikeStore.getAll(),
    measurementStore
  });

  const screen = createElement("section", {
    className: "screen measurement-screen",
    attributes: { "aria-labelledby": "measurement-heading" }
  });

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
    createMeasurementToolbar(),
    stack,
    createSaveBar(),
    notice,
    createTravelDialog(),
    createMeasurementHelpDialog(),
    createTargetHelpDialog(),
    createResetDialog(),
    createSavedDialog()
  );

  const travelNumber = screen.querySelector('[data-field="travel-number"]');
  screen.querySelector('[data-action="apply-travel"]').addEventListener("click", event => {
    if (!travelNumber.reportValidity()) event.stopImmediatePropagation();
  }, { capture: true });

  bindMeasurementEvents(screen, controller);
  controller.subscribe(snapshot => renderMeasurement(screen, snapshot));
  bikeStore.subscribe(snapshot => controller.setBikes(snapshot.records));

  screen.addEventListener("measurement:add-ride", event => {
    const measurement = event.detail?.measurement;
    if (!measurement) {
      notice.hidden = false;
      notice.textContent = "Nie udało się przekazać zapisanego pomiaru do Dziennika.";
      return;
    }
    onAddRide(measurement);
  });

  return screen;
}
