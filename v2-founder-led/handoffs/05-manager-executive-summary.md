# 05 - Manager Executive Summary

**Manager review date:** 2026-08-11  
**Scope:** Founder-led v2 only  
**Product status:** **LOCAL BUILD VALIDATED**  
**Full live/deployed status:** **NOT YET VALIDATED**

## 1. Executive Outcome

The founder-led pipeline produced **Northstar Space Planner**, a working local
prototype for planning a new home gym or checking upgrades for existing gym
equipment. It is materially more than a chat interface over catalogue data.
Mara provides the conversational route into one canonical plan, while typed
application services own product retrieval, room fit, attachment compatibility,
layout, budget consent and quote arithmetic.

The application includes:

- new-space and equipment-upgrade journeys;
- Mara, a customer-facing equipment-planning assistant;
- editable room, goal, experience, equipment and budget requirements;
- a governed 40-variant fictional Northstar catalogue;
- deterministic recommendation, geometry, five-state compatibility and quote
  engines;
- editable Konva 2D planning with lock, move, rotate, nudge and regeneration;
- a recognisable, read-only Three.js view derived from the same placements;
- exact over-budget consent and an itemised EUR quote;
- responsive desktop, tablet and mobile workflows; and
- explicit treatment of missing, conflicting, stale and unapproved information.

The founder's product outcomes and trust boundaries were retained. Research and
the downstream agents were allowed to select the strongest evidenced method of
implementation. The principal research-led interpretation was to make 2D the
precise editor and 3D a synchronised inspection view, preserving useful 3D while
avoiding an inaccessible or fragile second geometry authority.

## 2. Agent Chronology

1. **Researcher:** Read the founder charter, Deep Research dossier and 48-question
   register, then independently checked decisive claims against primary sources.
   It converted every question into a downstream field, policy, deterministic
   rule, tool contract, interface requirement, acceptance test or labelled
   assumption. The Research gate passed as `READY FOR DESIGN`.
2. **Designer:** Turned the accepted research into one complete product
   specification covering both journeys, Mara's conversation, canonical state,
   responsive workspace, evidence language, compatibility, quote behaviour,
   editable 2D, derived 3D, accessibility and recovery states. The Design gate
   passed as `READY FOR BUILD`.
3. **Maker:** Implemented the React/Vite client, Express/TypeScript server,
   deterministic domain engines, strict conversation tools, Sheet ingestion
   boundary, catalogue fixtures, 2D/3D views and automated tests. The bounded
   Maker gate is `LOCAL BUILD VALIDATED`; full live validation was deliberately
   withheld.
4. **Communicator:** Produced customer and retailer positioning, Mara's voice,
   customer-safe state copy, two demonstration narratives, an honest claim
   matrix and a modest usability experiment. The Communication gate passed as
   `READY FOR MANAGER REVIEW`.
5. **Manager:** Audited the charter-to-research-to-design-to-build trail at a
   practical level from handoffs 01-04 and the decision log. No broad tests or
   new research were rerun under the founder's reduced close-out scope.

## 3. Practical Traceability

The evidence trail is coherent:

- Founder requirements for conversation, live external data, deterministic fit
  and compatibility, editable planning, 3D and itemised quoting map to the
  Research traceability table and release scenarios.
- Research decisions `R-001` to `R-022` define the canonical state, evidence
  model, catalogue boundary, compatibility ontology, spatial rules, AI boundary,
  budget policy and accessible planner behaviour.
- Design decisions `D-001` to `D-011` convert those findings into the Mara
  experience, responsive workspace, trust vocabulary, 2D/3D contract and exact
  Maker acceptance criteria.
- Maker decisions `M-001` to `M-008` record the implemented stack, atomic Sheet
  candidate parsing, versioned plans, exact overrun consent, bounded Responses
  orchestration, hardening, QA evidence and withheld external gate.
- Communication decisions `C-001` and `C-002` restrict public claims to what the
  local build evidence supports.

Important authority choices include: the model interprets and explains but does
not decide factual validity; compatibility requires a governed relationship and
cannot be inferred from dimensions; money uses integer cents; unknown charges
are not represented as zero; invalid placement proposals do not corrupt the last
accepted plan; and geometry language never certifies installation or exercise
safety.

## 4. Local Validation Evidence

The Maker recorded the following successful results from
`v2-founder-led/app` on 2026-08-11:

| Check | Recorded result |
|---|---|
| TypeScript | `npm run check` passed |
| Unit and API tests | `npm test` passed, 28/28 tests |
| Focused API tests | 7/7 passed |
| Browser E2E | 7/7 Chromium tests passed |
| Production build | `npm run build` passed |
| Sheet fixture export | 11 CSV tabs exported |
| Catalogue validation | 40 variants and 14 relationships passed round-trip validation |
| Visual checks | Nonblank 2D and 3D canvas checks passed at tested desktop/mobile sizes |
| Accessibility smoke | No serious or critical Axe findings in the tested flows |

The recorded API coverage includes rejected placement protection, locked layout
regeneration, lock-state undo/redo, stale-write rejection, all compatibility
states and exact budget-overrun consent. E2E coverage includes both customer
journeys, responsive layouts, conversation capture and visible 2D/3D rendering.

This evidence supports **LOCAL BUILD VALIDATED**. It does not establish a live
catalogue connection, fresh-key model behaviour, public availability, production
readiness, commercial impact or complete accessibility conformance.

## 5. How to Run Locally

From `v2-founder-led/app`:

```powershell
npm install
npm run dev
```

The development client uses `http://localhost:5173` and proxies `/api` to the
local server on port `8787`. Without an OpenAI key, Mara uses the implemented
deterministic guided fallback.

For an optional local model smoke, place a fresh, undisclosed key in the local
environment as `OPENAI_API_KEY`. For the live catalogue boundary, configure
`GOOGLE_SHEET_ID` with a v2 workbook containing the exported 11-tab structure.
The included `.env.example` documents the expected settings. Secrets must not be
committed or displayed.

Useful bounded commands are:

```powershell
npm run check
npm test
npm run test:e2e
npm run build
npm run catalogue:export
npm run catalogue:validate
```

## 6. Explicitly Deferred External Proof

The founder authorised external services but later reduced the validation scope
to close the long-running build promptly. In accordance with that instruction:

- no new public v2 Google Sheet was populated and observed through a controlled
  changed-cell refresh;
- no fresh `OPENAI_API_KEY` was available for a real Responses API smoke test;
- v2 was not pushed as a validated release;
- the v2 frontend and backend were not deployed or publicly smoke-tested; and
- no external resource was changed during the bounded close-out.

Full `BUILD VALIDATED` and deployed-pipeline completion are therefore withheld.
These are release actions, not hidden local failures.

## 7. Limitations and Next Iteration

The prototype uses fictional products, prices, stock and commercial policies.
Plans and conversation state are anonymous and in memory, so server restarts
discard them. Third-party/manual equipment supports footprint planning but not
unsupported compatibility approval. The configurable 600 mm circulation buffer
is a labelled Northstar planning assumption. The Three.js view is simplified and
read-only, and the production build has a non-blocking bundle-size warning.

The next iteration should be deliberately small:

1. Upload the validated 11-tab export to a separate public v2 Sheet, configure
   `GOOGLE_SHEET_ID`, change one governed value and prove the resulting snapshot
   and answer update.
2. Load a fresh server-only OpenAI key and run one Responses conversation while
   verifying that deterministic validators remain authoritative.
3. Deploy the API and frontend, perform a short public desktop/mobile smoke and
   record the URLs and exact observed results.
4. Run the proposed six-person moderated study before making usability or
   commercial-value claims.
5. Optimise lazy 3D and application chunks only if public performance evidence
   shows the warning is material.

## 8. Scope Integrity and Final Status

Repository status shows only `v2-founder-led/` as new work. No tracked v1 file
was modified, and every specialist handoff states that v1 remained untouched.

The five-role founder-led process has produced its required research, design,
local build, communication and Manager synthesis artefacts. The correct final
status is:

> **FOUNDER-LED V2 LOCAL BUILD VALIDATED. LIVE SHEET, FRESH-KEY OPENAI AND PUBLIC
> DEPLOYMENT VALIDATION REMAIN PENDING.**

This is a successful bounded prototype close-out, not a claim of a fully
live-validated or production-complete release.
