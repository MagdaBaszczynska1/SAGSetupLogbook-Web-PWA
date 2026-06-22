import { cloneValue } from "../utils/clone.js";

export const DATA_STORE = Object.freeze({
  BIKES: "bikes",
  MEASUREMENTS: "measurements",
  RIDES: "rides",
  META: "meta"
});

export function createMemoryDatabase(initialData = {}) {
  const collections = new Map();
  for (const name of Object.values(DATA_STORE)) {
    const source = initialData[name] ?? [];
    collections.set(name, new Map(source.map(record => [record.id ?? record.key, cloneValue(record)])));
  }

  const collection = name => {
    const value = collections.get(name);
    if (!value) throw new Error(`Nieznany magazyn danych: ${name}`);
    return value;
  };

  return Object.freeze({
    kind: "memory",
    isPersistent: false,
    async initialize() {},
    async getAll(name) {
      return [...collection(name).values()].map(cloneValue);
    },
    async put(name, record) {
      const key = record.id ?? record.key;
      if (!key) throw new Error("Rekord nie ma identyfikatora.");
      collection(name).set(key, cloneValue(record));
      return cloneValue(record);
    },
    async delete(name, key) {
      collection(name).delete(key);
    },
    async clear(name) {
      collection(name).clear();
    },
    async replaceAll(name, records) {
      const next = new Map(records.map(record => [record.id ?? record.key, cloneValue(record)]));
      collections.set(name, next);
    },
    async replaceCollections(collectionValues, metaEntries = []) {
      const backup = new Map([...collections].map(([name, records]) => [name, new Map(records)]));
      try {
        for (const [name, records] of Object.entries(collectionValues)) {
          collections.set(name, new Map(records.map(record => [record.id ?? record.key, cloneValue(record)])));
        }
        const meta = collection(DATA_STORE.META);
        for (const entry of metaEntries) meta.set(entry.key, cloneValue(entry));
      } catch (error) {
        collections.clear();
        for (const [name, records] of backup) collections.set(name, records);
        throw error;
      }
    },
    async getMeta(key) {
      return cloneValue(collection(DATA_STORE.META).get(key) ?? null);
    },
    async setMeta(key, value) {
      collection(DATA_STORE.META).set(key, cloneValue({ key, value }));
    },
    close() {}
  });
}
