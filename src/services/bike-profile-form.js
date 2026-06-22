import { createBikeProfile } from "../models/bike-profile.js";
import {
  OPTIONAL_NUMBER_RULE,
  validateOptionalLocalizedNumber
} from "./localized-number-parser.js";

export class BikeProfileValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "BikeProfileValidationError";
    this.field = field;
  }
}

function parseOptional(text, fieldName, rule, field) {
  try {
    return validateOptionalLocalizedNumber(text, { fieldName, rule });
  } catch (error) {
    throw new BikeProfileValidationError(error.message, field);
  }
}

export function validateBikeProfileForm(values, existingBike = null) {
  const name = String(values.name ?? "").trim();
  const model = String(values.model ?? "").trim();

  if (!name) {
    throw new BikeProfileValidationError("Podaj nazwę profilu roweru.", "name");
  }

  const forkTravel = parseOptional(values.forkTravel, "Skok widelca", OPTIONAL_NUMBER_RULE.POSITIVE, "forkTravel");
  const shockTravel = parseOptional(values.shockTravel, "Skok dampera", OPTIONAL_NUMBER_RULE.POSITIVE, "shockTravel");
  const forkTargetSag = parseOptional(values.forkTargetSag, "Docelowy SAG widelca", OPTIONAL_NUMBER_RULE.PERCENTAGE, "forkTargetSag");
  const shockTargetSag = parseOptional(values.shockTargetSag, "Docelowy SAG dampera", OPTIONAL_NUMBER_RULE.PERCENTAGE, "shockTargetSag");
  const forkPressure = parseOptional(values.forkPressure, "Ciśnienie widelca", OPTIONAL_NUMBER_RULE.POSITIVE, "forkPressure");
  const shockPressure = parseOptional(values.shockPressure, "Ciśnienie dampera", OPTIONAL_NUMBER_RULE.POSITIVE, "shockPressure");

  return createBikeProfile({
    id: existingBike?.id,
    name,
    model,
    forkTravel,
    shockTravel,
    forkTargetSag,
    shockTargetSag,
    forkPressure,
    shockPressure,
    createdAt: existingBike?.createdAt ?? new Date().toISOString()
  });
}

export function bikeProfileToFormValues(bike) {
  const input = value => value === null || value === undefined ? "" : String(value).replace(".", ",");
  return {
    name: bike?.name ?? "",
    model: bike?.model ?? "",
    forkTravel: input(bike?.forkTravel),
    shockTravel: input(bike?.shockTravel),
    forkTargetSag: input(bike?.forkTargetSag),
    shockTargetSag: input(bike?.shockTargetSag),
    forkPressure: input(bike?.forkPressure),
    shockPressure: input(bike?.shockPressure)
  };
}
