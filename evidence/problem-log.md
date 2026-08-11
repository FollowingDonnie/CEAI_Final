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

