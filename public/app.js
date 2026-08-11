const API_BASE = String(window.RACK_ADVISOR_API_BASE || "").replace(/\/$/, "");
const state = {
  options: null,
  selectedFamily: "",
  selectedRackId: "",
  configuration: {},
  categoryId: "",
  conditionAnswers: {},
  decision: null,
  changedInputs: []
};

const elements = {
  dataStatus: document.querySelector("#dataStatus"),
  liveStatus: document.querySelector("#liveStatus"),
  rackStep: document.querySelector("#rackStep"),
  categoryStep: document.querySelector("#categoryStep"),
  decisionArea: document.querySelector("#decisionArea"),
  rackForm: document.querySelector("#rackForm"),
  familySelect: document.querySelector("#familySelect"),
  rackSelect: document.querySelector("#rackSelect"),
  heightSelect: document.querySelector("#heightSelect"),
  configurationFields: document.querySelector("#configurationFields"),
  identityClues: document.querySelector("#identityClues"),
  rackContinue: document.querySelector("#rackContinue"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryOptions: document.querySelector("#categoryOptions"),
  rackSummary: document.querySelector("#rackSummary"),
  guidePanel: document.querySelector("#guidePanel"),
  panelBackdrop: document.querySelector("#panelBackdrop"),
  guideForm: document.querySelector("#guideForm"),
  guideQuestion: document.querySelector("#guideQuestion"),
  guideAnswer: document.querySelector("#guideAnswer"),
  guideSuggestions: document.querySelector("#guideSuggestions")
};

bindEvents();
await loadOptions();

function bindEvents() {
  elements.familySelect.addEventListener("change", () => {
    state.selectedFamily = elements.familySelect.value;
    state.selectedRackId = "";
    state.configuration = {};
    populateRacks();
    renderRackDependentFields();
  });
  elements.rackSelect.addEventListener("change", () => {
    state.selectedRackId = elements.rackSelect.value;
    state.configuration = {};
    renderRackDependentFields();
  });
  elements.rackForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!rackFormComplete()) return;
    showStep(2);
  });
  document.querySelector("#unresolvedButton").addEventListener("click", renderIdentityUnresolved);
  document.querySelector("#backToRack").addEventListener("click", () => showStep(1));
  elements.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.categoryId = new FormData(elements.categoryForm).get("category") || "";
    state.changedInputs = state.decision ? ["Upgrade type"] : [];
    await requestDecision();
  });
  document.querySelector("#closeGuide").addEventListener("click", closeGuide);
  elements.panelBackdrop.addEventListener("click", closeGuide);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.guidePanel.hidden) closeGuide(); });
  document.addEventListener("click", handleDelegatedClick);
  elements.guideForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await askGuide(elements.guideQuestion.value);
  });
  window.addEventListener("beforeprint", () => document.querySelectorAll(".evidence-details").forEach((details) => { details.dataset.printOpen = details.open; details.open = true; }));
  window.addEventListener("afterprint", () => document.querySelectorAll(".evidence-details").forEach((details) => { details.open = details.dataset.printOpen === "true"; }));
}

async function loadOptions() {
  setDataStatus("loading", "Checking live compatibility registry", "A fresh external request is in progress.");
  try {
    state.options = await api("/api/options");
    populateFamilies();
    populateCategories();
    setDataStatus("ready", "Live compatibility registry available", `Retrieved ${formatDateTime(state.options.registryRetrievedAt)}. No cached catalogue is in use.`);
    announce("Live rack options loaded.");
    elements.decisionArea.innerHTML = "";
    showStep(1);
  } catch (error) {
    state.options = null;
    setDataStatus("error", "Compatibility cannot currently be checked", error.message, true);
    renderSourceUnavailable(error.message, loadOptions, true);
    showStep(3);
  }
}

function populateFamilies() {
  const familyIds = [...new Set(state.options.racks.map((rack) => rack.rackFamilyId))];
  elements.familySelect.innerHTML = `<option value="">Select family</option>${familyIds.map((id) => `<option value="${escapeHtml(id)}">${escapeHtml(titleCase(id))}</option>`).join("")}`;
  elements.familySelect.disabled = false;
}

function populateRacks() {
  const racks = currentFamilyRacks();
  elements.rackSelect.innerHTML = `<option value="">Select exact version</option>${racks.map((rack) => `<option value="${escapeHtml(rack.rackVersionId)}">${escapeHtml(rack.displayName)}</option>`).join("")}`;
  elements.rackSelect.disabled = !racks.length;
}

function populateCategories() {
  const categories = [{ categoryId: "", label: "Show all upgrades" }, ...state.options.categories];
  elements.categoryOptions.innerHTML = categories.map((category, index) => `<label><input type="radio" name="category" value="${escapeHtml(category.categoryId)}" ${index === 0 ? "checked" : ""}><span>${escapeHtml(category.label)}</span></label>`).join("");
}

function renderRackDependentFields() {
  const rack = selectedRack();
  if (!rack) {
    elements.heightSelect.innerHTML = '<option value="">Select exact rack first</option>';
    elements.heightSelect.disabled = true;
    elements.configurationFields.innerHTML = "";
    elements.identityClues.innerHTML = "<p>Select an exact version to see registry-authored clues.</p>";
    elements.rackContinue.disabled = true;
    return;
  }
  elements.heightSelect.innerHTML = `<option value="${escapeHtml(rack.heightVariant || "not_applicable")}">${escapeHtml(rack.heightVariant || "Not applicable")}</option>`;
  elements.heightSelect.disabled = false;
  elements.configurationFields.innerHTML = rack.configurationSchema.map((field) => {
    const options = (field.options || []).map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("");
    return `<label>${escapeHtml(field.label)}<select data-config-id="${escapeHtml(field.id)}" ${field.required ? "required" : ""}><option value="">Select ${escapeHtml(field.label.toLowerCase())}</option>${options}</select></label>`;
  }).join("");
  elements.configurationFields.querySelectorAll("select").forEach((select) => select.addEventListener("change", () => {
    state.configuration[select.dataset.configId] = select.value;
    elements.rackContinue.disabled = !rackFormComplete();
  }));
  elements.identityClues.innerHTML = rack.identificationClues.length ? `<ul>${rack.identificationClues.map((clue) => `<li>${escapeHtml(clue)}</li>`).join("")}</ul>` : "<p>No additional clues are recorded.</p>";
  elements.rackContinue.disabled = !rackFormComplete();
}

function rackFormComplete() {
  const rack = selectedRack();
  return Boolean(rack && rack.configurationSchema.every((field) => !field.required || state.configuration[field.id]));
}

function showStep(step) {
  elements.rackStep.hidden = step !== 1;
  elements.categoryStep.hidden = step !== 2;
  if (step !== 3) elements.decisionArea.hidden = true;
  document.querySelectorAll("[data-step-indicator]").forEach((item) => {
    if (Number(item.dataset.stepIndicator) === step) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  if (step === 2) {
    const rack = selectedRack();
    elements.rackSummary.innerHTML = `<span><strong>${escapeHtml(rack.displayName)}</strong><br>${escapeHtml(rack.heightVariant || "Height not applicable")} ${configurationSummary()}</span><button class="text-button" type="button" data-action="edit-rack">Edit rack</button>`;
  }
  document.querySelector(step === 1 ? "#rack-heading" : step === 2 ? "#category-heading" : "#sheet-heading")?.focus?.();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function requestDecision() {
  showDecisionLoading();
  const payload = {
    rackVersionId: state.selectedRackId,
    configuration: state.configuration,
    categoryId: state.categoryId || null,
    conditionAnswers: state.conditionAnswers,
    changedInputs: state.changedInputs
  };
  try {
    state.decision = await api("/api/decision", { method: "POST", body: payload });
    setDataStatus("ready", "Live compatibility registry available", `Retrieved for this decision ${formatDateTime(state.decision.registryRetrievedAt)}.`);
    renderDecision();
    showStep(3);
    announce(`Decision Sheet refreshed with ${state.decision.results.length} attachment outcomes.`);
  } catch (error) {
    state.decision = null;
    setDataStatus("error", "Compatibility cannot currently be checked", error.message, true);
    renderSourceUnavailable(error.message, requestDecision, true);
    showStep(3);
    announce("Compatibility could not be checked. No current result is shown.");
  }
}

function showDecisionLoading() {
  elements.decisionArea.hidden = false;
  elements.decisionArea.innerHTML = '<p role="status"><strong>Checking the live registry for this exact rack...</strong></p>';
}

function renderDecision() {
  const decision = state.decision;
  const groups = ["manufacturer_confirmed", "condition_dependent", "known_incompatible", "unknown_review_required"];
  elements.decisionArea.innerHTML = `
    <div class="sheet-header">
      <div><p class="eyebrow">Northstar fictional demonstration</p><h2 id="sheet-heading" tabindex="-1">Upgrade Decision Sheet</h2><p><strong>${escapeHtml(decision.rack.displayName)}</strong> &middot; ${escapeHtml(decision.rack.heightVariant || "Height not applicable")}</p><p>${escapeHtml(configurationSummary())}</p></div>
      <div class="sheet-actions no-print"><button class="secondary-button" type="button" data-action="edit-rack">Edit rack</button><button class="secondary-button" type="button" data-action="edit-category">Edit upgrade type</button><button class="secondary-button" type="button" data-action="print">Print / save</button><button class="primary-button" type="button" data-action="ask-sheet">Ask about this sheet</button></div>
    </div>
    ${decision.changedInputs.length ? `<p class="revision-note"><strong>Revised:</strong> ${decision.changedInputs.map(escapeHtml).join(", ")} changed. Condition answers not applicable to the new selection were cleared.</p>` : ""}
    <div class="clock-grid"><div><strong>Assessment time</strong><span>${formatDateTime(decision.assessedAt)}</span></div><div><strong>Live registry retrieved</strong><span>${formatDateTime(decision.registryRetrievedAt)}</span></div></div>
    <div class="counts" aria-label="Outcome counts">${groups.map((group) => `<div class="count ${group}"><strong>${decision.counts[group]}</strong><span>${escapeHtml(stateLabel(group))}</span></div>`).join("")}</div>
    ${decision.degradedReason ? unresolvedMarkup(decision.rationale, decision.resolutionAction) : groups.map((group) => renderGroup(group, decision.results.filter((result) => result.effectiveEvidenceState === group))).join("")}
    <section class="safety-note"><h3>Scope and installation</h3><p>This sheet reports only the relationship recorded in the fictional compatibility registry. It does not certify installation, rack anchoring, structural capacity, floor suitability, movement clearance, or safe exercise use. Follow the product and installation instructions and contact the retailer for unresolved questions.</p></section>`;
}

function renderGroup(group, results) {
  if (!results.length) return "";
  const icon = { manufacturer_confirmed: "OK", condition_dependent: "IF", known_incompatible: "NO", unknown_review_required: "?" }[group];
  return `<section class="evidence-group" aria-labelledby="group-${group}"><div class="group-heading ${group}"><span class="state-icon" aria-hidden="true">${icon}</span><h3 id="group-${group}">${escapeHtml(stateLabel(group))}</h3></div>${results.map(renderResult).join("")}</section>`;
}

function renderResult(result) {
  const commerce = renderCommerce(result.commerce);
  const readiness = result.readiness ? `<span class="readiness">Readiness: ${escapeHtml(titleCase(result.readiness))}</span>` : "";
  const conditions = result.conditions.length ? `<div class="condition-list"><h4>Required conditions</h4>${result.conditions.map((condition) => renderCondition(result, condition)).join("")}</div>` : "";
  const provenance = result.provenance ? `<dl class="metadata"><div><dt>Source</dt><dd><a href="${escapeAttribute(result.provenance.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.provenance.sourceTitle)}</a></dd></div><div><dt>Source date</dt><dd>${formatDate(result.provenance.sourceDate)}</dd></div><div><dt>Compatibility checked</dt><dd>${formatDateTime(result.provenance.lastVerifiedAt)}</dd></div><div><dt>Review due</dt><dd>${formatDateTime(result.provenance.reviewDueAt)}</dd></div><div><dt>Record owner</dt><dd>${escapeHtml(result.provenance.reviewer)}</dd></div><div><dt>Record ID</dt><dd>${escapeHtml(result.relationshipId || "No governed relationship")}</dd></div></dl>` : '<p>No authoritative source record is available for this exact pairing.</p>';
  return `<article class="result ${result.effectiveEvidenceState}" data-attachment-id="${escapeAttribute(result.attachmentId)}">
    <div class="result-main"><div><div class="result-title"><h4>${escapeHtml(result.displayName)}</h4><span class="sku">${escapeHtml(result.sku)}</span></div><span class="state-label">${escapeHtml(stateLabel(result.effectiveEvidenceState))}</span>${readiness}<p>${escapeHtml(result.rationale)}</p>${result.resolutionAction ? `<p><strong>Next action:</strong> ${escapeHtml(result.resolutionAction)}</p>` : ""}</div><div class="result-actions">${result.purchaseHandoff ? `<a class="primary-button" href="${escapeAttribute(result.purchaseHandoff.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.purchaseHandoff.label)}</a>` : ""}<button class="text-button no-print" type="button" data-action="ask-result" data-attachment-id="${escapeAttribute(result.attachmentId)}">Explain</button></div></div>
    ${conditions}
    <details class="evidence-details"><summary>Evidence details</summary><div>${result.limitations.length ? `<h4>Limitations</h4><ul>${result.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}${provenance}${commerce}</div></details>
  </article>`;
}

function renderCondition(result, condition) {
  const choices = [{ value: "met", label: "Met" }, { value: "not_met", label: "Not met" }, { value: "not_sure", label: "Not sure" }];
  return `<fieldset class="condition"><legend>${escapeHtml(condition.label)}</legend><p>${escapeHtml(condition.description)}</p><div class="three-state">${choices.map((choice) => `<label><input type="radio" name="condition-${escapeAttribute(condition.id)}" value="${choice.value}" data-condition-id="${escapeAttribute(condition.id)}" ${condition.answer === choice.value ? "checked" : ""}><span>${choice.label}</span></label>`).join("")}</div></fieldset>`;
}

function renderCommerce(commerce) {
  if (!commerce?.current) return `<div class="commerce"><h4>Price and availability</h4><p>${escapeHtml(commerce?.message || "Check current price and availability.")}</p>${commerce?.updatedAt ? `<p><small>Last commerce update: ${formatDateTime(commerce.updatedAt)}</small></p>` : ""}</div>`;
  return `<div class="commerce"><h4>Price and availability</h4><p>${commerce.price ? `${escapeHtml(commerce.currency)} ${escapeHtml(commerce.price)}` : "Price not supplied"} &middot; ${escapeHtml(titleCase(commerce.stockState))}</p><p><small>${escapeHtml(commerce.source)} &middot; updated ${formatDateTime(commerce.updatedAt)}</small></p></div>`;
}

function renderIdentityUnresolved() {
  elements.decisionArea.hidden = false;
  elements.decisionArea.innerHTML = `<div class="sheet-header"><div><p class="eyebrow">Support-ready unresolved result</p><h2 id="sheet-heading" tabindex="-1">Upgrade Decision Sheet</h2><p>Rack identity not resolved</p></div><div class="sheet-actions"><button class="secondary-button no-print" type="button" data-action="edit-rack">Return to rack selection</button><button class="secondary-button no-print" type="button" data-action="print">Print / save</button></div></div>${unresolvedMarkup("No compatibility decision can be made without an exact rack model/version.", "Check the rack label and version markings using the recorded identification clues, or give this summary to retailer support.")}<section class="safety-note"><h3>Information retained</h3><p>Family: ${escapeHtml(titleCase(state.selectedFamily || "not selected"))}. No nearest model or dimension-based match has been substituted.</p></section>`;
  showStep(3);
}

function renderSourceUnavailable(message, retry, asSheet = false) {
  const target = asSheet ? elements.decisionArea : elements.rackStep;
  if (asSheet) target.hidden = false;
  target.innerHTML = `${asSheet ? '<div class="sheet-header"><div><p class="eyebrow">Support-ready unresolved result</p><h2 id="sheet-heading" tabindex="-1">Upgrade Decision Sheet</h2><p>Current compatibility unavailable</p></div></div>' : ""}<section class="unresolved"><h2>${asSheet ? "Live source unavailable" : "Advisor unavailable"}</h2><p>${escapeHtml(message)}</p><p>No positive compatibility, price, stock, or purchase claim is being shown. Your structured selection remains in this browser session.</p><div class="form-actions no-print"><button class="primary-button" type="button" id="sourceRetry">Retry live registry</button>${asSheet ? '<button class="secondary-button" type="button" data-action="print">Print support summary</button>' : ""}</div></section>`;
  target.querySelector("#sourceRetry").addEventListener("click", retry);
}

function unresolvedMarkup(reason, action) {
  return `<section class="unresolved"><h2>Unknown / review required</h2><p><strong>Why:</strong> ${escapeHtml(reason || "The evidence is unresolved.")}</p><p><strong>Evidence needed next:</strong> ${escapeHtml(action || "Ask the registry owner for a current authoritative record.")}</p></section>`;
}

async function handleDelegatedClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const guideQuestion = event.target.closest("[data-guide-question]")?.dataset.guideQuestion;
  if (guideQuestion) return openGuide(guideQuestion);
  if (action === "edit-rack") {
    state.conditionAnswers = {};
    state.changedInputs = ["Rack identity or configuration"];
    showStep(1);
  } else if (action === "edit-category") {
    state.changedInputs = ["Upgrade type"];
    showStep(2);
  } else if (action === "print") window.print();
  else if (action === "ask-sheet") openGuide("Why do these results have different evidence states?");
  else if (action === "ask-result") openGuide("Why does this attachment have this evidence state?", event.target.dataset.attachmentId);

  const conditionInput = event.target.closest("input[data-condition-id]");
  if (conditionInput) {
    state.conditionAnswers[conditionInput.dataset.conditionId] = conditionInput.value;
    state.changedInputs = [`Condition ${conditionInput.dataset.conditionId}`];
    await requestDecision();
  }
}

function openGuide(question = "", attachmentId = "") {
  elements.guidePanel.hidden = false;
  elements.panelBackdrop.hidden = false;
  elements.guidePanel.dataset.attachmentId = attachmentId;
  elements.guideQuestion.value = question;
  elements.guideAnswer.innerHTML = "";
  const suggestions = attachmentId ? ["Why is this condition-dependent?", "What must I check?", "Why can this not be confirmed?"] : ["What do the evidence states mean?", "Why do I need the exact rack version?", "How fresh is this evidence?"];
  elements.guideSuggestions.innerHTML = suggestions.map((item) => `<button type="button" data-guide-suggestion="${escapeAttribute(item)}">${escapeHtml(item)}</button>`).join("");
  elements.guideSuggestions.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { elements.guideQuestion.value = button.dataset.guideSuggestion; elements.guideForm.requestSubmit(); }));
  setTimeout(() => elements.guideQuestion.focus(), 0);
}

function closeGuide() {
  elements.guidePanel.hidden = true;
  elements.panelBackdrop.hidden = true;
}

async function askGuide(question) {
  if (!question.trim() || !state.selectedRackId) {
    elements.guideAnswer.textContent = "Select an exact rack before asking the Decision Guide.";
    return;
  }
  elements.guideAnswer.textContent = "Checking the live registry and preparing one bounded explanation...";
  const payload = {
    question: question.trim(), rackVersionId: state.selectedRackId, configuration: state.configuration,
    categoryId: state.categoryId || null, conditionAnswers: state.conditionAnswers,
    attachmentId: elements.guidePanel.dataset.attachmentId || null
  };
  try {
    const result = await api("/api/guide", { method: "POST", body: payload });
    elements.guideAnswer.innerHTML = `<p>${escapeHtml(result.answer)}</p><small>Based on the live registry checked ${formatDateTime(result.checkedAt)}. The deterministic status has not changed.</small>`;
  } catch (error) {
    elements.guideAnswer.innerHTML = `<p>${escapeHtml(error.message)}</p><small>View the recorded evidence in the Decision Sheet instead. Compatibility results have not changed.</small>`;
  }
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    cache: "no-store",
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.message || "The live service could not complete the request.");
  return data;
}

function setDataStatus(type, title, detail, retry = false) {
  elements.dataStatus.className = `data-status no-print ${type}`;
  elements.dataStatus.innerHTML = `<span class="status-dot" aria-hidden="true"></span><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>${retry ? '<button class="secondary-button" type="button" data-action="retry-status">Retry</button>' : ""}`;
  elements.dataStatus.querySelector('[data-action="retry-status"]')?.addEventListener("click", () => state.options ? requestDecision() : loadOptions());
}

function selectedRack() { return state.options?.racks.find((rack) => rack.rackVersionId === state.selectedRackId) || null; }
function currentFamilyRacks() { return state.options?.racks.filter((rack) => rack.rackFamilyId === state.selectedFamily) || []; }
function configurationSummary() {
  const rack = selectedRack();
  const values = rack?.configurationSchema.map((field) => field.options?.find((option) => option.value === state.configuration[field.id])?.label).filter(Boolean) || [];
  return values.length ? `Configuration: ${values.join(", ")}` : "No additional configuration recorded";
}
function announce(message) { elements.liveStatus.textContent = ""; setTimeout(() => { elements.liveStatus.textContent = message; }, 20); }
function stateLabel(value) { return ({ manufacturer_confirmed: "Manufacturer-confirmed", condition_dependent: "Condition-dependent", known_incompatible: "Known incompatible", unknown_review_required: "Unknown / review required" })[value] || titleCase(value); }
function titleCase(value) { return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDateTime(value) { if (!value || Number.isNaN(new Date(value).getTime())) return "Not available"; return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatDate(value) { if (!value || Number.isNaN(new Date(value).getTime())) return "Not available"; return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" }).format(new Date(value)); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }


