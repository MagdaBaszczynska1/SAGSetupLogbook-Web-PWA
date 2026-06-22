const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function detectStandalone(windowObject, navigatorObject) {
  try {
    return Boolean(
      windowObject?.matchMedia?.("(display-mode: standalone)").matches
      || navigatorObject?.standalone === true
    );
  } catch {
    return false;
  }
}

function watchInstallingWorker(worker, callback) {
  if (!worker?.addEventListener) return;
  worker.addEventListener("statechange", () => callback(worker.state));
}

export function createPwaManager({
  navigatorObject = globalThis.navigator,
  windowObject = globalThis.window,
  documentObject = globalThis.document
} = {}) {
  const listeners = new Set();
  const serviceWorkers = navigatorObject?.serviceWorker ?? null;
  let registration = null;
  let deferredInstallPrompt = null;
  let started = false;
  let refreshRequested = false;
  let lastUpdateCheck = 0;
  let state = {
    supported: Boolean(serviceWorkers),
    registered: false,
    ready: false,
    installed: detectStandalone(windowObject, navigatorObject),
    installPromptAvailable: false,
    updateAvailable: false,
    online: navigatorObject?.onLine !== false,
    errorMessage: null
  };

  function snapshot() {
    return Object.freeze({ ...state });
  }

  function setState(patch) {
    state = { ...state, ...patch };
    const value = snapshot();
    listeners.forEach(listener => listener(value));
  }

  function inspectRegistration(value) {
    if (!value) return;
    registration = value;
    setState({
      registered: true,
      updateAvailable: Boolean(value.waiting && serviceWorkers?.controller),
      errorMessage: null
    });

    value.addEventListener?.("updatefound", () => {
      const installing = value.installing;
      watchInstallingWorker(installing, workerState => {
        if (workerState === "installed" && serviceWorkers?.controller) {
          setState({ updateAvailable: true });
        }
      });
    });
  }

  async function checkForUpdate({ force = false } = {}) {
    if (!registration?.update) return false;
    const now = Date.now();
    if (!force && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL_MS) return false;
    lastUpdateCheck = now;
    try {
      await registration.update();
      if (registration.waiting && serviceWorkers?.controller) setState({ updateAvailable: true });
      return true;
    } catch (error) {
      console.warn("Nie udało się sprawdzić aktualizacji PWA.", error);
      return false;
    }
  }

  async function start() {
    if (started) return registration;
    started = true;

    windowObject?.addEventListener?.("online", () => {
      setState({ online: true });
      checkForUpdate();
    });
    windowObject?.addEventListener?.("offline", () => setState({ online: false }));
    windowObject?.addEventListener?.("focus", () => checkForUpdate());
    documentObject?.addEventListener?.("visibilitychange", () => {
      if (documentObject.visibilityState === "visible") checkForUpdate();
    });
    windowObject?.addEventListener?.("beforeinstallprompt", event => {
      event.preventDefault?.();
      deferredInstallPrompt = event;
      setState({ installPromptAvailable: true });
    });
    windowObject?.addEventListener?.("appinstalled", () => {
      deferredInstallPrompt = null;
      setState({ installed: true, installPromptAvailable: false });
    });

    serviceWorkers?.addEventListener?.("controllerchange", () => {
      setState({ ready: true, updateAvailable: false });
      if (refreshRequested) {
        refreshRequested = false;
        windowObject?.location?.reload?.();
      }
    });

    if (!serviceWorkers?.register) return null;

    try {
      const workerUrl = new URL("../../sw.js", import.meta.url);
      const scopeUrl = new URL("../../", import.meta.url);
      const value = await serviceWorkers.register(workerUrl, {
        scope: scopeUrl.pathname,
        updateViaCache: "none"
      });
      inspectRegistration(value);
      if (serviceWorkers.ready) {
        await serviceWorkers.ready;
        setState({ ready: true });
      }
      await checkForUpdate({ force: true });
      return value;
    } catch (error) {
      console.error("Nie udało się uruchomić trybu offline.", error);
      setState({
        registered: false,
        ready: false,
        errorMessage: "Nie udało się uruchomić trybu offline w tej przeglądarce."
      });
      return null;
    }
  }

  async function promptInstall() {
    if (!deferredInstallPrompt) return Object.freeze({ outcome: "unavailable" });
    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    setState({ installPromptAvailable: false });
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      return Object.freeze({ outcome: choice?.outcome ?? "dismissed" });
    } catch (error) {
      console.warn("Nie udało się otworzyć instalacji PWA.", error);
      setState({ errorMessage: "Nie udało się otworzyć okna instalacji." });
      return Object.freeze({ outcome: "error" });
    }
  }

  function activateUpdate() {
    const waiting = registration?.waiting;
    if (!waiting) return false;
    refreshRequested = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }

  return Object.freeze({
    start,
    promptInstall,
    activateUpdate,
    checkForUpdate: () => checkForUpdate({ force: true }),
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    getState: snapshot,
    getRegistration: () => registration
  });
}
