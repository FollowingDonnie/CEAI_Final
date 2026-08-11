# Orange Designer Solution Design

**Stage:** 2 - Solution design  
**Input accepted:** `handoffs/01-opportunity-brief.md`  
**Decision:** Design a retailer/manufacturer-owned, consumer-used, same-brand rack upgrade advisor.  
**Prototype posture:** A bounded demonstration of a governed compatibility decision, not a broad equipment planner or a substitute for installation instructions.

## 1. Product concept and one-sentence promise

### Concept

The Rack Upgrade Advisor helps an existing rack owner identify their exact rack configuration and produces a revisable **Upgrade Decision Sheet** for same-brand attachments. The sheet shows what is manufacturer-confirmed, known incompatible, condition-dependent, or unknown/review required, with the applicable conditions and source record visible for every result.

### One-sentence promise

**Choose an upgrade for your exact rack with the compatibility decision, conditions, and evidence shown before you buy.**

This concept follows the approved research finding that compatibility is model/version-specific, that conditions such as rack height or stabilisation matter, and that nominal dimensions do not establish safe fit.

## 2. Primary audience and job to be done

### Primary user

UK and Ireland owners of a modular home-gym rack who are considering an attachment from the same retailer or manufacturer ecosystem. They know, or can inspect, their owned rack but may not know its exact version or which conditions affect an upgrade.

### Economic buyer and data owner

A specialist rack retailer or manufacturer that owns the authoritative catalogue and compatibility relationships, and can benefit from more appropriate attachment purchases and fewer avoidable support contacts or returns. Those commercial effects remain hypotheses for later measurement, not claims in the customer experience.

### Job to be done

When I want to add an attachment to the rack I already own, help me establish the exact rack configuration and show which same-brand options are approved, conditional, incompatible, or unresolved, so I can decide what to consider buying and know what must be checked first.

### User success

The user can leave with a specific, inspectable decision artifact even when no attachment can be recommended. They understand the identity assessed, the status of each relevant option, any conditions they must verify, and what evidence or support action would resolve an unknown.

## 3. Differentiation and value exchange

### Differentiation

- The advisor starts from exact owned-product identity rather than a generic rack family or approximate dimensions.
- It presents governed evidence states instead of a broad recommendation or a dimension-derived "likely fit."
- It preserves source provenance and conditions at the point of decision.
- It degrades into a useful refusal when identity or evidence is insufficient.
- It keeps compatibility truth separate from changing price and stock information.
- It produces a durable, revisable decision sheet rather than treating a conversation transcript as the outcome.

### Value exchange

The user supplies only the minimum rack identity and relevant configuration details. In return, the seller supplies a shorter path through its own upgrade catalogue, explicit conditions, and auditable evidence. No account, room photograph, address, health data, training history, or cross-brand equipment inventory is required.

## 4. End-to-end user journey

1. **Enter the advisor.** The first screen is the task itself, branded by the owning retailer/manufacturer when permission exists. It states that the advisor covers same-brand rack upgrades and that installation instructions still apply.
2. **Identify the rack.** The user selects rack family, exact model/version, height, and any configuration attributes required by records for that model. Each choice progressively narrows the next control. "I cannot find my rack" remains visible.
3. **Resolve ambiguity.** If two versions could apply, the advisor shows registry-authored identification clues such as label location, purchase period, or distinguishing feature. It never infers identity from approximate dimensions. If the user still cannot identify it, the flow produces an unresolved sheet and the evidence needed for support.
4. **Choose the upgrade need.** The user selects an attachment category or "show all upgrades." Optional filters may narrow the list but cannot change compatibility truth.
5. **Review the Decision Sheet.** Results are grouped and ordered by evidence state. Manufacturer-confirmed and condition-dependent options appear first; known incompatible and unknown options remain available under clearly labelled sections rather than disappearing.
6. **Inspect a result.** The user opens an attachment row to see the exact status rationale, applicable conditions, limitations, source title/link, source date, and last-verified date. Price and stock, when authorized data exists, appear in a separate commerce block with their own freshness label.
7. **Confirm conditions.** For a condition-dependent option, the user marks each required condition as "met," "not met," or "not sure." This revises readiness, not the underlying evidence state. A "not met" answer blocks a purchase handoff; "not sure" keeps the item unresolved for action.
8. **Revise.** The user can change rack identity, configuration, category, or condition answers. The sheet immediately regenerates and marks which inputs changed.
9. **Take the result away.** The user can print or save the Decision Sheet using the browser's print/save capability. A purchase link is offered only for an authorized, currently available item whose required conditions are marked met; it is not part of compatibility evidence.

## 5. Interaction-model decision, information architecture, and screen descriptions

### Interaction-model comparison

| Model | Strength for this need | Risk | Decision |
| --- | --- | --- | --- |
| Conversational | Can ask follow-up questions and make unfamiliar terminology approachable. | Free text can obscure exact model selection, omit required attributes, imply unsupported inference, and leave only a transcript. | Reject as the primary model. |
| Structured form | Makes exact identities, controlled options, validation, and repeatable results explicit. | A long form can feel rigid when users do not know their rack version or why a condition matters. | Use as the decision backbone. |
| Hybrid | Combines controlled selection with contextual help, progressive questions, and plain-language explanations grounded in registry fields. | Must prevent guidance from silently changing structured truth. | **Selected: structured-first hybrid.** |

The accepted user need is a consequential lookup against exact identities and conditions. Therefore, every decision-driving answer uses a structured control. A bounded AI **Decision Guide** explains registry-defined terms during the flow and answers follow-up questions about the current Decision Sheet. It is opened contextually, returns one answer at a time, and does not become a general chat destination or a second decision surface. No natural-language answer may create, upgrade, infer, or override compatibility truth.

### Information architecture

The prototype is a single responsive task with three top-level steps and one persistent output:

1. **Your rack** - exact identity and relevant configuration.
2. **Upgrade type** - category or all eligible catalogue items.
3. **Decision Sheet** - result summary, evidence groups, conditions, sources, and revision controls.

Supporting layers:

- **Identification help** opens inline beside the unresolved identity control.
- **Evidence details** opens as an inline disclosure on desktop and a full-width modal sheet on small screens.
- **Decision Guide** opens from an "Explain this" action beside a structured field or an "Ask about this sheet" action on the current Decision Sheet. It receives only the active field or sheet context and offers two to four scoped suggested questions plus one short question field.
- **Data status** sits above results and reports compatibility-registry availability and verification freshness separately from commerce availability.
- **Support handoff** appears only when identity or evidence cannot be resolved.

### Screen descriptions

#### Screen 1: Your rack

- Retailer/manufacturer name when authorized, page title, and compact scope statement.
- Dependent select controls for family, model/version, height, and configuration attributes required for that selection.
- An always-visible "I cannot find my rack" action.
- Inline identity clues sourced from the registry; no upload control and no dimension-based guess.
- An "Explain this" action can ask the Decision Guide to clarify a registry-defined model label, configuration term, or why the field is needed. The guide may explain distinctions present in freshly retrieved registry facts but cannot select or infer the user's rack.
- Continue remains disabled until required identity fields are complete or the user chooses unresolved support.

#### Screen 2: Upgrade type

- A compact category selector using icon plus text only where the icon is familiar and accessible; otherwise text labels.
- "Show all upgrades" is the default.
- A plain summary of the selected rack with an Edit action.
- No budget, room-planning, training-goal, or cross-brand controls in the prototype because those needs were not accepted for this opportunity.

#### Screen 3: Upgrade Decision Sheet

- Exact rack assessed and assessment time.
- Registry status with last successful retrieval time.
- A count by evidence state, using icon, label, and supporting text rather than colour alone.
- Attachment rows grouped as: manufacturer-confirmed, condition-dependent, known incompatible, and unknown/review required.
- Each row shows attachment name/SKU, evidence-state label, one-sentence rationale, condition summary, evidence freshness, and Details.
- Expanded details show conditions, limitations, provenance, review metadata, and a separate price/stock area.
- Persistent actions: Edit rack, Edit upgrade type, Print/save.
- An "Ask about this sheet" action opens the Decision Guide with suggested questions such as "Why is this condition-dependent?", "What must I check?", or "Why can this not be confirmed?" The answer cites the relevant attachment row and source record.
- Purchase action appears only under the gating rules in section 9.

#### Unresolved Decision Sheet

- Preserves all identity information the user supplied.
- States why no compatibility decision can be made.
- Lists the exact missing evidence, such as model/version label or manufacturer confirmation.
- Provides a support-ready reference summary that the user can print/save or use when contacting the retailer through its existing support channel.
- Never substitutes a nearest model or dimension match.

## 6. Tangible customer output and how users revise it

### Upgrade Decision Sheet

The customer output is a structured on-screen and print-ready sheet, not a transcript. It contains:

- retailer/manufacturer identity when authorized;
- exact rack family, model/version, height, and relevant configuration assessed;
- assessment timestamp and compatibility-registry retrieval status;
- selected upgrade category;
- all in-scope attachment outcomes, including incompatible and unknown results;
- one of the four evidence states for every attachment;
- required conditions and the user's answer to each condition;
- limitations and exclusions;
- source title/link, source date, reviewer/owner, and last-verified date;
- separate price, stock, commerce source, and commerce last-updated fields when available;
- unresolved questions and evidence needed for resolution;
- a scope/safety note directing the user to product and installation instructions.

### Revision behavior

- Editing rack identity or configuration reruns every result and clears condition answers that no longer apply.
- Editing upgrade category changes visibility only; it does not alter statuses.
- Marking conditions changes an item's **readiness** label among "conditions met," "blocked," and "needs checking." It never changes its evidence state from condition-dependent to manufacturer-confirmed.
- The sheet identifies changed inputs after a revision so users can understand why results changed.
- A printed/saved sheet includes its assessment time and freshness dates so it is not mistaken for a permanently current decision.

## 7. Input, processing, and output model

### Inputs

Required:

- brand/ecosystem ID, fixed to the owning seller in a deployed instance;
- rack family ID;
- exact rack model/version ID;
- height variant where applicable;
- registry-declared configuration attributes required for that rack;
- attachment category or all.

Optional after results:

- user answer for each required condition: `met`, `not_met`, or `not_sure`.
- one short Decision Guide question about the active structured field or current Decision Sheet.

### Processing rules

1. Resolve the selected rack to one exact active rack-version record.
2. Retrieve current compatibility records for that exact rack version from the controlled registry at runtime.
3. Reject any relationship with a different brand/ecosystem ID from the normal recommendation path.
4. Validate each record's required fields, review status, provenance, and verification date.
5. If duplicate records disagree, an authoritative source is missing, or a record is outside its review window, lower the displayed result to **unknown/review required**. A previous stronger status may be described only as historical context.
6. Never calculate compatibility from dimensions, hole spacing, family similarity, text similarity, price, or stock.
7. Join attachment display information by stable product ID.
8. Join authorized commerce data separately by SKU/product ID. Failure of this join does not change compatibility.
9. Derive readiness for condition-dependent items from the user's answers without mutating compatibility status.
10. Sort by evidence state, then category and attachment name. Do not add opaque ranking or "best" claims in the prototype.
11. When the Decision Guide is invoked, perform a new external-registry retrieval for the active rack, attachment, conditions, and provenance needed by the question. Run the deterministic validation rules before preparing AI context.
12. Give the AI only the validated current-sheet facts, relevant registry-authored definitions, source metadata, and the user's scoped question. The AI has no write path to the Decision Sheet, registry, condition answers, commerce fields, or purchase gating.
13. Validate the AI response against the retrieved record IDs and allowed response shape. Display it as guidance beside, never instead of, the deterministic status and source details.

### Four evidence states

| State | Meaning | Customer treatment |
| --- | --- | --- |
| **Manufacturer-confirmed** | The exact rack-version and attachment pairing is explicitly approved by the authoritative source, with no unmet registry-recorded precondition. | Eligible for consideration; source and limitations remain visible. |
| **Known incompatible** | The authoritative source explicitly says the exact pairing does not fit or must not be used. | Explain the reason; never offer a purchase handoff for that pairing. |
| **Condition-dependent** | The exact pairing is approved only when stated configuration or installation conditions are satisfied. | Show every condition and collect `met`, `not_met`, or `not_sure`; gate purchase handoff. |
| **Unknown/review required** | Identity is unresolved, confirmation is absent/stale/contradictory, the item is cross-brand, or required evidence is incomplete. | Refuse the compatibility claim, explain why, and list the evidence/action needed to resolve it. |

### Outputs

- the Upgrade Decision Sheet;
- a source-detail view for each result;
- a support-ready unresolved summary when the system refuses;
- an optional purchase handoff that is strictly downstream of evidence and readiness rules;
- a bounded Decision Guide answer that explains only the active field or current Decision Sheet and cites the registry records used.

## 8. Role of live external data

### Prototype source

Use a small, project-controlled external registry queried at runtime, preferably a published read-only Google Sheet or equivalent permissioned endpoint. The demonstration catalogue must use clearly labelled fictional test products or partner-authorized product records; it must not republish a real company's brand, catalogue, prices, or specifications without permission. Fictional test records are interaction fixtures, not real-world product claims.

The registry is essential to the answer: changing a pairing status, condition, source date, or review state in the registry changes the Decision Sheet at the next interaction. Initial selection, result generation, revision, Retry, and every Decision Guide request must query the external registry at the moment of use. The application must not ship or use a hidden local compatibility-data copy, fallback, snapshot, service-worker response, or cache as current evidence when a live read fails.

### Prototype size

- one fictional or partner-authorized same-brand ecosystem;
- three exact rack-version/configuration records, including at least one ambiguous family with two versions;
- six to eight attachment records across at least two categories;
- enough pairings to demonstrate all four evidence states;
- at least two condition-dependent records with different condition types;
- one stale record and one contradictory-record fixture for degraded-state testing;
- no cross-brand catalogue beyond one explicit out-of-scope test case.

Every relationship must be manually auditable. Breadth is intentionally limited.

### Compatibility versus commerce freshness

- Compatibility data has `source_date`, `last_verified_at`, `review_due_at`, `reviewer`, and `evidence_source_url`.
- Commerce data, when an authorized source exists, has `price`, `currency`, `stock_state`, `commerce_source`, and `commerce_updated_at`.
- The interface labels these independently as "Compatibility checked" and "Price/stock updated."
- Missing or stale commerce data produces "Check current price and availability" while retaining a valid compatibility result.
- Fresh commerce data cannot rescue stale, missing, or contradictory compatibility evidence.
- The public prototype may omit price and stock entirely and show them as not connected; it must still demonstrate their separate status area.

### Live-data failure

If the registry is unavailable, the advisor preserves the user's selections, states that compatibility cannot currently be checked, suppresses all positive compatibility and purchase claims, and offers Retry plus a printable support summary. The Decision Guide is disabled and any attempted request returns the visible message: "Guidance is unavailable because the live compatibility registry could not be checked. Retry to use current records." No prior AI answer or local/cached compatibility record may be presented as current. A visible last-known snapshot is excluded from this prototype; adding one later would require a new product and safety decision.

## 9. Trust, evidence, uncertainty, privacy, and safety behaviours

### Trust and provenance

- Every result exposes its evidence state and source metadata within one user action.
- Labels use icon, text, and explanation; colour is supplementary.
- Source links open the exact cited record/document when available, not a generic homepage.
- The sheet distinguishes assessment time, compatibility verification time, and commerce update time.
- Plain-language summaries may only restate structured fields. They cannot introduce an unstored fit, safety, or installation claim.

### Bounded AI Decision Guide

**Customer value:** The guide reduces the effort of interpreting model labels, evidence language, conditions, limitations, and provenance without asking the user to decipher a matrix or leave the structured task. It can explain why the deterministic engine produced the status already shown, compare displayed outcomes using only their governed fields, and identify the next registry-stated check for an unresolved result. It cannot recommend a different product, identify a rack from a description, or decide compatibility.

**Allowed intents:**

- explain a registry-defined rack/version/configuration term shown in the active structured step;
- explain why a displayed attachment has its current evidence state;
- restate which recorded conditions are met, blocked, or need checking;
- explain the difference between compatibility verification and price/stock freshness;
- summarize the source, verification date, limitations, or unresolved evidence shown on the current sheet;
- compare two attachments already present on the current sheet using only their displayed statuses, conditions, limitations, and commerce fields;
- direct the user to the existing structured control, evidence details, product instructions, or support path needed next.

**Disallowed intents and prompt boundaries:**

- no general home-gym advice, exercise advice, room planning, cross-brand matching, product discovery outside the current sheet, or unrestricted web search;
- no rack identification from prose, approximate dimensions, photos, purchase dates, or similarity; the guide may explain registry clues but the user must make the structured selection;
- no creation, upgrading, downgrading, inference, or override of an evidence state, condition, source, price, stock value, readiness gate, purchase gate, or safety claim;
- no claim that absence of a record means incompatibility, or that similar dimensions mean fit;
- no answer from model memory when a required fact is missing from the freshly retrieved context;
- no wording such as "probably fits," "should be safe," or equivalent unsupported confidence;
- no generated links or citations: every cited label and URL must come unchanged from the validated registry context;
- no tool except the read-only live-registry retrieval for the current context; no registry writes, commerce writes, web browsing, or arbitrary retrieval.

**Tool and data flow:**

1. The customer opens the guide from an active field, attachment result, evidence detail, or the current sheet and selects a suggested question or enters one short scoped question.
2. The application sends the current structured IDs and question to an orchestration boundary; it does not send a prose compatibility conclusion for the AI to reinterpret.
3. A read-only tool queries the external registry at that moment for the exact current IDs. The deterministic engine validates currency, provenance, contradictions, scope, and the effective evidence state.
4. The system builds a minimum context package containing the validated effective state, rationale, conditions, limitations, registry-authored definitions, source title/URL/date, verification dates, separate commerce freshness when relevant, and allowed action labels.
5. The AI returns one concise explanation in a fixed response shape: `answer`, `record_references`, `source_references`, and optional `suggested_structured_action`. It cannot return mutations or new product facts.
6. The application verifies that every reference exists in the fresh context and that any suggested action maps to an existing structured control. If validation fails, it discards the answer and shows the failure behavior below.
7. The answer appears in a labelled "Decision Guide" panel with "Based on the live registry checked [time]" and direct links to the cited evidence details. The deterministic status remains visible and unchanged.

**Visible failure behavior:**

- Live registry unavailable: disable guidance, show the live-data message defined in section 8, retain the user's structured selections, and offer Retry.
- AI service unavailable or timeout: keep the complete deterministic Decision Sheet visible and show "The explanation is unavailable. Your compatibility results have not changed." Offer Retry and evidence details.
- Question outside allowed scope: state that the guide can only explain the current rack flow or Decision Sheet, then show scoped suggested questions; do not answer partially from general knowledge.
- Missing registry fact: say that the current registry does not contain that information, preserve the applicable unknown/review required state, and point to evidence details or support.
- Response-reference or policy validation failure: discard the generated text and show "This explanation could not be verified against the current registry. View the recorded evidence instead." No partial answer is displayed.

### Uncertainty and useful refusal

- Unknown is a first-class result, never silently excluded.
- The refusal names the reason: unresolved rack identity, no exact pairing, stale review, contradictory records, cross-brand request, or missing source.
- It lists the minimum evidence needed next and retains a support-ready summary of the user's rack selections.
- It does not suggest the nearest rack, infer from dimensions, or use wording such as "probably," "should fit," or "looks compatible."

### Safety

- Compatibility means only the relationship explicitly supported by the source; it does not certify installation, structural capacity, anchoring, floor suitability, movement clearance, or safe exercise use.
- Required conditions are displayed before any purchase action and remain on the printed sheet.
- A condition-dependent item permits purchase handoff only when every recorded condition is marked met. `not_met` or `not_sure` blocks it.
- Known incompatible and unknown results never permit purchase handoff.
- The interface directs users to the product instructions and the retailer/manufacturer support route for installation or unresolved questions.

### Privacy

- No login is required for the prototype.
- Do not collect names, email addresses, postal addresses, room photographs, health information, training goals, or free-form support messages.
- Keep user selections in the current browser session only unless the user deliberately prints/saves the sheet.
- Do not place rack selections or condition answers in third-party analytics event payloads for the prototype.
- Send the AI only the minimum current structured context and scoped question; do not retain question text beyond the browser session in the prototype.

### Purchase-action gating

- `manufacturer-confirmed` plus fresh enough evidence: purchase link may appear if authorized commerce mapping exists.
- `condition-dependent`: purchase link appears only after all conditions are `met` and evidence is fresh enough.
- `known incompatible` or `unknown/review required`: no purchase link.
- Missing/stale stock: label the handoff "View product" rather than "Buy now," and do not claim availability.

## 10. Visual direction and interaction principles

### Visual direction

A quiet, work-focused retail utility rather than an aspirational fitness campaign. Use a neutral white/light-grey foundation, dark text, restrained retailer accent colour when authorized, and semantic status colours that are not the sole carrier of meaning. Avoid lifestyle imagery, decorative gradients, oversized hero treatment, nested cards, and public Mirafit-specific visual cues.

The Decision Sheet should resemble a clear technical purchase record: compact identity header, grouped result rows, short evidence labels, aligned metadata, and print-friendly hierarchy. Cards, if used, are limited to individual attachment results with a maximum 8px radius.

### Interaction principles

- **Exact before broad:** ask only questions that select or condition an authoritative record.
- **Progressively disclose complexity:** show configuration questions only when the selected rack requires them.
- **Never hide a negative:** incompatible and unknown outcomes remain inspectable.
- **One truth, two clocks:** compatibility and commerce always show independent freshness.
- **Revision without penalty:** preserve prior selections when moving back and clearly show what changed.
- **No dead ends:** every refusal supplies a reason and next evidence/action.
- **Accessible by default:** semantic headings and controls, visible focus, keyboard operation, 44px minimum touch targets, status text independent of colour, WCAG AA contrast, `aria-live` for refreshed results, and reduced-motion support.
- **Responsive by reflow:** controls stack on small screens; result metadata moves below the title; disclosures become full-width sheets; no horizontal scrolling is required at 320px width.
- **Stable layout:** reserve space for status labels and timestamps so loading and refreshed content do not shift controls unexpectedly.

## 11. Functional requirements

### Must

- Query the controlled external compatibility registry at runtime.
- Support one same-brand ecosystem and exact rack family/model/version selection.
- Ask only registry-required height/configuration questions using structured controls.
- Support category selection or all attachments.
- Produce the revisable Upgrade Decision Sheet.
- Display all four evidence states exactly as defined.
- Show conditions, limitations, source URL/title/date, reviewer, last verification, and review due date for each result.
- Lower stale, contradictory, malformed, or source-less records to unknown/review required.
- Keep compatibility and price/stock freshness visually and logically separate.
- Provide useful unresolved outputs for ambiguous identity, absent pairings, cross-brand requests, and live-registry failure.
- Provide the bounded Decision Guide for field explanations and current-sheet follow-up questions using a fresh external-registry query for every request.
- Enforce the Decision Guide's allowed intents, fixed response shape, reference validation, and visible failure states from section 9.
- Keep AI output read-only and unable to mutate statuses, conditions, sources, commerce values, readiness, purchase gating, or the Decision Sheet.
- Gate purchase links by evidence state, condition answers, and authorized commerce mapping.
- Support Edit rack, Edit upgrade type, condition revision, Retry, and browser print/save.
- Meet the accessibility and responsive principles in section 10.
- Use only fictional clearly labelled test fixtures or partner-authorized records in the public prototype.

### Should

- Show registry-authored identification clues for ambiguous versions.
- Mark which changed input caused a revised result set.
- Show result counts by evidence state.
- Provide a compact data-status panel with last successful runtime retrieval.
- Preserve selections for the current browser session during retries and navigation.
- Include an explicit stale and contradictory fixture in a test mode or deterministic test dataset.

### Could

- Add authorized live price and stock data from a separate commerce source.
- Add a retailer's existing support link with a preformatted, non-personal reference summary.
- Offer a copyable plain-text version of the Decision Sheet.
- Add a registry-owner preview showing how one controlled record change alters the customer result; this is secondary to the consumer flow.

## 12. Explicit exclusions

- Broad home-gym planning or room layout.
- Room dimensions, movement envelopes, clearance calculation, or equipment placement.
- Training goals, programmes, health advice, or exercise recommendations.
- First-purchase rack recommendation.
- Cross-brand matching or dimension-derived compatibility.
- Public Mirafit branding, catalogue, or implied partnership without permission.
- Unrestricted web search, scraping, runtime crawling, or unsupported catalogue aggregation.
- User-uploaded photos, addresses, health data, or room data.
- Open-ended chatbot as the primary experience.
- AI answers based on model memory, cached/local compatibility data, unrestricted retrieval, or facts outside the current structured context.
- User reviews, popularity ranking, "best" recommendations, or AI-generated safety claims.
- Checkout, payment, order management, account creation, or deployment to a retailer's production systems.
- A full registry-management back office in the first prototype.

## 13. Testable acceptance criteria

1. Given an exact rack-version with a current approved pairing, the sheet displays manufacturer-confirmed, the exact rack assessed, and complete provenance.
2. Given an exact rack-version with an explicit negative pairing, the sheet displays known incompatible and no purchase link.
3. Given a conditional pairing, every registry condition appears with `met`, `not_met`, and `not_sure` controls; changing answers updates readiness but not the condition-dependent evidence state.
4. A conditional item exposes a purchase handoff only when every condition is `met`, the evidence record is current, and an authorized product link exists.
5. Given no exact pairing, unresolved rack identity, or a cross-brand test case, the sheet displays unknown/review required, explains the reason, and states the evidence/action needed next.
6. Given a record past `review_due_at`, missing required provenance, or duplicated with a contradictory status, the displayed result is unknown/review required even if one record says manufacturer-confirmed.
7. Editing rack version reruns the lookup, clears inapplicable condition answers, updates the assessed identity, and visibly identifies the changed input.
8. A change to a pairing or condition in the external registry changes the refreshed Decision Sheet without rebuilding the application.
9. When the live registry is unavailable, no positive compatibility or purchase claim is shown; selections remain available with Retry and a support-ready unresolved summary.
10. Missing or stale commerce data does not alter a current compatibility state and is labelled "Check current price and availability."
11. Current price/stock, when present, shows a commerce timestamp distinct from the compatibility verification date.
12. All four evidence states are distinguishable without colour and are announced meaningfully by a screen reader.
13. The complete flow is keyboard-operable, focus order follows the visual order, and refreshed results are announced without moving focus unexpectedly.
14. At 320px mobile width and a standard desktop viewport, controls and result text do not overlap, clip, or require horizontal scrolling.
15. Browser print/save produces a readable Decision Sheet containing identity, statuses, conditions, provenance, assessment time, and safety scope note; navigation controls are omitted from print.
16. No real company branding, catalogue content, prices, or specifications appear unless explicit permission is documented.
17. The prototype requests no account, photograph, address, health/training information, or free-form personal data.
18. A manual audit can trace every displayed compatibility outcome to exactly one valid governed record or to a documented unknown/degraded rule.
19. Opening "Explain this" for a registry-defined field triggers a new external-registry request and returns only an explanation of retrieved definitions or clues; it does not select or infer a rack value.
20. Asking "Why is this condition-dependent?" returns an explanation grounded only in the current relationship's state, rationale, conditions, and cited source, while the deterministic evidence state remains unchanged.
21. Asking the Decision Guide to confirm an unsupported or cross-brand fit is refused as out of scope and does not create a result, recommendation, or purchase action.
22. A Decision Guide response cannot display a source link, product fact, condition, evidence state, price, or stock value absent from the freshly retrieved and validated context; a response that attempts this is discarded with the visible verification-failure message.
23. Every Decision Guide invocation performs a fresh external-registry read. If that read fails, no AI answer or prior answer is presented as current, and guidance shows the live-registry failure message with Retry.
24. If the AI service fails while the registry succeeds, the deterministic Decision Sheet remains usable and unchanged, and the interface shows the explanation-unavailable message plus direct evidence access.
25. Questions outside the allowed intents receive a scope refusal and suggested in-scope questions, without a general-knowledge answer.
26. Changing a registry condition or rationale changes the next AI explanation without an application rebuild and without the AI altering the engine-computed status.

## 14. Maker handoff

### Approved product decisions

- Build the structured-first hybrid interaction, not a chatbot.
- Include the bounded, contextual Decision Guide as the sole AI customer capability; keep the structured flow and deterministic compatibility engine authoritative.
- Make the Upgrade Decision Sheet the primary outcome and persistent final view.
- Use exact rack identity and explicit registry relationships only; no dimension or similarity inference.
- Preserve the four evidence states verbatim.
- Treat condition completion as readiness, not as a status upgrade.
- Show incompatible and unknown results rather than filtering them away.
- Separate compatibility and commerce data, timestamps, and failure behavior.
- Fail closed for stale, contradictory, malformed, missing-source, cross-brand, or unavailable evidence.
- Query the external registry at the moment of every customer lookup, revision, Retry, and Decision Guide request. Do not use local or cached compatibility data as current evidence or current AI context.
- Use a small fictional test ecosystem or partner-authorized dataset; do not use Mirafit publicly by default.
- Make the public prototype a consumer task flow. A registry admin interface is not required.

### Required components

- `AdvisorShell`: step state, retailer scope, registry status, and responsive layout.
- `RackIdentityForm`: dependent family/model/version/height/configuration controls.
- `IdentityHelp`: registry-authored distinguishing clues and unresolved action.
- `UpgradeCategoryControl`: all or category selection.
- `RackSummary`: exact current identity with Edit action.
- `DecisionSheet`: output header, assessment time, state counts, groups, and print action.
- `EvidenceGroup`: one section per evidence state.
- `AttachmentResult`: stable row/card with status, rationale, conditions, freshness, and details action.
- `ConditionChecklist`: three-state answers and derived readiness.
- `EvidenceDetails`: conditions, limitations, provenance, review metadata, and safety scope.
- `CommerceStatus`: independently sourced price/stock or explicit not-connected/unavailable state.
- `DataStatus`: live registry retrieval and compatibility freshness, kept separate from commerce.
- `UnresolvedSummary`: refusal reason, missing evidence, retained selections, Retry, and support-ready summary.
- `PrintDecisionSheet`: print stylesheet/output behavior; no separate PDF-generation service is required.
- `DecisionGuideLauncher`: contextual "Explain this" and "Ask about this sheet" actions with scoped suggested questions.
- `DecisionGuidePanel`: one-answer guidance surface, current live-check time, citations to existing evidence details, retry, and visible failure states; it is not a persistent chat transcript.
- `DecisionGuideOrchestrator`: fresh read-only registry retrieval, deterministic context validation, minimum AI context construction, fixed response-shape validation, and zero mutation authority.

Component names are descriptive, not a required framework or file structure.

### Minimum data contracts

#### Rack record

| Field | Type | Constraint |
| --- | --- | --- |
| `ecosystem_id` | string | Required; must match deployed seller scope. |
| `rack_family_id` | string | Required stable ID. |
| `rack_version_id` | string | Required unique exact-version ID. |
| `display_name` | string | Required customer-facing name. |
| `height_variant` | string/null | Controlled value when applicable. |
| `configuration_schema` | array | Declares only relevant controlled questions and options. |
| `identification_clues` | array | Registry-authored, factual clues; no inferred dimensions. |
| `active` | boolean | Inactive records remain identifiable but cannot yield new positive claims without valid relationships. |

#### Attachment record

| Field | Type | Constraint |
| --- | --- | --- |
| `attachment_id` | string | Required stable ID. |
| `ecosystem_id` | string | Required; cross-ecosystem records are out of scope. |
| `sku` | string | Required for display/join. |
| `display_name` | string | Required. |
| `category_id` | string | Required controlled value. |
| `product_url` | string/null | Only authorized destinations. |
| `active` | boolean | Inactive items may remain visible as unavailable, without purchase action. |

#### Compatibility relationship

| Field | Type | Constraint |
| --- | --- | --- |
| `relationship_id` | string | Required unique ID. |
| `rack_version_id` | string | Required exact-version foreign key. |
| `attachment_id` | string | Required foreign key. |
| `evidence_state` | enum | `manufacturer_confirmed`, `known_incompatible`, `condition_dependent`, `unknown_review_required`. |
| `rationale` | string | Required concise, source-grounded explanation. |
| `conditions` | array | Each has stable ID, label, description, and applicable value/rule. |
| `limitations` | array | Explicit source-grounded constraints. |
| `evidence_source_title` | string | Required for any positive or negative authoritative claim. |
| `evidence_source_url` | URL | Required for any positive or negative authoritative claim. |
| `source_date` | date | Required. |
| `last_verified_at` | datetime | Required. |
| `review_due_at` | datetime | Required. |
| `reviewer` | string | Required named owner or controlled role. |
| `record_status` | enum | `approved`, `pending`, `retired`; only approved current records may retain their authored evidence state. |

#### Commerce record

| Field | Type | Constraint |
| --- | --- | --- |
| `attachment_id` | string | Join key only; cannot determine compatibility. |
| `price` | decimal/null | Optional; never fabricate. |
| `currency` | string/null | Required with price. |
| `stock_state` | enum/null | `in_stock`, `out_of_stock`, `preorder`, `unknown`. |
| `commerce_source` | string/null | Authorized source name. |
| `commerce_updated_at` | datetime/null | Display independently. |

#### Decision-sheet state

| Field | Type | Constraint |
| --- | --- | --- |
| `assessment_id` | string | Session-local reference; no account required. |
| `assessed_at` | datetime | Required on screen and print. |
| `rack_selection` | object | Exact selected IDs and values. |
| `category_id` | string/null | Null means all. |
| `registry_retrieved_at` | datetime/null | Null during failure. |
| `results` | array | Includes effective evidence state and provenance. |
| `condition_answers` | map | `condition_id` to `met`, `not_met`, or `not_sure`. |
| `degraded_reason` | enum/null | `registry_unavailable`, `identity_unresolved`, `missing_pairing`, `stale`, `contradictory`, `malformed`, `cross_brand`. |

### Validation and precedence constraints

- Customer-visible status uses the effective state after validation, not the raw registry value.
- Any safety-relevant validation failure can only lower confidence to unknown/review required; it can never raise confidence.
- Two approved current records for the same exact pair with different statuses are contradictory and therefore unknown/review required.
- A current negative authoritative record must not be hidden by an older positive record.
- A missing attachment relationship is unknown, not incompatible.
- Category filters operate after evaluation so they cannot accidentally turn missing records into confirmed absence.
- The Decision Guide receives the deterministic engine's validated effective state and may explain it, but cannot compute or alter it.
- Every Decision Guide source or record reference must exactly match the context retrieved for that request; unverified output is discarded.
- Every customer lookup, revision, Retry, and AI-guidance invocation must make a new request to the external registry at the moment of use.
- Compatibility responses must use request semantics that bypass browser, service-worker, CDN, framework, and application caches. No stored local dataset, stale-while-revalidate response, last-known snapshot, or offline fallback may be shown as current compatibility truth or supplied as current AI context.
- If the external registry cannot be reached and validated for that interaction, fail closed using the specified customer-visible behavior. Session state may preserve the user's selections and condition answers only; it may not preserve compatibility records as current.
- The Maker may choose framework, state management, endpoint adapter, and ordinary visual implementation details provided these decisions and acceptance criteria remain intact.

### Prototype test dataset and demo sequence

Prepare a deliberately fictional, clearly labelled dataset unless partner permission exists. It should support this demonstration sequence:

1. Select an exact rack version and show at least one manufacturer-confirmed, one condition-dependent, one known incompatible, and one unknown result.
2. Mark a required condition `not_sure`, then `met`, and show readiness and purchase gating change while evidence state remains condition-dependent.
3. Switch to the adjacent rack version and show materially different results.
4. Open evidence details and point out source date versus last verification.
5. Show commerce as separately dated or explicitly not connected.
6. Trigger the stale or contradictory fixture and show useful refusal.
7. Trigger registry failure and show that the advisor fails closed while retaining the user's input.
8. Ask why a result is condition-dependent; show a freshly retrieved, cited Decision Guide explanation while the deterministic status remains unchanged.
9. Ask an unsupported cross-brand or general advice question and show the bounded scope refusal.
10. Trigger AI-service failure and registry failure separately; show that the Decision Sheet survives the former and that no current guidance/result claim survives the latter.
11. Print/save the resulting Decision Sheet.

This sequence is the intended proof: controlled live evidence changes a concrete customer decision while uncertainty remains visible and useful.

---

## Decision trace to accepted research

| Design decision | Accepted finding preserved |
| --- | --- |
| Same-brand, post-purchase scope | Approved PIVOT and explicit first-opportunity boundary. |
| Exact structured rack identity | Compatibility is model/version and configuration specific. |
| Four evidence states | Explicit Researcher design implication. |
| No dimensional inference | REP and Mirafit evidence rejects nominal-fit certainty. |
| Controlled live registry | Preferred no-partner demonstrator and governance requirement. |
| Separate commerce block | Price/stock freshness is not compatibility truth. |
| Useful unresolved sheet | Ambiguous and missing evidence must retain reason and resolution path. |
| No room, photo, health, or cross-brand inputs | Accepted exclusions and data-minimisation requirement. |
| Small auditable catalogue | Evidence quality and manual governance take priority over breadth. |
| Bounded Decision Guide | AI reduces interpretation effort while deterministic governed records retain decision authority. |
| Fresh retrieval on every interaction | Neither compatibility results nor AI explanations can present hidden local/cached evidence as current. |
