import { AlertTriangle, CheckCircle2, Clock3, WalletCards } from "lucide-react";
import type { PlanState } from "../../shared/types";
import { checkedTime, euro } from "../utils";

interface Props {
  state: PlanState;
  busy: boolean;
  onConsent: (maximumOverrunCents: number) => Promise<void>;
}

export function QuoteView({ state, busy, onConsent }: Props) {
  const groups = [
    ["core", "Core equipment"], ["required", "Required for this setup"], ["flooring", "Flooring and room"], ["delivery", "Delivery and installation"], ["optional", "Optional"],
  ] as const;
  if (state.quote.status === "empty") return <div className="empty-panel"><WalletCards size={30} /><h3>No quote yet</h3><p>Your complete package will appear after the room, training and budget checks are ready.</p></div>;
  return <div className="quote-view">
    <div className={`quote-summary ${state.quote.withinBudget ? "valid" : "invalid"}`}>
      {state.quote.withinBudget ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      <span><small>Complete known total</small><strong>{euro(state.quote.grandTotalCents)}</strong></span>
      <span><small>{state.quote.withinBudget ? "Budget headroom" : "Budget shortfall"}</small><strong>{state.quote.grandTotalCents != null && state.requirements.budgetCents.value != null ? euro(Math.abs(state.requirements.budgetCents.value - state.quote.grandTotalCents)) : "Unavailable"}</strong></span>
    </div>
    {state.quote.withinBudget === false && (state.quote.overrunCents ?? 0) > 0 && (
      <div className="budget-consent-panel">
        <AlertTriangle size={18} />
        <span><strong>Outside the recorded hard cap</strong><small>The checked package is {euro(state.quote.overrunCents)} over budget.</small></span>
        {!state.budgetConsent.overrunAllowed && <button className="quiet-button" type="button" disabled={busy} onClick={() => onConsent(state.quote.overrunCents!)}>Allow exactly {euro(state.quote.overrunCents)}</button>}
        {state.budgetConsent.overrunAllowed && <small>Exact exception recorded.</small>}
      </div>
    )}
    {groups.map(([group, title]) => {
      const lines = state.quote.lines.filter((line) => line.group === group);
      if (!lines.length) return null;
      return <section className="quote-group" key={group}><h3>{title}</h3>{lines.map((line) => <div className="quote-line" key={line.lineId}><span><strong>{line.name}</strong><small>{line.sku} · {line.inclusionReason}</small></span><span className={line.lineTotalCents == null ? "unknown" : ""}>{euro(line.lineTotalCents)}</span></div>)}</section>;
    })}
    {state.quote.unknownCharges.length > 0 && <p className="warning-line"><AlertTriangle size={17} />{state.quote.unknownCharges.join(", ")} is not currently available and is not shown as EUR 0.</p>}
    <p className="timestamp"><Clock3 size={14} />Checked {checkedTime(state.quote.observedAt)} · Fictional prototype prices</p>
  </div>;
}
