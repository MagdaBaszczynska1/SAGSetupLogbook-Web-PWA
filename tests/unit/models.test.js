import test from "node:test";
import assert from "node:assert/strict";
import {
  RIDE_MEASUREMENT_STATUS,
  SUSPENSION_TYPE,
  TRAIL_CONDITION,
  createBikeProfile,
  createBikeProfileSnapshot,
  createRideJournalEntry,
  createSagMeasurement,
  createSagMeasurementSnapshot,
  getAllMeasurementSnapshots,
  getBikeDisplayName,
  getBikePressure,
  getBikeProfileSnapshotDisplayName,
  getBikeTargetSag,
  getBikeTravel,
  getRideMeasurementAttachmentStatus,
  hasForkSnapshotData,
  hasShockSnapshotData
} from "../../src/models/index.js";
import { calculateSag } from "../../src/services/sag-calculator.js";

function createMeasurement({ date, bikeID = "bike-1", type = SUSPENSION_TYPE.FORK } = {}) {
  const values = { suspensionTravel: 100, measuredCompression: 20, targetSag: 20 };
  return createSagMeasurement({
    id: `${type}-${date}`,
    date,
    bikeID,
    bikeNameSnapshot: "Rower testowy — Model X",
    suspensionType: type,
    pressure: 82,
    values,
    result: calculateSag(values)
  });
}

test("profil roweru zachowuje pola i nazwę wyświetlaną", () => {
  const bike = createBikeProfile({
    id: "bike-1", name: "Rower testowy", model: " Model X ",
    forkTravel: 160, shockTravel: 65, forkTargetSag: 20, shockTargetSag: 28,
    forkPressure: 82, shockPressure: 175, createdAt: "2026-06-01T12:00:00.000Z"
  });
  assert.equal(getBikeDisplayName(bike), "Rower testowy — Model X");
  assert.equal(getBikeTravel(bike, SUSPENSION_TYPE.FORK), 160);
  assert.equal(getBikeTravel(bike, SUSPENSION_TYPE.SHOCK), 65);
  assert.equal(getBikeTargetSag(bike, SUSPENSION_TYPE.SHOCK), 28);
  assert.equal(getBikePressure(bike, SUSPENSION_TYPE.FORK), 82);
});

test("profil bez modelu pokazuje samą nazwę", () => {
  assert.equal(getBikeDisplayName(createBikeProfile({ name: "Hardtail", model: "  " })), "Hardtail");
});

test("pomiar przechowuje wejścia, wynik i snapshot nazwy roweru", () => {
  const measurement = createMeasurement({ date: "2026-06-15T10:00:00.000Z" });
  assert.equal(measurement.bikeID, "bike-1");
  assert.equal(measurement.bikeNameSnapshot, "Rower testowy — Model X");
  assert.equal(measurement.currentSag, 20);
  assert.equal(measurement.targetCompression, 20);
  assert.equal(measurement.differencePercentagePoints, 0);
});

test("snapshot profilu nie zmienia się po późniejszej edycji profilu", () => {
  const bike = createBikeProfile({ name: "Enduro", model: "X", forkTravel: 160, forkTargetSag: 25, forkPressure: 80 });
  const snapshot = createBikeProfileSnapshot(bike);
  bike.name = "Zmieniona nazwa";
  bike.forkTravel = 180;
  assert.equal(snapshot.bikeName, "Enduro");
  assert.equal(snapshot.forkTravel, 160);
  assert.equal(getBikeProfileSnapshotDisplayName(snapshot), "Enduro — X");
  assert.equal(hasForkSnapshotData(snapshot), true);
  assert.equal(hasShockSnapshotData(snapshot), false);
});

test("nowa tablica snapshotów ma pierwszeństwo nad starszym pojedynczym polem", () => {
  const legacy = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T09:00:00.000Z", type: SUSPENSION_TYPE.FORK }));
  const fork = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T10:00:00.000Z", type: SUSPENSION_TYPE.FORK }));
  const shock = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T11:00:00.000Z", type: SUSPENSION_TYPE.SHOCK }));
  const entry = createRideJournalEntry({
    rideDate: "2026-06-15T15:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Rower",
    measurementSnapshot: legacy, measurementSnapshots: [fork, shock], routeName: "Leśna pętla",
    conditions: TRAIL_CONDITION.DRY, rating: 4, notes: "Test"
  });
  assert.deepEqual(getAllMeasurementSnapshots(entry), [fork, shock]);
});

test("starszy pojedynczy snapshot jest dostępny jako kolekcja", () => {
  const legacy = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T10:00:00.000Z" }));
  const entry = createRideJournalEntry({
    rideDate: "2026-06-15T15:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Rower",
    measurementSnapshot: legacy, routeName: "Leśna pętla", conditions: TRAIL_CONDITION.DRY, rating: 4
  });
  assert.deepEqual(getAllMeasurementSnapshots(entry), [legacy]);
});

test("ocena wpisu jest ograniczona do zakresu 1–5", () => {
  const base = { rideDate: "2026-06-15T15:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Rower", routeName: "Trasa", conditions: TRAIL_CONDITION.DRY };
  assert.equal(createRideJournalEntry({ ...base, rating: -3 }).rating, 1);
  assert.equal(createRideJournalEntry({ ...base, rating: 99 }).rating, 5);
});

test("status pomiarów rozróżnia brak, ten sam dzień i dane historyczne", () => {
  const base = { rideDate: "2026-06-15T15:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Rower", routeName: "Trasa", conditions: TRAIL_CONDITION.DRY, rating: 4 };
  const noSnapshots = createRideJournalEntry(base);
  assert.deepEqual(getRideMeasurementAttachmentStatus(noSnapshots), { type: RIDE_MEASUREMENT_STATUS.NONE, count: 0 });

  const sameDay = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T10:00:00.000Z" }));
  const sameDayEntry = createRideJournalEntry({ ...base, measurementSnapshots: [sameDay] });
  assert.deepEqual(getRideMeasurementAttachmentStatus(sameDayEntry), { type: RIDE_MEASUREMENT_STATUS.SAME_DAY, count: 1 });

  const older = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-12T10:00:00.000Z" }));
  const historicalEntry = createRideJournalEntry({ ...base, measurementSnapshots: [older] });
  assert.deepEqual(getRideMeasurementAttachmentStatus(historicalEntry), { type: RIDE_MEASUREMENT_STATUS.HISTORICAL, count: 1 });

  const unassigned = createSagMeasurementSnapshot(createMeasurement({ date: "2026-06-15T10:00:00.000Z", bikeID: null }));
  const unassignedEntry = createRideJournalEntry({ ...base, measurementSnapshots: [unassigned] });
  assert.deepEqual(getRideMeasurementAttachmentStatus(unassignedEntry), { type: RIDE_MEASUREMENT_STATUS.HISTORICAL, count: 1 });
});
