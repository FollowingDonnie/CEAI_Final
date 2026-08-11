import { createHash } from "node:crypto";
import { CatalogueBundleSchema, CatalogueSnapshotSchema, type CatalogueBundle, type CatalogueSnapshot } from "../../shared/types.js";
import { seedCatalogue } from "./seed.js";
import { parseCsv, sheetTabs, sheetTablesToBundle, type SheetTables } from "./sheet-format.js";

export interface CatalogueRepositoryOptions {
  sheetId?: string;
  refreshSeconds?: number;
  maxStaleMinutes?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

const digest = (bundle: CatalogueBundle) => createHash("sha256").update(JSON.stringify(bundle)).digest("hex").slice(0, 16);

export class CatalogueRepository {
  private snapshot: CatalogueSnapshot;
  private refreshPromise: Promise<CatalogueSnapshot> | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly sheetId?: string;
  private readonly refreshMs: number;
  private readonly maxStaleMs: number;

  constructor(options: CatalogueRepositoryOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.sheetId = options.sheetId;
    this.refreshMs = (options.refreshSeconds ?? 60) * 1000;
    this.maxStaleMs = (options.maxStaleMinutes ?? 30) * 60 * 1000;
    const bundle = CatalogueBundleSchema.parse(seedCatalogue);
    this.snapshot = CatalogueSnapshotSchema.parse({
      ...bundle,
      snapshotId: `seed-${digest(bundle)}`,
      observedAt: this.now().toISOString(),
      sourceKind: "governed_seed",
      freshness: "current",
      diagnostics: this.sheetId ? ["Live catalogue is configured but has not refreshed yet."] : ["Using governed prototype catalogue."],
    });
  }

  getSnapshot(): CatalogueSnapshot {
    const age = this.now().getTime() - new Date(this.snapshot.observedAt).getTime();
    if (!this.sheetId && this.snapshot.sourceKind === "governed_seed") return { ...this.snapshot, freshness: "current" };
    const freshness = age <= this.refreshMs ? "current" : age <= this.maxStaleMs ? "stale" : "expired";
    return { ...this.snapshot, freshness };
  }

  async refresh(force = false): Promise<CatalogueSnapshot> {
    if (!this.sheetId) return this.getSnapshot();
    const current = this.getSnapshot();
    const age = this.now().getTime() - new Date(current.observedAt).getTime();
    if (!force && age < this.refreshMs) return current;
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.loadGoogleSheet().finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }

  private async loadGoogleSheet(): Promise<CatalogueSnapshot> {
    const candidateTables = {} as SheetTables;
    try {
      for (const tab of sheetTabs) {
        const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(this.sheetId!)}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
        const response = await this.fetchWithRetry(url);
        candidateTables[tab] = parseCsv(await response.text());
      }
      const bundle = sheetTablesToBundle(candidateTables);
      const candidate = CatalogueSnapshotSchema.parse({
        ...bundle,
        snapshotId: `sheet-${digest(bundle)}`,
        observedAt: this.now().toISOString(),
        sourceKind: "google_sheets",
        freshness: "current",
        diagnostics: [],
      });
      this.snapshot = candidate;
      return candidate;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown catalogue refresh error";
      this.snapshot = { ...this.snapshot, diagnostics: [`Refresh rejected: ${message}`] };
      return this.getSnapshot();
    }
  }

  private async fetchWithRetry(url: string): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await this.fetchImpl(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (response.ok) return response;
        if (![429, 500, 503].includes(response.status)) throw new Error(`Catalogue request failed (${response.status})`);
        lastError = new Error(`Catalogue request failed (${response.status})`);
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * (2 ** attempt)));
    }
    throw lastError instanceof Error ? lastError : new Error("Catalogue refresh failed");
  }
}
