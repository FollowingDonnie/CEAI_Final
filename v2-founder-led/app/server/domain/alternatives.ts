import type { CatalogueSnapshot, PlanAlternative, PlanState, Variant } from "../../shared/types.js";
import { generateLayout } from "./layout.js";
import { calculateQuote } from "./quote.js";

const spatialCategories = new Set<Variant["category"]>(["rack", "bench", "cardio", "dumbbells", "kettlebell", "mat", "storage"]);

function area(item: Variant) {
  if (!spatialCategories.has(item.category)) return 0;
  return (item.geometry.operatingWidthMm ?? item.geometry.widthMm) * (item.geometry.operatingLengthMm ?? item.geometry.lengthMm);
}

function candidates(state: PlanState, snapshot: CatalogueSnapshot) {
  const selected = state.selectedItems.map((id) => snapshot.variants.find((item) => item.variantId === id)).filter((item): item is Variant => item != null);
  const anchor = selected.find((item) => item.category === "rack")
    ?? selected.find((item) => item.category === "cardio")
    ?? selected.find((item) => item.category === "dumbbells")
    ?? selected.find((item) => spatialCategories.has(item.category));
  if (!anchor) return [];
  const roomHeight = state.requirements.room.heightMm.value ?? 0;
  const mounting = state.requirements.mountingPermission.value === true;
  const replacements = snapshot.variants.filter((item) => item.active && item.category === anchor.category && ["in_stock", "low_stock"].includes(item.stockState))
    .filter((item) => (item.geometry.operatingHeightMm ?? item.geometry.heightMm) <= roomHeight)
    .filter((item) => mounting || !["floor_required", "wall_required"].includes(item.anchoringMode));

  return replacements.map((replacement) => {
    const itemIds = [...new Set(state.selectedItems.map((id) => id === anchor.variantId ? replacement.variantId : id))];
    const layout = generateLayout(state, snapshot, itemIds);
    const quote = calculateQuote(state, snapshot, itemIds);
    const variants = itemIds.map((id) => snapshot.variants.find((item) => item.variantId === id)).filter((item): item is Variant => item != null);
    return {
      itemIds,
      key: itemIds.join("|"),
      layout,
      quote,
      qualityScore: variants.reduce((total, item) => total + item.priorityWeight, 0),
      openFloorScore: variants.reduce((total, item) => total + area(item), 0),
    };
  }).filter((item) => item.layout.status === "feasible" && item.quote.status === "current" && item.quote.grandTotalCents != null)
    .filter((item) => item.quote.withinBudget || state.budgetConsent.overrunAllowed && (item.quote.overrunCents ?? Infinity) <= (state.budgetConsent.maximumAuthorisedOverrunCents ?? 0));
}

export function buildPlanAlternatives(state: PlanState, snapshot: CatalogueSnapshot): PlanAlternative[] {
  if (state.status !== "current") return [];
  const options = candidates(state, snapshot);
  if (!options.length) return [];
  const budget = state.requirements.budgetCents.value ?? 1;
  const used = new Set<string>();
  const choose = (sorted: typeof options) => sorted.find((item) => !used.has(item.key)) ?? sorted[0];
  const definitions: Array<{ id: PlanAlternative["id"]; label: string; description: string; sorted: typeof options }> = [
    {
      id: "best_overall",
      label: "Best overall",
      description: "Balances product quality, training coverage and sensible use of the available budget.",
      sorted: [...options].sort((a, b) => (b.qualityScore + Math.min(1, b.quote.grandTotalCents! / budget) * 12) - (a.qualityScore + Math.min(1, a.quote.grandTotalCents! / budget) * 12)),
    },
    {
      id: "best_value",
      label: "Best value",
      description: "Keeps the checked training package while reducing the complete known cost.",
      sorted: [...options].sort((a, b) => a.quote.grandTotalCents! - b.quote.grandTotalCents! || b.qualityScore - a.qualityScore),
    },
    {
      id: "most_open_floor",
      label: "Most open floor",
      description: "Uses the smallest checked equipment footprint to preserve flexible training space.",
      sorted: [...options].sort((a, b) => a.openFloorScore - b.openFloorScore || a.quote.grandTotalCents! - b.quote.grandTotalCents!),
    },
  ];
  return definitions.map((definition) => {
    const selected = choose(definition.sorted);
    used.add(selected.key);
    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      itemIds: selected.itemIds,
      totalCents: selected.quote.grandTotalCents!,
      openFloorScore: selected.openFloorScore,
      qualityScore: selected.qualityScore,
    };
  });
}

export function applyPlanAlternative(state: PlanState, snapshot: CatalogueSnapshot, alternativeId: PlanAlternative["id"]): PlanState | null {
  const alternative = buildPlanAlternatives(state, snapshot).find((item) => item.id === alternativeId);
  if (!alternative) return null;
  const layout = generateLayout(state, snapshot, alternative.itemIds);
  const quote = calculateQuote(state, snapshot, alternative.itemIds);
  if (layout.status !== "feasible" || quote.status !== "current" || quote.grandTotalCents == null) return null;
  const next = structuredClone(state);
  next.selectedItems = alternative.itemIds;
  next.placements = layout.placements;
  next.quote = quote;
  next.catalogueSnapshotId = snapshot.snapshotId;
  next.sourceStatus = { catalogueFreshness: snapshot.freshness, observedAt: snapshot.observedAt, refreshError: snapshot.diagnostics.at(-1) ?? null };
  next.recommendation = {
    ...next.recommendation,
    status: "current",
    candidateIds: alternative.itemIds,
    explanationFacts: [`${alternative.label} passes the recorded room, catalogue and complete-quote checks.`],
    compromise: alternative.description,
    requirementsVersion: next.requirementsVersion,
    catalogueSnapshotId: snapshot.snapshotId,
  };
  next.status = "current";
  next.eventVersion += 1;
  return next;
}

export function swapCheckedProduct(state: PlanState, snapshot: CatalogueSnapshot, currentVariantId: string): { state: PlanState; product: Variant } | null {
  const current = snapshot.variants.find((item) => item.variantId === currentVariantId);
  if (!current || !state.selectedItems.includes(currentVariantId) || current.category === "attachment") return null;
  const options = snapshot.variants.filter((item) => item.active && item.category === current.category && item.variantId !== currentVariantId && ["in_stock", "low_stock"].includes(item.stockState))
    .sort((a, b) => b.priorityWeight - a.priorityWeight || (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
  for (const product of options) {
    const itemIds = [...new Set(state.selectedItems.map((id) => id === currentVariantId ? product.variantId : id))];
    const layout = generateLayout(state, snapshot, itemIds);
    const quote = calculateQuote(state, snapshot, itemIds);
    const budgetAllowed = quote.withinBudget || state.budgetConsent.overrunAllowed && (quote.overrunCents ?? Infinity) <= (state.budgetConsent.maximumAuthorisedOverrunCents ?? 0);
    if (layout.status !== "feasible" || quote.status !== "current" || quote.grandTotalCents == null || !budgetAllowed) continue;
    const next = structuredClone(state);
    next.selectedItems = itemIds;
    next.placements = layout.placements;
    next.quote = quote;
    next.catalogueSnapshotId = snapshot.snapshotId;
    next.sourceStatus = { catalogueFreshness: snapshot.freshness, observedAt: snapshot.observedAt, refreshError: snapshot.diagnostics.at(-1) ?? null };
    next.recommendation = {
      ...next.recommendation,
      status: "current",
      candidateIds: itemIds,
      explanationFacts: [`${product.name} replaces ${current.name}; the room and complete known quote were checked again.`],
      compromise: `This is the next suitable ${current.category.replaceAll("_", " ")} option from the current catalogue.`,
      requirementsVersion: next.requirementsVersion,
      catalogueSnapshotId: snapshot.snapshotId,
    };
    next.status = "current";
    next.eventVersion += 1;
    return { state: next, product };
  }
  return null;
}
