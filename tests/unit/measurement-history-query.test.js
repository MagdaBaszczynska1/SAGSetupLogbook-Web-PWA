import test from "node:test";
import assert from "node:assert/strict";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import {
  HISTORY_BIKE_FILTER,
  HISTORY_SORT_ORDER,
  HISTORY_SUSPENSION_FILTER,
  createMeasurementHistoryQuery,
  getMeasurementBikeOptions
} from "../../src/services/measurement-history-query.js";

function measurement({ id, date, bikeID = null, bikeNameSnapshot = null, suspensionType = SUSPENSION_TYPE.FORK }) {
  const values = suspensionType === SUSPENSION_TYPE.FORK
    ? { suspensionTravel: 160, measuredCompression: 40, targetSag: 25 }
    : { suspensionTravel: 65, measuredCompression: 19.5, targetSag: 30 };
  return createSagMeasurement({
    id,
    date,
    bikeID,
    bikeNameSnapshot,
    suspensionType,
    values,
    result: calculateSag(values)
  });
}

const fixtures = [
  measurement({ id: "new-shock", date: "2026-06-20T12:00:00.000Z", bikeID: "bike-a", bikeNameSnapshot: "Rower A", suspensionType: SUSPENSION_TYPE.SHOCK }),
  measurement({ id: "old-fork", date: "2026-06-18T12:00:00.000Z", bikeID: "bike-a", bikeNameSnapshot: "Rower A" }),
  measurement({ id: "other-bike", date: "2026-06-17T12:00:00.000Z", bikeID: "bike-b", bikeNameSnapshot: "Rower B" }),
  measurement({ id: "without-profile", date: "2026-06-19T12:00:00.000Z", bikeNameSnapshot: "Dawny rower" })
];

test("filtruje jednocześnie po rowerze i typie zawieszenia", () => {
  const query = createMeasurementHistoryQuery({
    measurements: fixtures,
    bikeFilter: "bike-a",
    suspensionFilter: HISTORY_SUSPENSION_FILTER.FORK,
    sortOrder: HISTORY_SORT_ORDER.NEWEST_FIRST
  });
  assert.deepEqual(query.results.map(item => item.id), ["old-fork"]);
});

test("sortuje od najnowszych i od najstarszych", () => {
  const newest = createMeasurementHistoryQuery({ measurements: fixtures });
  assert.deepEqual(newest.results.map(item => item.id), ["new-shock", "without-profile", "old-fork", "other-bike"]);

  const oldest = createMeasurementHistoryQuery({ measurements: fixtures, sortOrder: HISTORY_SORT_ORDER.OLDEST_FIRST });
  assert.deepEqual(oldest.results.map(item => item.id), ["other-bike", "old-fork", "without-profile", "new-shock"]);
});

test("obsługuje osobny filtr Bez profilu", () => {
  const query = createMeasurementHistoryQuery({
    measurements: fixtures,
    bikeFilter: HISTORY_BIKE_FILTER.WITHOUT_PROFILE
  });
  assert.equal(query.hasMeasurementsWithoutProfile, true);
  assert.deepEqual(query.results.map(item => item.id), ["without-profile"]);
});

test("buduje alfabetyczne opcje rowerów z historycznych snapshotów", () => {
  const options = getMeasurementBikeOptions([
    measurement({ id: "z", date: "2026-06-01T00:00:00.000Z", bikeID: "z", bikeNameSnapshot: "Żbik" }),
    measurement({ id: "a", date: "2026-06-02T00:00:00.000Z", bikeID: "a", bikeNameSnapshot: "Alfa" }),
    measurement({ id: "a2", date: "2026-06-03T00:00:00.000Z", bikeID: "a", bikeNameSnapshot: "Nowsza nazwa" })
  ]);
  assert.deepEqual(options, [
    { id: "a", name: "Alfa" },
    { id: "z", name: "Żbik" }
  ]);
});

test("brak nazwy snapshotu tworzy opcję Nieznany rower", () => {
  const options = getMeasurementBikeOptions([
    measurement({ id: "unknown", date: "2026-06-01T00:00:00.000Z", bikeID: "bike-x", bikeNameSnapshot: "  " })
  ]);
  assert.deepEqual(options, [{ id: "bike-x", name: "Nieznany rower" }]);
});

test("rozpoznaje aktywne filtry i nieprawidłowy filtr roweru", () => {
  const query = createMeasurementHistoryQuery({
    measurements: fixtures,
    bikeFilter: "missing-bike",
    suspensionFilter: HISTORY_SUSPENSION_FILTER.SHOCK
  });
  assert.equal(query.hasActiveFilters, true);
  assert.equal(query.isBikeFilterValid, false);
  assert.equal(query.results.length, 0);
});

test("brak filtrów jest prawidłowy także dla pustej historii", () => {
  const query = createMeasurementHistoryQuery({ measurements: [] });
  assert.equal(query.isBikeFilterValid, true);
  assert.equal(query.hasActiveFilters, false);
  assert.deepEqual(query.results, []);
  assert.deepEqual(query.bikeOptions, []);
});
