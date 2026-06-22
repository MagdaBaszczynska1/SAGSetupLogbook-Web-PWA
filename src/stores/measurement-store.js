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
    initialize: store.initialize,
    add: store.add,
    update: store.update,
    delete: store.delete,
    deleteAll: store.deleteAll,
    replaceAll: store.replaceAll,
    setNotice: store.setNotice,
    subscribe: store.subscribe,
    getAll: store.getAll,
    getById: store.getById,
    get measurements() { return store.getAll(); },
    get errorMessage() { return store.errorMessage; },
    get noticeMessage() { return store.noticeMessage; },
    get isReady() { return store.isReady; }
  });
}
