# Wipecord user guide

[← Back to Wipecord](../README.md)

Detailed settings and troubleshooting for the Discord web app. For installation and your first cleanup, use the [quick start](../README.md#quick-start).

The userscript is the primary installation. For the alternative experimental browser packages, see [extension installation and updates](EXTENSION.md). Both use the same panel and deletion engine; keep only one installation enabled.

- [Panel settings](#the-panel-field-by-field)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Manual installation

<details>
<summary>Manual install, if the link doesn't trigger a prompt</summary>

1. Open [`wipecord.user.js`](https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js) and copy
   the whole file.
2. Open your userscript manager's dashboard → **+** / **Create a new script**.
3. Select everything in the editor, paste over it, and save (<kbd>Ctrl</kbd>+<kbd>S</kbd>).

</details>

## Panel layout

The settings sidebar contains **Where to clean**, **Filter messages**, **Date & message range**, **Advanced settings**, and **Wipe Archive**. Only target settings are expanded initially. Message-ID bounds are inside **Date & message range → Use message IDs instead**.

The **Activity** area shows the log and progress. Use **☰** to hide or restore settings, **Delete messages** to begin with a confirmation, and **Stop** to end a run. Disabled actions stay visible. **Clear log** clears the display; it does not stop an active cleanup. Streamer mode starts enabled. The panel supports light/dark themes, narrow screens, dragging and resizing.

## The panel, field by field

### Author ID

Whose messages to delete. Click **me** to fill in your own user ID.

Author ID is required for DMs, group DMs, and multi-server batches. In a single server target, you may leave it empty
only if you have *Manage Messages* and genuinely want to delete other people's matching messages too. Anything you
lack permission to delete is skipped automatically.

### Server ID

Which server or servers to search.

- **Current server** — click **current**, or paste one server ID.
- **Several servers** — paste a comma- or space-separated list. Each server is purged in full, one after another.
- **Every server** — click **all**. Wipecord reads Discord's already-loaded server list when available, otherwise it
  makes one authenticated request to Discord's own API. This only fills the field; review it before pressing Delete.
- **Direct and group messages** — use the literal string `@me`. It cannot be mixed with server IDs, and both Author
  ID and Channel ID are required.

Leave *Channel ID* empty when selecting more than one server. Wipecord cannot safely infer which manually entered
channels belong to which servers, so it rejects that ambiguous combination instead of guessing.

*Author ID* is required for multi-server batches. The **all** button fills it with your account automatically when
Wipecord can detect it.

### Channel ID

Which channel to search. Channel IDs can only be combined when *Server ID* contains one server or `@me`.

- **One channel** — paste one ID, or click **current**.
- **Several channels** — paste a comma- or space-separated list. Wipecord runs them as a queue, one after another,
  pausing between each so it doesn't trip the rate limiter.
- **The whole server** — leave it empty (requires *Server ID* to contain one or more real server IDs, not `@me`).

`Include NSFW channels` must be ticked to search age-restricted channels; otherwise Discord omits them.

### Wipe a Discord data archive

If you [requested your data](https://support.discord.com/hc/en-us/articles/360004027692) from Discord, you can feed
the archive's channel index straight in:

1. Unzip the package Discord emailed you.
2. **Wipe Archive** → choose `messages/index.json`.
3. Wipecord fills *Server ID* with `@me`, *Author ID* with your own, and *Channel ID* with every channel in the
   archive.
4. Press **Delete messages** and leave it running.

Wipecord checks each archive entry and scans live DMs and group DMs. Server channels, deleted conversations, and
channels you can no longer access are skipped with a warning while the queue continues. Old private messages are
still eligible for individual deletion; walking years of history can simply take a long time.

### Filter

Narrows what counts as a match. Server targets use Discord's search filters. DMs and group DMs are read in
100-message history pages and checked locally before anything is deleted:

- **Containing text** — only messages containing this text (case-insensitive).
- **has: link** / **has: file** — only messages with a link or an attachment.
- **Include pinned** — off by default, so pinned messages are left alone. Tick it to delete them too.

### Pattern

A JavaScript regular expression, case-insensitive, applied on top of everything else. Only messages whose text
matches are deleted.

Examples:

| Pattern | Matches |
|---|---|
| `^gg$` | messages that are exactly "gg" |
| `https?://` | messages containing a URL |
| `\b(sorry\|oops)\b` | messages containing "sorry" or "oops" |
| `^.{1,3}$` | very short messages |

Wipecord matches against the message text *and* the text of forwarded messages and poll questions, so those aren't
silently missed. A malformed pattern is ignored with a warning rather than deleting everything.

### Messages interval

Deletes only a slice of history, bounded by two message IDs.

- **After a message** — only messages *newer* than this one.
- **Before a message** — only messages *older* than this one.

Click **Pick** and then click any message in the chat to fill the field without hunting for IDs. Press
<kbd>Esc</kbd> to cancel picking.

### Date interval

The same idea with dates instead of message IDs. Both fields need a date **and** a time.

Note: *Messages interval* wins if you fill in both.

### Delays

Two sliders, both in milliseconds:

- **Search delay** (default **2000**) — pause between fetching pages of search results.
- **Delete delay** (default **1000**) — pause between individual deletions.

These are **floors**, not fixed values. When Discord rate-limits the script, Wipecord waits exactly as long as the
API asked, adds a growing backoff on top, and then eases that backoff back down as requests start succeeding again.
Your slider positions are never overwritten; when the script is pacing itself above them, the status bar shows
`(throttled +Nms)`.

Lower is faster but gets rate-limited sooner. If a run is being throttled constantly, raise both rather than
fighting it — being throttled repeatedly is what escalates to a temporary IP block.

### Authorization Token

Your Discord auth token, which Wipecord needs to call the API as you. Click **fill** and it reads it from the page
automatically. You should not have to touch this field.

If auto-detection fails (most often because DevTools is open — Discord hides the token then), close DevTools and
click **fill** again.

> [!CAUTION]
> **Never share this token with anyone.** It grants complete access to your account, bypassing your password and
> 2FA. If you ever paste it somewhere by accident, log out of Discord in that browser immediately, which invalidates
> it. Keep **Streamer mode** on (it is by default) when screenshotting or screen-sharing — it masks the token, IDs
> and message contents in the panel.

---

## How it works

1. **Retrieve.** Server targets use Discord's guild search endpoint, sorted newest-first in 25-result pages. DMs and
   group DMs use the documented channel-history endpoint in 100-message pages because Discord no longer documents a
   channel search endpoint.
2. **Filter.** For private chats, Wipecord locally checks the exact author, message/date interval, text, link, file,
   pinned, type, and pattern constraints. Server search applies most of those remotely. System messages Discord
   refuses to delete are always dropped.
3. **Delete.** Each remaining message is deleted individually, pacing itself against Discord's rate limits. Unlike
   bulk deletion, individual deletion has no two-week age cutoff.
4. **Page.** The cursor moves to just before the oldest raw message in the page. A private-history page with no
   matches still advances, so old messages are not hidden behind newer messages from other participants.
5. **Sweep servers.** When an indexed server search reaches the end after deleting something, Wipecord searches it
   again to catch results the index was hiding. Direct history walks do not need this sweep.

Errors are classified rather than blindly retried. A message that can never be deleted (system message, locked
thread, missing permission) is skipped once with an explanation instead of being retried forever. An expired token
or a block from Discord's edge stops the run immediately, because retrying either one only makes it worse.

**Archived threads are reopened automatically.** Discord does not allow messages to be deleted while their thread
is archived, so Wipecord reopens an unlocked thread when it encounters one and then retries the deletion. Reopening
is visible to other server members, and the thread remains active until Discord archives it again. Locked threads,
or threads you lack permission to reopen, are skipped with an explanation.

---

## Troubleshooting

<details>
<summary><b>The 🗑️ button doesn't appear</b></summary>

First check that the script is actually running: your userscript manager's icon should show `1` on a Discord tab.
If it shows `0`, the `@match` rules didn't fire — make sure you are on `discord.com/channels/...` and not the
desktop app.

If the script is running but the button isn't there, Discord has probably renamed its toolbar CSS classes again.
The panel itself still exists — open it directly from the browser console (<kbd>F12</kbd>):

```js
document.querySelector('#wipecord').style.display = ''
```

Then please [open an issue](https://github.com/rafelolv/Wipecord/issues) so the selector can be fixed.

</details>

<details>
<summary><b>"Could not automatically detect Authorization Token"</b></summary>

Close DevTools and click **fill** again. Discord deletes the stored token from local storage while DevTools is open,
as an anti-scam measure.

If you are running Wipecord inside the *desktop* app via a client mod, the stored token is encrypted and cannot be
read — use the web app instead.

</details>

<details>
<summary><b>It says "Being rate limited" over and over</b></summary>

That is the script doing its job — it backs off and keeps going. If it happens constantly, raise both delays. Very
large or old histories are slow by nature; scanning years of a busy group DM can take hours.

</details>

<details>
<summary><b>It stopped and messages are still there</b></summary>

For server targets, run it again: Discord's search index can lag behind reality, and a message it doesn't return
cannot be deleted. Wipecord already re-sweeps server searches once at the end. DMs and group DMs bypass that index
and walk the channel history directly, so check the log for an inaccessible conversation or an active filter.

Check the log for skipped messages too — locked threads, channels you have left, messages posted by someone else, or
threads you lack permission to reopen are reported individually with the reason.

</details>

<details>
<summary><b>"Blocked by Cloudflare"</b></summary>

Too many requests reached Discord's edge and your IP is temporarily blocked — potentially for up to 24 hours. Stop,
wait, and use larger delays next time. Nothing else you do will speed this up.

</details>

<details>
<summary><b>The panel is unreadable / invisible text</b></summary>

Wipecord styles itself with Discord's own theme variables. If Discord renames them, colours can fall back to
nothing. Please [open an issue](https://github.com/rafelolv/Wipecord/issues) with a screenshot and your
Discord build.

</details>

---

## Security

You are about to run a third-party script inside a page that is logged into your Discord account. Take that
seriously — with any userscript, including this one:

- **Read the source before you install it.** It is a single readable file, and the `src/` directory here is the
  unminified original. Nothing is obfuscated.
- **Check what it can reach.** The metadata block declares `@grant none` (no privileged userscript APIs) and three
  `@match` rules limited to `discord.com`. It talks to no host other than Discord's own API, which you can verify
  in the Network tab.
- **Install from a source you trust.** Prefer this repo's raw URL over a copy someone pasted elsewhere.

Wipecord has no telemetry, no analytics, and no remote configuration. Your token is sent only to Discord for authenticated API requests.

---
