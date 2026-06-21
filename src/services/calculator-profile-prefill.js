import { getBikePressure, getBikeTargetSag, getBikeTravel } from "../models/bike-profile.js";
import { getTargetSagSliderConfiguration, getTravelSliderConfiguration } from "./sag-slider-configuration.js";

export function getCalculatorProfilePrefill(profile, suspensionType) {
  const travelConfiguration = getTravelSliderConfiguration(suspensionType);
  const targetConfiguration = getTargetSagSliderConfiguration(suspensionType);
  const profileTravel = profile ? getBikeTravel(profile, suspensionType) : null;

  return Object.freeze({
    suspensionTravel: profileTravel ?? travelConfiguration.defaultValue,
    targetSag: profile ? getBikeTargetSag(profile, suspensionType) ?? targetConfiguration.defaultValue : targetConfiguration.defaultValue,
    pressure: profile ? getBikePressure(profile, suspensionType) : null,
    travelComesFromProfile: profileTravel !== null && profileTravel !== undefined
  });
}
