import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const workerUrl = new URL("../../sw.js", import.meta.url);

async function workerSource() {
  return readFile(workerUrl, "utf8");
}

function createWorkerRuntime(source) {
  const handlers = new Map();
  const puts = [];
  const deletedCaches = [];
  const clientMessages = [];
  const fetched = [];
  let claimed = 0;
  let skipped = 0;
  const shell = new Response("offline-shell", { status: 200, headers: { "content-type": "text/html" } });
  const cache = {
    async put(url, response) { puts.push({ url: String(url), response }); },
    async match(url) {
      return String(url).endsWith("/index.html") ? shell.clone() : null;
    }
  };
  const context = {
    console,
    URL,
    Set,
    Promise,
    Error,
    Request,
    Response,
    fetch: async request => {
      const url = typeof request === "string" ? request : request.url;
      fetched.push(url);
      return new Response(`network:${url}`, { status: 200 });
    },
    caches: {
      async open() { return cache; },
      async keys() { return ["sag-setup-logbook-old", "other-cache"]; },
      async delete(name) { deletedCaches.push(name); return true; }
    },
    self: {
      registration: { scope: "https://example.test/app/" },
      location: { origin: "https://example.test" },
      addEventListener(type, handler) { handlers.set(type, handler); },
      async skipWaiting() { skipped += 1; },
      clients: {
        async claim() { claimed += 1; },
        async matchAll() {
          return [{ postMessage(message) { clientMessages.push(message); } }];
        }
      }
    }
  };
  vm.runInNewContext(source, context, { filename: "sw.js" });
  return {
    handlers,
    puts,
    fetched,
    deletedCaches,
    clientMessages,
    get claimed() { return claimed; },
    get skipped() { return skipped; }
  };
}

test("każdy zasób wpisany do precache istnieje w repozytorium", async () => {
  const source = await workerSource();
  const block = source.match(/const PRECACHE_URLS = \[(.*?)\];/s)?.[1];
  assert.ok(block, "Nie znaleziono listy PRECACHE_URLS");
  const paths = [...block.matchAll(/"(\.\/[^"\n]+)"/g)].map(match => match[1]);
  assert.ok(paths.length > 80, "Precache powinien obejmować cały modułowy app shell");
  for (const path of paths) {
    if (path === "./") continue;
    const fileUrl = new URL(`../../${path.slice(2)}`, import.meta.url);
    assert.equal(existsSync(fileUrl), true, `Brak pliku precache: ${path}`);
  }
});

test("instalacja zapisuje pełny app shell bez automatycznego przejęcia aktualizacji", async () => {
  const runtime = createWorkerRuntime(await workerSource());
  let pending;
  runtime.handlers.get("install")({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.ok(runtime.fetched.length > 80);
  assert.equal(runtime.puts.length, runtime.fetched.length);
  assert.equal(runtime.skipped, 0);
});

test("aktywacja usuwa wyłącznie stare cache aplikacji i przejmuje klientów", async () => {
  const runtime = createWorkerRuntime(await workerSource());
  let pending;
  runtime.handlers.get("activate")({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(runtime.deletedCaches, ["sag-setup-logbook-old"]);
  assert.equal(runtime.claimed, 1);
  assert.equal(runtime.clientMessages.length, 1);
  assert.equal(runtime.clientMessages[0].type, "PWA_ACTIVATED");
  assert.equal(runtime.clientMessages[0].version, "0.9.0");
});

test("nawigacja offline zwraca zapisany index aplikacji", async () => {
  const runtime = createWorkerRuntime(await workerSource());
  let responsePromise;
  runtime.handlers.get("fetch")({
    request: { method: "GET", mode: "navigate", url: "https://example.test/app/anything" },
    respondWith(value) { responsePromise = value; }
  });
  const response = await responsePromise;
  assert.equal(await response.text(), "offline-shell");
});

test("nowy worker pomija oczekiwanie wyłącznie po komunikacie użytkownika", async () => {
  const runtime = createWorkerRuntime(await workerSource());
  runtime.handlers.get("message")({ data: { type: "OTHER" }, source: null });
  assert.equal(runtime.skipped, 0);
  runtime.handlers.get("message")({ data: { type: "SKIP_WAITING" }, source: null });
  assert.equal(runtime.skipped, 1);
});
