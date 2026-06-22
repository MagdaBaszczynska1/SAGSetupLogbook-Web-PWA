import { getBikeDisplayName } from "../../models/bike-profile.js";
import { getSagInterpretationContent } from "../../models/sag-measurement.js";
import { getSuspensionDefinition, SUSPENSION_TYPE } from "../../models/suspension-type.js";
import { CALCULATOR_SAVE_STATE } from "../../services/sag-calculator.js";
import {
  getCompressionSliderConfiguration,
  getPressureSliderConfiguration,
  getTargetSagSliderConfiguration,
  getTravelSliderConfiguration
} from "../../services/sag-slider-configuration.js";
import { formatCompactNumber, formatDisplayNumber, formatSignedNumber } from "../../utils/formatters.js";

function setText(root, name, value) {
  const element = root.querySelector(`[data-text="${name}"]`);
  if (element) element.textContent = value;
}

function setError(root, field, message) {
  const element = root.querySelector(`[data-error="${field}"]`);
  if (!element) return;
  element.hidden = !message;
  element.textContent = message ?? "";
}

function renderBikeOptions(root, snapshot) {
  const select = root.querySelector('[data-field="bike"]');
  const previous = select.value;
  select.replaceChildren();
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Bez profilu";
  select.append(none);
  snapshot.bikes.forEach(bike => {
    const option = document.createElement("option");
    option.value = bike.id;
    option.textContent = getBikeDisplayName(bike);
    select.append(option);
  });
  select.value = snapshot.selectedBikeID ?? "";
  if (select.value === "" && previous && snapshot.selectedBikeID) select.value = previous;
}

export function renderMeasurement(root, snapshot) {
  const definition = getSuspensionDefinition(snapshot.suspensionType);
  const live = snapshot.liveCalculation;
  const travelConfig = getTravelSliderConfiguration(snapshot.suspensionType);
  const compressionConfig = getCompressionSliderConfiguration(snapshot.suspensionType, snapshot.suspensionTravel);
  const pressureConfig = getPressureSliderConfiguration(snapshot.suspensionType);
  const targetConfig = getTargetSagSliderConfiguration(snapshot.suspensionType);

  renderBikeOptions(root, snapshot);

  root.querySelectorAll("[data-suspension]").forEach(button => {
    const active = button.dataset.suspension === snapshot.suspensionType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  setText(root, "travel-title", definition.travelFieldTitle);
  setText(root, "travel-origin", snapshot.travelComesFromProfile ? "Wartość z profilu" : "Wartość ręczna");
  setText(root, "travel-value", `${formatCompactNumber(snapshot.suspensionTravel)} mm`);
  setText(root, "compression-title", definition.measuredCompressionFieldTitle);
  setText(root, "compression-value", snapshot.hasSetMeasuredCompression ? formatCompactNumber(snapshot.measuredCompression) : "—");
  setText(root, "compression-help", definition.measurementHelpText);

  const compression = root.querySelector('[data-field="compression"]');
  compression.min = compressionConfig.minimum;
  compression.max = compressionConfig.maximum;
  compression.step = compressionConfig.step;
  compression.value = snapshot.measuredCompression;
  compression.setAttribute("aria-label", definition.measuredCompressionFieldTitle);

  setText(root, "scale-min", `${formatCompactNumber(compressionConfig.minimum)} mm`);
  setText(root, "scale-mid", `${formatCompactNumber((compressionConfig.minimum + compressionConfig.maximum) / 2)} mm`);
  setText(root, "scale-max", `${formatCompactNumber(compressionConfig.maximum)} mm`);

  root.querySelector('[data-action="compression-minus"]').disabled = snapshot.measuredCompression <= compressionConfig.minimum;
  root.querySelector('[data-action="compression-plus"]').disabled = snapshot.measuredCompression >= compressionConfig.maximum;

  setText(root, "target-value", `${formatCompactNumber(snapshot.targetSag)}%`);
  root.querySelectorAll("[data-target-preset]").forEach(button => {
    const active = button.dataset.targetPreset === snapshot.targetPreset;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const customRegion = root.querySelector('[data-region="custom-target"]');
  customRegion.hidden = !snapshot.usesCustomTargetSag;
  const targetRange = root.querySelector('[data-field="target"]');
  targetRange.min = targetConfig.minimum;
  targetRange.max = targetConfig.maximum;
  targetRange.step = targetConfig.step;
  targetRange.value = snapshot.targetSag;
  setText(root, "custom-target-value", `${formatCompactNumber(snapshot.targetSag)}%`);

  const disclosure = root.querySelector('[data-action="toggle-additional"]');
  const additional = root.querySelector('[data-region="additional-content"]');
  disclosure.setAttribute("aria-expanded", String(snapshot.isAdditionalDataExpanded));
  disclosure.classList.toggle("is-expanded", snapshot.isAdditionalDataExpanded);
  additional.hidden = !snapshot.isAdditionalDataExpanded;

  const pressureEnabled = snapshot.pressure !== null;
  root.querySelector('[data-field="pressure-enabled"]').checked = pressureEnabled;
  root.querySelector('[data-region="pressure-control"]').hidden = !pressureEnabled;
  setText(root, "pressure-title", definition.pressureFieldTitle);
  setText(root, "additional-summary", pressureEnabled ? `${formatCompactNumber(snapshot.pressure)} PSI` : "Brak dodatkowych danych");

  const pressure = root.querySelector('[data-field="pressure"]');
  pressure.min = pressureConfig.minimum;
  pressure.max = pressureConfig.maximum;
  pressure.step = pressureConfig.step;
  pressure.value = snapshot.pressure ?? pressureConfig.defaultValue;
  pressure.setAttribute("aria-label", definition.pressureFieldTitle);
  setText(root, "pressure-value", `${formatCompactNumber(snapshot.pressure ?? pressureConfig.defaultValue)} PSI`);

  setError(root, "measuredCompression", live.errors.measuredCompression);
  setError(root, "targetSag", live.errors.targetSag);
  setError(root, "pressure", live.errors.pressure);

  const results = root.querySelector('[data-region="results"]');
  results.hidden = !live.result;
  if (live.result) {
    const content = getSagInterpretationContent(live.result.interpretation);
    setText(root, "current-sag", `${formatDisplayNumber(live.result.currentSag)}%`);
    setText(root, "result-target", `Cel: ${formatCompactNumber(live.values.targetSag)}%`);
    setText(root, "interpretation-title", content.liveStatusTitle);
    setText(root, "interpretation-explanation", content.explanation);
    setText(root, "target-compression-title", definition.targetCompressionTitle);
    setText(root, "target-compression", `${formatDisplayNumber(live.result.targetCompression)} mm`);
    setText(root, "difference", `${formatSignedNumber(live.result.differencePercentagePoints)} p.p. · ${formatSignedNumber(live.result.differenceMillimeters)} mm`);
    const interpretation = root.querySelector('[data-region="interpretation"]');
    interpretation.dataset.tone = content.tone;
  }

  const reset = root.querySelector('[data-action="reset"]');
  reset.disabled = snapshot.isAtDefaultState;

  const saveButton = root.querySelector('[data-action="save"]');
  const saveHint = root.querySelector('[data-text="save-hint"]');
  const saveError = root.querySelector('[data-text="save-error"]');
  saveError.hidden = !snapshot.saveFeedback;
  saveError.textContent = snapshot.saveFeedback ?? "";
  saveHint.hidden = Boolean(snapshot.saveFeedback);

  switch (snapshot.saveButtonState) {
    case CALCULATOR_SAVE_STATE.READY:
      saveButton.disabled = false;
      saveButton.textContent = "Zapisz pomiar";
      saveButton.dataset.state = "ready";
      saveHint.textContent = "Pomiar jest gotowy do zapisania.";
      break;
    case CALCULATOR_SAVE_STATE.SAVING:
      saveButton.disabled = true;
      saveButton.textContent = "Zapisywanie…";
      saveButton.dataset.state = "saving";
      saveHint.textContent = "Trwa zapisywanie pomiaru.";
      break;
    case CALCULATOR_SAVE_STATE.SAVED:
      saveButton.disabled = true;
      saveButton.textContent = "Pomiar zapisany";
      saveButton.dataset.state = "saved";
      saveHint.textContent = "Ten wynik został już zapisany.";
      break;
    default:
      saveButton.disabled = true;
      saveButton.textContent = "Zapisz pomiar";
      saveButton.dataset.state = "unavailable";
      saveHint.textContent = "Ustaw ugięcie, aby zapisać pomiar.";
  }

  const travelDraft = root.querySelector('[data-field="travel-draft"]');
  travelDraft.min = travelConfig.minimum;
  travelDraft.max = travelConfig.maximum;
  travelDraft.step = travelConfig.step;

  setText(root, "target-help-copy", snapshot.suspensionType === SUSPENSION_TYPE.FORK
    ? "Dla widelca często stosuje się około 20–25% SAG."
    : "Dla dampera często stosuje się około 25–30% SAG.");
}
