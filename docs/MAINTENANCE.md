# Maintenance

Wipecord is maintained on `main` at https://github.com/rafelolv/Wipecord.

## Development

Use Node.js 24 LTS and `npm ci`. Run `npm run check` after changes: it lints source/build/test files, executes the tests against bundled source with mocked APIs, builds the userscript, checks syntax, and verifies metadata, license inclusion and deterministic output. It also runs Mozilla's add-on validator against the Firefox folder with warnings treated as errors. CI rejects an artifact that differs from the committed version.

Runtime UI templates are compiled to DOM descriptors by `build/templates-plugin.mjs`. Keep templates in `src/ui/`; never parse dynamic HTML in the browser. Log rendering creates only attribute-free `b`, `i`, `sup` and `x` formatting nodes; all other markup is literal text. Preserve redaction and test hostile message/error data after renderer changes. `parse5` and `addons-linter` are build/check dependencies only and are not shipped in the runtime.

For UI changes, run `npm run test:ui:browser` with Chrome/Chromium installed (`CHROME_BIN` can select its executable). This loads the actual userscript on a loopback fixture, mocks all API calls and checks target controls, privacy, cancellation, stopping, keyboard access and viewport layouts. It produces screenshots in a temporary directory. It does not authenticate to Discord or delete real messages.

`npm start` serves a separate `[DEV]` installation at `http://localhost:10001/wipecord.user.js`. Edit `src/`, then regenerate the root artifact with `npm run build`. Production installs use https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js.

## Versions

The Chromium and Firefox extensions use the same package version as the userscript. `npm run check` builds both local folders and deterministic ZIPs, and verifies byte-identical packaged engines. `npm run build:extensions` rebuilds all artifacts without running the full check. Edit popup adapters in `src/extension/` and templates in `src/ui/extension/`; do not edit generated package folders. Shared changes must rebuild both browser packages. See [extension architecture and installation](EXTENSION.md).

Wipecord starts at `1.0.0`. Increment patch for compatible fixes, minor for compatible features, and major for breaking changes. Any published artifact change requires a new version, including metadata. Align package.json and the lockfile using `npm version <version> --no-git-tag-version`, then build. Documentation-only changes need no runtime bump.

Wipecord has a distinct namespace. Reinstall manually when migrating from another script, and disable the previous installation. Do not assume managers migrate existing installations or accept a lower public version automatically.

## Browser validation

Use a disposable conversation and messages you intend to delete. Confirm manager installation, toolbar mounting, navigation, theme, streamer mode, target preview, cancellation, stop behavior, DM/group history filtering, server search and pacing. Never run destructive tests against someone else's account or unattended against real history. Do not capture tokens or private messages in issue reports.

Automated tests exercise core logic with mocks; they do not validate Discord's current DOM, token detection, real permissions, live rate limits or userscript-manager behavior. Record unperformed checks explicitly.

For extension integration, run `npm run test:extensions:browser` with Chrome and Firefox installed (`CHROME_BIN` and `FIREFOX_BIN` select executables). This requires recent browser automation APIs, tests actual extensions in temporary profiles with loopback-only manifests, and uses simulated deletion responses. See [recorded scenarios and limits](EXTENSION-VALIDATION.md). The extension runtime supports Chromium 111+ and Firefox 142+, but automated native loaders require newer browsers; validate minimum supported versions separately before store publication.

Set `WIPECORD_TEST_BROWSERS=chromium` or `WIPECORD_TEST_BROWSERS=firefox` to select one browser. To exercise Brave or Edge, select `chromium` and point `CHROME_BIN` at that executable. Keep test profiles temporary and do not reuse your signed-in profile.

## Updates

Review fixes and their dependencies on a working branch before integration. Preserve Wipecord names, URLs and deletion guards. Validate the source and rebuild the artifact before committing.

## Git and publication

The repository-local identity is `Rafael <82127878+rafelolv@users.noreply.github.com>`, matching the existing GitHub-authored initial commit. This overrides the machine's unrelated global email for Wipecord only. Commits and repository ownership are separate: `origin` points to `git@github.com:rafelolv/Wipecord.git`.

Commit source, regenerated artifact and documentation together. Push when requested. Releases follow [RELEASING.md](RELEASING.md).
