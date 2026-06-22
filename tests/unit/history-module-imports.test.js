import test from "node:test";
import assert from "node:assert/strict";
import { createHistoryView } from "../../src/views/history/history-view.js";
import { createHistoryFilters } from "../../src/views/history/history-filters.js";
import { createMeasurementHistoryRow } from "../../src/views/history/history-row.js";
import { createMeasurementDetailDialog } from "../../src/views/history/measurement-detail-dialog.js";
import { createMeasurementEditDialog } from "../../src/views/history/measurement-edit-dialog.js";

test("moduły Historii eksportują funkcje widoków", () => {
  assert.equal(typeof createHistoryView, "function");
  assert.equal(typeof createHistoryFilters, "function");
  assert.equal(typeof createMeasurementHistoryRow, "function");
  assert.equal(typeof createMeasurementDetailDialog, "function");
  assert.equal(typeof createMeasurementEditDialog, "function");
});
