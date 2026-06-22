import test from "node:test";
import assert from "node:assert/strict";
import { TRAIL_CONDITION, createRideJournalEntry } from "../../src/models/ride-journal-entry.js";
import {
  JOURNAL_SORT_ORDER,
  createRideJournalQuery,
  getRideJournalBikeOptions
} from "../../src/services/ride-journal-query.js";

function entry({ id, routeName, rideDate, bikeID, bikeNameSnapshot, conditions, rating, notes = "" }) {
  return createRideJournalEntry({
    id,
    createdAt: rideDate,
    rideDate,
    bikeID,
    bikeNameSnapshot,
    routeName,
    conditions,
    rating,
    notes
  });
}

const fixtures = [
  entry({ id: "a", routeName: "Leśna pętla", rideDate: "2026-06-20T12:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Trek Slash", conditions: TRAIL_CONDITION.DRY, rating: 4, notes: "Nowe ustawienie widelca" }),
  entry({ id: "b", routeName: "Kamienisty zjazd", rideDate: "2026-06-18T12:00:00.000Z", bikeID: "bike-2", bikeNameSnapshot: "Hardtail", conditions: TRAIL_CONDITION.MUDDY, rating: 5, notes: "Bardzo ślisko" }),
  entry({ id: "c", routeName: "Park", rideDate: "2026-06-19T12:00:00.000Z", bikeID: "bike-1", bikeNameSnapshot: "Trek Slash", conditions: TRAIL_CONDITION.WET, rating: 3 })
];

test("wyszukuje po trasie, rowerze, notatce i nazwie warunków", () => {
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, searchText: "leśna" }).results.map(item => item.id), ["a"]);
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, searchText: "hardtail" }).results.map(item => item.id), ["b"]);
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, searchText: "ślisko" }).results.map(item => item.id), ["b"]);
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, searchText: "mokro" }).results.map(item => item.id), ["c"]);
});

test("wyszukiwanie ignoruje wielkość liter i białe znaki", () => {
  const result = createRideJournalQuery({ entries: fixtures, searchText: "  TREK  " });
  assert.deepEqual(result.results.map(item => item.id), ["a", "c"]);
});

test("filtruje jednocześnie według roweru i warunków", () => {
  const result = createRideJournalQuery({ entries: fixtures, bikeFilter: "bike-1", conditionFilter: TRAIL_CONDITION.WET });
  assert.deepEqual(result.results.map(item => item.id), ["c"]);
});

test("sortuje od najnowszych, najstarszych i najwyżej ocenionych", () => {
  assert.deepEqual(createRideJournalQuery({ entries: fixtures }).results.map(item => item.id), ["a", "c", "b"]);
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, sortOrder: JOURNAL_SORT_ORDER.OLDEST_FIRST }).results.map(item => item.id), ["b", "c", "a"]);
  assert.deepEqual(createRideJournalQuery({ entries: fixtures, sortOrder: JOURNAL_SORT_ORDER.HIGHEST_RATED }).results.map(item => item.id), ["b", "a", "c"]);
});

test("buduje alfabetyczne opcje rowerów z historycznych wpisów", () => {
  assert.deepEqual(getRideJournalBikeOptions(fixtures), [
    { id: "bike-2", name: "Hardtail" },
    { id: "bike-1", name: "Trek Slash" }
  ]);
});

test("liczy aktywne wyszukiwanie i filtry", () => {
  const result = createRideJournalQuery({
    entries: fixtures,
    searchText: "park",
    bikeFilter: "bike-1",
    conditionFilter: TRAIL_CONDITION.WET
  });
  assert.equal(result.activeFilterCount, 3);
  assert.equal(result.hasActiveFilters, true);
});

test("rozpoznaje filtr usuniętego roweru jako nieprawidłowy", () => {
  const result = createRideJournalQuery({ entries: fixtures, bikeFilter: "missing" });
  assert.equal(result.isBikeFilterValid, false);
  assert.deepEqual(result.results, []);
});

test("pusty Dziennik nie zgłasza aktywnych filtrów", () => {
  const result = createRideJournalQuery({ entries: [] });
  assert.equal(result.activeFilterCount, 0);
  assert.equal(result.isBikeFilterValid, true);
  assert.deepEqual(result.results, []);
});
