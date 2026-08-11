import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ChevronDown, ClipboardList, MessageCircle, PanelRight, Quote, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import type { ChatMessage, PlanState, RequirementPatch, Variant } from "../shared/types";
import { api, ApiError } from "./api";
import { ChatPane } from "./components/ChatPane";
import { DetailsView } from "./components/DetailsView";
import { Planner2D } from "./components/Planner2D";
import { PlanSummary } from "./components/PlanSummary";
import { QuoteView } from "./components/QuoteView";
import { RequirementsEditor } from "./components/RequirementsEditor";
import { checkedTime, metres, statusLabel, variantById } from "./utils";

type InspectorTab = "plan" | "quote" | "details";
type MobileTab = "chat" | "plan" | "room" | "quote";

export default function App() {
const Room3D = lazy(() => import("./components/Room3D").then((module) => ({ default: module.Room3D })));

  const [state, setState] = useState<PlanState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [catalogue, setCatalogue] = useState<Variant[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("plan");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [roomView, setRoomView] = useState<"2d" | "3d">("2d");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stateRef = useRef<PlanState | null>(null);
  const patchQueueRef = useRef<Promise<void>>(Promise.resolve());

  const initialise = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const [created, items] = await Promise.all([api.createPlan(), api.getCatalogue()]);
      stateRef.current = created.state; setState(created.state); setMessages(created.messages); setCatalogue(items.variants); setNotice("A new anonymous plan is ready.");
    } catch { setError("Northstar could not start a new plan. Please retry."); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { initialise(); }, [initialise]);

  const handleApiError = (value: unknown) => {
    if (value instanceof ApiError && value.status === 409 && value.body.state) {
      stateRef.current = value.body.state as unknown as PlanState; setState(stateRef.current); setError("Your plan changed while that was being checked. The newer values were kept.");
    } else setError(value instanceof Error ? value.message : "That action could not be completed. Your current plan has been kept.");
  };

  const patch = (patches: RequirementPatch[]): Promise<void> => {
    setError(null);
    patchQueueRef.current = patchQueueRef.current.catch(() => undefined).then(async () => {
      const currentState = stateRef.current;
      if (!currentState) return;
      try {
        const result = await api.patchRequirements(currentState.planId, currentState.eventVersion, patches);
        stateRef.current = result.state; setState(result.state); setNotice("Plan updated.");
        const field = patches[0]?.field.replaceAll("Mm", "").replaceAll(".", " ");
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "system" as const, text: `${field} changed`, createdAt: new Date().toISOString() }].slice(-24));
      } catch (value) { handleApiError(value); }
    });
    return patchQueueRef.current;
  };

  const send = async (message: string) => {
    if (!state) return; setBusy(true); setError(null);
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: message, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, user]);
    try {
      const result = await api.chat(state.planId, state.eventVersion, message); stateRef.current = result.state; setState(result.state); setMessages((current) => [...current, result.message]);
      if (result.state.status === "current") { setMobileTab("room"); setInspectorTab("plan"); }
    } catch (value) { setMessages((current) => current.filter((item) => item.id !== user.id)); handleApiError(value); }
    finally { setBusy(false); }
  };

  const recommend = async () => {
    if (!state) return; setBusy(true); setError(null); setNotice("Checking current products, room layouts and the complete quote.");
    try { const result = await api.recommend(state.planId, state.eventVersion); stateRef.current = result.state; setState(result.state); if (result.state.selectedItems[0]) setSelectedId(result.state.selectedItems[0]); setNotice(result.state.status === "current" ? "Checked plan ready." : "The current constraints need review."); }
    catch (value) { handleApiError(value); }
    finally { setBusy(false); }
  };

  const stateAction = async (action: () => Promise<{ state: PlanState }>, success = "Plan updated.") => {
    setError(null);
    try { const result = await action(); stateRef.current = result.state; setState(result.state); setNotice(success); }
    catch (value) { handleApiError(value); throw value; }
  };

  const refreshCatalogue = async () => {
    setBusy(true); setError(null);
    try { const refreshed = await api.refreshCatalogue(); const items = await api.getCatalogue(); setCatalogue(items.variants); setState((current) => current ? { ...current, catalogueSnapshotId: refreshed.snapshotId, sourceStatus: { ...current.sourceStatus, catalogueFreshness: refreshed.freshness as PlanState["sourceStatus"]["catalogueFreshness"], observedAt: refreshed.observedAt } } : current); setNotice(`Current catalogue checked ${checkedTime(refreshed.observedAt)}.`); }
    catch { setError("Current catalogue details could not be refreshed. Existing planning values have been kept with their checked time."); }
    finally { setBusy(false); }
  };

  const selectItem = useCallback((id: string | null) => { setSelectedId(id); if (id) setInspectorTab("details"); }, []);
  const selected = useMemo(() => selectedId ? variantById(catalogue, selectedId) : undefined, [catalogue, selectedId]);
  const consentBudget = async (maximumOverrunCents: number) => {
    const current = stateRef.current;
    if (!current) return;
    setBusy(true); setError(null);
    try {
      const consented = await api.consentBudget(current.planId, current.eventVersion, maximumOverrunCents);
      stateRef.current = consented.state; setState(consented.state);
      const rebuilt = await api.recommend(consented.state.planId, consented.state.eventVersion);
      stateRef.current = rebuilt.state; setState(rebuilt.state);
      setNotice(`The exact EUR ${(maximumOverrunCents / 100).toFixed(2)} budget exception was recorded and checked.`);
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); }
  };


  if (!state) return <main className="boot-screen"><div className="brand-mark large"><span /><span /><span /></div><h1>Northstar</h1><p>{error ?? "Preparing your planning workspace..."}</p><button className="primary-button" onClick={initialise} disabled={busy}><RefreshCw className={busy ? "spin" : ""} size={18} />Retry</button></main>;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>Northstar</strong><small>Space Planner</small></div></div>
      <div className="journey-control" aria-label="Planning journey">
        <button className={state.journeyType.value === "new_space" ? "active" : ""} onClick={() => patch([{ field: "journeyType", value: "new_space" }])}>Plan a gym</button>
        <button className={state.journeyType.value === "upgrade" ? "active" : ""} onClick={() => patch([{ field: "journeyType", value: "upgrade" }])}>Upgrade equipment</button>
      </div>
      <div className={`plan-status ${state.status}`}><span aria-hidden="true" />{statusLabel[state.status]}</div>
      <button className="freshness-button" onClick={refreshCatalogue} disabled={busy} title="Refresh current catalogue"><RefreshCw className={busy ? "spin" : ""} size={16} /><span>Checked {checkedTime(state.sourceStatus.observedAt)}</span></button>
      <div className="top-menu"><button className="icon-button" aria-label="Plan menu" title="Plan menu"><ChevronDown size={18} /></button><button className="menu-popover" onClick={() => window.confirm("Start a new anonymous plan?") && initialise()}><RotateCcw size={16} />Start over</button></div>
    </header>

    <div className="summary-rail"><span>{metres(state.requirements.room.lengthMm.value)} × {metres(state.requirements.room.widthMm.value)} × {metres(state.requirements.room.heightMm.value)}</span><span>{state.selectedItems.length} item{state.selectedItems.length === 1 ? "" : "s"}</span><span>{state.quote.grandTotalCents == null ? "Quote pending" : `EUR ${(state.quote.grandTotalCents / 100).toLocaleString("en-IE")}`}</span><span className={state.status}>{statusLabel[state.status]}</span></div>
    {notice && <div className="sr-only" role="status" aria-live="polite">{notice}</div>}
    {error && <div className="global-error" role="alert">{error}<button onClick={() => setError(null)}>Dismiss</button></div>}

    <div className={`workspace mobile-${mobileTab}`}>
      <ChatPane state={state} catalogue={catalogue} messages={messages} busy={busy} onSend={send} />
      <section className="room-workspace" aria-label="Room workspace">
        <header className="workspace-header"><div className="view-control" aria-label="Room view"><button className={roomView === "2d" ? "active" : ""} onClick={() => setRoomView("2d")}>2D plan</button><button className={roomView === "3d" ? "active" : ""} onClick={() => setRoomView("3d")}>3D room</button></div><button className="plan-drawer-button" onClick={() => setMobileTab("plan")}><PanelRight size={17} />Plan and quote</button></header>
        <div className="room-surface" role="region" aria-label="Interactive room plan" tabIndex={0}>
          {roomView === "2d" ? <Planner2D state={state} catalogue={catalogue} selectedId={selectedId} onSelect={selectItem} onPlacement={(placementId, update) => stateAction(() => api.updatePlacement(state.planId, placementId, state.eventVersion, update))} onRemove={(placementId) => stateAction(() => api.removePlacement(state.planId, placementId, state.eventVersion))} onRegenerate={() => stateAction(() => api.regenerateLayout(state.planId, state.eventVersion), "Unlocked equipment recalculated.")} onUndo={() => stateAction(() => api.undo(state.planId, state.eventVersion), "Previous change restored and checks refreshed.")} onRedo={() => stateAction(() => api.redo(state.planId, state.eventVersion), "Change reapplied and checks refreshed.")} /> : <Suspense fallback={<div className="planner-empty"><Box size={38} /><h2>Preparing room view</h2></div>}><Room3D state={state} catalogue={catalogue} selectedId={selectedId} onSelect={selectItem} onReturn2D={() => setRoomView("2d")} /></Suspense>}
        </div>
      </section>
      <aside className="plan-inspector" aria-label="Plan inspector">
        <div className="inspector-tabs" role="tablist"><button role="tab" aria-selected={inspectorTab === "plan"} className={inspectorTab === "plan" ? "active" : ""} onClick={() => setInspectorTab("plan")}>Plan</button><button role="tab" aria-selected={inspectorTab === "quote"} className={inspectorTab === "quote" ? "active" : ""} onClick={() => setInspectorTab("quote")}>Quote</button><button role="tab" aria-selected={inspectorTab === "details"} className={inspectorTab === "details" ? "active" : ""} onClick={() => setInspectorTab("details")}>Details</button></div>
        <div className="inspector-scroll">
          {inspectorTab === "plan" && <><RequirementsEditor state={state} catalogue={catalogue} busy={busy} onPatch={patch} onRecommend={recommend} onAddExisting={(equipment) => stateAction(() => api.addExisting(state.planId, state.eventVersion, equipment), "Existing equipment recorded.")} onAddDoor={(door) => stateAction(() => api.addDoor(state.planId, state.eventVersion, door), "Door added to the room.")} /><PlanSummary state={state} catalogue={catalogue} selectedId={selectedId} onSelect={selectItem} /></>}
          {inspectorTab === "quote" && <QuoteView state={state} busy={busy} onConsent={consentBudget} />}
          {inspectorTab === "details" && <DetailsView variant={selected} />}
        </div>
      </aside>
    </div>

    <nav className="mobile-nav" aria-label="Planner sections">
      <button className={mobileTab === "chat" ? "active" : ""} onClick={() => setMobileTab("chat")}><MessageCircle size={20} />Chat</button>
      <button className={mobileTab === "plan" ? "active" : ""} onClick={() => { setMobileTab("plan"); setInspectorTab("plan"); }}><ClipboardList size={20} />Plan{state.blockers.length > 0 && <b>{state.blockers.length}</b>}</button>
      <button className={mobileTab === "room" ? "active" : ""} onClick={() => setMobileTab("room")}><Box size={20} />Room</button>
      <button className={mobileTab === "quote" ? "active" : ""} onClick={() => { setMobileTab("quote"); setInspectorTab("quote"); }}><Quote size={20} />Quote</button>
    </nav>
    {busy && <div className="operation-strip" role="status"><Sparkles size={16} />Checking current products · Testing room layouts · Building the quote</div>}
  </main>;
}
