import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addBike, gotoApp, navigateTo } from "./helpers.js";

const routes = [
  ["Pomiar", "measurement"],
  ["Historia", "history"],
  ["Dziennik", "journal"],
  ["Więcej", "more"]
];

async function expectNoSeriousA11yViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const violations = results.violations.filter(violation => ["serious", "critical"].includes(violation.impact));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test("każda główna trasa przechodzi automatyczny audyt WCAG", async ({ page }) => {
  await gotoApp(page);
  for (const [tabLabel, route] of routes) {
    await navigateTo(page, tabLabel);
    await expect(page).toHaveURL(new RegExp(`#/${route}$`));
    await expectNoSeriousA11yViolations(page);
  }
});

test("formularze profilu i ustawień mają dostępne nazwy i nie zgłaszają krytycznych naruszeń", async ({ page }) => {
  await gotoApp(page);
  await navigateTo(page, "Więcej");

  await page.locator('[data-action="add-bike"]').first().click();
  await expect(page.locator("dialog.bike-form-dialog")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
  await page.locator('dialog.bike-form-dialog [data-action="close-bike-form"]').first().click();

  await page.locator('[data-action="open-settings"]').click();
  await expect(page.getByRole("dialog", { name: "Ustawienia" })).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("układ nie powoduje poziomego przewijania na telefonie ani komputerze", async ({ page, isMobile }) => {
  await gotoApp(page);
  if (!isMobile) await addBike(page, { name: "Bardzo długa nazwa profilu roweru używana do sprawdzenia zawijania tekstu" });

  for (const [tabLabel] of routes) {
    await navigateTo(page, tabLabel);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("fokus klawiatury jest widoczny i nawigacja działa bez myszy", async ({ page }) => {
  await gotoApp(page);
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const outlineStyle = await focused.evaluate(element => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe("none");

  await page.getByRole("button", { name: "Historia", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/history$/);
});
