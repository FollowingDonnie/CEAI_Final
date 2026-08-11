import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import type { ChatMessage, PlanState } from "../../shared/types";

interface Props {
  state: PlanState;
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatPane({ state, messages, busy, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
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
        {messages.length === 1 && !state.journeyType.value && (
          <div className="quick-choices" aria-label="Choose a planning journey">
            <button type="button" onClick={() => onSend("I want to plan a new gym space.")}>Plan a new space</button>
            <button type="button" onClick={() => onSend("I want to upgrade equipment I already own.")}>Upgrade equipment</button>
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
