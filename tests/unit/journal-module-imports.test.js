import test from "node:test";
import assert from "node:assert/strict";
import { createJournalView } from "../../src/views/journal/journal-view.js";
import { createJournalFilters } from "../../src/views/journal/journal-filters.js";
import { createRideJournalRow } from "../../src/views/journal/journal-row.js";
import { createRideEntryDialog } from "../../src/views/journal/ride-entry-dialog.js";
import { createRideDetailDialog } from "../../src/views/journal/ride-detail-dialog.js";
import { createJournalConfirmationDialog } from "../../src/views/journal/journal-confirmation-dialog.js";

test("moduły Dziennika eksportują funkcje widoków", () => {
  assert.equal(typeof createJournalView, "function");
  assert.equal(typeof createJournalFilters, "function");
  assert.equal(typeof createRideJournalRow, "function");
  assert.equal(typeof createRideEntryDialog, "function");
  assert.equal(typeof createRideDetailDialog, "function");
  assert.equal(typeof createJournalConfirmationDialog, "function");
});
