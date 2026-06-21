import { createElement } from "../../utils/dom.js";

export function createMeasurementToolbar() {
  const element = createElement("div", { className: "measurement-toolbar" });
  element.innerHTML = `
    <button class="icon-action" type="button" data-action="reset" aria-label="Wyczyść formularz" disabled>↶</button>
    <h2 class="sr-only" id="measurement-heading">Rower i zawieszenie</h2>
    <button class="icon-action" type="button" data-action="help" aria-label="Pokaż instrukcję pomiaru">ⓘ</button>
  `;
  return element;
}

export function createConfigurationCards() {
  const fragment = document.createDocumentFragment();

  const configuration = createElement("section", {
    className: "app-card configuration-card",
    attributes: { "aria-labelledby": "configuration-title" }
  });
  configuration.innerHTML = `
    <h3 class="sr-only" id="configuration-title">Konfiguracja pomiaru</h3>
    <label class="selection-row">
      <span class="selection-row__icon" aria-hidden="true">🚲</span>
      <span class="selection-row__label">Rower</span>
      <select class="selection-row__select" data-field="bike" aria-label="Rower"></select>
    </label>
    <div class="card-divider"></div>
    <fieldset class="segmented-control">
      <legend class="sr-only">Typ zawieszenia</legend>
      <button type="button" data-suspension="fork">Widelec</button>
      <button type="button" data-suspension="shock">Damper</button>
    </fieldset>
  `;

  const travel = createElement("section", {
    className: "app-card travel-card",
    attributes: { "aria-labelledby": "travel-title" }
  });
  travel.innerHTML = `
    <div>
      <h3 id="travel-title" data-text="travel-title">Skok widelca</h3>
      <p class="field-origin" data-text="travel-origin">Wartość ręczna</p>
    </div>
    <strong class="travel-card__value" data-text="travel-value">160 mm</strong>
    <button class="text-action" type="button" data-action="edit-travel">Zmień ›</button>
  `;

  fragment.append(configuration, travel);
  return fragment;
}
