import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import {
  BikeProfileValidationError,
  bikeProfileToFormValues,
  validateBikeProfileForm
} from "../../src/services/bike-profile-form.js";

test("formularz wymaga nazwy profilu", () => {
  assert.throws(
    () => validateBikeProfileForm({ name: "   " }),
    error => error instanceof BikeProfileValidationError && error.field === "name"
  );
});

test("formularz przyjmuje puste opcjonalne ustawienia", () => {
  const bike = validateBikeProfileForm({ name: "  Enduro  ", model: "  Trek Slash  " });
  assert.equal(bike.name, "Enduro");
  assert.equal(bike.model, "Trek Slash");
  assert.equal(bike.forkTravel, null);
  assert.equal(bike.shockPressure, null);
});

test("formularz przyjmuje przecinki w polskich liczbach", () => {
  const bike = validateBikeProfileForm({
    name: "Trail",
    forkTravel: "150,5",
    forkTargetSag: "22,5",
    forkPressure: "81,5",
    shockTravel: "55,0",
    shockTargetSag: "30",
    shockPressure: "180"
  });
  assert.equal(bike.forkTravel, 150.5);
  assert.equal(bike.forkTargetSag, 22.5);
  assert.equal(bike.shockTravel, 55);
  assert.equal(bike.shockPressure, 180);
});

test("formularz odrzuca zero, wartości ujemne i SAG równy 100", () => {
  assert.throws(
    () => validateBikeProfileForm({ name: "Rower", forkTravel: "0" }),
    error => error.field === "forkTravel"
  );
  assert.throws(
    () => validateBikeProfileForm({ name: "Rower", shockPressure: "-1" }),
    error => error.field === "shockPressure"
  );
  assert.throws(
    () => validateBikeProfileForm({ name: "Rower", forkTargetSag: "100" }),
    error => error.field === "forkTargetSag"
  );
});

test("edycja zachowuje identyfikator i datę utworzenia", () => {
  const existing = createBikeProfile({
    id: "bike-1",
    name: "Stara nazwa",
    createdAt: "2026-01-02T03:04:05.000Z"
  });
  const updated = validateBikeProfileForm({ name: "Nowa nazwa", forkTravel: "160" }, existing);
  assert.equal(updated.id, "bike-1");
  assert.equal(updated.createdAt, "2026-01-02T03:04:05.000Z");
  assert.equal(updated.name, "Nowa nazwa");
});

test("model można zamienić na wartości pól edycyjnych", () => {
  const values = bikeProfileToFormValues(createBikeProfile({
    name: "Enduro",
    model: "X",
    forkTravel: 160.5,
    shockTargetSag: 30
  }));
  assert.equal(values.name, "Enduro");
  assert.equal(values.forkTravel, "160,5");
  assert.equal(values.shockTargetSag, "30");
  assert.equal(values.forkPressure, "");
});
