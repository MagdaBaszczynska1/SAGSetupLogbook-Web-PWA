export const APPEARANCE_MODE = Object.freeze({
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark"
});

const STORAGE_KEY = "sagSetupLogbookWeb.settings.v1";
const DEFAULT_SETTINGS = Object.freeze({ appearanceMode: APPEARANCE_MODE.SYSTEM });

function normalizeSettings(value) {
  const appearanceMode = Object.values(APPEARANCE_MODE).includes(value?.appearanceMode)
    ? value.appearanceMode
    : APPEARANCE_MODE.SYSTEM;
  return Object.freeze({ appearanceMode });
}

export function applyAppearance(settings, documentObject) {
  if (!documentObject?.documentElement) return;
  const normalized = normalizeSettings(settings);
  if (normalized.appearanceMode === APPEARANCE_MODE.SYSTEM) {
    documentObject.documentElement.removeAttribute("data-theme");
  } else {
    documentObject.documentElement.dataset.theme = normalized.appearanceMode;
  }
}

export function createAppSettingsStore(storage, documentObject) {
  const listeners = new Set();
  let settings = DEFAULT_SETTINGS;
  let errorMessage = null;

  try {
    const raw = storage?.getItem(STORAGE_KEY);
    settings = normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
  } catch {
    errorMessage = "Nie udało się odczytać zapisanych ustawień wyglądu.";
  }
  applyAppearance(settings, documentObject);

  function snapshot() {
    return Object.freeze({ ...settings, errorMessage });
  }

  function notify() {
    const value = snapshot();
    listeners.forEach(listener => listener(value));
  }

  function setAppearanceMode(appearanceMode) {
    if (!Object.values(APPEARANCE_MODE).includes(appearanceMode)) {
      errorMessage = "Nieznany tryb wyglądu.";
      notify();
      return false;
    }
    const next = normalizeSettings({ appearanceMode });
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(next));
      settings = next;
      errorMessage = null;
      applyAppearance(settings, documentObject);
      notify();
      return true;
    } catch {
      errorMessage = "Nie udało się zapisać ustawień wyglądu w tej przeglądarce.";
      notify();
      return false;
    }
  }

  return Object.freeze({
    setAppearanceMode,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    getSettings: snapshot,
    get appearanceMode() { return settings.appearanceMode; },
    get errorMessage() { return errorMessage; }
  });
}
