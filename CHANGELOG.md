# Changelog

## 1.3.0 — 2026-10-11

- Reject malformed regular expressions, invalid calendar dates/times and equal or reversed effective message/date bounds before API access, including direct core and batch entry points.
- Preserve message-ID precedence and validate mixed ID/date bounds without silently dropping a filter.
- Validate archive JSON structure, channel keys and labels before updating targets; refuse active-run imports and discard stale asynchronous reads.
- Add final run summaries and an anonymous JSON export with outcome, duration, aggregate counts and run errors. Count confirmed deletion, ignored messages, failed messages and already-gone messages separately; accumulate all batch jobs and deduplicate repeated encounters.
- Keep account tokens, target IDs, message contents, archive labels and exception payloads out of exported reports. Release temporary report ID tracking after completion.
- Rebuild the shared userscript and both browser packages at the same version.

Validation: `npm run check` passed lint, 23 mocked unit tests, metadata/license/syntax checks, matching runtime hashes and deterministic packages. Native extension fixtures passed all nine scenario groups in Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 154.1.98.28, including filter blocking, atomic/stale imports, export privacy, cancellation and stopping. The userscript Chrome fixture passed 21 interaction checks, keyboard controls, dragging/resizing and four viewport/theme checks. All API responses were simulated; Edge, live Discord and store/signed updates were not validated.

## 1.2.1 — 2026-10-11

- Publish Wipecord's first GitHub release with the userscript and Chromium/Firefox packages.
- Use the standard Wipecord name in browser manifests and remove prerelease labeling from the popup, installation guides and maintenance rules.
- Keep the userscript as the primary installation and the extensions as supported alternatives sharing its exact generated engine.
- Add a release download link and record the maintainer's report of successful extension use separately from automated validation.

Validation: clean `npm ci` and `npm run check` passed, including 17 mocked unit tests, metadata/license/syntax, matching shared-runtime hashes, minimal permissions, ZIP contents and deterministic rebuilds. Native extension integration passed all seven scenario groups in Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 154.1.98.28 (Chromium 154.0.8037.58), with temporary profiles and simulated API responses. The maintainer reported successful extension use before this release. No additional live Discord deletion was performed by the release process; Edge, Brave stable, minimum browser versions and store/signed installation remain untested.

## 1.2.0 — 2026-10-11

- Add Manifest V3 packages and unpacked folders for Chromium and Firefox; keep the userscript as the primary installation.
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
