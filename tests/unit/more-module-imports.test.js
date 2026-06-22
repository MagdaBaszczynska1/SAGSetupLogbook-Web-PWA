import test from "node:test";
import assert from "node:assert/strict";
import { createMoreView } from "../../src/views/more/more-view.js";
import { createGuideDialog } from "../../src/views/more/guide-dialog.js";
import { createSettingsDialog } from "../../src/views/more/settings-dialog.js";
import { createPrivacyDialog } from "../../src/views/more/privacy-dialog.js";
import { createDataManagementView } from "../../src/views/more/data-management-view.js";
import { downloadTextFile } from "../../src/utils/downloads.js";

test("moduły Więcej eksportują funkcje widoków i pobierania", () => {
  assert.equal(typeof createMoreView, "function");
  assert.equal(typeof createGuideDialog, "function");
  assert.equal(typeof createSettingsDialog, "function");
  assert.equal(typeof createPrivacyDialog, "function");
  assert.equal(typeof createDataManagementView, "function");
  assert.equal(typeof downloadTextFile, "function");
});
