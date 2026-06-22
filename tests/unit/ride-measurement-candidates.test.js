import test from "node:test";
import assert from "node:assert/strict";
import { createSagMeasurement } from "../../src/models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../src/models/suspension-type.js";
import { calculateSag } from "../../src/services/sag-calculator.js";
import {
  RIDE_MEASUREMENT_GROUP,
  getRideMeasurementCandidates,
  measurementsForSelection,
  toggleRideMeasurementSelection
} from "../../src/services/ride-measurement-candidates.js";

function measurement({ id, date, bikeID = "bike-1", type = SUSPENSION_TYPE.FORK, compression = 40 }) {
  const travel = type === SUSPENSION_TYPE.FORK ? 160 : 65;
  const targetSag = type === SUSPENSION_TYPE.FORK ? 25 : 30;
  const values = { suspensionTravel: travel, measuredCompression: compression, targetSag };
  return createSagMeasurement({
    id,
    date,
    bikeID,
    bikeNameSnapshot: bikeID ? "Rower" : null,
    suspensionType: type,
    values,
    result: calculateSag(values)
  });
}

const rideDate = "2026-06-20T12:00:00.000Z";

const fixtures = [
  measurement({ id: "fork-new", date: "2026-06-20T10:00:00.000Z" }),
  measurement({ id: "fork-old", date: "2026-06-20T08:00:00.000Z", compression: 38 }),
  measurement({ id: "shock-recent", date: "2026-06-18T10:00:00.000Z", type: SUSPENSION_TYPE.SHOCK, compression: 19.5 }),
  measurement({ id: "shock-too-old", date: "2026-06-10T10:00:00.000Z", type: SUSPENSION_TYPE.SHOCK }),
  measurement({ id: "unassigned", date: "2026-06-20T09:00:00.000Z", bikeID: null }),
  measurement({ id: "other-bike", date: "2026-06-20T11:00:00.000Z", bikeID: "bike-2" })
];

test("grupuje pomiary tego samego dnia, ostatni brakujący typ i pomiary bez profilu", () => {
  const result = getRideMeasurementCandidates({ measurements: fixtures, selectedBikeID: "bike-1", rideDate });
  assert.deepEqual(result.groups.map(group => group.id), [
    RIDE_MEASUREMENT_GROUP.SAME_DAY_BIKE,
    RIDE_MEASUREMENT_GROUP.RECENT_BIKE,
    RIDE_MEASUREMENT_GROUP.SAME_DAY_UNASSIGNED
  ]);
  assert.deepEqual(result.groups[0].measurements.map(item => item.id), ["fork-new", "fork-old"]);
  assert.deepEqual(result.groups[1].measurements.map(item => item.id), ["shock-recent"]);
  assert.deepEqual(result.groups[2].measurements.map(item => item.id), ["unassigned"]);
});

test("automatycznie sugeruje wyłącznie najnowszy pomiar każdego typu z dnia jazdy", () => {
  const result = getRideMeasurementCandidates({ measurements: fixtures, selectedBikeID: "bike-1", rideDate });
  assert.deepEqual(result.suggestedIDs, ["fork-new"]);
});

test("nie proponuje pomiaru starszego niż siedem dni", () => {
  const result = getRideMeasurementCandidates({
    measurements: [measurement({ id: "old", date: "2026-06-12T10:00:00.000Z", type: SUSPENSION_TYPE.SHOCK })],
    selectedBikeID: "bike-1",
    rideDate
  });
  assert.deepEqual(result.groups, []);
});

test("pomiar dokładnie sprzed siedmiu dni jest kandydatem", () => {
  const result = getRideMeasurementCandidates({
    measurements: [measurement({ id: "seven", date: "2026-06-13T10:00:00.000Z", type: SUSPENSION_TYPE.SHOCK })],
    selectedBikeID: "bike-1",
    rideDate
  });
  assert.deepEqual(result.groups[0].measurements.map(item => item.id), ["seven"]);
});

test("brak roweru albo nieprawidłowa data zwraca pustą listę", () => {
  assert.deepEqual(getRideMeasurementCandidates({ measurements: fixtures, selectedBikeID: null, rideDate }).groups, []);
  assert.deepEqual(getRideMeasurementCandidates({ measurements: fixtures, selectedBikeID: "bike-1", rideDate: "błąd" }).groups, []);
});

test("wybranie drugiego pomiaru tego samego typu zastępuje poprzedni", () => {
  const selected = toggleRideMeasurementSelection({
    selectedIDs: ["fork-new", "shock-recent"],
    measurement: fixtures.find(item => item.id === "fork-old"),
    candidates: fixtures
  });
  assert.deepEqual(new Set(selected), new Set(["fork-old", "shock-recent"]));
});

test("ponowne kliknięcie wybranego pomiaru usuwa go", () => {
  const selected = toggleRideMeasurementSelection({
    selectedIDs: ["fork-new"],
    measurement: fixtures[0],
    candidates: fixtures
  });
  assert.deepEqual(selected, []);
});

test("identyfikatory są zamieniane na istniejące pomiary bez duplikatów", () => {
  const values = measurementsForSelection(["fork-new", "missing", "fork-new", "shock-recent"], fixtures);
  assert.deepEqual(values.map(item => item.id), ["fork-new", "shock-recent"]);
});
