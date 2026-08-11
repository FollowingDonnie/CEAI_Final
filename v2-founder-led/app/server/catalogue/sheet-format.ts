import Papa from "papaparse";
import { CatalogueBundleSchema, CompatibilityRelationSchema, VariantSchema, type CatalogueBundle } from "../../shared/types.js";

export const sheetTabs = [
  "Products",
  "Variants",
  "Geometry",
  "RackInterfaces",
  "Clearances",
  "Compatibility",
  "PricesStock",
  "TrainingTags",
  "Sources",
  "Evidence",
  "ValidationLists",
] as const;

export type SheetTab = (typeof sheetTabs)[number];
export type SheetTables = Record<SheetTab, Array<Record<string, string>>>;

const json = (value: unknown) => JSON.stringify(value);

export function bundleToSheetTables(bundle: CatalogueBundle): SheetTables {
  const productRows = new Map<string, Record<string, string>>();
  for (const item of bundle.variants) {
    productRows.set(item.productId, {
      product_id: item.productId,
      category: item.category,
      family_id: item.familyId,
      customer_name: item.name,
      short_description: item.description,
      lifecycle_status: item.active ? "active" : "inactive",
      skill_levels: json(item.skillLevels),
    });
  }

  return {
    Products: [...productRows.values()],
    Variants: bundle.variants.map((item) => ({
      variant_id: item.variantId,
      product_id: item.productId,
      sku: item.sku,
      configuration: item.configuration,
      anchoring_mode: item.anchoringMode,
      generation: item.generation ?? "",
      declared_load_kg: item.declaredLoadKg?.toString() ?? "",
      declared_load_type: item.declaredLoadType ?? "",
      steel_gauge_mm: item.steelGaugeMm?.toString() ?? "",
      priority_weight: item.priorityWeight.toString(),
      evidence_status: item.evidenceStatus,
      active: item.active ? "TRUE" : "FALSE",
    })),
    Geometry: bundle.variants.map((item) => ({
      geometry_id: `geometry-${item.variantId}`,
      variant_id: item.variantId,
      shape_type: "rectangle",
      width_mm: item.geometry.widthMm.toString(),
      length_mm: item.geometry.lengthMm.toString(),
      height_mm: item.geometry.heightMm.toString(),
      operating_width_mm: item.geometry.operatingWidthMm?.toString() ?? "",
      operating_length_mm: item.geometry.operatingLengthMm?.toString() ?? "",
      operating_height_mm: item.geometry.operatingHeightMm?.toString() ?? "",
      local_origin: "north_west",
      orientation_reference: "length_on_z",
      geometry_version: item.geometry.geometryVersion,
    })),
    RackInterfaces: bundle.variants
      .filter((item) => item.rackInterface)
      .map((item) => ({
        interface_id: `interface-${item.variantId}`,
        variant_id: item.variantId,
        role: item.rackInterface!.role,
        ecosystem: item.rackInterface!.ecosystem ?? "",
        upright_actual_mm: item.rackInterface!.uprightActualMm?.toString() ?? "",
        hole_diameter_mm: item.rackInterface!.holeDiameterMm?.toString() ?? "",
        hardware_class: item.rackInterface!.hardwareClass ?? "",
        pin_diameter_mm: item.rackInterface!.pinDiameterMm?.toString() ?? "",
        spacing_pattern: item.rackInterface!.spacingPattern ?? "",
        mounting_faces: json(item.rackInterface!.mountingFaces),
        required_depth_mm: item.rackInterface!.requiredDepthMm?.toString() ?? "",
        generation: item.rackInterface!.generation ?? "",
      })),
    Clearances: bundle.variants.map((item) => ({
      clearance_id: `clearance-${item.variantId}`,
      variant_id: item.variantId,
      clearance_type: "operating_envelope",
      operating_state: "active",
      shape_type: "rectangle",
      width_mm: item.geometry.operatingWidthMm?.toString() ?? "",
      length_mm: item.geometry.operatingLengthMm?.toString() ?? "",
      max_y_mm: item.geometry.operatingHeightMm?.toString() ?? "",
      hardness: "hard",
      overlap_policy: "no_hard_overlap",
      source_type: item.evidenceStatus === "assumption" ? "northstar_assumption" : "governed_spec",
      policy_version: "geometry-2026-08",
      label: "Operating area",
    })),
    Compatibility: bundle.compatibility.map((relation) => ({
      relationship_id: relation.relationshipId,
      host_variant_id: relation.hostVariantId,
      attachment_variant_id: relation.attachmentVariantId,
      state: relation.state,
      adapter_variant_id: relation.adapterVariantId ?? "",
      conditions: json(relation.conditions),
      failed_reason_codes: json(relation.failedReasonCodes),
      evidence_ids: json(relation.evidenceIds),
      reviewed_at: relation.reviewedAt,
      policy_version: relation.policyVersion,
      active: relation.active ? "TRUE" : "FALSE",
    })),
    PricesStock: bundle.variants.map((item) => ({
      sku: item.sku,
      region: "IE",
      currency: "EUR",
      gross_price_cents: item.priceCents?.toString() ?? "",
      tax_basis: "prototype_gross",
      delivery_price_cents: item.deliveryPriceCents?.toString() ?? "",
      delivery_status: item.deliveryPriceCents === null ? "unknown" : item.deliveryPriceCents === 0 ? "included" : "known",
      stock_state: item.stockState,
      stock_quantity: item.stockQuantity?.toString() ?? "",
      observed_at: item.observedAt,
      valid_until: item.validUntil ?? "",
      commercial_version: "commercial-2026-08",
    })),
    TrainingTags: bundle.variants.flatMap((item) =>
      item.tags.map((tag) => ({
        variant_id: item.variantId,
        capability: tag,
        suitability: "supported",
        priority_weight: item.priorityWeight.toString(),
        evidence_or_policy_id: `evidence-${item.variantId}`,
      })),
    ),
    Sources: [{
      source_id: "source-northstar-prototype",
      url: "/catalogue-evidence.html",
      publisher: "Northstar prototype",
      title: "Northstar governed prototype specification",
      document_type: "controlled_prototype_spec",
      accessed_at: "2026-08-11",
      region: "IE/EU",
      active: "TRUE",
    }],
    Evidence: bundle.variants.map((item) => ({
      evidence_id: `evidence-${item.variantId}`,
      source_id: "source-northstar-prototype",
      target_type: "variant",
      target_id: item.variantId,
      field_or_relation: "customer_critical_specification",
      status: item.evidenceStatus,
      confidence: item.evidenceStatus === "verified" ? "high" : "medium",
      reviewer: "Northstar research-led prototype",
    })),
    ValidationLists: [
      ["category", "rack"], ["category", "attachment"], ["category", "bench"],
      ["compatibility_state", "explicitly_compatible"],
      ["compatibility_state", "compatible_with_condition"],
      ["compatibility_state", "dimensionally_matching_but_unapproved"],
      ["compatibility_state", "incompatible"],
      ["compatibility_state", "insufficient_information"],
    ].map(([listName, allowedValue]) => ({
      list_name: listName,
      allowed_value: allowedValue,
      schema_version: bundle.schemaVersion,
      active: "TRUE",
    })),
  };
}

function requiredMap(rows: Array<Record<string, string>>, field: string, tab: string) {
  const map = new Map<string, Record<string, string>>();
  for (const row of rows) {
    const key = row[field]?.trim();
    if (!key) throw new Error(`${tab}: missing ${field}`);
    if (map.has(key)) throw new Error(`${tab}: duplicate ${field} ${key}`);
    map.set(key, row);
  }
  return map;
}

const optionalNumber = (value: string | undefined) => value?.trim() ? Number(value) : null;
const requiredNumber = (value: string | undefined, name: string) => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`Invalid number for ${name}`);
  return result;
};
const bool = (value: string | undefined) => value?.trim().toLowerCase() === "true";
const parseJson = <T>(value: string | undefined, fallback: T): T => value?.trim() ? JSON.parse(value) as T : fallback;

export function sheetTablesToBundle(tables: SheetTables): CatalogueBundle {
  const products = requiredMap(tables.Products, "product_id", "Products");
  requiredMap(tables.Variants, "variant_id", "Variants");
  const geometry = requiredMap(tables.Geometry, "variant_id", "Geometry");
  const interfaces = requiredMap(tables.RackInterfaces, "variant_id", "RackInterfaces");
  const commercialBySku = requiredMap(tables.PricesStock, "sku", "PricesStock");
  const tags = new Map<string, string[]>();
  for (const row of tables.TrainingTags) {
    const current = tags.get(row.variant_id) ?? [];
    current.push(row.capability);
    tags.set(row.variant_id, current);
  }

  const variants = tables.Variants.map((row) => {
    const product = products.get(row.product_id);
    const geo = geometry.get(row.variant_id);
    const commercial = commercialBySku.get(row.sku);
    if (!product || !geo || !commercial) throw new Error(`Variant ${row.variant_id} has a missing foreign key`);
    const iface = interfaces.get(row.variant_id);
    return VariantSchema.parse({
      variantId: row.variant_id,
      productId: row.product_id,
      sku: row.sku,
      name: product.customer_name,
      category: product.category,
      familyId: product.family_id,
      configuration: row.configuration,
      description: product.short_description,
      active: bool(row.active),
      priceCents: optionalNumber(commercial.gross_price_cents),
      stockState: commercial.stock_state,
      stockQuantity: optionalNumber(commercial.stock_quantity),
      deliveryPriceCents: optionalNumber(commercial.delivery_price_cents),
      observedAt: commercial.observed_at,
      validUntil: commercial.valid_until || null,
      geometry: {
        widthMm: requiredNumber(geo.width_mm, "width_mm"),
        lengthMm: requiredNumber(geo.length_mm, "length_mm"),
        heightMm: requiredNumber(geo.height_mm, "height_mm"),
        operatingWidthMm: optionalNumber(geo.operating_width_mm),
        operatingLengthMm: optionalNumber(geo.operating_length_mm),
        operatingHeightMm: optionalNumber(geo.operating_height_mm),
        geometryVersion: geo.geometry_version,
      },
      anchoringMode: row.anchoring_mode,
      tags: tags.get(row.variant_id) ?? ["general_fitness"],
      skillLevels: parseJson(product.skill_levels, ["beginner"]),
      priorityWeight: requiredNumber(row.priority_weight, "priority_weight"),
      generation: row.generation || null,
      rackInterface: iface ? {
        role: iface.role,
        ecosystem: iface.ecosystem || null,
        uprightActualMm: optionalNumber(iface.upright_actual_mm),
        holeDiameterMm: optionalNumber(iface.hole_diameter_mm),
        hardwareClass: iface.hardware_class || null,
        pinDiameterMm: optionalNumber(iface.pin_diameter_mm),
        spacingPattern: iface.spacing_pattern || null,
        mountingFaces: parseJson(iface.mounting_faces, []),
        requiredDepthMm: optionalNumber(iface.required_depth_mm),
        generation: iface.generation || null,
      } : null,
      declaredLoadKg: optionalNumber(row.declared_load_kg),
      declaredLoadType: row.declared_load_type || null,
      steelGaugeMm: optionalNumber(row.steel_gauge_mm),
      evidenceStatus: row.evidence_status,
      sourceTitle: "Northstar governed prototype specification",
      sourceUrl: "/catalogue-evidence.html",
      sourceCheckedAt: "2026-08-11",
    });
  });

  const compatibility = tables.Compatibility.map((row) => CompatibilityRelationSchema.parse({
    relationshipId: row.relationship_id,
    hostVariantId: row.host_variant_id,
    attachmentVariantId: row.attachment_variant_id,
    state: row.state,
    adapterVariantId: row.adapter_variant_id || null,
    conditions: parseJson(row.conditions, []),
    failedReasonCodes: parseJson(row.failed_reason_codes, []),
    evidenceIds: parseJson(row.evidence_ids, []),
    reviewedAt: row.reviewed_at,
    policyVersion: row.policy_version,
    active: bool(row.active),
  }));

  return CatalogueBundleSchema.parse({ schemaVersion: "catalogue-2.0", variants, compatibility });
}

export function parseCsv(text: string): Array<Record<string, string>> {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  if (parsed.errors.length) throw new Error(parsed.errors.map((error) => error.message).join("; "));
  return parsed.data;
}

export function toCsv(rows: Array<Record<string, string>>): string {
  return Papa.unparse(rows, { newline: "\n" });
}
