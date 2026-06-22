import test from "node:test";
import assert from "node:assert/strict";
import { createPwaManager } from "../../src/pwa/pwa-manager.js";

function eventTarget(extra = {}) {
  return Object.assign(new EventTarget(), extra);
}

function createEnvironment({ controller = null, waiting = null } = {}) {
  let reloadCount = 0;
  let updateCount = 0;
  let registerArguments = null;
  const registration = eventTarget({
    waiting,
    installing: null,
    async update() { updateCount += 1; }
  });
  const serviceWorker = eventTarget({
    controller,
    ready: Promise.resolve(registration),
    async register(url, options) {
      registerArguments = { url: String(url), options };
      return registration;
    }
  });
  const windowObject = eventTarget({
    location: { reload() { reloadCount += 1; } },
    matchMedia() { return { matches: false }; }
  });
  const documentObject = eventTarget({ visibilityState: "visible" });
  const navigatorObject = { serviceWorker, onLine: true, standalone: false };
  return {
    registration,
    serviceWorker,
    windowObject,
    documentObject,
    navigatorObject,
    values: {
      get reloadCount() { return reloadCount; },
      get updateCount() { return updateCount; },
      get registerArguments() { return registerArguments; }
    }
  };
}

test("brak Service Worker API nie blokuje uruchomienia aplikacji", async () => {
  const manager = createPwaManager({
    navigatorObject: { onLine: true },
    windowObject: eventTarget({ matchMedia: () => ({ matches: false }) }),
    documentObject: eventTarget({ visibilityState: "visible" })
  });
  assert.equal(manager.getState().supported, false);
  assert.equal(await manager.start(), null);
});

test("rejestruje worker ze scope aplikacji i bez cache skryptu aktualizacji", async () => {
  const environment = createEnvironment();
  const manager = createPwaManager(environment);
  await manager.start();
  const state = manager.getState();
  assert.equal(state.registered, true);
  assert.equal(state.ready, true);
  assert.equal(environment.values.registerArguments.options.updateViaCache, "none");
  assert.match(environment.values.registerArguments.url, /\/sw\.js$/);
  assert.match(environment.values.registerArguments.options.scope, /\/$/);
  assert.equal(environment.values.updateCount, 1);
});

test("oczekująca aktualizacja jest pokazywana i aktywowana dopiero po decyzji użytkownika", async () => {
  const messages = [];
  const waiting = { postMessage(message) { messages.push(message); } };
  const environment = createEnvironment({ controller: {}, waiting });
  const manager = createPwaManager(environment);
  await manager.start();
  assert.equal(manager.getState().updateAvailable, true);
  assert.equal(manager.activateUpdate(), true);
  assert.deepEqual(messages, [{ type: "SKIP_WAITING" }]);
  assert.equal(environment.values.reloadCount, 0);
  environment.serviceWorker.dispatchEvent(new Event("controllerchange"));
  assert.equal(environment.values.reloadCount, 1);
});

test("przechwytuje natywny prompt instalacji i zwraca wybór użytkownika", async () => {
  const environment = createEnvironment();
  const manager = createPwaManager(environment);
  await manager.start();
  let prevented = false;
  let prompted = false;
  const promptEvent = new Event("beforeinstallprompt");
  promptEvent.preventDefault = () => { prevented = true; };
  promptEvent.prompt = async () => { prompted = true; };
  promptEvent.userChoice = Promise.resolve({ outcome: "accepted" });
  environment.windowObject.dispatchEvent(promptEvent);
  assert.equal(prevented, true);
  assert.equal(manager.getState().installPromptAvailable, true);
  const result = await manager.promptInstall();
  assert.equal(prompted, true);
  assert.equal(result.outcome, "accepted");
  assert.equal(manager.getState().installPromptAvailable, false);
});

test("zmiany online i offline aktualizują stan", async () => {
  const environment = createEnvironment();
  const manager = createPwaManager(environment);
  await manager.start();
  environment.windowObject.dispatchEvent(new Event("offline"));
  assert.equal(manager.getState().online, false);
  environment.windowObject.dispatchEvent(new Event("online"));
  assert.equal(manager.getState().online, true);
});
