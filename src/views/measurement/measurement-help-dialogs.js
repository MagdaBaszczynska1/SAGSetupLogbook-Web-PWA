import { createElement } from "../../utils/dom.js";

export function createMeasurementHelpDialog() {
  const element = createElement("dialog", {
    className: "app-dialog",
    attributes: { "data-dialog": "help", "aria-labelledby": "measurement-help-title" }
  });
  element.innerHTML = `
    <div class="dialog-panel help-dialog">
      <div class="dialog-heading">
        <h3 id="measurement-help-title">Jak wykonać pomiar SAG</h3>
        <button type="button" data-action="close-help" aria-label="Zamknij">×</button>
      </div>
      <ol class="instruction-list">
        <li>Ustaw rower na równej powierzchni i przygotuj wyposażenie używane podczas jazdy.</li>
        <li>Przesuń gumowy pierścień do uszczelki widelca lub dampera.</li>
        <li>Przyjmij naturalną pozycję do jazdy, najlepiej z pomocą drugiej osoby.</li>
        <li>Nie bujaj rowerem i pozwól zawieszeniu spokojnie się ułożyć.</li>
        <li>Ostrożnie zejdź z roweru, nie dociskając dodatkowo zawieszenia.</li>
        <li>Zmierz przesunięcie pierścienia w milimetrach.</li>
        <li>Wprowadź ugięcie i porównaj wynik z zaleceniem producenta.</li>
      </ol>
      <div class="warning-box"><strong>Ważne</strong><span>Dla dampera wpisuj skok tłoczyska, a nie skok tylnego koła.</span></div>
      <button type="button" class="primary-action" data-action="close-help">Gotowe</button>
    </div>
  `;
  return element;
}

export function createTargetHelpDialog() {
  const element = createElement("dialog", {
    className: "app-dialog",
    attributes: { "data-dialog": "target-help", "aria-labelledby": "target-help-title" }
  });
  element.innerHTML = `
    <div class="dialog-panel">
      <div class="dialog-heading"><h3 id="target-help-title">Docelowy SAG</h3><button type="button" data-action="close-target-help" aria-label="Zamknij">×</button></div>
      <p data-text="target-help-copy"></p>
      <p>Wartości z profilu roweru są wczytywane automatycznie. Ostateczne zalecenia sprawdź w instrukcji producenta zawieszenia.</p>
      <button type="button" class="primary-action" data-action="close-target-help">Gotowe</button>
    </div>
  `;
  return element;
}
