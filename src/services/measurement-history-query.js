export const HISTORY_BIKE_FILTER = Object.freeze({
  ALL: "all",
  WITHOUT_PROFILE: "withoutProfile"
});

export const HISTORY_SUSPENSION_FILTER = Object.freeze({
  ALL: "all",
  FORK: "fork",
  SHOCK: "shock"
});

export const HISTORY_SORT_ORDER = Object.freeze({
  NEWEST_FIRST: "newestFirst",
  OLDEST_FIRST: "oldestFirst"
});

function normalizedSnapshotName(measurement) {
  const name = String(measurement.bikeNameSnapshot ?? "").trim();
  return name || "Nieznany rower";
}

function compareDates(left, right, sortOrder) {
  const leftTime = new Date(left.date).getTime();
  const rightTime = new Date(right.date).getTime();
  const dateDifference = sortOrder === HISTORY_SORT_ORDER.OLDEST_FIRST
    ? leftTime - rightTime
    : rightTime - leftTime;
  if (dateDifference !== 0) return dateDifference;
  return String(left.id).localeCompare(String(right.id));
}

export function getMeasurementBikeOptions(measurements) {
  const namesByID = new Map();
  for (const measurement of measurements) {
    if (measurement.bikeID === null || measurement.bikeID === undefined) continue;
    const id = String(measurement.bikeID);
    if (!namesByID.has(id)) namesByID.set(id, normalizedSnapshotName(measurement));
  }

  return [...namesByID.entries()]
    .map(([id, name]) => Object.freeze({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "pl", { sensitivity: "base" }));
}

export function createMeasurementHistoryQuery({
  measurements,
  bikeFilter = HISTORY_BIKE_FILTER.ALL,
  suspensionFilter = HISTORY_SUSPENSION_FILTER.ALL,
  sortOrder = HISTORY_SORT_ORDER.NEWEST_FIRST
}) {
  const source = Array.isArray(measurements) ? measurements : [];
  const bikeOptions = getMeasurementBikeOptions(source);
  const hasMeasurementsWithoutProfile = source.some(measurement => measurement.bikeID === null || measurement.bikeID === undefined);

  const isBikeFilterValid = bikeFilter === HISTORY_BIKE_FILTER.ALL
    || bikeFilter === HISTORY_BIKE_FILTER.WITHOUT_PROFILE && hasMeasurementsWithoutProfile
    || bikeOptions.some(option => option.id === bikeFilter);

  const results = source
    .filter(measurement => {
      if (bikeFilter === HISTORY_BIKE_FILTER.ALL) return true;
      if (bikeFilter === HISTORY_BIKE_FILTER.WITHOUT_PROFILE) {
        return measurement.bikeID === null || measurement.bikeID === undefined;
      }
      return String(measurement.bikeID) === String(bikeFilter);
    })
    .filter(measurement => {
      if (suspensionFilter === HISTORY_SUSPENSION_FILTER.ALL) return true;
      return measurement.suspensionType === suspensionFilter;
    })
    .sort((left, right) => compareDates(left, right, sortOrder));

  return Object.freeze({
    results: Object.freeze([...results]),
    bikeOptions: Object.freeze(bikeOptions),
    hasMeasurementsWithoutProfile,
    hasActiveFilters: bikeFilter !== HISTORY_BIKE_FILTER.ALL || suspensionFilter !== HISTORY_SUSPENSION_FILTER.ALL,
    isBikeFilterValid
  });
}
