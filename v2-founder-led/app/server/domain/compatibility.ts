import type { CatalogueSnapshot, CompatibilityResult, ExistingEquipment } from "../../shared/types.js";

const labels: Record<CompatibilityResult["state"], string> = {
  explicitly_compatible: "Approved for these versions",
  compatible_with_condition: "Approved with requirement",
  dimensionally_matching_but_unapproved: "Dimensions match; not approved",
  incompatible: "Does not fit this equipment",
  insufficient_information: "Cannot validate with current information",
};

const criticalInterfaceKeys = ["uprightActualMm", "holeDiameterMm", "hardwareClass", "pinDiameterMm", "spacingPattern"] as const;

export function checkCompatibility(
  snapshot: CatalogueSnapshot,
  host: ExistingEquipment,
  attachmentId: string,
  selectedItems: string[] = [],
): CompatibilityResult {
  if (host.identityKind === "manual") {
    return result("manual", attachmentId, "insufficient_information", ["MISSING_CRITICAL_SPEC"], [], [], false);
  }
  const hostVariant = snapshot.variants.find((item) => item.variantId === host.variantId);
  const attachment = snapshot.variants.find((item) => item.variantId === attachmentId);
  if (!hostVariant || !attachment) {
    return result(hostVariant?.variantId ?? "unknown", attachmentId, "insufficient_information", [!hostVariant ? "HOST_UNKNOWN" : "ATTACHMENT_UNKNOWN"], [], [], false);
  }

  const relation = snapshot.compatibility.find((item) => item.active && item.hostVariantId === hostVariant.variantId && item.attachmentVariantId === attachmentId);
  if (relation) {
    const unsatisfied = relation.adapterVariantId && !selectedItems.includes(relation.adapterVariantId)
      ? relation.conditions.length ? relation.conditions : ["Required adapter is not in the plan"]
      : [];
    const allowed = relation.state === "explicitly_compatible" || (relation.state === "compatible_with_condition" && unsatisfied.length === 0);
    return result(hostVariant.variantId, attachmentId, relation.state, relation.failedReasonCodes, relation.conditions, unsatisfied, allowed, relation.evidenceIds, relation.policyVersion);
  }

  const hostInterface = hostVariant.rackInterface;
  const attachmentInterface = attachment.rackInterface;
  if (!hostInterface || !attachmentInterface) {
    return result(hostVariant.variantId, attachmentId, "insufficient_information", ["MISSING_CRITICAL_SPEC"], [], [], false);
  }
  const missing = criticalInterfaceKeys.filter((key) => hostInterface[key] == null || attachmentInterface[key] == null);
  if (missing.length) return result(hostVariant.variantId, attachmentId, "insufficient_information", ["MISSING_CRITICAL_SPEC"], [], [], false);

  const reasons: string[] = [];
  if (hostInterface.generation && attachmentInterface.generation && hostInterface.generation !== attachmentInterface.generation) reasons.push("GENERATION_MISMATCH");
  if (hostInterface.uprightActualMm !== attachmentInterface.uprightActualMm) reasons.push("UPRIGHT_SIZE_MISMATCH");
  if (hostInterface.holeDiameterMm !== attachmentInterface.holeDiameterMm) reasons.push("HOLE_DIAMETER_MISMATCH");
  if (hostInterface.hardwareClass !== attachmentInterface.hardwareClass) reasons.push("HARDWARE_CLASS_MISMATCH");
  if (hostInterface.pinDiameterMm !== attachmentInterface.pinDiameterMm) reasons.push("PIN_DIAMETER_MISMATCH");
  if (hostInterface.spacingPattern !== attachmentInterface.spacingPattern) reasons.push("HOLE_SPACING_MISMATCH");
  if (!attachmentInterface.mountingFaces.some((face) => hostInterface.mountingFaces.includes(face))) reasons.push("MOUNTING_FACE_UNSUPPORTED");

  if (reasons.length) return result(hostVariant.variantId, attachmentId, "incompatible", reasons, [], [], false);
  return result(hostVariant.variantId, attachmentId, "dimensionally_matching_but_unapproved", ["RELATION_NOT_APPROVED"], [], [], false);
}

function result(
  hostVariantId: string,
  attachmentVariantId: string,
  state: CompatibilityResult["state"],
  reasonCodes: string[],
  conditions: string[],
  unsatisfiedConditions: string[],
  allowedInPlan: boolean,
  evidenceIds: string[] = [],
  policyVersion = "compat-2026-08",
): CompatibilityResult {
  return { hostVariantId, attachmentVariantId, state, label: labels[state], conditions, unsatisfiedConditions, reasonCodes, evidenceIds, policyVersion, allowedInPlan };
}
