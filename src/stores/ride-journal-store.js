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
    get entries() { return store.getAll(); },
    get errorMessage() { return store.errorMessage; },
    get noticeMessage() { return store.noticeMessage; },
    get isReady() { return store.isReady; }
  });
}
