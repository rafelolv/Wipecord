# Automatic Firefox publication

The Release workflow submits each new release to the existing [Wipecord Firefox Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/wipecord/) after publishing its GitHub release. This automation applies to future tags containing the workflow. It does not submit an older release merely because `main` changes.

## Configure once

1. Generate fresh credentials in Mozilla's [API credentials page](https://addons.mozilla.org/en-US/developers/addon/api/key/), using an account that can update Wipecord. Revoke any credentials previously shared in chat or elsewhere.
2. Open [Wipecord's Actions secrets settings](https://github.com/rafelolv/Wipecord/settings/secrets/actions).
3. Select **New repository secret** and create both secrets:

| Repository secret | Value from Mozilla |
| --- | --- |
| `AMO_JWT_ISSUER` | JWT issuer |
| `AMO_JWT_SECRET` | JWT secret |

Use **secrets**, not plain Actions variables. No local `.env`, source-code edits or additional npm packages are needed. Never paste credentials into issues, logs, commits or release notes. Rotate credentials from the same Mozilla page and replace the two GitHub secrets when necessary.

## Each release

- Follow [RELEASING.md](RELEASING.md). The release tag starts the existing workflow; normal pushes and pull requests do not submit to Mozilla.
- The GitHub release job runs all checks and publishes the userscript and both unsigned extension ZIPs.
- The dependent **Submit Firefox update to AMO** job rebuilds the tagged source and downloads that release's Firefox ZIP. Submission stops if the rebuilt and released ZIPs differ, or if the manifest identity/version is wrong.
- The job sends the exact released Firefox ZIP to AMO's `listed` channel, waits up to ten minutes for upload validation, and submits it with a tracked-source ZIP. Reviewer instructions explain how to reproduce the build using Node.js 24, `npm ci` and `npm run build:extensions`.
- The source ZIP contains only explicitly selected tracked build inputs and documentation from the checked-out release commit. It excludes `.git`, `.env`, local files, dependencies and distribution outputs.
- English release notes from `docs/releases/v<version>.md` are added to the AMO version. Existing listing branding, descriptions and permissions are not edited.
- Check both the Actions result and [Mozilla's version history](https://addons.mozilla.org/en-US/developers/addon/wipecord/versions). A successful submission means Mozilla received the version, source and notes. Review/signing can still be pending; it does not guarantee immediate public availability. Firefox store installations receive approved updates through Mozilla.

The maintainer has authorized this Firefox submission as part of requested future releases. Chromium/Edge store publication remains separate. Local `npm run check` and `npm run build:extensions` never publish anything. The publication script additionally requires the official repository's release-tag Actions context.

## Failures and retries

- Missing secrets fail the Firefox job with setup instructions. The GitHub release stays available. Configure the secrets, then select **Re-run failed jobs** on that workflow run.
- For authentication failures, check the credential owner's access and replace revoked/expired credentials. For validation failures, inspect Mozilla's Developer Hub. Request errors and API response bodies are deliberately omitted from logs to protect credentials.
- Upload validation is polled with a fixed limit. Writes are never automatically retried after timeouts, since Mozilla might have accepted a request before the connection failed.
- If a version already exists, the job refuses to replace or resubmit it. Inspect the Developer Hub first. A failure after version creation may leave a submitted version without release notes; finish those notes in the Developer Hub and verify its attached source. Do not retag, delete or silently replace the version to make a job green.
- Re-run **failed jobs**, not the entire workflow: the completed GitHub release job must not recreate an existing release. Never move a published tag. Package corrections require a new semantic version and release.
- GitHub's concurrency group prevents simultaneous running Firefox publication jobs. Prepare one release at a time and verify its submission before starting another; GitHub may replace an older pending run if multiple releases are queued.

GitHub release ZIPs remain unsigned local packages. This workflow neither replaces them with signed files nor downloads a signed XPI. Signing and public distribution happen on AMO; use the Firefox listing for permanent installation. No store credentials or publication code are included in the extension runtime.

## Reproduce the reviewer source build

Extract the submitted source ZIP into an empty directory. With Node.js 24 installed, run:

```sh
npm ci
npm run build:extensions
node scripts/check-artifact.mjs
node scripts/check-extensions.mjs
npm run check:firefox
```

The Firefox output is `dist/wipecord-firefox-<version>.zip`. No credentials, Git checkout or network access to AMO are needed to build it; npm needs access to download the locked build dependencies. Run the full `npm run check` from a Git checkout for the repository's tests, including publication source-archive checks.

## Validation limits

- Automated tests use simulated AMO responses and dummy credentials. They cover short-lived JWT signatures, missing secrets, listing identity, duplicate-version refusal, validation polling/failure, exact uploaded bytes, source attachment, release notes and sanitized failures.
- A real authenticated submission, Mozilla review/signing and delivery of a store update must be verified during the next authorized release after secrets are configured. Do not submit an existing version just to test the setup.
- Runtime browser behavior is unchanged by this automation; mocked publication tests do not establish live Discord compatibility.

The implementation follows Mozilla's [v5 add-on API](https://mozilla.github.io/addons-server/topics/api/addons.html) and [JWT authentication requirements](https://mozilla.github.io/addons-server/topics/api/auth.html).
