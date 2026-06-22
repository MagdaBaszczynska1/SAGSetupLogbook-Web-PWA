import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { createMemoryDatabase } from "../../src/persistence/memory-database.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import { createBikeStore } from "../../src/stores/bike-store.js";
import { createMeasurementStore } from "../../src/stores/measurement-store.js";
import { createRideJournalStore } from "../../src/stores/ride-journal-store.js";

function measurementFor(bike) {
  const values = { suspensionTravel: 160, measuredCompression: 40, targetSag: 25 };
  return createSagMeasurement({
    id: "measurement-1",
    date: "2026-06-20T10:00:00.000Z",
    bikeID: bike.id,
    bikeNameSnapshot: `${bike.name} — ${bike.model}`,
    suspensionType: SUSPENSION_TYPE.FORK,
    pressure: 80,
    values,
    result: calculateSag(values)
  });
}

test("profil dodany do magazynu jest dostępny po ponownym utworzeniu store", async () => {
  const database = createMemoryDatabase();
  await database.initialize();
  const first = createBikeStore(database);
  await first.initialize();

  const bike = createBikeProfile({ id: "bike-1", name: "Trek", model: "Slash", forkTravel: 160 });
  assert.equal(await first.add(bike), true);

  const restarted = createBikeStore(database);
  await restarted.initialize();
  assert.equal(restarted.getAll().length, 1);
  assert.equal(restarted.getById("bike-1").name, "Trek");
});

test("profile są sortowane alfabetycznie po nazwie wyświetlanej", async () => {
  const database = createMemoryDatabase();
  const store = createBikeStore(database);
  await store.initialize();
  await store.add(createBikeProfile({ id: "z", name: "Żbik" }));
  await store.add(createBikeProfile({ id: "a", name: "Alfa" }));
  await store.add(createBikeProfile({ id: "b", name: "Beta" }));
  assert.deepEqual(store.getAll().map(bike => bike.name), ["Alfa", "Beta", "Żbik"]);
});

test("edycja profilu zachowuje liczbę rekordów i aktualizuje dane", async () => {
  const database = createMemoryDatabase();
  const store = createBikeStore(database);
  await store.initialize();
  const original = createBikeProfile({ id: "bike-1", name: "Stary", createdAt: "2026-01-01T00:00:00.000Z" });
  await store.add(original);
  const updated = createBikeProfile({ ...original, name: "Nowy", forkTravel: 170 });
  assert.equal(await store.update(updated), true);
  assert.equal(store.getAll().length, 1);
  assert.equal(store.getById("bike-1").name, "Nowy");
  assert.equal(store.getById("bike-1").forkTravel, 170);
});

test("usunięcie profilu nie usuwa historycznego pomiaru", async () => {
  const database = createMemoryDatabase();
  const bikes = createBikeStore(database);
  const measurements = createMeasurementStore(database);
  await Promise.all([bikes.initialize(), measurements.initialize()]);

  const bike = createBikeProfile({ id: "bike-1", name: "Trek", model: "Slash" });
  await bikes.add(bike);
  await measurements.add(measurementFor(bike));
  assert.equal(await bikes.delete("bike-1"), true);

  assert.equal(bikes.getAll().length, 0);
  assert.equal(measurements.getAll().length, 1);
  assert.equal(measurements.getAll()[0].bikeNameSnapshot, "Trek — Slash");
});

test("deleteAll usuwa tylko wybraną kolekcję", async () => {
  const database = createMemoryDatabase();
  const bikes = createBikeStore(database);
  const measurements = createMeasurementStore(database);
  const rides = createRideJournalStore(database);
  await Promise.all([bikes.initialize(), measurements.initialize(), rides.initialize()]);

  const bike = createBikeProfile({ id: "bike-1", name: "Rower" });
  await bikes.add(bike);
  await measurements.add(measurementFor(bike));
  await bikes.deleteAll();

  assert.equal(bikes.getAll().length, 0);
  assert.equal(measurements.getAll().length, 1);
  assert.equal(rides.getAll().length, 0);
});

test("błąd zapisu nie zmienia stanu store", async () => {
  const database = {
    async getAll() { return []; },
    async put() { throw new Error("Brak miejsca na urządzeniu"); },
    async delete() {},
    async clear() {},
    async replaceAll() {}
  };
  const store = createBikeStore(database);
  await store.initialize();
  const result = await store.add(createBikeProfile({ name: "Rower" }));
  assert.equal(result, false);
  assert.equal(store.getAll().length, 0);
  assert.match(store.errorMessage, /Brak miejsca/);
});

test("próba edycji lub usunięcia nieistniejącego profilu zwraca błąd", async () => {
  const store = createBikeStore(createMemoryDatabase());
  await store.initialize();
  assert.equal(await store.update(createBikeProfile({ id: "missing", name: "Rower" })), false);
  assert.match(store.errorMessage, /Nie znaleziono profilu/);
  assert.equal(await store.delete("missing"), false);
  assert.match(store.errorMessage, /Nie znaleziono profilu/);
});
