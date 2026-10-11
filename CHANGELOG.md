# Changelog

## 1.2.0 — 2026-10-11

- Add experimental Manifest V3 packages and unpacked folders for Chromium and Firefox; keep the userscript as the primary installation.
- Ship the production userscript byte-for-byte in both extensions, with locally generated icons, complete licensing, version/hash records and deterministic ZIPs.
- Add a black, white and green read-only popup with runtime status, duplicate notices and support links. Request only declarative access to existing Discord routes, with no extension API permissions or remote executable code.
- Coordinate compatible installations through a shared DOM claim and a non-queued Web Lock for deletion runs in tabs of the same origin. Preserve the interface, confirmation, filters, pacing and Stop behavior.
- Avoid logging complete core state at UI lifecycle transitions. Keep sensitive account/message data out of the extension status bridge.
- Document local installation, updates, unsigned Firefox limitations, store publication and shared-source maintenance rules. Include both browser ZIPs in future GitHub release automation.

Validation: `npm run check` passed lint, 17 mocked unit tests, userscript metadata/license/syntax checks, byte-identical engine hashes, minimal manifests, ZIP contents and deterministic rebuilding. The userscript Chrome fixture passed 21 interaction checks, keyboard controls, dragging/resizing and four viewport/theme checks. Native extension tests passed all seven scenario groups in Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 154.1.98.28 (Chromium 154.0.8037.58), using temporary profiles, loopback-only match patterns and simulated API responses. Both ZIPs also passed independent `unzip -t` integrity checks.

Not validated: Edge directly, Brave stable, minimum supported browser versions, live Discord authentication/DOM/CSP/API, every userscript manager, signed/store installations or real deletions. The Firefox popup's live status/links were checked, but its screenshot is unavailable through BiDi. Locks cover one origin, not different Discord subdomains, profiles or browsers. Legacy scripts loaded after the guarded runtime remain unsupported; disable old installations before testing. See [extension validation](docs/EXTENSION-VALIDATION.md).

## 1.1.1 — 2026-10-11

- Refine the interface with neutral black/white surfaces and green actions.
- Remove decorative step labels, section cards, duplicate logos and promotional copy.
- Reduce the header and simplify the idle activity view while preserving target settings and deletion controls.
- Align the icon palette and refresh its userscript URL.

Validation: lint, all 15 core tests, build and artifact checks passed. Local Chrome fixtures passed 21 interaction checks, keyboard controls, dragging/resizing and four viewport/theme checks. Live Discord validation has not been performed.

## 1.1.0 — 2026-10-11

- Redesign the panel with Wipecord branding, clearer target fields and a dedicated activity area.
- Collapse optional filters, ranges and advanced settings; add compact layouts and light-theme colors.
- Keep Stop visible, show disabled action states, and improve labels, focus indicators and keyboard-operable buttons.
- Link field help directly to the user guide; restore the activity placeholder when clearing an idle log.

Validation: lint, all 15 core tests, production build and artifact checks passed. Local Chrome fixtures passed 21 interaction checks, native keyboard controls, dragging/resizing and four viewport/theme checks. All API calls were mocked; live Discord validation has not been performed.

## 1.0.0 — 2026-10-11

- Establish Wipecord branding, maintainer links, original icon and independent versioning.
- Redesign the icon as a chat bubble being erased to represent message cleanup.
- Include the deletion engine and regression suite.
- Add source/artifact verification, CI, release automation and maintenance instructions.
- Update compatible build dependencies and remove inactive commit-hook tooling.

Validation: lint, all 15 tests, production build, artifact metadata/license/syntax checks and deterministic rebuild passed. Dependency audit reports zero vulnerabilities. Live Discord and userscript-manager checks have not been performed.
