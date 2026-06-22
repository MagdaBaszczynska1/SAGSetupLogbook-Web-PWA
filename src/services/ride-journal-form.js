import {
  TRAIL_CONDITION_CONTENT,
  createBikeProfileSnapshot,
  createRideJournalEntry,
  createSagMeasurementSnapshot,
  getAllMeasurementSnapshots
} from "../models/ride-journal-entry.js";
import { getBikeDisplayName } from "../models/bike-profile.js";
import { cloneValue } from "../utils/clone.js";
import { dateInputValueToIso, getLocalDateKey, toDateInputValue } from "../utils/date-formatters.js";

export class RideJournalValidationError extends Error {
  constructor(errors) {
    super("Popraw dane wpisu Dziennika.");
    this.name = "RideJournalValidationError";
    this.errors = Object.freeze({ ...errors });
    this.firstField = ["bikeID", "routeName", "rideDate", "conditions", "rating", "measurements"]
      .find(field => this.errors[field]) ?? null;
  }
}

export class RideJournalConfirmationRequiredError extends Error {
  constructor() {
    super("Zmiana roweru lub dnia jazdy odłączyła wcześniejsze pomiary. Potwierdź zapis bez pomiaru.");
    this.name = "RideJournalConfirmationRequiredError";
  }
}

export function rideEntryToFormValues(entry) {
  return Object.freeze({
    bikeID: entry?.bikeID ?? "",
    routeName: entry?.routeName ?? "",
    rideDate: entry ? toDateInputValue(entry.rideDate) : toDateInputValue(new Date()),
    conditions: entry?.conditions ?? "dry",
    rating: entry?.rating ?? 3,
    notes: entry?.notes ?? ""
  });
}

export function hasRideContextChanged(values, originalEntry) {
  if (!originalEntry) return false;
  const rideDateIso = dateInputValueToIso(values.rideDate);
  return String(values.bikeID) !== String(originalEntry.bikeID)
    || getLocalDateKey(rideDateIso) !== getLocalDateKey(originalEntry.rideDate);
}

function validateSnapshots(snapshots) {
  const source = Array.isArray(snapshots) ? snapshots : [];
  const types = new Set();
  const ids = new Set();
  for (const snapshot of source) {
    if (!snapshot?.sourceMeasurementID || ids.has(snapshot.sourceMeasurementID)) {
      return "Wybrane pomiary zawierają brakujący lub powtarzający się identyfikator.";
    }
    if (types.has(snapshot.suspensionType)) {
      return "Do jednego wpisu można dodać najwyżej jeden pomiar widelca i jeden pomiar dampera.";
    }
    ids.add(snapshot.sourceMeasurementID);
    types.add(snapshot.suspensionType);
  }
  return null;
}

export function validateRideJournalForm(values, {
  bike,
  originalEntry = null,
  measurementSnapshots = [],
  allowContextChangeWithoutMeasurements = false
} = {}) {
  const errors = {};
  const bikeID = String(values.bikeID ?? "").trim();
  const routeName = String(values.routeName ?? "").trim();
  const rideDate = dateInputValueToIso(values.rideDate);
  const conditions = String(values.conditions ?? "");
  const rating = Number(values.rating);
  const notes = String(values.notes ?? "").trim();

  if (!bikeID) errors.bikeID = "Wybierz profil roweru.";
  if (!routeName) errors.routeName = "Podaj nazwę trasy lub miejsce jazdy.";
  if (!rideDate) errors.rideDate = "Podaj prawidłową datę jazdy.";
  if (!(conditions in TRAIL_CONDITION_CONTENT)) errors.conditions = "Wybierz warunki na trasie.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Wybierz ocenę od 1 do 5.";

  const snapshotError = validateSnapshots(measurementSnapshots);
  if (snapshotError) errors.measurements = snapshotError;

  const selectedBikeIsHistorical = originalEntry && String(originalEntry.bikeID) === bikeID;
  if (!bike && !selectedBikeIsHistorical) errors.bikeID = "Wybrany profil roweru nie istnieje.";

  if (Object.keys(errors).length > 0) throw new RideJournalValidationError(errors);

  const contextChanged = hasRideContextChanged({ ...values, rideDate: values.rideDate }, originalEntry);
  if (originalEntry && contextChanged && measurementSnapshots.length === 0 && !allowContextChangeWithoutMeasurements) {
    throw new RideJournalConfirmationRequiredError();
  }

  const preserveHistoricalProfile = Boolean(originalEntry && String(originalEntry.bikeID) === bikeID && !contextChanged);
  const bikeNameSnapshot = preserveHistoricalProfile
    ? originalEntry.bikeNameSnapshot
    : bike
      ? getBikeDisplayName(bike)
      : originalEntry.bikeNameSnapshot;
  const bikeProfileSnapshot = preserveHistoricalProfile
    ? cloneValue(originalEntry.bikeProfileSnapshot)
    : bike
      ? createBikeProfileSnapshot(bike)
      : cloneValue(originalEntry.bikeProfileSnapshot);

  return createRideJournalEntry({
    id: originalEntry?.id,
    createdAt: originalEntry?.createdAt,
    rideDate,
    bikeID,
    bikeNameSnapshot,
    bikeProfileSnapshot,
    measurementSnapshot: null,
    measurementSnapshots: measurementSnapshots.map(cloneValue),
    routeName,
    conditions,
    rating,
    notes
  });
}

export function measurementsToSnapshots(measurements) {
  return (measurements ?? []).map(createSagMeasurementSnapshot);
}

export function getEditableRideSnapshots(entry) {
  return getAllMeasurementSnapshots(entry).map(cloneValue);
}
