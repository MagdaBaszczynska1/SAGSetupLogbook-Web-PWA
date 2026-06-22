import { expect } from "@playwright/test";

export async function gotoApp(page, route = "measurement") {
  await page.goto(`/#/${route}`);
  await expect(page.locator("#main-content")).toBeVisible();
}

export async function navigateTo(page, tabLabel) {
  await page.getByRole("button", { name: tabLabel, exact: true }).click();
}

export async function addBike(page, {
  name = "Rower testowy",
  model = "Enduro 29",
  forkTravel = "160",
  forkTargetSag = "25",
  forkPressure = "80",
  shockTravel = "65",
  shockTargetSag = "30",
  shockPressure = "180"
} = {}) {
  await navigateTo(page, "Więcej");
  await page.locator('[data-action="add-bike"]').first().click();
  const dialog = page.locator("dialog.bike-form-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('[data-field="name"]').fill(name);
  await dialog.locator('[data-field="model"]').fill(model);
  await dialog.locator('[data-field="forkTravel"]').fill(forkTravel);
  await dialog.locator('[data-field="forkTargetSag"]').fill(forkTargetSag);
  await dialog.locator('[data-field="forkPressure"]').fill(forkPressure);
  await dialog.locator('[data-field="shockTravel"]').fill(shockTravel);
  await dialog.locator('[data-field="shockTargetSag"]').fill(shockTargetSag);
  await dialog.locator('[data-field="shockPressure"]').fill(shockPressure);
  await dialog.getByRole("button", { name: "Zapisz", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  return { name, model };
}

export async function setRangeValue(locator, value) {
  await locator.evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export async function selectBikeByName(page, bikeName) {
  const select = page.locator('[data-field="bike"]');
  const optionValue = await select.locator("option").evaluateAll((options, expectedName) => {
    const match = options.find(option => option.textContent?.includes(expectedName));
    return match?.value ?? null;
  }, bikeName);
  expect(optionValue, `Nie znaleziono profilu ${bikeName} w kalkulatorze`).toBeTruthy();
  await select.selectOption(optionValue);
}

export async function createForkMeasurement(page, { bikeName = "Rower testowy", compression = 40 } = {}) {
  await navigateTo(page, "Pomiar");
  await selectBikeByName(page, bikeName);
  await setRangeValue(page.locator('[data-field="compression"]'), compression);
  await expect(page.locator('[data-action="save"]')).toBeEnabled();
  await page.locator('[data-action="save"]').click();
  const savedDialog = page.locator('dialog[data-dialog="saved"]');
  await expect(savedDialog).toBeVisible();
  await expect(savedDialog).toContainText("Pomiar zapisano w Historii");
  return savedDialog;
}

export async function addRideFromSavedMeasurement(page, {
  routeName = "Leśna pętla",
  condition = "Sucho",
  rating = "4 z 5",
  notes = "Stabilne ustawienie"
} = {}) {
  const savedDialog = page.locator('dialog[data-dialog="saved"]');
  await savedDialog.getByRole("button", { name: "Dodaj wpis Dziennika" }).click();
  const rideDialog = page.locator("dialog.ride-entry-dialog");
  await expect(rideDialog).toBeVisible();
  await expect(page).toHaveURL(/#\/journal$/);
  await rideDialog.locator('[data-field="routeName"]').fill(routeName);
  await rideDialog.getByRole("button", { name: condition, exact: true }).click();
  await rideDialog.getByRole("button", { name: rating, exact: true }).click();
  await rideDialog.locator('[data-field="notes"]').fill(notes);
  await expect(rideDialog.locator('[data-ride-measurement-id][aria-pressed="true"]')).toHaveCount(1);
  await rideDialog.getByRole("button", { name: "Zapisz wpis", exact: true }).click();
  await expect(rideDialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: routeName })).toBeVisible();
  return { routeName, notes };
}

export function collectRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}
