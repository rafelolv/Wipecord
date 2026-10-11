# Extension validation

The integration runner is `npm run test:extensions:browser`. It loads actual unpacked extensions in separate temporary Chrome and Firefox profiles using native extension loaders (Chrome DevTools Protocol and Firefox WebDriver BiDi). Only the test copies' content-script match patterns change to a loopback fixture. Packaged JavaScript is checked byte-for-byte against the production folders. The shipping manifests remain HTTPS Discord-only.

All messages, session values and responses are synthetic. Fetch is mocked in the page world; no Discord account or live messages are accessed. The runner saves results, panel screenshots and a Chromium popup screenshot in a temporary directory and reports its path. Firefox's automation protocol cannot capture an extension popup screenshot; its status and links are checked through the live DOM.

## Scenarios

- Native MAIN-world execution and unchanged panel mounting, privacy defaults and default request delays.
- Installation/page load and popup display produce no API requests, confirmation or deletion.
- Read-only popup readiness, active-run status, duplicate notice, links and unsupported-tab status.
- Both installation orders: userscript before extension and extension before userscript; only one panel initializes.
- Cancelled confirmation produces no DELETE request.
- Stop while search is pending prevents confirmation and deletion.
- A second tab of the same origin is refused while a run owns the lock; it never starts later automatically and can start after a new user action when the lock is released.
- Confirmed simulated DM deletion preserves author, text, link, file, valid regular-expression, lower message-ID bound, pinned exclusion and system-message exclusion. History pagination still runs.
- Stop during an already in-flight simulated DELETE permits that request to finish and prevents the next deletion.
- No injection on an unmatched route; no page errors during the tested flows.
- `npm run check` verifies core regressions, runtime claims, metadata, syntax, engine hashes, matching package versions, minimal manifests, ZIP contents and deterministic rebuilding.

## Limits

Browser versions and actual results for this change are recorded in CHANGELOG.md. Chrome, Firefox and the installed Brave Origin Nightly passed; Edge, Brave stable and minimum supported versions have not been exercised directly. Browser tests use temporary loopback match patterns, not Discord's live DOM, CSP, authentication or API. Userscript coexistence is tested by loading its complete artifact as a page script, not through every userscript manager's injection behavior.

Live rate limiting, store installation/signing, browser restarts with a signed Firefox package, cross-host coordination and live message deletion are not validated. The origin lock does not extend across Discord subdomains, profiles or browsers. Older userscripts loaded after Wipecord cannot be forced to obey its runtime claim. Existing engine limitations remain shared by both distributions; in particular, malformed regular expressions are currently ignored by the core. Use valid patterns and review the confirmation carefully.
