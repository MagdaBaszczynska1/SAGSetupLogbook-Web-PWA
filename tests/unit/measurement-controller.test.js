import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { CALCULATOR_SAVE_STATE, TARGET_SAG_PRESET } from "../../src/services/sag-calculator.js";
import { createMeasurementController } from "../../src/views/measurement/measurement-controller.js";

function fixture() {
  const bikes = [createBikeProfile({
    id: "bike-1",
    name: "Trek",
    model: "Slash 8",
    forkTravel: 160,
    shockTravel: 65,
    forkTargetSag: 25,
    shockTargetSag: 30,
    forkPressure: 80,
    shockPressure: 180
  })];
  const saved = [];
  const store = {
    add(measurement) {
      saved.push(measurement);
      return true;
    },
    get errorMessage() { return null; }
  };
  return { controller: createMeasurementController({ bikes, measurementStore: store }), saved };
}

test("początkowo wynik jest ukryty i zapis niedostępny", () => {
  const { controller } = fixture();
  const state = controller.getSnapshot();
  assert.equal(state.liveCalculation.result, null);
  assert.equal(state.saveButtonState, CALCULATOR_SAVE_STATE.UNAVAILABLE);
  assert.equal(state.isAtDefaultState, true);
});

test("wybór profilu wczytuje ustawienia widelca", () => {
  const { controller } = fixture();
  controller.setSelectedBikeID("bike-1");
  const state = controller.getSnapshot();
  assert.equal(state.suspensionTravel, 160);
  assert.equal(state.targetSag, 25);
  assert.equal(state.pressure, 80);
  assert.equal(state.travelComesFromProfile, true);
  assert.equal(state.hasSetMeasuredCompression, false);
});

test("przełączenie na damper wczytuje osobne ustawienia i zeruje ugięcie", () => {
  const { controller } = fixture();
  controller.setSelectedBikeID("bike-1");
  controller.setMeasuredCompression(40);
  controller.setSuspensionType(SUSPENSION_TYPE.SHOCK);
  const state = controller.getSnapshot();
  assert.equal(state.suspensionTravel, 65);
  assert.equal(state.targetSag, 30);
  assert.equal(state.pressure, 180);
  assert.equal(state.measuredCompression, 0);
  assert.equal(state.hasSetMeasuredCompression, false);
});

test("suwak i przyciski ugięcia natychmiast aktualizują wynik", () => {
  const { controller } = fixture();
  controller.setMeasuredCompression(40);
  let state = controller.getSnapshot();
  assert.equal(state.liveCalculation.result.currentSag, 25);
  assert.equal(state.saveButtonState, CALCULATOR_SAVE_STATE.READY);

  controller.adjustMeasuredCompression(1);
  state = controller.getSnapshot();
  assert.equal(state.measuredCompression, 41);
  assert.equal(state.liveCalculation.result.currentSag, 25.625);

  controller.adjustMeasuredCompression(-1);
  assert.equal(controller.getSnapshot().measuredCompression, 40);
});

test("ręczna zmiana skoku ogranicza zbyt duże ugięcie", () => {
  const { controller } = fixture();
  controller.setMeasuredCompression(100);
  controller.setManualTravel(80);
  const state = controller.getSnapshot();
  assert.equal(state.suspensionTravel, 80);
  assert.equal(state.measuredCompression, 80);
  assert.equal(state.travelComesFromProfile, false);
});

test("presety i własny cel SAG zachowują stan interfejsu", () => {
  const { controller } = fixture();
  controller.selectTargetPreset(TARGET_SAG_PRESET.THIRTY);
  assert.equal(controller.getSnapshot().targetSag, 30);
  assert.equal(controller.getSnapshot().usesCustomTargetSag, false);

  controller.selectTargetPreset(TARGET_SAG_PRESET.CUSTOM);
  controller.setCustomTargetSag(27);
  const state = controller.getSnapshot();
  assert.equal(state.targetSag, 27);
  assert.equal(state.usesCustomTargetSag, true);
  assert.equal(state.targetPreset, TARGET_SAG_PRESET.CUSTOM);
});

test("opcjonalne ciśnienie można włączyć, zmienić i wyłączyć", () => {
  const { controller } = fixture();
  controller.setPressureEnabled(true);
  assert.equal(controller.getSnapshot().pressure, 80);
  controller.setPressure(85);
  assert.equal(controller.getSnapshot().pressure, 85);
  controller.setPressureEnabled(false);
  assert.equal(controller.getSnapshot().pressure, null);
});

test("zapis tworzy pomiar i blokuje ponowny identyczny zapis", async () => {
  const { controller, saved } = fixture();
  controller.setSelectedBikeID("bike-1");
  controller.setMeasuredCompression(40);

  const measurement = await controller.saveMeasurement();
  assert.ok(measurement);
  assert.equal(saved.length, 1);
  assert.equal(controller.getSnapshot().saveButtonState, CALCULATOR_SAVE_STATE.SAVED);
  assert.equal(measurement.bikeNameSnapshot, "Trek — Slash 8");

  const duplicate = await controller.saveMeasurement();
  assert.equal(duplicate, null);
  assert.equal(saved.length, 1);

  controller.adjustMeasuredCompression(1);
  assert.equal(controller.getSnapshot().saveButtonState, CALCULATOR_SAVE_STATE.READY);
  await controller.saveMeasurement();
  assert.equal(saved.length, 2);
});

test("próba zapisu bez ustawienia ugięcia pokazuje informację", async () => {
  const { controller, saved } = fixture();
  const result = await controller.saveMeasurement();
  assert.equal(result, null);
  assert.equal(saved.length, 0);
  assert.match(controller.getSnapshot().saveFeedback, /ustaw ugięcie/i);
});

test("reset przywraca pełny stan początkowy", () => {
  const { controller } = fixture();
  controller.setSelectedBikeID("bike-1");
  controller.setSuspensionType(SUSPENSION_TYPE.SHOCK);
  controller.setMeasuredCompression(20);
  controller.setAdditionalDataExpanded(true);
  controller.clearForm();
  const state = controller.getSnapshot();
  assert.equal(state.selectedBikeID, null);
  assert.equal(state.suspensionType, SUSPENSION_TYPE.FORK);
  assert.equal(state.suspensionTravel, 160);
  assert.equal(state.targetSag, 25);
  assert.equal(state.pressure, null);
  assert.equal(state.hasSetMeasuredCompression, false);
  assert.equal(state.isAtDefaultState, true);
});
