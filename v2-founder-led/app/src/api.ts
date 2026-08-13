import type { ChatMessage, PlanAlternative, PlanState, RequirementPatch, Variant } from "../shared/types";

export class ApiError extends Error {
  constructor(public status: number, public body: Record<string, unknown>) {
    super(String(body.message ?? "Request failed"));
  }
}

const apiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${url}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const body = await response.json() as T & Record<string, unknown>;
  if (!response.ok) throw new ApiError(response.status, body);
  return body;
}

export const api = {
  createPlan: () => request<{ state: PlanState; messages: ChatMessage[] }>("/api/plans", { method: "POST" }),
  getPlan: (planId: string) => request<{ state: PlanState; messages: ChatMessage[] }>(`/api/plans/${planId}`),
  patchRequirements: (planId: string, expectedVersion: number, patches: RequirementPatch[]) => request<{ state: PlanState }>(`/api/plans/${planId}/requirements`, { method: "PATCH", body: JSON.stringify({ expectedVersion, patches }) }),
  chat: (planId: string, expectedVersion: number, message: string) => request<{ state: PlanState; message: ChatMessage; service: string }>(`/api/plans/${planId}/chat`, { method: "POST", body: JSON.stringify({ expectedVersion, message }) }),
  recommend: (planId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/recommend`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  getAlternatives: (planId: string) => request<{ alternatives: PlanAlternative[] }>(`/api/plans/${planId}/alternatives`),
  applyAlternative: (planId: string, alternativeId: PlanAlternative["id"], expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/alternatives/${alternativeId}`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  addExisting: (planId: string, expectedVersion: number, equipment: Record<string, unknown>) => request<{ state: PlanState }>(`/api/plans/${planId}/existing-equipment`, { method: "POST", body: JSON.stringify({ expectedVersion, equipment }) }),
  getReplacements: (planId: string, variantId: string) => request<{ replacements: Array<{ product: Variant; totalCents: number; differenceCents: number }> }>(`/api/plans/${planId}/items/${variantId}/replacements`),
  replaceProduct: (planId: string, variantId: string, replacementVariantId: string, expectedVersion: number) => request<{ state: PlanState; product: Variant }>(`/api/plans/${planId}/items/${variantId}/replace`, { method: "POST", body: JSON.stringify({ expectedVersion, replacementVariantId }) }),
  removeItem: (planId: string, variantId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/items/${variantId}/remove`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  addRecommendedItem: (planId: string, expectedVersion: number, query: string) => request<{ state: PlanState; product: Variant; alreadySelected: boolean }>(`/api/plans/${planId}/items/recommended`, { method: "POST", body: JSON.stringify({ expectedVersion, query }) }),
  addDoor: (planId: string, expectedVersion: number, door: Record<string, unknown>) => request<{ state: PlanState }>(`/api/plans/${planId}/doors`, { method: "POST", body: JSON.stringify({ expectedVersion, door }) }),
  updatePlacement: (planId: string, placementId: string, expectedVersion: number, update: Record<string, unknown>) => request<{ state: PlanState }>(`/api/plans/${planId}/placements/${placementId}`, { method: "POST", body: JSON.stringify({ expectedVersion, ...update }) }),
  removePlacement: (planId: string, placementId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/placements/${placementId}/remove`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  regenerateLayout: (planId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/layout/regenerate`, { method: "POST", body: JSON.stringify({ expectedVersion, seed: 42 }) }),
  undo: (planId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/undo`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  redo: (planId: string, expectedVersion: number) => request<{ state: PlanState }>(`/api/plans/${planId}/redo`, { method: "POST", body: JSON.stringify({ expectedVersion }) }),
  consentBudget: (planId: string, expectedVersion: number, maximumOverrunCents: number) => request<{ state: PlanState }>(`/api/plans/${planId}/budget-consent`, { method: "POST", body: JSON.stringify({ expectedVersion, maximumOverrunCents }) }),
  getCatalogue: () => request<{ snapshotId: string; sourceKind: string; freshness: string; observedAt: string; variants: Variant[]; diagnostics: string[] }>("/api/catalogue"),
  refreshCatalogue: () => request<{ snapshotId: string; freshness: string; observedAt: string }>("/api/catalogue/refresh", { method: "POST" }),
  compatibility: (hostVariantId: string, attachmentVariantId: string, selectedItems: string[] = []) => request<Record<string, unknown>>("/api/compatibility", { method: "POST", body: JSON.stringify({ hostVariantId, attachmentVariantId, selectedItems }) }),
};
