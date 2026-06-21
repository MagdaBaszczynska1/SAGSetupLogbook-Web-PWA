import test from "node:test";
import assert from "node:assert/strict";
import {
  NUMBER_PARSE_STATUS,
  NumericValidationError,
  OPTIONAL_NUMBER_RULE,
  parseLocalizedNumber,
  validateOptionalLocalizedNumber
} from "../../src/services/localized-number-parser.js";

test("parser przyjmuje przecinek i kropkę jako separator dziesiętny", () => {
  assert.deepEqual(parseLocalizedNumber("27,5"), { status: NUMBER_PARSE_STATUS.VALUE, value: 27.5 });
  assert.deepEqual(parseLocalizedNumber("27.5"), { status: NUMBER_PARSE_STATUS.VALUE, value: 27.5 });
  assert.deepEqual(parseLocalizedNumber("27,5", { decimalSeparator: "." }), { status: NUMBER_PARSE_STATUS.VALUE, value: 27.5 });
});

test("parser usuwa białe znaki i rozpoznaje puste pole", () => {
  assert.deepEqual(parseLocalizedNumber("  82,5  "), { status: NUMBER_PARSE_STATUS.VALUE, value: 82.5 });
  assert.deepEqual(parseLocalizedNumber("   "), { status: NUMBER_PARSE_STATUS.EMPTY, value: null });
});

test("parser odrzuca tekst, wiele separatorów i zapis wykładniczy", () => {
  for (const input of ["12,3,4", "abc", "1e3", "+12", ".5", "Infinity"]) {
    assert.deepEqual(parseLocalizedNumber(input), { status: NUMBER_PARSE_STATUS.INVALID, value: null });
  }
});

test("walidacja opcjonalnej liczby dodatniej dopuszcza pustą i dodatnią wartość", () => {
  assert.equal(validateOptionalLocalizedNumber("", { fieldName: "Ciśnienie", rule: OPTIONAL_NUMBER_RULE.POSITIVE }), null);
  assert.equal(validateOptionalLocalizedNumber("82,5", { fieldName: "Ciśnienie", rule: OPTIONAL_NUMBER_RULE.POSITIVE }), 82.5);
});

test("walidacja opcjonalnej liczby dodatniej odrzuca zero", () => {
  assert.throws(
    () => validateOptionalLocalizedNumber("0", { fieldName: "Ciśnienie", rule: OPTIONAL_NUMBER_RULE.POSITIVE }),
    error => error instanceof NumericValidationError && error.message === "Ciśnienie musi być liczbą większą od 0."
  );
});

test("reguła procentowa wymaga wartości między 0 a 100", () => {
  for (const input of ["0", "100", "-1"]) {
    assert.throws(
      () => validateOptionalLocalizedNumber(input, { fieldName: "Docelowy SAG", rule: OPTIONAL_NUMBER_RULE.PERCENTAGE }),
      NumericValidationError
    );
  }
  assert.equal(validateOptionalLocalizedNumber("99,5", { fieldName: "Docelowy SAG", rule: OPTIONAL_NUMBER_RULE.PERCENTAGE }), 99.5);
});
