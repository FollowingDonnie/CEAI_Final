import type { CatalogueSnapshot, ExistingEquipment, PlanState, Variant } from "../../shared/types.js";
import { checkCompatibility } from "./compatibility.js";
import { generateLayout } from "./layout.js";
import { calculateQuote } from "./quote.js";
import { searchCatalogue } from "./search.js";

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
      const host: ExistingEquipment = { id: `host-${rack.variantId}`, identityKind: "northstar", variantId: rack.variantId, evidenceStatus: "verified" };
      const jHooks = active(snapshot, "attachment").find((item) => item.tags.includes("required_setup") && checkCompatibility(snapshot, host, item.variantId).allowedInPlan);
      if (!jHooks) continue;
      const core = [rack, jHooks, benches[0], barbells[0], plates[0], flooring[0]].filter(Boolean).map((item) => item.variantId);
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
  const candidates = active(snapshot, "attachment").filter((item) => !item.tags.includes("required_setup") && (!desiredTags.size || item.tags.some((tag) => desiredTags.has(tag))));
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
  const catalogueUnavailable = ["expired", "unavailable"].includes(snapshot.freshness);
  if (next.blockers.length || catalogueUnavailable) {
    next.status = catalogueUnavailable ? "unavailable" : "collecting";
    next.recommendation = { ...next.recommendation, status: catalogueUnavailable ? "unavailable" : "empty" };
    next.eventVersion += 1;
    return next;
  }

  const sets = next.journeyType.value === "upgrade" ? setsForUpgrade(next, snapshot) : setsForNewSpace(next, snapshot);
  const evaluated = sets.map((ids) => {
    const layout = generateLayout(next, snapshot, ids);
    const quote = calculateQuote(next, snapshot, ids);
    const quality = ids.reduce((total, id) => total + (snapshot.variants.find((item) => item.variantId === id)?.priorityWeight ?? 0), 0);
    const budget = next.requirements.budgetCents.value;
    const utilisation = budget && quote.grandTotalCents ? Math.min(1, quote.grandTotalCents / budget) : 0;
    return { ids, layout, quote, score: quality + (utilisation * 12) };
  });
  const valid = evaluated.filter((item) => item.layout.status === "feasible" && item.quote.status === "current" && item.quote.grandTotalCents != null);
  const budgetRequired = next.requirements.budgetCents.value != null;
  const inBudget = valid.filter((item) => !budgetRequired || item.quote.withinBudget).sort((a, b) => b.score - a.score || b.quote.grandTotalCents! - a.quote.grandTotalCents!);
  const overBudget = valid.filter((item) => !item.quote.withinBudget).sort((a, b) => a.quote.grandTotalCents! - b.quote.grandTotalCents!);
  const chosen = inBudget[0] ?? (next.budgetConsent.overrunAllowed ? overBudget.find((item) => (item.quote.overrunCents ?? Infinity) <= (next.budgetConsent.maximumAuthorisedOverrunCents ?? 0)) : undefined);

  if (!chosen) {
    const least = overBudget[0];
    const requestedStrength = (next.requirements.goals.value ?? []).some((goal) => ["strength", "bodybuilding", "barbell_strength"].includes(goal));
    const minimumRackHeight = Math.min(...active(snapshot, "rack").map((item) => item.geometry.operatingHeightMm ?? item.geometry.heightMm));
    const roomHeight = next.requirements.room.heightMm.value ?? 0;
    const lowCeilingFact = requestedStrength && Number.isFinite(minimumRackHeight) && roomHeight < minimumRackHeight
      ? `A standard rack cannot be included because the recorded ${(roomHeight / 1000).toFixed(2)} m ceiling is below the ${(minimumRackHeight / 1000).toFixed(2)} m minimum height of the current rack options.`
      : null;
    next.status = "infeasible";
    next.recommendation = {
      status: "infeasible",
      candidateIds: [],
      exclusions: evaluated.flatMap((item) => item.layout.unplacedItems.map((variantId) => ({ variantId, reasons: item.layout.violations.map((violation) => violation.code) }))),
      explanationFacts: [
        ...(lowCeilingFact ? [lowCeilingFact] : []),
        least?.quote.overrunCents != null ? `The least-cost validated package is EUR ${(least.quote.overrunCents / 100).toFixed(2)} over the current budget.` : "No complete package passes all remaining room and budget checks.",
      ],
      compromise: lowCeilingFact ?? "Revise a room, goal or budget constraint before a plan can be recommended.",
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
  const selectedHasRack = chosen.ids.some((id) => snapshot.variants.find((item) => item.variantId === id)?.category === "rack");
  const requestedStrength = (next.requirements.goals.value ?? []).some((goal) => ["strength", "bodybuilding", "barbell_strength"].includes(goal));
  const minimumRackHeight = Math.min(...active(snapshot, "rack").map((item) => item.geometry.operatingHeightMm ?? item.geometry.heightMm));
  const roomHeight = next.requirements.room.heightMm.value ?? 0;
  const roomConstraint = requestedStrength && !selectedHasRack && Number.isFinite(minimumRackHeight) && roomHeight < minimumRackHeight
    ? `A standard rack was left out because the recorded ${(roomHeight / 1000).toFixed(2)} m ceiling is below the ${(minimumRackHeight / 1000).toFixed(2)} m minimum height of the current rack options.`
    : null;
  next.recommendation = {
    status: "current",
    candidateIds: chosen.ids,
    exclusions: [],
    explanationFacts: [
      "The package covers the recorded primary training goal.",
      ...(roomConstraint ? [roomConstraint] : []),
      "Every placed item passes the recorded room geometry and encoded clearances.",
      next.requirements.budgetCents.value == null ? `The complete known upgrade cost is EUR ${(chosen.quote.grandTotalCents! / 100).toFixed(2)}.` : chosen.quote.withinBudget ? `The complete known quote is EUR ${((next.requirements.budgetCents.value - chosen.quote.grandTotalCents!) / 100).toFixed(2)} under budget.` : `This consented comparison is EUR ${((chosen.quote.overrunCents ?? 0) / 100).toFixed(2)} over budget.`,
    ],
    compromise: roomConstraint ?? (chosen.ids.includes("c20-bike-compact") && (next.requirements.goals.value ?? []).includes("cardio") ? "The compact bike preserves more usable floor area than the rower." : "The plan favours versatility without filling all available floor space."),
    requirementsVersion: next.requirementsVersion,
    catalogueSnapshotId: snapshot.snapshotId,
  };
  next.status = "current";
  next.eventVersion += 1;
  return next;
}

export type ProductAdditionResult =
  | { ok: true; state: PlanState; product: Variant; alreadySelected: boolean }
  | {
    ok: false;
    code: "PRODUCT_NOT_FOUND" | "ITEM_DOES_NOT_FIT" | "BUDGET_EXCEEDED";
    product: Variant | null;
    projectedTotalCents: number | null;
    overrunCents: number | null;
    alternatives: Array<{ variantId: string; name: string; priceCents: number | null }>;
  };

export function addBestMatchingProduct(state: PlanState, snapshot: CatalogueSnapshot, query: string): ProductAdditionResult {
  const normalisedQuery = query.toLowerCase();
  const exactIntent = [
    { pattern: /\bspotter arms?\b/, match: (item: Variant) => item.variantId === "a12-spotter-arms" },
    { pattern: /\bj-?hooks?\b/, match: (item: Variant) => item.variantId === "a08-j-hooks" },
    { pattern: /\b(?:gymnastic |gym )?rings?\b/, match: (item: Variant) => item.variantId === "a32-gym-rings" },
    { pattern: /\bsafety straps?\b/, match: (item: Variant) => item.variantId === "a14-safety-straps" },
    { pattern: /\bdip (?:handles?|bars?|station|attachment)\b/, match: (item: Variant) => item.variantId === "a10-dip-attachment" },
    { pattern: /\blandmine\b/, match: (item: Variant) => item.variantId === "a16-landmine" },
    { pattern: /\bcable (?:kit|attachment|machine|system)\b/, match: (item: Variant) => item.tags.includes("cable_resistance") },
    { pattern: /\brower|rowing machine\b/, match: (item: Variant) => item.variantId === "c10-rower-standard" },
    { pattern: /\b(?:compact )?bike|bicycle\b/, match: (item: Variant) => item.variantId === "c20-bike-compact" },
    { pattern: /\bstepper\b/, match: (item: Variant) => item.variantId === "c30-stepper-compact" },
    { pattern: /\bplate (?:storage|tree|rack)\b/, match: (item: Variant) => item.variantId === "a18-plate-storage" || item.variantId === "st10-storage-vertical" },
  ].find((intent) => intent.pattern.test(normalisedQuery));
  const requestedCategory: Variant["category"] | null = /\b(storage|store|organis(?:e|er|ing)|plate tree)\b/.test(normalisedQuery)
    ? "storage"
    : /\b(rower|rowing machine|bike|bicycle|stepper|cardio machine)\b/.test(normalisedQuery)
      ? "cardio"
      : /\b(spotter arms?|j-?hooks?|rings?|safety straps?|dip (?:handles?|bars?|station|attachment)|landmine|cable (?:kit|attachment|machine|system))\b/.test(normalisedQuery)
        ? "attachment"
        : null;
  const existingHost = state.existingEquipment.find((item) => item.identityKind === "northstar");
  const rackVariantId = state.selectedItems.find((id) => snapshot.variants.find((item) => item.variantId === id)?.category === "rack")
    ?? (existingHost?.identityKind === "northstar" ? existingHost.variantId : undefined);
  const host: ExistingEquipment | null = rackVariantId
    ? { id: `host-${rackVariantId}`, identityKind: "northstar", variantId: rackVariantId, evidenceStatus: "verified" }
    : null;
  const searchPool = exactIntent
    ? snapshot.variants.filter((product) => product.active && ["in_stock", "low_stock"].includes(product.stockState) && exactIntent.match(product))
    : searchCatalogue(snapshot, { text: query }).slice(0, 12);
  const roomHeight = state.requirements.room.heightMm.value;
  const candidates = searchPool.filter((product) => {
    if (!exactIntent && requestedCategory && product.category !== requestedCategory) return false;
    if (roomHeight != null && (product.geometry.operatingHeightMm ?? product.geometry.heightMm) > roomHeight) return false;
    if (product.category !== "attachment") return true;
    return host ? checkCompatibility(snapshot, host, product.variantId, state.selectedItems).allowedInPlan : false;
  }).slice(0, 8);
  if (!candidates.length) {
    return { ok: false, code: "PRODUCT_NOT_FOUND", product: null, projectedTotalCents: null, overrunCents: null, alternatives: [] };
  }

  const evaluated = candidates.map((product) => {
    const ownedHostIds = state.journeyType.value === "upgrade" && host && host.identityKind === "northstar" ? [host.variantId] : [];
    const ids = [...new Set([...ownedHostIds, ...state.selectedItems, product.variantId])];
    const layout = generateLayout(state, snapshot, ids);
    const quote = calculateQuote(state, snapshot, ids);
    return { product, ids, layout, quote };
  });
  const fitting = evaluated.filter((item) => item.layout.status === "feasible" && item.quote.status === "current" && item.quote.grandTotalCents != null);
  const allowed = fitting.find((item) => state.requirements.budgetCents.value == null || item.quote.withinBudget || (
    state.budgetConsent.overrunAllowed
    && (item.quote.overrunCents ?? Infinity) <= (state.budgetConsent.maximumAuthorisedOverrunCents ?? 0)
  ));

  if (!allowed) {
    const leastOver = fitting.sort((a, b) => (a.quote.overrunCents ?? Infinity) - (b.quote.overrunCents ?? Infinity))[0];
    const first = leastOver ?? evaluated[0];
    return {
      ok: false,
      code: leastOver ? "BUDGET_EXCEEDED" : "ITEM_DOES_NOT_FIT",
      product: first.product,
      projectedTotalCents: first.quote.grandTotalCents,
      overrunCents: first.quote.overrunCents,
      alternatives: fitting.slice(0, 3).map((item) => ({ variantId: item.product.variantId, name: item.product.name, priceCents: item.product.priceCents })),
    };
  }

  const alreadySelected = state.selectedItems.includes(allowed.product.variantId);
  if (alreadySelected) return { ok: true, state, product: allowed.product, alreadySelected: true };

  const next = structuredClone(state);
  next.selectedItems = allowed.ids;
  next.placements = allowed.layout.placements;
  next.quote = allowed.quote;
  next.catalogueSnapshotId = snapshot.snapshotId;
  next.sourceStatus = { catalogueFreshness: snapshot.freshness, observedAt: snapshot.observedAt, refreshError: snapshot.diagnostics.at(-1) ?? null };
  next.recommendation = {
    ...next.recommendation,
    status: "current",
    candidateIds: allowed.ids,
    explanationFacts: [
      ...next.recommendation.explanationFacts.filter((fact) => !fact.startsWith("Added ")),
      `Added ${allowed.product.name}; room placement and the complete known quote were recalculated.`,
    ],
    requirementsVersion: next.requirementsVersion,
    catalogueSnapshotId: snapshot.snapshotId,
  };
  next.status = "current";
  next.eventVersion += 1;
  return { ok: true, state: next, product: allowed.product, alreadySelected: false };
}
