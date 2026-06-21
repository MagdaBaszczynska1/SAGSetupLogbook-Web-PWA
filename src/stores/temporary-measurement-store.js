export function createTemporaryMeasurementStore() {
  const measurements = [];
  let errorMessage = null;

  function add(measurement) {
    try {
      measurements.unshift(structuredClone(measurement));
      errorMessage = null;
      return true;
    } catch (error) {
      console.error("Nie udało się zapisać pomiaru w pamięci sesji.", error);
      errorMessage = "Nie udało się zapisać pomiaru w pamięci sesji.";
      return false;
    }
  }

  function getAll() {
    return measurements.map(measurement => structuredClone(measurement));
  }

  function clear() {
    measurements.length = 0;
    errorMessage = null;
  }

  return Object.freeze({
    add,
    getAll,
    clear,
    get errorMessage() {
      return errorMessage;
    }
  });
}

export const temporaryMeasurementStore = createTemporaryMeasurementStore();
