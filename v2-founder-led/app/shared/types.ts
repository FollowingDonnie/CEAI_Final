import { z } from "zod";

export const EvidenceStatusSchema = z.enum([
  "verified",
  "not_provided",
  "conflicting",
  "assumption",
  "not_applicable",
  "unresearched",
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;

export const CategorySchema = z.enum([
  "rack",
  "attachment",
  "bench",
  "cardio",
  "barbell",
  "plates",
  "dumbbells",
  "kettlebell",
  "bands",
  "mat",
  "flooring",
  "storage",
]);
export type Category = z.infer<typeof CategorySchema>;

export const GeometrySchema = z.object({
  widthMm: z.number().int().positive(),
  lengthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  operatingWidthMm: z.number().int().positive().nullable().default(null),
  operatingLengthMm: z.number().int().positive().nullable().default(null),
  operatingHeightMm: z.number().int().positive().nullable().default(null),
  geometryVersion: z.string().min(1),
});
export type Geometry = z.infer<typeof GeometrySchema>;

export const RackInterfaceSchema = z.object({
  role: z.enum(["host", "attachment"]),
  ecosystem: z.string().nullable(),
  uprightActualMm: z.number().positive().nullable(),
  holeDiameterMm: z.number().positive().nullable(),
  hardwareClass: z.string().nullable(),
  pinDiameterMm: z.number().positive().nullable(),
  spacingPattern: z.string().nullable(),
  mountingFaces: z.array(z.enum(["front", "rear", "side", "crossmember", "base"])),
  requiredDepthMm: z.number().int().positive().nullable(),
  generation: z.string().nullable(),
});
export type RackInterface = z.infer<typeof RackInterfaceSchema>;

export const VariantSchema = z.object({
  variantId: z.string().regex(/^[a-z0-9-]+$/),
  productId: z.string().regex(/^[a-z0-9-]+$/),
  sku: z.string().min(2),
  name: z.string().min(2),
  category: CategorySchema,
  familyId: z.string().min(1),
  configuration: z.string().min(1),
  description: z.string().min(1),
  active: z.boolean(),
  priceCents: z.number().int().nonnegative().nullable(),
  stockState: z.enum(["in_stock", "low_stock", "out_of_stock", "unknown"]),
  stockQuantity: z.number().int().nonnegative().nullable(),
  deliveryPriceCents: z.number().int().nonnegative().nullable(),
  observedAt: z.string().datetime(),
  validUntil: z.string().datetime().nullable(),
  geometry: GeometrySchema,
  anchoringMode: z.enum(["none", "recommended", "floor_required", "wall_required"]),
  tags: z.array(z.string()).min(1),
  skillLevels: z.array(z.enum(["beginner", "some_experience", "experienced"])).min(1),
  priorityWeight: z.number().min(0).max(10),
  generation: z.string().nullable(),
  rackInterface: RackInterfaceSchema.nullable(),
  declaredLoadKg: z.number().positive().nullable(),
  declaredLoadType: z.string().nullable(),
  steelGaugeMm: z.number().positive().nullable(),
  evidenceStatus: EvidenceStatusSchema,
  sourceTitle: z.string().min(1),
  sourceUrl: z.string().min(1),
  sourceCheckedAt: z.string().date(),
});
export type Variant = z.infer<typeof VariantSchema>;

export const CompatibilityStateSchema = z.enum([
  "explicitly_compatible",
  "compatible_with_condition",
  "dimensionally_matching_but_unapproved",
  "incompatible",
  "insufficient_information",
]);
export type CompatibilityState = z.infer<typeof CompatibilityStateSchema>;

export const CompatibilityRelationSchema = z.object({
  relationshipId: z.string().min(1),
  hostVariantId: z.string().min(1),
  attachmentVariantId: z.string().min(1),
  state: CompatibilityStateSchema,
  adapterVariantId: z.string().nullable(),
  conditions: z.array(z.string()),
  failedReasonCodes: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  reviewedAt: z.string().datetime(),
  policyVersion: z.string().min(1),
  active: z.boolean(),
});
export type CompatibilityRelation = z.infer<typeof CompatibilityRelationSchema>;

export const CatalogueBundleSchema = z.object({
  schemaVersion: z.string().min(1),
  variants: z.array(VariantSchema).min(1),
  compatibility: z.array(CompatibilityRelationSchema),
});
export type CatalogueBundle = z.infer<typeof CatalogueBundleSchema>;

export const CatalogueSnapshotSchema = CatalogueBundleSchema.extend({
  snapshotId: z.string().min(1),
  observedAt: z.string().datetime(),
  sourceKind: z.enum(["google_sheets", "governed_seed"]),
  freshness: z.enum(["current", "stale", "expired", "unavailable"]),
  diagnostics: z.array(z.string()),
});
export type CatalogueSnapshot = z.infer<typeof CatalogueSnapshotSchema>;

export type RequirementStatus = "unknown" | "provided" | "confirmed" | "conflicted";
export interface RequirementField<T> {
  value: T | null;
  unit: string | null;
  status: RequirementStatus;
  source: "chat" | "control" | "system" | null;
  lastChangedAt: string | null;
  lastChangedBy: "customer" | "mara" | "system" | null;
}

export interface RoomRequirements {
  widthMm: RequirementField<number>;
  lengthMm: RequirementField<number>;
  heightMm: RequirementField<number>;
  flooringBuildUpMm: RequirementField<number>;
  doorConfirmed: RequirementField<boolean>;
}

export interface Door {
  doorId: string;
  wall: "north" | "east" | "south" | "west";
  offsetMm: number;
  widthMm: number;
  swing: "inward_left" | "inward_right" | "outward";
}

export interface ManualEquipment {
  id: string;
  identityKind: "manual";
  name: string;
  widthMm: number;
  lengthMm: number;
  heightMm: number;
  evidenceStatus: "footprint_only";
}

export interface ExistingCatalogueEquipment {
  id: string;
  identityKind: "northstar" | "governed_reference";
  variantId: string;
  evidenceStatus: EvidenceStatus;
}

export type ExistingEquipment = ManualEquipment | ExistingCatalogueEquipment;

export interface Requirements {
  room: RoomRequirements;
  doors: Door[];
  goals: RequirementField<string[]>;
  originalGoalText: RequirementField<string>;
  experience: RequirementField<"beginner" | "some_experience" | "experienced">;
  trainingDaysPerWeek: RequirementField<number>;
  intendedUsers: RequirementField<number>;
  priorities: RequirementField<string[]>;
  budgetCents: RequirementField<number>;
  mountingPermission: RequirementField<boolean>;
  noiseImpactPreference: RequirementField<"low" | "normal" | "not_sure">;
}

export interface GeometryViolation {
  code:
    | "ROOM_BOUNDS"
    | "CEILING_TOO_LOW"
    | "FOOTPRINT_COLLISION"
    | "OPERATING_CLEARANCE_COLLISION"
    | "DOOR_SWING_BLOCKED"
    | "LOCKED_ITEMS_CONFLICT"
    | "ANCHORING_CONDITION_UNMET"
    | "MISSING_DIMENSIONS"
    | "MISSING_OPERATING_ENVELOPE"
    | "BUDGET_EXCEEDED";
  message: string;
  itemIds: string[];
  requiredMm?: number;
  availableMm?: number;
  overlapMm?: number;
}

export interface Placement {
  placementId: string;
  variantId: string;
  xMm: number;
  zMm: number;
  rotationDeg: 0 | 90 | 180 | 270;
  locked: boolean;
  geometryVersion: string;
  validationStatus: "valid" | "invalid" | "footprint_only" | "unvalidated";
  violations: GeometryViolation[];
}

export interface CompatibilityResult {
  hostVariantId: string;
  attachmentVariantId: string;
  state: CompatibilityState;
  label: string;
  conditions: string[];
  unsatisfiedConditions: string[];
  reasonCodes: string[];
  evidenceIds: string[];
  policyVersion: string;
  allowedInPlan: boolean;
}

export interface QuoteLine {
  lineId: string;
  group: "core" | "required" | "flooring" | "delivery" | "optional";
  variantId: string | null;
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number | null;
  lineTotalCents: number | null;
  inclusionReason: string;
  commercialStatus: "current" | "stale" | "unknown" | "included";
}

export interface Quote {
  quoteId: string;
  status: "empty" | "current" | "stale" | "unavailable";
  lines: QuoteLine[];
  subtotalCents: number | null;
  deliveryCents: number | null;
  installationCents: number | null;
  unknownCharges: string[];
  grandTotalCents: number | null;
  withinBudget: boolean | null;
  overrunCents: number | null;
  observedAt: string | null;
  requirementsVersion: number;
  catalogueSnapshotId: string;
  policyVersion: string;
}

export interface Recommendation {
  status: "empty" | "current" | "stale" | "infeasible" | "unavailable";
  candidateIds: string[];
  exclusions: Array<{ variantId: string; reasons: string[] }>;
  explanationFacts: string[];
  compromise: string | null;
  requirementsVersion: number;
  catalogueSnapshotId: string;
}

export interface PlanState {
  planId: string;
  journeyType: RequirementField<"new_space" | "upgrade">;
  requirementsVersion: number;
  catalogueSnapshotId: string;
  compatibilityPolicyVersion: string;
  geometryPolicyVersion: string;
  quotePolicyVersion: string;
  status: "collecting" | "ready" | "checking" | "current" | "needs_review" | "infeasible" | "unavailable";
  requirements: Requirements;
  existingEquipment: ExistingEquipment[];
  budgetConsent: {
    overrunAllowed: boolean;
    maximumAuthorisedOverrunCents: number | null;
    consentedAt: string | null;
  };
  selectedItems: string[];
  placements: Placement[];
  recommendation: Recommendation;
  compatibilityResults: CompatibilityResult[];
  quote: Quote;
  sourceStatus: {
    catalogueFreshness: CatalogueSnapshot["freshness"];
    observedAt: string | null;
    refreshError: string | null;
  };
  eventVersion: number;
  blockers: string[];
}

export type RequirementPatch =
  | { field: "journeyType"; value: "new_space" | "upgrade" }
  | { field: "room.widthMm" | "room.lengthMm" | "room.heightMm" | "room.flooringBuildUpMm"; value: number }
  | { field: "room.doorConfirmed"; value: boolean }
  | { field: "goals" | "priorities"; value: string[] }
  | { field: "originalGoalText"; value: string }
  | { field: "experience"; value: "beginner" | "some_experience" | "experienced" }
  | { field: "trainingDaysPerWeek" | "intendedUsers" | "budgetCents"; value: number }
  | { field: "mountingPermission"; value: boolean }
  | { field: "noiseImpactPreference"; value: "low" | "normal" | "not_sure" };

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  text: string;
  createdAt: string;
}
