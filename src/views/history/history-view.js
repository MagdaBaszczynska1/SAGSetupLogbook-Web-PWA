import {
  HISTORY_BIKE_FILTER,
  HISTORY_SORT_ORDER,
  HISTORY_SUSPENSION_FILTER,
  createMeasurementHistoryQuery
} from "../../services/measurement-history-query.js";
import {
  MeasurementFormValidationError,
  validateMeasurementForm
} from "../../services/measurement-form.js";
import { createElement } from "../../utils/dom.js";
import { createHistoryFilters } from "./history-filters.js";
import { createMeasurementHistoryRow } from "./history-row.js";
import {
  createMeasurementDetailDialog,
  renderMeasurementDetail
} from "./measurement-detail-dialog.js";
import {
  clearMeasurementEditErrors,
  collectMeasurementEditValues,
  createMeasurementEditDialog,
  renderMeasurementEditErrors,
  renderMeasurementEditForm,
  updateMeasurementEditLabels
} from "./measurement-edit-dialog.js";
import {
  createHistoryConfirmationDialog,
  renderHistoryConfirmation
} from "./history-confirmation-dialog.js";

function createEmptyState(onStartMeasurement) {
  const element = createElement("section", {
    className: "history-empty app-card",
    attributes: { "data-region": "history-empty" }
  });
  element.innerHTML = `
    <span class="history-empty__icon" aria-hidden="true">◷</span>
    <h2>Brak zapisanych pomiarów</h2>
    <p>Wykonaj pierwszy pomiar SAG. Po zapisaniu pojawi się tutaj razem z wynikiem i ustawieniami zawieszenia.</p>
    <button type="button" class="primary-action" data-action="start-measurement">Wykonaj pomiar</button>
  `;
  element.querySelector('[data-action="start-measurement"]').addEventListener("click", onStartMeasurement);
  return element;
}

function createNoResultsState() {
  const element = createElement("section", {
    className: "history-no-results app-card",
    attributes: { "data-region": "history-no-results", hidden: "" }
  });
  element.innerHTML = `
    <span aria-hidden="true">☷</span>
    <h2>Brak pomiarów pasujących do filtrów</h2>
    <p>Zmień wybrany rower lub rodzaj zawieszenia albo pokaż wszystkie pomiary.</p>
    <button type="button" class="secondary-action" data-action="clear-history-filters">Pokaż wszystkie pomiary</button>
  `;
  return element;
}

export function createHistoryView({
  measurementStore,
  bikeStore,
  onStartMeasurement = () => { window.location.hash = "#/measurement"; },
  onAddRide = () => { window.location.hash = "#/journal"; }
}) {
  const root = createElement("section", {
    className: "screen history-screen",
    attributes: { "aria-labelledby": "history-heading" }
  });

  const intro = createElement("div", { className: "screen__intro history-intro" });
  intro.innerHTML = `
    <div><h2 class="screen__title" id="history-heading">Historia</h2><p class="screen__subtitle">Zapisane pomiary SAG, ich wyniki i ustawienia.</p></div>
    <button type="button" class="danger-outline history-delete-all" data-action="delete-all-measurements" hidden>Usuń wszystko</button>
  `;

  const filters = createHistoryFilters();
  filters.hidden = true;
  const emptyState = createEmptyState(onStartMeasurement);
  const noResults = createNoResultsState();
  const listSection = createElement("section", {
    className: "history-results",
    attributes: { "aria-labelledby": "history-results-heading", hidden: "" }
  });
  listSection.innerHTML = '<div class="history-section-heading"><h2 id="history-results-heading">Pomiary</h2></div><div class="history-list" data-region="history-list"></div>';

  const status = createElement("div", {
    className: "data-status",
    attributes: { "data-region": "history-status", role: "status", hidden: "" }
  });
  const notice = createElement("div", {
    className: "stage4-notice",
    attributes: { "data-region": "history-notice", role: "status", hidden: "" }
  });

  const detailDialog = createMeasurementDetailDialog();
  const editDialog = createMeasurementEditDialog();
  const confirmationDialog = createHistoryConfirmationDialog();

  root.append(intro, filters, emptyState, noResults, listSection, status, notice, detailDialog, editDialog, confirmationDialog);

  let measurementsSnapshot = {
    records: measurementStore.getAll(),
    errorMessage: measurementStore.errorMessage,
    noticeMessage: measurementStore.noticeMessage
  };
  let bikesSnapshot = { records: bikeStore.getAll() };
  let bikeFilter = HISTORY_BIKE_FILTER.ALL;
  let suspensionFilter = HISTORY_SUSPENSION_FILTER.ALL;
  let sortOrder = HISTORY_SORT_ORDER.NEWEST_FIRST;
  let selectedMeasurementID = null;
  let deleteRequest = null;

  function getQuery() {
    return createMeasurementHistoryQuery({
      measurements: measurementsSnapshot.records,
      bikeFilter,
      suspensionFilter,
      sortOrder
    });
  }

  function renderBikeFilter(query) {
    const select = root.querySelector('[data-field="history-bike-filter"]');
    select.replaceChildren();
    const all = document.createElement("option");
    all.value = HISTORY_BIKE_FILTER.ALL;
    all.textContent = "Wszystkie rowery";
    select.append(all);

    query.bikeOptions.forEach(option => {
      const element = document.createElement("option");
      element.value = option.id;
      element.textContent = option.name;
      select.append(element);
    });

    if (query.hasMeasurementsWithoutProfile) {
      const withoutProfile = document.createElement("option");
      withoutProfile.value = HISTORY_BIKE_FILTER.WITHOUT_PROFILE;
      withoutProfile.textContent = "Bez profilu";
      select.append(withoutProfile);
    }
    select.value = bikeFilter;
  }

  function render() {
    let query = getQuery();
    if (!query.isBikeFilterValid) {
      bikeFilter = HISTORY_BIKE_FILTER.ALL;
      query = getQuery();
    }

    const totalCount = measurementsSnapshot.records.length;
    const visibleCount = query.results.length;
    const hasMeasurements = totalCount > 0;

    emptyState.hidden = hasMeasurements;
    filters.hidden = !hasMeasurements;
    root.querySelector('[data-action="delete-all-measurements"]').hidden = !hasMeasurements;
    noResults.hidden = !hasMeasurements || visibleCount > 0;
    listSection.hidden = !hasMeasurements || visibleCount === 0;

    if (hasMeasurements) {
      renderBikeFilter(query);
      const sortSelect = root.querySelector('[data-field="history-sort-order"]');
      sortSelect.value = sortOrder;
      root.querySelectorAll("[data-history-suspension]").forEach(button => {
        const active = button.dataset.historySuspension === suspensionFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      root.querySelectorAll('[data-action="clear-history-filters"]').forEach(button => {
        button.hidden = !query.hasActiveFilters && button.closest(".history-filters");
      });
      root.querySelector('[data-text="history-count"]').textContent = `Widoczne: ${visibleCount} z ${totalCount}`;

      const list = root.querySelector('[data-region="history-list"]');
      list.replaceChildren(...query.results.map(createMeasurementHistoryRow));
    }

    const statusMessage = measurementsSnapshot.errorMessage ?? measurementsSnapshot.noticeMessage;
    status.hidden = !statusMessage;
    status.textContent = statusMessage ?? "";
    status.dataset.tone = measurementsSnapshot.errorMessage ? "error" : "notice";

    if (detailDialog.open && selectedMeasurementID) {
      const measurement = measurementStore.getById(selectedMeasurementID);
      if (!measurement) {
        detailDialog.close();
        selectedMeasurementID = null;
      } else {
        renderMeasurementDetail(detailDialog, measurement, { hasBikeProfiles: bikesSnapshot.records.length > 0 });
      }
    }
  }

  function clearFilters() {
    bikeFilter = HISTORY_BIKE_FILTER.ALL;
    suspensionFilter = HISTORY_SUSPENSION_FILTER.ALL;
    render();
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    window.clearTimeout(root.noticeTimer);
    root.noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4200);
  }

  function openDetail(id) {
    const measurement = measurementStore.getById(id);
    if (!measurement) return;
    selectedMeasurementID = id;
    renderMeasurementDetail(detailDialog, measurement, { hasBikeProfiles: bikesSnapshot.records.length > 0 });
    detailDialog.showModal();
  }

  function openEditor(measurement) {
    if (!measurement) return;
    renderMeasurementEditForm(editDialog, measurement);
    editDialog.showModal();
    editDialog.querySelector('[data-field="suspensionTravel"]').focus();
  }

  function askDelete(mode, id = null) {
    deleteRequest = { mode, id };
    renderHistoryConfirmation(confirmationDialog, mode);
    confirmationDialog.showModal();
  }

  root.addEventListener("change", event => {
    if (event.target.matches('[data-field="history-bike-filter"]')) {
      bikeFilter = event.target.value;
      render();
    }
    if (event.target.matches('[data-field="history-sort-order"]')) {
      sortOrder = event.target.value;
      render();
    }
  });

  root.addEventListener("input", event => {
    const field = event.target.dataset.field;
    if (!field || !editDialog.open) return;
    const error = editDialog.querySelector(`[data-error="${field}"]`);
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
    const general = editDialog.querySelector('[data-text="measurement-edit-error"]');
    general.hidden = true;
    general.textContent = "";
  });

  root.addEventListener("click", event => {
    const button = event.target.closest("button[data-action], button[data-history-suspension], button[data-edit-suspension]");
    if (!button) return;

    if (button.dataset.historySuspension) {
      suspensionFilter = button.dataset.historySuspension;
      render();
      return;
    }
    if (button.dataset.editSuspension) {
      updateMeasurementEditLabels(editDialog, button.dataset.editSuspension);
      clearMeasurementEditErrors(editDialog);
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.measurementId;
    if (action === "clear-history-filters") clearFilters();
    if (action === "show-measurement") openDetail(id);
    if (action === "delete-measurement") askDelete("one", id);
    if (action === "delete-all-measurements") askDelete("all");
    if (action === "close-measurement-detail") detailDialog.close();
    if (action === "close-measurement-edit") editDialog.close();
    if (action === "cancel-history-delete") confirmationDialog.close();
    if (action === "edit-measurement") openEditor(measurementStore.getById(selectedMeasurementID));
    if (action === "delete-from-measurement-detail") {
      detailDialog.close();
      askDelete("one", selectedMeasurementID);
    }
    if (action === "add-ride-from-measurement") {
      const measurement = measurementStore.getById(selectedMeasurementID);
      if (measurement && bikesSnapshot.records.length > 0) {
        detailDialog.close();
        onAddRide(measurement);
      }
    }
    if (action === "confirm-history-delete") {
      const error = confirmationDialog.querySelector('[data-text="history-delete-error"]');
      button.disabled = true;
      const operation = deleteRequest?.mode === "all"
        ? measurementStore.deleteAll()
        : measurementStore.delete(deleteRequest?.id);
      Promise.resolve(operation).then(success => {
        button.disabled = false;
        if (success) {
          if (deleteRequest?.mode === "all") clearFilters();
          confirmationDialog.close();
          if (deleteRequest?.id === selectedMeasurementID) {
            selectedMeasurementID = null;
            if (detailDialog.open) detailDialog.close();
            if (editDialog.open) editDialog.close();
          }
          showNotice(deleteRequest?.mode === "all" ? "Usunięto całą Historię pomiarów." : "Pomiar został usunięty.");
          deleteRequest = null;
        } else {
          error.hidden = false;
          error.textContent = measurementStore.errorMessage ?? "Nie udało się usunąć pomiaru.";
        }
      });
    }
  });

  editDialog.querySelector('[data-form="measurement-edit"]').addEventListener("submit", async event => {
    event.preventDefault();
    const original = measurementStore.getById(editDialog.dataset.measurementId);
    if (!original) {
      renderMeasurementEditErrors(editDialog, {}, "Nie znaleziono pomiaru do edycji.");
      return;
    }

    const submit = editDialog.querySelector('[data-action="save-measurement-edit"]');
    submit.disabled = true;
    submit.textContent = "Zapisywanie…";
    try {
      const updated = validateMeasurementForm(collectMeasurementEditValues(editDialog), original);
      const success = await measurementStore.update(updated);
      if (success) {
        editDialog.close();
        showNotice("Zmiany pomiaru zostały zapisane.");
      } else {
        renderMeasurementEditErrors(editDialog, {}, measurementStore.errorMessage ?? "Nie udało się zapisać zmian.");
      }
    } catch (error) {
      if (error instanceof MeasurementFormValidationError) {
        renderMeasurementEditErrors(editDialog, error.errors);
        if (error.firstField) editDialog.querySelector(`[data-field="${error.firstField}"]`)?.focus();
      } else {
        console.error("Nie udało się zaktualizować pomiaru.", error);
        renderMeasurementEditErrors(editDialog, {}, "Nie udało się sprawdzić lub zapisać danych pomiaru.");
      }
    } finally {
      submit.disabled = false;
      submit.textContent = "Zapisz";
    }
  });

  measurementStore.subscribe(snapshot => {
    measurementsSnapshot = snapshot;
    render();
  });
  bikeStore.subscribe(snapshot => {
    bikesSnapshot = snapshot;
    render();
  });

  return root;
}
