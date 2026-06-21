const STORAGE_KEY = "sagSetupLogbookWeb.v2";
const LEGACY_KEY = "sagSetupLogbookWeb.v1";

const defaultState = {
  bikes: [{ id: "demo-bike", name: "Trek Slash 8", forkTravel: 160, shockTravel: 65 }],
  selectedBikeId: "demo-bike",
  suspension: "fork",
  travel: { fork: 160, shock: 65 },
  compression: { fork: 40, shock: 18 },
  target: { fork: 25, shock: 30 },
  measurements: []
};

let state = loadState();

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clone = value => JSON.parse(JSON.stringify(value));

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.bikes) && Array.isArray(saved.measurements)) {
      return normalizeState(saved);
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy && Array.isArray(legacy.bikes)) {
      const migrated = clone(defaultState);
      migrated.bikes = legacy.bikes.map(bike => ({
        id: bike.id || makeId(),
        name: bike.model ? `${bike.name} — ${bike.model}` : bike.name,
        forkTravel: positiveNumber(bike.forkTravel, 160),
        shockTravel: positiveNumber(bike.shockTravel, 65)
      }));
      migrated.measurements = Array.isArray(legacy.measurements) ? legacy.measurements : [];
      migrated.selectedBikeId = migrated.bikes[0]?.id || "demo-bike";
      return normalizeState(migrated);
    }
  } catch (error) {
    console.warn("Nie udało się odczytać zapisanych danych.", error);
  }
  return clone(defaultState);
}

function normalizeState(value) {
  const normalized = { ...clone(defaultState), ...value };
  normalized.travel = { ...defaultState.travel, ...(value.travel || {}) };
  normalized.compression = { ...defaultState.compression, ...(value.compression || {}) };
  normalized.target = { ...defaultState.target, ...(value.target || {}) };
  if (!normalized.bikes.length) normalized.bikes = clone(defaultState.bikes);
  if (!normalized.bikes.some(bike => bike.id === normalized.selectedBikeId)) {
    normalized.selectedBikeId = normalized.bikes[0].id;
  }
  return normalized;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function currentBike() {
  return state.bikes.find(bike => bike.id === state.selectedBikeId) || state.bikes[0];
}

function current(key) {
  return Number(state[key][state.suspension]);
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: digits }).format(value);
}

function calculate() {
  const travel = Math.max(1, current("travel"));
  const compression = Math.max(0, current("compression"));
  const target = Math.min(99, Math.max(1, current("target")));
  const sag = compression / travel * 100;
  return { travel, compression, target, sag, difference: sag - target };
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function setCompression(nextValue) {
  const step = state.suspension === "fork" ? 1 : 0.5;
  const rounded = Math.round(nextValue / step) * step;
  state.compression[state.suspension] = Math.max(0, Math.min(current("travel"), rounded));
  saveState();
  renderMeasurement();
}

function renderMeasurement() {
  const isFork = state.suspension === "fork";
  const result = calculate();
  const bike = currentBike();

  $("#selectedBikeName").textContent = bike?.name || "Bez profilu";
  $("#travelLabel").textContent = isFork ? "Skok widelca" : "Skok dampera";
  $("#compressionTitle").textContent = isFork ? "Ugięcie widelca" : "Ugięcie dampera";
  $("#travelValue").textContent = `${formatNumber(result.travel, 1)} mm`;
  $("#compressionValue").textContent = formatNumber(result.compression, 1);
  $("#currentSag").textContent = `${formatNumber(result.sag, 1)} %`;

  $$(".segment").forEach(button => {
    button.classList.toggle("active", button.dataset.suspension === state.suspension);
    button.setAttribute("aria-pressed", String(button.dataset.suspension === state.suspension));
  });

  const range = $("#compressionRange");
  const visibleSpan = isFork ? 10 : 6;
  const step = isFork ? 1 : 0.5;
  const minimum = Math.max(0, Math.floor((result.compression - visibleSpan) / step) * step);
  const maximum = Math.max(minimum + step * 4, Math.ceil((result.compression + visibleSpan) / step) * step);
  range.min = minimum;
  range.max = maximum;
  range.step = step;
  range.value = result.compression;

  const labels = $$(".scale-labels span");
  labels.forEach((label, index) => {
    const value = minimum + (maximum - minimum) * index / (labels.length - 1);
    label.textContent = formatNumber(value, isFork ? 0 : 1);
  });

  const status = $("#sagStatus");
  status.className = "status-line";
  if (Math.abs(result.difference) <= 1) {
    status.innerHTML = '<span class="status-icon" aria-hidden="true">✓</span><span>Wartość w zakresie docelowym</span>';
  } else if (result.difference < 0) {
    status.classList.add("warning");
    status.innerHTML = '<span class="status-icon" aria-hidden="true">↓</span><span>SAG jest poniżej wartości docelowej</span>';
  } else {
    status.classList.add("error");
    status.innerHTML = '<span class="status-icon" aria-hidden="true">↑</span><span>SAG jest powyżej wartości docelowej</span>';
  }

  $$(".target-options button").forEach(button => {
    const buttonValue = Number(button.dataset.target);
    const active = Number.isFinite(buttonValue) && buttonValue === result.target;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#customTarget").value = result.target;
}

function fillBikeSelect() {
  const select = $("#bikeSelect");
  select.replaceChildren();
  state.bikes.forEach(bike => {
    const option = document.createElement("option");
    option.value = bike.id;
    option.textContent = bike.name;
    option.selected = bike.id === state.selectedBikeId;
    select.append(option);
  });
}

function selectBike(bikeId) {
  const bike = state.bikes.find(item => item.id === bikeId);
  if (!bike) return;
  state.selectedBikeId = bike.id;
  state.travel.fork = positiveNumber(bike.forkTravel, state.travel.fork);
  state.travel.shock = positiveNumber(bike.shockTravel, state.travel.shock);
  state.compression.fork = Math.min(state.compression.fork, state.travel.fork);
  state.compression.shock = Math.min(state.compression.shock, state.travel.shock);
  saveState();
  renderMeasurement();
  fillBikeSelect();
}

function addBike() {
  const nameInput = $("#bikeNameInput");
  const name = nameInput.value.trim();
  const forkTravel = positiveNumber($("#forkTravelInput").value, 0);
  const shockTravel = positiveNumber($("#shockTravelInput").value, 0);

  if (!name) {
    nameInput.focus();
    showToast("Podaj nazwę roweru");
    return;
  }
  if (!forkTravel || !shockTravel) {
    showToast("Podaj poprawne skoki zawieszenia");
    return;
  }

  const bike = { id: makeId(), name, forkTravel, shockTravel };
  state.bikes.push(bike);
  selectBike(bike.id);
  nameInput.value = "";
  $("#forkTravelInput").value = 160;
  $("#shockTravelInput").value = 65;
  showToast("Dodano rower");
}

function saveMeasurement() {
  const result = calculate();
  const bike = currentBike();
  const pressure = $("#pressureInput").value.trim();
  const rebound = $("#reboundInput").value.trim();
  const notes = $("#notesInput").value.trim();

  state.measurements.unshift({
    id: makeId(),
    date: new Date().toISOString(),
    bikeId: bike?.id || null,
    bikeName: bike?.name || "Bez profilu",
    suspensionType: state.suspension,
    travel: result.travel,
    compression: result.compression,
    target: result.target,
    sag: result.sag,
    pressure: pressure ? Number(pressure) : null,
    rebound: rebound ? Number(rebound) : null,
    notes
  });

  saveState();
  renderHistory();
  showToast("Pomiar zapisany");
}

function deleteMeasurement(measurementId) {
  state.measurements = state.measurements.filter(item => item.id !== measurementId);
  saveState();
  renderHistory();
  showToast("Pomiar usunięty");
}

function renderHistory() {
  const list = $("#historyList");
  list.replaceChildren();

  if (!state.measurements.length) {
    const empty = document.createElement("div");
    empty.className = "surface empty-state";
    const title = document.createElement("strong");
    title.textContent = "Brak pomiarów";
    const text = document.createElement("p");
    text.textContent = "Zapisz pierwszy pomiar na ekranie Pomiar.";
    empty.append(title, text);
    list.append(empty);
    return;
  }

  state.measurements.forEach(item => {
    const card = document.createElement("article");
    card.className = "surface history-card";

    const head = document.createElement("div");
    head.className = "history-head";
    const title = document.createElement("strong");
    title.textContent = `${item.suspensionType === "shock" ? "Damper" : "Widelec"} · ${item.bikeName || "Bez profilu"}`;
    const sag = document.createElement("span");
    sag.textContent = `${formatNumber(Number(item.sag ?? item.currentSag ?? 0), 1)}% SAG`;
    head.append(title, sag);

    const values = document.createElement("p");
    values.textContent = `Skok ${formatNumber(Number(item.travel), 1)} mm · Ugięcie ${formatNumber(Number(item.compression), 1)} mm · Cel ${formatNumber(Number(item.target ?? item.targetSag ?? 0), 1)}%`;

    const date = document.createElement("p");
    date.textContent = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.date));

    card.append(head, values, date);

    if (item.pressure || item.rebound || item.notes) {
      const extra = document.createElement("p");
      const parts = [];
      if (item.pressure) parts.push(`${item.pressure} PSI`);
      if (item.rebound !== null && item.rebound !== undefined && item.rebound !== "") parts.push(`Rebound ${item.rebound}`);
      if (item.notes) parts.push(item.notes);
      extra.textContent = parts.join(" · ");
      card.append(extra);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "history-delete";
    remove.textContent = "Usuń pomiar";
    remove.addEventListener("click", () => deleteMeasurement(item.id));
    card.append(remove);
    list.append(card);
  });
}

function exportData() {
  const payload = { schemaVersion: 2, exportedAt: new Date().toISOString(), ...state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sag-logbook-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  $("#dataStatus").textContent = "Dane wyeksportowano.";
}

async function importData(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.bikes) || !Array.isArray(parsed.measurements)) throw new Error("Nieprawidłowy plik");
    state = normalizeState(parsed);
    saveState();
    fillBikeSelect();
    renderMeasurement();
    renderHistory();
    $("#dataStatus").textContent = "Dane zaimportowano.";
    showToast("Dane zaimportowane");
  } catch (error) {
    $("#dataStatus").textContent = "Nie udało się zaimportować pliku.";
    showToast("Błędny plik danych");
  }
}

function switchView(button) {
  $$(".view").forEach(view => view.classList.toggle("active", view.id === button.dataset.view));
  $$(".nav-item").forEach(item => item.classList.toggle("active", item === button));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$(".segment").forEach(button => button.addEventListener("click", () => {
  state.suspension = button.dataset.suspension;
  saveState();
  renderMeasurement();
}));

$("#decreaseButton").addEventListener("click", () => setCompression(current("compression") - (state.suspension === "fork" ? 1 : 0.5)));
$("#increaseButton").addEventListener("click", () => setCompression(current("compression") + (state.suspension === "fork" ? 1 : 0.5)));
$("#compressionRange").addEventListener("input", event => setCompression(Number(event.target.value)));

$$(".target-options button").forEach(button => button.addEventListener("click", () => {
  if (button.dataset.target === "custom") {
    $("#customTargetWrap").classList.remove("hidden");
    $("#customTarget").focus();
    return;
  }
  state.target[state.suspension] = Number(button.dataset.target);
  $("#customTargetWrap").classList.add("hidden");
  saveState();
  renderMeasurement();
}));

$("#customTarget").addEventListener("input", event => {
  state.target[state.suspension] = Math.max(1, Math.min(99, Number(event.target.value) || 1));
  saveState();
  renderMeasurement();
});

$("#travelButton").addEventListener("click", () => {
  $("#travelDialogTitle").textContent = state.suspension === "fork" ? "Skok widelca" : "Skok dampera";
  $("#travelInput").value = current("travel");
  $("#travelDialog").showModal();
});

$("#saveTravelButton").addEventListener("click", () => {
  const next = positiveNumber($("#travelInput").value, current("travel"));
  state.travel[state.suspension] = next;
  state.compression[state.suspension] = Math.min(state.compression[state.suspension], next);
  const bike = currentBike();
  if (bike) bike[state.suspension === "fork" ? "forkTravel" : "shockTravel"] = next;
  saveState();
  renderMeasurement();
});

$("#bikeButton").addEventListener("click", () => {
  fillBikeSelect();
  $("#bikeDialog").showModal();
});
$("#manageBikesButton").addEventListener("click", () => {
  fillBikeSelect();
  $("#bikeDialog").showModal();
});
$("#bikeSelect").addEventListener("change", event => selectBike(event.target.value));
$("#addBikeButton").addEventListener("click", addBike);

$("#saveMeasurementButton").addEventListener("click", saveMeasurement);
$$(".nav-item").forEach(button => button.addEventListener("click", () => switchView(button)));
$("#settingsButton").addEventListener("click", () => $("#moreTab").click());
$("#exportButton").addEventListener("click", exportData);
$("#importInput").addEventListener("change", event => {
  const file = event.target.files[0];
  if (file) importData(file);
  event.target.value = "";
});

$("#compressionHelp").addEventListener("click", () => alert("Zmierz przesunięcie gumowego pierścienia na zawieszeniu."));
$("#targetHelp").addEventListener("click", () => alert("Najczęściej stosuje się docelowy SAG od 20% do 30%."));

fillBikeSelect();
renderMeasurement();
renderHistory();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
