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
