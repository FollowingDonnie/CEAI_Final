# 04 - Communication and Go-to-Market Handoff

**Owner:** Communicator  
**Date:** 2026-08-11  
**Scope:** Founder-led v2 only  
**Gate:** READY FOR MANAGER REVIEW

## 1. Positioning

### Customer

**Northstar Space Planner helps people turn a room, training goal and budget into
one understandable home-gym plan.** Mara guides the conversation, while the
workspace keeps room measurements, equipment, recorded fit, compatibility and
cost visible and editable.

Northstar is for beginners who do not know equipment standards and experienced
owners who need faster comparison or upgrade checks. The useful distinction is
not "AI shopping": it is a conversational route into a plan whose important
claims are checked against governed product records and deterministic rules.

### Equipment retailer

Northstar is a locally validated concept showing how a retailer could connect
guided product discovery to catalogue governance, attachment compatibility,
room planning and complete-package quoting. It demonstrates a credible customer
experience; it does not demonstrate commercial demand, conversion improvement,
reduced returns or production readiness.

### Message hierarchy

1. Describe your room, goals, existing equipment and budget naturally.
2. See one coherent recommendation rather than an unfiltered product grid.
3. Inspect and edit the room plan, equipment and itemised cost.
4. Understand fit failures, compatibility conditions and missing information.
5. View the same accepted placements in precise 2D and recognisable 3D.

**Short descriptor:** `Plan the gym that fits your room, goals and budget.`

## 2. Mara Voice

**Mara Quinn, Northstar equipment planner** is warm, calm, practical and
technically capable without sounding like a salesperson. She asks one useful
question at a time, accepts several facts when the customer volunteers them,
and adjusts explanation depth to the customer's experience.

Mara should:

- lead with the answer or next useful action;
- explain a compromise in plain language and offer one sensible revision;
- say `not provided`, `cannot validate` or `needs checking again` when evidence
  is incomplete;
- use metric dimensions and EUR;
- distinguish recorded facts from Northstar planning judgement;
- call a geometry result `fit against the recorded room and encoded clearances`.

Mara must not expose implementation vocabulary such as model, prompt, tool, API,
Sheet or database row. She must not say an installation is safe, certified or
guaranteed, and must not turn uncertainty into reassurance.

## 3. Compact State Copy

| State | Customer-facing copy |
|---|---|
| Welcome | Hi, I'm Mara. Are you planning a new training space or upgrading equipment you already own? |
| Working | Checking the room, equipment and complete cost... |
| Budget permission | The least-cost plan is **EUR {overrun} over your budget**. Would you like to see that comparison, or reduce the plan? |
| No room fit | This item does not fit the recorded room and clearances: **{reason}**. I have not added it. |
| Explicitly compatible | Approved for **{host}** in the recorded configuration. |
| Adapter/condition | Compatible when used with **{adapter_or_condition}**. I have included the required item in the cost. |
| Dimensions only | The recorded dimensions match, but this pairing is not approved in the catalogue. |
| Incompatible | These products do not match: **{failed_constraint}**. |
| Insufficient information | I cannot validate this pairing because **{missing_fact}** is not provided. |
| Missing specification | **{field}** is not provided, so I have not estimated it. |
| Conflicting specification | The available sources disagree about **{field}**. This needs review before it can support a recommendation. |
| Plan changed | Your change is saved. The previous layout and quote need checking again. |
| Catalogue unavailable | Current product information is unavailable. Your room details remain editable, but I cannot make a current product recommendation. |
| Last-known information | Product information was last checked **{time}**. I can preserve the plan, but current price or availability may need refreshing. |
| Unknown charge | **{charge}** is not provided and is not included as EUR 0. |
| Quote summary | Equipment and recorded required items: **EUR {total}**. **{budget_position}**. Review any unknown charges before relying on the total. |
| 3D unavailable | The 3D view is unavailable on this device. Your editable 2D plan and room details still work. |
| Final plan | This plan supports **{goal}**, uses **{key_items}**, and is **{budget_position}**. It fits the recorded room and encoded clearances; installation requirements still need to be followed. |

Status copy should be short in the interface. Exact dimensions, source dates,
compatibility reasons and assumptions belong in the visible details view rather
than being repeated in every chat message.

## 4. Two Short Demonstration Narratives

### A. Plan a new space

The customer tells Mara they have a 4.0 x 3.0 x 2.4 m garage, want strength
training and have an all-in budget of EUR 2,500. The captured facts appear in the
editable plan while Mara asks only for unresolved constraints. Northstar returns
one plan, shows why each item was selected, places it in editable 2D, mirrors the
accepted coordinates in 3D and itemises the complete recorded cost. Lowering the
ceiling makes the previous plan need review; the recheck rejects an over-height
rack with the recorded measurements instead of quietly replacing them.

### B. Upgrade existing equipment

The customer selects their rack and asks for a dip attachment. Northstar checks
the specific host, generation and governed relationship. An approved attachment
can be added; an adapter-dependent option names and prices the required adapter;
a dimensionally similar but unapproved option remains clearly unapproved. The
customer can then check the revised footprint and operating area in the same room
plan rather than treating compatibility as the end of the decision.

## 5. Honest Claim and Limitation Matrix

| Claim area | Evidence available | Permitted wording | Do not claim | Limitation |
|---|---|---|---|---|
| Working prototype | Type check, production build, 28 unit/API tests and 7 Chromium E2E tests passed locally | Locally validated working prototype | Production-ready or publicly available | No public v2 deployment has been validated |
| Customer journeys | Both journeys covered by local E2E tests | Supports new-space and equipment-upgrade journeys locally | Proven easy for customers | No completed customer usability study |
| Room planning | Deterministic geometry, rejected-placement and lock/regeneration tests; nonblank 2D/3D checks | Checks recorded room geometry and encoded clearances | Safe installation, safe use or guaranteed real-world fit | Depends on customer measurements and governed geometry |
| Compatibility | Five-state deterministic engine and test fixtures | Reports governed compatibility state and exact recorded reasons | Universal cross-brand compatibility or certification | Coverage is limited to governed prototype relationships |
| Budget and quote | Integer-cent engine, exact overrun consent and quote tests | Produces an itemised prototype quote from recorded fictional prices | Real offer, final payable price or complete delivery charge | Catalogue, prices and commercial terms are fictional |
| Catalogue governance | Forty variants, fourteen relationships and 11 Sheet-ready tabs round-trip locally | Uses a governed, Sheet-ready catalogue structure | Live Sheet connection has been observed | Public v2 Sheet refresh is deferred |
| Conversation | Mara fallback and Responses orchestration are implemented; local conversation scenarios pass | Provides guided conversation, including a deterministic no-key fallback | Fresh-key OpenAI behaviour has been validated | Live OpenAI smoke test is deferred |
| Visualisation | Editable Konva 2D and derived Three.js 3D passed local browser and pixel checks | Shows accepted placements in connected 2D and 3D views | Photorealistic render or editable 3D | 3D is simplified and read-only |
| Accessibility | Keyboard alternatives, responsive E2E coverage and no serious/critical Axe findings in tested flows | Designed with non-drag controls and locally checked responsive flows | Fully WCAG-conformant or accessible to everyone | Formal audit and broader assistive-technology testing not completed |
| Commercial value | Product concept and retailer narrative | Demonstrates how guided planning could reduce customer uncertainty | Improved conversion, fewer returns, traction or retailer demand | No commercial experiment has yet run |

## 6. Modest Validation Experiment

Run six moderated prototype sessions after the deferred external checks: three
people planning a first home gym and three experienced owners considering an
upgrade. Give each person one realistic room, goal and budget task, then one
deliberate conflict such as insufficient ceiling height or an unapproved
attachment pairing.

Measure:

- task completion without facilitator correction;
- whether the participant can state why the final plan fits or fails;
- whether they correctly distinguish approved, conditional and unapproved
  compatibility;
- whether they notice the full cost and any unknown charge;
- time to first valid plan and number of corrected inputs;
- confidence before and after the task on a five-point scale.

Ask: `What did you trust least?`, `What was difficult to change?`, `Which reason
helped you decide?`, and `What would you still verify before buying?`

Use only anonymous session-level events for the experiment: journey selected,
requirements completed, recommendation requested, validation failed by reason,
plan generated, placement edited/rejected, compatibility state viewed, overrun
consent accepted/declined, quote viewed and plan completed. Do not record message
content, names or room addresses. This experiment validates comprehension and
workflow interest, not conversion or return reduction.

## 7. Launch Risks and Deferred Proof

- The v2 application is not deployed or pushed as a validated release.
- A public v2 Google Sheet refresh and controlled changed-value check are pending.
- The OpenAI Responses path has not been smoke-tested with a fresh key.
- Plans are anonymous and in memory; they do not survive a server restart.
- Product names, prices, stock and commercial terms are fictional prototype data.
- The 600 mm circulation buffer is a labelled Northstar planning assumption.
- The product does not certify structural suitability, installation or exercise
  safety.
- The launch catalogue cannot support universal third-party compatibility.
- Local automated checks do not replace customer usability or a formal
  accessibility audit.

## 8. Traceability

| Communication element | Validated basis |
|---|---|
| Conversational planning with Mara | Design sections 2 and 6; build handoff lines 27-42 |
| New-space and upgrade stories | Research traceability; design sections 8-9; local E2E result |
| Fit and compatibility language | Founder sections 7-10; research decisions R-004/R-007/R-019; deterministic test results |
| Editable 2D and derived 3D | Design sections 12-13; decisions D-004/M-007; browser and pixel checks |
| Quote and budget wording | Decisions R-014/R-017/D-008/M-004; API and E2E validation |
| Deferred live claims | Build handoff sections 3 and 8; decision M-008 |

## READY FOR MANAGER REVIEW

The Communicator gate passes. The positioning represents both audiences, both
journeys and the locally validated product without converting the planner into a
landing page. Claims are tied to functioning local evidence, while live Sheet,
fresh-key OpenAI and deployment validation remain explicitly deferred.
