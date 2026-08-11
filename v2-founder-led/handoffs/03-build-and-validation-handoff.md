# 03 - Build and Validation Handoff

## Gate Status

**LOCAL BUILD VALIDATED. FULL `BUILD VALIDATED` WITHHELD.**

The implemented v2 application passes the founder-bounded local gate: current
TypeScript check, complete unit/API suite, production build, and existing E2E
smoke suite. The Maker contract's full gate also requires observed live external
data. By founder instruction, no live Google Sheet, OpenAI, deployment, or further
optional validation was attempted in this close-out. Those items remain explicit
follow-up limitations.

## Inputs Read

- `founder-charter.md`
- `research-led-authority.md`
- `pipeline/run-config.md`
- `agents/maker.md`
- `handoffs/01-research-implementation-brief.md`
- `handoffs/02-solution-design-specification.md`
- `evidence/decision-log.md`
- `handoffs/README.md`

## Built Artefact

`app/` contains the usable Northstar Space Planner:

- React 19 and Vite customer application with Mara conversation, editable
  requirements, persistent in-session plan, itemised quote, and both new-space
  and equipment-upgrade journeys.
- Express and TypeScript server with Zod request/contracts, optimistic plan
  versions, bounded undo/redo, customer-safe errors, rate/body limits, same-origin
  CORS by default, and baseline security headers.
- One typed canonical `PlanState` shared by chat, controls, quote, Konva 2D, and
  derived Three.js 3D.
- Deterministic search, recommendation, five-state compatibility, room geometry,
  locked layout regeneration, rejected-placement preview, and integer-cent quote
  engines.
- OpenAI Responses orchestration with nine strict server-side function tools,
  bounded history/tool loops, timeout/retry limits, customer-language guard, and
  a deterministic guided fallback when no server key is present.
- Governed seed catalogue plus an atomic 11-tab public Google Sheets ingestion
  boundary with schema validation, snapshot IDs, freshness, retry, and
  last-known-valid retention.

Primary implementation paths:

- Contracts: `app/shared/types.ts`
- HTTP/API: `app/server/app.ts`
- Catalogue: `app/server/catalogue/`
- Conversation: `app/server/conversation/`
- Deterministic engines: `app/server/domain/`
- Customer application: `app/src/`
- Tests: `app/tests/`

## Data and Tool Contracts

The Sheet-ready catalogue export is in `app/data/sheets-export/` and contains 11
tabs: Products, Variants, Geometry, Clearances, RackInterfaces, Compatibility,
PricesStock, TrainingTags, Evidence, Sources, and ValidationLists. Validation
round-tripped 40 variants and 14 compatibility relationships.

Mara's strict tools are: `get_plan_state`, `get_next_required_fields`,
`update_customer_requirements`, `search_live_catalogue`, `compare_products`,
`check_attachment_compatibility`, `check_room_fit`, `generate_room_layout`, and
`calculate_itemised_quote`. Model prose cannot override deterministic results.

## Bounded Validation Results

All commands ran from `v2-founder-led/app` on 2026-08-11.

| Command | Exact result |
|---|---|
| `npm run check` | PASS, exit 0; `tsc -b --pretty false` |
| `npm test` | PASS, exit 0; 4 files, 28/28 tests: compatibility 5, catalogue 7, domain 9, API 7 |
| `npx vitest run tests/api.test.ts` | PASS, exit 0; 7/7 focused API tests |
| `npm run test:e2e` | PASS, exit 0; 7/7 Chromium tests in 10.1 seconds |
| `npm run build` | PASS, exit 0; 1,727 modules transformed in 3.47 seconds |
| `npm run catalogue:export` | PASS; wrote 11 Sheet-ready CSV tabs |
| `npm run catalogue:validate` | PASS; 11 tabs, 40 variants, 14 relationships |

The API suite specifically covers rejected placements without canonical-state
corruption, locked placement regeneration, lock-state undo/redo, exact budget
overrun consent, stale-write rejection, five-state compatibility, multi-fact
conversation capture, and same-origin/security headers.

The E2E suite covers both customer journeys, exact budget consent, Mara's
single-message mobile capture, desktop/tablet/mobile layouts, nonblank 2D and 3D
canvas pixel checks, and no serious or critical Axe findings.

The production build emitted one non-blocking warning: the lazy Three.js chunk
is 504.90 kB and the main JavaScript chunk is 568.75 kB before gzip. A brief
production server smoke returned HTTP 200 for `/` and `/api/health`, served the
built Northstar page, and confirmed the final response headers.

## Visual Evidence

Versionable screenshots are in `app/evidence/qa/`:

- `desktop-initial-1280x800.png`
- `desktop-plan-1440x900.png`
- `desktop-quote-1440x900.png`
- `desktop-3d-1440x900.png`
- `desktop-upgrade-compatibility-1440x900.png`
- `desktop-exact-budget-consent-1440x900.png`
- `tablet-plan-768x1024.png`
- `mobile-room-360x800.png`
- `mobile-plan-360x800.png`

The exact-consent screenshot shows the EUR 1,590 package, EUR 1,090 shortfall,
recorded exception, editable 2D plan, and unclipped quote at 1440 x 900.

## Decisions and Changes

Maker decisions `M-001` through `M-008` were appended to
`evidence/decision-log.md`. They record the stack, atomic Sheet boundary,
in-memory versioned plans, exact overrun consent, bounded Responses integration,
server hardening, versionable evidence, and the withheld external gate.

All implementation, tests, fixtures, screenshots, and documentation are confined
to `v2-founder-led/`. Completed v1 files were not altered.

## Deployment and Follow-Up Limitations

- Deployment state: not deployed, not pushed, and no external resource changed in
  this bounded close-out.
- Live Sheet proof: pending. Upload the 11 CSV tabs to a new public v2 workbook,
  set server-only `GOOGLE_SHEET_ID`, refresh, and verify a `sheet-` snapshot and a
  controlled changed-cell query. Do not reuse or alter the completed v1 registry.
- OpenAI proof: pending. No fresh `OPENAI_API_KEY` was present. With a fresh
  noncommitted server key, run one conversation and verify the API reports the
  `responses` service while deterministic validators retain authority.
- Plans and chat history are anonymous in-memory prototype state and do not
  survive a server restart.
- 3D is a derived, read-only spatial inspection surface; precise editing remains
  in 2D and equivalent DOM controls.
- The bundle-size warning is a performance follow-up, not a functional failure.

## Next-Role Constraints

The Communicator and Manager must not claim that v2 is deployed, that its Sheet
connection has been observed live, or that its OpenAI path has been smoke-tested.
They may describe the locally validated prototype, governed fixtures,
deterministic validation, and guided no-key fallback. Fit means fit against
recorded geometry and encoded clearances; it is not installation or exercise
safety certification. Prices and catalogue records are fictional prototype data.

**Precise gate: LOCAL BUILD VALIDATED; external live-Sheet and fresh-key OpenAI
proof remain pending by explicit founder scope reduction.**
