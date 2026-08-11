# Northstar Rack Upgrade Advisor

A structured-first, same-brand rack upgrade advisor for the clearly fictional **Northstar Demonstration Equipment** ecosystem. The deterministic engine produces a revisable Upgrade Decision Sheet from a live external CSV registry. A bounded OpenAI Decision Guide may explain the current validated sheet but cannot change it.

## Architecture

- `public/`: dependency-free static frontend suitable for GitHub Pages.
- `server.mjs`: Node 20 HTTP API and static server suitable for Render.
- `src/registry.mjs`: fresh external CSV retrieval with cache bypass and no local fallback.
- `src/decision-engine.mjs`: deterministic validation, four evidence states, readiness, and purchase gating.
- `src/decision-guide.mjs`: read-only registry tool, Responses API orchestration, strict response shape, and reference validation.
- `registry-template/`: fictional Google Sheet import file and exact schema. Production code never reads this directory.
- `test/`: focused engine, live-change, failure, guide, and endpoint tests.

## Configure

The controlled live registry is now available at:

- [Google Sheet editor](https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/edit)
- [Public read-only CSV endpoint](https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521)

Set the backend source and allowed frontend origins:

```text
REGISTRY_CSV_URL=https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521
OPENAI_MODEL=gpt-5-mini
ALLOWED_ORIGINS=http://localhost:5173,https://your-pages-host.example
```

`REGISTRY_CSV_URL` is mandatory. Without it, or whenever its request fails, the advisor returns HTTP 503 and shows no current compatibility result. There is no embedded, cached, or file-backed runtime fallback. Decision Guide configuration is intentionally outside this live-source setup; when unavailable, the deterministic Decision Sheet remains usable and unchanged.

The application reads the public CSV endpoint, not the Sheet edit URL. Keep `source_date`, `last_verified_at`, `review_due_at`, and `commerce_updated_at` cells formatted as plain text so Google Sheets exports their ISO strings rather than spreadsheet serials. See [`registry-template/SCHEMA.md`](registry-template/SCHEMA.md) for the governed column contract.

For a local live-source run in PowerShell:

```powershell
$env:REGISTRY_CSV_URL="https://docs.google.com/spreadsheets/d/1SR78Cb75bBbrImALyUxHrwJCUy6SLJ9RDl0f4yvVTuE/export?format=csv&gid=453706521"
npm start
```

## Run And Test

```powershell
npm test
npm start
```

Open `http://localhost:5173`. The health endpoint is `GET /api/health`.

## Deploy After Approval

1. Create a Render Node web service from this directory using `render.yaml` or `npm start`.
2. Set `REGISTRY_CSV_URL`, `OPENAI_MODEL`, and `ALLOWED_ORIGINS` in Render. Configure the Decision Guide separately under the approved secret-handling process.
3. Publish the contents of `public/` with GitHub Pages.
4. Set `window.RACK_ADVISOR_API_BASE` in `public/config.js` to the Render service URL before publishing the static frontend.
5. Add the exact GitHub Pages origin to `ALLOWED_ORIGINS` and verify the complete flow.

No deployment, paid account, or external publication was performed during the Maker stage.
