import { DATA_STORE } from "../persistence/memory-database.js";
import { createObservableCollectionStore } from "./observable-store.js";

export function createRideJournalStore(database) {
  const store = createObservableCollectionStore({
    database,
    storeName: DATA_STORE.RIDES,
    sortRecords: (left, right) => new Date(right.rideDate) - new Date(left.rideDate),
    missingMessages: {
      update: "Nie znaleziono wpisu Dziennika do edycji.",
      delete: "Nie znaleziono wpisu Dziennika do usunięcia."
    }
  });

  return Object.freeze({
    ...store,
    get entries() { return store.getAll(); }
  });
}
