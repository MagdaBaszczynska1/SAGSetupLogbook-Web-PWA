import { TRAIL_CONDITION_CONTENT } from "../../models/ride-journal-entry.js";
import { getSuspensionDefinition } from "../../models/suspension-type.js";
import { formatDateTime } from "../../utils/date-formatters.js";
import { createElement } from "../../utils/dom.js";
import { formatDisplayNumber } from "../../utils/formatters.js";

export function createRideEntryDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog ride-entry-dialog",
    attributes: { "aria-labelledby": "ride-entry-title" }
  });
  dialog.innerHTML = `
    <form class="dialog-panel ride-entry-form" data-form="ride-entry" novalidate>
      <div class="dialog-heading">
        <h3 id="ride-entry-title" data-text="ride-entry-title">Nowy wpis</h3>
        <button type="button" data-action="close-ride-entry" aria-label="Zamknij">×</button>
      </div>
      <section class="form-section">
        <h4>Jazda</h4>
        <label>Profil roweru <span aria-hidden="true">*</span>
          <select data-field="bikeID" required></select>
          <small class="field-error" data-error="bikeID" role="alert" hidden></small>
        </label>
        <label>Trasa lub miejsce <span aria-hidden="true">*</span>
          <input data-field="routeName" required autocomplete="off" placeholder="np. Leśna pętla">
          <small class="field-error" data-error="routeName" role="alert" hidden></small>
        </label>
        <label>Data jazdy <span aria-hidden="true">*</span>
          <input type="date" data-field="rideDate" required>
          <small class="field-error" data-error="rideDate" role="alert" hidden></small>
        </label>
      </section>
      <section class="form-section">
        <h4>Warunki</h4>
        <div class="ride-condition-grid" data-region="ride-conditions"></div>
        <small class="field-error" data-error="conditions" role="alert" hidden></small>
      </section>
      <section class="form-section">
        <h4>Ocena jazdy</h4>
        <div class="ride-rating" data-region="ride-rating" role="group" aria-label="Ocena jazdy od 1 do 5"></div>
        <small class="field-error" data-error="rating" role="alert" hidden></small>
      </section>
      <section class="form-section">
        <h4>Notatka</h4>
        <label class="sr-only" for="ride-notes">Notatka opcjonalna</label>
        <textarea id="ride-notes" data-field="notes" rows="4" placeholder="Ustawienia, odczucia, rzeczy do poprawy…"></textarea>
      </section>
      <section class="form-section ride-measurements-section">
        <div class="ride-form-section-heading"><div><h4>Pomiary SAG</h4><p>Możesz wybrać najwyżej jeden pomiar widelca i jeden dampera.</p></div><button type="button" class="text-action" data-action="clear-ride-measurements">Wyczyść wybór</button></div>
        <div class="context-warning" data-region="ride-context-warning" hidden>Zmiana roweru lub daty odłączyła wcześniej zapisane pomiary. Wybierz nowe albo potwierdź zapis bez pomiaru.</div>
        <div class="ride-candidate-groups" data-region="ride-candidate-groups"></div>
        <small class="field-error" data-error="measurements" role="alert" hidden></small>
      </section>
      <p class="form-error" data-text="ride-entry-error" role="alert" hidden></p>
      <div class="dialog-actions">
        <button type="button" class="secondary-action" data-action="close-ride-entry">Anuluj</button>
        <button type="submit" class="primary-action" data-action="save-ride-entry">Zapisz wpis</button>
      </div>
    </form>
  `;

  const conditions = dialog.querySelector('[data-region="ride-conditions"]');
  for (const [value, content] of Object.entries(TRAIL_CONDITION_CONTENT)) {
    conditions.append(createElement("button", {
      className: "ride-condition-button",
      text: content.title,
      attributes: { type: "button", "data-ride-condition": value, "aria-pressed": "false" }
    }));
  }
  const rating = dialog.querySelector('[data-region="ride-rating"]');
  for (let value = 1; value <= 5; value += 1) {
    rating.append(createElement("button", {
      className: "ride-rating-button",
      text: "★",
      attributes: { type: "button", "data-ride-rating": String(value), "aria-label": `${value} z 5`, "aria-pressed": "false" }
    }));
  }
  return dialog;
}

function createMeasurementChoice({ id, suspensionType, date, currentSag, pressure, selected, historical, sourceLabel }) {
  const definition = getSuspensionDefinition(suspensionType);
  const button = createElement("button", {
    className: "ride-measurement-choice",
    attributes: {
      type: "button",
      "data-ride-measurement-id": id,
      "aria-pressed": String(selected)
    }
  });
  button.classList.toggle("is-selected", selected);
  const heading = createElement("span", { className: "ride-measurement-choice__heading" });
  heading.append(
    createElement("strong", { text: definition.title }),
    createElement("span", { text: `${formatDisplayNumber(currentSag)}% SAG` })
  );
  const details = createElement("span", {
    className: "ride-measurement-choice__details",
    text: `${formatDateTime(date)} • ${pressure === null || pressure === undefined ? "bez ciśnienia" : `${formatDisplayNumber(pressure)} PSI`}`
  });
  const footer = createElement("span", { className: "ride-measurement-choice__footer" });
  footer.append(
    createElement("span", { text: sourceLabel }),
    createElement("span", { text: selected ? "Wybrano" : "Wybierz", attributes: { "data-tone": selected ? "success" : "neutral" } })
  );
  if (historical) button.dataset.historical = "true";
  button.append(heading, details, footer);
  return button;
}

export function renderRideMeasurementCandidates(dialog, {
  groups,
  selectedSnapshots,
  contextChanged = false
}) {
  const container = dialog.querySelector('[data-region="ride-candidate-groups"]');
  container.replaceChildren();
  dialog.querySelector('[data-region="ride-context-warning"]').hidden = !contextChanged;
  const selectedByID = new Map((selectedSnapshots ?? []).map(snapshot => [snapshot.sourceMeasurementID, snapshot]));
  const candidateIDs = new Set((groups ?? []).flatMap(group => group.measurements.map(measurement => measurement.id)));

  for (const group of groups ?? []) {
    const section = createElement("section", { className: "ride-candidate-group" });
    section.append(
      createElement("h5", { text: group.title }),
      createElement("p", { text: group.description })
    );
    const list = createElement("div", { className: "ride-candidate-list" });
    group.measurements.forEach(measurement => {
      list.append(createMeasurementChoice({
        id: measurement.id,
        suspensionType: measurement.suspensionType,
        date: measurement.date,
        currentSag: measurement.currentSag,
        pressure: measurement.pressure,
        selected: selectedByID.has(measurement.id),
        historical: group.id !== "sameDayBike",
        sourceLabel: group.id === "sameDayBike" ? "Ten sam dzień i rower" : group.id === "recentBike" ? "Wcześniejszy pomiar" : "Bez profilu"
      }));
    });
    section.append(list);
    container.append(section);
  }

  const retained = [...selectedByID.values()].filter(snapshot => !candidateIDs.has(snapshot.sourceMeasurementID));
  if (retained.length) {
    const section = createElement("section", { className: "ride-candidate-group" });
    section.append(
      createElement("h5", { text: "Pomiary już zapisane we wpisie" }),
      createElement("p", { text: "Źródłowy pomiar może być usunięty albo nie pasować do obecnych filtrów. Snapshot pozostaje bezpieczny." })
    );
    const list = createElement("div", { className: "ride-candidate-list" });
    retained.forEach(snapshot => {
      list.append(createMeasurementChoice({
        id: snapshot.sourceMeasurementID,
        suspensionType: snapshot.suspensionType,
        date: snapshot.measurementDate,
        currentSag: snapshot.currentSag,
        pressure: snapshot.pressure,
        selected: true,
        historical: true,
        sourceLabel: "Historyczna kopia"
      }));
    });
    section.append(list);
    container.append(section);
  }

  if (!container.children.length) {
    container.append(createElement("p", {
      className: "ride-no-candidates",
      text: "Brak pasujących pomiarów. Wpis można zapisać bez pomiaru."
    }));
  }
  dialog.querySelector('[data-action="clear-ride-measurements"]').hidden = selectedByID.size === 0;
}

export function renderRideEntryForm(dialog, { values, bikes, originalEntry = null }) {
  dialog.dataset.entryId = originalEntry?.id ?? "";
  dialog.dataset.condition = values.conditions;
  dialog.dataset.rating = String(values.rating);
  dialog.querySelector('[data-text="ride-entry-title"]').textContent = originalEntry ? "Edytuj wpis" : "Nowy wpis";

  const bikeSelect = dialog.querySelector('[data-field="bikeID"]');
  bikeSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Wybierz rower";
  bikeSelect.append(placeholder);
  for (const bike of bikes) {
    const option = document.createElement("option");
    option.value = bike.id;
    option.textContent = bike.model ? `${bike.name} — ${bike.model}` : bike.name;
    bikeSelect.append(option);
  }
  if (originalEntry && !bikes.some(bike => bike.id === originalEntry.bikeID)) {
    const historical = document.createElement("option");
    historical.value = originalEntry.bikeID;
    historical.textContent = `${originalEntry.bikeNameSnapshot} (profil usunięty)`;
    bikeSelect.append(historical);
  }
  bikeSelect.value = values.bikeID;
  dialog.querySelector('[data-field="routeName"]').value = values.routeName;
  dialog.querySelector('[data-field="rideDate"]').value = values.rideDate;
  dialog.querySelector('[data-field="notes"]').value = values.notes;
  updateRideCondition(dialog, values.conditions);
  updateRideRating(dialog, values.rating);
  clearRideEntryErrors(dialog);
}

export function updateRideCondition(dialog, value) {
  dialog.dataset.condition = value;
  dialog.querySelectorAll("[data-ride-condition]").forEach(button => {
    const active = button.dataset.rideCondition === value;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

export function updateRideRating(dialog, value) {
  const rating = Math.min(5, Math.max(1, Number(value) || 1));
  dialog.dataset.rating = String(rating);
  dialog.querySelectorAll("[data-ride-rating]").forEach(button => {
    const active = Number(button.dataset.rideRating) <= rating;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(Number(button.dataset.rideRating) === rating));
  });
}

export function collectRideEntryValues(dialog) {
  return Object.freeze({
    bikeID: dialog.querySelector('[data-field="bikeID"]').value,
    routeName: dialog.querySelector('[data-field="routeName"]').value,
    rideDate: dialog.querySelector('[data-field="rideDate"]').value,
    conditions: dialog.dataset.condition,
    rating: Number(dialog.dataset.rating),
    notes: dialog.querySelector('[data-field="notes"]').value
  });
}

export function clearRideEntryErrors(dialog) {
  dialog.querySelectorAll("[data-error]").forEach(element => {
    element.hidden = true;
    element.textContent = "";
  });
  const general = dialog.querySelector('[data-text="ride-entry-error"]');
  general.hidden = true;
  general.textContent = "";
}

export function renderRideEntryErrors(dialog, errors = {}, generalMessage = null) {
  clearRideEntryErrors(dialog);
  for (const [field, message] of Object.entries(errors)) {
    const element = dialog.querySelector(`[data-error="${field}"]`);
    if (!element) continue;
    element.hidden = false;
    element.textContent = message;
  }
  if (generalMessage) {
    const general = dialog.querySelector('[data-text="ride-entry-error"]');
    general.hidden = false;
    general.textContent = generalMessage;
  }
}
