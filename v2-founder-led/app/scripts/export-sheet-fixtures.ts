import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { bundleToSheetTables, toCsv } from "../server/catalogue/sheet-format.js";
import { seedCatalogue } from "../server/catalogue/seed.js";

const outputDir = resolve("data/sheets-export");
await mkdir(outputDir, { recursive: true });

for (const [tab, rows] of Object.entries(bundleToSheetTables(seedCatalogue))) {
  await writeFile(resolve(outputDir, `${tab}.csv`), toCsv(rows), "utf8");
}

console.log(`Wrote governed Sheet-ready tabs to ${outputDir}`);
