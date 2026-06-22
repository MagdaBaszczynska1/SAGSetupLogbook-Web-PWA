import { getSuspensionDefinition } from "../models/suspension-type.js";
import { SAG_INTERPRETATION } from "../models/sag-measurement.js";
import { NUMBER_PARSE_STATUS, parseLocalizedNumber } from "./localized-number-parser.js";

export const SAG_INPUT_FIELD = Object.freeze({
  SUSPENSION_TRAVEL: "suspensionTravel",
  MEASURED_COMPRESSION: "measuredCompression",
  PRESSURE: "pressure",
  TARGET_SAG: "targetSag"
});

export const CALCULATOR_SAVE_STATE = Object.freeze({
  UNAVAILABLE: "unavailable",
  READY: "ready",
  SAVING: "saving",
  SAVED: "saved"
});

export const TARGET_SAG_PRESET = Object.freeze({
  TWENTY: "twenty",
  TWENTY_FIVE: "twentyFive",
  THIRTY: "thirty",
  CUSTOM: "custom"
});

export const TARGET_SAG_QUICK_CHOICES = Object.freeze([
  TARGET_SAG_PRESET.TWENTY,
  TARGET_SAG_PRESET.TWENTY_FIVE,
  TARGET_SAG_PRESET.THIRTY,
  TARGET_SAG_PRESET.CUSTOM
]);

export const SAG_TOLERANCE_PERCENTAGE_POINTS = 1;

const PRESET_VALUES = Object.freeze({
  [TARGET_SAG_PRESET.TWENTY]: 20,
  [TARGET_SAG_PRESET.TWENTY_FIVE]: 25,
  [TARGET_SAG_PRESET.THIRTY]: 30,
  [TARGET_SAG_PRESET.CUSTOM]: null
});

export function getTargetSagPresetValue(preset) {
  if (!(preset in PRESET_VALUES)) throw new TypeError(`Nieznany preset SAG: ${String(preset)}`);
  return PRESET_VALUES[preset];
}

export function selectTargetSagPreset(value, tolerance = 0.001) {
  for (const preset of [TARGET_SAG_PRESET.TWENTY, TARGET_SAG_PRESET.TWENTY_FIVE, TARGET_SAG_PRESET.THIRTY]) {
    if (Math.abs(PRESET_VALUES[preset] - value) <= tolerance) return preset;
  }
  return TARGET_SAG_PRESET.CUSTOM;
}

export function resolveCalculatorSaveState({ hasValidResult, isSaving, isSaved }) {
  if (isSaving) return CALCULATOR_SAVE_STATE.SAVING;
  if (isSaved) return CALCULATOR_SAVE_STATE.SAVED;
  return hasValidResult ? CALCULATOR_SAVE_STATE.READY : CALCULATOR_SAVE_STATE.UNAVAILABLE;
}

export function isCalculatorSaveDisabled(state) {
  return state !== CALCULATOR_SAVE_STATE.READY;
}

function validResult(values, errors = {}) {
  return Object.freeze({ values: Object.freeze(values), errors: Object.freeze(errors), isValid: true });
}

function invalidResult(errors) {
  return Object.freeze({ values: null, errors: Object.freeze(errors), isValid: false });
}

export function validateSagNumbers({ suspensionTravel, measuredCompression, targetSag, suspensionType }) {
  const labels = getSuspensionDefinition(suspensionType);
  const errors = {};

  if (!Number.isFinite(suspensionTravel) || suspensionTravel <= 0) {
    errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL] = `${labels.travelFieldTitle} musi być większy od 0.`;
  }

  if (!Number.isFinite(measuredCompression) || measuredCompression < 0) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `${labels.measuredCompressionFieldTitle} nie może być ujemne.`;
  } else if (measuredCompression > suspensionTravel) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `${labels.measuredCompressionFieldTitle} nie może być większe niż ${labels.travelFieldTitle.toLocaleLowerCase("pl-PL")}.`;
  }

  if (!Number.isFinite(targetSag) || targetSag <= 0 || targetSag >= 100) {
    errors[SAG_INPUT_FIELD.TARGET_SAG] = "Docelowy SAG musi być większy od 0 i mniejszy od 100%.";
  }

  if (Object.keys(errors).length > 0) return invalidResult(errors);
  return validResult({ suspensionTravel, measuredCompression, targetSag });
}

export function validateSagTexts({ suspensionTravelText, measuredCompressionText, targetSagText, suspensionType }) {
  const labels = getSuspensionDefinition(suspensionType);
  const errors = {};
  let suspensionTravel = null;
  let measuredCompression = null;
  let targetSag = null;

  const travel = parseLocalizedNumber(suspensionTravelText);
  if (travel.status === NUMBER_PARSE_STATUS.EMPTY) {
    errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL] = `Podaj ${labels.travelFieldTitle.toLocaleLowerCase("pl-PL")}.`;
  } else if (travel.status === NUMBER_PARSE_STATUS.INVALID) {
    errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL] = `${labels.travelFieldTitle} musi być liczbą.`;
  } else if (travel.value <= 0) {
    errors[SAG_INPUT_FIELD.SUSPENSION_TRAVEL] = `${labels.travelFieldTitle} musi być większy od 0.`;
  } else {
    suspensionTravel = travel.value;
  }

  const compression = parseLocalizedNumber(measuredCompressionText);
  if (compression.status === NUMBER_PARSE_STATUS.EMPTY) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `Podaj ${labels.measuredCompressionFieldTitle.toLocaleLowerCase("pl-PL")}.`;
  } else if (compression.status === NUMBER_PARSE_STATUS.INVALID) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `${labels.measuredCompressionFieldTitle} musi być liczbą.`;
  } else if (compression.value < 0) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `${labels.measuredCompressionFieldTitle} nie może być ujemne.`;
  } else {
    measuredCompression = compression.value;
  }

  const target = parseLocalizedNumber(targetSagText);
  if (target.status === NUMBER_PARSE_STATUS.EMPTY) {
    errors[SAG_INPUT_FIELD.TARGET_SAG] = "Podaj docelowy SAG w procentach.";
  } else if (target.status === NUMBER_PARSE_STATUS.INVALID) {
    errors[SAG_INPUT_FIELD.TARGET_SAG] = "Docelowy SAG musi być liczbą, np. 20.";
  } else if (target.value <= 0 || target.value >= 100) {
    errors[SAG_INPUT_FIELD.TARGET_SAG] = "Docelowy SAG musi być większy od 0 i mniejszy od 100%.";
  } else {
    targetSag = target.value;
  }

  if (suspensionTravel !== null && measuredCompression !== null && measuredCompression > suspensionTravel) {
    errors[SAG_INPUT_FIELD.MEASURED_COMPRESSION] = `${labels.measuredCompressionFieldTitle} nie może być większe niż ${labels.travelFieldTitle.toLocaleLowerCase("pl-PL")}.`;
  }

  if (Object.keys(errors).length > 0) return invalidResult(errors);
  return validResult({ suspensionTravel, measuredCompression, targetSag });
}

export function validateOptionalPressure(value) {
  if (value === null || value === undefined || value === "") {
    return Object.freeze({ value: null, error: null });
  }

  if (typeof value === "string") {
    const parsed = parseLocalizedNumber(value);
    if (parsed.status === NUMBER_PARSE_STATUS.EMPTY) return Object.freeze({ value: null, error: null });
    if (parsed.status === NUMBER_PARSE_STATUS.INVALID) {
      return Object.freeze({ value: null, error: "Ciśnienie musi być liczbą, np. 82 albo 82,5." });
    }
    value = parsed.value;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return Object.freeze({ value: null, error: "Ciśnienie musi być większe od 0 PSI." });
  }

  return Object.freeze({ value: numericValue, error: null });
}

export function calculateSag(values) {
  const currentSag = values.measuredCompression / values.suspensionTravel * 100;
  const targetCompression = values.suspensionTravel * values.targetSag / 100;
  const differencePercentagePoints = currentSag - values.targetSag;
  const differenceMillimeters = values.measuredCompression - targetCompression;

  const interpretation = Math.abs(differencePercentagePoints) <= SAG_TOLERANCE_PERCENTAGE_POINTS
    ? SAG_INTERPRETATION.CLOSE_TO_TARGET
    : differencePercentagePoints < 0
      ? SAG_INTERPRETATION.TOO_LOW
      : SAG_INTERPRETATION.TOO_HIGH;

  return Object.freeze({
    currentSag,
    targetCompression,
    differencePercentagePoints,
    differenceMillimeters,
    interpretation
  });
}

export function evaluateLiveSag({
  suspensionTravel,
  measuredCompression,
  targetSag,
  pressure,
  suspensionType,
  hasSetMeasuredCompression
}) {
  const pressureValidation = validateOptionalPressure(pressure);

  if (!hasSetMeasuredCompression) {
    const errors = pressureValidation.error
      ? { [SAG_INPUT_FIELD.PRESSURE]: pressureValidation.error }
      : {};
    return Object.freeze({ values: null, pressure: pressureValidation.value, result: null, errors: Object.freeze(errors), isReady: false });
  }

  const validation = validateSagNumbers({ suspensionTravel, measuredCompression, targetSag, suspensionType });
  const errors = { ...validation.errors };
  if (pressureValidation.error) errors[SAG_INPUT_FIELD.PRESSURE] = pressureValidation.error;

  if (Object.keys(errors).length > 0 || !validation.values) {
    return Object.freeze({ values: null, pressure: pressureValidation.value, result: null, errors: Object.freeze(errors), isReady: false });
  }

  return Object.freeze({
    values: validation.values,
    pressure: pressureValidation.value,
    result: calculateSag(validation.values),
    errors: Object.freeze({}),
    isReady: true
  });
}
