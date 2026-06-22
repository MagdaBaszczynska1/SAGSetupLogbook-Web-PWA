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

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatDate(value) {
  const date = normalizedDate(value);
  return date ? dateFormatter.format(date) : "Nieprawidłowa data";
}

export function formatDateTime(value) {
  const date = normalizedDate(value);
  return date ? dateTimeFormatter.format(date) : "Nieprawidłowa data";
}

export function getLocalDateKey(value) {
  const date = normalizedDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateInputValue(value) {
  return getLocalDateKey(value) ?? "";
}

export function dateInputValueToIso(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.toISOString();
}

export function calendarDayDifference(laterValue, earlierValue) {
  const laterKey = getLocalDateKey(laterValue);
  const earlierKey = getLocalDateKey(earlierValue);
  if (!laterKey || !earlierKey) return null;
  const [laterYear, laterMonth, laterDay] = laterKey.split("-").map(Number);
  const [earlierYear, earlierMonth, earlierDay] = earlierKey.split("-").map(Number);
  const laterUtc = Date.UTC(laterYear, laterMonth - 1, laterDay);
  const earlierUtc = Date.UTC(earlierYear, earlierMonth - 1, earlierDay);
  return Math.round((laterUtc - earlierUtc) / 86400000);
}
