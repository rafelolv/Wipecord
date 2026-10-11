# Maintenance

Wipecord is maintained on `main` at https://github.com/rafelolv/Wipecord. The source snapshot was imported into the existing independent repository without its Git history. The baseline identifiers and license remain in [BASELINE.md](BASELINE.md) and [LICENSE](../LICENSE).

## Development

Use Node.js 24 LTS and `npm ci`. Run `npm run check` after changes: it lints source/build/test files, executes the inherited tests against bundled source with mocked APIs, builds the userscript, checks syntax, and verifies metadata, license inclusion and deterministic output. CI also rejects an artifact that differs from the committed version.

`npm start` serves a separate `[DEV]` installation at `http://localhost:10001/wipecord.user.js`. Edit `src/`, then regenerate the root artifact with `npm run build`. Production installs use https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js.

## Versions

Wipecord starts at `1.0.0`. Increment patch for compatible fixes, minor for compatible features, and major for breaking changes. Any published artifact change requires a new version, including metadata. Align package.json and the lockfile using `npm version <version> --no-git-tag-version`, then build. Documentation-only changes need no runtime bump.

Wipecord has a distinct namespace. Reinstall manually when migrating from another script, and disable the previous installation. Do not assume managers migrate existing installations or accept a lower public version automatically.

## Browser validation

Use a disposable conversation and messages you intend to delete. Confirm manager installation, toolbar mounting, navigation, theme, streamer mode, target preview, cancellation, stop behavior, DM/group history filtering, server search and pacing. Never run destructive tests against someone else's account or unattended against real history. Do not capture tokens or private messages in issue reports.

Automated tests exercise core logic with mocks; they do not validate Discord's current DOM, token detection, real permissions, live rate limits or userscript-manager behavior. Record unperformed checks explicitly.

## Source updates

Inspect changes from the recorded baseline in a temporary checkout. Bring over selected fixes only after reviewing their dependencies and testing them. Preserve Wipecord names, URLs, legal notices and deletion guards. Do not replace the project wholesale or import third-party history by accident.

## Git and publication

The repository-local identity is `Rafael <82127878+rafelolv@users.noreply.github.com>`, matching the existing GitHub-authored initial commit. This overrides the machine's unrelated global email for Wipecord only. Commits and repository ownership are separate: `origin` points to `git@github.com:rafelolv/Wipecord.git`.

Commit source, regenerated artifact and documentation together. Push when requested. Releases follow [RELEASING.md](RELEASING.md).
