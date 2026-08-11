import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCsv } from "../src/csv.mjs";
import { normalizeRegistry } from "../src/registry.mjs";
import { GuideUnavailableError, buildGuideContext, runDecisionGuide, validateGuideResponse } from "../src/decision-guide.mjs";

const NOW = new Date("2026-08-11T12:00:00Z");
const body = { question: "Why is this condition-dependent?", ecosystemId: "northstar_demo", rackVersionId: "atlas_v2_220", configuration: { stabilisation: "floor_anchored" }, attachmentId: "att_cable" };

async function registry() {
  const text = await readFile(new URL("../registry-template/northstar-registry.csv", import.meta.url), "utf8");
  return normalizeRegistry(parseCsv(text), NOW);
}

test("guide context contains only validated deterministic facts and allowed references", async () => {
  const context = buildGuideContext(await registry(), body, NOW);
  const relationship = context.records.find((item) => item.recordId === "rel-v2-cable");
  assert.equal(relationship.effectiveEvidenceState, "condition_dependent");
  assert.deepEqual(context.allowedSourceReferences, ["https://northstar.example.invalid/evidence/C7"]);
  assert.equal(context.deterministicDecisionIsReadOnly, true);
});

test("out-of-scope guide request still performs a fresh registry read and refuses without AI", async () => {
  let reads = 0;
  const result = await runDecisionGuide({
    body: { ...body, question: "Will a cross-brand attachment probably fit?" },
    readLiveRegistry: async () => { reads += 1; return registry(); },
    apiKey: "", fetchImpl: async () => { throw new Error("AI must not be called"); }, now: NOW
  });
  assert.equal(reads, 1);
  assert.equal(result.status, "scope_refusal");
  assert.match(result.answer, /cannot confirm cross-brand fit/i);
});

test("AI unavailable keeps the deterministic layer intact after a fresh registry read", async () => {
  let reads = 0;
  await assert.rejects(() => runDecisionGuide({
    body, readLiveRegistry: async () => { reads += 1; return registry(); }, apiKey: "", now: NOW
  }), (error) => error instanceof GuideUnavailableError && error.code === "ai_unavailable");
  assert.equal(reads, 1);
});

test("response-reference validation rejects invented records, sources, actions, and claims", async () => {
  const context = buildGuideContext(await registry(), body, NOW);
  const valid = { answer: "This status depends on both recorded conditions.", record_references: ["rel-v2-cable"], source_references: ["https://northstar.example.invalid/evidence/C7"], suggested_structured_action: "open_evidence" };
  assert.equal(validateGuideResponse(valid, context), true);
  for (const invalid of [
    { ...valid, record_references: ["invented"] },
    { ...valid, source_references: ["https://invented.example"] },
    { ...valid, suggested_structured_action: "buy" },
    { ...valid, answer: "It should fit and is safe to use." }
  ]) assert.throws(() => validateGuideResponse(invalid, context), /could not be verified/i);
});
