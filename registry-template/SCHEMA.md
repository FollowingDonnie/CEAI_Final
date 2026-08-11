# Northstar Registry Import Schema

`northstar-registry.csv` is a ready-to-import, deliberately fictional registry. Import it into one Google Sheet tab, publish that tab as CSV, and set its published URL as `REGISTRY_CSV_URL` on the backend.

The single-table format uses `record_type` to distinguish `rack`, `attachment`, `relationship`, `commerce`, and `definition` rows. Columns that do not apply to a row type remain empty.

## Required row fields

### `rack`

`ecosystem_id`, `rack_family_id`, `rack_version_id`, `display_name`, `height_variant`, `configuration_schema_json`, `identification_clues_json`, `active`.

### `attachment`

`ecosystem_id`, `attachment_id`, `sku`, `display_name`, `category_id`, `product_url`, `active`.

### `relationship`

`ecosystem_id`, `rack_version_id`, `attachment_id`, `relationship_id`, `evidence_state`, `rationale`, `conditions_json`, `limitations_json`, `evidence_source_title`, `evidence_source_url`, `source_date`, `last_verified_at`, `review_due_at`, `reviewer`, `record_status`.

Allowed evidence values are `manufacturer_confirmed`, `known_incompatible`, `condition_dependent`, and `unknown_review_required`. Allowed record statuses are `approved`, `pending`, and `retired`.

### `commerce`

`attachment_id` is required. `price`, `currency`, `stock_state`, `commerce_source`, and `commerce_updated_at` are optional but must be complete and current before the UI treats commerce as current.

### `definition`

`definition_id`, `definition_label`, and `definition_text`.

## JSON cell shapes

`configuration_schema_json`, `identification_clues_json`, `conditions_json`, and `limitations_json` must contain valid JSON arrays. The import file demonstrates each shape. Do not allow spreadsheet formula output in governed identifier, URL, state, or JSON columns.

## Governance

- Keep exactly one current approved relationship for each exact rack/attachment pair.
- Use ISO 8601 dates and UTC datetimes.
- Use an exact evidence URL, not a generic home page.
- Review stale, pending, malformed, or contradictory records before expecting a positive state.
- Publish read-only CSV access. The application has no write path.
