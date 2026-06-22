import test from "node:test";
import assert from "node:assert/strict";
import { migrateLegacyLocalStorage } from "../../src/persistence/legacy-migration.js";
import { createMemoryDatabase, DATA_STORE } from "../../src/persistence/memory-database.js";

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    removeItem(key) { values.delete(key); },
    has(key) { return values.has(key); }
  };
}

test("migracja przenosi profile i pomiary starego prototypu", async () => {
  const database = createMemoryDatabase();
  const storage = createStorage({
    "sagSetupLogbookWeb.v2": JSON.stringify({
      bikes: [{ id: "bike-1", name: "Trek Slash", forkTravel: 160, shockTravel: 65 }],
      measurements: [{
        id: "measurement-1",
        date: "2026-06-10T10:00:00.000Z",
        bikeId: "bike-1",
        bikeName: "Trek Slash",
        suspensionType: "fork",
        travel: 160,
        compression: 40,
        target: 25,
        sag: 25,
        pressure: 80
      }]
    })
  });

  const result = await migrateLegacyLocalStorage(database, storage);
  assert.equal(result.status, "migrated");
  assert.equal(result.bikes, 1);
  assert.equal(result.measurements, 1);

  const bikes = await database.getAll(DATA_STORE.BIKES);
  const measurements = await database.getAll(DATA_STORE.MEASUREMENTS);
  assert.equal(bikes[0].forkTravel, 160);
  assert.equal(measurements[0].currentSag, 25);
  assert.equal(measurements[0].targetCompression, 40);
  assert.equal(storage.has("sagSetupLogbookWeb.v2"), false);
});

test("migracja nie nadpisuje istniejących danych", async () => {
  const database = createMemoryDatabase({
    bikes: [{ id: "existing", name: "Istniejący", model: "", createdAt: "2026-01-01T00:00:00.000Z" }]
  });
  const storage = createStorage({
    "sagSetupLogbookWeb.v2": JSON.stringify({ bikes: [{ id: "old", name: "Stary" }], measurements: [] })
  });

  const result = await migrateLegacyLocalStorage(database, storage);
  assert.equal(result, null);
  const bikes = await database.getAll(DATA_STORE.BIKES);
  assert.deepEqual(bikes.map(bike => bike.id), ["existing"]);
  assert.equal(storage.has("sagSetupLogbookWeb.v2"), true);
});

test("migracja jest wykonywana tylko raz", async () => {
  const database = createMemoryDatabase();
  const storage = createStorage({
    "sagSetupLogbookWeb.v1": JSON.stringify({ bikes: [{ id: "bike-1", name: "Rower" }], measurements: [] })
  });
  await migrateLegacyLocalStorage(database, storage);
  const second = await migrateLegacyLocalStorage(database, storage);
  assert.equal(second.status, "migrated");
  assert.equal((await database.getAll(DATA_STORE.BIKES)).length, 1);
});

test("niepoprawny JSON jest pomijany bez utraty działania", async () => {
  const database = createMemoryDatabase();
  const storage = createStorage({ "sagSetupLogbookWeb.v2": "{niepoprawny" });
  const result = await migrateLegacyLocalStorage(database, storage);
  assert.equal(result, null);
  assert.equal((await database.getAll(DATA_STORE.BIKES)).length, 0);
});
