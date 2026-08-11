import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCsv } from "../src/csv.mjs";
import { normalizeRegistry, fetchRegistry, RegistryUnavailableError } from "../src/registry.mjs";
import { evaluateDecision, listOptions } from "../src/decision-engine.mjs";

const fixtureUrl = new URL("../registry-template/northstar-registry.csv", import.meta.url);
const NOW = new Date("2026-08-11T12:00:00Z");

async function fixtureText() { return readFile(fixtureUrl, "utf8"); }
async function fixtureRegistry(text) { return normalizeRegistry(parseCsv(text ?? await fixtureText()), NOW); }

function selection(overrides = {}) {
  return {
    ecosystemId: "northstar_demo",
    rackVersionId: "atlas_v2_220",
    categoryId: null,
    configuration: { stabilisation: "floor_anchored" },
    conditionAnswers: {},
    ...overrides
  };
}

test("fixture exposes three exact rack records and named fictional attachments", async () => {
  const registry = await fixtureRegistry();
  const options = listOptions(registry, "northstar_demo");
  assert.equal(options.racks.length, 3);
  assert.equal(registry.attachments.length, 8);
  assert.equal(registry.attachments[0].display_name, "Northstar V2 Spotter Arms");
  assert.ok(options.categories.some((item) => item.categoryId === "pulley"));
});

test("exact Atlas V2 decision demonstrates all four evidence states", async () => {
  const decision = evaluateDecision(await fixtureRegistry(), selection(), NOW);
  assert.ok(decision.counts.manufacturer_confirmed >= 1);
  assert.ok(decision.counts.condition_dependent >= 1);
  assert.ok(decision.counts.known_incompatible >= 1);
  assert.ok(decision.counts.unknown_review_required >= 1);

  const spotter = decision.results.find((item) => item.attachmentId === "att_spotter");
  assert.equal(spotter.effectiveEvidenceState, "manufacturer_confirmed");
  assert.equal(spotter.provenance.sourceTitle, "Northstar fictional compatibility bulletin A2");
  assert.ok(spotter.purchaseHandoff);

  const dip = decision.results.find((item) => item.attachmentId === "att_dip");
  assert.equal(dip.effectiveEvidenceState, "known_incompatible");
  assert.equal(dip.purchaseHandoff, null);
});

test("condition answers change readiness and purchase gating, never evidence state", async () => {
  const registry = await fixtureRegistry();
  const unresolved = evaluateDecision(registry, selection(), NOW).results.find((item) => item.attachmentId === "att_cable");
  assert.equal(unresolved.effectiveEvidenceState, "condition_dependent");
  assert.equal(unresolved.readiness, "needs_checking");
  assert.equal(unresolved.purchaseHandoff, null);

  const met = evaluateDecision(registry, selection({ conditionAnswers: { cable_stabilised: "met", cable_route_clear: "met" } }), NOW).results.find((item) => item.attachmentId === "att_cable");
  assert.equal(met.effectiveEvidenceState, "condition_dependent");
  assert.equal(met.readiness, "conditions_met");
  assert.ok(met.purchaseHandoff);

  const blocked = evaluateDecision(registry, selection({ conditionAnswers: { cable_stabilised: "not_met", cable_route_clear: "met" } }), NOW).results.find((item) => item.attachmentId === "att_cable");
  assert.equal(blocked.readiness, "blocked");
  assert.equal(blocked.purchaseHandoff, null);
});

test("stale, contradictory, malformed, missing, and cross-brand evidence fail closed", async () => {
  const registry = await fixtureRegistry();
  const v2 = evaluateDecision(registry, selection(), NOW);
  const byId = Object.fromEntries(v2.results.map((item) => [item.attachmentId, item]));
  assert.equal(byId.att_storage.degradedReason, "stale");
  assert.equal(byId.att_jammer.degradedReason, "contradictory");
  assert.equal(byId.att_shelf.degradedReason, "malformed");
  assert.equal(byId.att_rival.degradedReason, "cross_brand");
  for (const id of ["att_storage", "att_jammer", "att_shelf", "att_rival"]) {
    assert.equal(byId[id].effectiveEvidenceState, "unknown_review_required");
    assert.equal(byId[id].purchaseHandoff, null);
  }

  const v1 = evaluateDecision(registry, selection({ rackVersionId: "atlas_v1_220" }), NOW);
  const missing = v1.results.find((item) => item.attachmentId === "att_cable");
  assert.equal(missing.degradedReason, "missing_pairing");
  assert.equal(missing.effectiveEvidenceState, "unknown_review_required");
});

test("missing exact identity produces a support-ready unresolved decision", async () => {
  const decision = evaluateDecision(await fixtureRegistry(), selection({ rackVersionId: "unknown" }), NOW);
  assert.equal(decision.degradedReason, "identity_unresolved");
  assert.equal(decision.results.length, 0);
  assert.match(decision.resolutionAction, /model\/version label/i);
});

test("commerce freshness remains independent of compatibility", async () => {
  const result = evaluateDecision(await fixtureRegistry(), selection(), NOW).results.find((item) => item.attachmentId === "att_cable");
  assert.equal(result.effectiveEvidenceState, "condition_dependent");
  assert.equal(result.commerce.current, false);
  assert.equal(result.commerce.message, "Check current price and availability.");
});

test("every registry fetch bypasses caches and a source change affects the next decision", async () => {
  let csv = await fixtureText();
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(csv, { status: 200, headers: { "Content-Type": "text/csv" } });
  };
  const firstRegistry = await fetchRegistry({ url: "https://sheet.example.invalid/registry.csv", fetchImpl, now: NOW });
  const first = evaluateDecision(firstRegistry, selection(), NOW).results.find((item) => item.attachmentId === "att_spotter");
  assert.equal(first.effectiveEvidenceState, "manufacturer_confirmed");

  csv = csv.replace("rel-v2-spotter,manufacturer_confirmed", "rel-v2-spotter,known_incompatible");
  const secondRegistry = await fetchRegistry({ url: "https://sheet.example.invalid/registry.csv", fetchImpl, now: new Date(NOW.getTime() + 1000) });
  const second = evaluateDecision(secondRegistry, selection(), NOW).results.find((item) => item.attachmentId === "att_spotter");
  assert.equal(second.effectiveEvidenceState, "known_incompatible");
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].url, requests[1].url);
  assert.equal(requests[0].init.cache, "no-store");
  assert.match(requests[0].init.headers["Cache-Control"], /no-store/);
});

test("unavailable external source throws and has no local fallback", async () => {
  await assert.rejects(() => fetchRegistry({ url: "", fetchImpl: async () => new Response("", { status: 200 }) }), RegistryUnavailableError);
  await assert.rejects(() => fetchRegistry({ url: "https://sheet.example.invalid/registry.csv", fetchImpl: async () => { throw new Error("offline"); } }), RegistryUnavailableError);
});

