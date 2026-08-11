import { AlertTriangle, CheckCircle2, ChevronRight, CircleDashed, LockKeyhole, PackageCheck } from "lucide-react";
import type { PlanState, Variant } from "../../shared/types";
import { categoryColour, euro, variantById } from "../utils";

export function PlanSummary({ state, catalogue, selectedId, onSelect }: { state: PlanState; catalogue: Variant[]; selectedId: string | null; onSelect: (id: string) => void }) {
  if (state.recommendation.status === "empty" || state.recommendation.status === "stale" && !state.selectedItems.length) return null;
  const valid = state.recommendation.status === "current";
  return <section className="plan-summary">
    <div className={`recommendation-status ${valid ? "valid" : "invalid"}`}>
      {valid ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
      <span><strong>{valid ? "Checked plan" : state.recommendation.status === "infeasible" ? "Plan needs a change" : "Checks need refreshing"}</strong><small>{state.recommendation.explanationFacts[0]}</small></span>
    </div>
    {state.recommendation.compromise && <p className="compromise"><CircleDashed size={17} /><span><strong>Planning judgement</strong>{state.recommendation.compromise}</span></p>}
    {state.selectedItems.length > 0 && <div className="equipment-list"><h3><PackageCheck size={17} />Equipment package</h3>{state.selectedItems.map((id) => { const item = variantById(catalogue, id); if (!item) return null; const placement = state.placements.find((value) => value.variantId === id); const owned = state.existingEquipment.some((value) => value.identityKind !== "manual" && value.variantId === id); return <button type="button" className={`equipment-row ${selectedId === id ? "selected" : ""}`} key={id} onClick={() => onSelect(id)}><span className="category-swatch" style={{ background: categoryColour[item.category] }} aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.sku} · {item.configuration}</small></span>{placement?.locked && <LockKeyhole size={14} aria-label="Locked in room" />}<span>{owned ? "Owned" : euro(item.priceCents)}</span><ChevronRight size={16} /></button>; })}</div>}
    {state.journeyType.value === "upgrade" && state.compatibilityResults.length > 0 && (
      <div className="compatibility-list">
        <h3><PackageCheck size={17} />Attachment checks</h3>
        {state.compatibilityResults.map((result) => {
          const host = variantById(catalogue, result.hostVariantId);
          const attachment = variantById(catalogue, result.attachmentVariantId);
          const detail = result.unsatisfiedConditions[0] ?? result.conditions[0];
          return (
            <div className={`compatibility-row ${result.allowedInPlan ? "approved" : "not-approved"}`} key={`${result.hostVariantId}-${result.attachmentVariantId}`}>
              {result.allowedInPlan ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>
                <strong>{attachment?.name ?? "Attachment"} with {host?.name ?? "recorded equipment"}</strong>
                <small>{result.label}</small>
                {detail && <small className="compatibility-condition">{detail}</small>}
              </span>
            </div>
          );
        })}
      </div>
    )}
    <p className="trust-copy">Fits the recorded room geometry and encoded clearances. This is not an installation-safety assessment.</p>
  </section>;
}
