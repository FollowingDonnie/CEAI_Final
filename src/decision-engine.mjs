const STATES = ["manufacturer_confirmed", "condition_dependent", "known_incompatible", "unknown_review_required"];
const STATE_ORDER = new Map(STATES.map((state, index) => [state, index]));
const AUTHORITATIVE_STATES = new Set(STATES.slice(0, 3));
const REQUIRED_RELATIONSHIP_FIELDS = [
  "relationship_id", "rack_version_id", "attachment_id", "evidence_state", "rationale", "evidence_source_title",
  "evidence_source_url", "source_date", "last_verified_at", "review_due_at", "reviewer", "record_status"
];

export function listOptions(registry, ecosystemId) {
  const racks = registry.racks
    .filter((rack) => rack.ecosystem_id === ecosystemId && rack.active)
    .map((rack) => ({
      rackFamilyId: rack.rack_family_id,
      rackVersionId: rack.rack_version_id,
      displayName: rack.display_name,
      heightVariant: rack.height_variant || null,
      configurationSchema: rack.configuration_schema,
      identificationClues: rack.identification_clues
    }));
  const categories = [...new Map(registry.attachments.filter((item) => item.ecosystem_id === ecosystemId).map((item) => [item.category_id, titleCase(item.category_id)])).entries()]
    .map(([categoryId, label]) => ({ categoryId, label }));
  return { ecosystemId, racks, categories, definitions: registry.definitions.map(publicDefinition), registryRetrievedAt: registry.retrievedAt };
}

export function evaluateDecision(registry, selection, now = new Date()) {
  const rack = registry.racks.find((item) => item.rack_version_id === selection.rackVersionId && item.ecosystem_id === selection.ecosystemId);
  if (!rack || !rack.active) return unresolvedDecision(registry, selection, now, "identity_unresolved", "The exact active rack version could not be resolved.", "Check the model/version label or contact support with the identity shown here.");

  const configurationIssue = validateConfiguration(rack, selection.configuration || {});
  if (configurationIssue) return unresolvedDecision(registry, selection, now, "identity_unresolved", configurationIssue, "Complete the registry-required rack configuration before requesting a decision.", rack);

  const conditionAnswers = selection.conditionAnswers || {};
  const results = registry.attachments
    .filter((attachment) => !selection.categoryId || attachment.category_id === selection.categoryId)
    .map((attachment) => evaluateAttachment(registry, rack, attachment, conditionAnswers, now))
    .sort((a, b) => STATE_ORDER.get(a.effectiveEvidenceState) - STATE_ORDER.get(b.effectiveEvidenceState) || a.categoryId.localeCompare(b.categoryId) || a.displayName.localeCompare(b.displayName));

  return {
    assessmentId: crypto.randomUUID(),
    assessedAt: now.toISOString(),
    registryRetrievedAt: registry.retrievedAt,
    rack: publicRack(rack, selection.configuration || {}),
    categoryId: selection.categoryId || null,
    changedInputs: selection.changedInputs || [],
    degradedReason: null,
    results,
    counts: Object.fromEntries(STATES.map((state) => [state, results.filter((result) => result.effectiveEvidenceState === state).length]))
  };
}

function evaluateAttachment(registry, rack, attachment, conditionAnswers, now) {
  const base = publicAttachment(attachment);
  if (attachment.ecosystem_id !== rack.ecosystem_id) {
    return unknownResult(base, "cross_brand", "This attachment belongs to a different fictional brand ecosystem.", "Use the owning brand's compatibility evidence; cross-brand fit is outside this advisor.");
  }

  const relationships = registry.relationships.filter((record) => record.rack_version_id === rack.rack_version_id && record.attachment_id === attachment.attachment_id);
  if (!relationships.length) return unknownResult(base, "missing_pairing", "The registry has no exact pairing for this rack version and attachment.", "Ask the registry owner for an approved exact-version compatibility record.");

  const assessed = relationships.map((record) => assessRelationship(record, now));
  const currentApproved = assessed.filter((item) => item.valid);
  const statuses = new Set(currentApproved.map((item) => item.record.evidence_state));
  if (statuses.size > 1) {
    return unknownResult(base, "contradictory", "Current approved registry records disagree for this exact pairing.", "The registry owner must resolve the contradictory records.", relationships);
  }
  if (currentApproved.length > 1) {
    return unknownResult(base, "contradictory", "More than one current approved record exists for this exact pairing.", "The registry owner must retire duplicates and retain one governed record.", relationships);
  }
  if (!currentApproved.length) {
    const reasons = new Set(assessed.flatMap((item) => item.issues));
    const degradedReason = reasons.has("stale") ? "stale" : "malformed";
    const rationale = degradedReason === "stale" ? "The available compatibility evidence is past its review date." : "The compatibility record is incomplete, unapproved, or malformed.";
    return unknownResult(base, degradedReason, rationale, "The registry owner must review and approve a complete, current source record.", relationships);
  }

  const relationship = currentApproved[0].record;
  const conditions = relationship.conditions.map((condition) => ({
    id: String(condition.id || ""),
    label: String(condition.label || "Recorded condition"),
    description: String(condition.description || ""),
    applicableValue: String(condition.applicable_value || ""),
    answer: conditionAnswers[condition.id] || "not_sure"
  }));
  const readiness = relationship.evidence_state === "condition_dependent" ? deriveReadiness(conditions) : null;
  const commerce = publicCommerce(registry.commerce.find((item) => item.attachment_id === attachment.attachment_id), now);
  const canHandoff = attachment.active && Boolean(attachment.product_url) && (
    relationship.evidence_state === "manufacturer_confirmed" ||
    (relationship.evidence_state === "condition_dependent" && readiness === "conditions_met")
  );
  return {
    ...base,
    relationshipId: relationship.relationship_id,
    effectiveEvidenceState: relationship.evidence_state,
    authoredEvidenceState: relationship.evidence_state,
    degradedReason: null,
    rationale: relationship.rationale,
    conditions,
    readiness,
    limitations: relationship.limitations,
    provenance: publicProvenance(relationship),
    commerce,
    purchaseHandoff: canHandoff ? { url: attachment.product_url, label: commerce.current && commerce.stockState === "in_stock" ? "View available product" : "View product" } : null,
    resolutionAction: null
  };
}

function assessRelationship(record, now) {
  const issues = [...record.__issues];
  for (const field of REQUIRED_RELATIONSHIP_FIELDS) if (!record[field]) issues.push(`missing_${field}`);
  if (!STATES.includes(record.evidence_state)) issues.push("invalid_evidence_state");
  if (record.record_status !== "approved") issues.push("not_approved");
  if (AUTHORITATIVE_STATES.has(record.evidence_state)) {
    if (!isHttpUrl(record.evidence_source_url)) issues.push("invalid_source_url");
    if (!validDate(record.source_date) || !validDate(record.last_verified_at) || !validDate(record.review_due_at)) issues.push("invalid_date");
  }
  if (record.evidence_state === "condition_dependent" && (!record.conditions.length || record.conditions.some((condition) => !condition.id || !condition.label || !condition.description))) issues.push("malformed_conditions");
  if (validDate(record.review_due_at) && new Date(record.review_due_at) < now) issues.push("stale");
  return { record, issues, valid: issues.length === 0 };
}

function validateConfiguration(rack, configuration) {
  for (const field of rack.configuration_schema) {
    const value = configuration[field.id];
    if (field.required && !value) return `${field.label || field.id} is required for this exact rack version.`;
    if (value && Array.isArray(field.options) && !field.options.some((option) => option.value === value)) return `${field.label || field.id} contains a value not defined by the live registry.`;
  }
  return null;
}

function deriveReadiness(conditions) {
  if (conditions.some((condition) => condition.answer === "not_met")) return "blocked";
  if (conditions.length && conditions.every((condition) => condition.answer === "met")) return "conditions_met";
  return "needs_checking";
}

function unknownResult(base, degradedReason, rationale, resolutionAction, records = []) {
  const latest = [...records].sort((a, b) => String(b.last_verified_at).localeCompare(String(a.last_verified_at)))[0];
  return {
    ...base,
    relationshipId: latest?.relationship_id || null,
    effectiveEvidenceState: "unknown_review_required",
    authoredEvidenceState: latest?.evidence_state || null,
    degradedReason,
    rationale,
    conditions: [],
    readiness: null,
    limitations: latest?.limitations || [],
    provenance: latest ? publicProvenance(latest) : null,
    commerce: { current: false, message: "Check current price and availability." },
    purchaseHandoff: null,
    resolutionAction
  };
}

function unresolvedDecision(registry, selection, now, degradedReason, rationale, resolutionAction, rack = null) {
  return {
    assessmentId: crypto.randomUUID(), assessedAt: now.toISOString(), registryRetrievedAt: registry.retrievedAt,
    rack: rack ? publicRack(rack, selection.configuration || {}) : { rackVersionId: selection.rackVersionId || null, displayName: "Unresolved rack", configuration: selection.configuration || {} },
    categoryId: selection.categoryId || null, changedInputs: selection.changedInputs || [], degradedReason, rationale, resolutionAction, results: [], counts: Object.fromEntries(STATES.map((state) => [state, 0]))
  };
}

function publicRack(rack, configuration) {
  return { rackFamilyId: rack.rack_family_id, rackVersionId: rack.rack_version_id, displayName: rack.display_name, heightVariant: rack.height_variant || null, configuration };
}

function publicAttachment(item) {
  return { attachmentId: item.attachment_id, ecosystemId: item.ecosystem_id, sku: item.sku, displayName: item.display_name, categoryId: item.category_id, active: item.active };
}

function publicProvenance(record) {
  return { sourceTitle: record.evidence_source_title, sourceUrl: record.evidence_source_url, sourceDate: record.source_date, lastVerifiedAt: record.last_verified_at, reviewDueAt: record.review_due_at, reviewer: record.reviewer, recordStatus: record.record_status };
}

function publicCommerce(record, now) {
  if (!record) return { current: false, message: "Check current price and availability." };
  const updated = validDate(record.commerce_updated_at) ? new Date(record.commerce_updated_at) : null;
  const current = Boolean(updated && now - updated <= 7 * 24 * 60 * 60 * 1000 && record.commerce_source);
  if (!current) return { current: false, message: "Check current price and availability.", updatedAt: record.commerce_updated_at || null };
  return { current: true, price: record.price || null, currency: record.currency || null, stockState: record.stock_state || "unknown", source: record.commerce_source, updatedAt: record.commerce_updated_at };
}

function publicDefinition(record) {
  return { id: record.definition_id, label: record.definition_label, text: record.definition_text, recordId: `definition:${record.definition_id}` };
}

function isHttpUrl(value) {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}

function validDate(value) { return Boolean(value && !Number.isNaN(new Date(value).getTime())); }
function titleCase(value) { return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export { STATES };
