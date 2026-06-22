import { createElement } from "../../utils/dom.js";

export const JOURNAL_CONFIRMATION_MODE = Object.freeze({
  DELETE_ONE: "deleteOne",
  DELETE_ALL: "deleteAll",
  SAVE_WITHOUT_MEASUREMENT: "saveWithoutMeasurement"
});

export function createJournalConfirmationDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog",
    attributes: { "aria-labelledby": "journal-confirm-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel">
      <div class="dialog-heading"><h3 id="journal-confirm-title" data-text="journal-confirm-title"></h3><button type="button" data-action="cancel-journal-confirmation" aria-label="Zamknij">×</button></div>
      <p data-text="journal-confirm-message"></p>
      <p class="form-error" data-text="journal-confirm-error" role="alert" hidden></p>
      <div class="dialog-actions"><button type="button" class="secondary-action" data-action="cancel-journal-confirmation">Anuluj</button><button type="button" class="danger-action" data-action="confirm-journal-action">Potwierdź</button></div>
    </div>
  `;
  return dialog;
}

export function renderJournalConfirmation(dialog, mode) {
  const title = dialog.querySelector('[data-text="journal-confirm-title"]');
  const message = dialog.querySelector('[data-text="journal-confirm-message"]');
  const button = dialog.querySelector('[data-action="confirm-journal-action"]');
  const error = dialog.querySelector('[data-text="journal-confirm-error"]');
  error.hidden = true;
  error.textContent = "";

  if (mode === JOURNAL_CONFIRMATION_MODE.DELETE_ALL) {
    title.textContent = "Usunąć cały Dziennik?";
    message.textContent = "Wszystkie wpisy z jazd zostaną trwale usunięte. Profile rowerów i źródłowe pomiary pozostaną bez zmian.";
    button.textContent = "Usuń wszystko";
    button.className = "danger-action";
  } else if (mode === JOURNAL_CONFIRMATION_MODE.DELETE_ONE) {
    title.textContent = "Usunąć ten wpis?";
    message.textContent = "Wpis Dziennika zostanie trwale usunięty. Profile rowerów i źródłowe pomiary pozostaną bez zmian.";
    button.textContent = "Usuń wpis";
    button.className = "danger-action";
  } else {
    title.textContent = "Zapisać bez pomiaru?";
    message.textContent = "Zmiana roweru lub daty odłączyła wcześniejsze pomiary. Wpis zostanie zapisany bez pomiaru SAG.";
    button.textContent = "Zapisz bez pomiaru";
    button.className = "primary-action";
  }
}
