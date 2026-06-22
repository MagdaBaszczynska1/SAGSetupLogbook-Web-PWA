import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

test("wersja pakietu, modułu aplikacji i service workera jest zgodna", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const versionModule = await read("src/app/version.js");
  const worker = await read("sw.js");
  const moduleVersion = versionModule.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
  const workerVersion = worker.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
  assert.equal(moduleVersion, packageJson.version);
  assert.equal(workerVersion, packageJson.version);
});

test("dokument startowy ma ścisłą politykę CSP bez skryptów inline", async () => {
  const html = await read("index.html");
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /object-src 'none'/);
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /referrer" content="no-referrer/);
  assert.equal(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), false, "index.html nie może zawierać skryptu inline");
});

test("service worker przechowuje wszystkie pliki wymagane przed pierwszym renderem", async () => {
  const worker = await read("sw.js");
  for (const path of [
    "./index.html",
    "./manifest.webmanifest",
    "./src/app/theme-bootstrap.js",
    "./src/app/version.js",
    "./src/app/main.js",
    "./src/styles/index.css"
  ]) {
    assert.match(worker, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("interfejs nie zawiera komunikatów z nieukończonych wcześniejszych etapów", async () => {
  const files = [
    "src/views/measurement/measurement-view.js",
    "src/views/measurement/measurement-events.js",
    "src/views/history/history-view.js",
    "src/views/journal/journal-view.js",
    "src/views/more/more-view.js"
  ];
  const content = (await Promise.all(files.map(read))).join("\n");
  assert.doesNotMatch(content, /zostanie podłączony w etapie/i);
  assert.doesNotMatch(content, /pamięci bieżącej sesji/i);
});
