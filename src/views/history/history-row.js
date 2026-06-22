import { getSagInterpretationContent } from "../../models/sag-measurement.js";
import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { formatDateTime } from "../../utils/date-formatters.js";
import { createElement } from "../../utils/dom.js";
import { formatDisplayNumber } from "../../utils/formatters.js";

export function getHistoryBikeDisplayName(measurement) {
  const snapshot = String(measurement.bikeNameSnapshot ?? "").trim();
  if (measurement.bikeID === null || measurement.bikeID === undefined) {
    return snapshot ? `Bez profilu — ${snapshot}` : "Bez profilu";
  }
  return snapshot || "Nieznany rower";
}

export function createMeasurementHistoryRow(measurement) {
  const definition = getSuspensionDefinition(measurement.suspensionType);
  const interpretation = getSagInterpretationContent(measurement.interpretation);
  const bikeName = getHistoryBikeDisplayName(measurement);
  const date = formatDateTime(measurement.date);
  const pressure = measurement.pressure === null || measurement.pressure === undefined
    ? "Ciśnienie: brak danych"
    : `Ciśnienie: ${formatDisplayNumber(measurement.pressure)} PSI`;

  const card = createElement("article", {
    className: "history-row app-card",
    attributes: {
      "data-measurement-id": measurement.id,
      "aria-label": `${bikeName}, ${definition.title}, ${formatDisplayNumber(measurement.currentSag)} procent SAG, ${date}, ${pressure}, ${interpretation.message}`
    }
  });

  const icon = createElement("span", {
    className: "history-row__icon",
    text: measurement.suspensionType === "fork" ? "↕" : "●",
    attributes: { "aria-hidden": "true" }
  });

  const content = createElement("div", { className: "history-row__content" });
  const heading = createElement("div", { className: "history-row__heading" });
  heading.append(
    createElement("h3", { text: bikeName }),
    createElement("strong", { className: "history-row__sag", text: `${formatDisplayNumber(measurement.currentSag)}% SAG` })
  );

  const metadata = createElement("div", { className: "history-row__metadata" });
  metadata.append(
    createElement("span", { text: definition.title }),
    createElement("time", { text: date, attributes: { datetime: measurement.date } }),
    createElement("span", { text: pressure })
  );

  const status = createElement("span", {
    className: "history-row__status",
    text: interpretation.message,
    attributes: { "data-tone": interpretation.tone }
  });

  content.append(heading, metadata, status);

  const actions = createElement("div", { className: "history-row__actions" });
  actions.append(
    createElement("button", {
      className: "secondary-action",
      text: "Szczegóły",
      attributes: { type: "button", "data-action": "show-measurement", "data-measurement-id": measurement.id }
    }),
    createElement("button", {
      className: "danger-link",
      text: "Usuń",
      attributes: { type: "button", "data-action": "delete-measurement", "data-measurement-id": measurement.id }
    })
  );

  card.append(icon, content, actions);
  return card;
}
