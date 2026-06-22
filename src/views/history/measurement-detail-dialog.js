import { getSagInterpretationContent } from "../../models/sag-measurement.js";
import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { formatDateTime } from "../../utils/date-formatters.js";
import { createElement } from "../../utils/dom.js";
import { formatDisplayNumber, formatSignedNumber } from "../../utils/formatters.js";
import { getHistoryBikeDisplayName } from "./history-row.js";

function setText(root, name, value) {
  const element = root.querySelector(`[data-text="${name}"]`);
  if (element) element.textContent = value;
}

export function createMeasurementDetailDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog measurement-detail-dialog",
    attributes: { "aria-labelledby": "measurement-detail-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel measurement-detail-panel">
      <div class="dialog-heading">
        <h3 id="measurement-detail-title">Szczegóły pomiaru</h3>
        <button type="button" data-action="close-measurement-detail" aria-label="Zamknij">×</button>
      </div>
      <section class="measurement-detail-status" data-region="detail-status" role="status">
        <strong data-text="detail-status-title"></strong>
        <span data-text="detail-status-message"></span>
      </section>
      <section class="detail-section">
        <h4>Podsumowanie</h4>
        <div class="value-row"><span>Data</span><strong data-text="detail-date"></strong></div>
        <div class="value-row"><span>Rower</span><strong data-text="detail-bike"></strong></div>
      </section>
      <section class="detail-section">
        <h4>Dane wejściowe</h4>
        <div class="value-row"><span>Typ zawieszenia</span><strong data-text="detail-suspension"></strong></div>
        <div class="value-row"><span data-text="detail-travel-label"></span><strong data-text="detail-travel"></strong></div>
        <div class="value-row"><span data-text="detail-compression-label"></span><strong data-text="detail-compression"></strong></div>
        <div class="value-row"><span data-text="detail-pressure-label"></span><strong data-text="detail-pressure"></strong></div>
        <div class="value-row"><span>Docelowy SAG</span><strong data-text="detail-target-sag"></strong></div>
      </section>
      <section class="detail-section">
        <h4>Wyniki</h4>
        <div class="value-row"><span>Aktualny SAG</span><strong data-text="detail-current-sag"></strong></div>
        <div class="value-row"><span data-text="detail-target-compression-label"></span><strong data-text="detail-target-compression"></strong></div>
        <div class="value-row"><span>Różnica SAG</span><strong data-text="detail-difference-pp"></strong></div>
        <div class="value-row"><span>Różnica ugięcia</span><strong data-text="detail-difference-mm"></strong></div>
      </section>
      <section class="detail-section">
        <h4>Dziennik jazd</h4>
        <p data-text="detail-journal-help"></p>
        <button type="button" class="secondary-action" data-action="add-ride-from-measurement">Dodaj notatkę z jazdy</button>
      </section>
      <section class="detail-section measurement-identifier">
        <h4>Identyfikator</h4>
        <code data-text="detail-id"></code>
        <p>Identyfikator pozwala aplikacji jednoznacznie rozpoznać pomiar podczas importu i edycji danych.</p>
      </section>
      <div class="measurement-detail-actions">
        <button type="button" class="danger-action" data-action="delete-from-measurement-detail">Usuń pomiar</button>
        <button type="button" class="primary-action" data-action="edit-measurement">Edytuj</button>
      </div>
    </div>
  `;
  return dialog;
}

export function renderMeasurementDetail(dialog, measurement, { hasBikeProfiles }) {
  if (!measurement) return false;
  const definition = getSuspensionDefinition(measurement.suspensionType);
  const interpretation = getSagInterpretationContent(measurement.interpretation);
  const status = dialog.querySelector('[data-region="detail-status"]');
  status.dataset.tone = interpretation.tone;

  setText(dialog, "detail-status-title", interpretation.message);
  setText(dialog, "detail-status-message", interpretation.explanation);
  setText(dialog, "detail-date", formatDateTime(measurement.date));
  setText(dialog, "detail-bike", getHistoryBikeDisplayName(measurement));
  setText(dialog, "detail-suspension", definition.title);
  setText(dialog, "detail-travel-label", definition.travelFieldTitle);
  setText(dialog, "detail-travel", `${formatDisplayNumber(measurement.suspensionTravel)} mm`);
  setText(dialog, "detail-compression-label", definition.measuredCompressionFieldTitle);
  setText(dialog, "detail-compression", `${formatDisplayNumber(measurement.measuredCompression)} mm`);
  setText(dialog, "detail-pressure-label", definition.pressureFieldTitle);
  setText(dialog, "detail-pressure", measurement.pressure === null || measurement.pressure === undefined
    ? "Brak danych"
    : `${formatDisplayNumber(measurement.pressure)} PSI`);
  setText(dialog, "detail-target-sag", `${formatDisplayNumber(measurement.targetSag)}%`);
  setText(dialog, "detail-current-sag", `${formatDisplayNumber(measurement.currentSag)}%`);
  setText(dialog, "detail-target-compression-label", definition.targetCompressionTitle);
  setText(dialog, "detail-target-compression", `${formatDisplayNumber(measurement.targetCompression)} mm`);
  setText(dialog, "detail-difference-pp", `${formatSignedNumber(measurement.differencePercentagePoints)} p.p.`);
  setText(dialog, "detail-difference-mm", `${formatSignedNumber(measurement.differenceMillimeters)} mm`);
  setText(dialog, "detail-id", measurement.id);

  const journalButton = dialog.querySelector('[data-action="add-ride-from-measurement"]');
  journalButton.disabled = !hasBikeProfiles;
  setText(dialog, "detail-journal-help", hasBikeProfiles
    ? "Notatka zachowa kopię pomiaru oraz ustawień wybranego roweru."
    : "Dodaj najpierw profil roweru, aby utworzyć notatkę z jazdy.");
  return true;
}
