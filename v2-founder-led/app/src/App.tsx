import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ClipboardList, Dumbbell, MessageCircle, PanelRight, Quote, RefreshCw, Sparkles, Undo2 } from "lucide-react";
import type { ChatMessage, PlanAlternative, PlanState, RequirementPatch, Variant } from "../shared/types";
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
type Activity = "startup" | "chat" | "build" | "catalogue" | null;
interface PendingAddition { query: string; name: string; projectedTotalCents: number; overrunCents: number; }
type Replacement = { product: Variant; totalCents: number; differenceCents: number };

export default function App() {
const Room3D = lazy(() => import("./components/Room3D").then((module) => ({ default: module.Room3D })));

  const [state, setState] = useState<PlanState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [catalogue, setCatalogue] = useState<Variant[]>([]);
  const [alternatives, setAlternatives] = useState<PlanAlternative[]>([]);
  const [busy, setBusy] = useState(false);
  const [activity, setActivity] = useState<Activity>(null);
  const [bootSlow, setBootSlow] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("plan");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [roomView, setRoomView] = useState<"2d" | "3d">("2d");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingAddition, setPendingAddition] = useState<PendingAddition | null>(null);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [recentAction, setRecentAction] = useState<string | null>(null);
  const stateRef = useRef<PlanState | null>(null);
  const patchQueueRef = useRef<Promise<void>>(Promise.resolve());

  const initialise = useCallback(async () => {
    setBusy(true); setActivity("startup"); setBootSlow(false); setError(null);
    try {
      const [created, items] = await Promise.all([api.createPlan(), api.getCatalogue()]);
      stateRef.current = created.state; setState(created.state); setMessages(created.messages); setCatalogue(items.variants); setAlternatives([]); setReplacements([]); setSelectedId(null); setPendingAddition(null); setRecentAction(null); setInspectorTab("plan"); setMobileTab("chat"); setRoomView("2d"); setNotice("A new anonymous plan is ready.");
    } catch { setError("Northstar could not start a new plan. Please retry."); }
    finally { setBusy(false); setActivity(null); }
  }, []);

  useEffect(() => { initialise(); }, [initialise]);

  useEffect(() => {
    if (state || !busy) return;
    const timer = window.setTimeout(() => setBootSlow(true), 6000);
    return () => window.clearTimeout(timer);
  }, [state, busy]);

  useEffect(() => {
    let active = true;
    if (!state || state.status !== "current") { setAlternatives([]); return; }
    api.getAlternatives(state.planId)
      .then((result) => { if (active) setAlternatives(result.alternatives); })
      .catch(() => { if (active) setAlternatives([]); });
    return () => { active = false; };
  }, [state?.planId, state?.eventVersion, state?.status]);

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
      const journey = patches.length === 1 && patches[0].field === "journeyType" ? patches[0].value : null;
      if (journey && currentState.journeyType.value === journey) return;
      try {
        const result = await api.patchRequirements(currentState.planId, currentState.eventVersion, patches);
        stateRef.current = result.state; setState(result.state); setNotice("Plan details updated.");
      } catch (value) { handleApiError(value); }
    });
    return patchQueueRef.current;
  };

  const send = async (message: string) => {
    if (!state) return;
    if (state.status === "current" && /\b(add|include)\b/i.test(message) && /\b(spotter|j-?hook|ring|rower|rowing machine|bike|stepper|cable|dip|landmine|plate storage)\b/i.test(message)) {
      await addRefinement(message, message);
      return;
    }
    setBusy(true); setActivity("chat"); setError(null);
    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: message, createdAt: new Date().toISOString() };
    setMessages((current) => [...current, user]);
    try {
      const result = await api.chat(state.planId, state.eventVersion, message); stateRef.current = result.state; setState(result.state); setMessages((current) => [...current, result.message]);
      if (result.state.status === "current") { setMobileTab("room"); setInspectorTab("plan"); }
      else if (result.state.journeyType.value === "upgrade" && result.state.blockers.includes("existingEquipment")) { setInspectorTab("plan"); setMobileTab("plan"); setNotice("Choose your equipment in the highlighted Plan section."); }
    } catch (value) { setMessages((current) => current.filter((item) => item.id !== user.id)); handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const recommend = async () => {
    if (!state) return; setBusy(true); setActivity("build"); setError(null); setNotice("Checking current products, room layouts and the complete quote.");
    try { const result = await api.recommend(state.planId, state.eventVersion); stateRef.current = result.state; setState(result.state); if (result.state.selectedItems[0]) setSelectedId(result.state.selectedItems[0]); setNotice(result.state.status === "current" ? "Checked plan ready." : "The current constraints need review."); }
    catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const stateAction = async (action: () => Promise<{ state: PlanState }>, success = "Plan updated.") => {
    setError(null);
    try { const result = await action(); stateRef.current = result.state; setState(result.state); setNotice(success); }
    catch (value) { handleApiError(value); throw value; }
  };

  const addRefinement = async (query: string, userMessage: string) => {
    const current = stateRef.current;
    if (!current) return;
    setPendingAddition(null); const user: ChatMessage = { id: crypto.randomUUID(), role: "user", text: userMessage, createdAt: new Date().toISOString() };
    setMessages((existing) => [...existing, user]);
    setBusy(true); setActivity("build"); setError(null);
    try {
      const result = await api.addRecommendedItem(current.planId, current.eventVersion, query);
      stateRef.current = result.state; setState(result.state); setSelectedId(result.product.variantId); setRoomView("3d");
      const total = result.state.quote.grandTotalCents == null ? "The quote is being refreshed." : `The complete known total is now EUR ${(result.state.quote.grandTotalCents / 100).toLocaleString("en-IE")}.`;
      const text = result.alreadySelected ? `${result.product.name} is already included in your plan.` : `I've added ${result.product.name} and updated the room view and quote. ${total}`;
      setMessages((existing) => [...existing, { id: crypto.randomUUID(), role: "assistant", text, createdAt: new Date().toISOString() }]);
      setNotice(`${result.product.name} checked and added.`); setRecentAction(`${result.product.name} added`);
    } catch (value) {
      if (value instanceof ApiError && ["PRODUCT_NOT_FOUND", "ITEM_DOES_NOT_FIT", "BUDGET_EXCEEDED"].includes(String(value.body.code))) {
        const product = value.body.product as Variant | undefined;
        const projectedTotalCents = typeof value.body.projectedTotalCents === "number" ? value.body.projectedTotalCents : null;
        const overrunCents = typeof value.body.overrunCents === "number" ? value.body.overrunCents : null;
        if (value.body.code === "BUDGET_EXCEEDED" && product && projectedTotalCents != null && overrunCents != null) {
          setPendingAddition({ query, name: product.name, projectedTotalCents, overrunCents });
          setMessages((existing) => [...existing, { id: crypto.randomUUID(), role: "assistant", text: `${product.name} would bring the total to EUR ${(projectedTotalCents / 100).toLocaleString("en-IE")}, which is EUR ${(overrunCents / 100).toLocaleString("en-IE")} over your current budget. Would you like to add it anyway?`, createdAt: new Date().toISOString() }]);
        } else {
          const text = value.body.code === "ITEM_DOES_NOT_FIT" ? `I found ${product?.name ?? "that item"}, but it does not pass the current room checks, so I left the plan unchanged.` : "I couldn't find that exact product with the compatibility evidence needed for this plan, so I left the plan unchanged.";
          setMessages((existing) => [...existing, { id: crypto.randomUUID(), role: "assistant", text, createdAt: new Date().toISOString() }]);
        }
      } else {
        handleApiError(value);
      }
    } finally { setBusy(false); setActivity(null); }
  };

  const authorisePendingAddition = async () => {
    const current = stateRef.current; const pending = pendingAddition;
    if (!current || !pending) return;
    setBusy(true); setActivity("build"); setError(null);
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: `Add ${pending.name} - EUR ${(pending.overrunCents / 100).toLocaleString("en-IE")} over`, createdAt: new Date().toISOString() }]);
    try {
      const consented = await api.consentBudget(current.planId, current.eventVersion, pending.overrunCents);
      const result = await api.addRecommendedItem(consented.state.planId, consented.state.eventVersion, pending.query);
      stateRef.current = result.state; setState(result.state); setSelectedId(result.product.variantId); setRoomView("3d"); setPendingAddition(null); setRecentAction(`${result.product.name} added`);
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: `I've added ${result.product.name}, checked the room again and updated the complete quote to EUR ${((result.state.quote.grandTotalCents ?? 0) / 100).toLocaleString("en-IE")}.`, createdAt: new Date().toISOString() }]);
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const declinePendingAddition = () => {
    if (!pendingAddition) return;
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text: `Keep the current plan without ${pendingAddition.name}.`, createdAt: new Date().toISOString() }]);
    setPendingAddition(null);
  };

  const skipRefinement = (message: string) => {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: message, createdAt: new Date().toISOString() }]);
  };

  const refreshCatalogue = async () => {
    setBusy(true); setActivity("catalogue"); setError(null);
    try { const refreshed = await api.refreshCatalogue(); const items = await api.getCatalogue(); setCatalogue(items.variants); setState((current) => current ? { ...current, catalogueSnapshotId: refreshed.snapshotId, sourceStatus: { ...current.sourceStatus, catalogueFreshness: refreshed.freshness as PlanState["sourceStatus"]["catalogueFreshness"], observedAt: refreshed.observedAt } } : current); setNotice(`Current catalogue checked ${checkedTime(refreshed.observedAt)}.`); }
    catch { setError("Current catalogue details could not be refreshed. Existing planning values have been kept with their checked time."); }
    finally { setBusy(false); setActivity(null); }
  };

  const selectItem = useCallback((id: string | null) => { setSelectedId(id); if (id) { setInspectorTab("details"); setMobileTab("plan"); } }, []);
  const selected = useMemo(() => selectedId ? variantById(catalogue, selectedId) : undefined, [catalogue, selectedId]);
  const applyAlternative = async (alternativeId: PlanAlternative["id"]) => {
    const current = stateRef.current;
    if (!current) return;
    setBusy(true); setActivity("build"); setError(null);
    try {
      const result = await api.applyAlternative(current.planId, alternativeId, current.eventVersion);
      stateRef.current = result.state; setState(result.state); setNotice("Checked plan option applied."); setRoomView("3d");
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  useEffect(() => {
    if (!state || !selectedId || !state.selectedItems.includes(selectedId)) { setReplacements([]); return; }
    let active = true;
    api.getReplacements(state.planId, selectedId).then((result) => { if (active) setReplacements(result.replacements); }).catch(() => { if (active) setReplacements([]); });
    return () => { active = false; };
  }, [state?.planId, state?.eventVersion, selectedId]);

  const replaceProduct = async (variantId: string, replacementVariantId: string) => {
    const current = stateRef.current; if (!current) return;
    setBusy(true); setActivity("build"); setError(null);
    try {
      const result = await api.replaceProduct(current.planId, variantId, replacementVariantId, current.eventVersion);
      stateRef.current = result.state; setState(result.state); setSelectedId(result.product.variantId); setNotice(`${result.product.name} checked and added to the plan.`); setRecentAction(`${result.product.name} replaced the previous item`); setRoomView("3d");
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const removeProduct = async (variantId: string) => {
    const current = stateRef.current; if (!current) return;
    setBusy(true); setActivity("build"); setError(null);
    try { const result = await api.removeItem(current.planId, variantId, current.eventVersion); stateRef.current = result.state; setState(result.state); setSelectedId(null); setInspectorTab("plan"); setRecentAction("Item removed"); setNotice("Item removed and plan rechecked."); }
    catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const undoRecent = async () => {
    const current = stateRef.current; if (!current) return;
    setBusy(true); setActivity("build");
    try { const result = await api.undo(current.planId, current.eventVersion); stateRef.current = result.state; setState(result.state); setRecentAction(null); setNotice("Previous plan change undone."); }
    catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const addExisting = async (equipment: Record<string, unknown>) => {
    const current = stateRef.current; if (!current) return;
    setBusy(true); setActivity("build");
    try {
      const result = await api.addExisting(current.planId, current.eventVersion, equipment); stateRef.current = result.state; setState(result.state); setMobileTab("chat"); setInspectorTab("plan");
      const selectedEquipment = result.state.existingEquipment[0]; const name = !selectedEquipment ? "your equipment" : selectedEquipment.identityKind === "manual" ? selectedEquipment.name : catalogue.find((item) => item.variantId === selectedEquipment.variantId)?.name ?? "your equipment";
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: `${name} is now the equipment we're upgrading. What would you like to add or improve?`, createdAt: new Date().toISOString() }]);
      setNotice(`${name} selected.`);
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };

  const consentBudget = async (maximumOverrunCents: number) => {

    const current = stateRef.current;
    if (!current) return;
    setBusy(true); setActivity("build"); setError(null);
    try {
      const consented = await api.consentBudget(current.planId, current.eventVersion, maximumOverrunCents);
      stateRef.current = consented.state; setState(consented.state);
      const rebuilt = await api.recommend(consented.state.planId, consented.state.eventVersion);
      stateRef.current = rebuilt.state; setState(rebuilt.state);
      setNotice(`The exact EUR ${(maximumOverrunCents / 100).toFixed(2)} budget exception was recorded and checked.`);
    } catch (value) { handleApiError(value); }
    finally { setBusy(false); setActivity(null); }
  };


  if (!state) return <main className="boot-screen"><div className="brand-mark large"><Dumbbell aria-hidden="true" /></div><h1>Northstar</h1><p>{error ?? "Preparing your home-gym workspace..."}</p>{!error && <><div className="boot-progress" role="progressbar" aria-label="Preparing home-gym workspace"><span /></div><small>{bootSlow ? "The planning service is starting. The first visit can take up to a minute." : "Connecting to current equipment information..."}</small></>}{error && <button className="primary-button" onClick={initialise}><RefreshCw size={18} />Retry</button>}</main>;
  const thinkingLabel = activity === "chat"
    ? "Mara is typing..."
    : activity === "build" ? "Mara is arranging your space..." : null;


  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Dumbbell aria-hidden="true" /></div><div><strong>Northstar</strong><small>Home Gym Planner</small></div></div>
      <div className="journey-control" aria-label="Planning journey">
        <button disabled={busy} className={state.journeyType.value === "new_space" ? "active" : ""} onClick={() => state.journeyType.value !== "new_space" && send("I want to plan a new gym space.")}>Plan a gym</button>
        <button disabled={busy} className={state.journeyType.value === "upgrade" ? "active" : ""} onClick={() => state.journeyType.value !== "upgrade" && send("I want to upgrade equipment I already own.")}>Upgrade equipment</button>
      </div>
      <div className={`plan-status ${state.status}`}><span aria-hidden="true" />{statusLabel[state.status]}</div>
      <button className="freshness-button" onClick={refreshCatalogue} disabled={busy} title="Refresh current catalogue"><RefreshCw className={busy ? "spin" : ""} size={16} /><span>Checked {checkedTime(state.sourceStatus.observedAt)}</span></button>
    </header>

    <div className="summary-rail"><span>{metres(state.requirements.room.lengthMm.value)} x {metres(state.requirements.room.widthMm.value)} x {metres(state.requirements.room.heightMm.value)}</span><span>{state.selectedItems.length} item{state.selectedItems.length === 1 ? "" : "s"}</span><span>{state.quote.grandTotalCents == null ? "Quote pending" : `EUR ${(state.quote.grandTotalCents / 100).toLocaleString("en-IE")}`}</span><span className={state.status}>{statusLabel[state.status]}</span></div>
    {notice && <div className="sr-only" role="status" aria-live="polite">{notice}</div>}
    {error && <div className="global-error" role="alert">{error}<button onClick={() => setError(null)}>Dismiss</button></div>}

    <div className={`workspace mobile-${mobileTab}`}>
      <ChatPane key={state.planId} state={state} catalogue={catalogue} messages={messages} busy={busy} thinkingLabel={thinkingLabel} pendingAddition={pendingAddition} onNewChat={() => window.confirm("Start a new chat? Your current plan will be cleared.") && initialise()} onSend={send} onBuild={recommend} onAddRefinement={addRefinement} onSkipRefinement={skipRefinement} onAuthoriseAddition={authorisePendingAddition} onDeclineAddition={declinePendingAddition} />
      <section className="room-workspace" aria-label="Room workspace">
        <header className="workspace-header"><div className="view-control" aria-label="Room view"><button className={roomView === "2d" ? "active" : ""} onClick={() => setRoomView("2d")}>2D plan</button><button className={roomView === "3d" ? "active" : ""} onClick={() => setRoomView("3d")}>3D room</button></div><button className="plan-drawer-button" onClick={() => setMobileTab("plan")}><PanelRight size={17} />Plan and quote</button></header>
        <div className="room-surface" role="region" aria-label="Interactive room plan" tabIndex={0}>
          {roomView === "2d" ? <Planner2D state={state} catalogue={catalogue} selectedId={selectedId} onSelect={selectItem} onPlacement={(placementId, update) => stateAction(() => api.updatePlacement(state.planId, placementId, state.eventVersion, update))} onRemove={(placementId) => stateAction(() => api.removePlacement(state.planId, placementId, state.eventVersion))} onRegenerate={() => stateAction(() => api.regenerateLayout(state.planId, state.eventVersion), "Unlocked equipment recalculated.")} onUndo={() => stateAction(() => api.undo(state.planId, state.eventVersion), "Previous change restored and checks refreshed.")} onRedo={() => stateAction(() => api.redo(state.planId, state.eventVersion), "Change reapplied and checks refreshed.")} /> : <Suspense fallback={<div className="planner-empty"><Box size={38} /><h2>Preparing room view</h2></div>}><Room3D state={state} catalogue={catalogue} selectedId={selectedId} onSelect={selectItem} onReturn2D={() => setRoomView("2d")} /></Suspense>}
        </div>
      </section>
      <aside className="plan-inspector" aria-label="Plan inspector">
        <div className="inspector-tabs" role="tablist"><button role="tab" aria-selected={inspectorTab === "plan"} className={inspectorTab === "plan" ? "active" : ""} onClick={() => setInspectorTab("plan")}>Plan</button><button role="tab" aria-selected={inspectorTab === "quote"} className={inspectorTab === "quote" ? "active" : ""} onClick={() => setInspectorTab("quote")}>Quote</button><button role="tab" aria-selected={inspectorTab === "details"} className={inspectorTab === "details" ? "active" : ""} onClick={() => setInspectorTab("details")}>Details</button></div>
        <div className="inspector-scroll">
          {inspectorTab === "plan" && <><RequirementsEditor state={state} catalogue={catalogue} busy={busy} highlightEquipment={state.journeyType.value === "upgrade" && state.blockers.includes("existingEquipment")} onPatch={patch} onRecommend={recommend} onAddExisting={addExisting} onUpgradeIntent={addRefinement} /><PlanSummary state={state} catalogue={catalogue} alternatives={alternatives} selectedId={selectedId} busy={busy} onSelect={selectItem} onApplyAlternative={applyAlternative} /></>}
          {inspectorTab === "quote" && <QuoteView state={state} busy={busy} onConsent={consentBudget} />}
          {inspectorTab === "details" && <DetailsView variant={selected} state={state} replacements={replacements} busy={busy} onReplace={replaceProduct} onRemove={removeProduct} />}
        </div>
      </aside>
    </div>

    <nav className="mobile-nav" aria-label="Planner sections">
      <button className={mobileTab === "chat" ? "active" : ""} onClick={() => setMobileTab("chat")}><MessageCircle size={20} />Chat</button>
      <button className={mobileTab === "plan" ? "active" : ""} onClick={() => { setMobileTab("plan"); setInspectorTab("plan"); }}><ClipboardList size={20} />Plan{state.blockers.length > 0 && <b>{state.blockers.length}</b>}</button>
      <button className={mobileTab === "room" ? "active" : ""} onClick={() => setMobileTab("room")}><Box size={20} />Room</button>
      <button className={mobileTab === "quote" ? "active" : ""} onClick={() => { setMobileTab("quote"); setInspectorTab("quote"); }}><Quote size={20} />Quote</button>
    </nav>
    {recentAction && !busy && <div className="recent-action" role="status"><span>{recentAction}</span><button type="button" onClick={undoRecent}><Undo2 size={15} />Undo</button></div>}
    {busy && activity === "build" && <div className="operation-strip" role="status"><Sparkles size={16} />Comparing equipment | Arranging the room | Updating the quote</div>}
  </main>;
}
