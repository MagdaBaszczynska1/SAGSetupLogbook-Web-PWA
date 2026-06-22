export function cloneValue(value) {
  if (value === undefined) return undefined;
  if (globalThis.structuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
