import { parseCsv } from "./csv.mjs";

const JSON_FIELDS = new Set(["configuration_schema_json", "identification_clues_json", "conditions_json", "limitations_json"]);
const REQUIRED_COLUMNS = [
  "record_type", "ecosystem_id", "rack_family_id", "rack_version_id", "display_name", "height_variant",
  "configuration_schema_json", "identification_clues_json", "active", "attachment_id", "sku", "category_id",
  "product_url", "relationship_id", "evidence_state", "rationale", "conditions_json", "limitations_json",
  "evidence_source_title", "evidence_source_url", "source_date", "last_verified_at", "review_due_at", "reviewer",
  "record_status", "price", "currency", "stock_state", "commerce_source", "commerce_updated_at",
  "definition_id", "definition_label", "definition_text"
];

export class RegistryUnavailableError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "RegistryUnavailableError";
  }
}

export async function fetchRegistry({ url, fetchImpl = fetch, now = new Date() } = {}) {
  if (!url) throw new RegistryUnavailableError("The live compatibility registry is not configured.");
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("advisor_request", `${now.getTime()}-${crypto.randomUUID()}`);
  let response;
  try {
    response = await fetchImpl(requestUrl, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "text/csv", "Cache-Control": "no-cache, no-store, max-age=0", Pragma: "no-cache" },
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    throw new RegistryUnavailableError("The live compatibility registry could not be reached.", error);
  }
  if (!response.ok) throw new RegistryUnavailableError(`The live compatibility registry returned HTTP ${response.status}.`);
  const retrievedAt = new Date();
  let rows;
  try {
    rows = parseCsv(await response.text());
  } catch (error) {
    throw new RegistryUnavailableError("The live compatibility registry is not valid CSV.", error);
  }
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !(column in (rows[0] || {})));
  if (!rows.length || missingColumns.length) {
    throw new RegistryUnavailableError(`The live registry schema is incomplete${missingColumns.length ? `: ${missingColumns.join(", ")}` : "."}`);
  }
  return normalizeRegistry(rows, retrievedAt);
}

export function normalizeRegistry(rows, retrievedAt = new Date()) {
  const registry = { racks: [], attachments: [], relationships: [], commerce: [], definitions: [], retrievedAt: retrievedAt.toISOString() };
  for (const source of rows) {
    const record = { ...source, __issues: [] };
    for (const field of JSON_FIELDS) {
      if (!record[field]) {
        record[field.replace(/_json$/, "")] = [];
        continue;
      }
      try {
        const value = JSON.parse(record[field]);
        if (!Array.isArray(value)) throw new Error("expected an array");
        record[field.replace(/_json$/, "")] = value;
      } catch {
        record[field.replace(/_json$/, "")] = [];
        record.__issues.push(`malformed_${field}`);
      }
    }
    record.active = parseBoolean(record.active, record.__issues);
    if (record.record_type === "rack") registry.racks.push(record);
    else if (record.record_type === "attachment") registry.attachments.push(record);
    else if (record.record_type === "relationship") registry.relationships.push(record);
    else if (record.record_type === "commerce") registry.commerce.push(record);
    else if (record.record_type === "definition") registry.definitions.push(record);
  }
  return registry;
}

function parseBoolean(value, issues) {
  if (value === "true") return true;
  if (value === "false" || value === "") return false;
  issues.push("malformed_active");
  return false;
}
