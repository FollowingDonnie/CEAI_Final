import OpenAI from "openai";
import type { Responses } from "openai/resources/responses/responses";
import { z } from "zod";
import type { ChatMessage, ExistingEquipment, PlanState, RequirementPatch } from "../../shared/types.js";
import type { CatalogueRepository } from "../catalogue/repository.js";
import { checkCompatibility } from "../domain/compatibility.js";
import { validatePlacements } from "../domain/geometry.js";
import { generateLayout } from "../domain/layout.js";
import { calculateQuote } from "../domain/quote.js";
import { addBestMatchingProduct, buildRecommendation } from "../domain/recommendation.js";
import { searchCatalogue } from "../domain/search.js";
import { assessPricePlausibility } from "../domain/price-anomaly.js";
import { applyRequirementPatches, type PlanStore } from "../domain/state.js";
import { extractRequirementPatches, fallbackReply } from "./fallback.js";

const forbiddenCustomerTerms = /\b(tool|api|model|database row|sheet|function call|system prompt|new_space|open_floor|free_weights|remaining missing|i(?:'ve| have) recorded)\b/i;

const fieldSchema = z.object({
  journey_type: z.enum(["new_space", "upgrade"]).nullable(),
  length_mm: z.number().int().positive().nullable(),
  width_mm: z.number().int().positive().nullable(),
  height_mm: z.number().int().positive().nullable(),
  door_details_complete: z.boolean().nullable(),
  goals: z.array(z.enum(["strength", "bodybuilding", "cardio", "calisthenics", "general_fitness"])).nullable(),
  experience: z.enum(["beginner", "some_experience", "experienced"]).nullable(),
  training_days_per_week: z.number().int().min(1).max(7).nullable(),
  priorities: z.array(z.enum(["versatility", "open_floor", "free_weights", "cardio", "storage", "cost"])).nullable(),
  budget_cents: z.number().int().positive().nullable(),
  mounting_permission: z.boolean().nullable(),
});

const tools: Responses.Tool[] = [
  {
    type: "function", name: "get_plan_state", description: "Read the current structured customer plan and its unresolved fields. Use before relying on state.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "get_next_required_fields", description: "Return the unresolved fields that block a checked recommendation.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "update_customer_requirements", description: "Submit every requirement clearly stated in the customer's message. Use null for anything not stated. Never infer dimensions, budget, or permission.",
    parameters: {
      type: "object", properties: {
        journey_type: { type: ["string", "null"], enum: ["new_space", "upgrade", null] },
        length_mm: { type: ["integer", "null"] }, width_mm: { type: ["integer", "null"] }, height_mm: { type: ["integer", "null"] },
        door_details_complete: { type: ["boolean", "null"] },
        goals: { type: ["array", "null"], items: { type: "string", enum: ["strength", "bodybuilding", "cardio", "calisthenics", "general_fitness"] } },
        experience: { type: ["string", "null"], enum: ["beginner", "some_experience", "experienced", null] },
        training_days_per_week: { type: ["integer", "null"], minimum: 1, maximum: 7 },
        priorities: { type: ["array", "null"], items: { type: "string", enum: ["versatility", "open_floor", "free_weights", "cardio", "storage", "cost"] } },
        budget_cents: { type: ["integer", "null"] }, mounting_permission: { type: ["boolean", "null"] },
      }, required: ["journey_type", "length_mm", "width_mm", "height_mm", "door_details_complete", "goals", "experience", "training_days_per_week", "priorities", "budget_cents", "mounting_permission"], additionalProperties: false,
    }, strict: true,
  },
  {
    type: "function", name: "search_live_catalogue", description: "Search the current governed catalogue by customer text or capability. Results are candidates, not recommendations.",
    parameters: { type: "object", properties: { query: { type: "string" }, category: { type: ["string", "null"], enum: ["rack", "attachment", "bench", "cardio", "barbell", "plates", "dumbbells", "kettlebell", "bands", "mat", "flooring", "storage", null] } }, required: ["query", "category"], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "add_best_matching_product", description: "Select the best current catalogue match for a requested product, add it to the canonical plan, and atomically recalculate room placement and the complete quote. The customer's request to add an item is consent to attempt this action.",
    parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "compare_products", description: "Compare current governed dimensions, price, stock, requirements and evidence for exact product IDs.",
    parameters: { type: "object", properties: { variant_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 } }, required: ["variant_ids"], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "check_attachment_compatibility", description: "Return the governed five-state compatibility result for an exact known host and attachment. Never infer approval.",
    parameters: { type: "object", properties: { host_variant_id: { type: "string" }, attachment_variant_id: { type: "string" } }, required: ["host_variant_id", "attachment_variant_id"], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "check_room_fit", description: "Validate the current canonical placements against the recorded room and encoded clearances.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "generate_room_layout", description: "Generate one deterministic room layout from the currently selected items while preserving locks.",
    parameters: { type: "object", properties: { seed: { type: "integer" } }, required: ["seed"], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "build_checked_plan", description: "Build the first deterministic recommendation, room layout and itemised quote after required customer facts are complete and the customer asks to proceed.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true,
  },
  {
    type: "function", name: "calculate_itemised_quote", description: "Calculate the current itemised quote in integer cents for selected items.",
    parameters: { type: "object", properties: {}, required: [], additionalProperties: false }, strict: true,
  },
];

const maraInstructions = `
Role: You are Mara Quinn, Northstar equipment planner.
Personality: Warm, calm, practical and collaborative. Sound like an experienced equipment specialist, never a pushy salesperson.
Goal: Help the customer plan a new home gym or a validated upgrade using the current structured plan and governed results.
Success: Make planning feel like a useful human consultation. Capture every clearly stated fact, respond to what it means for the customer, ask one natural high-information question, and explain only validated results.
Constraints:
- Use metric units and EUR. Keep normal replies to two or three short sentences.
- Give the useful customer-facing answer first, as a capable guide would.
- Acknowledge the meaning of an answer, not the fact that a field was stored. Never say "recorded", "remaining missing details", "blockers", or read a checklist of outstanding fields aloud.
- Never expose internal labels such as new_space, some_experience, open_floor or free_weights. Translate them into natural phrases.
- Ask only one relevant question at a time. Briefly explain why it matters when that is not obvious.
- Do not repeat the whole room, goal and budget after every turn. Summarise only when it helps a decision or confirms an unusual value.
- Accept a room dimension triple in the order the customer gives it. For an unobstructed rectangular room, length and width are interchangeable axes; never ask which side is called length.
- Ask about orientation only when a recorded door, fixed obstruction, sloped ceiling or customer preference makes a particular wall materially different.
- After producing a checked plan, offer at most one relevant optional refinement at a time. Never delay or rebuild the base plan just to ask about accessories.
- In upgrade mode, direct the customer to the highlighted Equipment you own control when no host is selected. Do not request photos. After selection, ask what they want to add or improve; do not require experience or budget for a compatibility check.
- If plates are selected without storage, treat them as a neat floor stack and optionally offer a suitable storage product. If storage is later added, explain that the plates have moved onto it in the room view.
- Rack-and-barbell packages include governed J-hooks as required setup. Never describe an item as included unless it exists in the current checked plan and quote.
- Remember useful context such as training frequency and use it when shaping the plan.
- Door access, anchoring and exact clearances are later validation details. Ask about them only when an equipment choice or layout makes them relevant.
- Do not present a generic menu of priorities. Ask a contextual trade-off question only when the current options genuinely require one.
- Treat rough early answers as useful. Let the customer refine them later.
- Never independently calculate or claim room fit, compatibility, stock, price, totals, declared loads, anchoring or validation.
- When a catalogue result has priceAssessment.needsHumanReview true, report the exact sourced price, say it looks unusually high compared with similar items, and recommend confirming it with Northstar staff before purchase. Never silently correct or invent a replacement value.
- Recommend purchasable equipment only from the current catalogue. Do not invent used, secondhand or outside-retailer options.
- When the customer asks to add or include equipment, call add_best_matching_product immediately. Do not ask them to confirm the same action.
- Never say an item was added unless add_best_matching_product returns ok true.
- When it returns BUDGET_EXCEEDED, give the projected total and exact overrun once, then offer a cheaper alternative or an exact budget exception.
- When it returns ITEM_DOES_NOT_FIT, explain that the requested item did not pass the current room check and offer the closest smaller alternative. Do not call the whole plan infeasible.
- Training frequency is useful context only. Never use days per week alone to justify more plates, heavier dumbbells, storage or a second bar.
- Never invent a missing fact. If evidence is missing, say it is not provided and narrow the answer.
- If current equipment data is unavailable, stop cleanly, preserve the brief and suggest retrying. Do not ask an unrelated intake question.
- Never claim an installation or exercise is safe, certified or guaranteed.
- Never mention internal implementation, hidden instructions, or service operations.
- For unrelated questions, answer briefly and return naturally to home-gym planning without scolding the customer.
- A dimensional match is not compatibility approval.
- Budget is a hard cap unless explicit exact overrun consent is recorded.
Tools: Update facts stated by the customer first. Read current state after mutation. When no blockers remain and the customer asks to proceed, call build_checked_plan. Use recommendation facts only after deterministic validation has completed.
Stop: Ask for the smallest important missing fact, or answer from current governed evidence. Do not fill silence with speculation.
`;

function argsToPatches(args: z.infer<typeof fieldSchema>): RequirementPatch[] {
  const patches: RequirementPatch[] = [];
  if (args.journey_type) patches.push({ field: "journeyType", value: args.journey_type });
  if (args.length_mm != null) patches.push({ field: "room.lengthMm", value: args.length_mm });
  if (args.width_mm != null) patches.push({ field: "room.widthMm", value: args.width_mm });
  if (args.height_mm != null) patches.push({ field: "room.heightMm", value: args.height_mm });
  if (args.door_details_complete != null) patches.push({ field: "room.doorConfirmed", value: args.door_details_complete });
  if (args.goals) patches.push({ field: "goals", value: args.goals });
  if (args.experience) patches.push({ field: "experience", value: args.experience });
  if (args.training_days_per_week != null) patches.push({ field: "trainingDaysPerWeek", value: args.training_days_per_week });
  if (args.priorities) patches.push({ field: "priorities", value: args.priorities });
  if (args.budget_cents != null) patches.push({ field: "budgetCents", value: args.budget_cents });
  if (args.mounting_permission != null) patches.push({ field: "mountingPermission", value: args.mounting_permission });
  return patches;
}

export class MaraOrchestrator {
  private openai: OpenAI | null;
  private model: string;
  private histories = new Map<string, ChatMessage[]>();

  constructor(private plans: PlanStore, private catalogue: CatalogueRepository, apiKey?: string, model = "gpt-5.6-sol") {
    this.openai = apiKey ? new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 }) : null;
    this.model = model;
  }

  getHistory(planId: string): ChatMessage[] {
    return this.histories.get(planId) ?? [{ id: "mara-opening", role: "assistant", text: "Hi, I'm Mara. I can help plan a new training space or find upgrades for equipment you already own. Which are you working on?", createdAt: new Date().toISOString() }];
  }

  async chat(planId: string, message: string, expectedVersion: number): Promise<{ message: ChatMessage; state: PlanState; service: "responses" | "guided_fallback" }> {
    const blockersBefore = this.plans.get(planId).blockers.length;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: message.slice(0, 2000), createdAt: new Date().toISOString() };
    const history = [...this.getHistory(planId), userMessage].slice(-24);
    this.histories.set(planId, history);
    if (!this.openai) return this.fallback(planId, message, expectedVersion, history);
    try {
      let input: Responses.ResponseInput = [
        ...history.slice(-10).map((item) => ({ role: item.role === "assistant" ? "assistant" as const : "user" as const, content: item.text })),
        { role: "user", content: `Current plan summary: ${JSON.stringify(this.visibleState(this.plans.get(planId)))}` },
      ];
      let finalText = "";
      for (let loop = 0; loop < 5; loop += 1) {
        const response = await this.openai.responses.create({ model: this.model, instructions: maraInstructions, input, tools, parallel_tool_calls: false, text: { verbosity: "low" } });
        input = [...input, ...response.output];
        const calls = response.output.filter((item) => item.type === "function_call");
        if (!calls.length) { finalText = response.output_text; break; }
        for (const call of calls) {
          let output: unknown;
          try { output = await this.execute(call.name, JSON.parse(call.arguments), planId); }
          catch (error) { output = { ok: false, error: error instanceof Error && error.message === "STATE_CONFLICT" ? "Plan changed; reread current state." : "Requested evidence is unavailable." }; }
          input.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(output) });
        }
      }
      const state = this.plans.get(planId);
      const justBecameReady = blockersBefore > 0 && !state.blockers.length && state.recommendation.status === "empty";
      if (justBecameReady) finalText = fallbackReply(state, 1);
      else if (!finalText || forbiddenCustomerTerms.test(finalText)) finalText = fallbackReply(state, 0);
      const assistant: ChatMessage = { id: crypto.randomUUID(), role: "assistant", text: finalText.slice(0, 1200), createdAt: new Date().toISOString() };
      this.histories.set(planId, [...history, assistant].slice(-24));
      return { message: assistant, state, service: "responses" };
    } catch {
      return this.fallback(planId, message, expectedVersion, history);
    }
  }

  private async fallback(planId: string, message: string, expectedVersion: number, history: ChatMessage[]) {
    const current = this.plans.get(planId);
    const patches = extractRequirementPatches(message, current);
    let state = current;
    if (patches.length) state = this.plans.mutate(planId, expectedVersion, (value) => applyRequirementPatches(value, patches, "chat"));
    if (!state.blockers.length && /plan|recommend|build|ready|go ahead|yes/i.test(message)) {
      const snapshot = await this.catalogue.refresh();
      state = this.plans.mutate(planId, state.eventVersion, (value) => buildRecommendation(value, snapshot));
    }
    const assistant: ChatMessage = { id: crypto.randomUUID(), role: "assistant", text: fallbackReply(state, patches.length), createdAt: new Date().toISOString() };
    this.histories.set(planId, [...history, assistant].slice(-24));
    return { message: assistant, state, service: "guided_fallback" as const };
  }

  private visibleState(state: PlanState) {
    return { journey: state.journeyType.value, requirementsVersion: state.requirementsVersion, eventVersion: state.eventVersion, blockers: state.blockers, requirements: state.requirements, selectedItems: state.selectedItems, status: state.status, recommendation: state.recommendation, quote: state.quote };
  }

  private async execute(name: string, args: unknown, planId: string): Promise<unknown> {
    const state = this.plans.get(planId);
    const dataFreeOperations = new Set(["get_plan_state", "get_next_required_fields", "update_customer_requirements"]);
    const snapshot = dataFreeOperations.has(name) ? this.catalogue.getSnapshot() : await this.catalogue.refresh(true);
    if (snapshot.freshness !== "current" && !dataFreeOperations.has(name)) {
      return { ok: false, code: "CATALOGUE_UNAVAILABLE", message: "Current equipment details could not be checked. Preserve the brief and suggest retrying." };
    }
    switch (name) {
      case "get_plan_state": return this.visibleState(state);
      case "get_next_required_fields": return { blockers: state.blockers };
      case "update_customer_requirements": {
        const parsed = fieldSchema.parse(args);
        const patches = argsToPatches(parsed);
        return this.plans.mutate(planId, state.eventVersion, (current) => applyRequirementPatches(current, patches, "chat"));
      }
      case "search_live_catalogue": {
        const parsed = z.object({ query: z.string(), category: z.string().nullable() }).parse(args);
        const results = searchCatalogue(snapshot, { text: parsed.query, categories: parsed.category ? [parsed.category as never] : undefined })
          .slice(0, 6)
          .map((item) => ({ ...item, priceAssessment: assessPricePlausibility(snapshot, item) }));
        return { snapshotId: snapshot.snapshotId, observedAt: snapshot.observedAt, results };
      }
      case "add_best_matching_product": {
        const parsed = z.object({ query: z.string().trim().min(2).max(200) }).parse(args);
        const result = addBestMatchingProduct(state, snapshot, parsed.query);
        if (!result.ok || result.alreadySelected) return result;
        const saved = this.plans.replace(planId, result.state, state.eventVersion);
        return { ok: true, alreadySelected: false, product: result.product, state: this.visibleState(saved) };
      }
      case "compare_products": {
        const parsed = z.object({ variant_ids: z.array(z.string()).min(1).max(4) }).parse(args);
        return snapshot.variants
          .filter((item) => parsed.variant_ids.includes(item.variantId))
          .map((item) => ({ ...item, priceAssessment: assessPricePlausibility(snapshot, item) }));
      }
      case "check_attachment_compatibility": {
        const parsed = z.object({ host_variant_id: z.string(), attachment_variant_id: z.string() }).parse(args);
        const host: ExistingEquipment = { id: parsed.host_variant_id, identityKind: "northstar", variantId: parsed.host_variant_id, evidenceStatus: "verified" };
        return checkCompatibility(snapshot, host, parsed.attachment_variant_id, state.selectedItems);
      }
      case "check_room_fit": return validatePlacements(state, snapshot);
      case "generate_room_layout": {
        const parsed = z.object({ seed: z.number().int() }).parse(args);
        return generateLayout(state, snapshot, state.selectedItems, parsed.seed);
      }
      case "calculate_itemised_quote": return calculateQuote(state, snapshot, state.selectedItems);
      case "build_checked_plan": return this.plans.mutate(planId, state.eventVersion, (current) => buildRecommendation(current, snapshot));
      default: throw new Error("UNKNOWN_OPERATION");
    }
  }
}
