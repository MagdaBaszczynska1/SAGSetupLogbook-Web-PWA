const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "medium",
  timeStyle: "short"
});

function normalizedDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = normalizedDate(value);
  return date ? dateFormatter.format(date) : "Nieprawidłowa data";
}

export function formatDateTime(value) {
  const date = normalizedDate(value);
  return date ? dateTimeFormatter.format(date) : "Nieprawidłowa data";
}
