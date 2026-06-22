import { createElement } from "../../utils/dom.js";

export function createHistoryConfirmationDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog",
    attributes: { "aria-labelledby": "history-confirm-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel">
      <div class="dialog-heading">
        <h3 id="history-confirm-title" data-text="history-confirm-title"></h3>
        <button type="button" data-action="cancel-history-delete" aria-label="Zamknij">×</button>
      </div>
      <p data-text="history-confirm-message"></p>
      <p class="form-error" data-text="history-delete-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="secondary-action" data-action="cancel-history-delete">Anuluj</button>
        <button type="button" class="danger-action" data-action="confirm-history-delete">Usuń</button>
      </div>
    </div>
  `;
  return dialog;
}

export function renderHistoryConfirmation(dialog, mode) {
  const title = dialog.querySelector('[data-text="history-confirm-title"]');
  const message = dialog.querySelector('[data-text="history-confirm-message"]');
  const error = dialog.querySelector('[data-text="history-delete-error"]');
  error.hidden = true;
  error.textContent = "";

  if (mode === "all") {
    title.textContent = "Usunąć wszystkie pomiary?";
    message.textContent = "Usunięta zostanie cała Historia, także pomiary niewidoczne przez aktywne filtry. Kopie pomiarów zapisane we wpisach Dziennika pozostaną bez zmian.";
  } else {
    title.textContent = "Usunąć ten pomiar?";
    message.textContent = "Pomiar zostanie trwale usunięty z Historii. Kopie zapisane we wpisach Dziennika pozostaną bez zmian.";
  }
}
