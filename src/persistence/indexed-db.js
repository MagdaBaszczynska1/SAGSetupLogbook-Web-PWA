import { DATA_STORE } from "./memory-database.js";
import { cloneValue } from "../utils/clone.js";

const DATABASE_NAME = "sag-setup-logbook-web";
const DATABASE_VERSION = 2;

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("Operacja IndexedDB nie powiodła się.")), { once: true });
  });
}

function transactionResult(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error ?? new Error("Transakcja IndexedDB została przerwana.")), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error ?? new Error("Transakcja IndexedDB nie powiodła się.")), { once: true });
  });
}

function ensureStore(database, name, options) {
  return database.objectStoreNames.contains(name)
    ? null
    : database.createObjectStore(name, options);
}

function ensureIndex(store, name, keyPath, options = {}) {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
}

function migrateSchema(database, transaction, oldVersion) {
  if (oldVersion < 1) {
    ensureStore(database, DATA_STORE.BIKES, { keyPath: "id" });
    ensureStore(database, DATA_STORE.MEASUREMENTS, { keyPath: "id" });
    ensureStore(database, DATA_STORE.RIDES, { keyPath: "id" });
    ensureStore(database, DATA_STORE.META, { keyPath: "key" });
  }

  if (oldVersion < 2) {
    const bikes = transaction.objectStore(DATA_STORE.BIKES);
    const measurements = transaction.objectStore(DATA_STORE.MEASUREMENTS);
    const rides = transaction.objectStore(DATA_STORE.RIDES);

    ensureIndex(bikes, "createdAt", "createdAt");
    ensureIndex(measurements, "date", "date");
    ensureIndex(measurements, "bikeID", "bikeID");
    ensureIndex(measurements, "suspensionType", "suspensionType");
    ensureIndex(rides, "rideDate", "rideDate");
    ensureIndex(rides, "bikeID", "bikeID");
  }
}

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("Ta przeglądarka nie udostępnia IndexedDB."));
  }

  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.addEventListener("upgradeneeded", event => {
      migrateSchema(request.result, request.transaction, event.oldVersion);
    });
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error ?? new Error("Nie udało się otworzyć bazy danych.")), { once: true });
    request.addEventListener("blocked", () => reject(new Error("Aktualizacja bazy danych została zablokowana przez inną otwartą kartę.")), { once: true });
  });
}

export function createIndexedDbDatabase() {
  let database = null;

  async function initialize() {
    if (database) return;
    database = await openDatabase();
    database.addEventListener("versionchange", () => {
      database.close();
      database = null;
    });
  }

  function requireDatabase() {
    if (!database) throw new Error("Baza danych nie została zainicjalizowana.");
    return database;
  }

  async function getAll(storeName) {
    const transaction = requireDatabase().transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    const result = await requestResult(request);
    await transactionResult(transaction);
    return result.map(cloneValue);
  }

  async function put(storeName, record) {
    const transaction = requireDatabase().transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(cloneValue(record));
    await transactionResult(transaction);
    return cloneValue(record);
  }

  async function remove(storeName, key) {
    const transaction = requireDatabase().transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(key);
    await transactionResult(transaction);
  }

  async function clear(storeName) {
    const transaction = requireDatabase().transaction(storeName, "readwrite");
    transaction.objectStore(storeName).clear();
    await transactionResult(transaction);
  }

  async function replaceAll(storeName, records) {
    const transaction = requireDatabase().transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.clear();
    for (const record of records) store.put(cloneValue(record));
    await transactionResult(transaction);
  }

  async function replaceCollections(collections, metaEntries = []) {
    const names = [...new Set([...Object.keys(collections), DATA_STORE.META])];
    const transaction = requireDatabase().transaction(names, "readwrite");

    for (const [name, records] of Object.entries(collections)) {
      const store = transaction.objectStore(name);
      store.clear();
      for (const record of records) store.put(cloneValue(record));
    }

    const meta = transaction.objectStore(DATA_STORE.META);
    for (const entry of metaEntries) meta.put(cloneValue(entry));
    await transactionResult(transaction);
  }

  async function getMeta(key) {
    const transaction = requireDatabase().transaction(DATA_STORE.META, "readonly");
    const result = await requestResult(transaction.objectStore(DATA_STORE.META).get(key));
    await transactionResult(transaction);
    return result ? cloneValue(result) : null;
  }

  async function setMeta(key, value) {
    return put(DATA_STORE.META, { key, value });
  }

  return Object.freeze({
    kind: "indexeddb",
    isPersistent: true,
    initialize,
    getAll,
    put,
    delete: remove,
    clear,
    replaceAll,
    replaceCollections,
    getMeta,
    setMeta,
    close() {
      database?.close();
      database = null;
    }
  });
}
