export const NUMBER_PARSE_STATUS = Object.freeze({
  EMPTY: "empty",
  INVALID: "invalid",
  VALUE: "value"
});

export const OPTIONAL_NUMBER_RULE = Object.freeze({
  POSITIVE: "positive",
  PERCENTAGE: "percentage"
});

export class NumericValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "NumericValidationError";
  }
}

function normalizeText(text, decimalSeparator = ".") {
  return String(text ?? "")
    .trim()
    .replaceAll(decimalSeparator || ".", ".")
    .replaceAll(",", ".");
}

export function parseLocalizedNumber(text, { decimalSeparator = "." } = {}) {
  const normalized = normalizeText(text, decimalSeparator);
  if (!normalized) return { status: NUMBER_PARSE_STATUS.EMPTY, value: null };

  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return { status: NUMBER_PARSE_STATUS.INVALID, value: null };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { status: NUMBER_PARSE_STATUS.INVALID, value: null };
  }

  return { status: NUMBER_PARSE_STATUS.VALUE, value };
}

export function validateOptionalLocalizedNumber(text, { fieldName, rule, decimalSeparator = "." }) {
  const parsed = parseLocalizedNumber(text, { decimalSeparator });
  if (parsed.status === NUMBER_PARSE_STATUS.EMPTY) return null;

  const isValid = parsed.status === NUMBER_PARSE_STATUS.VALUE && (
    rule === OPTIONAL_NUMBER_RULE.POSITIVE
      ? parsed.value > 0
      : rule === OPTIONAL_NUMBER_RULE.PERCENTAGE
        ? parsed.value > 0 && parsed.value < 100
        : false
  );

  if (!isValid) {
    const message = rule === OPTIONAL_NUMBER_RULE.PERCENTAGE
      ? `${fieldName} musi być liczbą większą od 0 i mniejszą od 100.`
      : `${fieldName} musi być liczbą większą od 0.`;
    throw new NumericValidationError(message);
  }

  return parsed.value;
}
