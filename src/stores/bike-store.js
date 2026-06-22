import { getBikeDisplayName } from "../models/bike-profile.js";
import { DATA_STORE } from "../persistence/memory-database.js";
import { createObservableCollectionStore } from "./observable-store.js";

export function createBikeStore(database) {
  const store = createObservableCollectionStore({
    database,
    storeName: DATA_STORE.BIKES,
    sortRecords: (left, right) => getBikeDisplayName(left).localeCompare(getBikeDisplayName(right), "pl", { sensitivity: "base" }),
    missingMessages: {
      update: "Nie znaleziono profilu roweru do edycji.",
      delete: "Nie znaleziono profilu roweru do usunięcia."
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
    get bikes() { return store.getAll(); },
    get errorMessage() { return store.errorMessage; },
    get noticeMessage() { return store.noticeMessage; },
    get isReady() { return store.isReady; }
  });
}
