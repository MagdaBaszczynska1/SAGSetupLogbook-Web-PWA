import { createId } from "../utils/ids.js";
import { getBikeDisplayName } from "./bike-profile.js";

export const TRAIL_CONDITION = Object.freeze({
  DRY: "dry",
  WET: "wet",
  MUDDY: "muddy",
  MIXED: "mixed"
});

export const TRAIL_CONDITION_CONTENT = Object.freeze({
  [TRAIL_CONDITION.DRY]: Object.freeze({ title: "Sucho", icon: "sun" }),
  [TRAIL_CONDITION.WET]: Object.freeze({ title: "Mokro", icon: "rain" }),
  [TRAIL_CONDITION.MUDDY]: Object.freeze({ title: "Błoto", icon: "mud" }),
  [TRAIL_CONDITION.MIXED]: Object.freeze({ title: "Mieszane", icon: "mixed-weather" })
});

export const RIDE_MEASUREMENT_STATUS = Object.freeze({
  NONE: "none",
  SAME_DAY: "sameDay",
  HISTORICAL: "historical"
});

export function createBikeProfileSnapshot(profile) {
  return {
    bikeName: profile.name,
    bikeModel: profile.model,
    forkTravel: profile.forkTravel ?? null,
    forkTargetSag: profile.forkTargetSag ?? null,
    forkPressure: profile.forkPressure ?? null,
    shockTravel: profile.shockTravel ?? null,
    shockTargetSag: profile.shockTargetSag ?? null,
    shockPressure: profile.shockPressure ?? null
  };
}

export function getBikeProfileSnapshotDisplayName(snapshot) {
  return getBikeDisplayName({ name: snapshot.bikeName, model: snapshot.bikeModel });
}

export function hasForkSnapshotData(snapshot) {
  return snapshot.forkTravel !== null || snapshot.forkTargetSag !== null || snapshot.forkPressure !== null;
}

export function hasShockSnapshotData(snapshot) {
  return snapshot.shockTravel !== null || snapshot.shockTargetSag !== null || snapshot.shockPressure !== null;
}

export function createSagMeasurementSnapshot(measurement) {
  return {
    sourceMeasurementID: measurement.id,
    sourceBikeID: measurement.bikeID ?? null,
    measurementDate: new Date(measurement.date).toISOString(),
    suspensionType: measurement.suspensionType,
    suspensionTravel: measurement.suspensionTravel,
    measuredCompression: measurement.measuredCompression,
    targetSag: measurement.targetSag,
    pressure: measurement.pressure ?? null,
    currentSag: measurement.currentSag,
    targetCompression: measurement.targetCompression,
    differencePercentagePoints: measurement.differencePercentagePoints,
    differenceMillimeters: measurement.differenceMillimeters,
    interpretation: measurement.interpretation
  };
}

function clampRating(value) {
  return Math.min(Math.max(Math.trunc(Number(value) || 1), 1), 5);
}

export function createRideJournalEntry({
  id = createId(),
  createdAt = new Date().toISOString(),
  rideDate,
  bikeID,
  bikeNameSnapshot,
  bikeProfileSnapshot = null,
  measurementSnapshot = null,
  measurementSnapshots = null,
  routeName,
  conditions,
  rating,
  notes = ""
}) {
  return {
    id: String(id),
    createdAt: new Date(createdAt).toISOString(),
    rideDate: new Date(rideDate).toISOString(),
    bikeID: String(bikeID),
    bikeNameSnapshot: String(bikeNameSnapshot),
    bikeProfileSnapshot,
    measurementSnapshot,
    measurementSnapshots: Array.isArray(measurementSnapshots) ? measurementSnapshots : measurementSnapshots ?? null,
    routeName: String(routeName),
    conditions,
    rating: clampRating(rating),
    notes: String(notes ?? "")
  };
}

export function getAllMeasurementSnapshots(entry) {
  if (Array.isArray(entry.measurementSnapshots) && entry.measurementSnapshots.length > 0) {
    return entry.measurementSnapshots;
  }
  return entry.measurementSnapshot ? [entry.measurementSnapshot] : [];
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function getRideMeasurementAttachmentStatus(entry) {
  const snapshots = getAllMeasurementSnapshots(entry);
  if (!snapshots.length) return { type: RIDE_MEASUREMENT_STATUS.NONE, count: 0 };

  const rideDay = localDateKey(entry.rideDate);
  const includesHistorical = snapshots.some(snapshot => {
    return snapshot.sourceBikeID === null || snapshot.sourceBikeID === undefined || localDateKey(snapshot.measurementDate) !== rideDay;
  });

  return {
    type: includesHistorical ? RIDE_MEASUREMENT_STATUS.HISTORICAL : RIDE_MEASUREMENT_STATUS.SAME_DAY,
    count: snapshots.length
  };
}
