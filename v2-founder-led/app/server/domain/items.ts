import type { CatalogueSnapshot, ExistingEquipment, PlanState, Variant } from "../../shared/types.js";
import { checkCompatibility } from "./compatibility.js";
import { generateLayout } from "./layout.js";
import { calculateQuote } from "./quote.js";

export interface CheckedReplacement {
  product: Variant;
  totalCents: number;
  differenceCents: number;
}

function budgetAllowed(state: PlanState, overrunCents: number | null, withinBudget: boolean | null) {
  if (state.requirements.budgetCents.value == null) return true;
  return withinBudget === true || state.budgetConsent.overrunAllowed
    && (overrunCents ?? Infinity) <= (state.budgetConsent.maximumAuthorisedOverrunCents ?? 0);
}

function hostFor(state: PlanState, snapshot: CatalogueSnapshot): ExistingEquipment | null {
  const rackId = state.selectedItems.find((id) => snapshot.variants.find((item) => item.variantId === id)?.category === "rack");
  if (rackId) return { id: `host-${rackId}`, identityKind: "northstar", variantId: rackId, evidenceStatus: "verified" };
  return state.existingEquipment.find((item) => item.identityKind !== "manual") ?? null;
}

export function checkedReplacements(state: PlanState, snapshot: CatalogueSnapshot, currentVariantId: string): CheckedReplacement[] {
  const current = snapshot.variants.find((item) => item.variantId === currentVariantId);
  if (!current || !state.selectedItems.includes(currentVariantId) || current.tags.includes("required_setup")) return [];
  const host = hostFor(state, snapshot);
  return snapshot.variants
    .filter((item) => item.active && item.category === current.category && item.variantId !== currentVariantId && ["in_stock", "low_stock"].includes(item.stockState))
    .filter((item) => item.category !== "attachment" || Boolean(host && checkCompatibility(snapshot, host, item.variantId, state.selectedItems).allowedInPlan))
    .flatMap((product): CheckedReplacement[] => {
      const itemIds = [...new Set(state.selectedItems.map((id) => id === currentVariantId ? product.variantId : id))];
      const layout = generateLayout(state, snapshot, itemIds);
      const quote = calculateQuote(state, snapshot, itemIds);
      if (layout.status !== "feasible" || quote.status !== "current" || quote.grandTotalCents == null || !budgetAllowed(state, quote.overrunCents, quote.withinBudget)) return [];
      return [{ product, totalCents: quote.grandTotalCents, differenceCents: quote.grandTotalCents - (state.quote.grandTotalCents ?? quote.grandTotalCents) }];
    })
    .sort((a, b) => a.totalCents - b.totalCents || b.product.priorityWeight - a.product.priorityWeight);
}

export function replaceCheckedProduct(state: PlanState, snapshot: CatalogueSnapshot, currentVariantId: string, replacementVariantId: string): { state: PlanState; product: Variant } | null {
  const option = checkedReplacements(state, snapshot, currentVariantId).find((item) => item.product.variantId === replacementVariantId);
  const current = snapshot.variants.find((item) => item.variantId === currentVariantId);
  if (!option || !current) return null;
  const itemIds = state.selectedItems.map((id) => id === currentVariantId ? option.product.variantId : id);
  const layout = generateLayout(state, snapshot, itemIds);
  const quote = calculateQuote(state, snapshot, itemIds);
  const next = structuredClone(state);
  next.selectedItems = itemIds;
  next.placements = layout.placements;
  next.quote = quote;
  next.catalogueSnapshotId = snapshot.snapshotId;
  next.recommendation = {
    ...next.recommendation,
    status: "current",
    candidateIds: itemIds,
    explanationFacts: [`${option.product.name} replaces ${current.name}; room fit and the complete quote were checked again.`],
    compromise: `The customer selected this checked ${current.category.replaceAll("_", " ")} alternative.`,
    catalogueSnapshotId: snapshot.snapshotId,
  };
  next.status = "current";
  next.eventVersion += 1;
  return { state: next, product: option.product };
}

export function removeCheckedProduct(state: PlanState, snapshot: CatalogueSnapshot, variantId: string): PlanState | null {
  const product = snapshot.variants.find((item) => item.variantId === variantId);
  if (!product || !state.selectedItems.includes(variantId) || product.tags.includes("required_setup")) return null;
  const removed = new Set([variantId]);
  if (product.category === "rack") {
    for (const id of state.selectedItems) {
      if (snapshot.variants.find((item) => item.variantId === id)?.category === "attachment") removed.add(id);
    }
  }
  const itemIds = state.selectedItems.filter((id) => !removed.has(id));
  const layout = generateLayout(state, snapshot, itemIds);
  if (layout.status !== "feasible") return null;
  const next = structuredClone(state);
  next.selectedItems = itemIds;
  next.placements = layout.placements;
  next.quote = calculateQuote(next, snapshot, itemIds);
  next.compatibilityResults = next.compatibilityResults.filter((result) => !removed.has(result.hostVariantId) && !removed.has(result.attachmentVariantId));
  next.recommendation = {
    ...next.recommendation,
    candidateIds: itemIds,
    explanationFacts: [`${product.name} was removed and the room and quote were checked again.`],
  };
  next.status = "current";
  next.eventVersion += 1;
  return next;
}
