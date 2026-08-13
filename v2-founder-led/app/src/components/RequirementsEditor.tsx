import { useEffect, useMemo, useRef, useState } from "react";
import { Check, LocateFixed, PackageSearch, Pencil, Plus, RefreshCw, Ruler, Target, WalletCards } from "lucide-react";
import type { PlanState, RequirementPatch, Variant } from "../../shared/types";

interface Props {
  state: PlanState;
  catalogue: Variant[];
  busy: boolean;
  highlightEquipment: boolean;
  onPatch: (patches: RequirementPatch[]) => Promise<void>;
  onRecommend: () => Promise<void>;
  onAddExisting: (item: Record<string, unknown>) => Promise<void>;
  onUpgradeIntent: (query: string, message: string) => Promise<void>;
}

const focuses = [
  { label: "Weight lifting", values: ["strength"] },
  { label: "Bodybuilding", values: ["bodybuilding"] },
  { label: "Cardio", values: ["cardio"] },
  { label: "Gymnastics / open floor", values: ["calisthenics"] },
  { label: "Hybrid", values: ["strength", "cardio"] },
];

const upgradeIntents = [
  { label: "Spotter arms", query: "compatible spotter arms" },
  { label: "Cable training", query: "compatible cable kit" },
  { label: "Dip handles", query: "compatible dip handles" },
  { label: "Gym rings", query: "compatible gym rings" },
  { label: "Landmine work", query: "compatible landmine" },
  { label: "Plate storage", query: "plate storage" },
];

export function RequirementsEditor({ state, catalogue, busy, highlightEquipment, onPatch, onRecommend, onAddExisting, onUpgradeIntent }: Props) {
  const [manualOpen, setManualOpen] = useState(false);
  const equipmentRef = useRef<HTMLElement>(null);
  const rackOptions = useMemo(() => catalogue.filter((item) => item.category === "rack"), [catalogue]);
  const existing = state.existingEquipment[0];
  const existingName = existing?.identityKind === "manual"
    ? existing.name
    : existing ? catalogue.find((item) => item.variantId === existing.variantId)?.name ?? "Known equipment" : "";
  useEffect(() => {
    if (!highlightEquipment) return;
    equipmentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => equipmentRef.current?.querySelector("select")?.focus(), 250);
  }, [highlightEquipment]);

  const room = state.requirements.room;
  const updateRoom = (field: "room.lengthMm" | "room.widthMm" | "room.heightMm", value: string) => onPatch([{ field, value: Math.max(0, Math.round(Number(value) * 1000)) }]);
  const roomReady = room.lengthMm.value != null && room.widthMm.value != null && room.heightMm.value != null;
  const upgradeReady = state.journeyType.value === "upgrade" && Boolean(existing) && roomReady;

  return <div className="requirements-editor">
    <section className={`inspector-section ${state.journeyType.value === "upgrade" && !roomReady ? "attention" : ""}`}>
      <div className="section-title"><Ruler size={17} /><h3>Room</h3><small>{[room.lengthMm.value, room.widthMm.value, room.heightMm.value].filter((value) => value != null).length}/3</small></div>
      {state.journeyType.value === "upgrade" && !roomReady && <p className="control-prompt"><LocateFixed size={15} />Enter the room size first</p>}
      <div className="room-fields">
        <label>Length<span><input type="number" min="0" step="0.1" value={(room.lengthMm.value ?? 0) / 1000} onChange={(event) => updateRoom("room.lengthMm", event.target.value)} />M</span></label>
        <label>Width<span><input type="number" min="0" step="0.1" value={(room.widthMm.value ?? 0) / 1000} onChange={(event) => updateRoom("room.widthMm", event.target.value)} />M</span></label>
        <label>Height<span><input type="number" min="0" step="0.1" value={(room.heightMm.value ?? 0) / 1000} onChange={(event) => updateRoom("room.heightMm", event.target.value)} />M</span></label>
      </div>
    </section>

    {state.journeyType.value !== "upgrade" && <section className="inspector-section">
      <div className="section-title"><Target size={17} /><h3>Training</h3></div>
      <div className="choice-grid">{focuses.map((focus) => <button type="button" key={focus.label} className={focus.values.every((value) => (state.requirements.goals.value ?? []).includes(value)) ? "active" : ""} onClick={() => onPatch([{ field: "goals", value: focus.values }])}>{focus.label}</button>)}</div>
      <label>Experience<select value={state.requirements.experience.value ?? ""} onChange={(event) => event.target.value && onPatch([{ field: "experience", value: event.target.value as "beginner" | "some_experience" | "experienced" }])}><option value="">Choose</option><option value="beginner">Beginner</option><option value="some_experience">Some experience</option><option value="experienced">Experienced</option></select></label>
    </section>}

    {state.journeyType.value === "upgrade" && <>
      <section ref={equipmentRef} className={`inspector-section equipment-owned ${highlightEquipment ? "attention" : ""}`} aria-label="Equipment you own" tabIndex={-1}>
        <div className="section-title"><Pencil size={17} /><h3>Equipment you own</h3></div>
        {highlightEquipment && <p className="control-prompt"><LocateFixed size={15} />Choose your equipment here</p>}
        {existing ? <><p className="confirmed-line"><Check size={16} />{existingName}</p><label>Change equipment<select disabled={!roomReady || busy} value={existing.identityKind === "manual" ? "" : existing.variantId} onChange={(event) => event.target.value && onAddExisting({ identityKind: "northstar", variantId: event.target.value })}><option value="">Choose exact model</option>{rackOptions.map((rack) => <option value={rack.variantId} key={rack.variantId}>{rack.name} ({rack.sku})</option>)}</select></label></> : <>
          <label>Northstar rack<select disabled={!roomReady || busy} defaultValue="" onChange={(event) => event.target.value && onAddExisting({ identityKind: "northstar", variantId: event.target.value })}><option value="">Choose exact model</option>{rackOptions.map((rack) => <option value={rack.variantId} key={rack.variantId}>{rack.name} ({rack.sku})</option>)}</select></label>
          <button className="text-button" type="button" disabled={!roomReady || busy} onClick={() => setManualOpen((open) => !open)}><Plus size={16} />Enter another item</button>
          {manualOpen && <ManualEquipmentForm onSubmit={async (item) => { await onAddExisting(item); setManualOpen(false); }} />}
        </>}
      </section>
      <section className="inspector-section">
        <div className="section-title"><PackageSearch size={17} /><h3>What would you like to improve?</h3></div>
        <p className="section-help">Choose a shortcut or tell Mara in your own words.</p>
        <div className="choice-grid upgrade-choices">{upgradeIntents.map((intent) => <button type="button" key={intent.label} disabled={!upgradeReady || busy} onClick={() => onUpgradeIntent(intent.query, `Please add ${intent.label.toLowerCase()} to my equipment.`)}>{intent.label}</button>)}</div>
      </section>
    </>}

    <section className="inspector-section budget-section">
      <div className="section-title"><WalletCards size={17} /><h3>{state.journeyType.value === "upgrade" ? "Upgrade budget (optional)" : "All-in budget"}</h3></div>
      <label>Maximum<span className="money-input">EUR<input type="number" min="0" step="50" value={(state.requirements.budgetCents.value ?? 0) / 100} onChange={(event) => onPatch([{ field: "budgetCents", value: Math.round(Number(event.target.value) * 100) }])} /></span></label>
      {state.requirements.budgetCents.value != null && <small>Hard cap: EUR {(state.requirements.budgetCents.value / 100).toLocaleString("en-IE")}</small>}
    </section>

    <div className="build-bar">
      <span>{state.journeyType.value === "upgrade" ? (upgradeReady ? "Choose an upgrade above or ask Mara" : "Room and owned equipment needed") : state.blockers.length ? `${state.blockers.length} detail${state.blockers.length === 1 ? "" : "s"} still needed` : "Ready for a checked plan"}</span>
      {state.journeyType.value !== "upgrade" && <button className="primary-button" type="button" disabled={state.blockers.length > 0 || busy} onClick={onRecommend}><RefreshCw size={17} className={busy ? "spin" : ""} />{state.recommendation.status === "empty" ? "Build plan" : "Recalculate"}</button>}
    </div>
  </div>;
}

function ManualEquipmentForm({ onSubmit }: { onSubmit: (item: Record<string, unknown>) => Promise<void> }) {
  const [name, setName] = useState(""); const [width, setWidth] = useState(1200); const [length, setLength] = useState(1200); const [height, setHeight] = useState(2100);
  return <form className="inline-form manual" onSubmit={(event) => { event.preventDefault(); onSubmit({ identityKind: "manual", name, widthMm: width, lengthMm: length, heightMm: height }); }}><label>Name<input required value={name} onChange={(event) => setName(event.target.value)} /></label><label>W mm<input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label>D mm<input type="number" value={length} onChange={(event) => setLength(Number(event.target.value))} /></label><label>H mm<input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><button className="quiet-button" type="submit"><Plus size={16} />Add footprint</button></form>;
}
