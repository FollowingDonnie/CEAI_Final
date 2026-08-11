import type { CatalogueSnapshot, Door, GeometryViolation, Placement, PlanState, Variant } from "../../shared/types.js";

export interface Rectangle { x: number; z: number; width: number; length: number }

export function rotatedDimensions(variant: Variant, rotationDeg: number, operating = false) {
  const width = operating ? variant.geometry.operatingWidthMm : variant.geometry.widthMm;
  const length = operating ? variant.geometry.operatingLengthMm : variant.geometry.lengthMm;
  if (width == null || length == null) return null;
  return rotationDeg % 180 === 0 ? { width, length } : { width: length, length: width };
}

export function footprintRect(variant: Variant, placement: Placement): Rectangle {
  const size = rotatedDimensions(variant, placement.rotationDeg)!;
  return { x: placement.xMm, z: placement.zMm, ...size };
}

export function operatingRect(variant: Variant, placement: Placement): Rectangle | null {
  const footprint = rotatedDimensions(variant, placement.rotationDeg);
  const operating = rotatedDimensions(variant, placement.rotationDeg, true);
  if (!footprint || !operating) return null;
  return {
    x: placement.xMm - (operating.width - footprint.width) / 2,
    z: placement.zMm - (operating.length - footprint.length) / 2,
    ...operating,
  };
}

export function overlap(a: Rectangle, b: Rectangle): { x: number; z: number; area: number } | null {
  const x = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const z = Math.min(a.z + a.length, b.z + b.length) - Math.max(a.z, b.z);
  return x > 0 && z > 0 ? { x, z, area: x * z } : null;
}

function doorRect(door: Door, roomWidth: number, roomLength: number): Rectangle {
  const depth = door.widthMm;
  switch (door.wall) {
    case "north": return { x: door.offsetMm, z: 0, width: door.widthMm, length: depth };
    case "south": return { x: door.offsetMm, z: roomLength - depth, width: door.widthMm, length: depth };
    case "west": return { x: 0, z: door.offsetMm, width: depth, length: door.widthMm };
    case "east": return { x: roomWidth - depth, z: door.offsetMm, width: depth, length: door.widthMm };
  }
}

const sharedStation = (a: Variant, b: Variant) => new Set([a.category, b.category]).size === 2 && [a.category, b.category].includes("rack") && [a.category, b.category].includes("bench");

export function validatePlacements(state: PlanState, snapshot: CatalogueSnapshot, placements = state.placements): Placement[] {
  const roomWidth = state.requirements.room.widthMm.value;
  const roomLength = state.requirements.room.lengthMm.value;
  const roomHeight = state.requirements.room.heightMm.value;
  const floor = state.requirements.room.flooringBuildUpMm.value ?? 0;
  const byId = new Map(snapshot.variants.map((item) => [item.variantId, item]));

  return placements.map((placement) => {
    const variant = byId.get(placement.variantId);
    const violations: GeometryViolation[] = [];
    if (!variant || roomWidth == null || roomLength == null || roomHeight == null) {
      violations.push({ code: "MISSING_DIMENSIONS", message: "Room or product dimensions are not provided.", itemIds: [placement.placementId] });
      return { ...placement, validationStatus: "invalid", violations };
    }
    const footprint = footprintRect(variant, placement);
    const operating = operatingRect(variant, placement);
    if (footprint.x < 0 || footprint.z < 0 || footprint.x + footprint.width > roomWidth || footprint.z + footprint.length > roomLength) {
      violations.push({ code: "ROOM_BOUNDS", message: `${variant.name} crosses the recorded room boundary.`, itemIds: [placement.placementId] });
    }
    const usableHeight = roomHeight - floor;
    const requiredHeight = variant.geometry.operatingHeightMm ?? variant.geometry.heightMm;
    if (requiredHeight > usableHeight) {
      violations.push({ code: "CEILING_TOO_LOW", message: `${variant.name} needs ${requiredHeight.toLocaleString()} mm but the usable height is ${usableHeight.toLocaleString()} mm.`, itemIds: [placement.placementId], requiredMm: requiredHeight, availableMm: usableHeight });
    }
    if ((variant.anchoringMode === "floor_required" || variant.anchoringMode === "wall_required") && state.requirements.mountingPermission.value !== true) {
      violations.push({ code: "ANCHORING_CONDITION_UNMET", message: `${variant.name} requires ${variant.anchoringMode === "wall_required" ? "wall" : "floor"} mounting permission.`, itemIds: [placement.placementId] });
    }
    if (!operating) {
      violations.push({ code: "MISSING_OPERATING_ENVELOPE", message: `${variant.name} has no governed operating envelope.`, itemIds: [placement.placementId] });
    } else {
      for (const door of state.requirements.doors) {
        const crossing = overlap(operating, doorRect(door, roomWidth, roomLength));
        if (crossing) violations.push({ code: "DOOR_SWING_BLOCKED", message: `${variant.name}'s use area overlaps the ${door.wall} door swing by ${Math.round(Math.min(crossing.x, crossing.z)).toLocaleString()} mm.`, itemIds: [placement.placementId, door.doorId], overlapMm: Math.round(Math.min(crossing.x, crossing.z)) });
      }
    }

    for (const other of placements) {
      if (other.placementId === placement.placementId || other.placementId.localeCompare(placement.placementId) < 0) continue;
      const otherVariant = byId.get(other.variantId);
      if (!otherVariant || sharedStation(variant, otherVariant)) continue;
      const footprintCrossing = overlap(footprint, footprintRect(otherVariant, other));
      if (footprintCrossing) {
        const locked = placement.locked && other.locked;
        violations.push({
          code: locked ? "LOCKED_ITEMS_CONFLICT" : "FOOTPRINT_COLLISION",
          message: `${variant.name} overlaps ${otherVariant.name}${locked ? "; both are locked" : ""}.`,
          itemIds: [placement.placementId, other.placementId],
          overlapMm: Math.round(Math.min(footprintCrossing.x, footprintCrossing.z)),
        });
      }
      const otherOperating = operatingRect(otherVariant, other);
      if (operating && otherOperating) {
        const operatingCrossing = overlap(operating, otherOperating);
        if (operatingCrossing) violations.push({ code: "OPERATING_CLEARANCE_COLLISION", message: `${variant.name}'s operating area overlaps ${otherVariant.name}.`, itemIds: [placement.placementId, other.placementId], overlapMm: Math.round(Math.min(operatingCrossing.x, operatingCrossing.z)) });
      }
    }
    return { ...placement, validationStatus: violations.length ? "invalid" : "valid", violations };
  });
}

export function allGeometryViolations(placements: Placement[]): GeometryViolation[] {
  const seen = new Set<string>();
  return placements.flatMap((placement) => placement.violations).filter((violation) => {
    const key = `${violation.code}:${[...violation.itemIds].sort().join(":")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function coordinateProjection(placement: Placement, variant: Variant) {
  const size = rotatedDimensions(variant, placement.rotationDeg)!;
  return {
    twoD: { xMm: placement.xMm, zMm: placement.zMm, widthMm: size.width, lengthMm: size.length },
    threeD: { x: (placement.xMm + size.width / 2) / 1000, y: variant.geometry.heightMm / 2000, z: (placement.zMm + size.length / 2) / 1000 },
  };
}
