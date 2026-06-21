import { createElement } from "../../utils/dom.js";

export function createResetDialog() {
  const element = createElement("dialog", {
    className: "app-dialog",
    attributes: { "data-dialog": "reset" }
  });
  element.innerHTML = `
    <form method="dialog" class="dialog-panel">
      <div class="dialog-heading"><h3>Wyczyścić formularz?</h3><button value="cancel" aria-label="Zamknij">×</button></div>
      <p>Wpisane wartości i bieżący wynik zostaną usunięte.</p>
      <div class="dialog-actions">
        <button value="cancel" class="secondary-action">Anuluj</button>
        <button value="default" type="button" class="danger-action" data-action="confirm-reset">Wyczyść</button>
      </div>
    </form>
  `;
  return element;
}

export function createSavedDialog() {
  const element = createElement("dialog", {
    className: "app-dialog",
    attributes: { "data-dialog": "saved" }
  });
  element.innerHTML = `
    <div class="dialog-panel">
      <div class="dialog-heading"><h3>Pomiar zapisany</h3><button type="button" data-action="close-saved" aria-label="Zamknij">×</button></div>
      <p data-text="saved-message"></p>
      <button type="button" class="secondary-action" data-action="add-ride" hidden>Dodaj wpis Dziennika</button>
      <button type="button" class="primary-action" data-action="close-saved">Gotowe</button>
    </div>
  `;
  return element;
}
