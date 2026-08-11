# Research-to-Implementation Brief: Northstar Space Planner

**Owner:** Researcher  
**Research date:** 2026-08-11  
**Status:** READY FOR DESIGN  
**Scope:** Founder-led v2 only. The completed v1 was not read as product authority and was not changed.

## 1. Inputs Actually Read

1. `founder-charter.md`
2. `research-led-authority.md`
3. `pipeline/run-config.md`
4. `agents/researcher.md`
5. `research-inputs/deep-research-report.md`
6. `research-inputs/research-question-register.md`
7. `handoffs/README.md`
8. `evidence/decision-log.md`

The supplied dossier was treated as evidence to assess, not as unquestioned truth. Decisive claims were independently checked on 2026-08-11 against current primary sources from Mirafit, Concept2, Rogue, Bells of Steel, OpenAI, Google, Three.js, Konva, W3C, EUR-Lex, the Irish CCPC, and EU consumer guidance. The source register in section 14 records those checks.

## 2. Authority and Research Outcome

The founder controls the outcome and trust boundary: a conversational home-gym planning and upgrade product using governed live data, deterministic fit and compatibility validation, an itemised budget-aware quote, and a useful visual room plan. Research controls how those outcomes are best implemented.

Research supports a stronger implementation than a chatbot over a spreadsheet:

1. One canonical, versioned planning state must feed chat, requirements, catalogue results, compatibility, layout, quote, 2D, and 3D.
2. The language model should interpret intent, choose a useful next question, and explain governed results. It must not calculate fit, compatibility, stock, price, arithmetic, or validation status.
3. Google Sheets should be the live editorial source, not the request-time domain model. The server must ingest, type-check, version, and atomically publish a last-known-good catalogue snapshot.
4. Compatibility is an evidence-backed relationship. Similar dimensions can support only a dimensional-match state, never approval.
5. Static footprint, operating envelope, movement path, loading access, obstruction zones, and vertical clearance are different geometries.
6. The MVP should use deterministic candidate placement and exact validation, with explainable failures. A general optimiser is not justified for the launch catalogue.
7. The editable 2D planner should be the precise interaction surface. A read-only, recognisable Three.js view should derive from the same coordinates. This is the evidence-supported v2 interpretation of the 3D requirement.
8. Unknowns, conflicts, assumptions, source dates, and stale results are customer-visible states, not internal exceptions to hide.

No strategic exception prevents design. Unknown commercial policy values remain explicit configuration, and no required product capability is removed.

## 3. Charter Requirement Traceability

| Charter requirement | Research conclusion | Downstream artefact or rule | Acceptance evidence |
|---|---|---|---|
| New-space journey | Progressive conversational discovery plus editable state | `journey_type=new_space`; readiness service | E2E-NEW-01 |
| Upgrade journey | Known catalogue host, governed reference model, or manual footprint-only item | Existing-equipment records and compatibility policy | E2E-UPG-01 to 04 |
| Room length, width, height | Integer mm after explicit unit conversion and confirmation | `Room` state and geometry engine | GEO-01, GEO-02 |
| Goals, experience, users | Structured capabilities and expertise-sensitive phrasing | Requirements and training tags | CONV-01, REC-01 |
| Mandatory budget | Hard maximum unless explicit overrun consent | Money-in-cents quote service | BUD-01 to 04 |
| Friendly conversation | One blocking or high-information question per normal turn | `next_required_fields`; persona specification | CONV-02, CONV-03 |
| Persistent editable plan | Visible canonical values outside chat | Requirements panel backed by optimistic concurrency | STATE-01 to 03 |
| Free-form questions | Intent/alias interpretation followed by governed search or comparison | Search and compare tools | AI-01, AI-02 |
| Explain trade-offs | Explanations must cite validation outcomes and distinguish fact from judgement | Validation bundle and wording policy | TRUST-01 |
| Itemised quote | Equipment, required accessories, flooring, adapters, delivery and unknown charges | Quote lines and quote status | QUOTE-01 to 05 |
| Accurate top-down plan | Editable Konva projection of canonical mm coordinates | 2D planner plus DOM controls | VIS-2D-01 to 05 |
| Simplified 3D | Read-only Three.js projection of the same placements | Procedural scene and WebGL fallback | VIS-3D-01 to 06 |
| Lock and recalculate | Locked placements validate first and never move | Layout request and lock conflict reasons | GEO-LOCK-01 to 03 |
| Visible invalid placements | Structured violations rendered in canvas and DOM | Reason codes and violation list | GEO-FAIL-01 |
| Chat updates plan | All changes are versioned canonical patches | `expected_version` concurrency contract | STATE-CHAT-01 |
| Live external catalogue | Server-side Sheets ingestion with timestamps and snapshot IDs | Catalogue repository | DATA-LIVE-01 to 06 |
| Missing facts never invented | Explicit evidence status; unusable critical unknowns | Evidence records and schema gates | DATA-UNK-01 |
| All five compatibility states | Deterministic relationship and constraint decision table | Compatibility engine and fixtures | COMP-01 to 05 |
| Rectangular MVP room | X/Z floor plane plus Y height, doors and rectangular obstructions | Room and obstruction schemas | GEO-ROOM-01 |
| No unsupported safety claims | Geometry pass means encoded fit only | Claim vocabulary and response policy | SAFE-01 to 05 |
| Genuine model-led conversation | Responses API with strict tools and anti-hallucination fields | Model orchestrator | AI-E2E-01 |

## 4. Recommended MVP Boundary

### Include in the first credible release

- Browser application for Ireland/Europe, metric units and EUR.
- New-space and upgrade journeys.
- Chat plus direct, visible editing of all captured requirements.
- Rectangular room, ceiling, door swing, and rectangular fixed obstructions.
- Governed fictional Northstar catalogue with representative category and price tiers.
- Live Google Sheets ingestion, typed snapshots, provenance, freshness and failure handling.
- Deterministic recommendation filtering, compatibility, geometry, layout and quote services.
- Exact five-state compatibility result.
- Hard budget by default; separately authorised over-budget comparison.
- Editable 2D placement with drag, rotate, lock, remove, nudge and numeric alternatives.
- Read-only procedural 3D using the same placements.
- Itemised quote, validation status, reasons, assumptions and source timestamps.
- Desktop, mobile, keyboard, canvas and WebGL test coverage.

### Defer without weakening the vision

- Accounts, saved projects, collaboration, checkout and payment.
- Voice, room scanning, arbitrary polygons, sloping ceilings, AR/VR and photorealistic CAD.
- Direct manipulation in 3D.
- Universal cross-brand attachment certification.
- Continuous global optimisation or CP-SAT as the primary layout engine.
- Structural engineering, exercise prescription, installation approval or safety certification.
- Multi-currency commerce and real-time warehouse event streams.

## 5. User and Conversation Model

### 5.1 Canonical requirement state

Every editable value stores `value`, `unit`, `status`, `source`, `last_changed_at`, and `last_changed_by`. Allowed status values are `unknown`, `provided`, `confirmed`, and `conflicted`. Every accepted mutation increments `requirements_version`.

| Requirement | Blocking rule | Notes |
|---|---|---|
| `journey_type` | Always | `new_space` or `upgrade` |
| Room L/W/H | Before spatial recommendation | Accept m, cm, mm; convert to integer mm; echo for confirmation |
| Doors/obstructions | Confirm present or none | Door position, width, hinge and swing become hard zones |
| Primary goals | Always | Multi-select controlled goals plus original free text |
| Experience | Always | Beginner, some experience, experienced |
| Intended users | Usually | Count; collect relevant height/weight only when product limits or vertical movement require it |
| Existing equipment | Blocking for upgrade | Exact Northstar SKU/reference model where possible; manual item otherwise |
| Priorities | Always | Rank versatility, open floor, free weights, cardio, storage and cost |
| Maximum all-in budget | Always | Integer cents; hard constraint by default |
| Mounting permission | Conditional | Required when a candidate needs floor/wall anchoring |
| Noise/impact sensitivity | Conditional | Ask for weight dropping or noisy cardio contexts |
| Goal-specific answers | Conditional | Ask only questions that materially change candidates or validation |

### 5.2 Natural order and adaptation

Default order is journey, room, goals, experience/users, existing equipment, priorities, budget, then only unresolved conditional blockers. The assistant must extract several valid facts from one message and not ask for them again.

- Beginners receive capability language and at most one unfamiliar term at a time, with a short explanation.
- Experienced users may use rack-family, hardware, barbell and attachment terminology without being forced through beginner explanations.
- Quick choices are allowed for bounded answers such as journey, goal, experience and yes/no mounting permission. Free text remains available.
- The assistant normally asks one blocking or high-information question. It may ask two tightly coupled values together, such as room dimensions or door width and location.

### 5.3 Recommendation readiness

The deterministic readiness service, not the model, decides whether a recommendation can be validated. Readiness requires:

1. all journey-specific blockers resolved;
2. current catalogue snapshot available;
3. candidate critical geometry present;
4. compatibility evidence sufficient for any attachment claims;
5. a feasible layout or explicit infeasibility result;
6. a current itemised quote tied to the same versions.

The assistant probes when a blocking value is absent or contradictory, challenges when constraints cannot all be met, recommends only after validation, and explains infeasibility without pretending a plan exists.

### 5.4 Edit reconciliation

Chat and controls submit patches with `expected_version`. A stale patch returns `STATE_CONFLICT`; the model must reread current state and may not overwrite the newer value. Any relevant change marks old recommendations, layouts and quotes `stale`. A customer sees the current value, the conflict, and the action required.

## 6. Catalogue Blueprint and Source Method

### 6.1 Launch breadth

The launch catalogue should target approximately 35 to 42 sellable variants. This is enough to exercise space, tier, goal, budget and compatibility trade-offs while remaining governable.

| Family | Suggested variants | Purpose in the demonstration |
|---|---:|---|
| Compact squat stands | 2 | Low-cost/open-floor trade-off; limited attachment ecosystem |
| Half racks | 2 | Mid-footprint, storage and upgrade pathway |
| Four-post power racks | 3 | Compact, standard and premium construction/height/depth choices |
| Folding wall racks | 2 | Deployed/folded/movement envelopes and mounting conditions |
| Rack attachments | 10 to 12 | All five compatibility states, generations, adapters and obstruction failures |
| Benches | 3 | Flat, entry adjustable and premium adjustable |
| Cardio | 3 | Rower, compact bike and folding/compact cardio alternative |
| Barbells | 2 | General and power-oriented capability trade-off |
| Plate packages | 2 to 3 | Starter and progression quantities; storage/width consequences |
| Dumbbells | 2 | Adjustable set versus fixed pairs/storage cost |
| Kettlebells/bands/mats | 3 to 4 | Compact accessory capability and low-budget plan |
| Flooring | 2 | General and impact-oriented thickness/use assumptions |
| Storage | 2 | Vertical versus horizontal footprint |

Catalogue records must deliberately include: one approved same-family attachment; one adapter-required relation; one dimensional-only relation; one known generation or hole mismatch; one relation with insufficient evidence; one rack requiring anchoring; one rower with larger operating than static geometry; and one malformed noncritical fixture for ingestion tests.

### 6.2 Fictional-product method

- Use original Northstar names, descriptions, SKUs and simple geometry.
- Derive engineering patterns and realistic ranges from multiple current primary sources, not a disguised one-to-one copy.
- Keep source brands only in the internal source/evidence register.
- Preserve original source units and values, then record conversions separately.
- Review and cite every customer-critical launch value. Missing values remain `not_provided` or `unresearched`.
- Northstar EUR prices are fictional commercial inputs with region, tax basis, timestamp and review status. Manufacturer prices can be internal reasonableness checks but are not provenance for Northstar prices.

## 7. Data Dictionary and Google Sheets Schema

### 7.1 Universal field rules

- Canonical geometry unit: integer millimetres.
- Canonical mass unit: kilograms; decimal permitted.
- Canonical money: integer euro cents; format to EUR at the boundary.
- Canonical rotation: integer degrees, launch auto-layout rotations 0 and 90.
- IDs: stable ASCII strings, unique, immutable after publication.
- Unknown is `null` plus evidence status, never blank/zero/false interchangeably.
- Evidence status: `verified`, `not_provided`, `conflicting`, `assumption`, `not_applicable`, `unresearched`.
- Confidence: `high`, `medium`, `low`; percentages are prohibited.
- Customer-critical deterministic use requires an allowed evidence status and confidence. Compatibility approval cannot be based on low-confidence dimensional evidence.

### 7.2 Workbook tabs

| Tab | Required fields and types | Requiredness, validation and visibility |
|---|---|---|
| `Products` | `product_id:string`, `category:enum`, `family_id:string`, `customer_name:string`, `short_description:string`, `lifecycle_status:enum`, `skill_levels:enum[]` | ID/category/name/lifecycle required. Original customer-facing text visible. |
| `Variants` | `variant_id:string`, `product_id:string`, `sku:string`, `configuration:string`, `mass_kg:number?`, `declared_load_value:number?`, `declared_load_unit:enum?`, `declared_load_type:enum?`, `anchoring_mode:enum`, `material:string?`, `steel_gauge_mm:number?`, `generation:string?`, `active:boolean` | Variant/product/SKU/configuration/anchoring/active required. Loads require value, unit and type together. Sourced values visible with provenance. |
| `Geometry` | `geometry_id:string`, `variant_id:string`, `shape_type:enum`, `length_mm:int?`, `width_mm:int?`, `height_mm:int?`, `local_origin:enum`, `orientation_reference:enum`, `polygon_json:json?`, `geometry_version:string` | Variant, shape, origin, orientation and version required. Rectangles require L/W/H; polygons require valid points. Missing critical values block fit. |
| `RackInterfaces` | `interface_id:string`, `variant_id:string`, `role:enum`, `ecosystem:string?`, `upright_nominal_x_mm:number?`, `upright_nominal_z_mm:number?`, `upright_actual_x_mm:number?`, `upright_actual_z_mm:number?`, `hole_diameter_mm:number?`, `hardware_class:string?`, `pin_diameter_mm:number?`, `spacing_pattern:string?`, `pin_count:int?`, `mounting_faces:enum[]`, `required_depth_mm:int?`, `generation:string?`, `slot_details:string?` | ID/variant/role required. Hole and pin are distinct. Unknown approval-critical values force insufficient information. Technical fields visible on datasheet. |
| `Clearances` | `clearance_id:string`, `variant_id:string`, `clearance_type:enum`, `operating_state:enum`, `shape_type:enum`, `polygon_json:json`, `min_y_mm:int`, `max_y_mm:int?`, `hardness:enum`, `overlap_policy:enum`, `source_type:enum`, `policy_version:string`, `label:string` | All except max Y required. Manufacturer and Northstar assumptions must be distinguishable. Visible in planner legend/details. |
| `Compatibility` | `relationship_id:string`, `host_variant_or_family:string`, `attachment_variant_id:string`, `state:enum`, `adapter_variant_id:string?`, `conditions_json:json`, `failed_reason_codes:enum[]`, `host_generation_scope:string?`, `attachment_generation_scope:string?`, `mounting_face:enum?`, `approval_authority:enum`, `evidence_ids:string[]`, `reviewed_at:datetime`, `policy_version:string`, `active:boolean` | IDs/state/authority/evidence/review/policy/active required. Approved states require high-quality evidence and satisfied conditions. Customer sees state, conditions and reasons. |
| `PricesStock` | `sku:string`, `region:enum`, `currency:ISO4217`, `gross_price_cents:int?`, `tax_basis:enum`, `delivery_price_cents:int?`, `delivery_status:enum`, `installation_price_cents:int?`, `stock_state:enum`, `stock_quantity:int?`, `observed_at:datetime`, `valid_until:datetime?`, `commercial_version:string` | SKU/region/currency/tax/delivery status/stock/observed/version required. Unknown charge is null, never zero. Price and freshness visible. |
| `TrainingTags` | `variant_id:string`, `capability:enum`, `suitability:enum`, `priority_weight:number`, `evidence_or_policy_id:string` | All required. Controlled aliases map user language into capabilities. Suitability is recommendation data, not exercise advice. |
| `Sources` | `source_id:string`, `url:string`, `publisher:string`, `title:string`, `document_type:enum`, `published_or_version_date:date?`, `accessed_at:date`, `region:string?`, `content_hash:string?`, `active:boolean` | ID/URL/publisher/title/type/access/active required. Customer may see source title/date/link for relevant facts. |
| `Evidence` | `evidence_id:string`, `source_id:string`, `target_type:enum`, `target_id:string`, `field_or_relation:string`, `source_locator:string?`, `supplied_value:string?`, `normalized_value:string?`, `status:enum`, `confidence:enum`, `reviewer:string`, `conflict_group:string?` | ID/source/target/field/status/confidence/reviewer required. Conflicts stay linked, not overwritten. Relevant status/source visible. |
| `ValidationLists` | `list_name:string`, `allowed_value:string`, `schema_version:string`, `active:boolean` | Drives workbook data validation and parser enums. Changes require schema version. |

Variant-specific facts such as anchoring must never be promoted to product-family booleans. A condition can differ by depth, base, stabiliser, height or generation.

### 7.3 Ingestion and freshness

1. Server batch-reads named ranges.
2. Parser validates types, units, enums, duplicate IDs and foreign keys.
3. Noncritical bad rows may be quarantined with an admin data-quality entry.
4. Duplicate primary keys or malformed product identity, compatibility, currency or required commercial fields reject the entire candidate snapshot.
5. A valid snapshot publishes atomically with `catalogue_snapshot_id`, schema version and `observed_at`.
6. The domain kernel reads only the snapshot interface, never raw cells.
7. Use bounded exponential backoff for 429/500/503 and minimise concurrent calls.
8. Prototype refresh target is configurable between 30 and 120 seconds. This is Northstar policy, not a Google guarantee.
9. Last-known-good data can support planning within configured freshness, but stale status is visible. Expired commercial data disables new stock/price claims and current quotes.

## 8. Compatibility Ontology

### 8.1 Constraint families

The engine must represent host ecosystem, product generation, nominal and actual upright cross-section, hole diameter or documented hardware class, attachment pin diameter, vertical spacing pattern, pin count/alignment, mounting face, required clear upright face, rack depth, crossmember geometry, base/stabiliser, anchoring condition, bracing/obstruction, adapter identity, attachment generation and explicit exclusions.

### 8.2 Decision precedence

| Precedence | Condition | Result |
|---:|---|---|
| 1 | Host identity or any approval-critical fact missing/conflicting | `insufficient_information` |
| 2 | A known required constraint fails or explicit exclusion applies | `incompatible` with exact reasons |
| 3 | Explicit governed approval exists but required adapter/condition is absent | `compatible_with_condition`, condition unsatisfied; do not add to valid plan |
| 4 | Explicit governed approval exists and all conditions pass | `explicitly_compatible` or `compatible_with_condition` |
| 5 | All known dimensional checks pass but no approved relationship exists | `dimensionally_matching_but_unapproved` |
| 6 | Evidence coverage cannot establish dimensional checks | `insufficient_information` |

Only current manufacturer/manual relations or controlled Northstar product verification may authorise explicit compatibility. Current manufacturer dimensional facts may authorise a measured mismatch or dimensional-only state. Forums, anecdotes, distributor summaries and model reasoning never authorise approval.

### 8.3 Reason codes

`HOST_UNKNOWN`, `ATTACHMENT_UNKNOWN`, `GENERATION_MISMATCH`, `ECOSYSTEM_MISMATCH`, `UPRIGHT_SIZE_MISMATCH`, `UPRIGHT_TOLERANCE_UNKNOWN`, `HOLE_DIAMETER_MISMATCH`, `HARDWARE_CLASS_MISMATCH`, `PIN_DIAMETER_MISMATCH`, `HOLE_SPACING_MISMATCH`, `MULTI_PIN_ALIGNMENT_MISMATCH`, `MOUNTING_FACE_UNSUPPORTED`, `UPRIGHT_FACE_OBSTRUCTED`, `DEPTH_INSUFFICIENT`, `CROSSMEMBER_CONFLICT`, `BASE_CONFLICT`, `ANCHORING_REQUIRED`, `STABILISER_REQUIRED`, `ADAPTER_REQUIRED`, `EXPLICIT_EXCLUSION`, `MISSING_CRITICAL_SPEC`, `CONFLICTING_EVIDENCE`, `RELATION_NOT_APPROVED`.

### 8.4 Required fixtures

| Fixture | Expected result |
|---|---|
| Same Northstar family/generation with governed dip attachment relation | Explicitly compatible |
| Approved cable attachment requiring named stabiliser included in quote | Compatible with condition |
| 60 x 60 mm and documented hole facts match but no relationship row | Dimensionally matching but unapproved |
| Nominal 3 x 3 families with 5/8-inch versus 1-inch hardware | Incompatible: hardware/pin mismatch |
| Same headline measurements but excluded generation | Incompatible: generation mismatch |
| Manually entered third-party rack missing exact model/tolerance/spacing | Insufficient information |

The customer wording for dimensional-only is: "The recorded dimensions match the checks we can perform, but Northstar has no approved compatibility relationship for these products."

## 9. Spatial Model and Layout Algorithm

### 9.1 Coordinates and placement

Canonical room origin is one inside floor corner. X is width, Y is vertical, Z is length/depth. The 2D planner uses X/Z and 3D uses X/Y/Z. A placement stores `placement_id`, `variant_id`, `x_mm`, `z_mm`, `rotation_deg`, `locked`, `geometry_version`, and validation metadata.

Usable ceiling height is room height minus flooring build-up. Product height is a hard constraint. Documented raised/movement height is also hard. User-height and overhead movement are requested only when relevant and can be validated only when adequate governed inputs exist.

### 9.2 Zone taxonomy and overlap

| Zone | Default policy |
|---|---|
| Static footprint | Hard; never overlaps another footprint, room boundary or prohibited obstruction |
| Manufacturer operating envelope | Hard while active; no footprint or prohibited-zone overlap |
| Folding/deployment/movement path | Hard; must remain clear in the represented state |
| Door swing/fixed obstruction | Hard user-provided prohibited zone |
| Documented vertical movement | Hard against usable ceiling |
| Loading/service access | Hard when source says required; otherwise warning |
| Installation/anchoring access | Installation constraint/warning, never a safety approval |
| Northstar circulation buffer | Soft ranking preference unless policy marks a specific context hard |
| Plate-loading convenience | Soft assumption unless documented by a governed source |

For MVP, two hard operating zones do not overlap unless the catalogue explicitly marks the states mutually exclusive and the interface explains that only one can be used at a time. The launch seed should avoid relying on that exception. Soft zones may overlap with score penalties and warnings.

There is no authoritative universal circulation distance. A configurable 600 mm default can be tested as a Northstar planning preference, labelled as an assumption and never as a safety clearance.

Manually entered equipment creates a confirmed rectangular footprint. Unless the user also supplies a governed operating envelope, its state is `footprint_only`; it can be placed and collision-checked but cannot receive a fully validated use-space or attachment claim.

### 9.3 Geometry and layout

- Convert footprint and clearance records to local polygons and transform by placement.
- Use axis-aligned bounding boxes as a broad phase only; exact oriented rectangle or polygon intersection decides validity.
- Validate locked placements first. Conflicting locked items produce `LOCKED_ITEMS_CONFLICT`; neither moves.
- Remove candidates missing hard geometry.
- Generate anchors at corners, walls, obstruction boundaries and edges of placed objects.
- Test allowed launch rotations 0 and 90 degrees.
- Reject room, ceiling, footprint, door, hard operating-zone and mounting failures.
- Rank feasible layouts by goal coverage, multipurpose utility, preferred access, open floor and budget headroom, with penalties for soft clearance and awkward circulation.
- Use deterministic best-first search with a bounded, seeded restart for one alternative. Same input, snapshot, policy and seed must reproduce the result.
- Return one recommended valid plan and at most one materially useful valid alternative.

Required geometry reasons are `ROOM_BOUNDS`, `CEILING_TOO_LOW`, `FOOTPRINT_COLLISION`, `OPERATING_CLEARANCE_COLLISION`, `DOOR_SWING_BLOCKED`, `LOCKED_ITEMS_CONFLICT`, `ANCHORING_CONDITION_UNMET`, `MISSING_DIMENSIONS`, `MISSING_OPERATING_ENVELOPE`, and `BUDGET_EXCEEDED`. Each result includes involved IDs, required/available values and overlap amount where calculable.

## 10. Recommendation and Quote Logic

Free text goals map through a controlled alias layer to capabilities such as `barbell_strength`, `bench_press`, `free_weight_hypertrophy`, `cable_resistance`, `rowing_cardio`, `cycling_cardio`, `pull_up`, `dip`, `mobility`, and `open_floor_conditioning`.

Candidate sets are filtered by active lifecycle, current stock policy, evidence completeness, mounting permission, user/product limits, compatibility and hard budget. A coherent set must cover the primary capability and an evidence-supported subset of secondary capabilities; it need not consume all room or budget.

Ranking order is:

1. hard validity;
2. primary and secondary goal coverage;
3. multipurpose utility and progression;
4. stated priorities;
5. preserved usable open floor;
6. total current quote and budget headroom;
7. evidence quality and lower uncertainty.

The quote includes all selected equipment, required adapters/stabilisers, chosen bar/plates, relevant flooring, storage/accessories, delivery and installation where offered. Every line has SKU, quantity, unit price, line total, price observation time and inclusion reason. Unknown delivery is `unknown`, not EUR 0. Arithmetic uses integer cents.

Budget is hard by default. If no coherent valid plan fits, explain the shortfall. Only after explicit permission may a clearly separated comparison exceed budget; it must show the exact excess and value gained. An alternative is warranted only for a material trade-off such as a smaller footprint, lower cost, different cardio modality, or preserved ecosystem.

## 11. AI, Tools and Canonical State

### 11.1 Responsibility matrix

| Language model may | Deterministic application must |
|---|---|
| Extract candidate requirements from natural language | Validate and version requirement patches |
| Resolve colloquial aliases into proposed controlled values | Confirm allowed enums, units and conflicts |
| Select a friendly next question from blockers | Determine actual blockers and readiness |
| Explain validated comparisons and trade-offs | Search exact catalogue snapshots and score candidates |
| Summarise source/assumption language | Decide compatibility, fit, stock, prices, totals and validity |
| Ask permission for an over-budget comparison | Enforce budget and record consent |

The model is prohibited from inventing or independently setting `fits_room`, `compatibility_state`, `stock_status`, `price`, `grand_total`, `within_budget`, `declared_load`, `product_dimension`, `anchoring_requirement`, or `validation_status`.

### 11.2 Required service contracts

| Tool/service | Minimum input | Minimum output and rule |
|---|---|---|
| `get_plan_state` | `plan_id` | Current canonical state, versions, visible statuses |
| `get_next_required_fields` | `plan_id`, `requirements_version` | Blocking/conflicted/conditional fields with priority and reason |
| `update_customer_requirements` | `plan_id`, `expected_version`, typed patches | New version, accepted/rejected patches, conflicts, blockers |
| `search_live_catalogue` | Plan/version, snapshot, categories/capabilities, stock/budget filters | Exact snapshot ID, eligible items, exclusions and warnings |
| `compare_products` | Variant IDs, snapshot, comparison dimensions | Governed values, evidence status, missing fields; no prose inventions |
| `check_attachment_compatibility` | Exact host/attachment IDs or governed reference data | Five-state result, conditions, failures, evidence IDs, policy version |
| `check_room_fit` | Plan/version/snapshot, placements | Validity, structured reasons, geometry policy version |
| `generate_room_layout` | Plan/version/snapshot, candidates, locks, seed | Feasible/infeasible, placements, unplaced items, score explanation |
| `calculate_itemised_quote` | Plan/layout/version/snapshot/budget/consent | Lines, totals, unknown charges, within-budget, freshness |

The server orchestrator should use the OpenAI Responses API with strict function schemas. `parallel_tool_calls: false` is appropriate where sequential state mutation is required. OpenAI conversation history may support dialogue continuity but is not the canonical plan database.

Tool timeout or failure means lack of evidence. The assistant says it could not validate the claim; it never converts a timeout into a positive result. Only a successful validation bundle with current `requirements_version`, `catalogue_snapshot_id`, `compatibility_policy_version`, `geometry_policy_version`, `quote_policy_version`, and layout ID authorises a recommendation.

## 12. Shared 2D/3D and Accessible Interaction

The application owns placements. Konva and Three.js are projections only.

- Konva provides the editable top-down room, footprints, hard/soft zones, locks and violations.
- On transform end, normalise display scale back into canonical mm/rotation and revalidate. Do not store Konva scale as product geometry.
- Provide non-drag DOM controls for item selection, numeric X/Z, rotate 90 degrees, nudge, lock/unlock and remove.
- Provide a textual placement table, for example: "Bench: 850 mm from west wall, 420 mm from north wall, rotated 90 degrees."
- Three.js uses simple procedural silhouettes: uprights/crossmembers for racks, pads/frame for benches, rail/flywheel/seat for rower, discs/sleeves for bars and plates, and blocks/handles for dumbbells.
- Concentrate accuracy on collision envelopes and recognisable shape, not manufacturing detail or copied commercial CAD.
- Generate floor/walls from the room, hide/toggle the front wall, provide OrbitControls and a Reset View command that frames current room bounds.
- On resize, synchronise CSS size, drawing buffer and camera aspect.
- If WebGL fails, editable 2D, quote, chat and textual plan continue; 3D status explains unavailability.

Desktop should support chat, planner and a persistent plan/quote area without nesting cards. Mobile should use tabs or stacked views, preserve the same state and commands, and never squeeze a desktop multi-pane layout into illegibility.

## 13. Trust, Safety and Customer Wording

| Condition | Approved customer-facing pattern |
|---|---|
| Sourced dimension | "Manufacturer-listed height: 2,080 mm. Source checked [date]." |
| Missing fact | "Height is not provided in the governed source, so Northstar has not estimated it." |
| Northstar buffer | "Northstar planning buffer: 600 mm. This is a planning assumption, not a manufacturer safety clearance." |
| Geometry pass | "Fits the recorded room geometry and encoded clearances." |
| Installation boundary | "This is not an installation-safety assessment. Verify the mounting surface, anchoring and current instructions before installation." |
| Explicit compatibility | "Approved in Northstar's compatibility data for these recorded versions." |
| Dimensional-only | "Recorded dimensions match, but compatibility is not approved." |
| Stale commercial data | "Price and stock were last checked at [time]; current availability could not be refreshed." |
| Source conflict | "The governed sources disagree, so Northstar cannot validate this specification yet." |

The app may report documented dimensions, declared load type/value, product weight, anchoring requirement and manufacturer operating area. It may not certify installation, floor/wall suitability, exercise execution or system safety. Steel gauge can be discussed as a construction factor affecting rigidity, durability, mass, manufacturing and cost; it is not proof of safety. Spotter arms and straps are described as support features, with current product instructions required. Adapter presence does not itself certify an otherwise unapproved pairing.

Before any real retail or order-taking release, qualified review is needed for legal status, consumer information, product safety, tax, delivery and accessibility. The prototype should still make total/unknown charges, evidence and keyboard access correct from the beginning.

## 14. Evaluation and Acceptance Plan

### 14.1 Release-critical scenarios

| ID | Scenario | Required result |
|---|---|---|
| E2E-NEW-01 | 4.0 x 3.0 x 2.4 m, strength, EUR 2,500, no equipment | One current, in-stock, validated plan; quote at/below cap; synced 2D/3D |
| GEO-CEIL-01 | 1,980 mm ceiling and 2,080 mm rack | Reject with exact required/available height |
| GEO-ROW-01 | Rower footprint fits but documented use envelope crosses door | Reject usable placement despite footprint fit |
| BUD-01 | No coherent plan under cap | Explain infeasibility; never raise cap |
| BUD-02 | User explicitly permits comparison | Separate alternative with exact overrun and benefit |
| DATA-UNK-01 | Candidate deployed depth missing | No geometric approval; `MISSING_DIMENSIONS` |
| E2E-UPG-01 | Exact approved host and attachment generation | Explicitly compatible |
| E2E-UPG-02 | Dimensions match but relation absent | Dimensional-only, never "compatible" |
| E2E-UPG-03 | Named adapter required | Valid only when adapter is present and quoted |
| E2E-UPG-04 | Manual third-party rack lacks critical facts | Insufficient information; footprint-only planning |
| COMP-GEN-01 | Headline dimensions match but generation excluded | Incompatible with generation reason |
| DATA-LIVE-01 | Sheet value changes and valid refresh occurs | New snapshot/version changes governed answer |
| DATA-STALE-01 | Refresh fails within freshness policy | Label last checked time and bounded stale use |
| DATA-STALE-02 | Commercial data exceeds freshness policy | Plan editing continues; new current quote unavailable |
| STATE-01 | Ceiling edit after quote | Layout and quote immediately stale until revalidated |
| STATE-02 | Chat patch races newer control edit | Reject stale patch and reread current state |
| GEO-LOCK-01 | Two locked objects overlap | Neither moves; exact conflict shown |
| VIS-3D-01 | Valid plan on desktop/mobile | Nonblank, framed, recognisable scene matching 2D coordinates |
| VIS-3D-02 | WebGL unavailable/lost | 2D and textual plan remain functional |
| A11Y-01 | Keyboard-only complete journey | All planning actions available without drag |
| AI-BOUND-01 | Prompt asks model to ignore tools and invent fit | Refuse unsupported claim; current governed state unchanged |

### 14.2 Test layers

- Unit conversion, integer geometry, money cents, schema parsing and enum validation.
- Property-based geometry for rotations, boundary contact, collision symmetry and inverse transforms.
- Compatibility fixtures across every state and reason family.
- Strict tool-schema contract tests, version mismatch and malformed outputs.
- Sheets duplicate IDs, missing references, invalid numbers, 429/500/503, timeout and partial corruption.
- Quote quantity, rounding, discount, tax basis, unknown delivery, EUR 0 and exact-budget cases.
- Conversation beginner/expert language, multiple facts per turn, contradictions and impossible constraints.
- Concurrency, stale derived outputs and snapshot/policy version mismatch.
- 2D mouse, touch, keyboard, numeric controls, rotate, lock, remove and collision feedback.
- 3D hidden-container initialisation, resize, camera framing, blank pixel check, context loss and reference coordinate matching.
- Mobile text containment, no incoherent overlap, focus order, labels and plan-table fallback.

## 15. Risk, Assumption and Unknown Register

| Item | Classification | Control and downstream treatment |
|---|---|---|
| Universal circulation clearance | Evidence gap | Configurable 600 mm Northstar soft assumption; visibly labelled; usability test |
| Exact Northstar price/tax/delivery | Commercial configuration | Seed explicit fictional EUR values and unknown-charge states; do not imply real offer |
| Manufacturer tolerances often absent | Evidence gap | Dimensional-only or insufficient-information state; never cross-brand approval |
| External equipment breadth | Scope choice | Support known reference records plus manual footprint-only entry for MVP |
| User measurement error | Runtime unknown | Echo/confirm measurements; no installation certification |
| Structural floor/wall suitability | Out of scope | Preserve anchoring/manufacturer caveats; refer to appropriate professional |
| Source specifications can change | Operational risk | Field provenance, access date, snapshot and review cadence |
| Malformed spreadsheet editing | High data risk | Typed parser, referential checks, quarantine and atomic snapshot publication |
| Stale price/stock | Commercial risk | Freshness state, observation time and refresh-before-commit if commerce is added |
| False compatibility approval | Highest product risk | Explicit relationship engine, conservative precedence and zero-tolerance fixtures |
| LLM states stale or invented facts | High trust risk | Prohibited fields, strict tools and current validation bundle requirement |
| 2D/3D divergence | High UX risk | Single placement state and coordinate reference fixtures |
| WebGL blank/misframed | Medium risk | Reset/framing/resize/pixel tests and 2D fallback |
| Chat becomes a questionnaire | UX risk | One high-information question, multi-fact extraction and direct controls |
| Gym-specific conversation evidence is limited | Research gap | Prototype usability sessions with novices and experienced users after build |
| Future legal/commercial obligations | Strategic future work | Qualified review before real commerce; not a blocker for fictional prototype |

None of these requires a founder decision before the Designer stage. They are either governed prototype assumptions, conservative scope rules, or future-release gates.

## 16. Prioritised Designer Directives

1. Design one coherent product around canonical visible state, not separate chat, form and visualisation experiences.
2. Preserve conversational comfort while allowing faster direct edits and bounded quick choices.
3. Make current/stale/invalid/unknown status understandable without internal terms such as tool, row, API or model.
4. Treat editable 2D as the exact planning workspace and read-only 3D as a useful spatial view.
5. Show footprint, hard operating zones, planning assumptions and violations with a restrained legend plus equivalent text.
6. Make the five compatibility states visually and verbally distinct; dimensional-only must not resemble approval.
7. Expose quote composition, budget headroom/shortfall, required adapters and unknown charges.
8. Define responsive desktop and mobile workflows, not just responsive dimensions.
9. Specify beginner/expert language variants, empty/loading/stale/failure states and accessible non-drag controls.
10. Translate every release-critical scenario into design acceptance criteria for the Maker.

The Designer may improve initial layout and interaction hypotheses when consistent with this brief. It must not remove chat, deterministic validation, live data, editable planning, quote or 3D.

## 17. Maker Constraints Carried Through Research

1. Separate raw Sheets ingestion, canonical domain objects and UI projections.
2. Use strict typed schemas, stable IDs, integer mm, integer cents and explicit unknown states.
3. Use one authoritative server-side plan state with optimistic concurrency.
4. Pin fit, compatibility and quote results to requirements, catalogue and policy versions.
5. Build and test the deterministic data/compatibility/geometry/quote kernel before allowing the model to make recommendations.
6. Use current OpenAI Responses API function calling, keep the API key server-side and never commit it.
7. Keep Konva/Three transforms out of domain truth.
8. Test after each pipeline phase and preserve exact structured failure reasons.
9. Build procedural Northstar visuals; do not copy commercial CAD/assets or imply affiliation.
10. Treat all tool failures as lack of evidence and all expired derived outputs as stale.

## 18. Completed Research Question Register

| Q | Conclusion/default | Classification and confidence | Mandatory carry-forward |
|---:|---|---|---|
| 1 | Journey, room/obstructions, goals, experience, users where relevant, existing equipment, priorities and hard budget are the minimum | Recommendation, high | Requirements schema and readiness service |
| 2 | Follow-ups are capability- and journey-dependent; mounting, noise, loading and user limits are conditional | Recommendation, medium-high | Conditional question rules |
| 3 | Same state, different language depth; no beginner jargon dump or expert tutorial | Inference/recommendation, medium | Persona and response tests |
| 4 | Ask one high-information question; accept multiple facts in one message | Recommendation, medium-high | Dialogue orchestration |
| 5 | Probe blockers, challenge infeasibility, recommend only after validation | Recommendation, high | Readiness/validation sequence |
| 6 | All canonical requirements and plan items remain visibly editable; changes invalidate derived outputs | Recommendation, high | Versioned state UI |
| 7 | Quick choices help bounded enums but free text remains available | Recommendation, medium | Interaction requirement |
| 8 | Map language to controlled capabilities, then assemble a coherent validated set | Recommendation, high | Alias/capability/tag model |
| 9 | Hard validity first; rank goal coverage, versatility, preferences, open floor, cost and evidence | Recommendation, high | Deterministic ranking |
| 10 | Quote equipment plus required adapters, flooring, free weights/accessories, delivery and known/unknown charges | Evidence-informed recommendation, high | Quote schema |
| 11 | Budget is hard; overrun comparison only after explicit consent with exact excess | Founder/evidence aligned, high | Consent and quote tests |
| 12 | At most one alternative, only for a material trade-off | Recommendation, medium | Presentation constraint |
| 13 | About 35-42 variants across 13 families is governable and demonstrative | Prototype recommendation, medium | Seed catalogue gate |
| 14 | Include space-, capability-, tier- and ecosystem-diverse products | Recommendation, high | Catalogue blueprint |
| 15 | Split stable product, variant, geometry, interface, clearance, relation, commercial and evidence data | Recommendation, high | Workbook/domain schema |
| 16 | Use original fictional identities calibrated from multiple primary engineering patterns | Recommendation, high | Source/IP method |
| 17 | Unknown/conflict/assumption/converted states are explicit and visible when relevant | Recommendation, high | Evidence enums and wording |
| 18 | Customer-critical dimensions, load types, anchoring, clearances and compatibility require field/relation provenance | Recommendation, high | Evidence table |
| 19 | Stable IDs, variant generations, schema versions and timestamped commercial snapshots | Recommendation, high | Sheet schema and ingestion |
| 20 | Ecosystem, generation, upright, hole, pin, spacing, mounting, depth, obstruction and conditions determine compatibility | Verified facts, high | Compatibility constraints |
| 21 | 75 vs 76.2 mm and 5/8 vs 1 inch demonstrate nominal labels can mislead | Verified fact, high | Preserve exact units; dimensional-only state |
| 22 | Explicit relations authorise approval; dimensions authorise only measured pass/fail | Verified fact to recommendation, high | Five-state decision table |
| 23 | Give concise state/reason first; expose technical details progressively | Recommendation, medium | Experience-sensitive explanations |
| 24 | Manual equipment supports footprint planning; compatibility remains insufficient absent governed identity/specs | Recommendation, high | `footprint_only` policy |
| 25 | Model footprint, operating, movement, door, vertical, loading, installation and circulation zones separately | Verified fact to recommendation, high | Clearance taxonomy |
| 26 | Product-specific clearances are facts; generic buffers are labelled Northstar assumptions | Verified gap/recommendation, high | Provenance and legend |
| 27 | Use room height minus flooring; add documented movement height; collect user values only when relevant | Recommendation, medium-high | Vertical validator |
| 28 | Hard zones do not overlap by default; soft planning zones may overlap with penalty | Prototype policy, medium | Overlap matrix |
| 29 | Deterministic candidate anchors, exact polygon validation and best-first ranking suit MVP | Recommendation, high | Layout engine contract |
| 30 | Validate drag/rotate before commit; locks never move; violations return reasons | Recommendation, high | Planner mutation rules |
| 31 | Manual item is a confirmed rectangle with unknown operating envelope and no full-use validation | Recommendation, high | Manual equipment state |
| 32 | Integer mm; X/Z floor, Y vertical; one corner origin; rotation about +Y | Recommendation, high | Shared placement schema |
| 33 | Procedural silhouettes with accurate envelopes are sufficient and original | Recommendation, medium-high | 3D modelling brief |
| 34 | Select, drag, 90-degree rotate, lock, remove, nudge and numeric position are MVP controls | Recommendation/accessibility, high | 2D acceptance criteria |
| 35 | Framed camera, wall toggle, orbit/zoom/pan, reset, resize, failure and mobile states make 3D useful | Official docs/recommendation, high | 3D specification |
| 36 | Violations use overlays plus structured text/table; no canvas-only meaning | WCAG-backed recommendation, high | Accessible planner |
| 37 | Browser screenshots, pixel variance, framing, coordinate and responsive tests prove rendering | Recommendation, high | Visual test suite |
| 38 | Versioned requirements, snapshot-aware search/compare, compatibility, fit, layout and quote contracts are required | Recommendation, high | Tool contracts |
| 39 | Model interprets/explains; code owns facts, geometry, compatibility, stock, money and validity | Founder/evidence aligned, high | Responsibility matrix |
| 40 | Readiness -> search -> compatibility -> layout -> quote -> explanation; current bundle required | Recommendation, high | Orchestration guard |
| 41 | All mutations converge through optimistic canonical state; outputs become stale after change | Recommendation, high | State architecture |
| 42 | Controlled capabilities/aliases plus structured filters outperform literal keyword-only matching | Recommendation, medium-high | Retrieval layer |
| 43 | Bounded cache/freshness, explicit failures, 2D fallback and unavailable quote states | Official docs/recommendation, high | Failure matrix |
| 44 | Reporting a sourced fact is allowed; fit pass is not installation or safety certification | Trust-boundary recommendation, high | Claim vocabulary |
| 45 | Explain gauge as construction factor, support features factually, adapters/anchoring conditionally | Recommendation, high | Safety content rules |
| 46 | Use plain phrases: not provided, sources disagree, planning assumption, not revalidated | Recommendation, high | Customer wording |
| 47 | New-space and upgrade E2E scenarios must mutate live state and produce governed non-scripted outcomes | Recommendation, high | Acceptance fixtures |
| 48 | Unit, property, contract, live-data, adversarial, accessibility, mobile, geometry, compatibility, quote and canvas tests are release gates | Recommendation, high | Test matrix |

All 48 questions resolve to a field, deterministic rule, tool contract, interaction requirement, acceptance criterion, test fixture, provenance rule or labelled prototype assumption. None is deferred as an unowned founder question.

## 19. Independently Checked Source Register

All sources below were accessed 2026-08-11.

| Source | Decisive use |
|---|---|
| [Mirafit Help and Support](https://mirafit.co.uk/faqs/) | M1-M4 upright/hole differences and warning against inferring cross-brand fit |
| [Mirafit M3 Power Rack](https://mirafit.co.uk/mirafit-m3-power-rack-and-extension-bay.html) | 60 x 60 x 3 mm, 17 mm holes, spacing regions and bolting features |
| [Concept2 RowErg](https://www.concept2.com/ergs/rowerg) | 244 x 61 cm assembled versus 274 x 122 cm use space; distinct load statements |
| [Bells of Steel attachment compatibility](https://support.bellsofsteel.com/en-US/do-your-rack-attachments-fit-on-the-power-racks-of-other-brands-525943) | 75 vs 76.2 mm, 5/8 vs 1 inch, multi-pin alignment and tolerance risk |
| [Rogue Monster Lite wall mounts](https://www.roguefitness.com/monster-lite-wallmount) | Same nominal 3 x 3 family with 5/8-inch Monster Lite versus 1-inch Monster hardware |
| [OpenAI Responses API reference](https://platform.openai.com/docs/api-reference/responses) | Current Responses architecture and application-defined tools |
| [OpenAI function/strict schema reference](https://platform.openai.com/docs/api-reference/responses-streaming/response/web_search_call?lang=curl) | Strict typed function arguments/outputs |
| [OpenAI Assistants API deprecation](https://platform.openai.com/docs/assistants/deep-dive/run-lifecycle%23.webm) | Do not begin a new Assistants integration; shutdown date 2026-08-26 |
| [Google Sheets usage limits](https://developers.google.com/workspace/sheets/api/limits) | Quotas, 429 handling and truncated exponential backoff |
| [Google Sheets error guidance](https://developers.google.com/workspace/sheets/api/troubleshoot-api-errors) | 500/503, constrained requests, concurrency and retry guidance |
| [Google Sheets values guide](https://developers.google.com/workspace/sheets/api/guides/values) | Batch reading multiple ranges |
| [Konva Transformer](https://konvajs.org/api/Konva.Transformer.html) | Resizing changes scale rather than width/height |
| [Three.js responsive design](https://threejs.org/manual/en/responsive.html) | Synchronise canvas display, drawing buffer and camera aspect |
| [Three.js Box3](https://threejs.org/docs/pages/Box3.html) | Rendering/debug bounds, not domain geometry authority |
| [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Current accessibility criteria |
| [W3C Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements) | Provide non-drag pointer alternatives |
| [EU General Product Safety Regulation 2023/988](https://eur-lex.europa.eu/eli/reg/2023/988/oj) | Product interactions are relevant to safety assessment; not a compatibility algorithm |
| [CCPC European Accessibility Act](https://www.ccpc.ie/news-and-media/news/article/2025/06/26/european-accessibility-act-becomes-law-in-ireland-on-28-june-2025) | Irish commencement and e-commerce scope |
| [EU pricing and payments guidance](https://europa.eu/youreurope/citizens/consumers/shopping/pricing-payments/index_en.htm) | Clear total price including taxes/additional charges |

## 20. Artefacts, Validation and Handoff

### Artefacts created or changed

- Created `handoffs/01-research-implementation-brief.md`.
- Added substantive evidence-led decisions to `evidence/decision-log.md`.
- No product code, deployment, Google Sheet, v1 file or non-v2 artefact was changed.

### Validation performed

- All founder outcomes and non-negotiables map to a downstream rule and acceptance evidence.
- All 48 registered questions are resolved and carried forward.
- Decisive dossier claims were independently checked against current primary sources where practical.
- Unknowns and source gaps remain explicit; none was silently filled.
- Catalogue scope exercises every compatibility state.
- Compatibility and geometry logic are deterministic enough for design and implementation.
- The recommended MVP retains chat, live data, deterministic validation, editable planning, quote and 3D.

### Failures remaining

None at the Research quality gate. Future primary-manual collection for every final seed SKU, usability studies, commercial/legal configuration and empirical tuning of Northstar circulation assumptions remain implementation/release work, not blockers to design.

### Next role instructions

The Designer must read the founder charter, research-led authority, this complete handoff and the decision log. It should produce one detailed, evidence-led solution specification that preserves the canonical-state architecture and all release-critical acceptance scenarios. It may improve the visual arrangement, conversational choreography and direct controls, but it must not weaken the trust states or make a graphics layer, spreadsheet or model response the source of truth.

## READY FOR DESIGN

The Research quality gate passes. There are no unresolved strategic exceptions requiring founder judgement before the Designer begins.
