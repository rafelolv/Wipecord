<div align="center">
  <img src="images/icon.svg?v=1.5.0" width="80" height="80" alt="Wipecord logo">
  <h1>Wipecord</h1>
  <p>Clean up your own Discord messages.</p>
  <p>
    <a href="https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js"><strong>Install Wipecord</strong></a>
    · <a href="docs/USER-GUIDE.md">User guide</a>
    · <a href="https://github.com/rafelolv/Wipecord/issues">Get help</a>
  </p>
</div>

Wipecord helps you delete your own messages from **DMs, group chats and servers** in Discord's browser app. Choose a target, add filters if you need them, and review the confirmation before deleting.

> [!WARNING]
> Deleted messages cannot be restored. Start with a small selection. Automating a user account can lead to [account termination](https://support.discord.com/hc/en-us/articles/115002192352-Automated-user-accounts-self-bots-).

## Install

### Userscript — recommended

A userscript runs Wipecord through a browser add-on called a userscript manager. This is the main option for Chrome, Brave, Edge and Firefox.

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. **[Install Wipecord](https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js)** and accept the installation in your manager.
3. Open [Discord in your browser](https://discord.com/channels/@me) and reload the page.

Keep only one Wipecord installation enabled and disable other message-deletion scripts. If the install link opens plain text, use the [manual installation guide](docs/USER-GUIDE.md#manual-installation).

### Firefox extension

**[Install Wipecord from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/wipecord/)** to use the same interface without a userscript manager. Reload Discord after installing.

<details>
<summary>Other downloads and Chrome Web Store availability</summary>

Download a fixed version of the userscript or a local browser extension from [GitHub releases](https://github.com/rafelolv/Wipecord/releases/latest). For local installation and updates, follow the [extension guide](docs/EXTENSION.md). GitHub ZIPs are unsigned local packages; Firefox store review and signing are separate.

Chrome, Brave and Edge users should keep using the userscript. Wipecord is not published on the Chrome Web Store. Google charges a [$5 one-time developer registration fee](https://blog.chromium.org/2020/03/new-developer-dashboard-and.html) to publish there. What a generous way to support people sharing free, useful tools. Embarrassing, Google.

</details>

## Quick start

1. Open the conversation or channel you want to clean.
2. Click the **W logo** in Discord's top-right toolbar, next to the search box.
3. Click **me** beside **Author ID**, then **current** beside **Channel ID**.
4. To narrow the cleanup, open **Filter messages** or **Date & message range**.
5. Click **Delete messages**, review the target and filters, then confirm.

Watch the activity panel until the final summary appears. **Stop** ends the cleanup; a deletion already in progress may still finish.

### Choose what to clean

Keep **Author ID** set to your own ID with **me**.

| You want to clean… | What to select |
| --- | --- |
| One channel, DM or group chat | Open it, then click **current** beside **Channel ID**. |
| One whole server | Click **current** beside **Server ID** and clear **Channel ID**. |

For multiple servers, archive imports and advanced filters, use the [user guide](docs/USER-GUIDE.md).

## Useful tips

- **Keep the default delays.** If Discord asks Wipecord to pause, let it wait and continue automatically.
- **Pinned messages stay by default.** Enable **Include pinned messages** only if you want to remove them too.
- **Enable Streamer mode before sharing your screen.** It starts disabled. Never share your authorization token.
- **Save a backup if you need one.** [Request your Discord data](https://support.discord.com/hc/en-us/articles/360004027692) before deleting.

## Help

Start with [troubleshooting](docs/USER-GUIDE.md#troubleshooting). If you still need help, [open an issue](https://github.com/rafelolv/Wipecord/issues) with your browser, installation type, Wipecord version and what happened. Leave out tokens and private messages.

## Logo files

[SVG](images/icon.svg) · [128 px PNG](images/icon-128.png) · [512 px PNG](images/icon-512.png)

<details>
<summary>Development</summary>

Use Node.js 24 LTS. From a local checkout:

```sh
npm ci
npm run check
```

Edit `src/` and regenerate `wipecord.user.js` with `npm run build`. See [contributing](CONTRIBUTING.md), [maintenance](docs/MAINTENANCE.md) and [releasing](docs/RELEASING.md).

Browser tests use simulated responses. See [validation results and limits](docs/EXTENSION-VALIDATION.md).

</details>

---

Maintained by [rafelolv](https://github.com/rafelolv) · [MIT License](LICENSE)
