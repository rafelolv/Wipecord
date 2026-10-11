# Wipecord

Maintained by rafelolv. Read docs/MAINTENANCE.md for the workflow and docs/BASELINE.md for the imported snapshot.

- Use English for documentation, comments, user-facing text, metadata and commit messages.
- Preserve LICENSE and inherited attribution comments. The imported license explicitly requires original-project attribution in code, README and license. Keep these notices in distributed artifacts; branding and support links belong to Wipecord.
- Maintain main. Installation, update and support URLs must point to rafelolv/Wipecord/main or its issues; legal and baseline references retain their source URLs.
- Edit runtime code only in src/, templates in src/ui/, and build logic in build/ or rollup.config.mjs. Never hand-edit wipecord.user.js: regenerate it and commit the artifact with source changes.
- Keep the runtime readable and free of external dependencies, remote code, telemetry and remote configuration. Build/test dependencies are permitted. Never store, print or commit authorization tokens or private message data.
- Preserve target validation, confirmation, stopping, privacy defaults, pagination and rate-limit backoff. Do not broaden deletion targets or remove guards as part of a branding change.
- Run npm run check after changes. Tests use mocked Discord/browser objects and cannot prove compatibility with the live Discord client. Record browser checks separately; never claim successful live deletion based only on automated checks.
- Public versions start at 1.0.0. Use three-part semantic versions; package.json and generated @version must agree. Any published userscript change, including metadata, requires a new version. Documentation-only changes do not.
- Keep development metadata separate from production. Disable other deletion scripts when validating in a browser.
- Use repository-local Git identity Rafael <82127878+rafelolv@users.noreply.github.com>. Preserve existing Wipecord history; source snapshots are imported without third-party Git history. Do not rewrite history or add co-authors automatically.
- Adapt general AdBonk practices; do not add Twitch workers, ad-blocking integrations, extension packages or variant counters to this userscript project.

## Release requests

Follow docs/RELEASING.md and docs/RELEASE-TEMPLATE.md. Prepare and validate the artifact, changelog and English notes before tagging. When publication is authorized, publish and verify the release and attached files, rather than stopping at a tag. Never reuse a published tag or silently replace its artifacts. Report actual checks and unavailable browser validation.
