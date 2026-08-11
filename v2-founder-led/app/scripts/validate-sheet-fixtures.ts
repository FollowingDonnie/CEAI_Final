import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsv, sheetTabs, sheetTablesToBundle, type SheetTables } from "../server/catalogue/sheet-format.js";
import { seedCatalogue } from "../server/catalogue/seed.js";

const fixtureDir = resolve("data/sheets-export");
const files = (await readdir(fixtureDir)).filter((name) => name.endsWith(".csv")).sort();
const expectedFiles = sheetTabs.map((tab) => `${tab}.csv`).sort();
assert.deepEqual(files, expectedFiles, "Sheet fixture files do not match the governed tab contract");

const tables = {} as SheetTables;
for (const tab of sheetTabs) {
  const text = await readFile(resolve(fixtureDir, `${tab}.csv`), "utf8");
  assert.ok(text.trim().length > 0, `${tab}.csv is empty`);
  tables[tab] = parseCsv(text);
}

const rebuilt = sheetTablesToBundle(tables);
assert.equal(rebuilt.variants.length, seedCatalogue.variants.length, "Variant count changed during CSV round trip");
assert.equal(rebuilt.compatibility.length, seedCatalogue.compatibility.length, "Compatibility count changed during CSV round trip");
assert.deepEqual(rebuilt.variants.map((item) => item.variantId).sort(), seedCatalogue.variants.map((item) => item.variantId).sort(), "Variant IDs changed during CSV round trip");
assert.deepEqual(rebuilt.compatibility.map((item) => item.relationshipId).sort(), seedCatalogue.compatibility.map((item) => item.relationshipId).sort(), "Compatibility IDs changed during CSV round trip");

for (const source of seedCatalogue.variants) {
  const item = rebuilt.variants.find((candidate) => candidate.variantId === source.variantId);
  assert.ok(item, `Missing variant ${source.variantId}`);
  assert.deepEqual({
    sku: item.sku,
    widthMm: item.geometry.widthMm,
    lengthMm: item.geometry.lengthMm,
    heightMm: item.geometry.heightMm,
    priceCents: item.priceCents,
    stockState: item.stockState,
  }, {
    sku: source.sku,
    widthMm: source.geometry.widthMm,
    lengthMm: source.geometry.lengthMm,
    heightMm: source.geometry.heightMm,
    priceCents: source.priceCents,
    stockState: source.stockState,
  }, `Critical fields changed for ${source.variantId}`);
}

console.log(`Validated ${files.length} Sheet tabs, ${rebuilt.variants.length} variants and ${rebuilt.compatibility.length} compatibility relationships.`);
