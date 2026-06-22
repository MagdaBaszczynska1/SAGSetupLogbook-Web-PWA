import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import { createMeasurementController } from "../../src/views/measurement/measurement-controller.js";

const measurementStore = {
  async add() { return true; },
  get errorMessage() { return null; }
};

test("nowo dodany profil pojawia się w kontrolerze Pomiaru", () => {
  const controller = createMeasurementController({ bikes: [], measurementStore });
  const bike = createBikeProfile({ id: "bike-1", name: "Nowy rower", forkTravel: 150 });
  controller.setBikes([bike]);
  assert.deepEqual(controller.getSnapshot().bikes.map(item => item.id), ["bike-1"]);
});

test("edycja wybranego profilu odświeża wartości kalkulatora", () => {
  const bike = createBikeProfile({ id: "bike-1", name: "Rower", forkTravel: 150, forkTargetSag: 22 });
  const controller = createMeasurementController({ bikes: [bike], measurementStore });
  controller.setSelectedBikeID("bike-1");
  controller.setMeasuredCompression(30);

  const edited = createBikeProfile({ ...bike, forkTravel: 170, forkTargetSag: 25 });
  controller.setBikes([edited]);
  const state = controller.getSnapshot();
  assert.equal(state.suspensionTravel, 170);
  assert.equal(state.targetSag, 25);
  assert.equal(state.hasSetMeasuredCompression, false);
});

test("usunięcie wybranego profilu przełącza kalkulator na Bez profilu", () => {
  const bike = createBikeProfile({ id: "bike-1", name: "Rower", forkTravel: 150 });
  const controller = createMeasurementController({ bikes: [bike], measurementStore });
  controller.setSelectedBikeID("bike-1");
  controller.setBikes([]);
  const state = controller.getSnapshot();
  assert.equal(state.selectedBikeID, null);
  assert.equal(state.suspensionTravel, 160);
  assert.equal(state.travelComesFromProfile, false);
});
