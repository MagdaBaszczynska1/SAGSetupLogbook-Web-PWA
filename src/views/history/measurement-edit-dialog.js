import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { SAG_INPUT_FIELD } from "../../services/sag-calculator.js";
import { measurementToFormValues } from "../../services/measurement-form.js";
import { createElement } from "../../utils/dom.js";

function setText(root, name, value) {
  const element = root.querySelector(`[data-text="${name}"]`);
  if (element) element.textContent = value;
}

export function createMeasurementEditDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog measurement-edit-dialog",
    attributes: { "aria-labelledby": "measurement-edit-title" }
  });
  dialog.innerHTML = `
    <form class="dialog-panel measurement-edit-form" data-form="measurement-edit" novalidate>
      <div class="dialog-heading">
        <h3 id="measurement-edit-title">Edytuj pomiar</h3>
        <button type="button" data-action="close-measurement-edit" aria-label="Zamknij">×</button>
      </div>
      <fieldset class="segmented-control measurement-edit-suspension">
        <legend>Typ zawieszenia</legend>
        <button type="button" data-edit-suspension="fork">Widelec</button>
        <button type="button" data-edit-suspension="shock">Damper</button>
      </fieldset>
      <section class="form-section">
        <h4>Dane pomiaru</h4>
        <label><span data-text="edit-travel-label">Skok widelca</span>
          <span class="unit-field"><input data-field="suspensionTravel" inputmode="decimal" required placeholder="0"><span>mm</span></span>
          <small data-text="edit-travel-help" hidden></small>
          <small class="field-error" data-error="suspensionTravel" role="alert" hidden></small>
        </label>
        <label><span data-text="edit-compression-label">Ugięcie widelca</span>
          <span class="unit-field"><input data-field="measuredCompression" inputmode="decimal" required placeholder="0"><span>mm</span></span>
          <small class="field-error" data-error="measuredCompression" role="alert" hidden></small>
        </label>
        <label><span data-text="edit-pressure-label">Ciśnienie widelca</span> <span class="optional-text">Opcjonalne</span>
          <span class="unit-field"><input data-field="pressure" inputmode="decimal" placeholder="0"><span>PSI</span></span>
          <small>Ciśnienie nie wpływa na obliczenie SAG.</small>
          <small class="field-error" data-error="pressure" role="alert" hidden></small>
        </label>
        <label>Docelowy SAG
          <span class="unit-field"><input data-field="targetSag" inputmode="decimal" required placeholder="0"><span>%</span></span>
          <small class="field-error" data-error="targetSag" role="alert" hidden></small>
        </label>
        <p class="field-help" data-text="edit-measurement-help"></p>
      </section>
      <p class="form-error" data-text="measurement-edit-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="secondary-action" data-action="close-measurement-edit">Anuluj</button>
        <button type="submit" class="primary-action" data-action="save-measurement-edit">Zapisz</button>
      </div>
    </form>
  `;
  return dialog;
}

export function renderMeasurementEditForm(dialog, measurement) {
  const values = measurementToFormValues(measurement);
  dialog.dataset.measurementId = measurement.id;
  dialog.dataset.suspensionType = values.suspensionType;
  dialog.querySelectorAll("[data-edit-suspension]").forEach(button => {
    const active = button.dataset.editSuspension === values.suspensionType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  for (const [field, value] of Object.entries(values)) {
    if (field === "suspensionType") continue;
    const input = dialog.querySelector(`[data-field="${field}"]`);
    if (input) input.value = value;
  }
  updateMeasurementEditLabels(dialog, values.suspensionType);
  clearMeasurementEditErrors(dialog);
}

export function updateMeasurementEditLabels(dialog, suspensionType) {
  dialog.dataset.suspensionType = suspensionType;
  const definition = getSuspensionDefinition(suspensionType);
  setText(dialog, "edit-travel-label", definition.travelFieldTitle);
  setText(dialog, "edit-compression-label", definition.measuredCompressionFieldTitle);
  setText(dialog, "edit-pressure-label", definition.pressureFieldTitle);
  setText(dialog, "edit-measurement-help", definition.measurementHelpText);
  const help = dialog.querySelector('[data-text="edit-travel-help"]');
  help.hidden = suspensionType !== "shock";
  help.textContent = suspensionType === "shock" ? "Wpisz skok tłoczyska dampera, nie skok tylnego koła." : "";
  dialog.querySelectorAll("[data-edit-suspension]").forEach(button => {
    const active = button.dataset.editSuspension === suspensionType;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

export function collectMeasurementEditValues(dialog) {
  return Object.freeze({
    suspensionType: dialog.dataset.suspensionType,
    suspensionTravel: dialog.querySelector('[data-field="suspensionTravel"]').value,
    measuredCompression: dialog.querySelector('[data-field="measuredCompression"]').value,
    pressure: dialog.querySelector('[data-field="pressure"]').value,
    targetSag: dialog.querySelector('[data-field="targetSag"]').value
  });
}

export function clearMeasurementEditErrors(dialog) {
  dialog.querySelectorAll("[data-error]").forEach(element => {
    element.hidden = true;
    element.textContent = "";
  });
  const general = dialog.querySelector('[data-text="measurement-edit-error"]');
  general.hidden = true;
  general.textContent = "";
}

export function renderMeasurementEditErrors(dialog, errors, generalMessage = null) {
  clearMeasurementEditErrors(dialog);
  for (const field of Object.values(SAG_INPUT_FIELD)) {
    const element = dialog.querySelector(`[data-error="${field}"]`);
    if (!element || !errors?.[field]) continue;
    element.hidden = false;
    element.textContent = errors[field];
  }
  if (generalMessage) {
    const general = dialog.querySelector('[data-text="measurement-edit-error"]');
    general.hidden = false;
    general.textContent = generalMessage;
  }
}
