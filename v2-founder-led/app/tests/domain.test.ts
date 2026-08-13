import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CatalogueRepository } from "../server/catalogue/repository.js";
import { footprintRect, overlap, validatePlacements } from "../server/domain/geometry.js";
import { calculateQuote } from "../server/domain/quote.js";
import { buildRecommendation } from "../server/domain/recommendation.js";
import { applyRequirementPatches, createPlan, getBlockers, PlanStore } from "../server/domain/state.js";
import type { Placement, RequirementPatch } from "../shared/types.js";
import { deriveVisualInventory } from "../src/visual-inventory.js";

const repository = new CatalogueRepository();
const snapshot = repository.getSnapshot();

const readyPatches: RequirementPatch[] = [
  { field: "journeyType", value: "new_space" },
  { field: "room.lengthMm", value: 4000 },
  { field: "room.widthMm", value: 3000 },
  { field: "room.heightMm", value: 2400 },
  { field: "room.doorConfirmed", value: true },
  { field: "goals", value: ["strength"] },
  { field: "experience", value: "beginner" },
  { field: "priorities", value: ["versatility"] },
  { field: "budgetCents", value: 250000 },
];

describe("canonical state and deterministic engines", () => {
  it("rejects a stale expected version", () => {
    const store = new PlanStore();
    const created = store.create(snapshot);
    store.mutate(created.planId, 0, (state) => applyRequirementPatches(state, [{ field: "journeyType", value: "new_space" }], "control"));
    expect(() => store.mutate(created.planId, 0, (state) => state)).toThrow("STATE_CONFLICT");
  });

  it("stales every derived result after a relevant edit", () => {
    const base = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
    const built = buildRecommendation(base, snapshot);
    const changed = applyRequirementPatches(built, [{ field: "room.heightMm", value: 1980 }], "control");
    expect(changed.recommendation.status).toBe("stale");
    expect(changed.quote.status).toBe("stale");
  });

  it("produces the release fixture plan within EUR 2,500", () => {
    const ready = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
    const built = buildRecommendation(ready, snapshot);
    expect(built.status).toBe("current");
    expect(built.quote.withinBudget).toBe(true);
    expect(built.quote.grandTotalCents).toBeLessThanOrEqual(250000);
    expect(built.placements.every((placement) => placement.validationStatus === "valid")).toBe(true);
  });

  it("rejects a rack above the usable ceiling with exact values", () => {
    let state = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
    state = applyRequirementPatches(state, [{ field: "room.heightMm", value: 1980 }], "control");
    const item = snapshot.variants.find((variant) => variant.variantId === "p40-power-rack-compact")!;
    const placement: Placement = { placementId: "rack", variantId: item.variantId, xMm: 0, zMm: 0, rotationDeg: 0, locked: false, geometryVersion: item.geometry.geometryVersion, validationStatus: "unvalidated", violations: [] };
    const checked = validatePlacements(state, snapshot, [placement])[0];
    expect(checked.violations[0]).toMatchObject({ code: "CEILING_TOO_LOW", requiredMm: 2080, availableMm: 1980 });
  });

  it("rejects a rower use envelope that crosses a door swing", () => {
    const state = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
    state.requirements.doors = [{ doorId: "door", wall: "north", offsetMm: 500, widthMm: 900, swing: "inward_left" }];
    const item = snapshot.variants.find((variant) => variant.variantId === "c10-rower-standard")!;
    const placement: Placement = { placementId: "rower", variantId: item.variantId, xMm: 600, zMm: 0, rotationDeg: 0, locked: false, geometryVersion: item.geometry.geometryVersion, validationStatus: "unvalidated", violations: [] };
    expect(validatePlacements(state, snapshot, [placement])[0].violations.some((violation) => violation.code === "DOOR_SWING_BLOCKED")).toBe(true);
  });

  it("keeps collision overlap symmetric", () => {
    fc.assert(fc.property(
      fc.record({ x: fc.integer({ min: -100, max: 100 }), z: fc.integer({ min: -100, max: 100 }), width: fc.integer({ min: 1, max: 200 }), length: fc.integer({ min: 1, max: 200 }) }),
      fc.record({ x: fc.integer({ min: -100, max: 100 }), z: fc.integer({ min: -100, max: 100 }), width: fc.integer({ min: 1, max: 200 }), length: fc.integer({ min: 1, max: 200 }) }),
      (a, b) => Boolean(overlap(a, b)) === Boolean(overlap(b, a)),
    ));
  });

  it("uses integer cents and distinguishes unknown delivery from included zero", () => {
    const state = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
    const quote = calculateQuote(state, snapshot, ["h30-half-rack-entry", "b20-adjustable-bench-standard"]);
    expect(Number.isInteger(quote.grandTotalCents)).toBe(true);
    expect(quote.lines.find((line) => line.group === "delivery")?.commercialStatus).toBe("current");
  });

  it("projects rotated dimensions deterministically", () => {
    const rack = snapshot.variants.find((variant) => variant.variantId === "h30-half-rack-entry")!;
    const placement: Placement = { placementId: "rack", variantId: rack.variantId, xMm: 10, zMm: 20, rotationDeg: 90, locked: false, geometryVersion: rack.geometry.geometryVersion, validationStatus: "valid", violations: [] };
    expect(footprintRect(rack, placement)).toMatchObject({ x: 10, z: 20, width: 1350, length: 1300 });
  });
});

it("represents every selected non-spatial item without adding false room placements", () => {
  const ready = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
  const built = buildRecommendation(ready, snapshot);
  const inventory = deriveVisualInventory(built, snapshot.variants);
  expect(inventory.find((item) => item.variant.category === "barbell")?.mode).toBe("racked_barbell");
  expect(inventory.find((item) => item.variant.category === "plates")?.mode).toBe("stacked_plates");
  expect(inventory.find((item) => item.variant.category === "flooring")?.mode).toBe("flooring");
  expect(built.placements.some((placement) => snapshot.variants.find((item) => item.variantId === placement.variantId)?.category === "flooring")).toBe(false);
});

it("moves plates onto selected rack storage in the visual inventory", () => {
  const ready = applyRequirementPatches(createPlan(snapshot), readyPatches, "control");
  const built = buildRecommendation(ready, snapshot);
  built.selectedItems.push("a18-plate-storage");
  const inventory = deriveVisualInventory(built, snapshot.variants);
  expect(inventory.find((item) => item.variant.category === "plates")?.mode).toBe("stored_plates");
  expect(inventory.find((item) => item.variant.variantId === "a18-plate-storage")?.mode).toBe("mounted_attachment");
});

  it("quotes an owned rack at an explicit included EUR 0 and carries compatibility evidence", () => {
    let state = applyRequirementPatches(createPlan(snapshot), [
      ...readyPatches.filter((patch) => patch.field !== "journeyType" && patch.field !== "goals"),
      { field: "journeyType", value: "upgrade" },
      { field: "goals", value: ["calisthenics"] },
    ], "control");
    state.existingEquipment = [{ id: "owned-h30", identityKind: "northstar", variantId: "h30-half-rack-entry", evidenceStatus: "verified" }];
    state.blockers = getBlockers(state);
    const built = buildRecommendation(state, snapshot);
    const ownedLine = built.quote.lines.find((line) => line.variantId === "h30-half-rack-entry");
    expect(ownedLine).toMatchObject({ unitPriceCents: 0, lineTotalCents: 0, commercialStatus: "included" });
    expect(built.compatibilityResults[0]).toMatchObject({ state: "explicitly_compatible", allowedInPlan: true });
  });
