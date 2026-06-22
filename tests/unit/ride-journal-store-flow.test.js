import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryDatabase } from "../../src/persistence/memory-database.js";
import { createRideJournalStore } from "../../src/stores/ride-journal-store.js";
import {
  TRAIL_CONDITION,
  createRideJournalEntry
} from "../../src/models/ride-journal-entry.js";

function entry(id, rideDate, rating = 3) {
  return createRideJournalEntry({
    id,
    createdAt: rideDate,
    rideDate,
    bikeID: "bike-1",
    bikeNameSnapshot: "Rower historyczny",
    bikeProfileSnapshot: {
      bikeName: "Rower",
      bikeModel: "Historyczny",
      forkTravel: 160,
      forkTargetSag: 25,
      forkPressure: 80,
      shockTravel: null,
      shockTargetSag: null,
      shockPressure: null
    },
    measurementSnapshots: [],
    routeName: `Trasa ${id}`,
    conditions: TRAIL_CONDITION.DRY,
    rating
  });
}

test("wpis pozostaje po ponownym utworzeniu magazynu", async () => {
  const database = createMemoryDatabase();
  const first = createRideJournalStore(database);
  await first.initialize();
  await first.add(entry("e1", "2026-06-20T12:00:00.000Z"));

  const restarted = createRideJournalStore(database);
  await restarted.initialize();
  assert.equal(restarted.getAll().length, 1);
  assert.equal(restarted.getById("e1").routeName, "Trasa e1");
});

test("wpisy są sortowane od najnowszej jazdy", async () => {
  const store = createRideJournalStore(createMemoryDatabase());
  await store.initialize();
  await store.add(entry("old", "2026-06-18T12:00:00.000Z"));
  await store.add(entry("new", "2026-06-20T12:00:00.000Z"));
  assert.deepEqual(store.getAll().map(item => item.id), ["new", "old"]);
});

test("edycja zachowuje liczbę rekordów", async () => {
  const store = createRideJournalStore(createMemoryDatabase());
  await store.initialize();
  const original = entry("e1", "2026-06-20T12:00:00.000Z");
  await store.add(original);
  const updated = createRideJournalEntry({ ...original, routeName: "Nowa trasa", rating: 5 });
  assert.equal(await store.update(updated), true);
  assert.equal(store.getAll().length, 1);
  assert.equal(store.getById("e1").routeName, "Nowa trasa");
  assert.equal(store.getById("e1").rating, 5);
});

test("usuwanie pojedyncze i całego Dziennika jest trwałe", async () => {
  const database = createMemoryDatabase();
  const store = createRideJournalStore(database);
  await store.initialize();
  await store.add(entry("e1", "2026-06-20T12:00:00.000Z"));
  await store.add(entry("e2", "2026-06-21T12:00:00.000Z"));
  await store.delete("e1");
  assert.deepEqual(store.getAll().map(item => item.id), ["e2"]);
  await store.deleteAll();

  const restarted = createRideJournalStore(database);
  await restarted.initialize();
  assert.deepEqual(restarted.getAll(), []);
});

test("zwrócone dane są kopiami i nie pozwalają zmienić magazynu bokiem", async () => {
  const store = createRideJournalStore(createMemoryDatabase());
  await store.initialize();
  await store.add(entry("e1", "2026-06-20T12:00:00.000Z"));
  const value = store.getById("e1");
  value.routeName = "Zmieniona poza store";
  value.bikeProfileSnapshot.forkTravel = 999;
  assert.equal(store.getById("e1").routeName, "Trasa e1");
  assert.equal(store.getById("e1").bikeProfileSnapshot.forkTravel, 160);
});
