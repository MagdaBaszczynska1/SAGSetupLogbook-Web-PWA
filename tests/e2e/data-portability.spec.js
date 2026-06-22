import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { addBike, gotoApp, navigateTo } from "./helpers.js";

async function downloadText(download) {
  const path = await download.path();
  expect(path).toBeTruthy();
  return readFile(path, "utf8");
}

test("eksport JSON tworzy pełną kopię, którą można bezpiecznie ponownie zaimportować", async ({ page }) => {
  await gotoApp(page);
  await addBike(page, { name: "Rower przed importem", model: "Model A" });

  const exportDownloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export-json"]').click();
  const exportedText = await downloadText(await exportDownloadPromise);
  const backup = JSON.parse(exportedText);
  expect(backup.format).toBe("sag-setup-logbook-backup");
  expect(backup.schemaVersion).toBe(1);
  expect(backup.data.bikes).toHaveLength(1);
  expect(backup.data.bikes[0].name).toBe("Rower przed importem");

  backup.data.bikes[0].name = "Rower po imporcie";
  await page.locator('[data-field="import-file"]').setInputFiles({
    name: "poprawna-kopia.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup))
  });

  const confirmation = page.getByRole("dialog", { name: "Potwierdź import" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText("1 profili");

  const rescueDownloadPromise = page.waitForEvent("download");
  await confirmation.getByRole("button", { name: "Utwórz kopię i importuj" }).click();
  const rescueText = await downloadText(await rescueDownloadPromise);
  expect(JSON.parse(rescueText).data.bikes[0].name).toBe("Rower przed importem");

  await expect(confirmation).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Rower po imporcie" })).toBeVisible();
  await expect(page.locator('[data-region="data-operation-status"]')).toContainText("Import zakończony");
});

test("raport CSV jest pobierany jako UTF-8 i zawiera dane profilu", async ({ page }) => {
  await gotoApp(page);
  await addBike(page, { name: "Rower CSV", model: "Ścieżkowy" });

  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export-csv"]').click();
  const text = await downloadText(await downloadPromise);
  expect(text.charCodeAt(0)).toBe(0xFEFF);
  expect(text).toContain('"recordType"');
  expect(text).toContain('"bike"');
  expect(text).toContain('"Rower CSV"');
  expect(text).toContain('"Ścieżkowy"');
});

test("uszkodzony plik importu nie zmienia istniejących danych", async ({ page }) => {
  await gotoApp(page);
  await addBike(page, { name: "Profil bezpieczny" });
  await navigateTo(page, "Więcej");

  await page.locator('[data-field="import-file"]').setInputFiles({
    name: "uszkodzona-kopia.json",
    mimeType: "application/json",
    buffer: Buffer.from("{to nie jest json")
  });

  await expect(page.locator('[data-region="data-operation-status"]')).toContainText("Nie można zaimportować pliku");
  await expect(page.getByRole("heading", { name: "Profil bezpieczny" })).toBeVisible();
  await expect(page.locator('[data-count="bikes"]')).toHaveText("1");
});
