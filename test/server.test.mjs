import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { createAdvisorServer } from "../server.mjs";

const csv = await readFile(new URL("../registry-template/northstar-registry.csv", import.meta.url), "utf8");

async function withServer(options, callback) {
  const server = createAdvisorServer(options);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { server.close(); await once(server, "close"); }
}

test("health reveals configuration without touching the external source", async () => {
  let calls = 0;
  await withServer({ registryUrl: "https://sheet.example.invalid/registry.csv", fetchImpl: async () => { calls += 1; return new Response(csv); }, openAiKey: "" }, async (base) => {
    const response = await fetch(`${base}/api/health`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.registryConfigured, true);
    assert.equal(data.decisionGuideConfigured, false);
    assert.equal(calls, 0);
  });
});

test("options and decisions each perform a fresh external request", async () => {
  let calls = 0;
  await withServer({ registryUrl: "https://sheet.example.invalid/registry.csv", fetchImpl: async () => { calls += 1; return new Response(csv, { status: 200 }); }, openAiKey: "" }, async (base) => {
    const options = await fetch(`${base}/api/options`);
    assert.equal(options.status, 200);
    const decision = await fetch(`${base}/api/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rackVersionId: "atlas_v2_220", configuration: { stabilisation: "floor_anchored" } }) });
    const data = await decision.json();
    assert.equal(decision.status, 200);
    assert.equal(data.rack.rackVersionId, "atlas_v2_220");
    assert.equal(calls, 2);
    assert.match(decision.headers.get("cache-control"), /no-store/);
  });
});

test("source failure returns 503 and no result payload", async () => {
  await withServer({ registryUrl: "https://sheet.example.invalid/registry.csv", fetchImpl: async () => { throw new Error("offline"); }, openAiKey: "" }, async (base) => {
    const response = await fetch(`${base}/api/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await response.json();
    assert.equal(response.status, 503);
    assert.equal(data.error, "registry_unavailable");
    assert.equal("results" in data, false);
  });
});
