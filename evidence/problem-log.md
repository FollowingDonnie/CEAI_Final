# Human and AI Build Problem Log

## Setup observations

- The Five Innovators lesson URL exposed only the signed-in application shell to a public web request, so the local Octopus templates and the founder-supplied tutorial prompt were used to inspect the orchestration pattern.
- The tutorial example treats the human as Manager of four AI specialists, while the assessment brief specifies five AI-agent roles including Manager. The project therefore implements the Manager as the fifth AI agent and retains the human as founder and approval authority.

## Live registry integration incident - 11 August 2026

- **Observed:** The first Google Sheet CSV export contained five column-alignment defects. Both `commerce` rows were shifted one column right, and all three `definition` rows were shifted one column left. Google Sheets also coerced ISO date and datetime cells into spreadsheet serial values during import.
- **Impact:** Commerce fields and registry definitions could be parsed under the wrong headers, while provenance and freshness values no longer preserved the governed source strings. This was a source-data defect, not a deterministic-engine status override.
- **Repair:** The five affected rows were realigned in the controlled Sheet. Date and datetime cells were rewritten and retained as plain text. The corrected public CSV now maps commerce to `attachment_id`, `price`, `currency`, `stock_state`, `commerce_source`, and `commerce_updated_at`; definitions map to `definition_id`, `definition_label`, and `definition_text`; provenance dates export as ISO text.
- **Verification:** The public CSV returned HTTP 200 and was inspected after repair. Live options and decisions returned the expected definitions, provenance dates, and commerce. Three focused source-contract tests now assert exact commerce fields plus adjacent blanks, exact definition IDs/labels/text plus adjacent blanks, and ISO date/datetime strings rather than numeric serials.
- **Prevention:** Keep governed date columns formatted as plain text, validate row alignment after Sheet import, and run `npm test` before accepting a registry revision.
## Public deployment CORS incident - 11 August 2026

- **Observed:** The deployed GitHub Pages frontend left rack selectors disabled. Browser diagnostics showed that the frontend request triggered an OPTIONS preflight because it sent Cache-Control, while the Render backend allowed only Content-Type.
- **Impact:** The live registry endpoint was healthy, but the browser blocked the options response at the cross-origin boundary, preventing customers from starting the structured flow.
- **Root cause:** Frontend and backend disagreed on the permitted request-header set. An unnecessary Cache-Control request header expanded the preflight requirements.
- **Repair:** The frontend now omits Cache-Control, sends Content-Type only when a request has a body, and relies on server response cache controls. The backend allows Content-Type and Cache-Control defensively for preflight compatibility.
- **Regression:** A focused CORS preflight test covers the deployed frontend origin and request headers. The full automated suite passes 19/19.
- **Public verification:** Playwright passed at desktop 1440 and mobile 390 with eight results, all four evidence states, no console or page errors, and no horizontal overflow. A real Guide answer passed the customer-language guard without exposing field names, record IDs, or machine states.
- **Evidence:** evidence/live-desktop-guide.png, evidence/live-mobile.png, and evidence/live-diagnostic.png.