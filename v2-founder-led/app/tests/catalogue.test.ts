import { describe, expect, it } from "vitest";
import { CatalogueBundleSchema } from "../shared/types.js";
import { CatalogueRepository } from "../server/catalogue/repository.js";
import { bundleToSheetTables, sheetTablesToBundle, toCsv, type SheetTab } from "../server/catalogue/sheet-format.js";
import { seedCatalogue } from "../server/catalogue/seed.js";

describe("governed catalogue", () => {
  it("contains the research-led launch breadth and validates", () => {
    const parsed = CatalogueBundleSchema.parse(seedCatalogue);
    expect(parsed.variants).toHaveLength(40);
    expect(new Set(parsed.variants.map((item) => item.variantId)).size).toBe(40);
  });

  it("round trips through Sheet-ready tabs", () => {
    const rebuilt = sheetTablesToBundle(bundleToSheetTables(seedCatalogue));
    expect(rebuilt.variants).toHaveLength(40);
    expect(rebuilt.compatibility).toHaveLength(seedCatalogue.compatibility.length);
    expect(rebuilt.variants.find((item) => item.sku === "NS-H30-G2")?.geometry.heightMm).toBe(2200);
  });

  it("rejects duplicate primary keys rather than publishing a partial bundle", () => {
    const tables = bundleToSheetTables(seedCatalogue);
    tables.Variants.push({ ...tables.Variants[0] });
    expect(() => sheetTablesToBundle(tables)).toThrow(/duplicate|expected array/i);
  });

  it("keeps the immutable governed seed usable when no live source is configured", () => {
    let now = new Date("2026-08-11T10:00:00.000Z");
    const repository = new CatalogueRepository({ now: () => now, maxStaleMinutes: 1 });
    now = new Date("2026-08-12T10:00:00.000Z");
    expect(repository.getSnapshot().freshness).toBe("current");
  });

  it("expires a configured live boundary when it cannot establish a fresh snapshot", () => {
    let now = new Date("2026-08-11T10:00:00.000Z");
    const repository = new CatalogueRepository({ sheetId: "configured-sheet", now: () => now, maxStaleMinutes: 1 });
    now = new Date("2026-08-11T10:02:00.000Z");
    expect(repository.getSnapshot().freshness).toBe("expired");
  });

  it("publishes a new snapshot only after a valid live refresh", async () => {
    const tables = bundleToSheetTables(seedCatalogue);
    const price = tables.PricesStock.find((row) => row.sku === "NS-H30-G2")!;
    price.gross_price_cents = "110000";
    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const tab = url.searchParams.get("sheet") as SheetTab;
      return new Response(toCsv(tables[tab]), { status: 200 });
    };
    const repository = new CatalogueRepository({ sheetId: "test-sheet", fetchImpl: fetchImpl as typeof fetch });
    const before = repository.getSnapshot().snapshotId;
    const after = await repository.refresh(true);
    expect(after.sourceKind).toBe("google_sheets");
    expect(after.snapshotId).not.toBe(before);
    expect(after.variants.find((item) => item.sku === "NS-H30-G2")?.priceCents).toBe(110000);
  });

  it("rejects a corrupt Sheet candidate atomically and keeps the last valid snapshot", async () => {
    let tables = bundleToSheetTables(seedCatalogue);
    const fetchImpl = async (input: string | URL | Request) => {
      const url = new URL(String(input));
      const tab = url.searchParams.get("sheet") as SheetTab;
      return new Response(toCsv(tables[tab]), { status: 200 });
    };
    const repository = new CatalogueRepository({ sheetId: "test-sheet", fetchImpl: fetchImpl as typeof fetch });
    const valid = await repository.refresh(true);
    expect(valid.sourceKind).toBe("google_sheets");

    tables = bundleToSheetTables(seedCatalogue);
    tables.Variants.push({ ...tables.Variants[0] });
    const rejected = await repository.refresh(true);

    expect(rejected.snapshotId).toBe(valid.snapshotId);
    expect(rejected.variants).toHaveLength(valid.variants.length);
    expect(rejected.diagnostics.at(-1)).toMatch(/^Refresh rejected:/);
  });
});
