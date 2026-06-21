import { getBikeDisplayName } from "../../models/bike-profile.js";
import { createSagMeasurement } from "../../models/sag-measurement.js";
import { SUSPENSION_TYPE } from "../../models/suspension-type.js";
import { getCalculatorProfilePrefill } from "../../services/calculator-profile-prefill.js";
import {
  TARGET_SAG_PRESET,
  evaluateLiveSag,
  getTargetSagPresetValue,
  resolveCalculatorSaveState,
  selectTargetSagPreset
} from "../../services/sag-calculator.js";
import {
  getCompressionSliderConfiguration,
  getPressureSliderConfiguration,
  getTargetSagSliderConfiguration,
  getTravelSliderConfiguration
} from "../../services/sag-slider-configuration.js";

function initialForm() {
  return {
    selectedBikeID: null,
    suspensionType: SUSPENSION_TYPE.FORK,
    suspensionTravel: getTravelSliderConfiguration(SUSPENSION_TYPE.FORK).defaultValue,
    travelComesFromProfile: false,
    measuredCompression: 0,
    pressure: null,
    targetSag: getTargetSagSliderConfiguration(SUSPENSION_TYPE.FORK).defaultValue,
    usesCustomTargetSag: false,
    hasSetMeasuredCompression: false,
    isAdditionalDataExpanded: false,
    saveFeedback: null,
    saveSucceeded: false,
    savedInputToken: null,
    isSavingMeasurement: false,
    isCurrentResultSaved: false,
    savedMeasurement: null
  };
}

function inputToken(form, live) {
  if (!live.values) return null;
  return JSON.stringify([
    form.selectedBikeID,
    form.suspensionType,
    live.values.suspensionTravel,
    live.values.measuredCompression,
    live.values.targetSag,
    live.pressure
  ]);
}

export function createMeasurementController({ bikes = [], measurementStore }) {
  if (!measurementStore?.add) throw new TypeError("Brak magazynu pomiarów.");
  let form = initialForm();
  const listeners = new Set();

  const bike = () => bikes.find(item => item.id === form.selectedBikeID) ?? null;
  const live = () => evaluateLiveSag({
    suspensionTravel: form.suspensionTravel,
    measuredCompression: form.measuredCompression,
    targetSag: form.targetSag,
    pressure: form.pressure,
    suspensionType: form.suspensionType,
    hasSetMeasuredCompression: form.hasSetMeasuredCompression
  });

  function isDefault() {
    const start = initialForm();
    return form.selectedBikeID === null
      && form.suspensionType === start.suspensionType
      && form.suspensionTravel === start.suspensionTravel
      && form.measuredCompression === 0
      && form.pressure === null
      && form.targetSag === start.targetSag
      && !form.usesCustomTargetSag
      && !form.hasSetMeasuredCompression;
  }

  function snapshot() {
    const calculation = live();
    return Object.freeze({
      ...form,
      bikes: Object.freeze([...bikes]),
      selectedBike: bike(),
      liveCalculation: calculation,
      saveButtonState: resolveCalculatorSaveState({
        hasValidResult: calculation.result !== null,
        isSaving: form.isSavingMeasurement,
        isSaved: form.isCurrentResultSaved
      }),
      targetPreset: form.usesCustomTargetSag ? TARGET_SAG_PRESET.CUSTOM : selectTargetSagPreset(form.targetSag),
      isAtDefaultState: isDefault()
    });
  }

  function notify() {
    const value = snapshot();
    listeners.forEach(listener => listener(value));
  }

  function change(patch, affectsSavedResult = true) {
    form = { ...form, ...patch };
    if (affectsSavedResult) {
      const token = inputToken(form, live());
      form.saveFeedback = null;
      form.saveSucceeded = false;
      form.savedMeasurement = null;
      form.isCurrentResultSaved = token !== null && token === form.savedInputToken;
    }
    notify();
  }

  function applyProfile() {
    const prefill = getCalculatorProfilePrefill(bike(), form.suspensionType);
    form = {
      ...form,
      suspensionTravel: prefill.suspensionTravel,
      travelComesFromProfile: prefill.travelComesFromProfile,
      targetSag: prefill.targetSag,
      usesCustomTargetSag: selectTargetSagPreset(prefill.targetSag) === TARGET_SAG_PRESET.CUSTOM,
      pressure: prefill.pressure,
      measuredCompression: 0,
      hasSetMeasuredCompression: false,
      saveFeedback: null,
      saveSucceeded: false,
      isCurrentResultSaved: false,
      savedMeasurement: null
    };
    notify();
  }

  function setSelectedBikeID(value) {
    const id = value ? String(value) : null;
    if (id && !bikes.some(item => item.id === id)) return;
    form.selectedBikeID = id;
    applyProfile();
  }

  function setSuspensionType(value) {
    if (![SUSPENSION_TYPE.FORK, SUSPENSION_TYPE.SHOCK].includes(value)) return;
    form.suspensionType = value;
    applyProfile();
  }

  function setManualTravel(value) {
    const configuration = getTravelSliderConfiguration(form.suspensionType);
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    const step = configuration.step;
    const rounded = Math.round(numeric / step) * step;
    change({
      suspensionTravel: rounded,
      measuredCompression: Math.min(form.measuredCompression, rounded),
      travelComesFromProfile: false
    });
  }

  function setMeasuredCompression(value) {
    const configuration = getCompressionSliderConfiguration(form.suspensionType, form.suspensionTravel);
    change({ measuredCompression: configuration.snap(Number(value)), hasSetMeasuredCompression: true });
  }

  function adjustMeasuredCompression(direction) {
    const configuration = getCompressionSliderConfiguration(form.suspensionType, form.suspensionTravel);
    setMeasuredCompression(form.measuredCompression + Math.sign(direction) * configuration.step);
  }

  function selectTargetPreset(preset) {
    const value = getTargetSagPresetValue(preset);
    if (value === null) {
      const configuration = getTargetSagSliderConfiguration(form.suspensionType);
      change({ usesCustomTargetSag: true, targetSag: configuration.snap(form.targetSag) });
    } else {
      change({ usesCustomTargetSag: false, targetSag: value });
    }
  }

  function setCustomTargetSag(value) {
    const configuration = getTargetSagSliderConfiguration(form.suspensionType);
    change({ usesCustomTargetSag: true, targetSag: configuration.snap(Number(value)) });
  }

  function setAdditionalDataExpanded(value) {
    change({ isAdditionalDataExpanded: Boolean(value) }, false);
  }

  function setPressureEnabled(enabled) {
    const configuration = getPressureSliderConfiguration(form.suspensionType);
    change({ pressure: enabled ? form.pressure ?? configuration.defaultValue : null });
  }

  function setPressure(value) {
    const configuration = getPressureSliderConfiguration(form.suspensionType);
    change({ pressure: configuration.snap(Number(value)) });
  }

  function clearForm() {
    form = initialForm();
    notify();
  }

  async function saveMeasurement() {
    if (form.isSavingMeasurement || form.isCurrentResultSaved) return null;
    const calculation = live();
    const token = inputToken(form, calculation);
    if (!calculation.values || !calculation.result || !token) {
      change({ saveFeedback: "Najpierw ustaw ugięcie zawieszenia." }, false);
      return null;
    }

    change({ isSavingMeasurement: true }, false);
    const selected = bike();
    const measurement = createSagMeasurement({
      bikeID: selected?.id ?? null,
      bikeNameSnapshot: selected ? getBikeDisplayName(selected) : null,
      suspensionType: form.suspensionType,
      pressure: calculation.pressure,
      values: calculation.values,
      result: calculation.result
    });

    let success = false;
    try {
      success = await Promise.resolve(measurementStore.add(measurement));
    } catch (error) {
      console.error("Nie udało się zapisać pomiaru.", error);
    }

    if (success) {
      form = {
        ...form,
        savedInputToken: token,
        isSavingMeasurement: false,
        isCurrentResultSaved: true,
        saveSucceeded: true,
        saveFeedback: null,
        savedMeasurement: measurement
      };
      notify();
      return measurement;
    }

    form = {
      ...form,
      isSavingMeasurement: false,
      isCurrentResultSaved: false,
      saveSucceeded: false,
      saveFeedback: measurementStore.errorMessage ?? "Nie udało się zapisać pomiaru.",
      savedMeasurement: null
    };
    notify();
    return null;
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(snapshot());
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    subscribe,
    getSnapshot: snapshot,
    setSelectedBikeID,
    setSuspensionType,
    setManualTravel,
    setMeasuredCompression,
    adjustMeasuredCompression,
    selectTargetPreset,
    setCustomTargetSag,
    setAdditionalDataExpanded,
    setPressureEnabled,
    setPressure,
    clearForm,
    saveMeasurement
  });
}
