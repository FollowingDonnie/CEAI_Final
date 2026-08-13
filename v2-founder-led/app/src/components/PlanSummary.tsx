
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, Download, LockKeyhole, Mail, PackageCheck, Share2 } from "lucide-react";
import type { PlanAlternative, PlanState, Variant } from "../../shared/types";
import { categoryColour, euro, metres, variantById } from "../utils";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  alternatives: PlanAlternative[];
  selectedId: string | null;
  busy: boolean;
  onSelect: (id: string) => void;
  onApplyAlternative: (id: PlanAlternative["id"]) => Promise<void>;
}

function planText(state: PlanState, catalogue: Variant[]) {
  const room = `${metres(state.requirements.room.lengthMm.value)} x ${metres(state.requirements.room.widthMm.value)} x ${metres(state.requirements.room.heightMm.value)}`;
  const equipment = state.selectedItems.map((id) => {
    const item = variantById(catalogue, id);
    return item ? `- ${item.name} (${item.sku}): ${euro(item.priceCents)}` : null;
  }).filter(Boolean).join("\n");
  return `NORTHSTAR HOME GYM PLAN\n\nRoom: ${room}\nStatus: ${state.status === "current" ? "Checked plan" : state.status}\n\nEquipment\n${equipment}\n\nComplete known total: ${euro(state.quote.grandTotalCents)}\n\nPlanning note: ${state.recommendation.compromise ?? "No additional planning note."}\n\nRoom fit uses recorded dimensions and encoded product clearances. Verify installation instructions and mounting surfaces before purchase.`;
}

export function PlanSummary({ state, catalogue, alternatives, selectedId, busy, onSelect, onApplyAlternative }: Props) {
  const [shared, setShared] = useState(false);
  if (state.recommendation.status === "empty" || state.recommendation.status === "stale" && !state.selectedItems.length) return null;
  const valid = state.recommendation.status === "current";

  const download = () => {
    const url = URL.createObjectURL(new Blob([planText(state, catalogue)], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "northstar-home-gym-plan.txt"; anchor.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const text = planText(state, catalogue);
    try {
      if (navigator.share) await navigator.share({ title: "Northstar home gym plan", text });
      else await navigator.clipboard.writeText(text);
      setShared(true); window.setTimeout(() => setShared(false), 2000);
    } catch {
      // Closing the native share sheet is a normal user action.
    }
  };

  const requestSetup = () => {
    const subject = encodeURIComponent("Northstar home gym setup request");
    const body = encodeURIComponent(`${planText(state, catalogue)}\n\nPlease contact me about this setup.`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return <section className="plan-summary">
    <div className={`recommendation-status ${valid ? "valid" : "invalid"}`}>
      {valid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      <span><strong>{valid ? "Checked plan" : state.recommendation.status === "infeasible" ? "Plan needs a change" : "Checks need refreshing"}</strong><small>{state.recommendation.explanationFacts[0]}</small></span>
    </div>
    {state.recommendation.compromise && <p className="compromise"><CircleDashed size={17} /><span><strong>Planning judgement</strong>{state.recommendation.compromise}</span></p>}

    {valid && alternatives.length > 1 && <div className="plan-options">
      <h3>Compare checked options</h3>
      <div className="option-list">{alternatives.map((option) => {
        const active = option.itemIds.join("|") === state.selectedItems.join("|");
        return <button type="button" className={active ? "active" : ""} key={option.id} disabled={busy || active} onClick={() => onApplyAlternative(option.id)}><span><strong>{option.label}</strong><small>{option.description}</small></span><b>{euro(option.totalCents)}</b></button>;
      })}</div>
    </div>}

    {state.selectedItems.length > 0 && <div className="equipment-list"><h3><PackageCheck size={17} />Equipment package</h3>{state.selectedItems.map((id) => {
      const item = variantById(catalogue, id); if (!item) return null;
      const placement = state.placements.find((value) => value.variantId === id);
      const owned = state.existingEquipment.some((value) => value.identityKind !== "manual" && value.variantId === id);
      return <button type="button" className={`equipment-row ${selectedId === id ? "selected" : ""}`} key={id} onClick={() => onSelect(id)}><span className="category-swatch" style={{ background: categoryColour[item.category] }} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.sku} Â· {item.configuration}</small></span>{placement?.locked && <LockKeyhole size={14} aria-label="Locked in room" />}<span>{owned ? "Owned" : euro(item.priceCents)}</span><ChevronRight size={16} /></button>;
    })}</div>}

    {state.journeyType.value === "upgrade" && state.compatibilityResults.length > 0 && <div className="compatibility-list">
      <h3><PackageCheck size={17} />Attachment checks</h3>
      {state.compatibilityResults.map((result) => {
        const host = variantById(catalogue, result.hostVariantId);
        const attachment = variantById(catalogue, result.attachmentVariantId);
        const detail = result.unsatisfiedConditions[0] ?? result.conditions[0];
        return <div className={`compatibility-row ${result.allowedInPlan ? "approved" : "not-approved"}`} key={`${result.hostVariantId}-${result.attachmentVariantId}`}>{result.allowedInPlan ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}<span><strong>{attachment?.name ?? "Attachment"} with {host?.name ?? "recorded equipment"}</strong><small>{result.label}</small>{detail && <small className="compatibility-condition">{detail}</small>}</span></div>;
      })}
    </div>}

    {valid && <div className="plan-share-actions">
      <button className="quiet-button" type="button" onClick={download}><Download size={16} />Export</button>
      <button className="quiet-button" type="button" onClick={share}><Share2 size={16} />{shared ? "Copied" : "Share"}</button>
      <button className="quiet-button" type="button" onClick={requestSetup}><Mail size={16} />Request setup</button>
    </div>}
    <p className="trust-copy">Fits the recorded room geometry and encoded clearances. This is not an installation-safety assessment.</p>
  </section>;
}
