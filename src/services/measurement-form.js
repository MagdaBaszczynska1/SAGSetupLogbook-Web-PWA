import { createSagMeasurement } from "../models/sag-measurement.js";
import { assertSuspensionType } from "../models/suspension-type.js";
import {
  SAG_INPUT_FIELD,
  calculateSag,
  validateOptionalPressure,
  validateSagTexts
} from "./sag-calculator.js";

export class MeasurementFormValidationError extends Error {
  constructor(errors) {
    super("Popraw dane pomiaru.");
    this.name = "MeasurementFormValidationError";
    this.errors = Object.freeze({ ...errors });
    this.firstField = [
      SAG_INPUT_FIELD.SUSPENSION_TRAVEL,
      SAG_INPUT_FIELD.MEASURED_COMPRESSION,
      SAG_INPUT_FIELD.PRESSURE,
      SAG_INPUT_FIELD.TARGET_SAG
    ].find(field => this.errors[field]) ?? null;
  }
}

function editableNumber(value) {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

export function measurementToFormValues(measurement) {
  return Object.freeze({
    suspensionType: measurement.suspensionType,
    suspensionTravel: editableNumber(measurement.suspensionTravel),
    measuredCompression: editableNumber(measurement.measuredCompression),
    pressure: editableNumber(measurement.pressure),
    targetSag: editableNumber(measurement.targetSag)
  });
}

export function validateMeasurementForm(values, originalMeasurement) {
  assertSuspensionType(values.suspensionType);

  const sagValidation = validateSagTexts({
    suspensionTravelText: values.suspensionTravel,
    measuredCompressionText: values.measuredCompression,
    targetSagText: values.targetSag,
    suspensionType: values.suspensionType
  });
  const pressureValidation = validateOptionalPressure(values.pressure);
  const errors = { ...sagValidation.errors };
  if (pressureValidation.error) errors[SAG_INPUT_FIELD.PRESSURE] = pressureValidation.error;

  if (!sagValidation.values || Object.keys(errors).length > 0) {
    throw new MeasurementFormValidationError(errors);
  }

  return createSagMeasurement({
    id: originalMeasurement.id,
    date: originalMeasurement.date,
    bikeID: originalMeasurement.bikeID,
    bikeNameSnapshot: originalMeasurement.bikeNameSnapshot,
    suspensionType: values.suspensionType,
    pressure: pressureValidation.value,
    values: sagValidation.values,
    result: calculateSag(sagValidation.values)
  });
}
