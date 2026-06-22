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
    ...store,
    get bikes() { return store.getAll(); }
  });
}
