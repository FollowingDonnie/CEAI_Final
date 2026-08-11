import type { PlanState, RequirementPatch } from "../../shared/types.js";
import { mapGoalText } from "../domain/search.js";

function unitToMm(value: number, unit: string | undefined): number {
  if (!unit || unit.toLowerCase() === "m") return Math.round(value * 1000);
  if (unit.toLowerCase() === "cm") return Math.round(value * 10);
  return Math.round(value);
}

export function extractRequirementPatches(message: string, state: PlanState): RequirementPatch[] {
  const text = message.toLowerCase();
  const patches: RequirementPatch[] = [];
  if (/new (gym|space)|plan (a|my) (gym|space)|starting|from scratch/.test(text)) patches.push({ field: "journeyType", value: "new_space" });
  if (/upgrade|attachment|rack i (have|own)|existing equipment/.test(text)) patches.push({ field: "journeyType", value: "upgrade" });

  const dimensions = message.match(/(\d+(?:\.\d+)?)\s*(m|cm|mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(m|cm|mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(m|cm|mm)?/i);
  if (dimensions) {
    const sharedUnit = dimensions[6] ?? dimensions[4] ?? dimensions[2] ?? "m";
    patches.push(
      { field: "room.lengthMm", value: unitToMm(Number(dimensions[1]), dimensions[2] ?? sharedUnit) },
      { field: "room.widthMm", value: unitToMm(Number(dimensions[3]), dimensions[4] ?? sharedUnit) },
      { field: "room.heightMm", value: unitToMm(Number(dimensions[5]), dimensions[6] ?? sharedUnit) },
    );
  }

  const budget = message.match(/(?:€|eur\s*|budget(?:\s+is|\s+of|\s*)?)\s*([0-9][0-9,.]*)/i);
  if (budget) patches.push({ field: "budgetCents", value: Math.round(Number(budget[1].replace(/,/g, "")) * 100) });

  const mapped = mapGoalText(text);
  const controlledGoals = new Set<string>();
  if (mapped.some((tag) => tag.includes("barbell") || tag.includes("bench"))) controlledGoals.add("strength");
  if (mapped.some((tag) => tag.includes("hypertrophy") || tag.includes("cable"))) controlledGoals.add("bodybuilding");
  if (mapped.some((tag) => tag.includes("cardio"))) controlledGoals.add("cardio");
  if (mapped.some((tag) => tag.includes("pull_up") || tag.includes("dip") || tag.includes("open_floor"))) controlledGoals.add("calisthenics");
  if (mapped.some((tag) => tag === "general_fitness")) controlledGoals.add("general_fitness");
  if (controlledGoals.size) {
    const existing = state.requirements.goals.value ?? [];
    patches.push({ field: "goals", value: [...new Set([...existing, ...controlledGoals])] });
    patches.push({ field: "originalGoalText", value: message });
  }

  if (/complete beginner|beginner|new to/.test(text)) patches.push({ field: "experience", value: "beginner" });
  else if (/very experienced|advanced|experienced|powerlifter|bodybuilder/.test(text)) patches.push({ field: "experience", value: "experienced" });
  else if (/some experience|intermediate/.test(text)) patches.push({ field: "experience", value: "some_experience" });

  const frequency = text.match(/(?:train(?:ing)?|work(?:ing)?\s*out)\s*(\d)\s*(?:times?|days?)\s*(?:a|per)\s*week|(?:^|\s)(\d)\s*(?:times?|days?)\s*(?:a|per)\s*week/);
  const trainingDays = Number(frequency?.[1] ?? frequency?.[2]);
  if (trainingDays >= 1 && trainingDays <= 7) patches.push({ field: "trainingDaysPerWeek", value: trainingDays });

  if (/no (door|obstruction)|nothing fixed|clear rectangle/.test(text)) patches.push({ field: "room.doorConfirmed", value: true });
  if (/versatile|versatility/.test(text)) patches.push({ field: "priorities", value: ["versatility"] });
  else if (/open floor|floor space/.test(text)) patches.push({ field: "priorities", value: ["open_floor"] });
  else if (/lowest cost|cheap|budget priority/.test(text)) patches.push({ field: "priorities", value: ["cost"] });
  if (/can (mount|anchor)|mounting is fine|allowed to (mount|anchor)/.test(text)) patches.push({ field: "mountingPermission", value: true });
  if (/cannot (mount|anchor)|no mounting|no drilling/.test(text)) patches.push({ field: "mountingPermission", value: false });
  return patches;
}

const questionFor: Record<string, string> = {
  journeyType: "Are you planning a new training space, or upgrading equipment you already own?",
  existingEquipment: "Which rack or piece of equipment are you upgrading? A Northstar model name is ideal, but measured dimensions also work.",
  "room.widthMm": "What are the room's length, width and ceiling height? Metres or centimetres are both fine.",
  "room.lengthMm": "What are the room's length, width and ceiling height? Metres or centimetres are both fine.",
  "room.heightMm": "What is the ceiling height?",
  "room.doorConfirmed": "Before we place the larger equipment, are there any inward-opening doors or fixed obstructions I should account for?",
  goals: "What kind of training matters most: strength, bodybuilding, cardio, calisthenics or general fitness?",
  experience: "How experienced are you with gym equipment: beginner, some experience or experienced?",
  priorities: "If we need to make a trade-off later, what would you most want the room to preserve?",
  budgetCents: "What budget would feel comfortable for the complete setup? A rough ceiling in euro is perfect.",
};

export function nextQuestion(state: PlanState): string {
  if (!state.blockers.length) return "I have enough to build your first option. Would you like me to put it together?";
  return questionFor[state.blockers[0]] ?? "What would you like to change or explore next?";
}

export function fallbackReply(state: PlanState, acceptedCount: number): string {
  if (state.status === "current") {
    const total = state.quote.grandTotalCents == null ? "not currently complete" : `EUR ${(state.quote.grandTotalCents / 100).toFixed(2)}`;
    return `I have built a checked plan with ${state.selectedItems.length} items. The complete known quote is ${total}. ${state.recommendation.compromise ?? "You can inspect or adjust every part of it in the plan."}`;
  }
  if (state.status === "infeasible") return `${state.recommendation.explanationFacts[0] ?? "I cannot build a complete checked plan from the current constraints."} Would you rather revise the plan or review the exact shortfall?`;
  const acknowledgement = acceptedCount ? humanAcknowledgement(state) : "";
  return `${acknowledgement}${nextQuestion(state)}`;
}

function humanAcknowledgement(state: PlanState): string {
  const goal = state.requirements.goals.value?.[0];
  const experience = state.requirements.experience.value;
  const days = state.requirements.trainingDaysPerWeek.value;
  const budget = state.requirements.budgetCents.value;
  if (budget && goal) return `That gives us a clear ${goal === "bodybuilding" ? "muscle-building" : goal.replaceAll("_", " ")} brief and a EUR ${(budget / 100).toLocaleString("en-IE")} ceiling. `;
  if (experience === "beginner" && days) return `Perfect - a straightforward setup you can grow into will suit ${days} sessions a week well. `;
  if (goal === "bodybuilding") return "Great - we'll focus on productive muscle-building equipment without filling the room for the sake of it. ";
  if (state.journeyType.value === "new_space") return "Great - let's shape the room around how you actually want to train. ";
  if (experience) return `Thanks - I'll keep the plan appropriate for your ${experience.replaceAll("_", " ")} experience. `;
  return "Thanks - that helps narrow the plan. ";
}
