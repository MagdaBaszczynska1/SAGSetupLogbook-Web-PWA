import { createIndexedDbDatabase } from "../persistence/indexed-db.js";
import { createMemoryDatabase } from "../persistence/memory-database.js";
import { migrateLegacyLocalStorage } from "../persistence/legacy-migration.js";
import { createBikeStore } from "../stores/bike-store.js";
import { createMeasurementStore } from "../stores/measurement-store.js";
import { createRideJournalStore } from "../stores/ride-journal-store.js";
import { createRideDraftStore } from "../stores/ride-draft-store.js";
import { createAppSettingsStore } from "../stores/app-settings-store.js";

function safeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function createDataContext() {
  const localStorage = safeLocalStorage();
  const appSettingsStore = createAppSettingsStore(localStorage, globalThis.document);
  let database = createIndexedDbDatabase();
  let persistenceNotice = null;

  try {
    await database.initialize();
  } catch (error) {
    console.error("IndexedDB jest niedostępne. Uruchomiono tryb sesyjny.", error);
    database = createMemoryDatabase();
    await database.initialize();
    persistenceNotice = "Nie udało się uruchomić trwałej bazy. Dane będą dostępne tylko do zamknięcia tej karty.";
  }

  if (database.isPersistent) {
    try {
      const migration = await migrateLegacyLocalStorage(database, localStorage);
      if (migration?.status === "migrated") {
        persistenceNotice = `Przeniesiono ${migration.bikes} profili i ${migration.measurements} pomiarów ze starszej wersji aplikacji.`;
      }
    } catch (error) {
      console.error("Nie udało się przenieść danych starszej wersji.", error);
      persistenceNotice = "Trwała baza działa, ale nie udało się automatycznie przenieść danych starszej wersji.";
    }
  }

  const bikeStore = createBikeStore(database);
  const measurementStore = createMeasurementStore(database);
  const rideJournalStore = createRideJournalStore(database);
  const rideDraftStore = createRideDraftStore();

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
    rideDraftStore,
    appSettingsStore,
    persistence: Object.freeze({
      kind: database.kind,
      isPersistent: database.isPersistent,
      notice: persistenceNotice
    })
  });
}
