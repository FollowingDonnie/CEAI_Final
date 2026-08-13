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
}

export function ChatPane({ state, catalogue, messages, busy, thinkingLabel, onSend, onBuild }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const choices = quickChoices(state, catalogue);
  const showFlexibleGoalsHint = state.blockers[0] === "goals";
  const canBuild = !state.blockers.length && ["empty", "stale"].includes(state.recommendation.status);
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
  if (!blocker && state.status === "current") {
    const hasPlates = state.selectedItems.some((id) => catalogue.find((item) => item.variantId === id)?.category === "plates");
    const hasStorage = state.selectedItems.some((id) => {
      const item = catalogue.find((candidate) => candidate.variantId === id);
      return item?.category === "storage" || id === "a18-plate-storage";
    });
    if (hasPlates && !hasStorage) return [{ label: "Add plate storage", message: "Add the best suitable plate storage option to this plan." }];
  }

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
