import { assertSuspensionType } from "./suspension-type.js";
import { createId } from "../utils/ids.js";

export const SAG_INTERPRETATION = Object.freeze({
  CLOSE_TO_TARGET: "closeToTarget",
  TOO_LOW: "tooLow",
  TOO_HIGH: "tooHigh"
});

export const SAG_INTERPRETATION_CONTENT = Object.freeze({
  [SAG_INTERPRETATION.CLOSE_TO_TARGET]: Object.freeze({
    message: "SAG bliski celu",
    liveStatusTitle: "Wartość w zakresie docelowym",
    explanation: "Różnica mieści się w tolerancji 1 punktu procentowego.",
    icon: "checkmark-circle",
    tone: "success"
  }),
  [SAG_INTERPRETATION.TOO_LOW]: Object.freeze({
    message: "SAG za mały",
    liveStatusTitle: "SAG poniżej celu",
    explanation: "Aktualny SAG jest niższy od wartości docelowej.",
    icon: "arrow-down-circle",
    tone: "warning"
  }),
  [SAG_INTERPRETATION.TOO_HIGH]: Object.freeze({
    message: "SAG za duży",
    liveStatusTitle: "SAG powyżej celu",
    explanation: "Aktualny SAG jest wyższy od wartości docelowej.",
    icon: "arrow-up-circle",
    tone: "warning"
  })
});

export function getSagInterpretationContent(interpretation) {
  const content = SAG_INTERPRETATION_CONTENT[interpretation];
  if (!content) throw new TypeError(`Nieznana interpretacja SAG: ${String(interpretation)}`);
  return content;
}

export function createSagMeasurement({
  id = createId(),
  date = new Date().toISOString(),
  bikeID = null,
  bikeNameSnapshot = null,
  suspensionType,
  pressure = null,
  values,
  result
}) {
  assertSuspensionType(suspensionType);
  return {
    id: String(id),
    date: new Date(date).toISOString(),
    bikeID: bikeID === null || bikeID === undefined ? null : String(bikeID),
    bikeNameSnapshot: bikeNameSnapshot === null || bikeNameSnapshot === undefined ? null : String(bikeNameSnapshot),
    suspensionType,
    suspensionTravel: values.suspensionTravel,
    measuredCompression: values.measuredCompression,
    targetSag: values.targetSag,
    pressure,
    currentSag: result.currentSag,
    targetCompression: result.targetCompression,
    differencePercentagePoints: result.differencePercentagePoints,
    differenceMillimeters: result.differenceMillimeters,
    interpretation: result.interpretation
  };
}
