# Wipecord

Maintained by rafelolv. Read docs/MAINTENANCE.md for the workflow.

- Use English for documentation, comments, user-facing text, metadata and commit messages.
- Maintain main. Installation, update and support URLs must point to rafelolv/Wipecord/main or its issues.
- Edit runtime code only in src/, templates in src/ui/, and build logic in build/ or rollup.config.mjs. Never hand-edit wipecord.user.js: regenerate it and commit the artifact with source changes.
- Keep the runtime readable and free of external dependencies, remote code, telemetry and remote configuration. Build/test dependencies are permitted. Never store, print or commit authorization tokens or private message data.
- Preserve target validation, confirmation, stopping, privacy defaults, pagination and rate-limit backoff. Do not broaden deletion targets or remove guards as part of a branding change.
- Run npm run check after changes. Tests use mocked Discord/browser objects and cannot prove compatibility with the live Discord client. Record browser checks separately; never claim successful live deletion based only on automated checks.
- Public versions start at 1.0.0. Use three-part semantic versions; package.json and generated @version must agree. Any published userscript change, including metadata, requires a new version. Documentation-only changes do not.
- Keep development metadata separate from production. Disable other deletion scripts when validating in a browser.
- Use repository-local Git identity Rafael <82127878+rafelolv@users.noreply.github.com>. Preserve existing Wipecord history. Do not rewrite history or add co-authors automatically.
- Wipecord is independent. Do not import unrelated project code, branding or features.

## Browser extensions

- The userscript remains the primary distribution. Extensions are alternatives for Chromium and Firefox, not separate deletion engines.
- Keep extension runtime adapters in src/extension/, popup templates in src/ui/extension/, and packaging in build/. Ship the generated production wipecord.user.js byte-for-byte in both packages. Never edit dist/ or maintain a copied engine.
- All distributions use package.json's semantic version. Any shared runtime or extension change requires a new version and rebuilding both packages with npm run check. Commit the root userscript with shared source changes. dist/ contains reproducible local outputs; release automation attaches both ZIPs.
- Package all executable code locally. No remote executable updates, telemetry, remote configuration, background deletion, installation actions or destructive popup commands. Use declarative Discord-only matches and no extra API permissions unless justified and documented.
- Preserve the DOM runtime claim and the non-queued origin-wide Web Lock. Duplicate installations must not initialize a second engine; concurrent runs in tabs of the same origin must be refused. The status bridge is read-only and must never expose tokens, targets or messages.
- Run npm run test:extensions:browser with temporary profiles and simulated API responses after integration changes. It uses loopback-only temporary manifests with byte-identical executable files. Record actual browsers, tests and limitations; never delete real messages without specific authorization.
- Document unsigned local installation, manual updates, store signing and store review separately. Do not publish to stores without explicit authorization.

## Release requests

Follow docs/RELEASING.md and docs/RELEASE-TEMPLATE.md. Prepare and validate the artifact, changelog and English notes before tagging. When publication is authorized, publish and verify the release and attached files, rather than stopping at a tag. Never reuse a published tag or silently replace its artifacts. Report actual checks and unavailable browser validation.
