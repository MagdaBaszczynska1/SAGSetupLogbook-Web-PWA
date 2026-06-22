import { createIndexedDbDatabase } from "../persistence/indexed-db.js";
import { createMemoryDatabase } from "../persistence/memory-database.js";
import { migrateLegacyLocalStorage } from "../persistence/legacy-migration.js";
import { createBikeStore } from "../stores/bike-store.js";
import { createMeasurementStore } from "../stores/measurement-store.js";
import { createRideJournalStore } from "../stores/ride-journal-store.js";

export async function createDataContext() {
  let database = createIndexedDbDatabase();
  let persistenceNotice = null;

  try {
    await database.initialize();
    const migration = await migrateLegacyLocalStorage(database);
    if (migration?.status === "migrated") {
      persistenceNotice = `Przeniesiono ${migration.bikes} profili i ${migration.measurements} pomiarów ze starszej wersji aplikacji.`;
    }
  } catch (error) {
    console.error("IndexedDB jest niedostępne. Uruchomiono tryb sesyjny.", error);
    database = createMemoryDatabase();
    await database.initialize();
    persistenceNotice = "Nie udało się uruchomić trwałej bazy. Dane będą dostępne tylko do zamknięcia tej karty.";
  }

  const bikeStore = createBikeStore(database);
  const measurementStore = createMeasurementStore(database);
  const rideJournalStore = createRideJournalStore(database);

  await Promise.all([
    bikeStore.initialize(),
    measurementStore.initialize(),
    rideJournalStore.initialize()
  ]);

  if (persistenceNotice) {
    bikeStore.setNotice(persistenceNotice);
    measurementStore.setNotice(persistenceNotice);
    rideJournalStore.setNotice(persistenceNotice);
  }

  return Object.freeze({
    database,
    bikeStore,
    measurementStore,
    rideJournalStore,
    persistence: Object.freeze({
      kind: database.kind,
      isPersistent: database.isPersistent,
      notice: persistenceNotice
    })
  });
}
