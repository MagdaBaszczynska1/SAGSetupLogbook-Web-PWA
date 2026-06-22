import {
  RIDE_MEASUREMENT_STATUS,
  TRAIL_CONDITION_CONTENT,
  getAllMeasurementSnapshots,
  getBikeProfileSnapshotDisplayName,
  getRideMeasurementAttachmentStatus,
  hasForkSnapshotData,
  hasShockSnapshotData
} from "../../models/ride-journal-entry.js";
import { getSagInterpretationContent } from "../../models/sag-measurement.js";
import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { formatDate, formatDateTime } from "../../utils/date-formatters.js";
import { createElement } from "../../utils/dom.js";
import { formatDisplayNumber, formatSignedNumber } from "../../utils/formatters.js";

function value(value, unit) {
  return value === null || value === undefined ? "Nie ustawiono" : `${formatDisplayNumber(value)} ${unit}`;
}

function setText(root, name, text) {
  const element = root.querySelector(`[data-text="${name}"]`);
  if (element) element.textContent = text;
}

function measurementCard(snapshot) {
  const definition = getSuspensionDefinition(snapshot.suspensionType);
  const interpretation = getSagInterpretationContent(snapshot.interpretation);
  const card = createElement("article", { className: "ride-detail-measurement" });
  const heading = createElement("div", { className: "ride-detail-measurement__heading" });
  heading.append(
    createElement("h5", { text: definition.title }),
    createElement("strong", { text: `${formatDisplayNumber(snapshot.currentSag)}% SAG` })
  );
  const status = createElement("p", {
    text: `${interpretation.message}. ${interpretation.explanation}`,
    attributes: { "data-tone": interpretation.tone }
  });
  const details = createElement("dl", { className: "ride-detail-grid" });
  const rows = [
    ["Data pomiaru", formatDateTime(snapshot.measurementDate)],
    [definition.travelFieldTitle, `${formatDisplayNumber(snapshot.suspensionTravel)} mm`],
    [definition.measuredCompressionFieldTitle, `${formatDisplayNumber(snapshot.measuredCompression)} mm`],
    [definition.pressureFieldTitle, snapshot.pressure === null || snapshot.pressure === undefined ? "Brak danych" : `${formatDisplayNumber(snapshot.pressure)} PSI`],
    ["Docelowy SAG", `${formatDisplayNumber(snapshot.targetSag)}%`],
    [definition.targetCompressionTitle, `${formatDisplayNumber(snapshot.targetCompression)} mm`],
    ["Różnica SAG", `${formatSignedNumber(snapshot.differencePercentagePoints)} p.p.`],
    ["Różnica ugięcia", `${formatSignedNumber(snapshot.differenceMillimeters)} mm`]
  ];
  rows.forEach(([label, content]) => {
    details.append(createElement("dt", { text: label }), createElement("dd", { text: content }));
  });
  card.append(heading, status, details);
  return card;
}

function profileSection(snapshot) {
  const section = createElement("section", { className: "detail-section" });
  section.append(createElement("h4", { text: "Historyczne ustawienia roweru" }));
  if (!snapshot) {
    section.append(createElement("p", { text: "Brak historycznej kopii profilu." }));
    return section;
  }
  section.append(createElement("p", { text: getBikeProfileSnapshotDisplayName(snapshot) }));
  const grid = createElement("dl", { className: "ride-detail-grid" });
  if (hasForkSnapshotData(snapshot)) {
    [["Skok widelca", value(snapshot.forkTravel, "mm")], ["Cel widelca", value(snapshot.forkTargetSag, "%")], ["Ciśnienie widelca", value(snapshot.forkPressure, "PSI")]]
      .forEach(([label, content]) => grid.append(createElement("dt", { text: label }), createElement("dd", { text: content })));
  }
  if (hasShockSnapshotData(snapshot)) {
    [["Skok dampera", value(snapshot.shockTravel, "mm")], ["Cel dampera", value(snapshot.shockTargetSag, "%")], ["Ciśnienie dampera", value(snapshot.shockPressure, "PSI")]]
      .forEach(([label, content]) => grid.append(createElement("dt", { text: label }), createElement("dd", { text: content })));
  }
  if (!grid.children.length) grid.append(createElement("p", { text: "Profil nie zawierał ustawień zawieszenia." }));
  section.append(grid);
  return section;
}

export function createRideDetailDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog ride-detail-dialog",
    attributes: { "aria-labelledby": "ride-detail-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel ride-detail-panel">
      <div class="dialog-heading"><h3 id="ride-detail-title" data-text="ride-detail-route"></h3><button type="button" data-action="close-ride-detail" aria-label="Zamknij">×</button></div>
      <section class="ride-detail-hero">
        <div><span data-text="ride-detail-date"></span><strong data-text="ride-detail-bike"></strong></div>
        <span class="ride-detail-rating" data-text="ride-detail-rating"></span>
      </section>
      <section class="detail-section"><h4>Jazda</h4><div class="value-row"><span>Warunki</span><strong data-text="ride-detail-condition"></strong></div><div class="ride-detail-notes" data-region="ride-detail-notes"><h5>Notatka</h5><p data-text="ride-detail-notes"></p></div></section>
      <section class="detail-section" data-region="ride-detail-measurements"><div class="ride-form-section-heading"><div><h4>Pomiary SAG</h4><p data-text="ride-detail-measurement-status"></p></div></div><div class="ride-detail-measurement-list" data-region="ride-detail-measurement-list"></div></section>
      <div data-region="ride-detail-profile"></div>
      <div class="measurement-detail-actions"><button type="button" class="danger-action" data-action="delete-from-ride-detail">Usuń wpis</button><button type="button" class="primary-action" data-action="edit-ride-entry">Edytuj</button></div>
    </div>
  `;
  return dialog;
}

export function renderRideDetail(dialog, entry) {
  if (!entry) return false;
  const condition = TRAIL_CONDITION_CONTENT[entry.conditions] ?? { title: "Nieznane" };
  setText(dialog, "ride-detail-route", entry.routeName);
  setText(dialog, "ride-detail-date", formatDate(entry.rideDate));
  setText(dialog, "ride-detail-bike", entry.bikeNameSnapshot);
  setText(dialog, "ride-detail-rating", `${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}`);
  setText(dialog, "ride-detail-condition", condition.title);
  const notesRegion = dialog.querySelector('[data-region="ride-detail-notes"]');
  notesRegion.hidden = !String(entry.notes ?? "").trim();
  setText(dialog, "ride-detail-notes", entry.notes || "");

  const snapshots = getAllMeasurementSnapshots(entry);
  const status = getRideMeasurementAttachmentStatus(entry);
  const statusText = status.type === RIDE_MEASUREMENT_STATUS.NONE
    ? "Brak pomiarów w tym wpisie."
    : status.type === RIDE_MEASUREMENT_STATUS.HISTORICAL
      ? `Dołączono ${status.count} pomiar(y). Co najmniej jeden pochodzi z innego dnia lub nie miał profilu.`
      : `Dołączono ${status.count} pomiar(y) z dnia jazdy.`;
  setText(dialog, "ride-detail-measurement-status", statusText);
  const list = dialog.querySelector('[data-region="ride-detail-measurement-list"]');
  list.replaceChildren(...snapshots.map(measurementCard));
  if (!snapshots.length) list.append(createElement("p", { text: "Ten wpis nie ma dołączonych pomiarów SAG." }));

  const profile = dialog.querySelector('[data-region="ride-detail-profile"]');
  profile.replaceChildren(profileSection(entry.bikeProfileSnapshot));
  return true;
}
