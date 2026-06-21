import { createBikeProfile } from "../models/bike-profile.js";

export const stage4BikeProfiles = Object.freeze([
  Object.freeze(createBikeProfile({
    id: "stage4-trek-slash-8",
    name: "Trek",
    model: "Slash 8",
    forkTravel: 160,
    shockTravel: 65,
    forkTargetSag: 25,
    shockTargetSag: 30,
    forkPressure: 80,
    shockPressure: 180,
    createdAt: "2026-01-01T00:00:00.000Z"
  })),
  Object.freeze(createBikeProfile({
    id: "stage4-hardtail",
    name: "Rower testowy",
    model: "Hardtail",
    forkTravel: 140,
    forkTargetSag: 20,
    forkPressure: 75,
    createdAt: "2026-01-01T00:00:00.000Z"
  }))
]);
