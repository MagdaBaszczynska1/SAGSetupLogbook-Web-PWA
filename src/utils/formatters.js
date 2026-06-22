const compactFormatter = new Intl.NumberFormat("pl-PL", {
  useGrouping: false,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const displayFormatter = new Intl.NumberFormat("pl-PL", {
  useGrouping: false,
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export function formatCompactNumber(value) {
  return compactFormatter.format(value);
}

export function formatDisplayNumber(value) {
  return displayFormatter.format(value);
}

export function formatSignedNumber(value) {
  if (Math.abs(value) < 0.000001) return displayFormatter.format(0);
  const sign = value > 0 ? "+" : "−";
  return `${sign}${displayFormatter.format(Math.abs(value))}`;
}
