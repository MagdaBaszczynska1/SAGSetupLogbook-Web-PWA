import { createBikeProfile } from "../models/bike-profile.js";
import { SAG_INTERPRETATION } from "../models/sag-measurement.js";
import { DATA_STORE } from "./memory-database.js";

const CURRENT_KEY = "sagSetupLogbookWeb.v2";
const LEGACY_KEY = "sagSetupLogbookWeb.v1";
const META_KEY = "legacy-local-storage-migration-v1";

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function finiteNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseStoredState(storage) {
  for (const key of [CURRENT_KEY, LEGACY_KEY]) {
    try {
      const value = JSON.parse(storage.getItem(key));
      if (value && Array.isArray(value.bikes)) return { key, value };
    } catch (error) {
      console.warn(`Pominięto niepoprawne dane ${key}.`, error);
    }
  }
  return null;
}

function mapBike(source) {
  return createBikeProfile({
    id: source.id,
    name: String(source.name ?? "Rower").trim() || "Rower",
    model: String(source.model ?? "").trim(),
    forkTravel: finitePositive(source.forkTravel),
    shockTravel: finitePositive(source.shockTravel),
    forkTargetSag: finitePositive(source.forkTargetSag),
    shockTargetSag: finitePositive(source.shockTargetSag),
    forkPressure: finitePositive(source.forkPressure),
    shockPressure: finitePositive(source.shockPressure),
    createdAt: source.createdAt ?? new Date().toISOString()
  });
}

function mapMeasurement(source) {
  const suspensionTravel = finitePositive(source.suspensionTravel ?? source.travel);
  const measuredCompression = finiteNonNegative(source.measuredCompression ?? source.compression);
  const targetSag = finitePositive(source.targetSag ?? source.target);
  if (suspensionTravel === null || measuredCompression === null || targetSag === null) return null;

  const currentSag = Number.isFinite(Number(source.currentSag ?? source.sag))
    ? Number(source.currentSag ?? source.sag)
    : measuredCompression / suspensionTravel * 100;
  const targetCompression = suspensionTravel * targetSag / 100;
  const differencePercentagePoints = currentSag - targetSag;
  const differenceMillimeters = measuredCompression - targetCompression;
  const interpretation = Math.abs(differencePercentagePoints) <= 1
    ? SAG_INTERPRETATION.CLOSE_TO_TARGET
    : differencePercentagePoints < 0
      ? SAG_INTERPRETATION.TOO_LOW
      : SAG_INTERPRETATION.TOO_HIGH;

  return {
    id: String(source.id ?? crypto.randomUUID()),
    date: new Date(source.date ?? Date.now()).toISOString(),
    bikeID: source.bikeID ?? source.bikeId ?? null,
    bikeNameSnapshot: source.bikeNameSnapshot ?? source.bikeName ?? null,
    suspensionType: source.suspensionType === "shock" ? "shock" : "fork",
    suspensionTravel,
    measuredCompression,
    targetSag,
    pressure: finitePositive(source.pressure),
    currentSag,
    targetCompression,
    differencePercentagePoints,
    differenceMillimeters,
    interpretation
  };
}

export async function migrateLegacyLocalStorage(database, storage = globalThis.localStorage) {
  if (!storage) return null;
  const marker = await database.getMeta(META_KEY);
  if (marker) return marker.value;

  const existingBikes = await database.getAll(DATA_STORE.BIKES);
  const existingMeasurements = await database.getAll(DATA_STORE.MEASUREMENTS);
  if (existingBikes.length || existingMeasurements.length) {
    await database.setMeta(META_KEY, { status: "skipped-existing-data", date: new Date().toISOString() });
    return null;
  }

  const stored = parseStoredState(storage);
  if (!stored) {
    await database.setMeta(META_KEY, { status: "no-data", date: new Date().toISOString() });
    return null;
  }

  const bikes = stored.value.bikes.map(mapBike);
  const measurements = (stored.value.measurements ?? []).map(mapMeasurement).filter(Boolean);
  const notice = {
    status: "migrated",
    source: stored.key,
    bikes: bikes.length,
    measurements: measurements.length,
    date: new Date().toISOString()
  };

  await database.replaceCollections(
    { [DATA_STORE.BIKES]: bikes, [DATA_STORE.MEASUREMENTS]: measurements },
    [{ key: META_KEY, value: notice }]
  );
  storage.removeItem(CURRENT_KEY);
  storage.removeItem(LEGACY_KEY);
  return notice;
}
