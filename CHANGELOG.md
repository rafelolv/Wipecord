# Changelog

## 1.3.8 — 2026-10-13

- Remove live server-search percentages and full progress bars derived from an uncertain search estimate. Keep both panel and toolbar progress indeterminate throughout the active run, including pagination, settling retries and final sweeps.
- Show processed counts with explicit ongoing-search/history status. Label server totals as provisional estimates and remove the misleading zero remaining-time display; the final summary alone announces completion or another terminal outcome.
- Add a native regression where seven estimated matches are processed while the next search is pending, then four more are found. Check ongoing status, indeterminate bars, accessible Stop and an eleven-deletion final summary.
- Rebuild the userscript and both extension packages at version 1.3.8 without changing the deletion engine, filters, confirmations, request pacing or report schema.

Validation: `npm run check` passed lint, 30 mocked unit tests, metadata/license/syntax, matching runtime hashes and deterministic packaging. Mozilla validation reported zero errors, warnings and notices. The userscript Chrome fixture passed 28 interaction checks, keyboard controls, dragging/resizing and five viewport/theme checks. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all fifteen scenario groups, including the seven-estimated/eleven-actual progress regression. The active-search Brave preview was visually reviewed. All responses and messages were simulated; no real messages were deleted. Live Discord, Edge, minimum browser versions and signed/store updates remain unvalidated.

## 1.3.7 — 2026-10-13

- Request server searches with `cache: no-store` so the browser does not reuse HTTP-cached search responses.
- Recheck initially empty server searches up to three times with paced, interruptible settling pauses. Keep the same target/filter query and confirmation requirement when matches become available. Genuinely empty searches still finish after the retry bound; DM/group-DM history behavior remains unchanged.
- Reject malformed JSON, unexpected search envelopes and invalid message/channel identifiers before processing a successful HTTP response. End the affected target with an actionable error instead of silently treating the response as zero matches.
- Add regression coverage for two cleanups in one page session, new messages becoming searchable after an initial empty result, bounded retries, Stop during the pause, retained confirmation/filter constraints and malformed-response safety. Rebuild the userscript and both extensions from the same source.

Validation: `npm run check` passed lint, 30 mocked unit tests, metadata/license/syntax checks, matching shared-runtime hashes and deterministic packaging. Mozilla validation reported zero errors, warnings and notices. The Chrome userscript fixture passed 28 interaction checks, keyboard controls, dragging/resizing and five viewport/theme checks. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all fourteen scenario groups, including no-reload server search recovery, cache bypass, preserved confirmation/filters, retry cancellation and malformed-response handling. All messages and responses were simulated; no real messages were deleted. The maintainer's original live zero-result response was not captured, so its precise cause remains unconfirmed. Discord's server-side search availability beyond the bounded retry window, live API compatibility, Edge, minimum browser versions and signed/store updates remain unvalidated.

## 1.3.6 — 2026-10-13

- Promote running progress above the activity log, with processed counts and target position in larger text and timing/search estimates below. Keep private-history totals explicitly unknown and expose only aggregate batch position.
- Highlight confirmed deleted counts in the final summary, with outcome, ignored/failed/already-gone counts and duration on separate lines. Keep anonymous exports unchanged.
- Use green success logs, yellow warnings and red errors with theme-specific colors; log a confirmed deletion only after a successful response. Keep cancellation/stopping neutral.
- Shorten the all-server warning into a red heading and smaller explanation, retaining author/filter scope and the requirement to start and confirm.
- Move regular-expression patterns into collapsed Advanced settings. Keep target controls, basic filters and nested message-ID bounds intact; adjust narrow-screen space for the structured summary and progress.
- Rebuild the userscript and both extension packages at the same version. Keep these visual changes in a separate commit so they can be reverted without removing the earlier error improvements.

Validation: `npm run check` passed lint, 27 mocked unit tests, metadata/license/syntax, matching runtime hashes and deterministic packages. Mozilla validation reported zero errors, warnings and notices. The userscript Chrome fixture passed 28 interaction checks, keyboard controls, dragging/resizing and five viewport/theme checks. Desktop, compact and short-screen previews and a completed Brave summary were visually reviewed. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all thirteen scenario groups, including exact summary/export counts, formatted/redacted logs, error guidance, duplicate prevention, preserved filters, cancellation and stopping. The combined runner was interrupted before Firefox completed; the separate Firefox rerun passed. All API responses were simulated and no real messages were deleted. Live Discord, Edge, minimum browser versions and signed/store updates remain unvalidated.

## 1.3.5 — 2026-10-13

- Give request failures a plain-English explanation and next step for expired sessions, access/permission denial, unavailable targets, invalid requests, locked/system messages, service errors, timeouts and temporary blocks.
- Share the guidance between deletion, channel/history/search requests, thread reopening and server-list loading. Preserve existing skip, fatal-stop, retry, pacing and backoff decisions.
- Clarify bounded automatic retries, retry exhaustion and manual server-list retry. Replace token-copy instructions with session detection/sign-in guidance; stop presenting a guessed recovery time for temporary blocks.
- Keep numeric HTTP and Discord diagnostics without echoing API bodies, request exception payloads or a related message object into error logs. Keep formatting, redaction and the anonymous report schema unchanged.
- Expand troubleshooting documentation and regression coverage; rebuild the same generated engine into both extension packages.

Validation: `npm run check` passed lint, 27 mocked unit tests, metadata/license/syntax checks, matching shared-runtime hashes and deterministic packaging. Mozilla validation reported zero errors, warnings and notices. The Chrome userscript fixture passed 27 interaction checks, keyboard controls, dragging/resizing and five viewport/theme checks. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all thirteen scenario groups, including simulated error guidance, released controls, payload privacy, preserved filters, no automatic deletion, cancellation and stopping. No real messages were deleted. Live Discord, live rate limiting, Edge, minimum browser versions and signed/store updates remain unvalidated.

## 1.3.4 — 2026-10-11

- Increase the default panel width from 860 to 960 pixels and the settings sidebar from 310 to 350 pixels, giving target fields, scope warnings and activity logs more room. Keep the 700-pixel height and responsive viewport limits.
- Add an intermediate 800 × 720 viewport to the userscript layout checks, with the all-server warning visible.
- Include the 1.3.3 all-server scope warning and clearer outcome, cancellation, message-bound and automatic-pause text in this GitHub release; 1.3.3 was available on main without a separate release.
- Rebuild the userscript and both browser packages at version 1.3.4.

Validation: clean `npm ci` and `npm run check` passed lint, 23 mocked unit tests, metadata/license/syntax, matching runtime hashes and deterministic packaging. Mozilla validation reported zero errors, warnings and notices. The userscript Chrome fixture passed 27 interaction checks, keyboard controls, dragging/resizing and five viewport/theme checks. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 1.98.28 (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all twelve scenario groups. No real messages were deleted. Live Discord, Edge, minimum browser versions, AMO review and signed/store updates remain unvalidated.

## 1.3.3 — 2026-10-11

- Highlight the Server ID field and all-server button in red while a broad server selection is active. Show a persistent, accessible scope warning in both themes; reset it when returning to the current target or importing conversations.
- Warn for manually entered server lists too. Explain that selecting all clears Channel ID and includes all server channels while retaining the selected author and filters; selection never starts deletion.
- Clarify message-picker bounds, import failures, session detection, automatic pauses and search retries. Show pauses in seconds and distinguish an attempted deletion from a confirmed result.
- Treat user cancellation/stopping and generic run termination as neutral events. Report only confirmed removals as deletions; use the final summary for aggregate ignored, failed and already-gone counts, and explicitly label completed runs with failed messages.
- Rebuild the userscript and both extension packages from the same shared runtime.

Validation: `npm run check` passed lint, 23 mocked tests, metadata/license/syntax checks, matching shared-runtime hashes and deterministic packaging. Mozilla validation reported zero errors, warnings and notices. The Chrome userscript fixture passed 27 interaction checks plus keyboard, drag/resize and four viewport/theme checks with the scope warning active. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 1.98.28 (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all twelve scenario groups, including selection warnings, preserved filters, no automatic run, duplicate execution, cancellation and stopping. All messages and API responses were simulated. Live Discord, Edge, minimum supported browser versions and signed/store updates remain unvalidated.

## 1.3.2 — 2026-10-11

- Replace runtime HTML parsing with DOM construction from templates compiled at build time. Preserve HTML/SVG namespaces, metadata links, range defaults and the existing interface.
- Render logs through an attribute-free `b`/`i`/`sup`/`x` allowlist; treat all other markup as text. Preserve formatting and Streamer mode while preventing hostile error data from creating executable elements.
- Clear logs by cloning the empty-state nodes and update progress through text APIs; remove runtime `innerHTML` and `insertAdjacentHTML` use.
- Raise the Firefox extension minimum to 142 so Mozilla's desktop and Android compatibility checks both recognize the no-data-collection declaration. Do not declare Android support. Chromium's minimum remains 111.
- Add Mozilla's add-on validator to `npm run check`, treating warnings as errors. HTML parsing and validation dependencies run only during build/check and are not included in the shipped runtime.

Validation: clean `npm ci` and `npm run check` passed lint, 23 mocked unit tests, metadata/license/syntax, matching runtime hashes and deterministic packaging. Mozilla addons-linter 10.14.0 reported zero errors, zero warnings and zero notices for both the Firefox folder and ZIP. The userscript Chrome fixture passed 21 interaction checks, keyboard controls, dragging/resizing and four viewport/theme checks. Native Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 1.98.28 (Chromium 154.0.8037.58, Wayland/GPU enabled) passed all eleven scenario groups, including inert hostile markup, log clearing, redaction, defaults, startup/reload and deletion safeguards. No real messages were deleted. AMO server review, independent authenticated Discord checks, Firefox 142, Edge, Brave stable and Android remain unvalidated.

## 1.3.1 — 2026-10-11

- Wait for a visible channel-header toolbar to remain stable across two checks before initializing the interface.
- Remove unrestricted toolbar fallbacks that could select message controls during Discord startup. Ignore hidden headers and wait for replacement headers to stabilize before moving the logo button.
- Avoid interface insertion and premature missing-toolbar warnings on login/loading screens. Keep the deletion engine, confirmations, filters and stopping unchanged.
- Add native extension regressions for delayed headers, unrelated toolbars, hidden headers and channel-header replacement. Rebuild both browser packages from the shared userscript.

The maintainer reported a gray screen after refreshing Discord in Brave Origin Nightly 1.98.28 (Chromium 154.0.8037.58), then confirmed that version 1.3.1 resolved the reported problems. This confirmation is separate from automated fixture checks and does not establish the exact cause of the gray screen. No real messages were deleted during investigation.

Validation: `npm run check` passed 23 mocked unit tests, lint, artifact verification and deterministic, byte-identical browser packages. The userscript fixture passed 21 interaction checks, keyboard controls, dragging/resizing and four viewport/theme checks. All ten native extension scenario groups passed in Chrome 154.0.8037.97, Firefox 157.0 and Brave Origin Nightly 1.98.28; the Brave run used a visible temporary Wayland profile with GPU enabled. The signed-in gray-screen fix is maintainer-reported; independent authenticated checks, Edge, minimum browser versions and store installs remain unvalidated.

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
