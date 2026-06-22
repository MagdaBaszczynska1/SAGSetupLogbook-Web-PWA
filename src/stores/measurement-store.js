import { DATA_STORE } from "../persistence/memory-database.js";
import { createObservableCollectionStore } from "./observable-store.js";

export function createMeasurementStore(database) {
  const store = createObservableCollectionStore({
    database,
    storeName: DATA_STORE.MEASUREMENTS,
    sortRecords: (left, right) => new Date(right.date) - new Date(left.date),
    missingMessages: {
      update: "Nie znaleziono pomiaru do edycji.",
      delete: "Nie znaleziono pomiaru do usunięcia."
    }
  });

  return Object.freeze({
    ...store,
    get measurements() { return store.getAll(); }
  });
}
