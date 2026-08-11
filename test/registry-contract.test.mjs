import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseCsv } from "../src/csv.mjs";
import { normalizeRegistry } from "../src/registry.mjs";
import { evaluateDecision, listOptions } from "../src/decision-engine.mjs";

const NOW = new Date("2026-08-11T12:00:00Z");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_UTC_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

async function loadFixture() {
  const csv = await readFile(new URL("../registry-template/northstar-registry.csv", import.meta.url), "utf8");
  const rows = parseCsv(csv);
  return { rows, registry: normalizeRegistry(rows, NOW) };
}

test("commerce source rows stay aligned with their declared columns", async () => {
  const { rows, registry } = await loadFixture();
  const sourceRows = rows.filter((row) => row.record_type === "commerce");
  assert.equal(sourceRows.length, 2);
  assert.deepEqual(sourceRows.map((row) => ({
    attachmentId: row.attachment_id,
    price: row.price,
    currency: row.currency,
    stockState: row.stock_state,
    source: row.commerce_source,
    updatedAt: row.commerce_updated_at
  })), [
    { attachmentId: "att_spotter", price: "149.00", currency: "EUR", stockState: "in_stock", source: "Northstar fictional commerce feed", updatedAt: "2026-08-10T08:00:00Z" },
    { attachmentId: "att_cable", price: "399.00", currency: "EUR", stockState: "preorder", source: "Northstar fictional commerce feed", updatedAt: "2026-07-01T08:00:00Z" }
  ]);
  assert.ok(sourceRows.every((row) => row.record_status === "" && row.definition_id === ""));

  const decision = evaluateDecision(registry, {
    ecosystemId: "northstar_demo",
    rackVersionId: "atlas_v2_220",
    categoryId: null,
    configuration: { stabilisation: "floor_anchored" },
    conditionAnswers: {}
  }, NOW);
  const spotter = decision.results.find((result) => result.attachmentId === "att_spotter");
  assert.deepEqual(spotter.commerce, {
    current: true,
    price: "149.00",
    currency: "EUR",
    stockState: "in_stock",
    source: "Northstar fictional commerce feed",
    updatedAt: "2026-08-10T08:00:00Z"
  });
});

test("definition source rows stay aligned and reach live options intact", async () => {
  const { rows, registry } = await loadFixture();
  const sourceRows = rows.filter((row) => row.record_type === "definition");
  assert.equal(sourceRows.length, 3);
  assert.deepEqual(sourceRows.map((row) => row.definition_id), ["exact_version", "evidence_state", "compatibility_freshness"]);
  assert.deepEqual(sourceRows.map((row) => row.definition_label), ["Exact model / version", "Evidence state", "Compatibility checked"]);
  assert.ok(sourceRows.every((row) => row.definition_text.length > 40));
  assert.ok(sourceRows.every((row) => row.commerce_updated_at === "" && row.price === ""));

  const options = listOptions(registry, "northstar_demo");
  assert.deepEqual(options.definitions.map(({ id, label }) => ({ id, label })), [
    { id: "exact_version", label: "Exact model / version" },
    { id: "evidence_state", label: "Evidence state" },
    { id: "compatibility_freshness", label: "Compatibility checked" }
  ]);
});

test("governed source and commerce dates remain ISO text rather than spreadsheet serials", async () => {
  const { rows, registry } = await loadFixture();
  const relationships = rows.filter((row) => row.record_type === "relationship");
  const commerce = rows.filter((row) => row.record_type === "commerce");
  assert.ok(relationships.every((row) => ISO_DATE.test(row.source_date)));
  assert.ok(relationships.every((row) => ISO_UTC_DATETIME.test(row.last_verified_at) && ISO_UTC_DATETIME.test(row.review_due_at)));
  assert.ok(commerce.every((row) => ISO_UTC_DATETIME.test(row.commerce_updated_at)));
  assert.ok([...relationships, ...commerce].every((row) => !/^\d+(?:\.\d+)?$/.test(row.source_date || row.last_verified_at || row.commerce_updated_at)));

  const spotter = registry.relationships.find((row) => row.relationship_id === "rel-v2-spotter");
  assert.equal(spotter.source_date, "2026-06-01");
  assert.equal(spotter.last_verified_at, "2026-08-01T09:00:00Z");
  assert.equal(spotter.review_due_at, "2027-06-01T00:00:00Z");
});
