import { cloneValue } from "../utils/clone.js";

export function createRideDraftStore() {
  let sourceMeasurement = null;
  const listeners = new Set();

  function notify() {
    const value = cloneValue(sourceMeasurement);
    listeners.forEach(listener => listener(value));
  }

  return Object.freeze({
    setSourceMeasurement(measurement) {
      sourceMeasurement = cloneValue(measurement);
      notify();
    },
    clear() {
      sourceMeasurement = null;
      notify();
    },
    getSourceMeasurement() {
      return cloneValue(sourceMeasurement);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(cloneValue(sourceMeasurement));
      return () => listeners.delete(listener);
    }
  });
}
