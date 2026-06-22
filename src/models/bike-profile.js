import { assertSuspensionType, SUSPENSION_TYPE } from "./suspension-type.js";
import { createId } from "../utils/ids.js";

function optionalFiniteNumber(value, fieldName) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${fieldName} musi być skończoną liczbą albo wartością pustą.`);
  }
  return parsed;
}

export function createBikeProfile({
  id = createId(),
  name,
  model = "",
  forkTravel = null,
  shockTravel = null,
  forkTargetSag = null,
  shockTargetSag = null,
  forkPressure = null,
  shockPressure = null,
  createdAt = new Date().toISOString()
}) {
  return {
    id: String(id),
    name: String(name ?? ""),
    model: String(model ?? ""),
    forkTravel: optionalFiniteNumber(forkTravel, "Skok widelca"),
    shockTravel: optionalFiniteNumber(shockTravel, "Skok dampera"),
    forkTargetSag: optionalFiniteNumber(forkTargetSag, "Docelowy SAG widelca"),
    shockTargetSag: optionalFiniteNumber(shockTargetSag, "Docelowy SAG dampera"),
    forkPressure: optionalFiniteNumber(forkPressure, "Ciśnienie widelca"),
    shockPressure: optionalFiniteNumber(shockPressure, "Ciśnienie dampera"),
    createdAt: new Date(createdAt).toISOString()
  };
}

export function getBikeDisplayName(profile) {
  const model = String(profile?.model ?? "").trim();
  const name = String(profile?.name ?? "");
  return model ? `${name} — ${model}` : name;
}

export function getBikeTravel(profile, suspensionType) {
  assertSuspensionType(suspensionType);
  return suspensionType === SUSPENSION_TYPE.FORK ? profile?.forkTravel ?? null : profile?.shockTravel ?? null;
}

export function getBikeTargetSag(profile, suspensionType) {
  assertSuspensionType(suspensionType);
  return suspensionType === SUSPENSION_TYPE.FORK ? profile?.forkTargetSag ?? null : profile?.shockTargetSag ?? null;
}

export function getBikePressure(profile, suspensionType) {
  assertSuspensionType(suspensionType);
  return suspensionType === SUSPENSION_TYPE.FORK ? profile?.forkPressure ?? null : profile?.shockPressure ?? null;
}
