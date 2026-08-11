# Blue Maker Build Handoff

**Stage:** 3 - Build  
**Input implemented:** `handoffs/02-solution-design.md`  
**Product:** Northstar Rack Upgrade Advisor  
**Posture:** Public prototype deployed and verified; Maker evidence ready for Purple Manager Build gate review.

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
7. API responses use no-store; CORS is restricted by ALLOWED_ORIGINS. Preflight permits Content-Type and Cache-Control defensively, while the frontend sends Content-Type only for requests with bodies. GET /api/health reports configuration without exposing secrets.

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

Final deployment result: **19 tests passed, 0 failed**. The original 18 engine, Guide, live-source contract, failure, cache-bypass, and endpoint tests remain green. The added CORS regression proves that an OPTIONS preflight from the deployed frontend origin permits the request headers used by the application.

Public Playwright verification passed at desktop width 1440 and mobile width 390. Both rendered eight results and all four evidence states with no console errors, page errors, or horizontal overflow. The real Decision Guide returned a customer-facing answer. Its customer-language guard rejected internal field names, record IDs, and machine states; the visible answer contained none of those internal terms.

Public evidence:

- evidence/live-desktop-guide.png
- evidence/live-mobile.png
- evidence/live-diagnostic.png
- evidence/ui-desktop.png
- evidence/ui-desktop-viewport.jpg
- evidence/ui-mobile.png
- evidence/ui-mobile-viewport.jpg
## 7. Live-data verification procedure and result

The controlled registry is live at:

- Sheet editor: https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/edit
- Public CSV: https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521

A fresh no-cache request returned HTTP 200 after repair. Live options and decision checks returned the expected three definitions, ISO provenance dates, commerce fields, eight results, and all four evidence states. The existing controlled-change test still proves that changing an external relationship changes the next decision without rebuilding or restarting the app.

Integration incident: the initial Sheet import shifted both commerce rows one column right and all three definition rows one column left. Google Sheets also coerced ISO date cells into serials. The five rows were realigned and date cells rewritten as plain text. The incident, impact, repair, and prevention are recorded in evidence/problem-log.md.
## 8. Deployment procedure and URL

The approved public prototype is deployed:

- Frontend: https://followingdonnie.github.io/CEAI_Final/
- Backend: https://northstar-rack-advisor-api.onrender.com
- Repository: https://github.com/FollowingDonnie/CEAI_Final

The GitHub Pages frontend calls the Render backend, which retrieves the controlled Google Sheet CSV at request time. Public desktop and mobile runs verified the deterministic flow and bounded Decision Guide after the CORS repair. This follow-up documents the completed deployment; it did not change product code or perform another deployment.
## 9. Known limitations, risks, and deferred work

- The public Google Sheet boundary, deterministic options/decision flow, responsive UI, and real Decision Guide answer are verified.
- The provided evidence and product URLs use reserved .invalid domains because every product record is fictional. They are not real purchase destinations.
- Commerce is illustrative and considered current for seven days; this window is an implementation setting, not compatibility evidence.
- No registry administration UI exists. CSV governance remains a controlled owner process as approved.
- Google Sheets can shift sparse CSV rows or coerce ISO values during import. Source-contract tests and the plain-text date requirement reduce this risk but do not replace registry-owner review.
- Cross-origin request headers must remain synchronized with the backend preflight allowlist. The deployed frontend now omits unnecessary Cache-Control and sends Content-Type only with bodies; the backend permits both headers defensively, and a regression test covers the deployed preflight shape.
- The customer-language guard rejects internal field names, record IDs, and machine-state labels, but customer-visible Guide language should remain part of future browser regression review.

**Current gate status:** Maker deployment evidence is complete and ready for Purple Manager Build gate review. The Maker does not self-pass the Build gate.
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
- The public GitHub Pages frontend and Render backend complete the live flow across origins.
- The real Guide answer passed the customer-language guard without exposing internal field names, record IDs, or machine states.

### Customer-visible limitations

- This is fictional demonstration data, not real equipment advice.
- It covers one same-brand ecosystem only.
- It does not assess installation, anchoring, structural capacity, floors, room clearance, exercise safety, or cross-brand fit.
- Unknown means the current evidence cannot support a claim; it does not mean incompatible.
- AI explanations are optional and may be unavailable while the deterministic sheet remains usable.

### Prohibited claims

Do not claim that the prototype proves real product compatibility, safety, retailer partnership, return reduction, sales uplift, support reduction, complete catalogue coverage, cross-brand fit, or production readiness. Do not describe fictional prices, stock, sources, or products as real.

### Reproducible demonstration steps

1. Open https://followingdonnie.github.io/CEAI_Final/.
2. Select Atlas, Atlas Modular Rack V2, 220 cm, and a structured stabilisation value.
3. Show all upgrades and point out eight results across manufacturer-confirmed, condition-dependent, known incompatible, and unknown groups.
4. Set both Cable Tower conditions to met; show readiness and product handoff change while the evidence state remains condition-dependent.
5. Edit the rack to Atlas V1; show different outcomes and the visible revision note.
6. Open evidence details and distinguish source date, compatibility check, review due date, and commerce update.
7. Ask why Cable Tower is condition-dependent; show the real customer-facing Guide answer and unchanged deterministic status.
8. Ask for cross-brand fit; show the scope refusal.
9. Confirm the browser console has no CORS or page errors and the page has no horizontal overflow at desktop and mobile widths.
10. Print/save the Decision Sheet and confirm identity, states, conditions, provenance, assessment time, and scope note are present.