import { randomUUID } from "node:crypto";
import type { CatalogueSnapshot, PlanState, RequirementField, RequirementPatch } from "../../shared/types.js";

const now = () => new Date().toISOString();

export function emptyField<T>(value: T | null = null, unit: string | null = null): RequirementField<T> {
  return {
    value,
    unit,
    status: value === null ? "unknown" : "confirmed",
    source: value === null ? null : "system",
    lastChangedAt: value === null ? null : now(),
    lastChangedBy: value === null ? null : "system",
  };
}

export function getBlockers(state: PlanState): string[] {
  const blockers: string[] = [];
  if (!state.journeyType.value) blockers.push("journeyType");
  if (state.journeyType.value === "upgrade" && state.existingEquipment.length === 0) blockers.push("existingEquipment");
  if (state.requirements.room.widthMm.value === null) blockers.push("room.widthMm");
  if (state.requirements.room.lengthMm.value === null) blockers.push("room.lengthMm");
  if (state.requirements.room.heightMm.value === null) blockers.push("room.heightMm");
  if (state.journeyType.value !== "upgrade") {
    if (!state.requirements.goals.value?.length) blockers.push("goals");
    if (!state.requirements.experience.value) blockers.push("experience");
    if (state.requirements.budgetCents.value === null) blockers.push("budgetCents");
  }
  return blockers;
}

export function createPlan(snapshot: CatalogueSnapshot): PlanState {
  const state: PlanState = {
    planId: randomUUID(),
    journeyType: emptyField(),
    requirementsVersion: 0,
    catalogueSnapshotId: snapshot.snapshotId,
    compatibilityPolicyVersion: "compat-2026-08",
    geometryPolicyVersion: "geometry-2026-08",
    quotePolicyVersion: "quote-2026-08",
    status: "collecting",
    requirements: {
      room: {
        widthMm: emptyField<number>(null, "mm"),
        lengthMm: emptyField<number>(null, "mm"),
        heightMm: emptyField<number>(null, "mm"),
        flooringBuildUpMm: emptyField(0, "mm"),
        doorConfirmed: emptyField(),
      },
      doors: [],
      goals: emptyField([]),
      originalGoalText: emptyField(),
      experience: emptyField(),
      trainingDaysPerWeek: emptyField<number>(null, "days per week"),
      intendedUsers: emptyField(1, "people"),
      priorities: emptyField([]),
      budgetCents: emptyField<number>(null, "EUR cents"),
      mountingPermission: emptyField(),
      noiseImpactPreference: emptyField("not_sure"),
    },
    existingEquipment: [],
    budgetConsent: { overrunAllowed: false, maximumAuthorisedOverrunCents: null, consentedAt: null },
    selectedItems: [],
    placements: [],
    recommendation: {
      status: "empty",
      candidateIds: [],
      exclusions: [],
      explanationFacts: [],
      compromise: null,
      requirementsVersion: 0,
      catalogueSnapshotId: snapshot.snapshotId,
    },
    compatibilityResults: [],
    quote: {
      quoteId: randomUUID(),
      status: "empty",
      lines: [],
      subtotalCents: null,
      deliveryCents: null,
      installationCents: null,
      unknownCharges: [],
      grandTotalCents: null,
      withinBudget: null,
      overrunCents: null,
      observedAt: null,
      requirementsVersion: 0,
      catalogueSnapshotId: snapshot.snapshotId,
      policyVersion: "quote-2026-08",
    },
    sourceStatus: {
      catalogueFreshness: snapshot.freshness,
      observedAt: snapshot.observedAt,
      refreshError: snapshot.diagnostics.at(-1) ?? null,
    },
    eventVersion: 0,
    blockers: [],
  };
  state.blockers = getBlockers(state);
  return state;
}

function changedField<T>(previous: RequirementField<T>, value: T, source: "chat" | "control"): RequirementField<T> {
  return { ...previous, value, status: "confirmed", source, lastChangedAt: now(), lastChangedBy: "customer" };
}

export function applyRequirementPatches(state: PlanState, patches: RequirementPatch[], source: "chat" | "control"): PlanState {
  const next = structuredClone(state);
  for (const patch of patches) {
    switch (patch.field) {
      case "journeyType": next.journeyType = changedField(next.journeyType, patch.value, source); break;
      case "room.widthMm": next.requirements.room.widthMm = changedField(next.requirements.room.widthMm, Math.round(patch.value), source); break;
      case "room.lengthMm": next.requirements.room.lengthMm = changedField(next.requirements.room.lengthMm, Math.round(patch.value), source); break;
      case "room.heightMm": next.requirements.room.heightMm = changedField(next.requirements.room.heightMm, Math.round(patch.value), source); break;
      case "room.flooringBuildUpMm": next.requirements.room.flooringBuildUpMm = changedField(next.requirements.room.flooringBuildUpMm, Math.round(patch.value), source); break;
      case "room.doorConfirmed": next.requirements.room.doorConfirmed = changedField(next.requirements.room.doorConfirmed, patch.value, source); break;
      case "goals": next.requirements.goals = changedField(next.requirements.goals, patch.value, source); break;
      case "originalGoalText": next.requirements.originalGoalText = changedField(next.requirements.originalGoalText, patch.value, source); break;
      case "experience": next.requirements.experience = changedField(next.requirements.experience, patch.value, source); break;
      case "trainingDaysPerWeek": next.requirements.trainingDaysPerWeek = changedField(next.requirements.trainingDaysPerWeek, Math.round(patch.value), source); break;
      case "intendedUsers": next.requirements.intendedUsers = changedField(next.requirements.intendedUsers, Math.round(patch.value), source); break;
      case "priorities": next.requirements.priorities = changedField(next.requirements.priorities, patch.value, source); break;
      case "budgetCents": next.requirements.budgetCents = changedField(next.requirements.budgetCents, Math.round(patch.value), source); break;
      case "mountingPermission": next.requirements.mountingPermission = changedField(next.requirements.mountingPermission, patch.value, source); break;
      case "noiseImpactPreference": next.requirements.noiseImpactPreference = changedField(next.requirements.noiseImpactPreference, patch.value, source); break;
    }
  }
  next.requirementsVersion += 1;
  next.eventVersion += 1;
  next.blockers = getBlockers(next);
  next.status = next.blockers.length ? "collecting" : "ready";
  if (next.recommendation.status !== "empty") next.recommendation.status = "stale";
  if (next.quote.status !== "empty") next.quote.status = "stale";
  next.placements = next.placements.map((placement) => ({ ...placement, validationStatus: "unvalidated" }));
  return next;
}

interface StoredPlan {
  current: PlanState;
  undo: PlanState[];
  redo: PlanState[];
}

export class PlanStore {
  private plans = new Map<string, StoredPlan>();

  create(snapshot: CatalogueSnapshot): PlanState {
    const current = createPlan(snapshot);
    this.plans.set(current.planId, { current, undo: [], redo: [] });
    return structuredClone(current);
  }

  get(planId: string): PlanState {
    const stored = this.plans.get(planId);
    if (!stored) throw new Error("PLAN_NOT_FOUND");
    return structuredClone(stored.current);
  }

  replace(planId: string, next: PlanState, expectedVersion: number, reversible = true): PlanState {
    const stored = this.plans.get(planId);
    if (!stored) throw new Error("PLAN_NOT_FOUND");
    if (stored.current.eventVersion !== expectedVersion) throw Object.assign(new Error("STATE_CONFLICT"), { current: structuredClone(stored.current) });
    if (reversible) {
      stored.undo.push(structuredClone(stored.current));
      if (stored.undo.length > 20) stored.undo.shift();
      stored.redo = [];
    }
    stored.current = structuredClone(next);
    return structuredClone(stored.current);
  }

  mutate(planId: string, expectedVersion: number, mutator: (state: PlanState) => PlanState, reversible = true): PlanState {
    const current = this.get(planId);
    if (current.eventVersion !== expectedVersion) throw Object.assign(new Error("STATE_CONFLICT"), { current });
    return this.replace(planId, mutator(current), expectedVersion, reversible);
  }

  undo(planId: string, expectedVersion: number): PlanState {
    const stored = this.plans.get(planId);
    if (!stored) throw new Error("PLAN_NOT_FOUND");
    if (stored.current.eventVersion !== expectedVersion) throw Object.assign(new Error("STATE_CONFLICT"), { current: this.get(planId) });
    const prior = stored.undo.pop();
    if (!prior) return this.get(planId);
    stored.redo.push(structuredClone(stored.current));
    prior.eventVersion = stored.current.eventVersion + 1;
    prior.requirementsVersion = Math.max(prior.requirementsVersion, stored.current.requirementsVersion + 1);
    prior.recommendation.status = prior.recommendation.status === "empty" ? "empty" : "stale";
    prior.quote.status = prior.quote.status === "empty" ? "empty" : "stale";
    stored.current = prior;
    return this.get(planId);
  }

  redo(planId: string, expectedVersion: number): PlanState {
    const stored = this.plans.get(planId);
    if (!stored) throw new Error("PLAN_NOT_FOUND");
    if (stored.current.eventVersion !== expectedVersion) throw Object.assign(new Error("STATE_CONFLICT"), { current: this.get(planId) });
    const future = stored.redo.pop();
    if (!future) return this.get(planId);
    stored.undo.push(structuredClone(stored.current));
    future.eventVersion = stored.current.eventVersion + 1;
    future.requirementsVersion = Math.max(future.requirementsVersion, stored.current.requirementsVersion + 1);
    future.recommendation.status = future.recommendation.status === "empty" ? "empty" : "stale";
    future.quote.status = future.quote.status === "empty" ? "empty" : "stale";
    stored.current = future;
    return this.get(planId);
  }
}
