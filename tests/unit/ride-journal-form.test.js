import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import {
  TRAIL_CONDITION,
  createBikeProfileSnapshot,
  createRideJournalEntry,
  createSagMeasurementSnapshot,
  getAllMeasurementSnapshots
} from "../../src/models/ride-journal-entry.js";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import {
  RideJournalConfirmationRequiredError,
  RideJournalValidationError,
  getEditableRideSnapshots,
  hasRideContextChanged,
  rideEntryToFormValues,
  validateRideJournalForm
} from "../../src/services/ride-journal-form.js";
import { getLocalDateKey } from "../../src/utils/date-formatters.js";

const bike = createBikeProfile({
  id: "bike-1",
  name: "Trek",
  model: "Slash",
  forkTravel: 160,
  forkTargetSag: 25,
  forkPressure: 80
});

function measurement(type = SUSPENSION_TYPE.FORK, id = "m1") {
  const values = type === SUSPENSION_TYPE.FORK
    ? { suspensionTravel: 160, measuredCompression: 40, targetSag: 25 }
    : { suspensionTravel: 65, measuredCompression: 19.5, targetSag: 30 };
  return createSagMeasurement({
    id,
    date: "2026-06-20T10:00:00.000Z",
    bikeID: bike.id,
    bikeNameSnapshot: "Trek — Slash",
    suspensionType: type,
    pressure: type === SUSPENSION_TYPE.FORK ? 80 : 180,
    values,
    result: calculateSag(values)
  });
}

const baseValues = {
  bikeID: "bike-1",
  routeName: "Leśna pętla",
  rideDate: "2026-06-20",
  conditions: TRAIL_CONDITION.DRY,
  rating: 4,
  notes: "Dobre ustawienie"
};

test("tworzy wpis z profilem i kopiami wybranych pomiarów", () => {
  const snapshots = [
    createSagMeasurementSnapshot(measurement(SUSPENSION_TYPE.FORK, "fork")),
    createSagMeasurementSnapshot(measurement(SUSPENSION_TYPE.SHOCK, "shock"))
  ];
  const entry = validateRideJournalForm(baseValues, { bike, measurementSnapshots: snapshots });
  assert.equal(entry.bikeNameSnapshot, "Trek — Slash");
  assert.equal(entry.bikeProfileSnapshot.forkTravel, 160);
  assert.deepEqual(getAllMeasurementSnapshots(entry), snapshots);
  assert.equal(getLocalDateKey(entry.rideDate), "2026-06-20");
});

test("nazwa trasy i notatka są przycinane", () => {
  const entry = validateRideJournalForm({ ...baseValues, routeName: "  Park  ", notes: "  test  " }, { bike });
  assert.equal(entry.routeName, "Park");
  assert.equal(entry.notes, "test");
});

test("formularz wymaga roweru, trasy, daty, warunków i oceny", () => {
  assert.throws(
    () => validateRideJournalForm({ bikeID: "", routeName: "", rideDate: "x", conditions: "bad", rating: 0 }, { bike: null }),
    error => {
      assert.ok(error instanceof RideJournalValidationError);
      assert.ok(error.errors.bikeID);
      assert.ok(error.errors.routeName);
      assert.ok(error.errors.rideDate);
      assert.ok(error.errors.conditions);
      assert.ok(error.errors.rating);
      return true;
    }
  );
});

test("odrzuca dwa pomiary tego samego typu", () => {
  const snapshots = [
    createSagMeasurementSnapshot(measurement(SUSPENSION_TYPE.FORK, "a")),
    createSagMeasurementSnapshot(measurement(SUSPENSION_TYPE.FORK, "b"))
  ];
  assert.throws(
    () => validateRideJournalForm(baseValues, { bike, measurementSnapshots: snapshots }),
    error => error instanceof RideJournalValidationError && Boolean(error.errors.measurements)
  );
});

test("edycja samego opisu zachowuje historyczny profil i snapshoty", () => {
  const originalSnapshot = createSagMeasurementSnapshot(measurement());
  const historicalProfile = createBikeProfileSnapshot(bike);
  const original = createRideJournalEntry({
    id: "entry-1",
    createdAt: "2026-06-20T11:00:00.000Z",
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: bike.id,
    bikeNameSnapshot: "Stara nazwa roweru",
    bikeProfileSnapshot: historicalProfile,
    measurementSnapshots: [originalSnapshot],
    routeName: "Stara trasa",
    conditions: TRAIL_CONDITION.DRY,
    rating: 3
  });
  const editedBike = createBikeProfile({ ...bike, name: "Nowa nazwa", forkTravel: 180 });
  const updated = validateRideJournalForm({ ...baseValues, routeName: "Nowa trasa" }, {
    bike: editedBike,
    originalEntry: original,
    measurementSnapshots: getEditableRideSnapshots(original)
  });
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.bikeNameSnapshot, "Stara nazwa roweru");
  assert.deepEqual(updated.bikeProfileSnapshot, historicalProfile);
  assert.deepEqual(updated.measurementSnapshots, [originalSnapshot]);
});

test("zmiana roweru lub dnia jest wykrywana jako zmiana kontekstu", () => {
  const original = createRideJournalEntry({
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower",
    routeName: "Trasa",
    conditions: TRAIL_CONDITION.DRY,
    rating: 3
  });
  assert.equal(hasRideContextChanged(baseValues, original), false);
  assert.equal(hasRideContextChanged({ ...baseValues, bikeID: "bike-2" }, original), true);
  assert.equal(hasRideContextChanged({ ...baseValues, rideDate: "2026-06-21" }, original), true);
});

test("zmiana kontekstu bez pomiaru wymaga dodatkowego potwierdzenia", () => {
  const original = createRideJournalEntry({
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower",
    bikeProfileSnapshot: createBikeProfileSnapshot(bike),
    routeName: "Trasa",
    conditions: TRAIL_CONDITION.DRY,
    rating: 3
  });
  assert.throws(
    () => validateRideJournalForm({ ...baseValues, rideDate: "2026-06-21" }, { bike, originalEntry: original, measurementSnapshots: [] }),
    RideJournalConfirmationRequiredError
  );
});

test("potwierdzenie pozwala zapisać zmianę kontekstu bez pomiaru", () => {
  const original = createRideJournalEntry({
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower",
    bikeProfileSnapshot: createBikeProfileSnapshot(bike),
    routeName: "Trasa",
    conditions: TRAIL_CONDITION.DRY,
    rating: 3
  });
  const updated = validateRideJournalForm({ ...baseValues, rideDate: "2026-06-21" }, {
    bike,
    originalEntry: original,
    measurementSnapshots: [],
    allowContextChangeWithoutMeasurements: true
  });
  assert.equal(getLocalDateKey(updated.rideDate), "2026-06-21");
  assert.deepEqual(updated.measurementSnapshots, []);
});

test("usunięty profil pozostaje dostępny podczas zwykłej edycji wpisu", () => {
  const original = createRideJournalEntry({
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: "deleted-bike",
    bikeNameSnapshot: "Usunięty rower",
    bikeProfileSnapshot: { bikeName: "Usunięty", bikeModel: "Rower", forkTravel: 150, forkTargetSag: 25, forkPressure: 75, shockTravel: null, shockTargetSag: null, shockPressure: null },
    routeName: "Trasa",
    conditions: TRAIL_CONDITION.WET,
    rating: 4
  });
  const updated = validateRideJournalForm({
    bikeID: "deleted-bike",
    routeName: "Nowa trasa",
    rideDate: "2026-06-20",
    conditions: TRAIL_CONDITION.WET,
    rating: 5,
    notes: ""
  }, { bike: null, originalEntry: original, measurementSnapshots: [] });
  assert.equal(updated.bikeNameSnapshot, "Usunięty rower");
  assert.deepEqual(updated.bikeProfileSnapshot, original.bikeProfileSnapshot);
});

test("wartości wpisu są przygotowywane do formularza", () => {
  const entry = createRideJournalEntry({
    rideDate: "2026-06-20T12:00:00.000Z",
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower",
    routeName: "Trasa",
    conditions: TRAIL_CONDITION.MIXED,
    rating: 5,
    notes: "Notatka"
  });
  assert.deepEqual(rideEntryToFormValues(entry), {
    bikeID: "bike-1",
    routeName: "Trasa",
    rideDate: "2026-06-20",
    conditions: TRAIL_CONDITION.MIXED,
    rating: 5,
    notes: "Notatka"
  });
});
