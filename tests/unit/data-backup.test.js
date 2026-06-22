import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import {
  TRAIL_CONDITION,
  createBikeProfileSnapshot,
  createRideJournalEntry,
  createSagMeasurementSnapshot
} from "../../src/models/ride-journal-entry.js";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { createMemoryDatabase } from "../../src/persistence/memory-database.js";
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  BackupRestoreError,
  BackupValidationError,
  createCsvReport,
  createDataBackup,
  parseDataBackup,
  restoreDataBackup,
  validateDataBackup
} from "../../src/services/data-backup.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import { createBikeStore } from "../../src/stores/bike-store.js";
import { createMeasurementStore } from "../../src/stores/measurement-store.js";
import { createRideJournalStore } from "../../src/stores/ride-journal-store.js";

function fixtures() {
  const bike = createBikeProfile({
    id: "bike-1",
    name: "Trek",
    model: "Slash",
    forkTravel: 160,
    forkTargetSag: 25,
    forkPressure: 80,
    shockTravel: 65,
    shockTargetSag: 30,
    shockPressure: 180,
    createdAt: "2026-06-01T12:00:00.000Z"
  });
  const values = { suspensionTravel: 160, measuredCompression: 40, targetSag: 25 };
  const measurement = createSagMeasurement({
    id: "measurement-1",
    date: "2026-06-20T10:00:00.000Z",
    bikeID: bike.id,
    bikeNameSnapshot: "Trek — Slash",
    suspensionType: SUSPENSION_TYPE.FORK,
    pressure: 80,
    values,
    result: calculateSag(values)
  });
  const ride = createRideJournalEntry({
    id: "ride-1",
    createdAt: "2026-06-20T12:00:00.000Z",
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: bike.id,
    bikeNameSnapshot: "Trek — Slash",
    bikeProfileSnapshot: createBikeProfileSnapshot(bike),
    measurementSnapshots: [createSagMeasurementSnapshot(measurement)],
    routeName: "Leśna pętla",
    conditions: TRAIL_CONDITION.DRY,
    rating: 4,
    notes: "Dobre ustawienie"
  });
  return { bike, measurement, ride };
}

function plainBackup(overrides = {}) {
  const { bike, measurement, ride } = fixtures();
  return JSON.parse(JSON.stringify(createDataBackup({
    bikes: [bike],
    measurements: [measurement],
    rides: [ride],
    settings: { appearanceMode: "dark" },
    exportedAt: "2026-06-22T10:00:00.000Z",
    ...overrides
  })));
}

async function storesFor(database) {
  const bikeStore = createBikeStore(database);
  const measurementStore = createMeasurementStore(database);
  const rideJournalStore = createRideJournalStore(database);
  await Promise.all([bikeStore.initialize(), measurementStore.initialize(), rideJournalStore.initialize()]);
  return { bikeStore, measurementStore, rideJournalStore };
}

test("pełna kopia przechodzi walidację i zachowuje liczby rekordów", () => {
  const backup = plainBackup();
  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.schemaVersion, BACKUP_SCHEMA_VERSION);
  const result = validateDataBackup(backup);
  assert.equal(result.bikes.length, 1);
  assert.equal(result.measurements.length, 1);
  assert.equal(result.rides.length, 1);
  assert.equal(result.settings.appearanceMode, "dark");
});

test("wyniki pomiaru są bezpiecznie przeliczane zamiast ufania plikowi", () => {
  const backup = plainBackup();
  backup.data.measurements[0].currentSag = 999;
  backup.data.measurements[0].interpretation = "closeToTarget";
  const result = validateDataBackup(backup);
  assert.equal(result.measurements[0].currentSag, 25);
  assert.equal(result.measurements[0].targetCompression, 40);
});

test("parser odrzuca uszkodzony JSON, format i wersję schematu", () => {
  assert.throws(() => parseDataBackup("{x"), BackupValidationError);
  const wrongFormat = plainBackup();
  wrongFormat.format = "other";
  assert.throws(() => validateDataBackup(wrongFormat), /nieobsługiwany format/);
  const wrongVersion = plainBackup();
  wrongVersion.schemaVersion = 99;
  assert.throws(() => validateDataBackup(wrongVersion), /wersja schematu/);
});

test("odrzuca powtarzające się identyfikatory kolekcji", () => {
  const backup = plainBackup();
  backup.data.bikes.push({ ...backup.data.bikes[0] });
  assert.throws(() => validateDataBackup(backup), /powtarzający się identyfikator/);
});

test("odrzuca nieprawidłowe dane SAG i ciśnienie", () => {
  const backup = plainBackup();
  backup.data.measurements[0].measuredCompression = 999;
  assert.throws(() => validateDataBackup(backup), /nie może być większe/);
  const pressure = plainBackup();
  pressure.data.measurements[0].pressure = -1;
  assert.throws(() => validateDataBackup(pressure), /Ciśnienie musi być większe/);
});

test("odrzuca dwa snapshoty tego samego typu w jednym wpisie", () => {
  const backup = plainBackup();
  backup.data.rides[0].measurementSnapshots.push({ ...backup.data.rides[0].measurementSnapshots[0], sourceMeasurementID: "measurement-2" });
  assert.throws(() => validateDataBackup(backup), /najwyżej jeden pomiar każdego typu/);
});

test("CSV zawiera wszystkie typy rekordów i chroni przed formułami arkusza", () => {
  const { bike, measurement, ride } = fixtures();
  const csv = createCsvReport({
    bikes: [{ ...bike, name: "=HYPERLINK(\"x\")" }],
    measurements: [measurement],
    rides: [{ ...ride, notes: "+SUM(1,1)" }]
  });
  assert.match(csv, /"bike"/);
  assert.match(csv, /"measurement"/);
  assert.match(csv, /"ride"/);
  assert.match(csv, /"'=HYPERLINK/);
  assert.match(csv, /"'\+SUM/);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
});

test("import atomowo zastępuje dane i odświeża wszystkie magazyny", async () => {
  const database = createMemoryDatabase();
  const stores = await storesFor(database);
  await stores.bikeStore.add(createBikeProfile({ id: "old-bike", name: "Stary", createdAt: "2026-01-01T00:00:00.000Z" }));
  const appliedModes = [];
  const result = await restoreDataBackup({
    backup: plainBackup(),
    database,
    ...stores,
    appSettingsStore: { setAppearanceMode(mode) { appliedModes.push(mode); return true; } }
  });
  assert.deepEqual(result, { bikes: 1, measurements: 1, rides: 1, settingsApplied: true });
  assert.equal(stores.bikeStore.getById("old-bike"), null);
  assert.equal(stores.bikeStore.getById("bike-1").name, "Trek");
  assert.equal(stores.measurementStore.getAll().length, 1);
  assert.equal(stores.rideJournalStore.getAll().length, 1);
  assert.deepEqual(appliedModes, ["dark"]);
});

test("błąd importu przywraca poprzednie dane", async () => {
  const baseDatabase = createMemoryDatabase();
  let replacementCalls = 0;
  const database = Object.freeze({
    ...baseDatabase,
    async replaceCollections(...args) {
      replacementCalls += 1;
      if (replacementCalls === 1) throw new Error("symulowany błąd zapisu");
      return baseDatabase.replaceCollections(...args);
    }
  });
  const stores = await storesFor(database);
  await stores.bikeStore.add(createBikeProfile({ id: "safe-bike", name: "Bezpieczny", createdAt: "2026-01-01T00:00:00.000Z" }));

  await assert.rejects(
    restoreDataBackup({ backup: plainBackup(), database, ...stores }),
    error => error instanceof BackupRestoreError && /Poprzednie dane zostały przywrócone/.test(error.message)
  );
  assert.equal(stores.bikeStore.getById("safe-bike").name, "Bezpieczny");
  assert.equal(stores.bikeStore.getById("bike-1"), null);
  assert.equal(replacementCalls, 2);
});
