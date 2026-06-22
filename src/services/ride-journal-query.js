import { TRAIL_CONDITION_CONTENT } from "../models/ride-journal-entry.js";

export const JOURNAL_BIKE_FILTER = Object.freeze({ ALL: "all" });
export const JOURNAL_CONDITION_FILTER = Object.freeze({ ALL: "all" });
export const JOURNAL_SORT_ORDER = Object.freeze({
  NEWEST_FIRST: "newestFirst",
  OLDEST_FIRST: "oldestFirst",
  HIGHEST_RATED: "highestRated"
});

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("pl-PL");
}

function compareEntries(left, right, sortOrder) {
  if (sortOrder === JOURNAL_SORT_ORDER.HIGHEST_RATED) {
    const ratingDifference = Number(right.rating) - Number(left.rating);
    if (ratingDifference !== 0) return ratingDifference;
  }
  const dateDifference = new Date(right.rideDate).getTime() - new Date(left.rideDate).getTime();
  if (dateDifference !== 0) return sortOrder === JOURNAL_SORT_ORDER.OLDEST_FIRST ? -dateDifference : dateDifference;
  return String(left.id).localeCompare(String(right.id));
}

export function getRideJournalBikeOptions(entries) {
  const names = new Map();
  for (const entry of entries ?? []) {
    const id = String(entry.bikeID);
    if (!names.has(id)) names.set(id, String(entry.bikeNameSnapshot || "Nieznany rower"));
  }
  return [...names.entries()]
    .map(([id, name]) => Object.freeze({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "pl", { sensitivity: "base" }));
}

export function createRideJournalQuery({
  entries,
  searchText = "",
  bikeFilter = JOURNAL_BIKE_FILTER.ALL,
  conditionFilter = JOURNAL_CONDITION_FILTER.ALL,
  sortOrder = JOURNAL_SORT_ORDER.NEWEST_FIRST
}) {
  const source = Array.isArray(entries) ? entries : [];
  const query = normalize(searchText);
  const bikeOptions = getRideJournalBikeOptions(source);
  const bikeFilterValid = bikeFilter === JOURNAL_BIKE_FILTER.ALL || bikeOptions.some(option => option.id === bikeFilter);

  const results = source
    .filter(entry => bikeFilter === JOURNAL_BIKE_FILTER.ALL || String(entry.bikeID) === String(bikeFilter))
    .filter(entry => conditionFilter === JOURNAL_CONDITION_FILTER.ALL || entry.conditions === conditionFilter)
    .filter(entry => {
      if (!query) return true;
      const condition = TRAIL_CONDITION_CONTENT[entry.conditions]?.title ?? "";
      return [entry.routeName, entry.bikeNameSnapshot, entry.notes, condition]
        .some(value => normalize(value).includes(query));
    })
    .sort((left, right) => compareEntries(left, right, sortOrder));

  const activeFilterCount = Number(Boolean(query))
    + Number(bikeFilter !== JOURNAL_BIKE_FILTER.ALL)
    + Number(conditionFilter !== JOURNAL_CONDITION_FILTER.ALL);

  return Object.freeze({
    results: Object.freeze([...results]),
    bikeOptions: Object.freeze(bikeOptions),
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
    isBikeFilterValid: bikeFilterValid
  });
}
