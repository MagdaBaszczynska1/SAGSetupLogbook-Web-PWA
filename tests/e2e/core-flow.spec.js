import { test, expect } from "@playwright/test";
import {
  addBike,
  addRideFromSavedMeasurement,
  collectRuntimeErrors,
  createForkMeasurement,
  gotoApp,
  navigateTo
} from "./helpers.js";

test("główna ścieżka użytkownika zapisuje dane i zachowuje je po przeładowaniu", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await gotoApp(page);
  await addBike(page);
  await createForkMeasurement(page);
  const ride = await addRideFromSavedMeasurement(page);

  await navigateTo(page, "Historia");
  await expect(page.getByRole("heading", { name: "Pomiary", exact: true })).toBeVisible();
  await expect(page.locator('[data-region="history-list"]')).toContainText("Widelec");
  await expect(page.locator('[data-region="history-list"]')).toContainText("25");

  await page.reload();
  await expect(page.locator("#main-content")).toBeVisible();
  await navigateTo(page, "Dziennik");
  await expect(page.getByRole("heading", { name: ride.routeName })).toBeVisible();
  await expect(page.locator('[data-region="journal-list"]')).toContainText("Rower testowy");

  await navigateTo(page, "Więcej");
  await expect(page.getByRole("heading", { name: "Rower testowy" })).toBeVisible();
  await expect(page.locator('[data-count="bikes"]')).toHaveText("1");
  await expect(page.locator('[data-count="measurements"]')).toHaveText("1");
  await expect(page.locator('[data-count="rides"]')).toHaveText("1");
  expect(runtimeErrors).toEqual([]);
});

test("edycja i usuwanie wpisu Dziennika nie usuwa źródłowego pomiaru", async ({ page }) => {
  await gotoApp(page);
  await addBike(page, { name: "Rower dziennika" });
  await createForkMeasurement(page, { bikeName: "Rower dziennika" });
  await addRideFromSavedMeasurement(page, { routeName: "Kamienisty zjazd", notes: "Pierwsza notatka" });

  await page.locator('[data-action="show-ride-entry"]').click();
  const detail = page.locator("dialog.ride-detail-dialog");
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: "Edytuj", exact: true }).click();

  const editor = page.locator("dialog.ride-entry-dialog");
  await expect(editor).toBeVisible();
  await editor.locator('[data-field="notes"]').fill("Notatka po edycji");
  await editor.getByRole("button", { name: "Zapisz wpis", exact: true }).click();
  await expect(editor).not.toBeVisible();

  await page.locator('[data-action="show-ride-entry"]').click();
  await expect(detail).toContainText("Notatka po edycji");
  await detail.locator('[data-action="delete-from-ride-detail"]').click();
  const confirmation = page.getByRole("dialog", { name: "Usunąć ten wpis?" });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Usuń wpis" }).click();
  await expect(page.getByText("Brak wpisów w Dzienniku", { exact: true })).toBeVisible();

  await navigateTo(page, "Historia");
  await expect(page.locator('[data-region="history-list"]')).toContainText("Widelec");
});
