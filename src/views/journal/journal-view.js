import {
  JOURNAL_BIKE_FILTER,
  JOURNAL_CONDITION_FILTER,
  JOURNAL_SORT_ORDER,
  createRideJournalQuery
} from "../../services/ride-journal-query.js";
import {
  RideJournalConfirmationRequiredError,
  RideJournalValidationError,
  getEditableRideSnapshots,
  hasRideContextChanged,
  rideEntryToFormValues,
  validateRideJournalForm
} from "../../services/ride-journal-form.js";
import { getRideMeasurementCandidates } from "../../services/ride-measurement-candidates.js";
import { createSagMeasurementSnapshot } from "../../models/ride-journal-entry.js";
import { createElement } from "../../utils/dom.js";
import { dateInputValueToIso, toDateInputValue } from "../../utils/date-formatters.js";
import { createJournalFilters } from "./journal-filters.js";
import { createRideJournalRow } from "./journal-row.js";
import {
  clearRideEntryErrors,
  collectRideEntryValues,
  createRideEntryDialog,
  renderRideEntryErrors,
  renderRideEntryForm,
  renderRideMeasurementCandidates,
  updateRideCondition,
  updateRideRating
} from "./ride-entry-dialog.js";
import { createRideDetailDialog, renderRideDetail } from "./ride-detail-dialog.js";
import {
  JOURNAL_CONFIRMATION_MODE,
  createJournalConfirmationDialog,
  renderJournalConfirmation
} from "./journal-confirmation-dialog.js";

function createJournalEmptyState() {
  const section = createElement("section", {
    className: "journal-empty app-card",
    attributes: { "data-region": "journal-empty" }
  });
  section.innerHTML = '<span class="journal-empty__icon" aria-hidden="true">▤</span><h2 data-text="journal-empty-title"></h2><p data-text="journal-empty-message"></p><button type="button" class="primary-action" data-action="journal-empty-action"></button>';
  return section;
}

function createJournalNoResults() {
  const section = createElement("section", {
    className: "journal-no-results app-card",
    attributes: { "data-region": "journal-no-results", hidden: "" }
  });
  section.innerHTML = '<span aria-hidden="true">⌕</span><h2>Brak pasujących wpisów</h2><p>Zmień wyszukiwanie, rower lub warunki.</p><button type="button" class="secondary-action" data-action="clear-journal-filters">Pokaż cały Dziennik</button>';
  return section;
}

export function createJournalView({
  rideJournalStore,
  bikeStore,
  measurementStore,
  rideDraftStore,
  onManageBikes = () => { window.location.hash = "#/more"; }
}) {
  const root = createElement("section", {
    className: "screen journal-screen",
    attributes: { "aria-labelledby": "journal-heading" }
  });
  const intro = createElement("div", { className: "screen__intro journal-intro" });
  intro.innerHTML = '<div><h2 class="screen__title" id="journal-heading">Dziennik</h2><p class="screen__subtitle">Jazdy, warunki, oceny i historyczne ustawienia zawieszenia.</p></div><div class="journal-intro__actions"><button type="button" class="primary-action" data-action="add-ride-entry">Dodaj wpis</button><button type="button" class="danger-outline" data-action="delete-all-ride-entries" hidden>Usuń wszystko</button></div>';

  const filters = createJournalFilters();
  filters.hidden = true;
  const emptyState = createJournalEmptyState();
  const noResults = createJournalNoResults();
  const results = createElement("section", {
    className: "journal-results",
    attributes: { "aria-labelledby": "journal-results-heading", hidden: "" }
  });
  results.innerHTML = '<div class="journal-section-heading"><h2 id="journal-results-heading">Wpisy z jazd</h2></div><div class="journal-list" data-region="journal-list"></div>';
  const status = createElement("div", { className: "data-status", attributes: { role: "status", "data-region": "journal-status", hidden: "" } });
  const notice = createElement("div", { className: "stage4-notice", attributes: { role: "status", "data-region": "journal-notice", hidden: "" } });
  const entryDialog = createRideEntryDialog();
  const detailDialog = createRideDetailDialog();
  const confirmationDialog = createJournalConfirmationDialog();
  root.append(intro, filters, emptyState, noResults, results, status, notice, entryDialog, detailDialog, confirmationDialog);

  let entriesSnapshot = { records: rideJournalStore.getAll(), errorMessage: rideJournalStore.errorMessage, noticeMessage: rideJournalStore.noticeMessage };
  let bikesSnapshot = { records: bikeStore.getAll() };
  let measurementsSnapshot = { records: measurementStore.getAll() };
  let searchText = "";
  let bikeFilter = JOURNAL_BIKE_FILTER.ALL;
  let conditionFilter = JOURNAL_CONDITION_FILTER.ALL;
  let sortOrder = JOURNAL_SORT_ORDER.NEWEST_FIRST;
  let selectedEntryID = null;
  let confirmationRequest = null;
  let pendingDraftMeasurement = rideDraftStore.getSourceMeasurement();
  let editor = null;

  function query() {
    return createRideJournalQuery({ entries: entriesSnapshot.records, searchText, bikeFilter, conditionFilter, sortOrder });
  }

  function renderBikeFilter(currentQuery) {
    const select = root.querySelector('[data-field="journal-bike-filter"]');
    select.replaceChildren();
    const all = document.createElement("option");
    all.value = JOURNAL_BIKE_FILTER.ALL;
    all.textContent = "Wszystkie rowery";
    select.append(all);
    currentQuery.bikeOptions.forEach(option => {
      const element = document.createElement("option");
      element.value = option.id;
      element.textContent = option.name;
      select.append(element);
    });
    select.value = bikeFilter;
  }

  function render() {
    let currentQuery = query();
    if (!currentQuery.isBikeFilterValid) {
      bikeFilter = JOURNAL_BIKE_FILTER.ALL;
      currentQuery = query();
    }
    const total = entriesSnapshot.records.length;
    const visible = currentQuery.results.length;
    const hasEntries = total > 0;
    const hasBikes = bikesSnapshot.records.length > 0;

    emptyState.hidden = hasEntries;
    filters.hidden = !hasEntries;
    noResults.hidden = !hasEntries || visible > 0;
    results.hidden = !hasEntries || visible === 0;
    root.querySelector('[data-action="delete-all-ride-entries"]').hidden = !hasEntries;

    if (!hasEntries) {
      root.querySelector('[data-text="journal-empty-title"]').textContent = hasBikes ? "Brak wpisów w Dzienniku" : "Najpierw dodaj profil roweru";
      root.querySelector('[data-text="journal-empty-message"]').textContent = hasBikes
        ? "Zapisz pierwszą jazdę, jej warunki, ocenę oraz pomiary SAG."
        : "Dziennik wymaga profilu, aby zachować historyczne ustawienia roweru.";
      const action = root.querySelector('[data-action="journal-empty-action"]');
      action.textContent = hasBikes ? "Dodaj pierwszy wpis" : "Przejdź do profili";
      action.dataset.emptyMode = hasBikes ? "add" : "profiles";
      root.querySelector('[data-region="journal-list"]').replaceChildren();
    } else {
      renderBikeFilter(currentQuery);
      root.querySelector('[data-field="journal-search"]').value = searchText;
      root.querySelector('[data-field="journal-condition-filter"]').value = conditionFilter;
      root.querySelector('[data-field="journal-sort-order"]').value = sortOrder;
      root.querySelector('.journal-filters [data-action="clear-journal-filters"]').hidden = !currentQuery.hasActiveFilters;
      root.querySelector('[data-text="journal-count"]').textContent = `Widoczne: ${visible} z ${total} • Aktywne filtry: ${currentQuery.activeFilterCount}`;
      root.querySelector('[data-region="journal-list"]').replaceChildren(...currentQuery.results.map(createRideJournalRow));
    }

    const statusMessage = entriesSnapshot.errorMessage ?? entriesSnapshot.noticeMessage;
    status.hidden = !statusMessage;
    status.textContent = statusMessage ?? "";
    status.dataset.tone = entriesSnapshot.errorMessage ? "error" : "notice";

    if (detailDialog.open && selectedEntryID) {
      const entry = rideJournalStore.getById(selectedEntryID);
      if (!entry) {
        detailDialog.close();
        selectedEntryID = null;
      } else {
        renderRideDetail(detailDialog, entry);
      }
    }
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
    window.clearTimeout(root.noticeTimer);
    root.noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4200);
  }

  function clearFilters() {
    searchText = "";
    bikeFilter = JOURNAL_BIKE_FILTER.ALL;
    conditionFilter = JOURNAL_CONDITION_FILTER.ALL;
    render();
  }

  function currentEditorValues() {
    return editor ? collectRideEntryValues(entryDialog) : null;
  }

  function buildCandidates(values) {
    return getRideMeasurementCandidates({
      measurements: measurementsSnapshot.records,
      selectedBikeID: values.bikeID,
      rideDate: dateInputValueToIso(values.rideDate)
    });
  }

  function setSelectedSnapshot(snapshot) {
    for (const [id, existing] of editor.selectedSnapshots) {
      if (existing.suspensionType === snapshot.suspensionType) editor.selectedSnapshots.delete(id);
    }
    editor.selectedSnapshots.set(snapshot.sourceMeasurementID, snapshot);
  }

  function applySuggestions(candidateResult) {
    editor.selectedSnapshots.clear();
    candidateResult.suggestedIDs.forEach(id => {
      const measurement = measurementStore.getById(id);
      if (measurement) setSelectedSnapshot(createSagMeasurementSnapshot(measurement));
    });
    if (editor.sourceMeasurement) setSelectedSnapshot(createSagMeasurementSnapshot(editor.sourceMeasurement));
  }

  function refreshEditorContext({ restoreOriginal = true, autoSuggest = true } = {}) {
    if (!editor) return;
    const values = currentEditorValues();
    editor.contextChanged = hasRideContextChanged(values, editor.originalEntry);
    const candidateResult = buildCandidates(values);
    editor.candidates = candidateResult;

    if (editor.originalEntry && !editor.contextChanged && restoreOriginal) {
      editor.selectedSnapshots = new Map(editor.originalSnapshots.map(snapshot => [snapshot.sourceMeasurementID, snapshot]));
    } else if (autoSuggest) {
      applySuggestions(candidateResult);
    }
    renderRideMeasurementCandidates(entryDialog, {
      groups: candidateResult.groups,
      selectedSnapshots: [...editor.selectedSnapshots.values()],
      contextChanged: editor.contextChanged
    });
  }

  function openNewEntry(sourceMeasurement = null) {
    if (!bikesSnapshot.records.length) {
      if (sourceMeasurement) pendingDraftMeasurement = sourceMeasurement;
      showNotice("Dodaj najpierw profil roweru.");
      onManageBikes();
      return;
    }
    const values = { ...rideEntryToFormValues(null) };
    if (sourceMeasurement) {
      values.rideDate = toDateInputValue(sourceMeasurement.date);
      if (sourceMeasurement.bikeID && bikesSnapshot.records.some(bike => bike.id === sourceMeasurement.bikeID)) {
        values.bikeID = sourceMeasurement.bikeID;
      } else if (bikesSnapshot.records.length === 1) {
        values.bikeID = bikesSnapshot.records[0].id;
      }
    } else if (bikesSnapshot.records.length === 1) {
      values.bikeID = bikesSnapshot.records[0].id;
    }

    editor = {
      originalEntry: null,
      originalSnapshots: [],
      selectedSnapshots: new Map(),
      candidates: null,
      contextChanged: false,
      sourceMeasurement
    };
    renderRideEntryForm(entryDialog, { values, bikes: bikesSnapshot.records });
    refreshEditorContext({ restoreOriginal: false, autoSuggest: true });
    entryDialog.showModal();
    entryDialog.querySelector('[data-field="routeName"]').focus();
  }

  function openEditEntry(entry) {
    const values = rideEntryToFormValues(entry);
    const snapshots = getEditableRideSnapshots(entry);
    editor = {
      originalEntry: entry,
      originalSnapshots: snapshots,
      selectedSnapshots: new Map(snapshots.map(snapshot => [snapshot.sourceMeasurementID, snapshot])),
      candidates: null,
      contextChanged: false,
      sourceMeasurement: null
    };
    renderRideEntryForm(entryDialog, { values, bikes: bikesSnapshot.records, originalEntry: entry });
    refreshEditorContext({ restoreOriginal: true, autoSuggest: false });
    entryDialog.showModal();
    entryDialog.querySelector('[data-field="routeName"]').focus();
  }

  async function saveEditor(allowContextChangeWithoutMeasurements = false) {
    if (!editor) return false;
    const values = currentEditorValues();
    const bike = bikeStore.getById(values.bikeID);
    const submit = entryDialog.querySelector('[data-action="save-ride-entry"]');
    submit.disabled = true;
    submit.textContent = "Zapisywanie…";
    try {
      const entry = validateRideJournalForm(values, {
        bike,
        originalEntry: editor.originalEntry,
        measurementSnapshots: [...editor.selectedSnapshots.values()],
        allowContextChangeWithoutMeasurements
      });
      const success = editor.originalEntry
        ? await rideJournalStore.update(entry)
        : await rideJournalStore.add(entry);
      if (!success) {
        renderRideEntryErrors(entryDialog, {}, rideJournalStore.errorMessage ?? "Nie udało się zapisać wpisu.");
        return false;
      }
      const edited = Boolean(editor.originalEntry);
      entryDialog.close();
      editor = null;
      rideDraftStore.clear();
      showNotice(edited ? "Zmiany wpisu zostały zapisane." : "Wpis został dodany do Dziennika.");
      return true;
    } catch (error) {
      if (error instanceof RideJournalConfirmationRequiredError) {
        confirmationRequest = { mode: JOURNAL_CONFIRMATION_MODE.SAVE_WITHOUT_MEASUREMENT };
        renderJournalConfirmation(confirmationDialog, confirmationRequest.mode);
        confirmationDialog.showModal();
      } else if (error instanceof RideJournalValidationError) {
        renderRideEntryErrors(entryDialog, error.errors);
        if (error.firstField && ["bikeID", "routeName", "rideDate"].includes(error.firstField)) {
          entryDialog.querySelector(`[data-field="${error.firstField}"]`)?.focus();
        }
      } else {
        console.error("Nie udało się zapisać wpisu Dziennika.", error);
        renderRideEntryErrors(entryDialog, {}, "Nie udało się sprawdzić lub zapisać wpisu.");
      }
      return false;
    } finally {
      submit.disabled = false;
      submit.textContent = "Zapisz wpis";
    }
  }

  function openDetail(id) {
    const entry = rideJournalStore.getById(id);
    if (!entry) return;
    selectedEntryID = id;
    renderRideDetail(detailDialog, entry);
    detailDialog.showModal();
  }

  function askConfirmation(mode, id = null) {
    confirmationRequest = { mode, id };
    renderJournalConfirmation(confirmationDialog, mode);
    confirmationDialog.showModal();
  }

  root.addEventListener("input", event => {
    if (event.target.matches('[data-field="journal-search"]')) {
      searchText = event.target.value;
      render();
      return;
    }
    if (entryDialog.open && event.target.dataset.field) clearRideEntryErrors(entryDialog);
  });

  root.addEventListener("change", event => {
    if (event.target.matches('[data-field="journal-bike-filter"]')) {
      bikeFilter = event.target.value;
      render();
    } else if (event.target.matches('[data-field="journal-condition-filter"]')) {
      conditionFilter = event.target.value;
      render();
    } else if (event.target.matches('[data-field="journal-sort-order"]')) {
      sortOrder = event.target.value;
      render();
    } else if (entryDialog.open && event.target.matches('[data-field="bikeID"], [data-field="rideDate"]')) {
      refreshEditorContext({ restoreOriginal: true, autoSuggest: true });
    }
  });

  root.addEventListener("click", event => {
    const button = event.target.closest("button[data-action], button[data-ride-condition], button[data-ride-rating], button[data-ride-measurement-id]");
    if (!button) return;

    if (button.dataset.rideCondition) {
      updateRideCondition(entryDialog, button.dataset.rideCondition);
      return;
    }
    if (button.dataset.rideRating) {
      updateRideRating(entryDialog, Number(button.dataset.rideRating));
      return;
    }
    if (button.dataset.rideMeasurementId && editor) {
      const id = button.dataset.rideMeasurementId;
      if (editor.selectedSnapshots.has(id)) {
        editor.selectedSnapshots.delete(id);
      } else {
        const measurement = measurementStore.getById(id);
        if (measurement) setSelectedSnapshot(createSagMeasurementSnapshot(measurement));
      }
      renderRideMeasurementCandidates(entryDialog, {
        groups: editor.candidates.groups,
        selectedSnapshots: [...editor.selectedSnapshots.values()],
        contextChanged: editor.contextChanged
      });
      return;
    }

    const action = button.dataset.action;
    const id = button.dataset.entryId;
    if (action === "add-ride-entry") openNewEntry();
    if (action === "journal-empty-action") button.dataset.emptyMode === "profiles" ? onManageBikes() : openNewEntry();
    if (action === "clear-journal-filters") clearFilters();
    if (action === "show-ride-entry") openDetail(id);
    if (action === "delete-ride-entry") askConfirmation(JOURNAL_CONFIRMATION_MODE.DELETE_ONE, id);
    if (action === "delete-all-ride-entries") askConfirmation(JOURNAL_CONFIRMATION_MODE.DELETE_ALL);
    if (action === "close-ride-entry") {
      entryDialog.close();
      editor = null;
      rideDraftStore.clear();
    }
    if (action === "close-ride-detail") { detailDialog.close(); selectedEntryID = null; }
    if (action === "edit-ride-entry") {
      const entry = rideJournalStore.getById(selectedEntryID);
      if (entry) { detailDialog.close(); openEditEntry(entry); }
    }
    if (action === "delete-from-ride-detail") {
      detailDialog.close();
      askConfirmation(JOURNAL_CONFIRMATION_MODE.DELETE_ONE, selectedEntryID);
    }
    if (action === "clear-ride-measurements" && editor) {
      editor.selectedSnapshots.clear();
      renderRideMeasurementCandidates(entryDialog, { groups: editor.candidates.groups, selectedSnapshots: [], contextChanged: editor.contextChanged });
    }
    if (action === "cancel-journal-confirmation") confirmationDialog.close();
    if (action === "confirm-journal-action") {
      const error = confirmationDialog.querySelector('[data-text="journal-confirm-error"]');
      button.disabled = true;
      const finish = async () => {
        if (confirmationRequest?.mode === JOURNAL_CONFIRMATION_MODE.SAVE_WITHOUT_MEASUREMENT) {
          confirmationDialog.close();
          confirmationRequest = null;
          return saveEditor(true);
        }
        const success = confirmationRequest?.mode === JOURNAL_CONFIRMATION_MODE.DELETE_ALL
          ? await rideJournalStore.deleteAll()
          : await rideJournalStore.delete(confirmationRequest?.id);
        if (success) {
          confirmationDialog.close();
          if (confirmationRequest?.id === selectedEntryID) selectedEntryID = null;
          showNotice(confirmationRequest?.mode === JOURNAL_CONFIRMATION_MODE.DELETE_ALL ? "Usunięto cały Dziennik." : "Wpis został usunięty.");
          confirmationRequest = null;
        } else {
          error.hidden = false;
          error.textContent = rideJournalStore.errorMessage ?? "Nie udało się wykonać operacji.";
        }
        return success;
      };
      finish().finally(() => { button.disabled = false; });
    }
  });

  entryDialog.querySelector('[data-form="ride-entry"]').addEventListener("submit", event => {
    event.preventDefault();
    saveEditor(false);
  });

  entryDialog.addEventListener("close", () => {
    if (editor) {
      editor = null;
      rideDraftStore.clear();
    }
  });

  root.addEventListener("app:route-active", () => {
    if (pendingDraftMeasurement && !entryDialog.open) {
      const draft = pendingDraftMeasurement;
      pendingDraftMeasurement = null;
      openNewEntry(draft);
    }
  });

  rideJournalStore.subscribe(snapshot => { entriesSnapshot = snapshot; render(); });
  bikeStore.subscribe(snapshot => { bikesSnapshot = snapshot; render(); });
  measurementStore.subscribe(snapshot => {
    measurementsSnapshot = snapshot;
    if (editor && entryDialog.open) refreshEditorContext({ restoreOriginal: false, autoSuggest: false });
  });
  rideDraftStore.subscribe(measurement => {
    if (!measurement) return;
    pendingDraftMeasurement = measurement;
    if (root.isConnected) root.dispatchEvent(new CustomEvent("app:route-active"));
  });

  return root;
}
