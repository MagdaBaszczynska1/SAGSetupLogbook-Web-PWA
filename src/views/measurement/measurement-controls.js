import { createElement } from "../../utils/dom.js";

export function createCompressionCard() {
  const element = createElement("section", {
    className: "app-card measurement-card",
    attributes: { "aria-labelledby": "compression-title" }
  });
  element.innerHTML = `
    <div class="card-heading">
      <span class="card-heading__icon" aria-hidden="true">↕</span>
      <h3 id="compression-title" data-text="compression-title">Ugięcie widelca</h3>
    </div>
    <div class="compression-control">
      <button class="round-adjustment" type="button" data-action="compression-minus" aria-label="Zmniejsz ugięcie">−</button>
      <div class="compression-value" aria-live="polite">
        <strong data-text="compression-value">—</strong>
        <span>mm</span>
      </div>
      <button class="round-adjustment" type="button" data-action="compression-plus" aria-label="Zwiększ ugięcie">+</button>
    </div>
    <input class="measurement-range" data-field="compression" type="range" min="0" max="160" step="1" value="0" aria-label="Ugięcie widelca">
    <div class="measurement-scale" aria-hidden="true">
      <span data-text="scale-min">0 mm</span>
      <span data-text="scale-mid">80 mm</span>
      <span data-text="scale-max">160 mm</span>
    </div>
    <p class="field-help" data-text="compression-help"></p>
    <p class="field-error" data-error="measuredCompression" role="alert" hidden></p>
  `;
  return element;
}

export function createTargetCard() {
  const element = createElement("section", {
    className: "app-card target-card",
    attributes: { "aria-labelledby": "target-title" }
  });
  element.innerHTML = `
    <div class="target-card__header">
      <div class="card-heading">
        <span class="card-heading__icon" aria-hidden="true">◎</span>
        <h3 id="target-title">Docelowy SAG</h3>
      </div>
      <span class="target-card__current" data-text="target-value">25%</span>
      <button class="help-action" type="button" data-action="target-help" aria-label="Pomoc dotycząca docelowego SAG">?</button>
    </div>
    <div class="target-presets" role="group" aria-label="Szybki wybór docelowego SAG">
      <button type="button" data-target-preset="twenty">20%</button>
      <button type="button" data-target-preset="twentyFive">25%</button>
      <button type="button" data-target-preset="thirty">30%</button>
      <button type="button" data-target-preset="custom">Inny</button>
    </div>
    <div class="custom-target" data-region="custom-target" hidden>
      <div class="slider-value-row"><span>Wartość własna</span><strong data-text="custom-target-value">25%</strong></div>
      <input class="measurement-range" data-field="target" type="range" min="10" max="40" step="1" value="25" aria-label="Własny docelowy SAG">
      <p class="field-help">Zakres wartości własnej: od 10% do 40%.</p>
    </div>
    <p class="field-error" data-error="targetSag" role="alert" hidden></p>
  `;
  return element;
}

export function createAdditionalDataCard() {
  const element = createElement("section", { className: "app-card additional-card" });
  element.innerHTML = `
    <button class="additional-disclosure" type="button" data-action="toggle-additional" aria-expanded="false">
      <span aria-hidden="true">☷</span>
      <span><strong>Dodatkowe dane</strong><small data-text="additional-summary">Brak dodatkowych danych</small></span>
      <span class="optional-badge">Opcjonalne</span>
      <span class="disclosure-chevron" aria-hidden="true">⌄</span>
    </button>
    <div class="additional-content" data-region="additional-content" hidden>
      <div class="card-divider"></div>
      <p class="field-help">Ciśnienie pomaga później odtworzyć ustawienie, ale nie wpływa na obliczenie SAG.</p>
      <label class="toggle-row">
        <span>Dodaj ciśnienie</span>
        <input data-field="pressure-enabled" type="checkbox">
      </label>
      <div data-region="pressure-control" hidden>
        <div class="slider-value-row"><span data-text="pressure-title">Ciśnienie widelca</span><strong data-text="pressure-value">80 PSI</strong></div>
        <input class="measurement-range" data-field="pressure" type="range" min="30" max="200" step="1" value="80" aria-label="Ciśnienie widelca">
      </div>
      <p class="field-error" data-error="pressure" role="alert" hidden></p>
    </div>
  `;
  return element;
}
