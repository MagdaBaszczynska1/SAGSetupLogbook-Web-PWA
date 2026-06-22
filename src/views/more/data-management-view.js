import {
  MAX_BACKUP_BYTES,
  backupFilename,
  createCsvReport,
  createDataBackup,
  csvFilename,
  parseDataBackup,
  restoreDataBackup,
  summarizeBackup
} from "../../services/data-backup.js";
import { createElement } from "../../utils/dom.js";
import { downloadTextFile } from "../../utils/downloads.js";

function rescueFilename(date = new Date()) {
  const stamp = date.toISOString().replaceAll(":", "-").replace(".", "-");
  return `sag-setup-logbook-before-import-${stamp}.json`;
}

function createImportDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog more-dialog import-dialog",
    attributes: { "aria-labelledby": "import-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel more-dialog-panel">
      <div class="dialog-heading">
        <h3 id="import-title">Potwierdź import</h3>
        <button type="button" data-action="cancel-import" aria-label="Zamknij">×</button>
      </div>
      <div class="import-file-summary">
        <strong data-text="import-filename"></strong>
        <span data-text="import-counts"></span>
      </div>
      <div class="warning-box">
        <strong>Import zastąpi wszystkie aktualne dane</strong>
        <span>Przed zmianą aplikacja pobierze kopię ratunkową i zachowa poprzednie dane do automatycznego rollbacku.</span>
      </div>
      <p class="form-error" data-text="import-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="secondary-action" data-action="cancel-import">Anuluj</button>
        <button type="button" class="primary-action" data-action="confirm-import">Utwórz kopię i importuj</button>
      </div>
    </div>
  `;
  return dialog;
}

export function createDataManagementView({
  database,
  bikeStore,
  measurementStore,
  rideJournalStore,
  appSettingsStore
}) {
  const root = createElement("section", {
    className: "data-management app-card",
    attributes: { "aria-labelledby": "data-management-heading" }
  });
  root.innerHTML = `
    <div class="more-section-heading">
      <div>
        <h2 id="data-management-heading">Kopie i pliki danych</h2>
        <p>JSON służy do pełnej kopii i importu. CSV jest raportem do arkusza kalkulacyjnego.</p>
      </div>
    </div>
    <div class="data-counts" aria-label="Liczba zapisanych danych">
      <span><strong data-count="bikes">0</strong> profili</span>
      <span><strong data-count="measurements">0</strong> pomiarów</span>
      <span><strong data-count="rides">0</strong> wpisów</span>
    </div>
    <div class="data-actions">
      <button type="button" class="secondary-action" data-action="export-json">Eksportuj JSON</button>
      <button type="button" class="secondary-action" data-action="export-csv">Eksportuj CSV</button>
      <button type="button" class="primary-action" data-action="select-import">Importuj JSON</button>
    </div>
    <input type="file" data-field="import-file" accept="application/json,.json" hidden>
    <p class="data-management-help">Import nie łączy rekordów. Po potwierdzeniu zastępuje profile, Historię i Dziennik zawartością pliku.</p>
    <div class="data-operation-status" data-region="data-operation-status" role="status" hidden></div>
  `;

  const importDialog = createImportDialog();
  root.append(importDialog);
  let pendingImport = null;

  function currentData() {
    return {
      bikes: bikeStore.getAll(),
      measurements: measurementStore.getAll(),
      rides: rideJournalStore.getAll()
    };
  }

  function renderCounts() {
    root.querySelector('[data-count="bikes"]').textContent = String(bikeStore.getAll().length);
    root.querySelector('[data-count="measurements"]').textContent = String(measurementStore.getAll().length);
    root.querySelector('[data-count="rides"]').textContent = String(rideJournalStore.getAll().length);
  }

  function showStatus(message, tone = "notice") {
    const status = root.querySelector('[data-region="data-operation-status"]');
    status.hidden = false;
    status.dataset.tone = tone;
    status.textContent = message;
  }

  function clearImportError() {
    const error = importDialog.querySelector('[data-text="import-error"]');
    error.hidden = true;
    error.textContent = "";
  }

  function fullBackup() {
    const data = currentData();
    return createDataBackup({
      ...data,
      settings: appSettingsStore?.getSettings() ?? null
    });
  }

  function exportJson(filename = backupFilename()) {
    const backup = fullBackup();
    downloadTextFile({
      filename,
      text: JSON.stringify(backup, null, 2),
      type: "application/json;charset=utf-8"
    });
    return backup;
  }

  function exportCsv() {
    downloadTextFile({
      filename: csvFilename(),
      text: createCsvReport(currentData()),
      type: "text/csv;charset=utf-8"
    });
  }

  async function prepareImport(file) {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      showStatus("Plik przekracza limit 10 MB.", "error");
      return;
    }
    try {
      const text = await file.text();
      parseDataBackup(text);
      const raw = JSON.parse(text);
      const summary = summarizeBackup(raw);
      pendingImport = { raw, filename: file.name, summary };
      importDialog.querySelector('[data-text="import-filename"]').textContent = file.name;
      importDialog.querySelector('[data-text="import-counts"]').textContent = `${summary.bikes} profili • ${summary.measurements} pomiarów • ${summary.rides} wpisów Dziennika`;
      clearImportError();
      importDialog.showModal();
    } catch (error) {
      console.error("Nie udało się przygotować importu.", error);
      showStatus(`Nie można zaimportować pliku. ${error.message}`, "error");
    }
  }

  async function confirmImport(button) {
    if (!pendingImport) return;
    clearImportError();
    button.disabled = true;
    button.textContent = "Importowanie…";
    try {
      exportJson(rescueFilename());
      const result = await restoreDataBackup({
        backup: pendingImport.raw,
        database,
        bikeStore,
        measurementStore,
        rideJournalStore,
        appSettingsStore
      });
      importDialog.close();
      pendingImport = null;
      showStatus(`Import zakończony: ${result.bikes} profili, ${result.measurements} pomiarów i ${result.rides} wpisów Dziennika.`, result.settingsApplied === false ? "warning" : "success");
    } catch (error) {
      console.error("Import danych nie powiódł się.", error);
      const field = importDialog.querySelector('[data-text="import-error"]');
      field.hidden = false;
      field.textContent = error.message || "Nie udało się zaimportować danych.";
    } finally {
      button.disabled = false;
      button.textContent = "Utwórz kopię i importuj";
    }
  }

  root.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "export-json") {
      try {
        exportJson();
        showStatus("Pobrano pełną kopię JSON.", "success");
      } catch (error) {
        showStatus(`Nie udało się pobrać kopii JSON. ${error.message}`, "error");
      }
    }
    if (action === "export-csv") {
      try {
        exportCsv();
        showStatus("Pobrano raport CSV.", "success");
      } catch (error) {
        showStatus(`Nie udało się pobrać raportu CSV. ${error.message}`, "error");
      }
    }
    if (action === "select-import") root.querySelector('[data-field="import-file"]').click();
    if (action === "cancel-import") {
      importDialog.close();
      pendingImport = null;
    }
    if (action === "confirm-import") confirmImport(button);
  });

  root.querySelector('[data-field="import-file"]').addEventListener("change", event => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    prepareImport(file);
  });

  bikeStore.subscribe(renderCounts);
  measurementStore.subscribe(renderCounts);
  rideJournalStore.subscribe(renderCounts);
  renderCounts();
  return root;
}
