import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../../src/utils/html.js";

test("dane profilu są kodowane przed użyciem w szablonie HTML", () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)"> & Rower'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; Rower"
  );
});
