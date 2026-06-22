import test from "node:test";
import assert from "node:assert/strict";
import { createBikeProfile } from "../../src/models/bike-profile.js";
import { createMemoryDatabase } from "../../src/persistence/memory-database.js";
import { createBikeStore } from "../../src/stores/bike-store.js";

test("add nie nadpisuje rekordu o tym samym identyfikatorze", async () => {
  const store = createBikeStore(createMemoryDatabase());
  await store.initialize();
  assert.equal(await store.add(createBikeProfile({ id: "bike-1", name: "Pierwszy" })), true);
  assert.equal(await store.add(createBikeProfile({ id: "bike-1", name: "Drugi" })), false);
  assert.equal(store.getAll().length, 1);
  assert.equal(store.getById("bike-1").name, "Pierwszy");
});

test("replaceAll odrzuca kolekcję z powtarzającymi się identyfikatorami", async () => {
  const store = createBikeStore(createMemoryDatabase());
  await store.initialize();
  const result = await store.replaceAll([
    createBikeProfile({ id: "same", name: "A" }),
    createBikeProfile({ id: "same", name: "B" })
  ]);
  assert.equal(result, false);
  assert.equal(store.getAll().length, 0);
  assert.match(store.errorMessage, /powtarzające się identyfikatory/);
});
