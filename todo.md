# Project TODO

- [x] Build the single-page dark split-pane developer console layout.
- [x] Add secure masked API key input with persistent proxy-header injection.
- [x] Add generic endpoint library and custom URL selection.
- [x] Add request builder controls for method, path parameters, query parameters, and live JSON body editing.
- [x] Implement the Express backend proxy route with CORS-safe forwarding behavior.
- [x] Add mock webhook event selection, payload configuration, and trigger flow.
- [x] Add real-time JSON response viewer with syntax highlighting and collapsible tree inspection.
- [x] Add dual-layer timestamped request logs for browser calls and Express proxy calls with status and latency.
- [x] Apply the specified brutalist typography, geometric lines, high contrast, and restrained UI scope.
- [x] Add or update Vitest coverage for proxy and webhook behavior.
- [x] Run type checks, tests, and visual preview verification.
- [x] Refine responsive behavior and fix any discovered issues.

## History

- [x] Initial generic API playground scope recorded before refined requirements.
- [x] Refined brutalist single-page console requirements recorded.

## Notes

- Target API is generic/configurable because no specific SaaS provider was supplied.
- The application must not invent extra product features beyond the requested console functionality.
- API keys are handled as request configuration and are not persisted to the database.
- Webhook simulation is mock-only and does not post to an external production service.


- [x] Add dedicated path-parameter controls with placeholder substitution for selected endpoint routes.
- [x] Add a raw JSON response mode with syntax highlighting alongside the collapsible tree.
- [x] Add Vitest coverage for the Express proxy and webhook route contracts, including status and server-log fields.

- [x] Fix raw JSON token highlighting so injected markup is never re-tokenized.
- [x] Add focused validation for the raw JSON highlighter output.

- [x] Add configurable webhook signing secret and HMAC algorithm controls.
- [x] Add timestamped signature generation and verification using constant-time comparison.
- [x] Add visible signature header preview and verification pass/fail diagnostics.
- [x] Wire signed verification into the mock webhook route and dual-layer logs.
- [x] Add tests for valid, tampered, expired, and malformed webhook signatures.
- [x] Re-run typecheck, tests, smoke tests, and visual preview verification.

- [x] Add a dedicated read-only preview of the exact generated signature header before webhook execution.
- [x] Add a nearby summary of the configured algorithm, tolerance, and last verification result.

- [x] Keep the generated HMAC header visible at all times and show any manual override in a separate effective-header preview.

- [x] Add selectable webhook provider profiles with generic HMAC and Stripe-style formats.
- [x] Implement Stripe-style multi-signature generation with t, v1, and v0 fields.
- [x] Verify any valid v1 signature while retaining constant-time comparison and timestamp tolerance.
- [x] Add provider-aware header previews, effective-header behavior, and verification diagnostics.
- [x] Add tests for provider profiles, multi-signature headers, tampering, expiry, and generic-mode regression.
- [x] Re-run typecheck, tests, smoke tests, and visual preview verification.

- [x] Add provider-format reference content for generic HMAC and Stripe-style signatures.
- [x] Show canonical signing strings, header formats, and live active-profile examples.
- [x] Integrate and style the reference panel without disrupting the existing console layout.
- [x] Add or update tests and run typecheck, smoke tests, and visual preview verification.

- [x] Re-run a webhook smoke test after the provider reference-panel change and record the result.

- [x] Add one-click copy controls for canonical signing strings and header examples.
- [x] Add copied-state feedback and preserve active provider switching behavior.
- [x] Test and visually verify the copy-control update.

- [x] Handle unsupported or failed clipboard writes without showing false success feedback.
- [x] Add focused coverage for canonical/header copy actions, feedback reset, and provider switching regression.

- [x] Add directly testable reference-copy target and label logic for canonical/header actions.
- [x] Cover copied-state reset and retry-state transitions.
- [x] Cover provider switching with copy targets for generic and Stripe profiles.

- [x] Add deterministic tests for copy success reset and failed-write retry transitions.

- [x] Add a bounded recent webhook history list with payload, provider, signature, outcome, and timestamp.
- [x] Allow selecting a history entry to inspect its payload and signature details.
- [x] Add copy actions for historical generated and effective signatures.
- [x] Preserve existing request logs and verify history bounds, selection, copy behavior, typecheck, tests, and visual layout.

- [x] Add focused tests for historical generated/effective copy targets and COPIED/RETRY feedback behavior.
- [x] Re-run full verification after historical-copy coverage is added.

- [x] Add provider, event-type, and verification-outcome filter controls to webhook history.
- [x] Preserve bounded newest-first ordering, selection, and copy actions under filtering.
- [x] Show filtered result counts and test filter combinations plus responsive layout.

- [x] Persist bounded webhook history to browser local storage.
- [x] Persist provider, event-type, and verification filter preferences.
- [x] Restore valid saved state safely and ignore malformed or unavailable storage.
- [x] Test persistence helpers, restoration behavior, typecheck, and responsive layout.

- [x] Add a Clear History button for saved webhook history.
- [x] Require confirmation before wiping in-memory and local-storage history.
- [x] Preserve active filter preferences and reset selected history safely.
- [x] Test cancel/confirm behavior, storage clearing, typecheck, and responsive layout.

- [x] Add focused tests for Clear History cancel versus confirm outcomes, selection reset, and preserved filters.
- [x] Re-run mobile-width visual verification for the Clear History control and modal.

- [x] Add a directly testable modal decision helper covering cancel unchanged state and confirm clearing state.
- [x] Capture an explicit mobile-width preview with the confirmation modal open.

- [x] Add real-time JSON validation feedback to the webhook payload editor.
- [x] Add a safe auto-format control that normalizes valid JSON without overwriting invalid input.
- [x] Prevent malformed payloads from triggering signed webhook tests while preserving editor text.
- [x] Add parser/formatter tests and verify desktop and mobile editor layouts.

- [x] Extract line and column locations from webhook JSON parse errors.
- [x] Display line and column indicators alongside the invalid payload message.
- [x] Add single-line and multi-line parse-location tests and verify responsive layout.

- [x] Capture a mobile-width malformed payload preview showing the line and column diagnostic.

- [x] Add deterministic mock JSON templates for generic and Stripe-style provider profiles.
- [x] Generate valid formatted payloads for payment.succeeded, user.created, and order.updated events.
- [x] Add an explicit generator control that replaces the editor only on user action.
- [x] Add provider/event template tests and verify desktop and mobile layouts.

- [x] Add GitHub provider presets for push and pull_request events.
- [x] Add Slack provider presets for event_callback and url_verification events.
- [x] Add provider-specific payload/header reference data and integrate new generator profiles.
- [x] Add provider preset tests and verify desktop/mobile layout plus generic/Stripe regression.

- [x] Align Slack simulation, generated/effective previews, and reference headers to one explicit combined or separate-header contract.
- [x] Restrict or adapt the algorithm control and response metadata so GitHub and Slack accurately show SHA-256 usage.
- [x] Add focused tests for Slack header/reference accuracy and provider-specific algorithm metadata.

- [x] Add editable mock-template variables for amounts, IDs, timestamps, and provider-specific fields.
- [x] Add safe variable validation and visible reset/apply controls for mock generation.
- [x] Add randomize toggle with deterministic seed behavior and generated-value preview.
- [x] Preserve custom payloads until explicit generation and keep provider/event templates compatible.
- [x] Add comprehensive unit coverage for variable substitution, validation, randomization, and provider presets.
- [x] Verify desktop/mobile UX, typecheck, full tests, and save a checkpoint.

- [x] Add editable mock-template variables for amounts, IDs, timestamps, currencies, identity fields, and provider-specific fixture values.
- [x] Add variable validation, reset/apply controls, generated-value preview, and explicit custom-payload preservation.
- [x] Add randomize toggle with reproducible seed handling and persistent preference safety.
- [x] Add provider comparison view for side-by-side payload, canonical string, and header inspection.
- [x] Add webhook history date-range filtering with clear no-match states.
- [x] Add export-to-cURL for selected webhook history entries with safe shell quoting.
- [x] Add comprehensive unit coverage for variables, randomization, comparison, date filtering, and cURL export.

- [x] Add an explicit generated-value preview showing the exact variables that Generate Mock will apply.
- [x] Add a visible reproducible seed control and persist it safely with the randomize preference.
- [x] Add focused tests for comparison payload fallback and provider reference inputs.

- [x] Add named mock-variable presets for common payment, identity, GitHub, Slack, and edge-case scenarios.
- [x] Add quick-load preset controls with visible active preset state and custom-edit detection.
- [x] Persist the selected preset safely without overwriting user-edited variables unexpectedly.
- [x] Add focused preset definition, loading, validation, and persistence tests.
- [x] Verify desktop/mobile preset UX, typecheck, full tests, and save a checkpoint.
