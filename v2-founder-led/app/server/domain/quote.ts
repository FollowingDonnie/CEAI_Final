import { randomUUID } from "node:crypto";
import type { CatalogueSnapshot, PlanState, Quote, QuoteLine, Variant } from "../../shared/types.js";

export function calculateQuote(state: PlanState, snapshot: CatalogueSnapshot, itemIds: string[]): Quote {
  const items = itemIds.map((id) => snapshot.variants.find((item) => item.variantId === id)).filter((item): item is Variant => Boolean(item));
  const ownedIds = new Set(state.existingEquipment.flatMap((item) => item.identityKind === "manual" ? [] : [item.variantId]));
  const purchasableItems = items.filter((item) => !ownedIds.has(item.variantId));
  const lines: QuoteLine[] = items.map((item) => {
    const alreadyOwned = ownedIds.has(item.variantId);
    return {
      lineId: randomUUID(),
      group: item.category === "flooring" ? "flooring" : item.category === "attachment" ? "required" : "core",
      variantId: item.variantId,
      sku: item.sku,
      name: item.name,
      quantity: 1,
      unitPriceCents: alreadyOwned ? 0 : item.priceCents,
      lineTotalCents: alreadyOwned ? 0 : item.priceCents,
      inclusionReason: alreadyOwned ? "Already owned; included for room planning" : item.category === "attachment" ? "Required for the selected setup" : item.category === "flooring" ? "Included in the complete room package" : "Selected for the training plan",
      commercialStatus: alreadyOwned ? "included" : item.priceCents == null ? "unknown" : snapshot.freshness === "current" ? "current" : "stale",
    };
  });
  const deliveryValues = purchasableItems.map((item) => item.deliveryPriceCents);
  const deliveryUnknown = deliveryValues.some((value) => value == null);
  const deliveryCents = deliveryUnknown ? null : Math.max(0, ...deliveryValues as number[]);
  lines.push({
    lineId: randomUUID(), group: "delivery", variantId: null, sku: "DELIVERY-IE", name: "Prototype package delivery", quantity: 1,
    unitPriceCents: deliveryCents, lineTotalCents: deliveryCents, inclusionReason: "Known prototype delivery charge for the complete package",
    commercialStatus: deliveryUnknown ? "unknown" : deliveryCents === 0 ? "included" : snapshot.freshness === "current" ? "current" : "stale",
  });
  const knownTotals = lines.map((line) => line.lineTotalCents).filter((value): value is number => value != null);
  const subtotalCents = purchasableItems.some((item) => item.priceCents == null) ? null : knownTotals.reduce((sum, value) => sum + value, 0) - (deliveryCents ?? 0);
  const unknownCharges = deliveryUnknown ? ["Delivery"] : [];
  const grandTotalCents = subtotalCents == null || deliveryCents == null ? null : subtotalCents + deliveryCents;
  const budget = state.requirements.budgetCents.value;
  const overrunCents = grandTotalCents != null && budget != null ? Math.max(0, grandTotalCents - budget) : null;
  return {
    quoteId: randomUUID(),
    status: snapshot.freshness === "expired" || grandTotalCents == null ? "unavailable" : "current",
    lines,
    subtotalCents,
    deliveryCents,
    installationCents: null,
    unknownCharges,
    grandTotalCents,
    withinBudget: grandTotalCents != null && budget != null ? grandTotalCents <= budget : null,
    overrunCents,
    observedAt: snapshot.observedAt,
    requirementsVersion: state.requirementsVersion,
    catalogueSnapshotId: snapshot.snapshotId,
    policyVersion: state.quotePolicyVersion,
  };
}
