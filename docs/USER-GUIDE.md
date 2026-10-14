# Wipecord user guide

[← Back to Wipecord](../README.md)

Detailed settings and troubleshooting for the Discord web app. For installation and your first cleanup, use the [quick start](../README.md#quick-start).

The userscript is the primary installation. For the alternative browser packages, see [extension installation and updates](EXTENSION.md). Both use the same panel and deletion engine; keep only one installation enabled.

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

The white **W** with a green tip identifies Wipecord in the Discord toolbar and panel header. Auto scroll sits at the bottom-right of the activity area; the empty activity state uses text only.

The settings sidebar contains **Where to clean**, **Filter messages**, **Date & message range**, **Advanced settings**, and **Wipe Archive**. Only target settings are expanded initially. Message-ID bounds are inside **Date & message range → Use message IDs instead**. Regular-expression patterns are inside **Advanced settings**.

The **Activity** area shows the log and progress. While running, a prominent status shows processed messages and **Target N of M**; smaller text shows elapsed time and provisional search estimates. Progress bars stay indeterminate while cleanup is active: a server search estimate is not a fixed maximum, and reaching it does not mean pagination or final checks have finished. Only the final summary announces completion. Private history totals remain unknown until scanning finishes. Green log entries confirm successful actions, yellow entries flag warnings or pauses, and red entries identify errors; cancellation and stopping remain neutral. Use **☰** in the header to hide or restore settings, **Delete messages** to begin with a confirmation, and **Stop** to end a run. Disabled actions stay visible. **Clear log** clears the display; it does not stop an active cleanup. Streamer mode starts disabled; enable it before sharing your screen. The panel supports light/dark themes, narrow screens, dragging and resizing.

## Confirmation

**Delete messages** opens a Wipecord confirmation window with the current target, filter snapshot, message preview and irreversible-deletion warning. Server search totals are estimates, not a fixed deletion limit. A batch explicitly warns that remaining targets continue without another confirmation.

The initial focus is **Cancel**. Nothing is deleted until you explicitly choose **Confirm deletion**. Cancel, Escape, the close button, clicking outside the dialog or hiding the panel cancels a pending confirmation. **Stop run** inside the dialog stops the cleanup and preserves the stopped outcome. If you hide the panel before a confirmation can be displayed, the pending cleanup cannot authorize deletion from a hidden window.

Streamer mode also masks target IDs, private filters, authors and preview text inside the confirmation. Hold masked text to reveal it, or cancel and change Streamer mode before restarting. Message preview starts collapsed on every confirmation and contains at most three shortened examples from the current page, never the complete cleanup list. The dialog shows the eligible count for that page alongside the sample. The main summary shows Discord's provisional server estimate, or explains that the final private-history total is unknown; neither is a guaranteed deletion count. The complete selected filters still apply. Preview and scope fields are cleared when the dialog closes. Tokens are never included in the confirmation.

If the confirmation cannot open, Wipecord cancels safely; it does not switch to a browser-native prompt. The UI uses a custom asynchronous adapter; the standalone core retains its native prompt for compatibility/testing without a UI adapter.

## Run summary

When a run finishes, **Activity** highlights the confirmed deleted count, with the outcome above and the remaining counts and duration below: deleted, ignored, failed and already gone. Ignored messages include those excluded by filters or refused permanently; already gone means the API reported that a message no longer existed. Counts cover messages encountered, not the entire account history. Messages outside the lower history boundary may never be processed or counted. Batch totals span all jobs and avoid double-counting messages encountered again during sweeps.

**Export summary** downloads a JSON report containing only application/version, timestamps, duration, outcome, aggregate counts and the number of job/run errors. It contains no tokens, target IDs, usernames, message contents, archive labels or raw API/error payloads. The summary remains available when clearing the activity log, until another run starts or the page reloads.

Invalid patterns, dates and equal or reversed effective message/date bounds block the run before API access. Message IDs still take precedence over dates on each side; mixed ID/date bounds are compared as snowflakes.

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
4. Review the loaded targets, press **Delete messages**, and review the confirmation.

Imports must be non-empty JSON objects keyed by valid channel IDs, with string or null labels. Invalid files leave all target fields unchanged. Fill a valid Author ID first if account detection is unavailable. Imports are blocked during an active run; stale asynchronous file reads cannot overwrite a newer selection.

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
silently missed. A malformed pattern blocks the run before any API request. Correct or clear it before starting.

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
> it. Keep **Streamer mode** on (enable it yourself) when screenshotting or screen-sharing — it masks the token, IDs
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

| Message or diagnostic | What to do |
| --- | --- |
| Invalid or expired session / HTTP 401 | Sign in to Discord again, refresh the page and retry. The run stops rather than repeating unauthorized requests. |
| Access or permission denied / HTTP 403 | Check that you can open the target and delete your own messages there. Repeated requests do not restore permissions. |
| Target unavailable / HTTP 404 | Check the target IDs and whether the conversation or channel still exists and is accessible. An already-gone message is counted separately. |
| Locked thread or system message | These messages are skipped. A locked thread needs someone with permission to unlock it; system messages cannot be deleted. |
| Request rejected / HTTP 400 | Review target IDs and filters; update Wipecord if the problem persists. |
| Server error / HTTP 5xx | Wait before retrying after the current run ends. Check whether Discord is available if the problem persists. |
| Connection failed or timed out | Check your connection. Wipecord keeps bounded retries; review the summary if it cannot recover. |

Logs retain numeric HTTP statuses and Discord error codes for support, without repeating API response bodies or request exception payloads. Report those numbers with your browser and Wipecord version; never include tokens or private messages. Always review the final summary before retrying a partially completed run.

<details>
<summary><b>The Wipecord logo button doesn't appear</b></summary>

Look for the Wipecord logo in Discord's top-right toolbar, next to the search box. First check that the script is actually running: your userscript manager's icon should show `1` on a Discord tab.
If it shows `0`, the `@match` rules didn't fire — make sure you are on `discord.com/channels/...` and not the
desktop app.

Wipecord waits for a visible channel header to remain mounted across two checks before creating its interface. It does not initialize on login or loading screens, or attach to message toolbars. Open a conversation or channel and allow a few seconds for the header to finish loading.

If the button still does not appear, Discord may have changed its header structure. Please [open an issue](https://github.com/rafelolv/Wipecord/issues) with your browser and Wipecord versions and the console error, excluding tokens and private data.

For a locally installed extension, reload Wipecord in your browser's extension manager after rebuilding or replacing its folder, then reload Discord. Refreshing Discord alone does not reload the extension manifest or its cached code.

</details>

<details>
<summary><b>"Could not detect your Discord session"</b></summary>

Open a conversation in the Discord web app while signed in, refresh the page and update Wipecord. Retry session detection with **fill** in Advanced settings. Never paste a token into an issue or share it with someone helping you.

If you are running Wipecord inside the *desktop* app via a client mod, the stored token is encrypted and cannot be
read — use the web app instead.

</details>

<details>
<summary><b>It says "Discord requested a pause" over and over</b></summary>

During a cleanup, Wipecord waits for the requested pause and resumes automatically within its retry limit. If it happens constantly, raise both delays. Loading the server list with **all** is different: wait for the indicated interval and click **all** again; that request is not retried automatically. Very
large or old histories are slow by nature; scanning years of a busy group DM can take hours.

</details>

<details>
<summary><b>It stopped and messages are still there</b></summary>

Server searches bypass the browser's HTTP cache. An initially empty search is checked up to three more times, with pauses; default search delays add about 12 seconds of settling time, plus request time or rate-limit waits. Stop remains available during those pauses.

Messages that Discord has not made available to search still cannot be deleted. If the limited checks find nothing but you can see matching messages, wait and start another run with the same filters. A page reload should not be needed to reset Wipecord's cursor. Searches that confirm a deletion can also re-sweep for missed results. DMs and group DMs walk channel history directly and do not use the extra initial search checks.

Malformed or unexpected search responses end the affected target with an error instead of appearing as an empty successful search.

Check the log for skipped messages too — locked threads, channels you have left, messages posted by someone else, or
threads you lack permission to reopen are reported individually with the reason.

</details>

<details>
<summary><b>"Discord temporarily blocked requests"</b></summary>

Wipecord stops instead of retrying the block automatically. Stop other deletion tools too, wait before trying again, and use longer request delays next time. The block response does not establish an exact recovery time.

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
