import { test, expect } from "@playwright/test";
import { addBike, gotoApp, navigateTo } from "./helpers.js";

async function waitForOfflineReadiness(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 5000);
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }
    return {
      scope: registration.scope,
      controlled: Boolean(navigator.serviceWorker.controller),
      caches: await caches.keys()
    };
  });
}

test("manifest, worker i app shell są dostępne w scope aplikacji", async ({ page }) => {
  await gotoApp(page);
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("./#/measurement");

  const state = await waitForOfflineReadiness(page);
  expect(state.scope).toBe("http://127.0.0.1:4173/");
  expect(state.controlled).toBeTruthy();
  expect(state.caches.some(name => name.startsWith("sag-setup-logbook-app-v9"))).toBeTruthy();

  const cacheAudit = await page.evaluate(async () => {
    const names = await caches.keys();
    const appCacheName = names.find(name => name.startsWith("sag-setup-logbook-app-v9"));
    const cache = await caches.open(appCacheName);
    const required = [
      "/index.html",
      "/src/app/main.js",
      "/src/styles/index.css",
      "/src/views/measurement/measurement-view.js",
      "/src/views/history/history-view.js",
      "/src/views/journal/journal-view.js",
      "/src/views/more/more-view.js"
    ];
    const matches = await Promise.all(required.map(path => cache.match(new URL(path, location.origin).href)));
    return matches.map(Boolean);
  });
  expect(cacheAudit).toEqual([true, true, true, true, true, true, true]);
});

test("zapisane dane i wszystkie trasy działają po przeładowaniu bez sieci", async ({ page, context }) => {
  await gotoApp(page);
  await addBike(page, { name: "Rower offline" });
  await waitForOfflineReadiness(page);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator(".pwa-banner--offline")).toBeVisible();

    await navigateTo(page, "Więcej");
    await expect(page.getByRole("heading", { name: "Rower offline" })).toBeVisible();
    await navigateTo(page, "Historia");
    await expect(page.getByRole("heading", { name: "Brak zapisanych pomiarów" })).toBeVisible();
    await navigateTo(page, "Dziennik");
    await expect(page.getByText("Brak wpisów w Dzienniku", { exact: true })).toBeVisible();
    await navigateTo(page, "Pomiar");
    await expect(page.locator('[data-field="bike"]')).toContainText("Rower offline");
  } finally {
    await context.setOffline(false);
  }
});

test("aplikacja nie wysyła danych ani żądań do zewnętrznych domen", async ({ page }) => {
  const externalRequests = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4173") externalRequests.push(request.url());
  });
  await gotoApp(page);
  await navigateTo(page, "Więcej");
  await navigateTo(page, "Historia");
  await navigateTo(page, "Dziennik");
  expect(externalRequests).toEqual([]);
});
