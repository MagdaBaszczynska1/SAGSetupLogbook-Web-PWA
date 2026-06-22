import { createElement } from "../../utils/dom.js";

export function createTravelDialog() {
  const element = createElement("dialog", {
    className: "app-dialog",
    attributes: { "data-dialog": "travel", "aria-labelledby": "travel-dialog-title" }
  });
  element.innerHTML = `
    <form method="dialog" class="dialog-panel">
      <div class="dialog-heading">
        <h3 id="travel-dialog-title" data-text="travel-dialog-title">Zmień skok widelca</h3>
        <button value="cancel" aria-label="Zamknij">×</button>
      </div>
      <p>Ręczna zmiana zastąpi wartość wczytaną z profilu tylko dla bieżącego pomiaru.</p>
      <div class="slider-value-row">
        <span id="travel-slider-title" data-text="travel-slider-title">Skok widelca</span>
        <strong data-text="travel-draft-value">160 mm</strong>
      </div>
      <input class="measurement-range" data-field="travel-draft" type="range" min="80" max="220" step="1" value="160" aria-labelledby="travel-slider-title">
      <label class="number-field">Wartość w mm
        <input data-field="travel-number" type="number" inputmode="decimal" min="1" step="1">
      </label>
      <p class="field-help" data-text="travel-help"></p>
      <div class="dialog-actions">
        <button value="cancel" class="secondary-action">Anuluj</button>
        <button value="default" type="button" class="primary-action" data-action="apply-travel">Zastosuj</button>
      </div>
    </form>
  `;
  return element;
}
