import test from "node:test";
import assert from "node:assert/strict";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { createMemoryDatabase } from "../../src/persistence/memory-database.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import { validateMeasurementForm } from "../../src/services/measurement-form.js";
import { createMeasurementStore } from "../../src/stores/measurement-store.js";
import { createRideDraftStore } from "../../src/stores/ride-draft-store.js";

function fixture(id, date, compression = 40) {
  const values = { suspensionTravel: 160, measuredCompression: compression, targetSag: 25 };
  return createSagMeasurement({
    id,
    date,
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower historyczny",
    suspensionType: SUSPENSION_TYPE.FORK,
    pressure: 80,
    values,
    result: calculateSag(values)
  });
}

test("edycja pomiaru jest trwała po ponownym utworzeniu magazynu", async () => {
  const database = createMemoryDatabase();
  const store = createMeasurementStore(database);
  await store.initialize();
  const original = fixture("m1", "2026-06-20T10:00:00.000Z");
  await store.add(original);

  const updated = validateMeasurementForm({
    suspensionType: "shock",
    suspensionTravel: "65",
    measuredCompression: "19,5",
    pressure: "180",
    targetSag: "30"
  }, original);
  assert.equal(await store.update(updated), true);

  const restarted = createMeasurementStore(database);
  await restarted.initialize();
  const saved = restarted.getById("m1");
  assert.equal(saved.suspensionType, "shock");
  assert.equal(saved.measuredCompression, 19.5);
  assert.equal(saved.id, original.id);
  assert.equal(saved.date, original.date);
  assert.equal(saved.bikeNameSnapshot, original.bikeNameSnapshot);
});

test("usunięcie pojedynczego pomiaru nie usuwa pozostałych", async () => {
  const store = createMeasurementStore(createMemoryDatabase());
  await store.initialize();
  await store.add(fixture("m1", "2026-06-20T10:00:00.000Z"));
  await store.add(fixture("m2", "2026-06-21T10:00:00.000Z", 41));
  assert.equal(await store.delete("m1"), true);
  assert.deepEqual(store.getAll().map(item => item.id), ["m2"]);
});

test("usunięcie całej historii czyści trwałą kolekcję", async () => {
  const database = createMemoryDatabase();
  const store = createMeasurementStore(database);
  await store.initialize();
  await store.add(fixture("m1", "2026-06-20T10:00:00.000Z"));
  await store.add(fixture("m2", "2026-06-21T10:00:00.000Z"));
  assert.equal(await store.deleteAll(), true);

  const restarted = createMeasurementStore(database);
  await restarted.initialize();
  assert.deepEqual(restarted.getAll(), []);
});

test("pomiar wybrany z Historii jest przekazywany do szkicu Dziennika jako kopia", () => {
  const draft = createRideDraftStore();
  const measurement = fixture("m1", "2026-06-20T10:00:00.000Z");
  draft.setSourceMeasurement(measurement);
  const saved = draft.getSourceMeasurement();
  saved.measuredCompression = 999;
  assert.equal(draft.getSourceMeasurement().measuredCompression, 40);
  draft.clear();
  assert.equal(draft.getSourceMeasurement(), null);
});
