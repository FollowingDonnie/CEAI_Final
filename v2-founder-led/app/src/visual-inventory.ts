import type { Placement, PlanState, Variant } from "../shared/types.js";

export type VisualMode =
  | "flooring"
  | "racked_barbell"
  | "loose_barbell"
  | "stored_plates"
  | "stacked_plates"
  | "mounted_attachment"
  | "stored_bands"
  | "loose_accessory";

export interface VisualInventoryItem {
  variant: Variant;
  mode: VisualMode;
  xMm: number;
  zMm: number;
  rotationDeg: 0 | 90;
  parentVariantId: string | null;
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

function placedVariant(placements: Placement[], catalogue: Variant[], category: Variant["category"]) {
  const placement = placements.find((candidate) => catalogue.find((item) => item.variantId === candidate.variantId)?.category === category);
  const variant = placement ? catalogue.find((item) => item.variantId === placement.variantId) : undefined;
  return placement && variant ? { placement, variant } : null;
}

function footprint(item: { placement: Placement; variant: Variant }) {
  const rotated = item.placement.rotationDeg % 180 !== 0;
  return {
    width: rotated ? item.variant.geometry.lengthMm : item.variant.geometry.widthMm,
    length: rotated ? item.variant.geometry.widthMm : item.variant.geometry.lengthMm,
  };
}

export function deriveVisualInventory(state: PlanState, catalogue: Variant[]): VisualInventoryItem[] {
  const roomWidth = state.requirements.room.widthMm.value ?? 0;
  const roomLength = state.requirements.room.lengthMm.value ?? 0;
  const placedIds = new Set(state.placements.map((placement) => placement.variantId));
  const unplaced = state.selectedItems.map((id) => catalogue.find((item) => item.variantId === id)).filter((item): item is Variant => item != null && !placedIds.has(item.variantId));
  const rack = placedVariant(state.placements, catalogue, "rack");
  const storage = placedVariant(state.placements, catalogue, "storage");
  const rackSize = rack ? footprint(rack) : null;
  const storageSize = storage ? footprint(storage) : null;
  const hasPlateStorage = state.selectedItems.includes("a18-plate-storage");
  let looseIndex = 0;

  return unplaced.map((variant): VisualInventoryItem => {
    if (variant.category === "flooring") {
      const width = Math.min(roomWidth, variant.geometry.widthMm);
      const length = Math.min(roomLength, variant.geometry.lengthMm);
      const centreX = rack && rackSize ? rack.placement.xMm + rackSize.width / 2 : roomWidth / 2;
      const centreZ = rack && rackSize ? rack.placement.zMm + rackSize.length / 2 : roomLength / 2;
      return { variant, mode: "flooring", xMm: clamp(centreX - width / 2, 0, roomWidth - width), zMm: clamp(centreZ - length / 2, 0, roomLength - length), rotationDeg: 0, parentVariantId: rack?.variant.variantId ?? null };
    }

    if (variant.category === "barbell" && rack && rackSize) {
      const rotated = rack.placement.rotationDeg % 180 !== 0;
      return rotated
        ? { variant, mode: "racked_barbell", xMm: rack.placement.xMm + rackSize.width * .28, zMm: rack.placement.zMm + rackSize.length / 2 - variant.geometry.widthMm / 2, rotationDeg: 90, parentVariantId: rack.variant.variantId }
        : { variant, mode: "racked_barbell", xMm: rack.placement.xMm + rackSize.width / 2 - variant.geometry.widthMm / 2, zMm: rack.placement.zMm + rackSize.length * .28, rotationDeg: 0, parentVariantId: rack.variant.variantId };
    }

    if (variant.category === "barbell") {
      return { variant, mode: "loose_barbell", xMm: clamp((roomWidth - variant.geometry.widthMm) / 2, 100, Math.max(100, roomWidth - variant.geometry.widthMm - 100)), zMm: 120, rotationDeg: 0, parentVariantId: null };
    }

    if (variant.category === "plates" && storage && storageSize) {
      return { variant, mode: "stored_plates", xMm: storage.placement.xMm + storageSize.width / 2, zMm: storage.placement.zMm + storageSize.length / 2, rotationDeg: storage.placement.rotationDeg % 180 === 0 ? 0 : 90, parentVariantId: storage.variant.variantId };
    }

    if (variant.category === "plates" && rack && rackSize && hasPlateStorage) {
      return { variant, mode: "stored_plates", xMm: rack.placement.xMm + rackSize.width / 2, zMm: rack.placement.zMm + rackSize.length * .72, rotationDeg: rack.placement.rotationDeg % 180 === 0 ? 0 : 90, parentVariantId: rack.variant.variantId };
    }

    if (variant.category === "plates") {
      const size = Math.min(520, variant.geometry.widthMm);
      const x = rack && rackSize ? rack.placement.xMm + rackSize.width + 140 : 180;
      const z = rack ? rack.placement.zMm + 140 : 180;
      return { variant, mode: "stacked_plates", xMm: clamp(x, 80, Math.max(80, roomWidth - size - 80)), zMm: clamp(z, 80, Math.max(80, roomLength - size - 80)), rotationDeg: 0, parentVariantId: null };
    }

    if (variant.category === "attachment" && rack) {
      return { variant, mode: "mounted_attachment", xMm: rack.placement.xMm, zMm: rack.placement.zMm, rotationDeg: rack.placement.rotationDeg % 180 === 0 ? 0 : 90, parentVariantId: rack.variant.variantId };
    }

    if (variant.category === "bands" && rack) {
      return { variant, mode: "stored_bands", xMm: rack.placement.xMm, zMm: rack.placement.zMm, rotationDeg: rack.placement.rotationDeg % 180 === 0 ? 0 : 90, parentVariantId: rack.variant.variantId };
    }

    const offset = looseIndex++ * 360;
    return { variant, mode: "loose_accessory", xMm: clamp(120 + offset, 80, Math.max(80, roomWidth - 420)), zMm: clamp(roomLength - 420, 80, Math.max(80, roomLength - 420)), rotationDeg: 0, parentVariantId: null };
  });
}
