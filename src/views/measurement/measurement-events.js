import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { getTravelSliderConfiguration } from "../../services/sag-slider-configuration.js";
import { formatCompactNumber } from "../../utils/formatters.js";

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

export function bindMeasurementEvents(root, controller) {
  const travelDialog = root.querySelector('[data-dialog="travel"]');
  const helpDialog = root.querySelector('[data-dialog="help"]');
  const targetHelpDialog = root.querySelector('[data-dialog="target-help"]');
  const resetDialog = root.querySelector('[data-dialog="reset"]');
  const savedDialog = root.querySelector('[data-dialog="saved"]');

  root.querySelector('[data-field="bike"]').addEventListener("change", event => {
    controller.setSelectedBikeID(event.target.value || null);
  });

  root.querySelectorAll("[data-suspension]").forEach(button => {
    button.addEventListener("click", () => controller.setSuspensionType(button.dataset.suspension));
  });

  root.querySelector('[data-action="compression-minus"]').addEventListener("click", () => {
    controller.adjustMeasuredCompression(-1);
  });
  root.querySelector('[data-action="compression-plus"]').addEventListener("click", () => {
    controller.adjustMeasuredCompression(1);
  });
  root.querySelector('[data-field="compression"]').addEventListener("input", event => {
    controller.setMeasuredCompression(Number(event.target.value));
  });

  root.querySelectorAll("[data-target-preset]").forEach(button => {
    button.addEventListener("click", () => controller.selectTargetPreset(button.dataset.targetPreset));
  });
  root.querySelector('[data-field="target"]').addEventListener("input", event => {
    controller.setCustomTargetSag(Number(event.target.value));
  });

  root.querySelector('[data-action="toggle-additional"]').addEventListener("click", () => {
    const state = controller.getSnapshot();
    controller.setAdditionalDataExpanded(!state.isAdditionalDataExpanded);
  });
  root.querySelector('[data-field="pressure-enabled"]').addEventListener("change", event => {
    controller.setPressureEnabled(event.target.checked);
  });
  root.querySelector('[data-field="pressure"]').addEventListener("input", event => {
    controller.setPressure(Number(event.target.value));
  });

  root.querySelector('[data-action="edit-travel"]').addEventListener("click", () => {
    const state = controller.getSnapshot();
    const definition = getSuspensionDefinition(state.suspensionType);
    const configuration = getTravelSliderConfiguration(state.suspensionType);
    const slider = root.querySelector('[data-field="travel-draft"]');
    const number = root.querySelector('[data-field="travel-number"]');
    slider.min = Math.min(configuration.minimum, state.suspensionTravel);
    slider.max = Math.max(configuration.maximum, state.suspensionTravel);
    slider.step = configuration.step;
    slider.value = state.suspensionTravel;
    number.min = slider.min;
    number.max = slider.max;
    number.step = slider.step;
    number.value = state.suspensionTravel;
    root.querySelector('[data-text="travel-dialog-title"]').textContent = `Zmień: ${definition.travelFieldTitle.toLocaleLowerCase("pl-PL")}`;
    root.querySelector('[data-text="travel-slider-title"]').textContent = definition.travelFieldTitle;
    root.querySelector('[data-text="travel-draft-value"]').textContent = `${formatCompactNumber(state.suspensionTravel)} mm`;
    root.querySelector('[data-text="travel-help"]').textContent = state.suspensionType === "fork"
      ? "Podaj pełny skok widelca określony przez producenta."
      : "Podaj skok tłoczyska dampera, nie skok tylnego koła.";
    openDialog(travelDialog);
  });

  function updateTravelDraft(value) {
    const slider = root.querySelector('[data-field="travel-draft"]');
    const number = root.querySelector('[data-field="travel-number"]');
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    slider.value = numeric;
    number.value = numeric;
    root.querySelector('[data-text="travel-draft-value"]').textContent = `${formatCompactNumber(numeric)} mm`;
  }

  root.querySelector('[data-field="travel-draft"]').addEventListener("input", event => updateTravelDraft(event.target.value));
  root.querySelector('[data-field="travel-number"]').addEventListener("input", event => updateTravelDraft(event.target.value));
  root.querySelector('[data-action="apply-travel"]').addEventListener("click", () => {
    const value = Number(root.querySelector('[data-field="travel-number"]').value);
    if (!Number.isFinite(value) || value <= 0) return;
    controller.setManualTravel(value);
    closeDialog(travelDialog);
  });

  root.querySelector('[data-action="help"]').addEventListener("click", () => openDialog(helpDialog));
  root.querySelectorAll('[data-action="close-help"]').forEach(button => button.addEventListener("click", () => closeDialog(helpDialog)));
  root.querySelector('[data-action="target-help"]').addEventListener("click", () => openDialog(targetHelpDialog));
  root.querySelectorAll('[data-action="close-target-help"]').forEach(button => button.addEventListener("click", () => closeDialog(targetHelpDialog)));

  root.querySelector('[data-action="reset"]').addEventListener("click", () => openDialog(resetDialog));
  root.querySelector('[data-action="confirm-reset"]').addEventListener("click", () => {
    controller.clearForm();
    closeDialog(resetDialog);
  });

  root.querySelector('[data-action="save"]').addEventListener("click", async () => {
    const measurement = await controller.saveMeasurement();
    if (!measurement) return;
    const state = controller.getSnapshot();
    root.querySelector('[data-text="saved-message"]').textContent = state.selectedBikeID
      ? "Pomiar zapisano w Historii. Możesz od razu utworzyć z niego wpis Dziennika."
      : "Pomiar zapisano w Historii. Aby dodać wpis Dziennika, wybierz profil roweru przy kolejnym pomiarze.";
    const addRide = root.querySelector('[data-action="add-ride"]');
    addRide.hidden = !state.selectedBikeID;
    openDialog(savedDialog);
  });

  root.querySelectorAll('[data-action="close-saved"]').forEach(button => button.addEventListener("click", () => closeDialog(savedDialog)));
  root.querySelector('[data-action="add-ride"]').addEventListener("click", () => {
    closeDialog(savedDialog);
    root.dispatchEvent(new CustomEvent("measurement:add-ride", {
      bubbles: true,
      detail: { measurement: controller.getSnapshot().savedMeasurement }
    }));
  });
}
