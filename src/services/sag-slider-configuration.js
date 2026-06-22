import { assertSuspensionType, SUSPENSION_TYPE } from "../models/suspension-type.js";

export function createSliderConfiguration({ minimum, maximum, step, defaultValue }) {
  if (![minimum, maximum, step, defaultValue].every(Number.isFinite) || maximum < minimum || step < 0) {
    throw new TypeError("Nieprawidłowa konfiguracja suwaka.");
  }

  const configuration = {
    minimum,
    maximum,
    step,
    defaultValue,
    rangeIncluding(value) {
      const snapped = step > 0 ? Math.round(value / step) * step : value;
      return {
        minimum: Math.min(minimum, snapped),
        maximum: Math.max(maximum, snapped)
      };
    },
    clamp(value) {
      return Math.min(Math.max(value, minimum), maximum);
    },
    snap(value) {
      if (step <= 0) return configuration.clamp(value);
      const rounded = Math.round(value / step) * step;
      return configuration.clamp(rounded);
    }
  };

  return Object.freeze(configuration);
}

export function getTravelSliderConfiguration(suspensionType) {
  assertSuspensionType(suspensionType);
  return suspensionType === SUSPENSION_TYPE.FORK
    ? createSliderConfiguration({ minimum: 80, maximum: 220, step: 1, defaultValue: 160 })
    : createSliderConfiguration({ minimum: 20, maximum: 100, step: 0.5, defaultValue: 55 });
}

export function getCompressionSliderConfiguration(suspensionType, travel) {
  assertSuspensionType(suspensionType);
  const step = suspensionType === SUSPENSION_TYPE.FORK ? 1 : 0.5;
  return createSliderConfiguration({
    minimum: 0,
    maximum: Math.max(Number(travel), step),
    step,
    defaultValue: 0
  });
}

export function getTargetSagSliderConfiguration(suspensionType) {
  assertSuspensionType(suspensionType);
  return createSliderConfiguration({
    minimum: 10,
    maximum: 40,
    step: 1,
    defaultValue: suspensionType === SUSPENSION_TYPE.FORK ? 25 : 30
  });
}

export function getPressureSliderConfiguration(suspensionType) {
  assertSuspensionType(suspensionType);
  return suspensionType === SUSPENSION_TYPE.FORK
    ? createSliderConfiguration({ minimum: 30, maximum: 200, step: 1, defaultValue: 80 })
    : createSliderConfiguration({ minimum: 50, maximum: 400, step: 1, defaultValue: 180 });
}

export function createCompressionScale(suspensionType, travel, tickCount = 21) {
  const configuration = getCompressionSliderConfiguration(suspensionType, travel);
  const safeTickCount = Math.max(Math.trunc(tickCount), 2);
  const midpoint = configuration.snap((configuration.minimum + configuration.maximum) / 2);
  const tickFractions = Array.from(
    { length: safeTickCount },
    (_, index) => index / (safeTickCount - 1)
  );

  return Object.freeze({
    minimum: configuration.minimum,
    midpoint,
    maximum: configuration.maximum,
    tickFractions: Object.freeze(tickFractions)
  });
}
