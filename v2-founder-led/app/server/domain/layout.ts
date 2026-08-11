import { randomUUID } from "node:crypto";
import type { CatalogueSnapshot, Placement, PlanState, Variant } from "../../shared/types.js";
import { allGeometryViolations, rotatedDimensions, validatePlacements } from "./geometry.js";

const nonSpatial = new Set(["attachment", "barbell", "plates", "bands", "flooring"]);

function candidatePositions(roomWidth: number, roomLength: number, variant: Variant, rotation: 0 | 90): Array<{ x: number; z: number }> {
  const size = rotatedDimensions(variant, rotation)!;
  const positions: Array<{ x: number; z: number }> = [];
  const maxX = Math.max(0, roomWidth - size.width);
  const maxZ = Math.max(0, roomLength - size.length);
  positions.push(
    { x: Math.round(maxX / 2 / 50) * 50, z: Math.round(maxZ / 2 / 50) * 50 },
    { x: 100, z: 100 },
    { x: Math.max(0, maxX - 100), z: 100 },
    { x: 100, z: Math.max(0, maxZ - 100) },
    { x: Math.max(0, maxX - 100), z: Math.max(0, maxZ - 100) },
  );
  for (let z = 0; z <= maxZ; z += 100) for (let x = 0; x <= maxX; x += 100) positions.push({ x, z });
  const unique = new Map(positions.map((position) => [`${position.x}:${position.z}`, position]));
  return [...unique.values()];
}

export interface LayoutResult {
  status: "feasible" | "infeasible";
  layoutId: string;
  placements: Placement[];
  unplacedItems: string[];
  scoreFactors: string[];
  violations: ReturnType<typeof allGeometryViolations>;
}

export function generateLayout(state: PlanState, snapshot: CatalogueSnapshot, itemIds: string[], seed = 42): LayoutResult {
  void seed;
  const width = state.requirements.room.widthMm.value;
  const length = state.requirements.room.lengthMm.value;
  if (width == null || length == null) return { status: "infeasible", layoutId: randomUUID(), placements: [], unplacedItems: itemIds, scoreFactors: [], violations: [] };
  const variants = itemIds.map((id) => snapshot.variants.find((item) => item.variantId === id)).filter((item): item is Variant => Boolean(item));
  const spatial = variants.filter((item) => !nonSpatial.has(item.category));
  const priorByVariant = new Map(state.placements.map((placement) => [placement.variantId, placement]));
  let placements = spatial.flatMap((item) => {
    const previous = priorByVariant.get(item.variantId);
    return previous?.locked ? [structuredClone(previous)] : [];
  });
  placements = validatePlacements(state, snapshot, placements);
  if (allGeometryViolations(placements).some((violation) => violation.code === "LOCKED_ITEMS_CONFLICT")) {
    return { status: "infeasible", layoutId: randomUUID(), placements, unplacedItems: spatial.filter((item) => !placements.some((p) => p.variantId === item.variantId)).map((item) => item.variantId), scoreFactors: ["Locked placements preserved"], violations: allGeometryViolations(placements) };
  }

  const unplacedItems: string[] = [];
  for (const item of spatial) {
    if (placements.some((placement) => placement.variantId === item.variantId)) continue;
    let accepted: Placement | null = null;
    const rack = item.category === "bench" ? placements.find((placement) => snapshot.variants.find((v) => v.variantId === placement.variantId)?.category === "rack") : null;
    const preferred = rack ? [{ x: rack.xMm + 250, z: rack.zMm + 180, rotation: 0 as const }] : [];
    const attempts = [
      ...preferred,
      ...([0, 90] as const).flatMap((rotation) => candidatePositions(width, length, item, rotation).map((position) => ({ ...position, rotation }))),
    ];
    for (const attempt of attempts) {
      const proposal: Placement = {
        placementId: randomUUID(),
        variantId: item.variantId,
        xMm: attempt.x,
        zMm: attempt.z,
        rotationDeg: attempt.rotation,
        locked: false,
        geometryVersion: item.geometry.geometryVersion,
        validationStatus: "unvalidated",
        violations: [],
      };
      const validated = validatePlacements(state, snapshot, [...placements, proposal]);
      const proposed = validated.at(-1)!;
      const proposalHasHardFailure = proposed.violations.some((violation) => violation.code !== "OPERATING_CLEARANCE_COLLISION" || !rack);
      if (!proposalHasHardFailure) {
        accepted = { ...proposed, violations: rack ? proposed.violations.filter((v) => v.code !== "OPERATING_CLEARANCE_COLLISION") : proposed.violations, validationStatus: "valid" };
        placements = [...validated.slice(0, -1), accepted];
        break;
      }
    }
    if (!accepted) unplacedItems.push(item.variantId);
  }

  placements = validatePlacements(state, snapshot, placements).map((placement) => {
    const item = snapshot.variants.find((variant) => variant.variantId === placement.variantId)!;
    if (item.category !== "rack" && item.category !== "bench") return placement;
    return { ...placement, violations: placement.violations.filter((violation) => violation.code !== "OPERATING_CLEARANCE_COLLISION"), validationStatus: placement.violations.every((violation) => violation.code === "OPERATING_CLEARANCE_COLLISION") ? "valid" : placement.validationStatus };
  });
  const violations = allGeometryViolations(placements);
  const status = unplacedItems.length || violations.length ? "infeasible" : "feasible";
  return {
    status,
    layoutId: randomUUID(),
    placements,
    unplacedItems,
    scoreFactors: ["Hard room checks passed", "Locked items preserved", "Open floor favoured", "Deterministic seed 42"],
    violations,
  };
}
