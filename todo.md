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
