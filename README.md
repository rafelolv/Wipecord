<div align="center">
  <img src="images/icon.svg?v=1.1.1" width="80" height="80" alt="Wipecord logo">
  <h1>Wipecord</h1>
  <p>Clean up your Discord messages.</p>
  <p>
    <a href="https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js"><strong>Install Wipecord</strong></a>
    · <a href="docs/USER-GUIDE.md">User guide</a>
    · <a href="https://github.com/rafelolv/Wipecord/issues">Get help</a>
  </p>
</div>

Wipecord adds a 🗑️ button to Discord in your browser. Choose a conversation or server, filter your messages, and review the target before deleting.

**DMs & group chats** · **Server channels** · **Text & date filters** · **Stop controls**

> [!WARNING]
> Deletion is permanent. Start with a small selection and review the confirmation. Automating a user account can lead to [account termination](https://support.discord.com/hc/en-us/articles/115002192352-Automated-user-accounts-self-bots-).

## Install

1. Install a userscript manager, such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. **[Install Wipecord](https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js)** and confirm in your manager.
3. Open [Discord in your browser](https://discord.com/channels/@me) and reload the page.

Use the browser web app. Disable any other message-deletion scripts before running Wipecord. If the install link opens plain text, follow [manual installation](docs/USER-GUIDE.md#manual-installation).

**Prefer using no userscript manager?** An [experimental extension for Chrome, Brave, Edge and Firefox](docs/EXTENSION.md) uses the same Wipecord interface and engine. The userscript remains the recommended option.

## Quick start

1. Open the channel, DM, or group chat you want to clean.
2. Click **🗑️** in Discord's top-right toolbar.
3. Click **me** beside **Author ID**, then **current** beside **Channel ID**.
4. Add a text or date filter if you want to narrow the selection.
5. Click **Delete messages**, review the confirmation, and accept only if the target is correct.

Watch the progress in the panel. **Stop** stops the run; messages already deleted stay deleted.

### Choose your scope

Keep **Author ID** set to your own ID using **me**.

| Clean up | What to select |
| --- | --- |
| One channel, DM, or group chat | Open it, then click **current** beside **Channel ID**. |
| One whole server | Click **current** beside **Server ID** and leave **Channel ID** empty. |
| Several servers | Enter their IDs in **Server ID**, separated by commas, and leave **Channel ID** empty. |

For all servers, archive imports, and advanced filters, see the [user guide](docs/USER-GUIDE.md).

## A few useful tips

- Keep the default delays. If Discord rate-limits the run, let Wipecord wait or increase the delays.
- Keep **Streamer mode** enabled when sharing your screen. Never share your authorization token.
- Pinned messages are excluded unless you enable **Include pinned**.
- Want a backup first? [Request your Discord data](https://support.discord.com/hc/en-us/articles/360004027692).

**Something wrong?** Start with [troubleshooting](docs/USER-GUIDE.md#troubleshooting), or [open an issue](https://github.com/rafelolv/Wipecord/issues) with your browser, manager, and what happened. Leave out tokens and private messages.

<details>
<summary><strong>Panel help — settings reference</strong></summary>

### Author ID

[Choose whose messages to delete →](docs/USER-GUIDE.md#author-id)

### Server ID

[Select one or more servers →](docs/USER-GUIDE.md#server-id)

### Channel ID

[Select channels or a private conversation →](docs/USER-GUIDE.md#channel-id)

### Wipe a Discord data archive

[Import your archive's conversation list →](docs/USER-GUIDE.md#wipe-a-discord-data-archive)

### Filter

[Filter by text, links, files, or pinned messages →](docs/USER-GUIDE.md#filter)

### Pattern

[Use a regular expression →](docs/USER-GUIDE.md#pattern)

### Messages interval

[Choose a range using message IDs →](docs/USER-GUIDE.md#messages-interval)

### Date interval

[Choose a date and time range →](docs/USER-GUIDE.md#date-interval)

### Delays

[Adjust search and deletion pacing →](docs/USER-GUIDE.md#delays)

### Authorization Token

[Fill your token and keep it private →](docs/USER-GUIDE.md#authorization-token)

</details>

<details>
<summary><strong>Development</strong></summary>

Use Node.js 24 LTS. From a local checkout:

```sh
npm ci
npm run check
```

Edit `src/` and regenerate `wipecord.user.js` with `npm run build`. See [contributing](CONTRIBUTING.md), [maintenance](docs/MAINTENANCE.md), and [releases](docs/RELEASING.md).

Automated checks cover the core, build, and panel interactions in a local Chrome fixture. Live Discord and userscript-manager validation is still pending.

</details>

---

Maintained by [rafelolv](https://github.com/rafelolv) · [MIT License](LICENSE)
