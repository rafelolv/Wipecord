# Contributing

Read [AGENTS.md](AGENTS.md) and [the maintenance guide](docs/MAINTENANCE.md). Use English and keep changes focused. Edit `src/`, not the generated `wipecord.user.js`; run `npm run check` and commit the regenerated artifact with your source changes.

Preserve target guards, rate limits, privacy defaults and license notices. Add focused regressions when changing deletion behavior. Do not introduce runtime dependencies, telemetry or remote scripts. Never include authorization tokens, private messages or identifying screenshots in issues or tests.

Describe what changed, why, checks performed and browser scenarios not tested. Coordinate release versions with the maintainer.

The extensions package the userscript byte-for-byte. Keep adapters in `src/extension/`, popup templates in `src/ui/extension/` and packaging in `build/`. Rebuild both packages with shared changes and run `npm run test:extensions:browser` after integration changes. See [extension maintenance rules](AGENTS.md#browser-extensions) and [validation](docs/EXTENSION-VALIDATION.md).
