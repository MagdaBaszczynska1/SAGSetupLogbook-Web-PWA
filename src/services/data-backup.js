import { createBikeProfile, getBikeDisplayName } from "../models/bike-profile.js";
import {
  TRAIL_CONDITION_CONTENT,
  createRideJournalEntry,
  getAllMeasurementSnapshots
} from "../models/ride-journal-entry.js";
import { createSagMeasurement } from "../models/sag-measurement.js";
import { assertSuspensionType } from "../models/suspension-type.js";
import { DATA_STORE } from "../persistence/memory-database.js";
import { APPEARANCE_MODE } from "../stores/app-settings-store.js";
import { calculateSag, validateOptionalPressure, validateSagNumbers } from "./sag-calculator.js";

export const BACKUP_FORMAT = "sag-setup-logbook-backup";
export const BACKUP_SCHEMA_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export class BackupValidationError extends Error {
  constructor(message, path = null) {
    super(path ? `${path}: ${message}` : message);
    this.name = "BackupValidationError";
    this.path = path;
  }
}

export class BackupRestoreError extends Error {
  constructor(message, { cause = null, rollbackError = null } = {}) {
    super(message, { cause });
    this.name = "BackupRestoreError";
    this.rollbackError = rollbackError;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function objectAt(value, path) {
  if (!isObject(value)) throw new BackupValidationError("oczekiwano obiektu", path);
  return value;
}

function stringAt(value, path, { allowEmpty = false } = {}) {
  if (typeof value !== "string") throw new BackupValidationError("oczekiwano tekstu", path);
  const text = value.trim();
  if (!allowEmpty && !text) throw new BackupValidationError("wartość nie może być pusta", path);
  return allowEmpty ? value : text;
}

function isoDateAt(value, path) {
  if (typeof value !== "string") throw new BackupValidationError("oczekiwano daty ISO", path);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new BackupValidationError("nieprawidłowa data", path);
  return date.toISOString();
}

function nullableStringAt(value, path) {
  if (value === null || value === undefined) return null;
  return stringAt(value, path, { allowEmpty: true });
}

function optionalPositiveNumber(value, path) {
  if (value === null || value === undefined || value === "") return null;
  if (!Number.isFinite(value) || value <= 0) throw new BackupValidationError("wartość musi być dodatnią liczbą", path);
  return value;
}

function optionalSag(value, path) {
  if (value === null || value === undefined || value === "") return null;
  if (!Number.isFinite(value) || value <= 0 || value >= 100) {
    throw new BackupValidationError("SAG musi być większy od 0 i mniejszy od 100", path);
  }
  return value;
}

function arrayAt(value, path) {
  if (!Array.isArray(value)) throw new BackupValidationError("oczekiwano tablicy", path);
  return value;
}

function ensureUniqueIDs(records, path) {
  const ids = new Set();
  records.forEach((record, index) => {
    if (ids.has(record.id)) throw new BackupValidationError(`powtarzający się identyfikator ${record.id}`, `${path}[${index}].id`);
    ids.add(record.id);
  });
}

function normalizeBike(raw, index) {
  const path = `data.bikes[${index}]`;
  const source = objectAt(raw, path);
  return createBikeProfile({
    id: stringAt(source.id, `${path}.id`),
    name: stringAt(source.name, `${path}.name`),
    model: stringAt(source.model ?? "", `${path}.model`, { allowEmpty: true }),
    forkTravel: optionalPositiveNumber(source.forkTravel, `${path}.forkTravel`),
    shockTravel: optionalPositiveNumber(source.shockTravel, `${path}.shockTravel`),
    forkTargetSag: optionalSag(source.forkTargetSag, `${path}.forkTargetSag`),
    shockTargetSag: optionalSag(source.shockTargetSag, `${path}.shockTargetSag`),
    forkPressure: optionalPositiveNumber(source.forkPressure, `${path}.forkPressure`),
    shockPressure: optionalPositiveNumber(source.shockPressure, `${path}.shockPressure`),
    createdAt: isoDateAt(source.createdAt, `${path}.createdAt`)
  });
}

function normalizePressure(value, path) {
  const result = validateOptionalPressure(value);
  if (result.error) throw new BackupValidationError(result.error, path);
  return result.value;
}

function normalizeSagValues(source, path) {
  try {
    assertSuspensionType(source.suspensionType);
  } catch {
    throw new BackupValidationError("nieznany typ zawieszenia", `${path}.suspensionType`);
  }
  const validation = validateSagNumbers({
    suspensionTravel: source.suspensionTravel,
    measuredCompression: source.measuredCompression,
    targetSag: source.targetSag,
    suspensionType: source.suspensionType
  });
  if (!validation.isValid) {
    const first = Object.entries(validation.errors)[0];
    throw new BackupValidationError(first?.[1] ?? "nieprawidłowe dane SAG", `${path}.${first?.[0] ?? "values"}`);
  }
  return validation.values;
}

function normalizeMeasurement(raw, index) {
  const path = `data.measurements[${index}]`;
  const source = objectAt(raw, path);
  const values = normalizeSagValues(source, path);
  return createSagMeasurement({
    id: stringAt(source.id, `${path}.id`),
    date: isoDateAt(source.date, `${path}.date`),
    bikeID: nullableStringAt(source.bikeID, `${path}.bikeID`),
    bikeNameSnapshot: nullableStringAt(source.bikeNameSnapshot, `${path}.bikeNameSnapshot`),
    suspensionType: source.suspensionType,
    pressure: normalizePressure(source.pressure, `${path}.pressure`),
    values,
    result: calculateSag(values)
  });
}

function normalizeBikeSnapshot(raw, path) {
  if (raw === null || raw === undefined) return null;
  const source = objectAt(raw, path);
  return {
    bikeName: stringAt(source.bikeName, `${path}.bikeName`),
    bikeModel: stringAt(source.bikeModel ?? "", `${path}.bikeModel`, { allowEmpty: true }),
    forkTravel: optionalPositiveNumber(source.forkTravel, `${path}.forkTravel`),
    forkTargetSag: optionalSag(source.forkTargetSag, `${path}.forkTargetSag`),
    forkPressure: optionalPositiveNumber(source.forkPressure, `${path}.forkPressure`),
    shockTravel: optionalPositiveNumber(source.shockTravel, `${path}.shockTravel`),
    shockTargetSag: optionalSag(source.shockTargetSag, `${path}.shockTargetSag`),
    shockPressure: optionalPositiveNumber(source.shockPressure, `${path}.shockPressure`)
  };
}

function normalizeMeasurementSnapshot(raw, path) {
  const source = objectAt(raw, path);
  const values = normalizeSagValues(source, path);
  const result = calculateSag(values);
  return {
    sourceMeasurementID: stringAt(source.sourceMeasurementID, `${path}.sourceMeasurementID`),
    sourceBikeID: nullableStringAt(source.sourceBikeID, `${path}.sourceBikeID`),
    measurementDate: isoDateAt(source.measurementDate, `${path}.measurementDate`),
    suspensionType: source.suspensionType,
    suspensionTravel: values.suspensionTravel,
    measuredCompression: values.measuredCompression,
    targetSag: values.targetSag,
    pressure: normalizePressure(source.pressure, `${path}.pressure`),
    currentSag: result.currentSag,
    targetCompression: result.targetCompression,
    differencePercentagePoints: result.differencePercentagePoints,
    differenceMillimeters: result.differenceMillimeters,
    interpretation: result.interpretation
  };
}

function normalizeRide(raw, index) {
  const path = `data.rides[${index}]`;
  const source = objectAt(raw, path);
  const conditions = stringAt(source.conditions, `${path}.conditions`);
  if (!(conditions in TRAIL_CONDITION_CONTENT)) throw new BackupValidationError("nieznane warunki jazdy", `${path}.conditions`);
  if (!Number.isInteger(source.rating) || source.rating < 1 || source.rating > 5) {
    throw new BackupValidationError("ocena musi być liczbą całkowitą od 1 do 5", `${path}.rating`);
  }

  const rawSnapshots = Array.isArray(source.measurementSnapshots)
    ? source.measurementSnapshots
    : source.measurementSnapshot
      ? [source.measurementSnapshot]
      : [];
  const snapshots = rawSnapshots.map((snapshot, snapshotIndex) => normalizeMeasurementSnapshot(snapshot, `${path}.measurementSnapshots[${snapshotIndex}]`));
  const snapshotIDs = new Set();
  const snapshotTypes = new Set();
  snapshots.forEach((snapshot, snapshotIndex) => {
    if (snapshotIDs.has(snapshot.sourceMeasurementID)) throw new BackupValidationError("powtarzający się pomiar", `${path}.measurementSnapshots[${snapshotIndex}]`);
    if (snapshotTypes.has(snapshot.suspensionType)) throw new BackupValidationError("można zapisać najwyżej jeden pomiar każdego typu", `${path}.measurementSnapshots[${snapshotIndex}]`);
    snapshotIDs.add(snapshot.sourceMeasurementID);
    snapshotTypes.add(snapshot.suspensionType);
  });

  return createRideJournalEntry({
    id: stringAt(source.id, `${path}.id`),
    createdAt: isoDateAt(source.createdAt, `${path}.createdAt`),
    rideDate: isoDateAt(source.rideDate, `${path}.rideDate`),
    bikeID: stringAt(source.bikeID, `${path}.bikeID`),
    bikeNameSnapshot: stringAt(source.bikeNameSnapshot, `${path}.bikeNameSnapshot`),
    bikeProfileSnapshot: normalizeBikeSnapshot(source.bikeProfileSnapshot, `${path}.bikeProfileSnapshot`),
    measurementSnapshot: null,
    measurementSnapshots: snapshots,
    routeName: stringAt(source.routeName, `${path}.routeName`),
    conditions,
    rating: source.rating,
    notes: stringAt(source.notes ?? "", `${path}.notes`, { allowEmpty: true })
  });
}

function normalizeSettings(raw) {
  if (!isObject(raw)) return null;
  const mode = raw.appearanceMode;
  if (!Object.values(APPEARANCE_MODE).includes(mode)) throw new BackupValidationError("nieznany tryb wyglądu", "settings.appearanceMode");
  return Object.freeze({ appearanceMode: mode });
}

export function createDataBackup({ bikes, measurements, rides, settings = null, exportedAt = new Date().toISOString() }) {
  return Object.freeze({
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date(exportedAt).toISOString(),
    appVersion: "0.8.0",
    data: Object.freeze({
      bikes: Object.freeze([...(bikes ?? [])]),
      measurements: Object.freeze([...(measurements ?? [])]),
      rides: Object.freeze([...(rides ?? [])])
    }),
    settings: settings ? Object.freeze({ appearanceMode: settings.appearanceMode }) : null
  });
}

export function validateDataBackup(raw) {
  const source = objectAt(raw, "backup");
  if (source.format !== BACKUP_FORMAT) throw new BackupValidationError("nieobsługiwany format kopii", "format");
  if (source.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError(`obsługiwana jest wersja schematu ${BACKUP_SCHEMA_VERSION}`, "schemaVersion");
  }
  isoDateAt(source.exportedAt, "exportedAt");
  const data = objectAt(source.data, "data");
  const bikes = arrayAt(data.bikes, "data.bikes").map(normalizeBike);
  const measurements = arrayAt(data.measurements, "data.measurements").map(normalizeMeasurement);
  const rides = arrayAt(data.rides, "data.rides").map(normalizeRide);
  ensureUniqueIDs(bikes, "data.bikes");
  ensureUniqueIDs(measurements, "data.measurements");
  ensureUniqueIDs(rides, "data.rides");
  return Object.freeze({
    bikes: Object.freeze(bikes),
    measurements: Object.freeze(measurements),
    rides: Object.freeze(rides),
    settings: normalizeSettings(source.settings)
  });
}

export function parseDataBackup(text) {
  if (typeof text !== "string") throw new BackupValidationError("plik musi zawierać tekst JSON");
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new BackupValidationError("plik przekracza limit 10 MB");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupValidationError("plik nie zawiera prawidłowego JSON");
  }
  return validateDataBackup(parsed);
}

async function reloadStores(stores) {
  await Promise.all(stores.map(store => store.initialize()));
}

export async function restoreDataBackup({ backup, database, bikeStore, measurementStore, rideJournalStore, appSettingsStore = null }) {
  const normalized = validateDataBackup(backup);
  const stores = [bikeStore, measurementStore, rideJournalStore];
  const previous = {
    [DATA_STORE.BIKES]: await database.getAll(DATA_STORE.BIKES),
    [DATA_STORE.MEASUREMENTS]: await database.getAll(DATA_STORE.MEASUREMENTS),
    [DATA_STORE.RIDES]: await database.getAll(DATA_STORE.RIDES)
  };
  const collections = {
    [DATA_STORE.BIKES]: normalized.bikes,
    [DATA_STORE.MEASUREMENTS]: normalized.measurements,
    [DATA_STORE.RIDES]: normalized.rides
  };

  try {
    await database.replaceCollections(collections, [{
      key: "last-backup-import",
      value: { date: new Date().toISOString(), schemaVersion: BACKUP_SCHEMA_VERSION }
    }]);
    await reloadStores(stores);
  } catch (error) {
    try {
      await database.replaceCollections(previous);
      await reloadStores(stores);
    } catch (rollbackError) {
      throw new BackupRestoreError("Import nie powiódł się, a przywrócenie poprzednich danych również się nie udało.", { cause: error, rollbackError });
    }
    throw new BackupRestoreError("Import nie powiódł się. Poprzednie dane zostały przywrócone.", { cause: error });
  }

  const settingsApplied = normalized.settings && appSettingsStore
    ? appSettingsStore.setAppearanceMode(normalized.settings.appearanceMode)
    : null;
  return Object.freeze({
    bikes: normalized.bikes.length,
    measurements: normalized.measurements.length,
    rides: normalized.rides.length,
    settingsApplied
  });
}

function csvCell(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsvReport({ bikes = [], measurements = [], rides = [] }) {
  const headers = [
    "recordType", "id", "date", "bikeId", "bikeName", "modelOrRoute", "conditions", "rating", "notes",
    "suspensionType", "travelMm", "compressionMm", "targetSagPercent", "currentSagPercent", "pressurePsi",
    "forkTravelMm", "forkTargetSagPercent", "forkPressurePsi", "shockTravelMm", "shockTargetSagPercent", "shockPressurePsi", "measurementCount"
  ];
  const rows = [];
  bikes.forEach(bike => rows.push({
    recordType: "bike", id: bike.id, date: bike.createdAt, bikeId: bike.id, bikeName: bike.name, modelOrRoute: bike.model,
    forkTravelMm: bike.forkTravel, forkTargetSagPercent: bike.forkTargetSag, forkPressurePsi: bike.forkPressure,
    shockTravelMm: bike.shockTravel, shockTargetSagPercent: bike.shockTargetSag, shockPressurePsi: bike.shockPressure
  }));
  measurements.forEach(measurement => rows.push({
    recordType: "measurement", id: measurement.id, date: measurement.date, bikeId: measurement.bikeID,
    bikeName: measurement.bikeNameSnapshot, suspensionType: measurement.suspensionType, travelMm: measurement.suspensionTravel,
    compressionMm: measurement.measuredCompression, targetSagPercent: measurement.targetSag,
    currentSagPercent: measurement.currentSag, pressurePsi: measurement.pressure
  }));
  rides.forEach(ride => {
    const snapshots = getAllMeasurementSnapshots(ride);
    const profile = ride.bikeProfileSnapshot ?? {};
    rows.push({
      recordType: "ride", id: ride.id, date: ride.rideDate, bikeId: ride.bikeID, bikeName: ride.bikeNameSnapshot,
      modelOrRoute: ride.routeName, conditions: TRAIL_CONDITION_CONTENT[ride.conditions]?.title ?? ride.conditions,
      rating: ride.rating, notes: ride.notes, forkTravelMm: profile.forkTravel, forkTargetSagPercent: profile.forkTargetSag,
      forkPressurePsi: profile.forkPressure, shockTravelMm: profile.shockTravel, shockTargetSagPercent: profile.shockTargetSag,
      shockPressurePsi: profile.shockPressure, measurementCount: snapshots.length
    });
  });
  const lines = [headers.map(csvCell).join(",")];
  rows.forEach(row => lines.push(headers.map(header => csvCell(row[header])).join(",")));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function backupFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `sag-setup-logbook-backup-${stamp}.json`;
}

export function csvFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `sag-setup-logbook-report-${stamp}.csv`;
}

export function summarizeBackup(backup) {
  const normalized = validateDataBackup(backup);
  return Object.freeze({
    bikes: normalized.bikes.length,
    measurements: normalized.measurements.length,
    rides: normalized.rides.length
  });
}
