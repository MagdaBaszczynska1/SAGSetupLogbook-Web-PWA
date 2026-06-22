import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const manifestUrl = new URL("../../manifest.webmanifest", import.meta.url);

test("manifest PWA ma wymagane pola instalacyjne", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert.equal(manifest.id, "./");
  assert.equal(manifest.start_url, "./#/measurement");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "pl");
  assert.equal(manifest.theme_color, "#168b2b");
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.some(icon => icon.sizes === "192x192" && icon.type === "image/png"));
  assert.ok(manifest.icons.some(icon => String(icon.purpose).includes("maskable")));
});

test("wszystkie ikony manifestu istnieją w repozytorium", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  for (const icon of manifest.icons) {
    const iconUrl = new URL(`../../${icon.src.replace(/^\.\//, "")}`, import.meta.url);
    assert.equal(existsSync(iconUrl), true, `Brak ikony ${icon.src}`);
  }
});

test("skróty manifestu prowadzą do tras aplikacji", async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));
  assert.deepEqual(manifest.shortcuts.map(item => item.url), [
    "./#/measurement",
    "./#/history",
    "./#/journal"
  ]);
});
