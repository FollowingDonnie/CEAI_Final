import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { ChatMessage, PlanState, Variant } from "../../shared/types";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => Promise<void>;
  thinkingLabel: string | null;
  onBuild: () => Promise<void>;
  onAddRefinement: (query: string, userMessage: string) => Promise<void>;
  pendingAddition: { name: string; projectedTotalCents: number; overrunCents: number } | null;
  onSkipRefinement: (message: string) => void;
  onAuthoriseAddition: () => Promise<void>;
  onDeclineAddition: () => void;
}

export function ChatPane({ state, catalogue, messages, busy, thinkingLabel, pendingAddition, onSend, onBuild, onAddRefinement, onSkipRefinement, onAuthoriseAddition, onDeclineAddition }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const choices = quickChoices(state, catalogue);
  const refinement = postBuildRefinement(state, catalogue, messages);
  const showFlexibleGoalsHint = state.blockers[0] === "goals";
  const canBuild = state.journeyType.value === "new_space" && !state.blockers.length && ["empty", "stale"].includes(state.recommendation.status);
  useEffect(() => {
    const container = messagesRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, busy]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || busy) return;
    setDraft("");
    await onSend(value);
  }

  return (
    <section className="chat-pane" aria-label="Conversation with Mara">
      <header className="pane-header mara-header">
        <span className="mara-avatar" aria-hidden="true">MQ</span>
        <span><strong>Mara Quinn</strong><small>Home gym equipment specialist</small></span>
      </header>
      <div className="messages" aria-live="polite" ref={messagesRef}>
        {messages.map((message) => (
          <div className={`message ${message.role}`} key={message.id}>
            {message.role === "assistant" && <Sparkles size={15} aria-hidden="true" />}
            <p>{message.text}</p>
          </div>
        ))}
        {!busy && canBuild && (
          <div className="chat-plan-action">
            <span>That is enough for a useful first option. You can refine it afterwards.</span>
            <button className="primary-button" type="button" onClick={onBuild}>{state.recommendation.status === "empty" ? "Build with current info" : "Update plan"}</button>
          </div>
        )}
        {!busy && pendingAddition && (
          <div className="refinement-step budget-decision">
            <div className="quick-choices" aria-label="Budget decision">
              <button type="button" onClick={onAuthoriseAddition}>Add anyway - EUR {(pendingAddition.overrunCents / 100).toLocaleString("en-IE")} over</button>
              <button type="button" onClick={onDeclineAddition}>Keep current plan</button>
            </div>
          </div>
        )}
        {!busy && !pendingAddition && refinement && (
          <div className="refinement-step">
            <div className="message assistant refinement-message">
              <Sparkles size={15} aria-hidden="true" />
              <p>{refinement.prompt}</p>
            </div>
            <div className="quick-choices" aria-label="Optional plan refinement">
              <button type="button" onClick={() => onAddRefinement(refinement.query, refinement.acceptMessage)}>{refinement.acceptLabel}</button>
              <button type="button" onClick={() => onSkipRefinement(refinement.skipMessage)}>Not now</button>
            </div>
          </div>
        )}
        {!busy && choices.length > 0 && (
          <div className="suggested-replies">
            {showFlexibleGoalsHint && <small>These are shortcuts. You can type any training goal below.</small>}
            <div className="quick-choices" aria-label="Suggested replies">
              {choices.map((choice) => (
                <button type="button" key={choice.label} onClick={() => onSend(choice.message)}>{choice.label}</button>
              ))}
            </div>
          </div>
        )}
        {busy && thinkingLabel && (
          <div className="message assistant thinking" role="status">
            <Sparkles size={15} aria-hidden="true" />
            <span>{thinkingLabel}</span><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="message">Message Mara</label>
        <textarea id="message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Tell Mara about your room, training or equipment..." onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) submit(event); }} />
        <button className="icon-button primary" type="submit" disabled={!draft.trim() || busy} aria-label="Send message" title="Send message"><Send size={19} /></button>
      </form>
    </section>
  );
}

interface QuickChoice {
  label: string;
  message: string;
}

function quickChoices(state: PlanState, catalogue: Variant[]): QuickChoice[] {
  const blocker = state.blockers[0];
  if (blocker === "journeyType") return [
    { label: "Plan a new space", message: "I want to plan a new gym space." },
    { label: "Upgrade equipment", message: "I want to upgrade equipment I already own." },
  ];
  if (blocker === "goals") return [
    { label: "Build muscle", message: "My main goal is bodybuilding and building muscle." },
    { label: "Get stronger", message: "My main goal is strength." },
    { label: "Cardio fitness", message: "My main goal is cardio fitness." },
    { label: "Calisthenics", message: "My main goal is calisthenics and bodyweight training." },
    { label: "Hybrid training", message: "I want a hybrid setup for strength, cardio and flexible open-floor training." },
    { label: "General fitness", message: "I want a balanced setup for general fitness." },
  ];
  if (blocker === "experience") return [
    { label: "Beginner", message: "I am a beginner." },
    { label: "Some experience", message: "I have some experience." },
    { label: "Experienced", message: "I am experienced with gym equipment." },
  ];
  if (blocker !== "budgetCents") return [];

  const categories = ["rack", "bench", "barbell", "plates"] as const;
  const packageAt = (position: number) => categories.reduce((total, category) => {
    const prices = catalogue.filter((item) => item.active && item.category === category && item.priceCents != null).map((item) => item.priceCents as number).sort((a, b) => a - b);
    return total + (prices[Math.floor((prices.length - 1) * position)] ?? 0);
  }, 0);
  const rounded = (cents: number) => Math.max(500, Math.ceil(cents / 25000) * 250);
  const starter = rounded(packageAt(0));
  const tierOne = Math.max(starter + 750, rounded(packageAt(0.5)));
  const tierTwo = Math.max(tierOne + 750, rounded(packageAt(0.85)));
  const euro = [starter, tierOne, tierTwo];
  const names = ["Starter", "Tier 1", "Tier 2"];
  return [
    ...euro.map((value, index) => ({ label: names[index] + " - up to EUR " + value.toLocaleString("en-IE"), message: "My maximum budget is EUR " + value + "." })),
    { label: "Help me choose", message: "I am not sure about budget yet. Please help me choose a sensible range." },
  ];
}



interface RefinementStep {
  prompt: string;
  query: string;
  acceptLabel: string;
  acceptMessage: string;
  skipMessage: string;
}

function postBuildRefinement(state: PlanState, catalogue: Variant[], messages: ChatMessage[]): RefinementStep | null {
  if (state.status !== "current" || state.journeyType.value !== "new_space") return null;
  const selected = state.selectedItems.map((id) => catalogue.find((item) => item.variantId === id)).filter((item): item is Variant => Boolean(item));
  const userReplies = messages.filter((message) => message.role === "user").map((message) => message.text.toLowerCase());
  const hasRack = selected.some((item) => item.category === "rack");
  const hasBarbell = selected.some((item) => item.category === "barbell");
  const hasPlates = selected.some((item) => item.category === "plates");
  const rack = selected.find((item) => item.category === "rack");
  const hasSafetySupport = selected.some((item) => ["a12-spotter-arms", "a14-safety-straps"].includes(item.variantId));
  const safetyHandled = hasSafetySupport || userReplies.some((text) => /(?:add|no|skip|not now).*spotter/.test(text));

  const spotterHosts = new Set(["h30-half-rack-entry", "h40-half-rack-pro", "p40-power-rack-compact", "p50-power-rack-standard", "f20-folding-rack-compact", "f30-folding-rack-pro"]);
  if (hasRack && hasBarbell && rack && spotterHosts.has(rack.variantId) && !safetyHandled) {
    return {
      prompt: "Your rack, governed J-hooks and barbell setup are ready. Would you like me to add compatible spotter arms and update the room and quote?",
      query: "compatible spotter arms",
      acceptLabel: "Add spotter arms",
      acceptMessage: "Yes, add compatible spotter arms to the plan.",
      skipMessage: "Not now for spotter arms.",
    };
  }

  const calisthenics = (state.requirements.goals.value ?? []).includes("calisthenics");
  const ringsHandled = selected.some((item) => item.variantId === "a32-gym-rings") || userReplies.some((text) => /(?:add|no|skip|not now).*rings/.test(text));
  const ringHosts = new Set(["h30-half-rack-entry", "h40-half-rack-pro", "p40-power-rack-compact", "p50-power-rack-standard", "f30-folding-rack-pro"]);
  if (calisthenics && rack && ringHosts.has(rack.variantId) && (state.requirements.room.heightMm.value ?? 0) >= 2300 && !ringsHandled) {
    return {
      prompt: "Your pull-up and open-floor setup is ready. Would you like me to add governed gymnastic rings for extra bodyweight progressions?",
      query: "compatible gym rings",
      acceptLabel: "Add gym rings",
      acceptMessage: "Yes, add compatible gym rings to the plan.",
      skipMessage: "Not now for gym rings.",
    };
  }

  const hasStorage = selected.some((item) => item.category === "storage" || item.variantId === "a18-plate-storage" || item.tags.includes("storage"));
  const storageHandled = hasStorage || userReplies.some((text) => /(?:add|no|skip).*plate storage|plates.*floor.*for now/.test(text));
  if (hasPlates && !storageHandled) {
    return {
      prompt: "Your plates are currently shown as a neat floor stack. Would you like me to find a suitable plate-storage option and update the room and quote?",
      query: "plate storage",
      acceptLabel: "Add plate storage",
      acceptMessage: "Yes, add the best suitable plate storage option to the plan.",
      skipMessage: "Keep the plates on the floor for now.",
    };
  }
  return null;
}
