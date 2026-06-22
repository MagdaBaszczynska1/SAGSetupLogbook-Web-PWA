import test from "node:test";
import assert from "node:assert/strict";
import {
  calendarDayDifference,
  dateInputValueToIso,
  getLocalDateKey,
  toDateInputValue
} from "../../src/utils/date-formatters.js";

test("wartość pola date zachowuje lokalny dzień", () => {
  const iso = dateInputValueToIso("2026-06-20");
  assert.equal(getLocalDateKey(iso), "2026-06-20");
  assert.equal(toDateInputValue(iso), "2026-06-20");
});

test("nieprawidłowa data pola jest odrzucana", () => {
  assert.equal(dateInputValueToIso("2026-02-31"), null);
  assert.equal(dateInputValueToIso("20.06.2026"), null);
  assert.equal(dateInputValueToIso(""), null);
});

test("różnica dni działa na granicy miesiąca", () => {
  assert.equal(calendarDayDifference("2026-07-02T12:00:00.000Z", "2026-06-30T12:00:00.000Z"), 2);
});

test("nieprawidłowe wartości nie tworzą różnicy dni", () => {
  assert.equal(calendarDayDifference("błąd", "2026-06-20"), null);
});
