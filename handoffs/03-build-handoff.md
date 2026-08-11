# Blue Maker Build Handoff

**Stage:** 3 - Build  
**Input implemented:** `handoffs/02-solution-design.md`  
**Product:** Northstar Rack Upgrade Advisor  
**Posture:** Working deployable prototype with corrected live Google Sheet integration verified; no deployment performed.

## 1. What was built

A structured-first same-brand Rack Upgrade Advisor for the clearly fictional **Northstar Demonstration Equipment** ecosystem. The customer selects an exact rack record, height, registry-required configuration, and upgrade category. The app then creates a revisable, print-ready Upgrade Decision Sheet containing every in-scope attachment outcome, its deterministic evidence state, conditions, readiness, provenance, compatibility freshness, and separately dated commerce status.

Implemented customer-visible behavior includes:

- all four states: manufacturer-confirmed, condition-dependent, known incompatible, and unknown/review required;
- three-state condition answers (`met`, `not_met`, `not_sure`) that change readiness and purchase gating without changing evidence state;
- explicit stale, contradictory, malformed, missing-pairing, cross-brand, unresolved-identity, source-unavailable, AI-unavailable, and response-verification failure behavior;
- Edit rack, Edit upgrade type, Retry, evidence disclosures, bounded Decision Guide, and browser print/save;
- no account, photo, room, health, training, address, checkout, broad recommendation, or dimension-based inference.

## 2. Architecture and data flow

The stack is dependency-free Node.js 20 plus semantic HTML, CSS, and browser JavaScript.

1. The static frontend in `public/` calls the backend only. No secret or registry URL is placed in the browser.
2. `GET /api/options`, `POST /api/decision`, and every `POST /api/guide` call invokes `fetchRegistry` at request time.
3. `fetchRegistry` requires `REGISTRY_CSV_URL`, adds a unique request nonce, sends `cache: no-store` plus no-cache headers, parses the returned CSV, and never reads a local catalogue.
4. The deterministic engine resolves one exact active rack, validates declared configuration, evaluates every attachment, lowers unsafe records to unknown, joins commerce separately, derives readiness, and gates product handoffs.
5. The Decision Guide performs a fresh registry read before any answer. For allowed questions, the Responses API is given one strict, read-only `read_live_registry` function tool whose output is the minimum validated context. The second response uses a strict JSON schema.
6. The backend verifies every AI record reference, source reference, action, URL, and prohibited confidence phrase. Invalid output is discarded. AI has no mutation route to registry records, status, condition answers, commerce, readiness, or purchase gating.
7. API responses use `no-store`; CORS is restricted by `ALLOWED_ORIGINS`. `GET /api/health` reports configuration without fetching or exposing secrets.

## 3. Files created or changed

- `package.json`, `.gitignore`, `.env.example`, `render.yaml`
- `README.md`
- `server.mjs`
- `src/csv.mjs`
- `src/registry.mjs`
- `src/decision-engine.mjs`
- `src/decision-guide.mjs`
- `public/index.html`
- `public/styles.css`
- `public/app.js`
- `public/config.js`
- `registry-template/northstar-registry.csv`
- `registry-template/SCHEMA.md`
- `test/decision-engine.test.mjs`
- `test/decision-guide.test.mjs`
- test/server.test.mjs
- test/registry-contract.test.mjs
- evidence/problem-log.md and evidence/handoff-log.md
- `handoffs/03-build-handoff.md`

No file in the prior Atlantic Coast Tours project was modified.

## 4. Runtime configuration and secret handling

Required backend variables:

| Variable | Requirement |
| --- | --- |
| `REGISTRY_CSV_URL` | Required. Published read-only CSV URL for the controlled external registry. The app fails closed when absent or unreachable. |
| `OPENAI_MODEL` | Optional; defaults to `gpt-5-mini`. |
| `ALLOWED_ORIGINS` | Comma-separated static frontend origins permitted by CORS. |
| `PORT` | Optional; defaults to `5173`. Render supplies this in deployment. |

For a GitHub Pages frontend, set window.RACK_ADVISOR_API_BASE in public/config.js to the deployed backend URL. Decision Guide secret configuration remains backend-only and is outside this integration follow-up. .env is ignored by Git.

## 5. How to run and test locally

Use Node 20 or later. Run npm test, set REGISTRY_CSV_URL to the public CSV endpoint below, then run npm start:

    https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521

Open http://localhost:5173. The backend reads the corrected public CSV endpoint afresh. The governed Sheet is available at https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/edit; the application does not use that edit URL and does not use registry-template/northstar-registry.csv as a runtime fallback.
## 6. Test results

Final command: npm test

Result on 11 August 2026: **18 tests passed, 0 failed** using Node v24.16.0 and the built-in Node test runner. The original 15 engine, Guide, source-failure, cache-bypass, and endpoint tests remain green. Three focused live-source contract regressions now additionally prove:

- both commerce rows map exact attachment, price, currency, stock, source, and update fields while adjacent non-commerce columns remain empty;
- all three definitions map exact IDs, labels, and text through the options response while adjacent commerce columns remain empty;
- source, verification, review, and commerce dates remain ISO text and are not spreadsheet serial numbers.

Supplied Playwright verification passed at desktop width 1440 and mobile width 390. Both rendered eight results and all four evidence states with no console errors or horizontal overflow. Evidence is stored in evidence/ui-desktop.png, evidence/ui-desktop-viewport.jpg, evidence/ui-mobile.png, and evidence/ui-mobile-viewport.jpg.
## 7. Live-data verification procedure and result

The controlled registry is live at:

- Sheet editor: https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/edit
- Public CSV: https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521

A fresh no-cache request returned HTTP 200 after repair. Live options and decision checks returned the expected three definitions, ISO provenance dates, commerce fields, eight results, and all four evidence states. The existing controlled-change test still proves that changing an external relationship changes the next decision without rebuilding or restarting the app.

Integration incident: the initial Sheet import shifted both commerce rows one column right and all three definition rows one column left. Google Sheets also coerced ISO date cells into serials. The five rows were realigned and date cells rewritten as plain text. The incident, impact, repair, and prevention are recorded in evidence/problem-log.md.
## 8. Deployment procedure and URL

No deployment was approved or performed, so there is no public URL.

After approval:

1. Deploy this directory as a Render Node service using `render.yaml`.
2. Configure the runtime variables from section 4.
3. Publish `public/` through GitHub Pages and point `public/config.js` to the Render URL.
4. Add the Pages origin to `ALLOWED_ORIGINS`.
5. Run the demonstration sequence in section 10 against the published Sheet, then record the public URLs and timestamps.

## 9. Known limitations, risks, and deferred work

- The live Google Sheet boundary, deterministic options/decision flow, and responsive UI are verified. Generated Decision Guide output was not exercised in this follow-up; its unavailable and validation paths remain covered by automated tests.
- The provided evidence and product URLs use reserved .invalid domains because every record is fictional. Replace them only with authorized exact-record destinations in a partner deployment.
- Commerce is illustrative and considered current for seven days; this window is an implementation setting, not compatibility evidence.
- No registry administration UI exists. CSV governance remains a controlled owner process as approved.
- Google Sheets can shift sparse CSV rows or coerce ISO values during import. The new source-contract tests and plain-text date requirement reduce this risk but do not replace registry-owner review.
- The strict response validator can reject suspicious AI output but cannot mathematically prove every natural-language paraphrase. The small supplied context, fixed schema, source/reference allowlists, prohibited-language checks, and fail-closed UI reduce this risk.

**Current gate status:** Stage 3 Maker evidence is refreshed and ready for Purple Manager review. The Maker does not self-pass the Build gate. No deployment was performed or approved.
## 10. Communicator handoff

### Verified capabilities

- Exact rack selection changes deterministic outcomes.
- The Atlas V2 fixture shows all four evidence states in one sheet.
- Conditions change readiness and handoff visibility while status remains condition-dependent.
- Stale, contradictory, malformed, missing, and cross-brand evidence fail closed.
- A changed external row changes the next result without an application rebuild.
- Registry failure suppresses current claims; AI failure leaves the deterministic sheet unchanged.
- Compatibility and commerce dates are separate.
- Every result is traceable to a governed relationship or a named degradation rule.

### Customer-visible limitations

- This is fictional demonstration data, not real equipment advice.
- It covers one same-brand ecosystem only.
- It does not assess installation, anchoring, structural capacity, floors, room clearance, exercise safety, or cross-brand fit.
- Unknown means the current evidence cannot support a claim; it does not mean incompatible.
- AI explanations are optional and may be unavailable while the deterministic sheet remains usable.

### Prohibited claims

Do not claim that the prototype proves real product compatibility, safety, retailer partnership, return reduction, sales uplift, support reduction, complete catalogue coverage, cross-brand fit, or production readiness. Do not describe fictional prices, stock, sources, or products as real.

### Reproducible demonstration steps

1. Import and publish the supplied registry CSV, configure the backend, and open the advisor.
2. Select Atlas, Atlas Modular Rack V2, 220 cm, and a structured stabilisation value.
3. Show all upgrades and point out manufacturer-confirmed, condition-dependent, known incompatible, and unknown groups.
4. Set both Cable Tower conditions to `met`; show readiness and product handoff change while the evidence state remains condition-dependent.
5. Edit the rack to Atlas V1; show different outcomes and the visible revision note.
6. Open evidence details and distinguish source date, compatibility check, review due date, and commerce update.
7. Show the deliberate stale Plate Storage, contradictory Jammer Arms, malformed Storage Shelf, and cross-brand Rival records degrading to unknown.
8. Ask why Cable Tower is condition-dependent; show the fresh registry check time and unchanged deterministic status.
9. Ask for cross-brand fit; show the scope refusal.
10. Remove the AI key to show Guide unavailability without changing the sheet; make the registry unavailable to show complete fail-closed behavior and Retry.
11. Print/save the Decision Sheet and confirm identity, states, conditions, provenance, assessment time, and scope note are present.

