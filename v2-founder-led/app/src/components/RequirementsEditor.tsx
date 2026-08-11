import { Check, DoorOpen, Pencil, Plus, RefreshCw, Ruler, Square, SquareCheckBig, Target, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import type { PlanState, RequirementPatch, Variant } from "../../shared/types";
import { metres } from "../utils";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  busy: boolean;
  onPatch: (patches: RequirementPatch[]) => Promise<void>;
  onRecommend: () => Promise<void>;
  onAddExisting: (equipment: Record<string, unknown>) => Promise<void>;
  onAddDoor: (door: Record<string, unknown>) => Promise<void>;
}

const goals = ["strength", "bodybuilding", "cardio", "calisthenics", "general_fitness"];
const priorities = ["versatility", "open_floor", "free_weights", "cardio", "storage", "cost"];
const label = (value: string) => value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

export function RequirementsEditor({ state, catalogue, busy, onPatch, onRecommend, onAddExisting, onAddDoor }: Props) {
  const [doorOpen, setDoorOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const rackOptions = useMemo(() => catalogue.filter((item) => item.category === "rack"), [catalogue]);
  const existing = state.existingEquipment[0];
  const existingName = existing?.identityKind === "manual"
    ? existing.name
    : existing ? catalogue.find((item) => item.variantId === existing.variantId)?.name ?? "Known equipment" : "";

  const toggleArray = (field: "goals" | "priorities", value: string) => {
    const current = state.requirements[field].value ?? [];
    return onPatch([{ field, value: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] }]);
  };

  return (
    <div className="requirements-editor">
      <section className="inspector-section">
        <div className="section-title"><Ruler size={17} /><h3>Room</h3><span className="completion">{[state.requirements.room.lengthMm, state.requirements.room.widthMm, state.requirements.room.heightMm].filter((field) => field.value != null).length}/3</span></div>
        <div className="compact-grid three">
          {(["lengthMm", "widthMm", "heightMm"] as const).map((field) => (
            <label key={field}>{field.replace("Mm", "")}
              <div className="input-with-unit"><input type="number" min="0.5" step="0.01" value={(state.requirements.room[field].value ?? 0) / 1000 || ""} placeholder="0.00" onChange={(event) => event.target.value && onPatch([{ field: `room.${field}` as RequirementPatch["field"], value: Math.round(Number(event.target.value) * 1000) } as RequirementPatch])} /><span>m</span></div>
            </label>
          ))}
        </div>
        <div className="inline-actions">
          <button className={state.requirements.room.doorConfirmed.value ? "quiet-button confirmed" : "quiet-button"} type="button" aria-pressed={state.requirements.room.doorConfirmed.value === true} onClick={() => onPatch([{ field: "room.doorConfirmed", value: true }])}>{state.requirements.room.doorConfirmed.value ? <SquareCheckBig size={16} /> : <Square size={16} />}No fixed obstruction</button>
          <button className="quiet-button" type="button" onClick={() => setDoorOpen((open) => !open)}><DoorOpen size={16} />Add door</button>
        </div>
        {doorOpen && <DoorForm onSubmit={async (door) => { await onAddDoor(door); setDoorOpen(false); }} />}
      </section>

      <section className="inspector-section">
        <div className="section-title"><Target size={17} /><h3>Training</h3></div>
        <div className="choice-chips" aria-label="Training goals">
          {goals.map((goal) => <button type="button" className={state.requirements.goals.value?.includes(goal) ? "selected" : ""} onClick={() => toggleArray("goals", goal)} key={goal}>{label(goal)}</button>)}
        </div>
        <label>Experience
          <select value={state.requirements.experience.value ?? ""} onChange={(event) => event.target.value && onPatch([{ field: "experience", value: event.target.value as "beginner" | "some_experience" | "experienced" }])}>
            <option value="">Choose</option><option value="beginner">Beginner</option><option value="some_experience">Some experience</option><option value="experienced">Experienced</option>
          </select>
        </label>
        <span className="field-label">Main priority</span>
        <div className="choice-chips compact" aria-label="Planning priorities">
          {priorities.map((priority) => <button type="button" className={state.requirements.priorities.value?.includes(priority) ? "selected" : ""} onClick={() => toggleArray("priorities", priority)} key={priority}>{label(priority)}</button>)}
        </div>
      </section>

      {state.journeyType.value === "upgrade" && (
        <section className="inspector-section">
          <div className="section-title"><Pencil size={17} /><h3>Equipment you own</h3></div>
          {existing ? <p className="confirmed-line"><Check size={16} />{existingName}</p> : (
            <>
              <label>Northstar rack<select defaultValue="" onChange={(event) => event.target.value && onAddExisting({ identityKind: "northstar", variantId: event.target.value })}><option value="">Choose exact model</option>{rackOptions.map((rack) => <option value={rack.variantId} key={rack.variantId}>{rack.name} ({rack.sku})</option>)}</select></label>
              <button className="text-button" type="button" onClick={() => setManualOpen((open) => !open)}><Plus size={16} />Enter another item</button>
              {manualOpen && <ManualEquipmentForm onSubmit={async (item) => { await onAddExisting(item); setManualOpen(false); }} />}
            </>
          )}
        </section>
      )}

      <section className="inspector-section budget-section">
        <div className="section-title"><WalletCards size={17} /><h3>All-in budget</h3></div>
        <label>Maximum
          <div className="input-with-unit money"><span>EUR</span><input type="number" min="100" step="50" value={(state.requirements.budgetCents.value ?? 0) / 100 || ""} placeholder="2500" onChange={(event) => event.target.value && onPatch([{ field: "budgetCents", value: Math.round(Number(event.target.value) * 100) }])} /></div>
        </label>
        {state.requirements.budgetCents.value != null && <small>Hard cap: EUR {(state.requirements.budgetCents.value / 100).toLocaleString("en-IE")}</small>}
      </section>

      <div className="plan-action-bar">
        <span>{state.blockers.length ? `${state.blockers.length} detail${state.blockers.length === 1 ? "" : "s"} still needed` : "Ready for a checked plan"}</span>
        <button className="primary-button" type="button" disabled={state.blockers.length > 0 || busy} onClick={onRecommend}><RefreshCw size={17} className={busy ? "spin" : ""} />{state.recommendation.status === "empty" ? "Build plan" : "Recalculate"}</button>
      </div>
    </div>
  );
}

function DoorForm({ onSubmit }: { onSubmit: (door: Record<string, unknown>) => Promise<void> }) {
  const [wall, setWall] = useState("north"); const [offset, setOffset] = useState(500); const [width, setWidth] = useState(900);
  return <form className="inline-form" onSubmit={(event) => { event.preventDefault(); onSubmit({ wall, offsetMm: offset, widthMm: width, swing: "inward_left" }); }}><label>Wall<select value={wall} onChange={(event) => setWall(event.target.value)}><option>north</option><option>east</option><option>south</option><option>west</option></select></label><label>From corner<input type="number" value={offset} onChange={(event) => setOffset(Number(event.target.value))} /><small>mm</small></label><label>Width<input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} /><small>mm</small></label><button className="quiet-button" type="submit"><Plus size={16} />Add</button></form>;
}

function ManualEquipmentForm({ onSubmit }: { onSubmit: (item: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(""); const [width, setWidth] = useState(1200); const [length, setLength] = useState(1200); const [height, setHeight] = useState(2100);
  return <form className="inline-form manual" onSubmit={(event) => { event.preventDefault(); onSubmit({ identityKind: "manual", name, widthMm: width, lengthMm: length, heightMm: height }); }}><label>Name<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>W mm<input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label>D mm<input type="number" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label><label>H mm<input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><button className="quiet-button" type="submit"><Plus size={16} />Add footprint</button></form>;
}
