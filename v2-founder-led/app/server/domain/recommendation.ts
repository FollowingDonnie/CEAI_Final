import type { CatalogueSnapshot, PlanState, Variant } from "../../shared/types.js";
import { checkCompatibility } from "./compatibility.js";
import { generateLayout } from "./layout.js";
import { calculateQuote } from "./quote.js";

const price = (item: Variant) => item.priceCents ?? Number.MAX_SAFE_INTEGER;

function active(snapshot: CatalogueSnapshot, category: Variant["category"]): Variant[] {
  return snapshot.variants.filter((item) => item.active && item.category === category && ["in_stock", "low_stock"].includes(item.stockState));
}

function setsForNewSpace(state: PlanState, snapshot: CatalogueSnapshot): string[][] {
  const goals = new Set(state.requirements.goals.value ?? []);
  const experience = state.requirements.experience.value ?? "beginner";
  const roomHeight = state.requirements.room.heightMm.value ?? 0;
  const mounting = state.requirements.mountingPermission.value === true;
  const racks = active(snapshot, "rack")
    .filter((item) => (item.geometry.operatingHeightMm ?? item.geometry.heightMm) <= roomHeight)
    .filter((item) => mounting || !["floor_required", "wall_required"].includes(item.anchoringMode))
    .sort((a, b) => {
      const aVersatile = a.variantId === "h30-half-rack-entry" ? -100 : 0;
      const bVersatile = b.variantId === "h30-half-rack-entry" ? -100 : 0;
      return aVersatile - bVersatile || price(a) - price(b);
    });
  const benches = active(snapshot, "bench").sort((a, b) => {
    const preferredA = experience === "beginner" && a.variantId === "b20-adjustable-bench-standard" ? -100 : 0;
    const preferredB = experience === "beginner" && b.variantId === "b20-adjustable-bench-standard" ? -100 : 0;
    return preferredA - preferredB || price(a) - price(b);
  });
  const barbells = active(snapshot, "barbell").sort((a, b) => price(a) - price(b));
  const plates = active(snapshot, "plates").sort((a, b) => price(a) - price(b));
  const flooring = active(snapshot, "flooring").sort((a, b) => price(a) - price(b));
  const cardio = active(snapshot, "cardio").sort((a, b) => {
    const preferredA = a.variantId === "c20-bike-compact" ? -30 : 0;
    const preferredB = b.variantId === "c20-bike-compact" ? -30 : 0;
    return preferredA - preferredB || price(a) - price(b);
  });
  const dumbbells = active(snapshot, "dumbbells").sort((a, b) => price(a) - price(b));
  const mats = active(snapshot, "mat");
  const bands = active(snapshot, "bands");
  const sets: string[][] = [];
  const strength = goals.has("strength") || goals.has("bodybuilding") || goals.has("barbell_strength");
  const wantsCardio = goals.has("cardio") || goals.has("rowing_cardio") || goals.has("cycling_cardio");
  const calisthenics = goals.has("calisthenics") || goals.has("gymnastics");

  if (strength) {
    for (const rack of racks.slice(0, 5)) {
      const core = [rack, benches[0], barbells[0], plates[0], flooring[0]].filter(Boolean).map((item) => item.variantId);
      sets.push(core);
      if (wantsCardio) for (const machine of cardio.slice(0, 2)) sets.push([...core, machine.variantId]);
    }
  }
  if (wantsCardio && !strength) {
    for (const machine of cardio) sets.push([machine.variantId, mats[0]?.variantId, bands[0]?.variantId].filter(Boolean) as string[]);
  }
  if (calisthenics && !strength) {
    for (const rack of racks.filter((item) => item.tags.includes("pull_up")).slice(0, 3)) sets.push([rack.variantId, mats[0]?.variantId, bands[0]?.variantId].filter(Boolean) as string[]);
  }
  if (!sets.length) {
    sets.push([dumbbells[0]?.variantId, benches[0]?.variantId, mats[0]?.variantId, bands[0]?.variantId].filter(Boolean) as string[]);
  }
  return sets;
}

function setsForUpgrade(state: PlanState, snapshot: CatalogueSnapshot): string[][] {
  const host = state.existingEquipment[0];
  if (!host) return [];
  const goals = new Set(state.requirements.goals.value ?? []);
  const desiredTags = new Set<string>();
  if (goals.has("calisthenics")) ["dip", "pull_up"].forEach((tag) => desiredTags.add(tag));
  if (goals.has("bodybuilding")) ["cable_resistance", "free_weight_hypertrophy"].forEach((tag) => desiredTags.add(tag));
  if (goals.has("strength")) ["barbell_strength", "bench_press"].forEach((tag) => desiredTags.add(tag));
  const candidates = active(snapshot, "attachment").filter((item) => !desiredTags.size || item.tags.some((tag) => desiredTags.has(tag)));
  return candidates.flatMap((attachment) => {
    const compatibility = checkCompatibility(snapshot, host, attachment.variantId, state.selectedItems);
    if (compatibility.state === "explicitly_compatible") return [[...(host.identityKind === "manual" ? [] : [host.variantId]), attachment.variantId]];
    const relation = snapshot.compatibility.find((item) => item.hostVariantId === (host.identityKind === "manual" ? "" : host.variantId) && item.attachmentVariantId === attachment.variantId);
    if (compatibility.state === "compatible_with_condition" && relation?.adapterVariantId) return [[host.identityKind === "manual" ? "" : host.variantId, attachment.variantId, relation.adapterVariantId].filter(Boolean)];
    return [];
  });
}

export function buildRecommendation(state: PlanState, snapshot: CatalogueSnapshot): PlanState {
  const next = structuredClone(state);
  next.status = "checking";
  next.catalogueSnapshotId = snapshot.snapshotId;
  next.sourceStatus = { catalogueFreshness: snapshot.freshness, observedAt: snapshot.observedAt, refreshError: snapshot.diagnostics.at(-1) ?? null };
  if (next.blockers.length || snapshot.freshness === "expired") {
    next.status = snapshot.freshness === "expired" ? "unavailable" : "collecting";
    next.recommendation = { ...next.recommendation, status: snapshot.freshness === "expired" ? "unavailable" : "empty" };
    next.eventVersion += 1;
    return next;
  }

  const sets = next.journeyType.value === "upgrade" ? setsForUpgrade(next, snapshot) : setsForNewSpace(next, snapshot);
  const evaluated = sets.map((ids) => {
    const layout = generateLayout(next, snapshot, ids);
    const quote = calculateQuote(next, snapshot, ids);
    return { ids, layout, quote };
  });
  const valid = evaluated.filter((item) => item.layout.status === "feasible" && item.quote.status === "current" && item.quote.grandTotalCents != null);
  const inBudget = valid.filter((item) => item.quote.withinBudget).sort((a, b) => a.quote.grandTotalCents! - b.quote.grandTotalCents!);
  const overBudget = valid.filter((item) => !item.quote.withinBudget).sort((a, b) => a.quote.grandTotalCents! - b.quote.grandTotalCents!);
  const chosen = inBudget[0] ?? (next.budgetConsent.overrunAllowed ? overBudget.find((item) => (item.quote.overrunCents ?? Infinity) <= (next.budgetConsent.maximumAuthorisedOverrunCents ?? 0)) : undefined);

  if (!chosen) {
    const least = overBudget[0];
    next.status = "infeasible";
    next.recommendation = {
      status: "infeasible",
      candidateIds: [],
      exclusions: evaluated.flatMap((item) => item.layout.unplacedItems.map((variantId) => ({ variantId, reasons: item.layout.violations.map((violation) => violation.code) }))),
      explanationFacts: least?.quote.overrunCents != null ? [`The least-cost validated package is EUR ${(least.quote.overrunCents / 100).toFixed(2)} over the current budget.`] : ["No complete package passes the current room and budget checks."],
      compromise: "Revise a room, goal or budget constraint before a plan can be recommended.",
      requirementsVersion: next.requirementsVersion,
      catalogueSnapshotId: snapshot.snapshotId,
    };
    next.quote = least?.quote ?? next.quote;
    next.eventVersion += 1;
    return next;
  }

  next.selectedItems = chosen.ids;
  next.placements = chosen.layout.placements;
  const upgradeHost = next.journeyType.value === "upgrade" ? next.existingEquipment[0] : undefined;
  next.compatibilityResults = upgradeHost
    ? chosen.ids
      .filter((id) => snapshot.variants.find((item) => item.variantId === id)?.category === "attachment")
      .filter((id) => !id.includes("adapter") && !id.includes("stabiliser"))
      .map((attachmentId) => checkCompatibility(snapshot, upgradeHost, attachmentId, chosen.ids))
    : [];
  next.quote = chosen.quote;
  next.recommendation = {
    status: "current",
    candidateIds: chosen.ids,
    exclusions: [],
    explanationFacts: [
      "The package covers the recorded primary training goal.",
      "Every placed item passes the recorded room geometry and encoded clearances.",
      chosen.quote.withinBudget ? `The complete known quote is EUR ${((next.requirements.budgetCents.value! - chosen.quote.grandTotalCents!) / 100).toFixed(2)} under budget.` : `This consented comparison is EUR ${((chosen.quote.overrunCents ?? 0) / 100).toFixed(2)} over budget.`,
    ],
    compromise: chosen.ids.includes("c20-bike-compact") && (next.requirements.goals.value ?? []).includes("cardio") ? "The compact bike preserves more usable floor area than the rower." : "The plan favours versatility without filling all available floor space.",
    requirementsVersion: next.requirementsVersion,
    catalogueSnapshotId: snapshot.snapshotId,
  };
  next.status = "current";
  next.eventVersion += 1;
  return next;
}
