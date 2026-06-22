export const SUSPENSION_TYPE = Object.freeze({
  FORK: "fork",
  SHOCK: "shock"
});

const DEFINITIONS = Object.freeze({
  [SUSPENSION_TYPE.FORK]: Object.freeze({
    id: SUSPENSION_TYPE.FORK,
    title: "Widelec",
    travelFieldTitle: "Skok widelca",
    measuredCompressionFieldTitle: "Ugięcie widelca",
    targetCompressionTitle: "Docelowe ugięcie widelca",
    pressureFieldTitle: "Ciśnienie widelca",
    travelPlaceholder: "np. 160",
    measuredCompressionPlaceholder: "np. 32",
    measurementHelpText: "Zmierz przesunięcie gumowego pierścienia na goleni widelca."
  }),
  [SUSPENSION_TYPE.SHOCK]: Object.freeze({
    id: SUSPENSION_TYPE.SHOCK,
    title: "Damper",
    travelFieldTitle: "Skok dampera",
    measuredCompressionFieldTitle: "Ugięcie tłoczyska dampera",
    targetCompressionTitle: "Docelowe ugięcie tłoczyska dampera",
    pressureFieldTitle: "Ciśnienie dampera",
    travelPlaceholder: "np. 65",
    measuredCompressionPlaceholder: "np. 18",
    measurementHelpText: "Wpisz skok tłoczyska dampera, a nie skok tylnego koła."
  })
});

export function isSuspensionType(value) {
  return value === SUSPENSION_TYPE.FORK || value === SUSPENSION_TYPE.SHOCK;
}

export function assertSuspensionType(value) {
  if (!isSuspensionType(value)) {
    throw new TypeError(`Nieznany typ zawieszenia: ${String(value)}`);
  }
  return value;
}

export function getSuspensionDefinition(value) {
  return DEFINITIONS[assertSuspensionType(value)];
}
