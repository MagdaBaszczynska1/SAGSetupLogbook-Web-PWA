import test from "node:test";
import assert from "node:assert/strict";
import {
  APPEARANCE_MODE,
  applyAppearance,
  createAppSettingsStore
} from "../../src/stores/app-settings-store.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    value(key) { return values.get(key); }
  };
}

function createDocument() {
  const root = {
    dataset: {},
    removeAttribute(name) {
      if (name === "data-theme") delete this.dataset.theme;
    }
  };
  return { documentElement: root };
}

test("domyślny wygląd jest systemowy", () => {
  const documentObject = createDocument();
  const store = createAppSettingsStore(createStorage(), documentObject);
  assert.equal(store.appearanceMode, APPEARANCE_MODE.SYSTEM);
  assert.equal(documentObject.documentElement.dataset.theme, undefined);
});

test("zapisuje i natychmiast stosuje jasny albo ciemny wygląd", () => {
  const storage = createStorage();
  const documentObject = createDocument();
  const store = createAppSettingsStore(storage, documentObject);

  assert.equal(store.setAppearanceMode(APPEARANCE_MODE.DARK), true);
  assert.equal(documentObject.documentElement.dataset.theme, "dark");
  assert.equal(JSON.parse(storage.value("sagSetupLogbookWeb.settings.v1")).appearanceMode, "dark");

  assert.equal(store.setAppearanceMode(APPEARANCE_MODE.LIGHT), true);
  assert.equal(documentObject.documentElement.dataset.theme, "light");
});

test("powrót do trybu systemowego usuwa wymuszenie motywu", () => {
  const documentObject = createDocument();
  applyAppearance({ appearanceMode: "dark" }, documentObject);
  assert.equal(documentObject.documentElement.dataset.theme, "dark");
  applyAppearance({ appearanceMode: "system" }, documentObject);
  assert.equal(documentObject.documentElement.dataset.theme, undefined);
});

test("odrzuca nieznany tryb", () => {
  const store = createAppSettingsStore(createStorage(), createDocument());
  assert.equal(store.setAppearanceMode("sepia"), false);
  assert.match(store.errorMessage, /Nieznany tryb/);
});

test("błędny zapis w localStorage nie zmienia aktywnego ustawienia", () => {
  const storage = {
    getItem() { return null; },
    setItem() { throw new Error("brak miejsca"); }
  };
  const documentObject = createDocument();
  const store = createAppSettingsStore(storage, documentObject);
  assert.equal(store.setAppearanceMode("dark"), false);
  assert.equal(store.appearanceMode, "system");
  assert.equal(documentObject.documentElement.dataset.theme, undefined);
  assert.match(store.errorMessage, /Nie udało się zapisać/);
});
