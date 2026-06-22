import test from "node:test";
import assert from "node:assert/strict";
import { createSagMeasurement, SAG_INTERPRETATION } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { calculateSag, SAG_INPUT_FIELD } from "../../src/services/sag-calculator.js";
import {
  MeasurementFormValidationError,
  measurementToFormValues,
  validateMeasurementForm
} from "../../src/services/measurement-form.js";

function originalMeasurement() {
  const values = { suspensionTravel: 160, measuredCompression: 40, targetSag: 25 };
  return createSagMeasurement({
    id: "measurement-1",
    date: "2026-06-20T10:30:00.000Z",
    bikeID: "bike-1",
    bikeNameSnapshot: "Trek — Slash 8",
    suspensionType: SUSPENSION_TYPE.FORK,
    pressure: 80,
    values,
    result: calculateSag(values)
  });
}

test("wartości pomiaru są przygotowywane do polskiego formularza", () => {
  const values = measurementToFormValues(originalMeasurement());
  assert.deepEqual(values, {
    suspensionType: "fork",
    suspensionTravel: "160",
    measuredCompression: "40",
    pressure: "80",
    targetSag: "25"
  });
});

test("edycja zachowuje identyfikator, datę i snapshot roweru", () => {
  const original = originalMeasurement();
  const updated = validateMeasurementForm({
    suspensionType: "shock",
    suspensionTravel: "65",
    measuredCompression: "19,5",
    pressure: "182,5",
    targetSag: "30"
  }, original);

  assert.equal(updated.id, original.id);
  assert.equal(updated.date, original.date);
  assert.equal(updated.bikeID, original.bikeID);
  assert.equal(updated.bikeNameSnapshot, original.bikeNameSnapshot);
  assert.equal(updated.suspensionType, "shock");
  assert.equal(updated.measuredCompression, 19.5);
  assert.equal(updated.pressure, 182.5);
});

test("edycja ponownie przelicza wszystkie wyniki", () => {
  const updated = validateMeasurementForm({
    suspensionType: "fork",
    suspensionTravel: "160",
    measuredCompression: "32",
    pressure: "",
    targetSag: "25"
  }, originalMeasurement());

  assert.equal(updated.currentSag, 20);
  assert.equal(updated.targetCompression, 40);
  assert.equal(updated.differencePercentagePoints, -5);
  assert.equal(updated.differenceMillimeters, -8);
  assert.equal(updated.interpretation, SAG_INTERPRETATION.TOO_LOW);
  assert.equal(updated.pressure, null);
});

test("formularz akceptuje przecinek i kropkę", () => {
  const updated = validateMeasurementForm({
    suspensionType: "shock",
    suspensionTravel: "55.5",
    measuredCompression: "16,5",
    pressure: "175,5",
    targetSag: "30"
  }, originalMeasurement());
  assert.equal(updated.suspensionTravel, 55.5);
  assert.equal(updated.measuredCompression, 16.5);
  assert.equal(updated.pressure, 175.5);
});

test("formularz zwraca błędy wszystkich niepoprawnych pól", () => {
  assert.throws(
    () => validateMeasurementForm({
      suspensionType: "fork",
      suspensionTravel: "0",
      measuredCompression: "tekst",
      pressure: "-2",
      targetSag: "100"
    }, originalMeasurement()),
    error => {
      assert.ok(error instanceof MeasurementFormValidationError);
      assert.ok(error.errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL]);
      assert.ok(error.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION]);
      assert.ok(error.errors[SAG_INPUT_FIELD.PRESSURE]);
      assert.ok(error.errors[SAG_INPUT_FIELD.TARGET_SAG]);
      assert.equal(error.firstField, SAG_INPUT_FIELD.SUSPENSION_TRAVEL);
      return true;
    }
  );
});

test("ugięcie większe niż skok jest odrzucane", () => {
  assert.throws(
    () => validateMeasurementForm({
      suspensionType: "shock",
      suspensionTravel: "55",
      measuredCompression: "60",
      pressure: "",
      targetSag: "30"
    }, originalMeasurement()),
    error => error instanceof MeasurementFormValidationError
      && Boolean(error.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION])
  );
});

test("nieznany typ zawieszenia jest odrzucany", () => {
  assert.throws(
    () => validateMeasurementForm({
      suspensionType: "unknown",
      suspensionTravel: "55",
      measuredCompression: "15",
      pressure: "",
      targetSag: "30"
    }, originalMeasurement()),
    /Nieznany typ zawieszenia/
  );
});
