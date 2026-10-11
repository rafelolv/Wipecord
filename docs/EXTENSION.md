# Browser extension

The userscript is Wipecord's primary installation. The extension is an alternative that runs the same interface and deletion engine without Tampermonkey or another manager. Chrome, Brave and Edge use the Chromium package; Firefox uses its own package. These are desktop browser packages, not Discord desktop integrations.

The Firefox listing is [Wipecord on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/wipecord/). Chrome, Brave and Edge users should keep using the [userscript](https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js); Wipecord is not published on the Chrome Web Store. Local Chromium packages remain available as a manual alternative.

## Get the local packages

From a checkout, use Node.js 24 and run:

```sh
npm ci
npm run check
```

The build produces `dist/chromium/`, `dist/firefox/`, `dist/wipecord-chromium-<version>.zip`, `dist/wipecord-firefox-<version>.zip` and `dist/SHA256SUMS`. A ZIP has `manifest.json` directly at its root. GitHub releases can attach these files; a main-branch source ZIP must be built first.

## Chrome, Brave and Edge

1. Disable the Wipecord userscript and other deletion scripts.
2. Open `chrome://extensions`, `brave://extensions` or `edge://extensions`.
3. Enable **Developer mode**, select **Load unpacked**, and choose `dist/chromium/`. If using the Chromium ZIP, extract it first and choose the extracted folder.
4. Allow the extension's site access on Discord and reload your Discord tab.
5. Use the Wipecord button in Discord. Choose your target and filters, click **Delete messages**, then review the confirmation.

The minimum Chromium version is 111, which introduced declarative MAIN-world scripts. Keep your browser current. Brave and Edge use the same Chromium format, but require their own browser validation. See [Chrome's loading instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## Firefox

For store installation, use the [Firefox Add-ons page](https://addons.mozilla.org/en-US/firefox/addon/wipecord/), install the add-on when the listing is available, allow access to Discord and reload your Discord tabs. Store installations use Mozilla-signed packages and receive updates through Firefox.

For a local build or the unsigned GitHub release ZIP:

1. Use Firefox 128 or later and disable the Wipecord userscript and other deletion scripts.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on** and choose `dist/firefox/manifest.json` or the Firefox ZIP.
4. Grant access to Discord if prompted and reload the Discord tab. Use the same button and confirmation flow as the userscript.

Temporary add-ons are removed when Firefox restarts. The local ZIP is **unsigned**: it is not a persistently installable signed XPI. Normal permanent distribution needs Mozilla signing, either through a public AMO listing or an unlisted signed distribution. See [temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/) and [signing options](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/).

## Popup and duplicate installations

The popup shows readiness, active deletion and duplicate-installation notices, with links to instructions, GitHub and issues. It does not expose targets, tokens or message data, and has no deletion controls. Installing the extension, opening its popup and loading Discord never starts a deletion.

Compatible Wipecord installations share a DOM claim: the first installation owns that page and later copies do not initialize. A Web Lock refuses concurrent deletion runs in tabs of the **same origin**, without queuing them for later. `discord.com`, `canary.discord.com` and `ptb.discord.com` are different origins; this lock cannot coordinate across those hosts, separate browser profiles or different browsers. Keep only one installation enabled. Older userscripts do not implement this protocol: an already mounted legacy panel blocks the new engine, but a legacy script loaded later cannot be controlled by it. Disable old versions and reload before testing.

**Stop** prevents subsequent work. A request already sent can complete; an already deleted message cannot be restored. Closing the popup or panel does not stop the run. Use Stop before disabling, updating or reloading an installation.

## Local updates and store publication

Local installations do not fetch new executable code. Download or rebuild a newer package. Stop any running operation, replace the Chromium folder and click **Reload** on its extension card; load the new Firefox package as a temporary add-on. Reload all Discord tabs afterward, since existing tabs can retain an earlier runtime. The popup lists package and running-core versions to help identify this situation.

Wipecord's current store distribution is planned through the [Firefox Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/wipecord/). Chromium users should use the userscript or install the unpacked package manually; Chrome Web Store publication is not planned.

Store versions need a developer account, reviewed listing, screenshots, accurate permission/data disclosures and an incremented version. Submit the Firefox ZIP to AMO for review/signing; distribute the resulting **signed XPI**, not the local ZIP, for permanent Firefox installation. Store clients update whole reviewed packages. There is no custom update server or remotely loaded JavaScript in Wipecord.

No store submission or signing is performed by the build. Store acceptance has not been verified. Automated browser checks use simulated responses; see the validation log. Follow [Chrome publication](https://developer.chrome.com/docs/webstore/publish) and [Mozilla signing](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/) when publication is authorized.

## Architecture, permissions and privacy

`src/` builds the production `wipecord.user.js`. The extension build copies that file **byte-for-byte** into both packages; it does not extract or duplicate the deletion engine. No `GM_*` APIs are used (`@grant none`). A small isolated-world adapter responds only to read-only status requests from this extension. The popup uses native extension APIs; the packaged userscript uses normal DOM and browser APIs.

The engine runs in the page's MAIN world because Discord's webpack module cache, session discovery and same-origin requests require the page context. Native declaration avoids adding remotely loaded scripts or exposing executable files as web-accessible resources. Firefox supports this world from [version 128](https://blog.mozilla.org/addons/2024/07/10/manifest-v3-updates-landed-in-firefox-128/). Page-world execution is subject to the page's CSP and to page interference, as described in [Chrome's content-script documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts). DOM markers are coordination/status signals, not a security boundary against a hostile page.

Both manifests match only the userscript's existing HTTPS Discord routes: `/app`, `/channels/*` and `/login` on `discord.com` and its subdomains, in the top frame. They request no `tabs`, `activeTab`, `scripting`, storage, clipboard, downloads or broad host permissions. Declarative content-script matches grant the necessary site access; the popup reads the active tab ID and sends a status message without reading its URL or history. Discord API requests use the user's existing page session only when an action requires them. Login pages can mount a hidden panel but do not authenticate or start deletion. Discord DOM/API changes and site-access settings can still prevent operation.

Wipecord stores no account data in extension storage and has no analytics or reporting service. The status adapter carries only readiness, runtime version, running/idle state and duplicate notice. Requests and deletion previews remain inside the Discord page. Firefox's manifest declares no data collection to the extension developer; user-requested Discord operations still communicate with Discord.

## Validation

See [EXTENSION-VALIDATION.md](EXTENSION-VALIDATION.md) for the recorded scenarios and limits. Automated deletion responses are simulated; they do not establish live Discord compatibility. Use temporary profiles, disable other deletion tools, and never include tokens or private messages in bug reports.
