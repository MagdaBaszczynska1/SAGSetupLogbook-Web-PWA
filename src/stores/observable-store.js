import { cloneValue } from "../utils/clone.js";

export function createObservableCollectionStore({ database, storeName, sortRecords, missingMessages = {} }) {
  let records = [];
  let errorMessage = null;
  let noticeMessage = null;
  let isReady = false;
  const listeners = new Set();

  const sort = values => [...values].sort(sortRecords);

  function snapshot() {
    return Object.freeze({
      records: Object.freeze(records.map(cloneValue)),
      errorMessage,
      noticeMessage,
      isReady
    });
  }

  function notify() {
    const value = snapshot();
    listeners.forEach(listener => listener(value));
  }

  async function initialize() {
    try {
      records = sort(await database.getAll(storeName));
      errorMessage = null;
    } catch (error) {
      records = [];
      errorMessage = error.message || "Nie udało się odczytać danych.";
    }
    isReady = true;
    notify();
  }

  async function add(record) {
    try {
      await database.put(storeName, record);
      records = sort([...records, cloneValue(record)]);
      errorMessage = null;
      noticeMessage = null;
      notify();
      return true;
    } catch (error) {
      errorMessage = error.message || "Nie udało się zapisać danych.";
      notify();
      return false;
    }
  }

  async function update(record) {
    const index = records.findIndex(item => item.id === record.id);
    if (index < 0) {
      errorMessage = missingMessages.update ?? "Nie znaleziono rekordu do edycji.";
      notify();
      return false;
    }

    try {
      await database.put(storeName, record);
      const next = [...records];
      next[index] = cloneValue(record);
      records = sort(next);
      errorMessage = null;
      noticeMessage = null;
      notify();
      return true;
    } catch (error) {
      errorMessage = error.message || "Nie udało się zaktualizować danych.";
      notify();
      return false;
    }
  }

  async function remove(id) {
    const index = records.findIndex(item => item.id === id);
    if (index < 0) {
      errorMessage = missingMessages.delete ?? "Nie znaleziono rekordu do usunięcia.";
      notify();
      return false;
    }

    try {
      await database.delete(storeName, id);
      records = records.filter(item => item.id !== id);
      errorMessage = null;
      noticeMessage = null;
      notify();
      return true;
    } catch (error) {
      errorMessage = error.message || "Nie udało się usunąć danych.";
      notify();
      return false;
    }
  }

  async function removeAll() {
    try {
      await database.clear(storeName);
      records = [];
      errorMessage = null;
      noticeMessage = null;
      notify();
      return true;
    } catch (error) {
      errorMessage = error.message || "Nie udało się usunąć danych.";
      notify();
      return false;
    }
  }

  async function replaceAll(nextRecords) {
    try {
      await database.replaceAll(storeName, nextRecords);
      records = sort(nextRecords.map(cloneValue));
      errorMessage = null;
      noticeMessage = null;
      notify();
      return true;
    } catch (error) {
      errorMessage = error.message || "Nie udało się zastąpić danych.";
      notify();
      return false;
    }
  }

  function setNotice(message) {
    noticeMessage = message;
    notify();
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(snapshot());
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    initialize,
    add,
    update,
    delete: remove,
    deleteAll: removeAll,
    replaceAll,
    setNotice,
    subscribe,
    getAll: () => records.map(cloneValue),
    getById: id => cloneValue(records.find(item => item.id === id) ?? null),
    get errorMessage() { return errorMessage; },
    get noticeMessage() { return noticeMessage; },
    get isReady() { return isReady; }
  });
}
