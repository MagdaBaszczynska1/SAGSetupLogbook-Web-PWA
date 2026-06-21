import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import { SAG_INTERPRETATION } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { getCalculatorProfilePrefill } from "../../src/services/calculator-profile-prefill.js";
import {
  CALCULATOR_SAVE_STATE,
  SAG_INPUT_FIELD,
  TARGET_SAG_PRESET,
  TARGET_SAG_QUICK_CHOICES,
  calculateSag,
  evaluateLiveSag,
  getTargetSagPresetValue,
  isCalculatorSaveDisabled,
  resolveCalculatorSaveState,
  selectTargetSagPreset,
  validateOptionalPressure,
  validateSagNumbers,
  validateSagTexts
} from "../../src/services/sag-calculator.js";
import {
  createCompressionScale,
  getCompressionSliderConfiguration,
  getPressureSliderConfiguration,
  getTargetSagSliderConfiguration,
  getTravelSliderConfiguration
} from "../../src/services/sag-slider-configuration.js";

const closeTo = (actual, expected, tolerance = 0.0001) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);
};

test("walidacja tekstowa przyjmuje przecinek i kropkę", () => {
  const comma = validateSagTexts({
    suspensionTravelText: "160,5",
    measuredCompressionText: "32,1",
    targetSagText: "20,0",
    suspensionType: SUSPENSION_TYPE.FORK
  });
  const dot = validateSagTexts({
    suspensionTravelText: "160.5",
    measuredCompressionText: "32.1",
    targetSagText: "20.0",
    suspensionType: SUSPENSION_TYPE.FORK
  });

  assert.equal(comma.isValid, true);
  assert.equal(dot.isValid, true);
  closeTo(comma.values.suspensionTravel, 160.5);
  closeTo(comma.values.measuredCompression, 32.1);
  closeTo(comma.values.targetSag, 20);
  closeTo(comma.values.suspensionTravel, dot.values.suspensionTravel);
});

test("40 mm ugięcia przy 160 mm skoku daje 25% SAG", () => {
  const result = calculateSag({ suspensionTravel: 160, measuredCompression: 40, targetSag: 25 });
  closeTo(result.currentSag, 25);
  closeTo(result.targetCompression, 40);
  closeTo(result.differencePercentagePoints, 0);
  closeTo(result.differenceMillimeters, 0);
  assert.equal(result.interpretation, SAG_INTERPRETATION.CLOSE_TO_TARGET);
});

test("obliczenie zwraca wynik, różnice i interpretację", () => {
  const result = calculateSag({ suspensionTravel: 150, measuredCompression: 30, targetSag: 25 });
  closeTo(result.currentSag, 20);
  closeTo(result.targetCompression, 37.5);
  closeTo(result.differencePercentagePoints, -5);
  closeTo(result.differenceMillimeters, -7.5);
  assert.equal(result.interpretation, SAG_INTERPRETATION.TOO_LOW);
});

test("granica tolerancji jednego punktu jest blisko celu", () => {
  const result = calculateSag({ suspensionTravel: 100, measuredCompression: 21, targetSag: 20 });
  closeTo(result.differencePercentagePoints, 1);
  assert.equal(result.interpretation, SAG_INTERPRETATION.CLOSE_TO_TARGET);
});

test("wynik poza dodatnią granicą tolerancji jest za wysoki", () => {
  const result = calculateSag({ suspensionTravel: 100, measuredCompression: 21.01, targetSag: 20 });
  assert.equal(result.interpretation, SAG_INTERPRETATION.TOO_HIGH);
});

test("walidacja odrzuca zerowy skok, ujemne ugięcie i ugięcie powyżej skoku", () => {
  const zeroTravel = validateSagTexts({ suspensionTravelText: "0", measuredCompressionText: "20", targetSagText: "20", suspensionType: SUSPENSION_TYPE.FORK });
  const negativeCompression = validateSagTexts({ suspensionTravelText: "160", measuredCompressionText: "-1", targetSagText: "20", suspensionType: SUSPENSION_TYPE.FORK });
  const aboveTravel = validateSagTexts({ suspensionTravelText: "65", measuredCompressionText: "66", targetSagText: "28", suspensionType: SUSPENSION_TYPE.SHOCK });

  assert.equal(zeroTravel.isValid, false);
  assert.ok(zeroTravel.errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL]);
  assert.ok(negativeCompression.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION]);
  assert.equal(aboveTravel.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION], "Ugięcie tłoczyska dampera nie może być większe niż skok dampera.");
});

test("walidacja zwraca błędy wymaganych i niepoprawnych danych", () => {
  const missing = validateSagTexts({ suspensionTravelText: "", measuredCompressionText: " ", targetSagText: "", suspensionType: SUSPENSION_TYPE.FORK });
  assert.equal(missing.isValid, false);
  assert.deepEqual(Object.keys(missing.errors).sort(), [
    SAG_INPUT_FIELD.MEASURED_COMPRESSION,
    SAG_INPUT_FIELD.SUSPENSION_TRAVEL,
    SAG_INPUT_FIELD.TARGET_SAG
  ].sort());

  const invalid = validateSagTexts({ suspensionTravelText: "abc", measuredCompressionText: "1e3", targetSagText: "100", suspensionType: SUSPENSION_TYPE.FORK });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL]);
  assert.ok(invalid.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION]);
  assert.ok(invalid.errors[SAG_INPUT_FIELD.TARGET_SAG]);
});

test("bezpośrednia walidacja suwaków jest zgodna z regułami kalkulatora", () => {
  const valid = validateSagNumbers({ suspensionTravel: 160, measuredCompression: 32, targetSag: 20, suspensionType: SUSPENSION_TYPE.FORK });
  const invalid = validateSagNumbers({ suspensionTravel: 55, measuredCompression: 60, targetSag: 30, suspensionType: SUSPENSION_TYPE.SHOCK });
  const nonFinite = validateSagNumbers({ suspensionTravel: Number.POSITIVE_INFINITY, measuredCompression: 10, targetSag: 20, suspensionType: SUSPENSION_TYPE.FORK });
  assert.equal(valid.isValid, true);
  assert.equal(valid.values.measuredCompression, 32);
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION]);
  assert.equal(nonFinite.isValid, false);
});

test("opcjonalne ciśnienie przyjmuje pustą, liczbę i przecinek", () => {
  assert.deepEqual(validateOptionalPressure("  "), { value: null, error: null });
  assert.deepEqual(validateOptionalPressure(null), { value: null, error: null });
  assert.deepEqual(validateOptionalPressure("175,5"), { value: 175.5, error: null });
  assert.deepEqual(validateOptionalPressure(175), { value: 175, error: null });
  assert.match(validateOptionalPressure("osiemdziesiąt").error, /liczbą/);
  assert.match(validateOptionalPressure("0").error, /większe od 0/);
});

test("konfiguracje suwaków zachowują zakresy i kroki aplikacji natywnej", () => {
  const forkTravel = getTravelSliderConfiguration(SUSPENSION_TYPE.FORK);
  const shockTravel = getTravelSliderConfiguration(SUSPENSION_TYPE.SHOCK);
  const forkPressure = getPressureSliderConfiguration(SUSPENSION_TYPE.FORK);
  const shockPressure = getPressureSliderConfiguration(SUSPENSION_TYPE.SHOCK);

  assert.deepEqual({ min: forkTravel.minimum, max: forkTravel.maximum, step: forkTravel.step, value: forkTravel.defaultValue }, { min: 80, max: 220, step: 1, value: 160 });
  assert.deepEqual({ min: shockTravel.minimum, max: shockTravel.maximum, step: shockTravel.step, value: shockTravel.defaultValue }, { min: 20, max: 100, step: 0.5, value: 55 });
  assert.equal(forkPressure.defaultValue, 80);
  assert.equal(shockPressure.defaultValue, 180);
  assert.equal(forkTravel.rangeIncluding(250).maximum, 250);
  assert.equal(shockTravel.rangeIncluding(17.5).minimum, 17.5);
});

test("suwak ugięcia nigdy nie przekracza wybranego skoku", () => {
  const fork = getCompressionSliderConfiguration(SUSPENSION_TYPE.FORK, 160);
  const shock = getCompressionSliderConfiguration(SUSPENSION_TYPE.SHOCK, 55);
  assert.deepEqual({ min: fork.minimum, max: fork.maximum, step: fork.step }, { min: 0, max: 160, step: 1 });
  assert.deepEqual({ min: shock.minimum, max: shock.maximum, step: shock.step }, { min: 0, max: 55, step: 0.5 });
  assert.equal(fork.clamp(200), 160);
  assert.equal(shock.snap(27.3), 27.5);
});

test("skala ugięcia używa skoku, kroku i równych znaczników", () => {
  const fork = createCompressionScale(SUSPENSION_TYPE.FORK, 165);
  const shock = createCompressionScale(SUSPENSION_TYPE.SHOCK, 55);
  assert.equal(fork.minimum, 0);
  assert.equal(fork.maximum, 165);
  assert.equal(fork.midpoint, 83);
  assert.equal(shock.midpoint, 27.5);
  assert.equal(fork.tickFractions.length, 21);
  assert.equal(fork.tickFractions[0], 0);
  assert.equal(fork.tickFractions[10], 0.5);
  assert.equal(fork.tickFractions.at(-1), 1);
});

test("profil uzupełnia osobne wartości widelca i dampera", () => {
  const bike = createBikeProfile({
    name: "Enduro", model: "Test", forkTravel: 170, shockTravel: 65,
    forkTargetSag: 22, shockTargetSag: 30, forkPressure: 82, shockPressure: 190
  });
  assert.deepEqual(getCalculatorProfilePrefill(bike, SUSPENSION_TYPE.FORK), {
    suspensionTravel: 170, targetSag: 22, pressure: 82, travelComesFromProfile: true
  });
  assert.deepEqual(getCalculatorProfilePrefill(bike, SUSPENSION_TYPE.SHOCK), {
    suspensionTravel: 65, targetSag: 30, pressure: 190, travelComesFromProfile: true
  });
});

test("brak danych profilu przywraca wartości domyślne nowego kontekstu", () => {
  const hardtail = createBikeProfile({
    name: "Hardtail", model: "Test", forkTravel: 140, forkTargetSag: 25, forkPressure: 75
  });
  assert.deepEqual(getCalculatorProfilePrefill(hardtail, SUSPENSION_TYPE.SHOCK), {
    suspensionTravel: 55, targetSag: 30, pressure: null, travelComesFromProfile: false
  });
  assert.deepEqual(getCalculatorProfilePrefill(null, SUSPENSION_TYPE.FORK), {
    suspensionTravel: 160, targetSag: 25, pressure: null, travelComesFromProfile: false
  });
});

test("obliczenie na żywo jest ukryte do świadomego ustawienia ugięcia", () => {
  const live = evaluateLiveSag({ suspensionTravel: 160, measuredCompression: 0, targetSag: 25, pressure: null, suspensionType: SUSPENSION_TYPE.FORK, hasSetMeasuredCompression: false });
  assert.equal(live.values, null);
  assert.equal(live.result, null);
  assert.equal(live.isReady, false);
  assert.deepEqual(live.errors, {});
});

test("obliczenie na żywo reaguje na zmianę ugięcia, skoku i celu", () => {
  const first = evaluateLiveSag({ suspensionTravel: 160, measuredCompression: 32, targetSag: 25, pressure: 80, suspensionType: SUSPENSION_TYPE.FORK, hasSetMeasuredCompression: true });
  const second = evaluateLiveSag({ suspensionTravel: 160, measuredCompression: 48, targetSag: 25, pressure: 80, suspensionType: SUSPENSION_TYPE.FORK, hasSetMeasuredCompression: true });
  const changedTravel = evaluateLiveSag({ suspensionTravel: 200, measuredCompression: 32, targetSag: 20, pressure: null, suspensionType: SUSPENSION_TYPE.FORK, hasSetMeasuredCompression: true });
  closeTo(first.result.currentSag, 20);
  closeTo(second.result.currentSag, 30);
  closeTo(changedTravel.result.currentSag, 16);
  assert.equal(first.isReady, true);
  assert.equal(second.isReady, true);
});

test("szybkie wartości celu rozpoznają 20, 25, 30 i wartość własną", () => {
  assert.deepEqual(TARGET_SAG_QUICK_CHOICES, [TARGET_SAG_PRESET.TWENTY, TARGET_SAG_PRESET.TWENTY_FIVE, TARGET_SAG_PRESET.THIRTY, TARGET_SAG_PRESET.CUSTOM]);
  assert.equal(selectTargetSagPreset(20), TARGET_SAG_PRESET.TWENTY);
  assert.equal(selectTargetSagPreset(25), TARGET_SAG_PRESET.TWENTY_FIVE);
  assert.equal(selectTargetSagPreset(30), TARGET_SAG_PRESET.THIRTY);
  assert.equal(selectTargetSagPreset(22), TARGET_SAG_PRESET.CUSTOM);
  assert.equal(getTargetSagPresetValue(TARGET_SAG_PRESET.CUSTOM), null);
  assert.deepEqual(
    { minimum: getTargetSagSliderConfiguration(SUSPENSION_TYPE.FORK).minimum, maximum: getTargetSagSliderConfiguration(SUSPENSION_TYPE.FORK).maximum, step: getTargetSagSliderConfiguration(SUSPENSION_TYPE.FORK).step },
    { minimum: 10, maximum: 40, step: 1 }
  );
  assert.equal(getTargetSagSliderConfiguration(SUSPENSION_TYPE.FORK).defaultValue, 25);
  assert.equal(getTargetSagSliderConfiguration(SUSPENSION_TYPE.SHOCK).defaultValue, 30);
});

test("stan przycisku zapisu odtwarza pełny przepływ", () => {
  assert.equal(resolveCalculatorSaveState({ hasValidResult: false, isSaving: false, isSaved: false }), CALCULATOR_SAVE_STATE.UNAVAILABLE);
  assert.equal(resolveCalculatorSaveState({ hasValidResult: true, isSaving: false, isSaved: false }), CALCULATOR_SAVE_STATE.READY);
  assert.equal(resolveCalculatorSaveState({ hasValidResult: true, isSaving: true, isSaved: false }), CALCULATOR_SAVE_STATE.SAVING);
  assert.equal(resolveCalculatorSaveState({ hasValidResult: true, isSaving: false, isSaved: true }), CALCULATOR_SAVE_STATE.SAVED);
  assert.equal(isCalculatorSaveDisabled(CALCULATOR_SAVE_STATE.READY), false);
  assert.equal(isCalculatorSaveDisabled(CALCULATOR_SAVE_STATE.SAVED), true);
});
