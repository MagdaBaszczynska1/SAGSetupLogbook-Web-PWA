import { getBikeDisplayName } from "../../models/bike-profile.js";
import { bikeProfileToFormValues, validateBikeProfileForm } from "../../services/bike-profile-form.js";
import { createElement } from "../../utils/dom.js";
import { formatCompactNumber } from "../../utils/formatters.js";
import { escapeHtml } from "../../utils/html.js";

function valueText(value, unit) {
  return value === null || value === undefined ? "Nie ustawiono" : `${formatCompactNumber(value)} ${unit}`;
}

function bikeSummary(bike) {
  const parts = [];
  if (bike.forkTravel !== null) parts.push(`Widelec ${formatCompactNumber(bike.forkTravel)} mm`);
  if (bike.shockTravel !== null) parts.push(`Damper ${formatCompactNumber(bike.shockTravel)} mm`);
  return parts.length ? parts.join(" • ") : "Brak ustawień zawieszenia";
}

function createBikeFormDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog bike-form-dialog",
    attributes: { "aria-labelledby": "bike-form-title" }
  });
  dialog.innerHTML = `
    <form class="dialog-panel bike-form" data-form="bike" novalidate>
      <div class="dialog-heading"><h3 id="bike-form-title" data-text="bike-form-title">Nowy rower</h3><button type="button" data-action="close-bike-form" aria-label="Zamknij">×</button></div>
      <input type="hidden" data-field="bike-id">
      <section class="form-section"><h4>Rower</h4>
        <label>Nazwa profilu <span aria-hidden="true">*</span><input data-field="name" autocomplete="off" required placeholder="np. Rower enduro"></label>
        <label>Marka i model <span class="optional-text">Opcjonalne</span><input data-field="model" autocomplete="off" placeholder="np. Trek Slash"></label>
      </section>
      <section class="form-section"><h4>Widelec</h4>
        <label>Skok widelca <span class="unit-field"><input data-field="forkTravel" inputmode="decimal" placeholder="Wpisz"><span>mm</span></span></label>
        <label>Docelowy SAG <span class="unit-field"><input data-field="forkTargetSag" inputmode="decimal" placeholder="Wpisz"><span>%</span></span></label>
        <label>Ciśnienie widelca <span class="unit-field"><input data-field="forkPressure" inputmode="decimal" placeholder="Wpisz"><span>PSI</span></span></label>
      </section>
      <section class="form-section"><h4>Damper</h4>
        <label>Skok dampera <span class="unit-field"><input data-field="shockTravel" inputmode="decimal" placeholder="Wpisz"><span>mm</span></span><small>Wpisz skok tłoczyska dampera, nie skok tylnego koła.</small></label>
        <label>Docelowy SAG <span class="unit-field"><input data-field="shockTargetSag" inputmode="decimal" placeholder="Wpisz"><span>%</span></span></label>
        <label>Ciśnienie dampera <span class="unit-field"><input data-field="shockPressure" inputmode="decimal" placeholder="Wpisz"><span>PSI</span></span></label>
      </section>
      <p class="form-error" data-text="bike-form-error" role="alert" hidden></p>
      <div class="dialog-actions"><button type="button" class="secondary-action" data-action="close-bike-form">Anuluj</button><button type="submit" class="primary-action">Zapisz</button></div>
    </form>
  `;
  return dialog;
}

function createBikeDetailDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog",
    attributes: { "aria-labelledby": "bike-detail-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel bike-detail-panel">
      <div class="dialog-heading"><h3 id="bike-detail-title" data-text="bike-detail-name"></h3><button type="button" data-action="close-bike-detail" aria-label="Zamknij">×</button></div>
      <p data-text="bike-detail-model"></p>
      <section class="detail-section"><h4>Widelec</h4><div class="value-row"><span>Skok widelca</span><strong data-text="detail-fork-travel"></strong></div><div class="value-row"><span>Docelowy SAG</span><strong data-text="detail-fork-sag"></strong></div><div class="value-row"><span>Ciśnienie widelca</span><strong data-text="detail-fork-pressure"></strong></div></section>
      <section class="detail-section"><h4>Damper</h4><div class="value-row"><span>Skok dampera</span><strong data-text="detail-shock-travel"></strong></div><div class="value-row"><span>Docelowy SAG</span><strong data-text="detail-shock-sag"></strong></div><div class="value-row"><span>Ciśnienie dampera</span><strong data-text="detail-shock-pressure"></strong></div></section>
      <div class="dialog-actions"><button type="button" class="danger-action" data-action="delete-from-detail">Usuń profil</button><button type="button" class="primary-action" data-action="edit-from-detail">Edytuj</button></div>
    </div>
  `;
  return dialog;
}

function createConfirmationDialog() {
  const dialog = createElement("dialog", {
    className: "app-dialog",
    attributes: { "aria-labelledby": "bike-confirm-title" }
  });
  dialog.innerHTML = `
    <div class="dialog-panel"><div class="dialog-heading"><h3 id="bike-confirm-title" data-text="confirm-title"></h3><button type="button" data-action="cancel-delete" aria-label="Zamknij">×</button></div><p data-text="confirm-message"></p><div class="dialog-actions"><button type="button" class="secondary-action" data-action="cancel-delete">Anuluj</button><button type="button" class="danger-action" data-action="confirm-delete">Usuń</button></div></div>
  `;
  return dialog;
}

export function createBikesView({ bikeStore }) {
  const root = createElement("section", { className: "bikes-section", attributes: { "aria-labelledby": "bikes-heading" } });
  root.innerHTML = `
    <div class="profiles-hero app-card"><div><span class="hero-icon" aria-hidden="true">🚲</span><h2 id="bikes-heading">Profile rowerów</h2><p>Zapisz skok, docelowy SAG i ciśnienie, aby szybciej wykonywać kolejne pomiary.</p></div><button type="button" class="primary-action profiles-add" data-action="add-bike">Dodaj rower</button></div>
    <div class="data-status" data-region="bike-status" role="status" hidden></div>
    <div class="profiles-empty app-card" data-region="bikes-empty" hidden><span aria-hidden="true">🚲</span><h3>Brak profili rowerów</h3><p>Dodaj profil, aby automatycznie wczytywać ustawienia zawieszenia.</p><button type="button" class="primary-action" data-action="add-bike">Dodaj pierwszy rower</button></div>
    <div class="profiles-list" data-region="bikes-list"></div>
    <button type="button" class="danger-outline" data-action="delete-all-bikes" hidden>Usuń wszystkie profile</button>
  `;

  const formDialog = createBikeFormDialog();
  const detailDialog = createBikeDetailDialog();
  const confirmDialog = createConfirmationDialog();
  root.append(formDialog, detailDialog, confirmDialog);

  let currentBikeID = null;
  let deleteMode = null;

  function render(snapshot) {
    const list = root.querySelector('[data-region="bikes-list"]');
    const empty = root.querySelector('[data-region="bikes-empty"]');
    const deleteAll = root.querySelector('[data-action="delete-all-bikes"]');
    list.replaceChildren();
    empty.hidden = snapshot.records.length > 0;
    deleteAll.hidden = snapshot.records.length === 0;

    snapshot.records.forEach(bike => {
      const safeID = escapeHtml(bike.id);
      const safeName = escapeHtml(bike.name);
      const safeModel = escapeHtml(bike.model);
      const safeSummary = escapeHtml(bikeSummary(bike));
      const card = createElement("article", { className: "profile-card app-card", attributes: { "data-bike-id": bike.id } });
      card.innerHTML = `<div class="profile-card__main"><span class="profile-card__icon" aria-hidden="true">🚲</span><div><h3>${safeName}</h3>${bike.model ? `<p>${safeModel}</p>` : ""}<small>${safeSummary}</small></div></div><div class="profile-card__actions"><button type="button" class="secondary-action" data-action="show-bike" data-bike-id="${safeID}">Szczegóły</button><button type="button" class="secondary-action" data-action="edit-bike" data-bike-id="${safeID}">Edytuj</button><button type="button" class="danger-link" data-action="delete-bike" data-bike-id="${safeID}">Usuń</button></div>`;
      list.append(card);
    });

    const status = root.querySelector('[data-region="bike-status"]');
    const message = snapshot.errorMessage ?? snapshot.noticeMessage;
    status.hidden = !message;
    status.textContent = message ?? "";
    status.dataset.tone = snapshot.errorMessage ? "error" : "notice";
  }

  function openForm(bike = null) {
    currentBikeID = bike?.id ?? null;
    const values = bikeProfileToFormValues(bike);
    formDialog.querySelector('[data-text="bike-form-title"]').textContent = bike ? "Edytuj rower" : "Nowy rower";
    formDialog.querySelectorAll("[data-field]").forEach(input => {
      if (input.dataset.field === "bike-id") input.value = bike?.id ?? "";
      else if (input.dataset.field in values) input.value = values[input.dataset.field];
    });
    formDialog.querySelector('[data-text="bike-form-error"]').hidden = true;
    formDialog.showModal();
    formDialog.querySelector('[data-field="name"]').focus();
  }

  function openDetail(bike) {
    currentBikeID = bike.id;
    const set = (name, text) => { detailDialog.querySelector(`[data-text="${name}"]`).textContent = text; };
    set("bike-detail-name", bike.name);
    set("bike-detail-model", bike.model || "Profil roweru");
    set("detail-fork-travel", valueText(bike.forkTravel, "mm"));
    set("detail-fork-sag", valueText(bike.forkTargetSag, "%"));
    set("detail-fork-pressure", valueText(bike.forkPressure, "PSI"));
    set("detail-shock-travel", valueText(bike.shockTravel, "mm"));
    set("detail-shock-sag", valueText(bike.shockTargetSag, "%"));
    set("detail-shock-pressure", valueText(bike.shockPressure, "PSI"));
    detailDialog.showModal();
  }

  function askDelete(mode, bike = null) {
    deleteMode = mode;
    currentBikeID = bike?.id ?? null;
    confirmDialog.querySelector('[data-text="confirm-title"]').textContent = mode === "all" ? "Usunąć wszystkie profile?" : "Usunąć profil?";
    confirmDialog.querySelector('[data-text="confirm-message"]').textContent = mode === "all"
      ? "Wszystkie profile rowerów zostaną trwale usunięte. Zapisane pomiary zachowają historyczne nazwy rowerów."
      : "Profil zostanie trwale usunięty. Zapisane pomiary i wpisy Dziennika pozostaną bez zmian.";
    confirmDialog.showModal();
  }

  root.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const bike = button.dataset.bikeId ? bikeStore.getById(button.dataset.bikeId) : null;
    if (action === "add-bike") openForm();
    if (action === "show-bike" && bike) openDetail(bike);
    if (action === "edit-bike" && bike) openForm(bike);
    if (action === "delete-bike" && bike) askDelete("one", bike);
    if (action === "delete-all-bikes") askDelete("all");
    if (action === "close-bike-form") formDialog.close();
    if (action === "close-bike-detail") detailDialog.close();
    if (action === "edit-from-detail") { const selected = bikeStore.getById(currentBikeID); detailDialog.close(); if (selected) openForm(selected); }
    if (action === "delete-from-detail") { const selected = bikeStore.getById(currentBikeID); detailDialog.close(); if (selected) askDelete("one", selected); }
    if (action === "cancel-delete") confirmDialog.close();
    if (action === "confirm-delete") {
      const operation = deleteMode === "all" ? bikeStore.deleteAll() : bikeStore.delete(currentBikeID);
      Promise.resolve(operation).then(success => { if (success) confirmDialog.close(); });
    }
  });

  formDialog.querySelector('[data-form="bike"]').addEventListener("submit", async event => {
    event.preventDefault();
    const values = {};
    formDialog.querySelectorAll("[data-field]").forEach(input => { values[input.dataset.field] = input.value; });
    const existing = currentBikeID ? bikeStore.getById(currentBikeID) : null;
    const error = formDialog.querySelector('[data-text="bike-form-error"]');
    try {
      const bike = validateBikeProfileForm(values, existing);
      const success = existing ? await bikeStore.update(bike) : await bikeStore.add(bike);
      if (success) formDialog.close();
      else { error.textContent = bikeStore.errorMessage ?? "Nie udało się zapisać profilu."; error.hidden = false; }
    } catch (validationError) {
      error.textContent = validationError.message;
      error.hidden = false;
      const field = validationError.field && formDialog.querySelector(`[data-field="${validationError.field}"]`);
      field?.focus();
    }
  });

  bikeStore.subscribe(render);
  return root;
}
