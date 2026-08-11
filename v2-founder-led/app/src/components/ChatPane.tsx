import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { ChatMessage, PlanState, Variant } from "../../shared/types";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatPane({ state, catalogue, messages, busy, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const choices = quickChoices(state, catalogue);
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
        <span><strong>Mara Quinn</strong><small>Northstar equipment planner</small></span>
      </header>
      <div className="messages" aria-live="polite" ref={messagesRef}>
        {messages.map((message) => (
          <div className={`message ${message.role}`} key={message.id}>
            {message.role === "assistant" && <Sparkles size={15} aria-hidden="true" />}
            <p>{message.text}</p>
          </div>
        ))}
        {!busy && choices.length > 0 && (
          <div className="quick-choices" aria-label="Suggested replies">
            {choices.map((choice) => (
              <button type="button" key={choice.label} onClick={() => onSend(choice.message)}>{choice.label}</button>
            ))}
          </div>
        )}
        {busy && (
          <div className="message assistant thinking" role="status">
            <Sparkles size={15} aria-hidden="true" />
            <span>Mara is checking your plan</span><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
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
  const euro = [packageAt(0), packageAt(0.5), packageAt(0.85)]
    .map((cents) => Math.max(500, Math.ceil(cents / 25000) * 250))
    .filter((value, index, values) => values.indexOf(value) === index);
  const names = ["Starter", "Balanced", "More flexible"];
  return [
    ...euro.map((value, index) => ({ label: names[index] + " - up to EUR " + value.toLocaleString("en-IE"), message: "My maximum budget is EUR " + value + "." })),
    { label: "Not sure yet", message: "I am not sure about budget yet. Please help me choose a sensible range." },
  ];
}
