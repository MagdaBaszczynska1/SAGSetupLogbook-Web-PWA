const CACHE_PREFIX = "sag-setup-logbook-";
const LEGACY_CACHE_PREFIX = "sag-logbook-";
const CACHE_NAME = `${CACHE_PREFIX}app-v9-20260622-2`;
const APP_VERSION = "0.9.0";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.svg",
  "./icons/icon-maskable.svg",
  "./src/styles/index.css",
  "./src/styles/tokens.css",
  "./src/styles/base.css",
  "./src/styles/layout.css",
  "./src/styles/components.css",
  "./src/styles/measurement-base.css",
  "./src/styles/measurement-controls.css",
  "./src/styles/measurement-actions.css",
  "./src/styles/profiles.css",
  "./src/styles/history.css",
  "./src/styles/journal.css",
  "./src/styles/more.css",
  "./src/styles/pwa.css",
  "./src/app/main.js",
  "./src/app/data-context.js",
  "./src/app/router.js",
  "./src/app/routes.js",
  "./src/pwa/pwa-manager.js",
  "./src/components/layout/app-shell.js",
  "./src/components/navigation/bottom-navigation.js",
  "./src/components/pwa/pwa-status.js",
  "./src/components/ui/stage-card.js",
  "./src/models/bike-profile.js",
  "./src/models/index.js",
  "./src/models/ride-journal-entry.js",
  "./src/models/sag-measurement.js",
  "./src/models/suspension-type.js",
  "./src/persistence/indexed-db.js",
  "./src/persistence/legacy-migration.js",
  "./src/persistence/memory-database.js",
  "./src/services/bike-profile-form.js",
  "./src/services/calculator-profile-prefill.js",
  "./src/services/data-backup.js",
  "./src/services/index.js",
  "./src/services/localized-number-parser.js",
  "./src/services/measurement-form.js",
  "./src/services/measurement-history-query.js",
  "./src/services/ride-journal-form.js",
  "./src/services/ride-journal-query.js",
  "./src/services/ride-measurement-candidates.js",
  "./src/services/sag-calculator.js",
  "./src/services/sag-slider-configuration.js",
  "./src/stores/app-settings-store.js",
  "./src/stores/bike-store.js",
  "./src/stores/index.js",
  "./src/stores/measurement-store.js",
  "./src/stores/observable-store.js",
  "./src/stores/ride-draft-store.js",
  "./src/stores/ride-journal-store.js",
  "./src/utils/clone.js",
  "./src/utils/date-formatters.js",
  "./src/utils/dom.js",
  "./src/utils/downloads.js",
  "./src/utils/formatters.js",
  "./src/utils/html.js",
  "./src/utils/ids.js",
  "./src/views/bikes/bikes-view.js",
  "./src/views/history/history-confirmation-dialog.js",
  "./src/views/history/history-filters.js",
  "./src/views/history/history-row.js",
  "./src/views/history/history-view.js",
  "./src/views/history/measurement-detail-dialog.js",
  "./src/views/history/measurement-edit-dialog.js",
  "./src/views/journal/journal-confirmation-dialog.js",
  "./src/views/journal/journal-filters.js",
  "./src/views/journal/journal-row.js",
  "./src/views/journal/journal-view.js",
  "./src/views/journal/ride-detail-dialog.js",
  "./src/views/journal/ride-entry-dialog.js",
  "./src/views/measurement/measurement-configuration.js",
  "./src/views/measurement/measurement-confirmation-dialogs.js",
  "./src/views/measurement/measurement-controller.js",
  "./src/views/measurement/measurement-controls.js",
  "./src/views/measurement/measurement-events.js",
  "./src/views/measurement/measurement-help-dialogs.js",
  "./src/views/measurement/measurement-render.js",
  "./src/views/measurement/measurement-result-card.js",
  "./src/views/measurement/measurement-save-bar.js",
  "./src/views/measurement/measurement-travel-dialog.js",
  "./src/views/measurement/measurement-view.js",
  "./src/views/more/data-management-view.js",
  "./src/views/more/guide-dialog.js",
  "./src/views/more/more-view.js",
  "./src/views/more/privacy-dialog.js",
  "./src/views/more/pwa-install-view.js",
  "./src/views/more/settings-dialog.js"
];

const APP_SHELL_URL = new URL("./index.html", self.registration.scope).href;
const PRECACHE_ABSOLUTE_URLS = new Set(
  PRECACHE_URLS.map(path => new URL(path, self.registration.scope).href)
);

function isApplicationCache(name) {
  return name.startsWith(CACHE_PREFIX) || name.startsWith(LEGACY_CACHE_PREFIX);
}

async function fetchAndCache(cache, url) {
  const request = new Request(url, { cache: "reload", credentials: "same-origin" });
  const response = await fetch(request);
  if (!response.ok) throw new Error(`Nie udało się zapisać zasobu offline: ${url}`);
  await cache.put(url, response.clone());
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const existingCacheNames = await caches.keys();
    const migratesLegacyWorker = existingCacheNames.some(name => name.startsWith(LEGACY_CACHE_PREFIX));
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      PRECACHE_URLS.map(path => fetchAndCache(cache, new URL(path, self.registration.scope).href))
    );
    if (migratesLegacyWorker) await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => isApplicationCache(name) && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: "PWA_ACTIVATED", version: APP_VERSION }));
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage?.({ type: "PWA_VERSION", version: APP_VERSION });
  }
});

async function appShellResponse() {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(APP_SHELL_URL);
  if (cached) return cached;
  return fetch(APP_SHELL_URL);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request.url);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request.url, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request.url, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request.url);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(appShellResponse());
    return;
  }

  if (PRECACHE_ABSOLUTE_URLS.has(url.href)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
