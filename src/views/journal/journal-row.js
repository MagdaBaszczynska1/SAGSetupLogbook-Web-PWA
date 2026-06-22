import {
  RIDE_MEASUREMENT_STATUS,
  TRAIL_CONDITION_CONTENT,
  getRideMeasurementAttachmentStatus
} from "../../models/ride-journal-entry.js";
import { formatDate } from "../../utils/date-formatters.js";
import { createElement } from "../../utils/dom.js";

function measurementStatusContent(entry) {
  const status = getRideMeasurementAttachmentStatus(entry);
  if (status.type === RIDE_MEASUREMENT_STATUS.NONE) {
    return { text: "Bez pomiaru", tone: "neutral" };
  }
  if (status.type === RIDE_MEASUREMENT_STATUS.HISTORICAL) {
    return { text: `Pomiar historyczny (${status.count})`, tone: "warning" };
  }
  return { text: `Pomiar z dnia jazdy (${status.count})`, tone: "success" };
}

export function createRideJournalRow(entry) {
  const condition = TRAIL_CONDITION_CONTENT[entry.conditions] ?? { title: "Nieznane", icon: "?" };
  const measurementStatus = measurementStatusContent(entry);
  const card = createElement("article", {
    className: "journal-row app-card",
    attributes: {
      "data-entry-id": entry.id,
      "aria-label": `${entry.routeName}, ${formatDate(entry.rideDate)}, ${entry.bikeNameSnapshot}, ${condition.title}, ocena ${entry.rating} na 5, ${measurementStatus.text}`
    }
  });

  const heading = createElement("div", { className: "journal-row__heading" });
  heading.append(
    createElement("div", {
      children: [
        createElement("h3", { text: entry.routeName }),
        createElement("p", { text: `${formatDate(entry.rideDate)} • ${entry.bikeNameSnapshot}` })
      ]
    }),
    createElement("span", {
      className: "journal-row__rating",
      text: `${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}`,
      attributes: { "aria-label": `Ocena ${entry.rating} na 5` }
    })
  );

  const tags = createElement("div", { className: "journal-row__tags" });
  tags.append(
    createElement("span", { className: "journal-tag", text: condition.title }),
    createElement("span", {
      className: "journal-tag",
      text: measurementStatus.text,
      attributes: { "data-tone": measurementStatus.tone }
    })
  );

  const actions = createElement("div", { className: "journal-row__actions" });
  actions.append(
    createElement("button", {
      className: "secondary-action",
      text: "Szczegóły",
      attributes: { type: "button", "data-action": "show-ride-entry", "data-entry-id": entry.id }
    }),
    createElement("button", {
      className: "danger-link",
      text: "Usuń",
      attributes: { type: "button", "data-action": "delete-ride-entry", "data-entry-id": entry.id }
    })
  );

  card.append(heading, tags, actions);
  return card;
}
