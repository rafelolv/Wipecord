// ==UserScript==
// @name        Wipecord
// @description Bulk-delete your own messages in a Discord channel, DM or server
// @version     1.5.1
// @author      Rafael (rafelolv)
// @homepageURL https://github.com/rafelolv/Wipecord
// @supportURL  https://github.com/rafelolv/Wipecord/issues
// @match       https://*.discord.com/app
// @match       https://*.discord.com/channels/*
// @match       https://*.discord.com/login
// @license     MIT
// @namespace   https://github.com/rafelolv/Wipecord
// @icon        https://raw.githubusercontent.com/rafelolv/Wipecord/main/images/icon.svg?v=1.5.0
// @downloadURL https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js
// @grant       none
// @updateURL   https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js
// ==/UserScript==

/*
MIT License

Copyright (c) 2026 Rafael (rafelolv), Wipecord modifications

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function () {
	'use strict';

	/* rollup-plugin-baked-env */
	const VERSION = "1.5.1";

	var themeCss = (`
/* Self-contained colors keep the panel readable when Discord changes its tokens. */
#wipecord { --wipe-bg: #090909; --wipe-panel: #151515; --wipe-input: #111111; --wipe-hover: #202020; --wipe-line: #282828; --wipe-text: #f5f5f5; --wipe-muted: #a3a3a3; --wipe-accent: #58d68d; --wipe-accent-ink: #071b0e; --wipe-danger: #ff8585; --wipe-warning: #e9c46a; --wipe-scope-warning: #ff8585; color-scheme: dark; }
.theme-light #wipecord { --wipe-bg: #ffffff; --wipe-panel: #f5f5f5; --wipe-input: #ffffff; --wipe-hover: #ededed; --wipe-line: #d8d8d8; --wipe-text: #151515; --wipe-muted: #616161; --wipe-accent: #187d3b; --wipe-accent-ink: #ffffff; --wipe-danger: #b42323; --wipe-warning: #866000; --wipe-scope-warning: #b42323; color-scheme: light; }
#wipecord, #wipecord * { box-sizing: border-box; }
#wipecord button, #wipecord input, #wipecord summary { font: inherit; }
#wipecord h3, #wipecord h4, #wipecord p { margin: 0; }
#wipecord a { color: var(--wipe-accent); text-decoration: none; }
#wipecord a:hover { text-decoration: underline; }
#wipecord button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; min-height: 32px; padding: 6px 11px; border: 1px solid var(--wipe-line); border-radius: 5px; background: var(--wipe-panel); color: var(--wipe-text); font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s ease, border-color .15s ease; }
#wipecord button:hover:not(:disabled) { background: var(--wipe-hover); border-color: var(--wipe-muted); }
#wipecord button:disabled { opacity: .4; cursor: not-allowed; }
#wipecord :focus-visible { outline: 2px solid var(--wipe-accent); outline-offset: 3px; }
#wipecord input[type="text"], #wipecord input[type="password"], #wipecord input[type="datetime-local"] { width: 100%; min-width: 0; height: 40px; padding: 9px 11px; border: 1px solid var(--wipe-line); border-radius: 5px; background: var(--wipe-input); color: var(--wipe-text); font-size: 13px; }
#wipecord input::placeholder { color: var(--wipe-muted); opacity: .8; }
#wipecord #guildId.broad-scope, #wipecord #getGuilds.broad-scope { border-color: var(--wipe-scope-warning); color: var(--wipe-scope-warning); }
#wipecord #getGuilds.broad-scope:hover { border-color: var(--wipe-scope-warning); }
#wipecord .scope-warning { margin-top: 8px; color: var(--wipe-scope-warning); font-size: 12px; line-height: 1.6; }
#wipecord .scope-warning strong { display: block; font-size: 12px; font-weight: 600; }
#wipecord .scope-warning p { margin-top: 3px; color: var(--wipe-muted); font-size: 11px; }
#wipecord .scope-warning[hidden] { display: none; }
#wipecord input[type="checkbox"] { width: 15px; height: 15px; margin: 0; flex-shrink: 0; accent-color: var(--wipe-accent); }
#wipecord input[type="range"] { min-width: 0; width: 100%; accent-color: var(--wipe-accent); cursor: pointer; }
#wipecord input[type="file"] { width: 100%; min-width: 0; font-size: 13px; color: var(--wipe-muted); }
#wipecord input::file-selector-button { padding: 8px; margin-right: 8px; border: 1px solid var(--wipe-line); border-radius: 6px; background: var(--wipe-input); color: var(--wipe-text); cursor: pointer; }
#wipecord .check { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 1.5; color: var(--wipe-muted); cursor: pointer; }
#wipecord .check-list { display: grid; gap: 10px; margin: 4px 0 18px; }
#wipecord .sectionDescription { margin-top: 8px; color: var(--wipe-muted); font-size: 12px; line-height: 1.6; }
#wipecord .sectionDescription strong { color: var(--wipe-text); font-weight: 500; }
#wipecord code { font-family: ui-monospace, monospace; font-size: 11px; }
#wipecord .scroll { scrollbar-width: thin; scrollbar-color: var(--wipe-line) transparent; }
#wipecord .scroll::-webkit-scrollbar { width: 6px; height: 6px; }
#wipecord .scroll::-webkit-scrollbar-thumb { background: var(--wipe-line); border-radius: 5px; }
#wipecord .scroll::-webkit-scrollbar-track { background: transparent; }
/* Keep privacy behavior independent of the visual layout. */
#wipecord.redact .priv { display: none !important; }
#wipecord.redact x:not(:active) { color: transparent !important; background: var(--wipe-line) !important; border-radius: 3px; user-select: none; cursor: default; }
#wipecord.redact x:hover { position: relative; }
#wipecord.redact x:hover::after { content: "Hidden by Streamer mode"; position: absolute; bottom: 100%; left: 0; padding: 8px; width: 170px; background: var(--wipe-panel); color: var(--wipe-text); border: 1px solid var(--wipe-line); border-radius: 6px; white-space: normal; font: 11px/1.5 system-ui, sans-serif; pointer-events: none; }
#wipecord.redact [priv] { -webkit-text-security: disc !important; }
#wipecord .log { margin-bottom: 8px; line-height: 1.65; }
#wipecord .log-debug { color: var(--wipe-muted); }
#wipecord .log-info { color: var(--wipe-text); }
#wipecord .log-verb { color: var(--wipe-muted); }
#wipecord .log-warn { color: var(--wipe-warning); border-left: 2px solid var(--wipe-warning); padding-left: 10px; }
#wipecord .log-error { color: var(--wipe-danger); border-left: 3px solid var(--wipe-danger); padding-left: 10px; font-weight: 600; }
#wipecord .log-success { color: var(--wipe-accent); }
@media (prefers-reduced-motion: reduce) { #wipecord button { transition: none; }
}

`);

	var mainCss = (`
#wipecord-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin: 0 6px; padding: 0; border: 0; border-radius: 6px; background: #090909; cursor: pointer; flex: 0 0 auto; }
#wipecord-btn:hover { outline: 2px solid #58d68d; }
#wipecord-btn:focus-visible { outline: 2px solid #58d68d; outline-offset: 3px; }
#wipecord-btn progress { position: absolute; bottom: -5px; left: 0; width: 32px; height: 3px; display: none; accent-color: #58d68d; }
#wipecord-btn.running { box-shadow: 0 0 0 2px #58d68d; }
#wipecord-btn.running progress { display: block; }
#wipecord { position: fixed; z-index: 100; top: 64px; right: 20px; display: flex; flex-direction: column; width: 960px; height: 700px; min-width: min(600px, calc(100vw - 24px)); min-height: min(480px, calc(100dvh - 80px)); max-width: calc(100vw - 24px); max-height: calc(100dvh - 80px); overflow: hidden; border: 1px solid var(--wipe-line); border-radius: 10px; background: var(--wipe-bg); color: var(--wipe-text); box-shadow: 0 8px 28px #0003; font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; isolation: isolate; }
#wipecord .header { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 12px; flex-shrink: 0; min-height: 64px; padding: 12px 22px; border-bottom: 1px solid var(--wipe-line); cursor: grab; }
#wipecord.drag .header { cursor: grabbing; }
#wipecord .brand-mark { flex-shrink: 0; }
#wipecord .brand-copy { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
#wipecord .header-actions { display: flex; justify-content: flex-end; gap: 4px; }
#wipecord .header .brand-mark { color: var(--wipe-text); }
#wipecord .header .logo-background { display: none; }
#wipecord .brand-copy h3 { font-size: 20px; font-weight: 600; letter-spacing: -.4px; color: var(--wipe-text); }
#wipecord .version { color: var(--wipe-muted); font: 11px ui-monospace, monospace; }
#wipecord .icon-button { width: 32px; height: 32px; padding: 0; }
#wipecord #toggleSidebar { border: 0; background: transparent; color: var(--wipe-muted); font-size: 16px; font-weight: 400; }
#wipecord #hide { border: 0; background: transparent; color: var(--wipe-muted); font-size: 24px; font-weight: 400; }
#wipecord .window-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
#wipecord .sidebar { flex: 0 0 350px; width: 350px; min-width: 0; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--wipe-line); background: var(--wipe-bg); }
#wipecord .settings-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 22px; }
#wipecord h4 { font-size: 18px; font-weight: 600; letter-spacing: -.3px; }
#wipecord .settings-section { flex-shrink: 0; margin: 0; border: 0; border-bottom: 1px solid var(--wipe-line); border-radius: 0; overflow: visible; }
#wipecord summary { position: relative; display: block; margin: 0 -8px; padding: 16px 30px 16px 8px; border-radius: 5px; color: var(--wipe-text); font-size: 14px; font-weight: 600; cursor: pointer; list-style: none; }
#wipecord summary::-webkit-details-marker { display: none; }
#wipecord summary::after { content: ""; position: absolute; top: 22px; right: 12px; width: 6px; height: 6px; border-right: 1.5px solid var(--wipe-muted); border-bottom: 1.5px solid var(--wipe-muted); transform: rotate(-45deg); }
#wipecord details[open] > summary::after { transform: rotate(45deg); }
#wipecord .settings-scroll > .settings-section:first-child > summary { font-size: 16px; }
#wipecord summary:hover { background: var(--wipe-hover); }
#wipecord .section-body { padding: 0 0 18px; }
#wipecord .section-body > .sectionDescription:first-child { margin: 0 0 16px; }
#wipecord .field { margin-bottom: 16px; }
#wipecord .field:last-child { margin-bottom: 0; }
#wipecord .field-heading { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; margin-bottom: 7px; }
#wipecord .field-heading label { color: var(--wipe-text); font-size: 12px; font-weight: 500; }
#wipecord .field-heading a { font-size: 11px; color: var(--wipe-muted); }
#wipecord .multiInput { display: flex; align-items: center; gap: 5px; min-width: 0; }
#wipecord .multiInput input { flex: 1; min-width: 0; }
#wipecord .multiInput button { padding: 6px 8px; min-height: 40px; font-size: 12px; }
#wipecord .range-row { display: flex; align-items: center; gap: 10px; }
#wipecord .range-row div { min-width: 60px; color: var(--wipe-accent); text-align: right; font: 11px ui-monospace, monospace; }
#wipecord .info { display: flex; justify-content: flex-start; gap: 20px; margin: 0; padding: 14px 22px; border-top: 1px solid var(--wipe-line); flex-shrink: 0; font-size: 11px; }
#wipecord .info a { color: var(--wipe-muted); }
#wipecord .main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; }
#wipecord.hide-sidebar .sidebar { display: none; }
#wipecord .activity-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 22px 22px 18px; flex-shrink: 0; }
#wipecord .quiet-button { background: transparent; border-color: transparent; color: var(--wipe-muted); }
#wipecord .action-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 0 22px 16px; flex-shrink: 0; }
#wipecord .action-buttons { display: flex; align-items: center; gap: 6px; }
#wipecord #start { min-height: 40px; padding: 8px 20px; border-color: var(--wipe-accent); background: var(--wipe-accent); color: var(--wipe-accent-ink); font-size: 13px; }
#wipecord #start:hover:not(:disabled) { filter: brightness(1.08); }
#wipecord #stop { min-height: 40px; color: var(--wipe-danger); }
#wipecord #stop:not(:disabled) { border-color: var(--wipe-danger); }
#wipecord .privacy-control { font-size: 12px; }
#wipecord .safety-note { margin: 0 22px 16px; color: var(--wipe-muted); font-size: 12px; line-height: 1.5; flex-shrink: 0; }
#wipecord #progressBar { width: calc(100% - 48px); min-height: 5px; height: 5px; margin: 0 24px 10px; accent-color: var(--wipe-accent); flex-shrink: 0; }
#wipecord #logArea { position: relative; flex: 1; min-height: 0; overflow: auto; padding: 8px 22px 22px; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.65 ui-monospace, "SFMono-Regular", Consolas, monospace; user-select: text; }
#wipecord #logArea:has(.empty-state) { display: flex; align-items: center; justify-content: center; white-space: normal; }
#wipecord .empty-state { width: 100%; padding: 16px 0; text-align: center; white-space: normal; font-family: system-ui, sans-serif; }
#wipecord .empty-state h4 { font-size: 15px; font-weight: 600; color: var(--wipe-muted); }
#wipecord .empty-state p { margin-top: 8px; color: var(--wipe-muted); font-size: 12px; line-height: 1.6; }
#wipecord .footer { position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 12px; min-height: 46px; padding: 12px 28px 12px 22px; flex-shrink: 0; }
#wipecord #progressPercent { flex: 1; min-width: 0; color: var(--wipe-muted); font: 10px/1.6 ui-monospace, monospace; overflow-wrap: anywhere; }
#wipecord .footer .check { flex-shrink: 0; font-size: 12px; }
#wipecord .resize-handle { position: absolute; right: 8px; bottom: 8px; width: 10px; height: 10px; border-right: 2px solid var(--wipe-line); border-bottom: 2px solid var(--wipe-line); cursor: nwse-resize; }
@media (max-width: 640px) { #wipecord { top: 12px; right: 12px; width: calc(100vw - 24px); height: calc(100dvh - 24px); min-width: 0; min-height: 0; max-height: calc(100dvh - 24px); border-radius: 8px; }
  #wipecord .header { min-height: 60px; padding: 12px 16px; }
  #wipecord .brand-copy h3 { font-size: 18px; }
  #wipecord .version { display: none; }
  #wipecord .window-body { flex-direction: column; }
  #wipecord .sidebar { flex: 1 1 45%; width: 100%; min-height: 0; border-right: 0; border-bottom: 1px solid var(--wipe-line); }
  #wipecord .settings-scroll { padding: 8px 16px; }
  #wipecord .info { padding: 10px 16px; }
  #wipecord .main { flex: 0 0 300px; min-height: 280px; }
  #wipecord .section-body > .sectionDescription:first-child { display: none; }
  #wipecord .activity-heading { padding: 14px 16px 10px; }
  #wipecord .action-bar { padding: 0 16px 12px; gap: 8px; }
  #wipecord .safety-note { margin: 0 16px 12px; }
  #wipecord #logArea { padding: 8px 16px 16px; }
  #wipecord .empty-state { padding: 12px 0; }
  #wipecord .empty-state h4 { font-size: 13px; }
  #wipecord .footer { padding: 10px 16px; }
}
@media (max-height: 560px) and (max-width: 640px) { #wipecord .main { flex-basis: 200px; min-height: 200px; }
  #wipecord .safety-note { display: none; }
  #wipecord .empty-state p { display: none; }
}
#wipecord .header .brand-mark { width: 34px; height: 34px; }
#wipecord #runSummary { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; margin: 0 22px 12px; padding: 12px 0; border-top: 1px solid var(--wipe-line); border-bottom: 1px solid var(--wipe-line); }
#wipecord #runSummary[hidden] { display: none; }
#wipecord #summaryText { min-width: 0; font-size: 12px; }
#wipecord #summaryOutcome { color: var(--wipe-muted); font-weight: 600; }
#wipecord #runSummary[data-outcome="error"] #summaryOutcome { color: var(--wipe-danger); }
#wipecord .summary-total { margin: 4px 0; color: var(--wipe-text); }
#wipecord #summaryDeleted { font-size: 30px; font-weight: 600; color: var(--wipe-accent); line-height: 1.2; }
#wipecord #summaryBreakdown, #wipecord #summaryDuration { color: var(--wipe-muted); font-size: 11px; overflow-wrap: anywhere; }
#wipecord #summaryDuration { margin-top: 3px; }
#wipecord #exportReport { font-size: 11px; }
#wipecord #progressPercent { flex: 0 0 auto; margin: 0 22px 12px; }
#wipecord .progress-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
#wipecord #progressPrimary { font: 600 16px/1.4 system-ui, sans-serif; color: var(--wipe-text); }
#wipecord #progressTarget { color: var(--wipe-accent); font: 11px/1.5 system-ui, sans-serif; }
#wipecord #progressDetails { margin-top: 5px; color: var(--wipe-muted); font: 11px/1.6 system-ui, sans-serif; }
@media (max-width: 640px) { #wipecord .main { flex-basis: 370px; min-height: 300px; }
  #wipecord #runSummary { margin: 0 16px 8px; padding: 8px 0; }
  #wipecord #summaryDeleted { font-size: 24px; }
  #wipecord .run-progress { margin: 0 16px 8px; }
  #wipecord #progressPrimary { font-size: 14px; }
  #wipecord #exportReport { padding: 5px; }
}
@media (max-height: 560px) and (max-width: 640px) { #wipecord .main { flex-basis: 290px; min-height: 290px; }
}
#wipecord .empty-state strong { font-weight: 500; color: var(--wipe-text); }
#wipecord .settings-section .settings-section { margin-top: 8px; border-bottom: 0; border-top: 1px solid var(--wipe-line); }
#wipecord dialog.confirmation { width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); padding: 0; margin: auto; border: 1px solid var(--wipe-line); border-radius: 10px; background: var(--wipe-bg); color: var(--wipe-text); box-shadow: 0 20px 60px #0008; font: 13px/1.6 system-ui, sans-serif; }
#wipecord dialog.confirmation[open] { display: flex; flex-direction: column; }
#wipecord dialog.confirmation:not([open]) { display: none; }
#wipecord dialog.confirmation::backdrop { background: #000b; }
#wipecord .confirmation-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; border-bottom: 1px solid var(--wipe-line); flex-shrink: 0; }
#wipecord .confirmation-eyebrow { margin-bottom: 3px; color: var(--wipe-accent); font-size: 11px; }
#wipecord .confirmation-header h4 { font-size: 18px; }
#wipecord .confirmation-body { padding: 18px 22px; overflow: auto; min-height: 0; }
#wipecord #confirmSummary { white-space: pre-line; }
#wipecord #confirmationWarning { margin: 12px 0; color: var(--wipe-danger); font-weight: 600; }
#wipecord .confirmation-batch { margin: 12px 0; padding: 10px 0; color: var(--wipe-warning); border-top: 1px solid var(--wipe-line); border-bottom: 1px solid var(--wipe-line); }
#wipecord #confirmBatch[hidden] { display: none; }
#wipecord #confirmScope p { margin-bottom: 5px; overflow-wrap: anywhere; }
#wipecord #confirmScope strong { color: var(--wipe-muted); font-weight: 500; }
#wipecord .confirmation-privacy { margin-bottom: 8px; color: var(--wipe-muted); font-size: 11px; }
#wipecord .confirmation pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.7 ui-monospace, monospace; }
#wipecord .confirmation-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 22px; border-top: 1px solid var(--wipe-line); flex-shrink: 0; }
#wipecord .confirmation-actions > div { display: flex; gap: 8px; flex-wrap: wrap; }
#wipecord #acceptDeletion { background: var(--wipe-accent); color: var(--wipe-accent-ink); border-color: var(--wipe-accent); }
#wipecord #stopConfirmation { color: var(--wipe-danger); }
@media (max-width: 640px) { #wipecord .confirmation-header, #wipecord .confirmation-body, #wipecord .confirmation-actions { padding: 14px 16px; } }

`);

	var dragCss = (`
#wipecord [name^="grab-"] { position: absolute; --size: 6px; --corner-size: 16px; --offset: 0px; z-index: 9; }
#wipecord [name^="grab-"]:hover{ background: rgba(128,128,128,0.1); }
#wipecord [name="grab-t"] { top: 0px; left: var(--corner-size); right: var(--corner-size); height: var(--size); margin-top: var(--offset); cursor: ns-resize; }
#wipecord [name="grab-r"] { top: var(--corner-size); bottom: var(--corner-size); right: 0px; width: var(--size); margin-right: var(--offset); cursor: ew-resize; }
#wipecord [name="grab-b"] { bottom: 0px; left: var(--corner-size); right: var(--corner-size); height: var(--size); margin-bottom: var(--offset); cursor: ns-resize; }
#wipecord [name="grab-l"] { top: var(--corner-size); bottom: var(--corner-size); left: 0px; width: var(--size); margin-left: var(--offset); cursor: ew-resize; }
#wipecord [name="grab-tl"] { top: 0px; left: 0px; width: var(--corner-size); height: var(--corner-size); margin-top: var(--offset); margin-left: var(--offset); cursor: nwse-resize; }
#wipecord [name="grab-tr"] { top: 0px; right: 0px; width: var(--corner-size); height: var(--corner-size); margin-top: var(--offset); margin-right: var(--offset); cursor: nesw-resize; }
#wipecord [name="grab-br"] { bottom: 0px; right: 0px; width: var(--corner-size); height: var(--corner-size); margin-bottom: var(--offset); margin-right: var(--offset); cursor: nwse-resize; }
#wipecord [name="grab-bl"] { bottom: 0px; left: 0px; width: var(--corner-size); height: var(--corner-size); margin-bottom: var(--offset); margin-left: var(--offset); cursor: nesw-resize; }

`);

	var buttonHtml = {"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","wipecord-btn",null,null],["type","button",null,null],["aria-label","Open Wipecord",null,null],["title","Clean up messages with Wipecord",null,null]],"children":[{"tag":"svg","namespace":"http://www.w3.org/2000/svg","attributes":[["xmlns","http://www.w3.org/2000/svg","http://www.w3.org/2000/xmlns/",null],["viewBox","0 0 128 128",null,null],["fill","none",null,null],["color","#F5F5F5",null,null],["class","brand-mark",null,null],["aria-hidden","true",null,null],["width","26",null,null],["height","26",null,null]],"children":["\n  ",{"tag":"title","namespace":"http://www.w3.org/2000/svg","attributes":[],"children":["Wipecord"]},"\n  ",{"tag":"rect","namespace":"http://www.w3.org/2000/svg","attributes":[["class","logo-background",null,null],["width","128",null,null],["height","128",null,null],["rx","26",null,null],["fill","#090909",null,null]],"children":[]},"\n  ",{"tag":"path","namespace":"http://www.w3.org/2000/svg","attributes":[["class","logo-body",null,null],["d","M13 30H28C32 30 34 32 36 37L48 69L59 44C61 40 63 39 67 39H70C74 39 76 41 78 45L88 69L95 54L119 44L100 93C98 98 95 100 90 100H83C79 100 76 98 74 94L65 74L55 94C53 98 50 100 46 100H39C34 100 31 98 29 93L9 37C7 32 9 30 13 30Z",null,null],["fill","currentColor",null,null]],"children":[]},"\n  ",{"tag":"path","namespace":"http://www.w3.org/2000/svg","attributes":[["d","M103 30H119C123 30 125 33 123 37L122 39L97 49L102 34C102 32 102 31 103 30Z",null,null],["fill","#58D68D",null,null]],"children":[]},"\n"]},{"tag":"progress","namespace":"http://www.w3.org/1999/xhtml","attributes":[["aria-label","Cleanup progress",null,null]],"children":[]}]};

	var wipecordTemplate = {"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","wipecord",null,null],["class","browser container",null,null],["role","dialog",null,null],["aria-labelledby","wipecord-title",null,null],["style","display:none;",null,null]],"children":["\n  ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","header",null,null]],"children":["\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","brand-copy",null,null]],"children":[{"tag":"h3","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","wipecord-title",null,null]],"children":["Wipecord"]},{"tag":"span","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","version",null,null]],"children":["v{{VERSION}}"]}]},"\n    ",{"tag":"svg","namespace":"http://www.w3.org/2000/svg","attributes":[["xmlns","http://www.w3.org/2000/svg","http://www.w3.org/2000/xmlns/",null],["viewBox","0 0 128 128",null,null],["fill","none",null,null],["color","#F5F5F5",null,null],["class","brand-mark",null,null],["aria-hidden","true",null,null],["width","34",null,null],["height","34",null,null]],"children":["\n  ",{"tag":"title","namespace":"http://www.w3.org/2000/svg","attributes":[],"children":["Wipecord"]},"\n  ",{"tag":"rect","namespace":"http://www.w3.org/2000/svg","attributes":[["class","logo-background",null,null],["width","128",null,null],["height","128",null,null],["rx","26",null,null],["fill","#090909",null,null]],"children":[]},"\n  ",{"tag":"path","namespace":"http://www.w3.org/2000/svg","attributes":[["class","logo-body",null,null],["d","M13 30H28C32 30 34 32 36 37L48 69L59 44C61 40 63 39 67 39H70C74 39 76 41 78 45L88 69L95 54L119 44L100 93C98 98 95 100 90 100H83C79 100 76 98 74 94L65 74L55 94C53 98 50 100 46 100H39C34 100 31 98 29 93L9 37C7 32 9 30 13 30Z",null,null],["fill","currentColor",null,null]],"children":[]},"\n  ",{"tag":"path","namespace":"http://www.w3.org/2000/svg","attributes":[["d","M103 30H119C123 30 125 33 123 37L122 39L97 49L102 34C102 32 102 31 103 30Z",null,null],["fill","#58D68D",null,null]],"children":[]},"\n"]},"\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","header-actions",null,null]],"children":[{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","toggleSidebar",null,null],["type","button",null,null],["class","icon-button",null,null],["aria-label","Hide settings",null,null],["aria-expanded","true",null,null],["title","Toggle settings",null,null]],"children":["☰"]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","hide",null,null],["type","button",null,null],["class","icon-button",null,null],["aria-label","Close Wipecord",null,null],["title","Close",null,null]],"children":["×"]}]},"\n  "]},"\n  ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","window-body",null,null]],"children":["\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sidebar",null,null],["aria-label","Cleanup settings",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-scroll scroll",null,null]],"children":["\n            ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null],["open","",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Where to clean"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","authorId",null,null]],"children":["Author ID"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#author-id",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with author id",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","authorId",null,null],["type","text",null,null],["placeholder","Your user ID",null,null],["aria-describedby","authorId-hint",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","getAuthor",null,null],["type","button",null,null]],"children":["me"]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","authorId-hint",null,null]],"children":["Select ",{"tag":"strong","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["me"]}," to delete your own messages."]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","guildId",null,null]],"children":["Server ID"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#server-id",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with server id",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","guildId",null,null],["type","text",null,null],["placeholder","Server ID or @me",null,null],["aria-describedby","serverScopeWarning",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","getGuild",null,null],["type","button",null,null]],"children":["current"]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","getGuilds",null,null],["type","button",null,null],["title","Select every server on your account and all their channels",null,null],["aria-describedby","serverScopeWarning",null,null]],"children":["all"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","serverScopeWarning",null,null],["class","scope-warning",null,null],["role","status",null,null],["hidden","",null,null]],"children":[{"tag":"strong","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","serverScopeTitle",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","serverScopeDetails",null,null]],"children":[]}]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","channelId",null,null]],"children":["Channel ID"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#channel-id",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with channel id",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","channelId",null,null],["type","text",null,null],["placeholder","Channel or conversation ID",null,null],["aria-describedby","channelId-hint",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","getChannel",null,null],["type","button",null,null]],"children":["current"]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","channelId-hint",null,null]],"children":["Leave empty to search the entire server."]}]},{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","includeNsfw",null,null],["type","checkbox",null,null]],"children":[]},"Include NSFW channels"]}]}]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Filter messages"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","search",null,null]],"children":["Containing text"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#filter",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with filter",null,null]],"children":["Help"]}]},{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","search",null,null],["type","text",null,null],["placeholder","Find words or a phrase",null,null],["priv","",null,null]],"children":[]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check-list",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","hasLink",null,null],["type","checkbox",null,null]],"children":[]},"Only messages with links"]},{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","hasFile",null,null],["type","checkbox",null,null]],"children":[]},"Only messages with files"]},{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","includePinned",null,null],["type","checkbox",null,null]],"children":[]},"Include pinned messages"]}]}]}]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Date & message range"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","minDate",null,null]],"children":["After date"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#date-interval",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with date interval",null,null]],"children":["Help"]}]},{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","minDate",null,null],["type","datetime-local",null,null]],"children":[]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","maxDate",null,null]],"children":["Before date"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#date-interval",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with date interval",null,null]],"children":["Help"]}]},{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","maxDate",null,null],["type","datetime-local",null,null]],"children":[]}]},{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Use message IDs instead"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","minId",null,null]],"children":["After message"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#messages-interval",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with messages interval",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","minId",null,null],["type","text",null,null],["placeholder","Message ID",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","pickMessageAfter",null,null],["type","button",null,null]],"children":["Pick"]}]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","maxId",null,null]],"children":["Before message"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#messages-interval",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with messages interval",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","maxId",null,null],["type","text",null,null],["placeholder","Message ID",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","pickMessageBefore",null,null],["type","button",null,null]],"children":["Pick"]}]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null]],"children":["Message IDs take priority over dates. Leave empty to use dates."]}]}]}]}]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Advanced settings"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","pattern",null,null]],"children":["Pattern (optional)"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#pattern",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with pattern",null,null]],"children":["Help"]}]},{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","pattern",null,null],["type","text",null,null],["placeholder","Regular expression",null,null],["priv","",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","pattern-hint",null,null]],"children":["Use a regular expression for more specific matches."]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","searchDelay",null,null]],"children":["Search delay"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#delays",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with delays",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","range-row",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","searchDelay",null,null],["type","range",null,null],["value","2000",null,null],["step","100",null,null],["min","100",null,null],["max","60000",null,null]],"children":[]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","searchDelayValue",null,null]],"children":[]}]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","deleteDelay",null,null]],"children":["Delete delay"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#delays",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with delays",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","range-row",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","deleteDelay",null,null],["type","range",null,null],["value","1000",null,null],["step","50",null,null],["min","50",null,null],["max","10000",null,null]],"children":[]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","deleteDelayValue",null,null]],"children":[]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","deleteDelay-hint",null,null]],"children":["Default delays are a good starting point. Wipecord waits when Discord asks it to slow down."]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","token",null,null]],"children":["Authorization token"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#authorization-token",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with authorization token",null,null]],"children":["Help"]}]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","multiInput",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","token",null,null],["type","password",null,null],["autocomplete","off",null,null],["placeholder","Detected when you start",null,null],["priv","",null,null]],"children":[]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","getToken",null,null],["type","button",null,null]],"children":["fill"]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","token-hint",null,null]],"children":["Usually detected automatically. Never share your token."]}]}]}]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","settings-section",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Wipe Archive"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","section-body",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","field-heading",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["for","importJsonInput",null,null]],"children":["Import conversations"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}#wipe-a-discord-data-archive",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null],["aria-label","Help with wipe a discord data archive",null,null]],"children":["Help"]}]},{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["type","file",null,null],["id","importJsonInput",null,null],["accept","application/json,.json",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","sectionDescription",null,null],["id","importJsonInput-hint",null,null]],"children":["Choose ",{"tag":"code","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["messages/index.json"]}," from your Discord data archive. Review the loaded targets before starting."]}]}]}]},"\n      "]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","info",null,null]],"children":[{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{HOME}}",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null]],"children":["GitHub"]},{"tag":"a","namespace":"http://www.w3.org/1999/xhtml","attributes":[["href","{{WIKI}}",null,null],["target","_blank",null,null],["rel","noopener noreferrer",null,null]],"children":["User guide ↗"]}]},"\n    "]},"\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","main col",null,null]],"children":["\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","activity-heading",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":[{"tag":"h4","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Activity"]}]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","clear",null,null],["type","button",null,null],["class","quiet-button",null,null]],"children":["Clear log"]}]},"\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","tbar action-bar",null,null]],"children":["\n        ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","action-buttons",null,null]],"children":[{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","start",null,null],["type","button",null,null],["class","primary-action",null,null],["title","Review the target before deleting",null,null]],"children":["Delete messages"]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","stop",null,null],["type","button",null,null],["title","Stop the deletion process",null,null],["disabled","",null,null]],"children":["Stop"]}]},"\n        ",{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check privacy-control",null,null],["title","Hide IDs and message contents on your screen",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","redact",null,null],["type","checkbox",null,null]],"children":[]},"Streamer mode"]},"\n      "]},"\n      ",{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","safety-note",null,null]],"children":["Deleted messages cannot be restored."]},"\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","progressPercent",null,null],["class","run-progress",null,null],["role","status",null,null],["style","display:none;",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","progress-heading",null,null]],"children":[{"tag":"strong","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","progressPrimary",null,null]],"children":[]},{"tag":"span","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","progressTarget",null,null]],"children":[]}]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","progressDetails",null,null]],"children":[]}]},"\n      ",{"tag":"progress","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","progressBar",null,null],["aria-label","Cleanup progress",null,null],["style","display:none;",null,null]],"children":[]},"\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","runSummary",null,null],["hidden","",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","summaryText",null,null],["role","status",null,null]],"children":[{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","summaryOutcome",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","summary-total",null,null]],"children":[{"tag":"strong","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","summaryDeleted",null,null]],"children":["0"]}," deleted"]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","summaryBreakdown",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","summaryDuration",null,null]],"children":[]}]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","exportReport",null,null],["type","button",null,null],["class","quiet-button",null,null]],"children":["Export summary"]}]},"\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","logArea",null,null],["class","logarea scroll",null,null],["role","log",null,null],["aria-label","Cleanup activity",null,null],["aria-live","off",null,null]],"children":["\n        ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","empty-state",null,null]],"children":[{"tag":"h4","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["No activity yet"]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Choose a target, then review before deleting."]}]},"\n      "]},"\n      ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","tbar footer",null,null]],"children":[{"tag":"label","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","check",null,null]],"children":[{"tag":"input","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","autoScroll",null,null],["type","checkbox",null,null],["checked","",null,null]],"children":[]},"Auto scroll"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","resize-handle",null,null],["aria-hidden","true",null,null]],"children":[]}]},"\n    "]},"\n  "]},"\n  ",{"tag":"dialog","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmDeletion",null,null],["class","confirmation",null,null],["aria-labelledby","confirmationTitle",null,null],["aria-describedby","confirmSummary confirmationWarning",null,null]],"children":["\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","confirmation-header",null,null]],"children":[{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":[{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","confirmation-eyebrow",null,null]],"children":["Review cleanup"]},{"tag":"h4","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmationTitle",null,null]],"children":["Delete matching messages?"]}]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","closeConfirmation",null,null],["type","button",null,null],["class","icon-button",null,null],["aria-label","Cancel confirmation",null,null]],"children":["×"]}]},"\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","confirmation-body scroll",null,null]],"children":["\n      ",{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmSummary",null,null]],"children":[]},"\n      ",{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmationWarning",null,null]],"children":["Deleted messages cannot be restored."]},"\n      ",{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmBatch",null,null],["class","confirmation-batch",null,null],["hidden","",null,null]],"children":[]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["open","",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Target and filters"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmScope",null,null]],"children":[]}]},"\n      ",{"tag":"details","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmSample",null,null]],"children":[{"tag":"summary","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":["Message preview · up to 3 examples"]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmSampleNotice",null,null],["class","confirmation-privacy",null,null]],"children":[]},{"tag":"p","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmPrivacy",null,null],["class","confirmation-privacy",null,null]],"children":["Streamer mode also masks this preview. Hold the masked text to reveal it."]},{"tag":"pre","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":[{"tag":"x","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","confirmPreview",null,null]],"children":[]}]}]},"\n    "]},"\n    ",{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[["class","confirmation-actions",null,null]],"children":[{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","stopConfirmation",null,null],["type","button",null,null],["class","quiet-button",null,null]],"children":["Stop run"]},{"tag":"div","namespace":"http://www.w3.org/1999/xhtml","attributes":[],"children":[{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","cancelDeletion",null,null],["type","button",null,null],["autofocus","",null,null]],"children":["Cancel"]},{"tag":"button","namespace":"http://www.w3.org/1999/xhtml","attributes":[["id","acceptDeletion",null,null],["type","button",null,null]],"children":["Confirm deletion"]}]}]},"\n  "]},"\n"]};

	const log = {
	  debug() { return logFn ? logFn('debug', arguments) : console.debug.apply(console, arguments); },
	  info() { return logFn ? logFn('info', arguments) : console.info.apply(console, arguments); },
	  verb() { return logFn ? logFn('verb', arguments) : console.log.apply(console, arguments); },
	  warn() { return logFn ? logFn('warn', arguments) : console.warn.apply(console, arguments); },
	  error() { return logFn ? logFn('error', arguments) : console.error.apply(console, arguments); },
	  success() { return logFn ? logFn('success', arguments) : console.info.apply(console, arguments); },
	};

	var logFn; // custom console.log function
	const setLogFn = (fn) => logFn = fn;

	// Helpers

	/** Discord snowflakes count milliseconds from 2015-01-01T00:00:00Z. */
	const DISCORD_EPOCH = 1420070400000;

	const wait = async ms => new Promise(done => setTimeout(done, Math.max(0, Number(ms) || 0)));
	const msToHMS = ms => Number.isFinite(ms) && ms >= 0
	  ? `${ms / 3.6e6 | 0}h ${(ms % 3.6e6) / 6e4 | 0}m ${(ms % 6e4) / 1000 | 0}s`
	  : '--h --m --s';
	const escapeHTML = html => String(html).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#039;' })[m]);
	const redact = str => `<x>${escapeHTML(str)}</x>`;
	const queryString = params => params.filter(p => p[1] !== undefined && p[1] !== null && p[1] !== '').map(p => p[0] + '=' + encodeURIComponent(p[1])).join('&');
	const ask = async msg => new Promise(resolve => setTimeout(() => resolve(window.confirm(msg)), 10));
	const replaceInterpolations = (str, obj, removeMissing = false) => str.replace(/\{\{([\w_]+)\}\}/g, (m, key) => obj[key] || (removeMissing ? '' : m));

	const clamp = (value, min, max) => value < min ? min : value > max ? max : value;

	/** Discord ids are 17-20 digit snowflakes. */
	const isSnowflake = value => /^\d{17,20}$/.test(String(value).trim());

	/**
	 * Accept either a snowflake or a date and return a snowflake string.
	 * BigInt is required here: the shift overflows Number.MAX_SAFE_INTEGER, which
	 * used to quantize every date-range bound to a garbage value.
	 * Returns undefined for anything unusable so queryString drops the parameter.
	 */
	const toSnowflake = (value) => {
	  if (value === undefined || value === null) return undefined;
	  const str = String(value).trim();
	  if (!str) return undefined;
	  if (isSnowflake(str)) return str;
	  const time = Date.parse(str);
	  if (Number.isNaN(time)) return undefined;
	  // Anything before Discord existed is the same as no bound at all.
	  return ((BigInt(Math.max(time, DISCORD_EPOCH)) - BigInt(DISCORD_EPOCH)) << 22n).toString();
	};

	/**
	 * Render a user the way Discord does today. Migrated ("pomelo") accounts have
	 * a literal "0" discriminator, so the old username#discriminator form prints
	 * names like "someone#0".
	 */
	const displayName = (user) => {
	  if (!user) return 'unknown';
	  if (user.global_name) return user.global_name;
	  if (user.discriminator && user.discriminator !== '0') return `${user.username}#${user.discriminator}`;
	  return user.username || 'unknown';
	};

	function bound(value, label) {
	  if (value == null || String(value).trim() === '') return undefined;
	  const text = String(value).trim();
	  if (isSnowflake(text)) return text;
	  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/);
	  if (!match || !Number.isFinite(Date.parse(text))) throw Error(`${label} must be a valid date or message ID.`);
	  const [, year, month, day] = match.map(Number);
	  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
	  if (month < 1 || month > 12 || day < 1 || day > days) throw Error(`${label} must be a valid calendar date.`);
	  const time = text.match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);
	  if (time && (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3] || 0) > 59)) throw Error(`${label} must be a valid time.`);
	  return toSnowflake(text);
	}

	/** Reject invalid filters before any request; never silently drop a constraint. */
	function validateFilters({ pattern, minId, maxId }) {
	  let regex;
	  try { if (pattern) regex = new RegExp(pattern, 'i'); }
	  catch { throw Error('Pattern is not a valid regular expression. Correct it before starting.'); }
	  const minimum = bound(minId, 'After bound');
	  const maximum = bound(maxId, 'Before bound');
	  if (minimum !== undefined && maximum !== undefined && BigInt(minimum) >= BigInt(maximum)) {
	    throw Error('After bound must be earlier than Before bound.');
	  }
	  return { regex, minId: minimum, maxId: maximum };
	}

	function resolveFilters({ pattern, minId, maxId, minDate, maxDate }) {
	  for (const value of [minId, maxId]) if (value && !isSnowflake(value)) throw Error('Message bounds must be valid Discord message IDs.');
	  validateFilters({ minId: minDate, maxId: maxDate });
	  validateFilters({ pattern, minId: minId || minDate, maxId: maxId || maxDate });
	  return { minId: minId || minDate || undefined, maxId: maxId || maxDate || undefined };
	}

	/** Archive labels are ignored; only validated string keys become targets. */
	function parseArchive(text) {
	  let data;
	  try { data = JSON.parse(text); } catch { throw Error('The archive is not valid JSON.'); }
	  if (data === null || Array.isArray(data) || typeof data !== 'object') throw Error('Choose messages/index.json: an object keyed by channel IDs.');
	  const ids = Object.keys(data);
	  if (!ids.length || ids.some(id => id !== id.trim() || !isSnowflake(id))) throw Error('The archive must contain only valid channel ID keys and cannot be empty.');
	  if (Object.values(data).some(value => value !== null && typeof value !== 'string')) throw Error('Archive channel labels must be strings or null. Choose messages/index.json.');
	  return ids;
	}

	/** Keep IDs only for in-memory deduplication; export a fixed anonymous schema. */
	class RunReport {
	  #outcomes = new Map();
	  #started = Date.now();
	  #reason = 'completed';
	  #errors = 0;
	  #finished;
	  #result;

	  record(id, outcome) {
	    if (this.#outcomes.get(id) !== 'deleted') this.#outcomes.set(id, outcome);
	  }
	  end(reason) {
	    if (reason === 'error') this.#errors++;
	    if (reason === 'stopped' || reason === 'cancelled' || this.#reason === 'completed') this.#reason = reason;
	  }
	  finish() {
	    this.#finished = Date.now();
	    this.#result = this.snapshot();
	    this.#outcomes.clear();
	  }
	  snapshot() {
	    if (this.#result) return { ...this.#result, counts: { ...this.#result.counts } };
	    const counts = { deleted: 0, ignored: 0, failed: 0, alreadyGone: 0 };
	    for (const outcome of this.#outcomes.values()) counts[outcome]++;
	    return {
	      schemaVersion: 1,
	      application: 'Wipecord',
	      reason: this.#reason,
	      startedAt: new Date(this.#started).toISOString(),
	      finishedAt: new Date(this.#finished ?? Date.now()).toISOString(),
	      durationMs: Math.max(0, (this.#finished ?? Date.now()) - this.#started),
	      counts,
	      runErrors: this.#errors,
	    };
	  }
	}

	// Keep API diagnostics numeric; response bodies and exceptions can contain private data.
	const SESSION_EXPIRED = 'Your Discord session is invalid or expired. Sign in to Discord again, refresh the page, then retry.';
	const TEMPORARY_BLOCK = 'Discord temporarily blocked requests. Wipecord will not retry this block automatically. Stop other deletion tools and wait before trying again; use longer request delays next time.';

	function requestError(status, code, action) {
	  let guidance;
	  if (status === 401) guidance = SESSION_EXPIRED;
	  else if (code === 160005) guidance = 'The thread is locked. It must be unlocked by someone with permission before you can retry.';
	  else if (code === 50021) guidance = 'This is a system message that Discord does not allow you to delete. Retrying will not help.';
	  else if (code === 50003) guidance = 'Discord does not support this action in a direct message. Check the selected conversation.';
	  else if (code === 50024) guidance = 'Discord cannot perform this action on the selected channel type. Check the target before retrying.';
	  else if (status === 404) guidance = 'The selected resource is unavailable or no longer exists. Check the target and whether you can still open it in Discord before retrying.';
	  else if (status === 403 || code === 50001 || code === 50013) guidance = 'Discord denied access or permission. Check that you can open the target and delete your own messages there. Repeating the request will not fix missing permissions.';
	  else if (status === 400) guidance = 'Discord rejected the request. Review the target IDs and filters. If they are correct, update Wipecord and report the problem if it persists.';
	  else if (status >= 500 && status <= 599) guidance = 'Discord returned a server error. Wait and try again after the current run ends. If it persists, check whether Discord is available.';
	  else guidance = 'Discord could not complete this request. Review the final summary before retrying. If it persists, update Wipecord and report the status and error code without account or message data.';

	  const diagnostics = [];
	  if (Number.isInteger(status) && status > 0 && status <= 599) diagnostics.push(`HTTP ${status}`);
	  if (Number.isInteger(code) && code > 0) diagnostics.push(`Discord code ${code}`);
	  return `Could not ${action}. ${guidance}${diagnostics.length ? ` (${diagnostics.join(', ')})` : ''}`;
	}

	function connectionError(action) {
	  return `Could not reach Discord to ${action}; the connection failed or timed out. Check your connection. Retries are limited; if this run cannot recover, wait and try again.`;
	}

	function exhaustedRetries(action, attempts) {
	  return `Stopped trying to ${action} after ${attempts} attempts. Check your connection and the warnings above. Wait before starting another run.`;
	}

	const PREFIX$1 = '[WIPECORD]';

	/** Absolute URLs also work in extension contexts that cannot resolve relative fetch URLs. */
	const API$1 = new URL('/api/v9', window.location.href).href;
	/** Discord search pages contain at most 25 hits; history pages contain 100 messages. */
	const PAGE_SIZE = 25;
	const HISTORY_PAGE_SIZE = 100;
	const REQUEST_TIMEOUT$1 = 30000;
	const MAX_SEARCH_ATTEMPTS = 20;
	/** How many times a finished walk may restart to sweep up stragglers. */
	const MAX_SWEEPS = 2;
	/** Transient retries for one message, separate from the user's maxAttempt. */
	const MAX_TRANSIENT_RETRIES = 5;
	const MAX_SEARCH_DELAY = 60000;
	const MAX_DELETE_DELAY = 30000;
	/** Padding on top of the retry_after Discord asks for, to survive clock skew. */
	const RETRY_MARGIN = 250;

	/**
	 * Message types Discord refuses to delete.
	 * Mirrors discord.js' UndeletableMessageTypes plus the client-only types
	 * documented as non-deletable. Everything not listed here is deletable, so new
	 * Discord message types keep working without a code change.
	 * @see https://discord.com/developers/docs/resources/message#message-object-message-types
	 */
	const UNDELETABLE_MESSAGE_TYPES = new Set([1, 2, 3, 4, 5, 21, 33, 34, 35, 56, 57, 64]);

	/**
	 * Discord error codes that will never succeed for this message. Retrying them
	 * only burns the invalid-request budget that leads to a Cloudflare ban.
	 */
	const PERMANENT_DELETE_ERRORS = {
	  50021: 'it is a system message',
	  160005: 'the thread is locked',
	  50013: 'you do not have permission to delete it',
	  50001: 'you do not have access to that channel',
	  50003: 'that action cannot be performed on a DM channel',
	};

	// Outcome of a single delete attempt.
	const DELETED = 'DELETED';           // we removed it
	const ALREADY_GONE = 'ALREADY_GONE'; // it was gone before we got there
	const RETRY = 'RETRY';               // transient, worth another attempt
	const SKIPPED = 'SKIPPED';           // permanently undeletable, move on
	const FAILED = 'FAILED';             // unknown failure, retryable

	class WipecordError extends Error {
	  constructor(message, { fatal = false, status = 0, code = 0 } = {}) {
	    super(message);
	    this.name = 'WipecordError';
	    this.fatal = fatal;
	    this.status = status;
	    this.code = code;
	  }
	}

	/** Read a response body exactly once, parsing it as JSON when possible. */
	async function readBody(resp) {
	  let text = '';
	  try { text = await resp.text(); } catch { /* body already gone */ }
	  try { return { json: JSON.parse(text), text }; } catch { return { json: null, text }; }
	}

	/**
	 * How long Discord asked us to wait, in milliseconds.
	 * Both the Retry-After header and the JSON body report seconds.
	 */
	function retryAfterMs(resp, body) {
	  const header = parseFloat(resp.headers.get('retry-after'));
	  if (Number.isFinite(header)) return header * 1000;
	  const fromBody = body && Number(body.retry_after);
	  if (Number.isFinite(fromBody) && fromBody > 0) return fromBody * 1000;
	  return 0;
	}

	/**
	 * A 429 that is not Discord JSON came from Cloudflare, which bans the IP for
	 * up to 24h. Retrying it makes things strictly worse.
	 */
	function isEdgeBlock(resp, body) {
	  if (body && body.code === 40333) return true;
	  return resp.status === 429 && !body;
	}

	/** The text of a message as a user thinks of it, including modern shapes. */
	function messageText(message) {
	  const parts = [message.content || ''];
	  // Forwarded messages carry their text in a snapshot, not in content.
	  if (Array.isArray(message.message_snapshots)) {
	    for (const snapshot of message.message_snapshots) {
	      if (snapshot && snapshot.message && snapshot.message.content) parts.push(snapshot.message.content);
	    }
	  }
	  if (message.poll && message.poll.question) parts.push(message.poll.question.text || '');
	  return parts.join('\n');
	}

	function messageHasLink(message) {
	  if (/(?:https?:\/\/|www\.)\S+/i.test(messageText(message))) return true;
	  return Array.isArray(message.embeds) && message.embeds.some(embed => embed && typeof embed.url === 'string' && embed.url);
	}

	function matchesHistoryFilters(message, options) {
	  if (!/^\d+$/.test(message.id)) return false;
	  const id = BigInt(message.id);
	  const minId = toSnowflake(options.minId);
	  const maxId = toSnowflake(options.maxId);
	  if (minId && id <= BigInt(minId)) return false;
	  if (maxId && id >= BigInt(maxId)) return false;
	  if (options.authorId && String(message.author && message.author.id) !== String(options.authorId)) return false;
	  if (options.content && !messageText(message).toLocaleLowerCase().includes(String(options.content).toLocaleLowerCase())) return false;
	  if (options.hasLink && !messageHasLink(message)) return false;
	  if (options.hasFile && !(Array.isArray(message.attachments) && message.attachments.length)) return false;
	  return true;
	}

	/** A short human label for messages that have no text of their own. */
	function messagePreview(message) {
	  const text = messageText(message);
	  if (text) return text;
	  if (message.attachments && message.attachments.length) return '[ATTACHMENTS]';
	  if (message.poll) return '[POLL]';
	  if (message.flags & (1 << 14)) return '[FORWARDED]';
	  if (message.flags & (1 << 13)) return '[VOICE MESSAGE]';
	  if (message.embeds && message.embeds.length) return '[EMBED]';
	  return '';
	}

	/**
	 * Delete all messages in a Discord channel or DM
	 */
	class WipecordCore {

	  options = {
	    authToken: null, // Your authorization token
	    authorId: null, // Author of the messages you want to delete
	    guildId: null, // Server were the messages are located
	    channelId: null, // Channel were the messages are located
	    minId: null, // Only delete messages after this, leave blank do delete all
	    maxId: null, // Only delete messages before this, leave blank do delete all
	    content: null, // Filter messages that contains this text content
	    hasLink: null, // Filter messages that contains link
	    hasFile: null, // Filter messages that contains file
	    includeNsfw: null, // Search in NSFW channels
	    includePinned: null, // Delete messages that are pinned
	    pattern: null, // Only delete messages that match the regex (insensitive)
	    searchDelay: null, // Delay each time we fetch for more messages
	    deleteDelay: null, // Delay between each delete operation
	    maxAttempt: 2, // Attempts to delete a single message if it fails
	    emptyPageRetries: 3, // Times to re-check an empty page before believing the channel is done
	    jobDelay: 10000, // Delay between channels when running a batch
	    askForConfirmation: true,
	    debug: false, // Dump raw API payloads to the browser console
	  };

	  state = {
	    running: false,
	    delCount: 0,
	    confirmedDelCount: 0, // deletes the API confirmed, i.e. not "already gone"
	    failCount: 0,
	    grandTotal: 0,
	    iterations: 0,
	    cursorId: null, // ID before which the next page is fetched
	    emptyPages: 0,
	    historyMode: false, // DMs are walked directly because channel search is unreliable
	    historyDone: false,
	    historyValidated: false,
	    historyScanned: 0,

	    _searchResponse: null,
	    _pageMessages: [], // every message that advances the cursor, including non-matches
	    _messagesToDelete: [],
	    _skippedMessages: [],
	  };

	  stats = {
	    startTime: new Date(), // start time
	    throttledCount: 0, // how many times you have been throttled
	    throttledTotalTime: 0, // the total amount of time you spent being throttled
	    lastPing: null, // the most recent ping
	    avgPing: null, // average ping used to calculate the estimated remaining time
	    etr: 0,

	    // Adaptive pacing. These are added on top of the delays the user configured
	    // and decay back to zero; options is never written to.
	    searchBackoff: 0,
	    deleteBackoff: 0,
	    searchNextAt: 0,
	    deleteNextAt: 0,
	  };

	  // events
	  onStart = undefined;
	  onProgress = undefined;
	  onStop = undefined;
	  onConfirm = undefined;
	  onCancelConfirmation = undefined;

	  /** Whether a run or batch is currently in flight. */
	  get busy() { return this.#busy; }
	  /** Aggregate position only; no targets or private data are exposed. */
	  get targetProgress() { return { index: this.#batchIndex || 1, total: this.#batchTotal || 1 }; }
	  get report() { return this.#report?.snapshot(); }
	  resetState() {
	    this.state = {
	      running: false,
	      delCount: 0,
	      confirmedDelCount: 0,
	      failCount: 0,
	      grandTotal: 0,
	      iterations: 0,
	      cursorId: null,
	      emptyPages: 0,
	      historyMode: false,
	      historyDone: false,
	      historyValidated: false,
	      historyScanned: 0,

	      _searchResponse: null,
	      _pageMessages: [],
	      _messagesToDelete: [],
	      _skippedMessages: [],
	    };

	    // Keep the cumulative throttle counters, drop everything that would poison
	    // the next run (a stale backoff would silently slow it down).
	    this.stats.searchBackoff = 0;
	    this.stats.deleteBackoff = 0;
	    this.stats.searchNextAt = 0;
	    this.stats.deleteNextAt = 0;
	    this.stats.etr = 0;

	    this.options.askForConfirmation = true;
	  }

	  /** Automate the deletion process across multiple channels or servers. */
	  async runBatch(queue) {
	    if (this.#busy) return log.error('Already running!');
	    validateFilters(this.options);
	    this.#report = new RunReport();
	    this.#busy = true;
	    this.#batchTotal = queue.length;

	    // Job options must not leak into the next job.
	    const baseOptions = { ...this.options };

	    log.info(`Running batch with queue of ${queue.length} jobs`);
	    this.state.running = true;
	    // The batch owns the lifecycle: firing these per job would unlock the UI
	    // (and kill the Stop button) during every inter-job pause.
	    if (this.onStart) this.onStart(this.state, this.stats);

	    try {
	      for (let i = 0; i < queue.length; i++) {
	        if (!this.state.running) break;

	        // Firing every job's first search back to back is a self-inflicted 429.
	        if (i > 0) {
	          log.verb(`Waiting ${(this.options.jobDelay / 1000).toFixed(1)}s before the next job...`);
	          await this.cooldown(this.options.jobDelay);
	          if (!this.state.running) break;
	        }

	        this.options = { ...baseOptions, ...queue[i] };
	        this.#batchIndex = i + 1;
	        log.info('Starting job...', `(${i + 1}/${queue.length})`);

	        try {
	          await this.run(true);
	        } catch (err) {
	          log.error(`Target ${i + 1}/${queue.length} ended with an error:`, err instanceof WipecordError ? escapeHTML(err.message) : 'An unexpected error occurred. Refresh Discord and update Wipecord before retrying.');
	          // A dead token or an edge block fails identically for every remaining
	          // job, so there is nothing to be gained by continuing.
	          if (err && err.fatal) {
	            this.state.running = false;
	            break;
	          }
	        }

	        if (!this.state.running) break;

	        log.info('Job ended.', `(${i + 1}/${queue.length})`);
	        // Carry the prompt state forward only if this job actually prompted;
	        // a job that died early must not silence the rest of the batch.
	        baseOptions.askForConfirmation = this.options.askForConfirmation;
	        this.resetState();
	        this.state.running = true; // continue running
	      }
	    } finally {
	      this.options = baseOptions;
	      this.state.running = false;
	      this.#busy = false;
	      this.#batchIndex = 0;
	      this.#batchTotal = 0;
	      log.info('Batch ended. See the final summary for its outcome.');
	      this.#report.finish();
	      if (this.onStop) this.onStop(this.state, this.stats);
	    }
	  }

	  /** Start the deletion process */
	  async run(isJob = false) {
	    if (this.#busy && !isJob) return log.error('Already running!');
	    if (!this.options.guildId) return log.error('You must fill the "Server ID" field!');
	    if (this.options.guildId === '@me' && !this.options.channelId) return log.error('You must fill the "Channel ID" field to delete direct messages!');
	    if (this.options.guildId === '@me' && !this.options.authorId) return log.error('You must fill the "Author ID" field to delete direct messages safely!');
	    validateFilters(this.options);
	    if (!isJob) this.#report = new RunReport();
	    if (!isJob) this.#busy = true;

	    this.state.running = true;
	    this.stats.startTime = new Date();
	    // The walk starts at the user's upper bound and moves backwards in time.
	    this.state.cursorId = toSnowflake(this.options.maxId) || null;
	    this.state.historyMode = this.options.guildId === '@me';

	    log.info(`\nStarted at ${this.stats.startTime.toLocaleString()}`);
	    log.debug(
	      `authorId = "${redact(this.options.authorId)}"`,
	      `guildId = "${redact(this.options.guildId)}"`,
	      `channelId = "${redact(this.options.channelId)}"`,
	      `minId = "${redact(this.options.minId)}"`,
	      `maxId = "${redact(this.options.maxId)}"`,
	      `hasLink = ${!!this.options.hasLink}`,
	      `hasFile = ${!!this.options.hasFile}`,
	    );

	    if (!isJob && this.onStart) this.onStart(this.state, this.stats); // a batch owns its own lifecycle
	    if (isJob && this.onProgress) this.onProgress(this.state, this.stats);

	    // When a walk finishes having actually removed something we sweep the
	    // channel again, because Discord's search index can hide messages that were
	    // there all along. A pass has to confirm a deletion to earn the next one,
	    // and MAX_SWEEPS bounds it regardless.
	    let deletedBeforePass = 0;
	    let sweeps = 0;

	    try {
	      do {
	        this.state.iterations++;

	        log.verb('Fetching messages...');
	        await this.pace('search');
	        if (!this.state.running) break;

	        const data = await this.search();
	        if (!this.state.running) break;
	        if (!data) break; // nothing more we can do with this channel

	        this.filterResponse(data);
	        if (this.state.historyMode && this.onProgress) this.onProgress(this.state, this.stats);

	        const found = this.state._messagesToDelete.length + this.state._skippedMessages.length;
	        if (this.state.historyMode) {
	          log.verb(
	            `Matching messages found so far: ${this.state.grandTotal}`,
	            `(Messages scanned: ${this.state.historyScanned}`,
	            `In current page: ${this.state._pageMessages.length}`,
	            `Matching filters: ${found}`,
	            `To be deleted: ${this.state._messagesToDelete.length}`,
	            `Skipped: ${this.state._skippedMessages.length})`
	          );
	        }
	        else {
	          log.verb(
	            `Grand total: ${this.state.grandTotal}`,
	            `(Messages in current page: ${found}`,
	            `To be deleted: ${this.state._messagesToDelete.length}`,
	            `Skipped: ${this.state._skippedMessages.length})`
	          );
	        }
	        this.printStats();

	        if (this.state.historyMode) {
	          this.stats.etr = 0;
	          log.verb('Estimated time remaining: unknown until the full history is scanned.');
	        }
	        else {
	          this.calcEtr();
	          log.verb(`Estimated time remaining: ${msToHMS(this.stats.etr)}`);
	        }

	        const pageSize = this.state.historyMode ? this.state._pageMessages.length : found;
	        if (pageSize === 0) {
	          // A direct history walk ends on the first empty page. Search results
	          // get extra checks because Discord's index can briefly hide hits.
	          const remaining = Number(data.total_results) || 0;
	          const initiallyEmptySearch = !this.state.historyMode && this.state.grandTotal === 0;
	          if (this.state.historyMode || (remaining === 0 && !initiallyEmptySearch) || this.state.emptyPages >= this.options.emptyPageRetries) {
	            if (!this.state.historyMode && this.state.confirmedDelCount > deletedBeforePass && sweeps < MAX_SWEEPS) {
	              sweeps++;
	              log.verb(`Checking again for matching messages Discord search may have missed... (${sweeps}/${MAX_SWEEPS})`);
	              deletedBeforePass = this.state.confirmedDelCount;
	              this.state.cursorId = toSnowflake(this.options.maxId) || null;
	              this.state.emptyPages = 0;
	              continue;
	            }
	            log.verb(this.state.historyMode
	              ? 'Reached the beginning of the channel history.'
	              : 'Discord returned no more messages for this search.');
	            if (isJob) break; // break without stopping if this is part of a job
	            this.state.running = false;
	            break;
	          }
	          this.state.emptyPages++;
	          const settle = this.state.emptyPages * Math.max(this.options.searchDelay, 2000);
	          log.warn(
	            initiallyEmptySearch
	              ? 'No matching messages appeared yet. Checking again in case Discord search has not updated.'
	              : `Discord returned an empty page but still reports ${remaining} message(s).`,
	            `Waiting ${(settle / 1000).toFixed(1)}s for Discord search to update...`,
	            `(${this.state.emptyPages}/${this.options.emptyPageRetries})`
	          );
	          await this.cooldown(settle);
	          continue;
	        }

	        this.state.emptyPages = 0;

	        if (this.state._messagesToDelete.length > 0) {
	          if (await this.confirm() === false) {
	            this.state.running = false; // break out of a job
	            break; // immmediately stop this iteration
	          }

	          await this.deleteMessagesFromList();
	        }
	        else {
	          log.verb(this.state.historyMode
	            ? 'No matching messages on this history page, checking older messages...'
	            : 'There\'s nothing we can delete on this page, checking next page...');
	        }

	        // Walk past everything this page returned. Paging by id instead of by
	        // offset means deleting messages cannot shift the window under us, and
	        // there is no 9975 offset ceiling to hit.
	        this.advanceCursor();

	      } while (this.state.running);
	    } catch (error) {
	      this.#report?.end('error');
	      throw error;
	    } finally {
	      this.stats.endTime = new Date();
	      log.info(`Run ended at ${this.stats.endTime.toLocaleString()}. Elapsed time: ${msToHMS(this.stats.endTime.getTime() - this.stats.startTime.getTime())}. See the final summary for its outcome.`);
	      this.printStats();
	      log.info(`${this.state.confirmedDelCount} deletion(s) confirmed in this target. See the final summary for failed, ignored and already-gone messages.`);
	      if (this.state.failCount > 0) log.info('Review skipped messages and errors above before retrying. Access or permission errors must be resolved first.');

	      if (!isJob) {
	        // A batch keeps state.running set so its loop can continue; a plain run
	        // owns the flag and must clear it however it exited.
	        this.state.running = false;
	        this.#busy = false;
	        this.#report.finish();
	        if (this.onStop) this.onStop(this.state, this.stats);
	      }
	    }
	  }

	  stop() {
	    if (this.#busy) this.#report?.end('stopped');
	    this.state.running = false;
	    if (this.onCancelConfirmation) this.onCancelConfirmation();
	    // The loop's finally block unlocks the UI once it actually unwinds; doing it
	    // here as well would re-enable Start while a request is still in flight.
	    if (!this.#busy && this.onStop) this.onStop(this.state, this.stats);
	  }

	  /**
	   * Move the pagination cursor just past the oldest message of the current
	   * page. Snowflakes are time-ordered, so forcing the cursor to strictly
	   * decrease guarantees the walk terminates even if the API ever treats max_id
	   * as inclusive.
	   */
	  advanceCursor() {
	    const page = this.state._pageMessages;
	    if (!page.length) return;

	    // The page is sorted newest first, but do not trust that for correctness.
	    let oldest = null;
	    for (const message of page) {
	      if (!/^\d+$/.test(message.id)) continue;
	      const id = BigInt(message.id);
	      if (oldest === null || id < oldest) oldest = id;
	    }
	    if (oldest === null) return;

	    const current = this.state.cursorId ? BigInt(this.state.cursorId) : null;
	    if (current !== null && oldest >= current) oldest = current - 1n;
	    this.state.cursorId = oldest.toString();
	  }

	  /** Calculate the estimated time remaining based on the current stats */
	  calcEtr() {
	    const remaining = Math.max(0, this.state.grandTotal - this.state.delCount - this.state.failCount);
	    const perMessage = this.options.deleteDelay + this.stats.deleteBackoff + (this.stats.avgPing || 0);
	    const perPage = this.options.searchDelay + this.stats.searchBackoff;
	    this.stats.etr = (perPage * Math.ceil(remaining / PAGE_SIZE)) + (perMessage * remaining);
	  }

	  /** As for confirmation in the beggining process */
	  async confirm() {
	    if (!this.options.askForConfirmation) return true;

	    log.verb('Waiting for your confirmation...');
	    const messages = this.state._messagesToDelete;
	    const sample = messages.slice(0, 3);
	    const preview = sample.map(m => {
	      const text = `${displayName(m.author)}: ${messagePreview(m)}`;
	      return text.length > 400 ? text.slice(0, 400) + '…' : text;
	    }).join('\n\n');
	    const sampleNotice = `${sample.length} example(s) from ${messages.length} eligible message(s) on this page. This is not the complete cleanup list. Long examples are shortened; all selected filters still apply.`;

	    const batchNotice = this.#batchTotal > 1
	      ? `\n\nThis is job ${this.#batchIndex} of ${this.#batchTotal}. The remaining jobs will continue without another confirmation.`
	      : '';
	    const summary = this.state.historyMode
	      ? `Do you want to scan this entire chat history and delete every matching message?\n${this.state.grandTotal} matching message(s) found so far; the final total is unknown until older history is scanned.`
	      : `Delete every message matching the selected target and filters?\nDiscord currently estimates ~${this.state.grandTotal} matching message(s); this is not a fixed limit.\nEstimated deletion time for current results: ${msToHMS(this.stats.etr)}.`;
	    const answer = this.onConfirm
	      ? await this.onConfirm({ summary, batchNotice, preview, sampleNotice })
	      : await ask(summary + batchNotice + '\n\n---- Message sample ----\n' + sampleNotice + '\n' + preview);
	    // Stop can resolve a pending asynchronous prompt; preserve its outcome.
	    if (!this.state.running) return false;

	    if (answer !== true) {
	      this.#report?.end('cancelled');
	      log.info('Confirmation cancelled by you.');
	      return false;
	    }
	    else {
	      log.info('Confirmed. Starting deletion of matching messages.');
	      this.options.askForConfirmation = false; // do not ask for confirmation again on the next request
	      return true;
	    }
	  }

	  /** Ensure an @me target is a DM or group DM before walking its history. */
	  async validatePrivateChannel() {
	    const url = `${API$1}/channels/${this.options.channelId}`;

	    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
	      if (!this.state.running) return false;

	      let resp;
	      try {
	        resp = await this.request(url);
	      } catch {
	        log.warn(connectionError('check the selected conversation'));
	        this.penalize('search', MAX_SEARCH_DELAY);
	        await this.cooldown(this.effectiveDelay('search'));
	        continue;
	      }

	      const { json } = await readBody(resp);
	      if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	      if (resp.status === 429) {
	        this.penalize('search', MAX_SEARCH_DELAY);
	        const asked = retryAfterMs(resp, json);
	        const w = (asked > 0 ? asked : clamp(this.effectiveDelay('search'), 1000, MAX_SEARCH_DELAY)) + RETRY_MARGIN;
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`Discord requested a ${(w / 1000).toFixed(1)}-second pause. Wipecord will continue automatically.`);
	        this.printStats();
	        await this.cooldown(w);
	        continue;
	      }

	      if (!resp.ok) {
	        const code = json && json.code;
	        if (resp.status === 401) {
	          throw new WipecordError(SESSION_EXPIRED, { fatal: true, status: 401 });
	        }
	        if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50024) {
	          log.warn(requestError(resp.status, code, 'check the selected conversation'), 'Skipping this target.');
	          this.#report?.end('error');
	          return false;
	        }
	        throw new WipecordError(requestError(resp.status, code, 'check the selected conversation'), { status: resp.status, code });
	      }

	      this.updatePace('search', resp);
	      this.relax('search');

	      if (!json || (json.type !== 1 && json.type !== 3)) {
	        log.warn('Skipping this archive entry because it is not a DM or group DM.');
	        this.#report?.end('error');
	        return false;
	      }

	      this.state.historyValidated = true;
	      return true;
	    }

	    throw new WipecordError(exhaustedRetries('check the selected conversation', MAX_SEARCH_ATTEMPTS));
	  }

	  async history() {
	    if (this.state.historyDone) return { _history: true, total_results: 0, messages: [] };
	    if (!this.state.historyValidated) {
	      if (!await this.validatePrivateChannel()) return null;
	      await this.pace('search');
	    }

	    const query = queryString([
	      ['limit', HISTORY_PAGE_SIZE],
	      ['before', this.state.cursorId || undefined],
	    ]);
	    const url = `${API$1}/channels/${this.options.channelId}/messages?${query}`;

	    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
	      if (!this.state.running) return null;

	      let resp;
	      try {
	        resp = await this.request(url);
	      } catch {
	        log.warn(connectionError('read conversation history'));
	        this.penalize('search', MAX_SEARCH_DELAY);
	        await this.cooldown(this.effectiveDelay('search'));
	        continue;
	      }

	      const { json } = await readBody(resp);
	      if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	      if (resp.status === 429) {
	        this.penalize('search', MAX_SEARCH_DELAY);
	        const asked = retryAfterMs(resp, json);
	        const w = (asked > 0 ? asked : clamp(this.effectiveDelay('search'), 1000, MAX_SEARCH_DELAY)) + RETRY_MARGIN;
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`Discord requested a ${(w / 1000).toFixed(1)}-second pause. Wipecord will continue automatically.`);
	        this.printStats();
	        await this.cooldown(w);
	        continue;
	      }

	      if (!resp.ok) {
	        const code = json && json.code;
	        if (resp.status === 401) {
	          throw new WipecordError(SESSION_EXPIRED, { fatal: true, status: 401 });
	        }
	        if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50024) {
	          log.warn(requestError(resp.status, code, 'read conversation history'), 'Skipping this target.');
	          this.#report?.end('error');
	          return null;
	        }
	        throw new WipecordError(requestError(resp.status, code, 'read conversation history'), { status: resp.status, code });
	      }

	      this.updatePace('search', resp);
	      this.relax('search');

	      if (!Array.isArray(json)) {
	        throw new WipecordError('Discord returned an unexpected history response. This target cannot continue safely. Refresh Discord and update Wipecord before retrying; report the problem if it persists.');
	      }
	      const rawMessages = json;
	      this.state.historyScanned += rawMessages.length;
	      let messages = rawMessages;
	      const minId = toSnowflake(this.options.minId);
	      if (minId) {
	        const boundary = BigInt(minId);
	        messages = rawMessages.filter(message => /^\d+$/.test(message.id) && BigInt(message.id) > boundary);
	        if (messages.length !== rawMessages.length) this.state.historyDone = true;
	      }

	      const data = { _history: true, total_results: 0, messages };
	      this.state._searchResponse = data;
	      if (this.options.debug) console.log(PREFIX$1, 'history', data);
	      return data;
	    }

	    throw new WipecordError(exhaustedRetries('read conversation history', MAX_SEARCH_ATTEMPTS));
	  }

	  async search() {
	    if (this.state.historyMode) return this.history();

	    const url = `${API$1}/guilds/${this.options.guildId}/messages/search?`;
	    const query = queryString([
	      ['limit', PAGE_SIZE],
	      ['author_id', this.options.authorId || undefined],
	      ['channel_id', this.options.channelId || undefined],
	      ['min_id', toSnowflake(this.options.minId)],
	      ['max_id', this.state.cursorId || undefined],
	      ['sort_by', 'timestamp'],
	      ['sort_order', 'desc'],
	      ['has', this.options.hasLink ? 'link' : undefined],
	      ['has', this.options.hasFile ? 'file' : undefined],
	      ['content', this.options.content || undefined],
	      ['include_nsfw', this.options.includeNsfw ? true : undefined],
	    ]);

	    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
	      if (!this.state.running) return null;

	      let resp;
	      try {
	        resp = await this.request(url + query, { cache: 'no-store' });
	      } catch {
	        // Keep the existing bounded network/timeout retry policy.
	        log.warn(connectionError('search messages'));
	        this.penalize('search', MAX_SEARCH_DELAY);
	        await this.cooldown(this.effectiveDelay('search'));
	        continue;
	      }

	      const { json } = await readBody(resp);

	      if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	      // Not indexed yet
	      if (resp.status === 202) {
	        const w = clamp(retryAfterMs(resp, json) || 5000, 1000, MAX_SEARCH_DELAY);
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`Discord is preparing search results for this channel. Retrying automatically in ${(w / 1000).toFixed(1)} seconds...`);
	        await this.cooldown(w);
	        continue;
	      }

	      if (resp.status === 429) {
	        this.penalize('search', MAX_SEARCH_DELAY);
	        // Honour whatever Discord asked for in full — capping it would just put
	        // us back inside the window it told us to stay out of. A retry_after of
	        // 0 means "we did not say", so fall back to our own pace.
	        const asked = retryAfterMs(resp, json);
	        const w = (asked > 0 ? asked : clamp(this.effectiveDelay('search'), 1000, MAX_SEARCH_DELAY)) + RETRY_MARGIN;
	        this.stats.throttledCount++;
	        this.stats.throttledTotalTime += w;
	        log.warn(`Discord requested a ${(w / 1000).toFixed(1)}-second pause. Wipecord will continue automatically.`);
	        this.printStats();
	        await this.cooldown(w);
	        continue;
	      }

	      if (!resp.ok) {
	        const code = json && json.code;

	        if (resp.status === 401) {
	          throw new WipecordError(SESSION_EXPIRED, { fatal: true, status: 401 });
	        }
	        // The channel is gone, or was never ours to read. End this job quietly
	        // so a batch over an old archive is not killed by one dead server.
	        if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50024) {
	          log.warn(requestError(resp.status, code, 'search messages'), 'Skipping this target.');
	          this.#report?.end('error');
	          return null;
	        }
	        throw new WipecordError(requestError(resp.status, code, 'search messages'), { status: resp.status, code });
	      }

	      this.updatePace('search', resp);
	      this.relax('search');

	      const validMessage = message => message && typeof message === 'object'
	        && typeof message.id === 'string' && isSnowflake(message.id)
	        && typeof message.channel_id === 'string' && isSnowflake(message.channel_id);
	      const validGroups = Array.isArray(json?.messages) && json.messages.every(group =>
	        Array.isArray(group) ? group.length > 0 && group.every(validMessage) : validMessage(group));
	      if (!json || !Number.isSafeInteger(json.total_results) || json.total_results < 0 || !validGroups) {
	        throw new WipecordError('Discord returned an unexpected search response. This target cannot continue safely. Refresh Discord and update Wipecord before retrying; report the problem if it persists.');
	      }
	      const data = json;
	      this.state._searchResponse = data;
	      if (this.options.debug) console.log(PREFIX$1, 'search', data);
	      return data;
	    }

	    throw new WipecordError(exhaustedRetries('search messages', MAX_SEARCH_ATTEMPTS));
	  }

	  filterResponse(data) {
	    const historyPage = data._history === true;
	    if (!historyPage) {
	      // The search total will decrease as we delete stuff.
	      const total = Number(data.total_results) || 0;
	      if (total > this.state.grandTotal) this.state.grandTotal = total;
	    }

	    // Search hits may be wrapped in conversation arrays; history rows are not.
	    const groups = Array.isArray(data.messages) ? data.messages : [];
	    const discoveredMessages = groups
	      .map(group => {
	        if (!Array.isArray(group)) return group;
	        return group.find(message => message.hit === true) || (group.length === 1 ? group[0] : null);
	      })
	      .filter(message => message && message.id);

	    this.state._pageMessages = discoveredMessages;

	    // Guild search applies these filters remotely. Direct DM history does not,
	    // so apply the same constraints before anything becomes deletable.
	    let candidates = discoveredMessages;
	    if (historyPage) {
	      candidates = candidates.filter(message => matchesHistoryFilters(message, this.options));
	      this.state.grandTotal += candidates.length;
	    }

	    let messagesToDelete = candidates;
	    messagesToDelete = messagesToDelete.filter(msg => !UNDELETABLE_MESSAGE_TYPES.has(msg.type));
	    messagesToDelete = messagesToDelete.filter(msg => msg.pinned ? this.options.includePinned : true);

	    const { regex } = validateFilters(this.options);
	    if (regex) messagesToDelete = messagesToDelete.filter(msg => regex.test(messageText(msg)));
	    const selected = new Set(messagesToDelete.map(message => message.id));
	    for (const message of discoveredMessages) {
	      if (!selected.has(message.id)) this.#report?.record(message.id, 'ignored');
	    }

	    const skippedMessages = candidates.filter(msg => !messagesToDelete.includes(msg));

	    this.state._messagesToDelete = messagesToDelete;
	    this.state._skippedMessages = skippedMessages;

	    if (this.options.debug) console.log(PREFIX$1, 'filterResponse', { toDelete: messagesToDelete.length, skipped: skippedMessages.length, cursorId: this.state.cursorId });
	  }

	  async deleteMessagesFromList() {
	    for (let i = 0; i < this.state._messagesToDelete.length; i++) {
	      const message = this.state._messagesToDelete[i];
	      if (!this.state.running) return log.info('Stopped by you.');

	      log.debug(
	        `Attempting deletion [${this.state.delCount + 1}/${this.state.grandTotal}]: ` +
	        `<sup>${new Date(message.timestamp).toLocaleString()}</sup> ` +
	        `<b>${redact(displayName(message.author))}</b>` +
	        `: <i>${redact(messagePreview(message)).replace(/\n/g, '↵')}</i>`,
	        `<sup>{ID:${redact(message.id)}}</sup>`
	      );

	      // Rate limits and one-time thread recovery are not the message's fault,
	      // so they get a larger budget than an actual request failure.
	      let result = FAILED;
	      let failures = 0;
	      let transientRetries = 0;
	      for (;;) {
	        await this.pace('delete');
	        if (!this.state.running) return log.info('Stopped by you.');

	        result = await this.deleteMessage(message);

	        if (result === RETRY) {
	          if (++transientRetries >= MAX_TRANSIENT_RETRIES) break;
	        }
	        else if (result === FAILED) {
	          if (++failures >= this.options.maxAttempt) break;
	          log.verb(`Retrying this message automatically (next attempt: ${failures + 1}/${this.options.maxAttempt}). You can stop the run at any time.`);
	        }
	        else break;
	      }

	      this.#report?.record(message.id, result === DELETED ? 'deleted' : result === ALREADY_GONE ? 'alreadyGone' : result === SKIPPED ? 'ignored' : 'failed');
	      if (result === DELETED) log.success('Message deleted.');
	      if (result === DELETED || result === ALREADY_GONE) {
	        this.state.delCount++;
	        // Only a message we actually removed proves the run is progressing.
	        if (result === DELETED) this.state.confirmedDelCount++;
	      }
	      else {
	        // Counted once, then left behind. The cursor moves past it either way,
	        // which is what stops an undeletable message from being re-found forever.
	        this.state.failCount++;
	      }

	      this.calcEtr();
	      if (this.onProgress) this.onProgress(this.state, this.stats);
	    }
	  }

	  /** Reopen an archived thread so the failed deletion can be retried. */
	  async unarchiveThread(channelId) {
	    // The failed DELETE also counts as a mutation request. Keep the configured
	    // spacing before PATCHing the thread instead of firing both back to back.
	    await this.pace('delete');
	    if (!this.state.running) return RETRY;

	    let resp;
	    try {
	      resp = await this.request(`${API$1}/channels/${channelId}`, {
	        method: 'PATCH',
	        headers: { 'Content-Type': 'application/json' },
	        body: JSON.stringify({ archived: false }),
	      });
	    } catch {
	      log.error(connectionError('reopen the archived thread'));
	      this.stats.deleteNextAt = Date.now() + this.effectiveDelay('delete');
	      return FAILED;
	    }

	    const { json } = await readBody(resp);

	    if (isEdgeBlock(resp, json)) throw this.edgeBlocked();
	    if (resp.status === 429) return this.deferDeleteForRateLimit(resp, json);
	    if (resp.status === 401) {
	      throw new WipecordError(SESSION_EXPIRED, { fatal: true, status: 401 });
	    }

	    this.updatePace('delete', resp);

	    if (resp.ok) {
	      this.relax('delete');
	      log.success('Reopened the archived thread. Retrying the deletion...');
	      return RETRY;
	    }

	    const code = json && json.code;
	    if (resp.status === 403 || resp.status === 404 || code === 50001 || code === 50013 || code === 160005) {
	      log.warn(requestError(resp.status, code, 'reopen the archived thread'), 'Skipping this message.');
	      return SKIPPED;
	    }

	    log.error(requestError(resp.status, code, 'reopen the archived thread'));
	    return FAILED;
	  }

	  /** Apply Discord's requested cooldown to any mutation of a message/thread. */
	  deferDeleteForRateLimit(resp, body) {
	    this.penalize('delete', MAX_DELETE_DELAY);
	    const asked = retryAfterMs(resp, body);
	    const w = (asked > 0 ? asked : clamp(this.effectiveDelay('delete'), 500, MAX_DELETE_DELAY)) + RETRY_MARGIN;
	    this.stats.throttledCount++;
	    this.stats.throttledTotalTime += w;
	    log.warn(`Discord requested a ${(w / 1000).toFixed(1)}-second pause. Wipecord will continue automatically.`);
	    this.printStats();
	    this.stats.deleteNextAt = Date.now() + w;
	    return RETRY;
	  }

	  async deleteMessage(message) {
	    let resp;
	    try {
	      resp = await this.request(`${API$1}/channels/${message.channel_id}/messages/${message.id}`, { method: 'DELETE' });
	    } catch {
	      // No response at all (network error, timeout). Nothing updated the pacing
	      // clock, so re-arm it by hand or the retries fire back to back.
	      log.error(connectionError('delete this message'));
	      this.stats.deleteNextAt = Date.now() + this.effectiveDelay('delete');
	      return FAILED;
	    }

	    const { json } = await readBody(resp);

	    if (isEdgeBlock(resp, json)) throw this.edgeBlocked();

	    if (resp.ok) {
	      this.updatePace('delete', resp);
	      this.relax('delete');
	      return DELETED;
	    }

	    const code = json && json.code;

	    if (resp.status === 429) return this.deferDeleteForRateLimit(resp, json);

	    // Someone (or a previous run) already deleted it. That is the outcome we
	    // wanted, but it is not proof that this run is making progress — see the
	    // sweep accounting in run().
	    if (resp.status === 404 && code === 10008) {
	      log.verb('That message was already gone.');
	      this.updatePace('delete', resp);
	      return ALREADY_GONE;
	    }

	    if (resp.status === 401) {
	      throw new WipecordError(SESSION_EXPIRED, { fatal: true, status: 401 });
	    }

	    // Documented as "Unknown Message", but a 403 carrying it means Discord's
	    // anti-abuse systems blocked the request. Hammering it makes it worse.
	    if (resp.status === 403 && code === 10008) {
	      throw new WipecordError(TEMPORARY_BLOCK, { fatal: true, status: 403, code });
	    }

	    this.updatePace('delete', resp);

	    if (code === 50083) {
	      log.warn('This message is in an archived thread. Reopening the thread...');
	      return this.unarchiveThread(message.channel_id);
	    }

	    const reason = PERMANENT_DELETE_ERRORS[code];
	    if (reason || resp.status === 403) {
	      log.warn(requestError(resp.status, code, 'delete this message'), 'Skipping this message.', `<sup>{ID:${redact(message.id)}}</sup>`);
	      return SKIPPED;
	    }

	    log.error(requestError(resp.status, code, 'delete this message'));
	    return FAILED;
	  }

	  /** All API traffic goes through here so pings and timeouts are handled once. */
	  async request(url, init = {}) {
	    this.beforeRequest();
	    try {
	      return await fetch(url, {
	        ...init,
	        headers: {
	          'Authorization': this.options.authToken,
	          ...init.headers,
	        },
	        signal: AbortSignal.timeout(REQUEST_TIMEOUT$1),
	      });
	    } finally {
	      this.afterRequest();
	    }
	  }

	  edgeBlocked() {
	    return new WipecordError(
	      TEMPORARY_BLOCK,
	      { fatal: true, status: 429 }
	    );
	  }

	  /** The delay we should currently keep between requests of a given kind. */
	  effectiveDelay(kind) {
	    const configured = kind === 'search' ? this.options.searchDelay : this.options.deleteDelay;
	    const ceiling = kind === 'search' ? MAX_SEARCH_DELAY : MAX_DELETE_DELAY;
	    const backoff = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    return clamp((Number(configured) || 0) + backoff, 0, ceiling);
	  }

	  /** Wait until we are allowed to issue the next request of this kind. */
	  async pace(kind) {
	    const due = kind === 'search' ? this.stats.searchNextAt : this.stats.deleteNextAt;
	    await this.cooldown(due - Date.now());
	  }

	  /**
	   * Sleep, but in slices, so pressing Stop during a multi-minute cooldown does
	   * not leave the user staring at a frozen window.
	   */
	  async cooldown(ms) {
	    const until = Date.now() + ms;
	    for (;;) {
	      const left = until - Date.now();
	      if (left <= 0 || !this.state.running) return;
	      await wait(Math.min(left, 1000));
	    }
	  }

	  /**
	   * Schedule the earliest time the next request of this kind may go out.
	   * Discord only reliably sends bucket headers to bots, so they are used when
	   * present and the configured delay carries the rest.
	   */
	  updatePace(kind, resp, extraWaitMs = 0) {
	    let delay = this.effectiveDelay(kind);

	    // Missing headers must not look like an empty bucket: Headers.get() returns
	    // null when absent and Number(null) is 0.
	    const remaining = resp.headers.get('x-ratelimit-remaining');
	    const resetAfter = resp.headers.get('x-ratelimit-reset-after');
	    if (remaining !== null && resetAfter !== null && Number(remaining) === 0) {
	      const refillMs = Number(resetAfter) * 1000;
	      // Bucket is empty: never issue the next request before it refills.
	      if (Number.isFinite(refillMs)) delay = Math.max(delay, refillMs + RETRY_MARGIN);
	    }

	    const next = Date.now() + delay + extraWaitMs;
	    if (kind === 'search') this.stats.searchNextAt = next;
	    else this.stats.deleteNextAt = next;
	  }

	  /** Grow the adaptive backoff after being throttled. */
	  penalize(kind, ceiling) {
	    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    const next = clamp(current * 2 + 500, 0, ceiling);
	    if (kind === 'search') this.stats.searchBackoff = next;
	    else this.stats.deleteBackoff = next;
	  }

	  /** Ease the backoff back down after a request that was not throttled. */
	  relax(kind) {
	    const current = kind === 'search' ? this.stats.searchBackoff : this.stats.deleteBackoff;
	    const next = Math.max(0, current * 0.8 - 50);
	    if (kind === 'search') this.stats.searchBackoff = next;
	    else this.stats.deleteBackoff = next;
	  }

	  /** True while a run/batch is actually in flight. Unlike state.running it is
	   * not cleared by resetState() or by the Stop button, so it is what re-entry
	   * is guarded on. */
	  #busy = false;
	  #report;
	  #batchIndex = 0;
	  #batchTotal = 0;

	  #beforeTs = 0; // used to calculate latency
	  beforeRequest() {
	    this.#beforeTs = Date.now();
	  }
	  afterRequest() {
	    this.stats.lastPing = (Date.now() - this.#beforeTs);
	    this.stats.avgPing = this.stats.avgPing > 0 ? (this.stats.avgPing * 0.9) + (this.stats.lastPing * 0.1) : this.stats.lastPing;
	  }

	  printStats() {
	    log.verb(
	      `Delete delay: ${this.effectiveDelay('delete') | 0}ms, Search delay: ${this.effectiveDelay('search') | 0}ms`,
	      `Last Ping: ${this.stats.lastPing}ms, Average Ping: ${this.stats.avgPing | 0}ms`,
	    );
	    log.verb(
	      `Discord-requested pauses: ${this.stats.throttledCount}.`,
	      `Total time paused: ${msToHMS(this.stats.throttledTotalTime)}.`
	    );
	  }
	}

	/** A DOM claim is shared by page-world scripts and userscript wrappers alike. */
	function claimRuntime(document, version) {
	  const existing = document.getElementById('wipecord-runtime');
	  if (existing) {
	    existing.dataset.duplicates = String(Number(existing.dataset.duplicates || 0) + 1);
	    return false;
	  }
	  const marker = document.createElement('meta');
	  marker.id = 'wipecord-runtime';
	  marker.dataset.version = document.getElementById('wipecord') ? 'legacy' : version;
	  marker.dataset.state = 'idle';
	  marker.dataset.duplicates = '0';
	  document.head.appendChild(marker);
	  // Older installations cannot participate in the claim protocol. Defer to
	  // their existing panel rather than adding a second engine to the page.
	  return marker.dataset.version !== 'legacy';
	}

	function setRuntimeState(state) {
	  document.getElementById('wipecord-runtime').dataset.state = state;
	}

	function parseIdList(value) {
	  return [...new Set(String(value ?? '').split(/[\s,]+/).filter(Boolean))];
	}

	/**
	 * Convert the two target fields into concrete jobs for the core batch runner.
	 * A channel ID is only meaningful inside one guild, so cross-guild channel
	 * lists are rejected instead of producing a mostly-invalid Cartesian product.
	 */
	function buildPurgePlan(guildInput, channelInput) {
	  const guildIds = parseIdList(guildInput);
	  const channelIds = parseIdList(channelInput);

	  if (guildIds.length === 0) throw new Error('You must fill the "Server ID" field!');

	  const badGuildIds = guildIds.filter(id => id !== '@me' && !isSnowflake(id));
	  if (badGuildIds.length) throw new Error(`These are not valid Server IDs: ${badGuildIds.join(', ')}`);

	  const badChannelIds = channelIds.filter(id => !isSnowflake(id));
	  if (badChannelIds.length) throw new Error(`These are not valid Channel IDs: ${badChannelIds.join(', ')}`);

	  if (guildIds.includes('@me') && guildIds.length > 1) {
	    throw new Error('"@me" cannot be combined with Server IDs. Use it by itself for direct messages.');
	  }

	  if (guildIds.length > 1 && channelIds.length > 0) {
	    throw new Error('When purging multiple servers, leave the "Channel ID" field empty.');
	  }

	  if (guildIds[0] === '@me' && channelIds.length === 0) {
	    throw new Error('You must fill the "Channel ID" field to delete direct messages!');
	  }

	  const jobs = guildIds.length > 1
	    ? guildIds.map(guildId => ({ guildId, channelId: undefined }))
	    : channelIds.length > 0
	      ? channelIds.map(channelId => ({ guildId: guildIds[0], channelId }))
	      : [{ guildId: guildIds[0], channelId: undefined }];

	  return { guildIds, channelIds, jobs };
	}

	const MOVE = 0;
	const RESIZE_T = 1;
	const RESIZE_B = 2;
	const RESIZE_L = 4;
	const RESIZE_R = 8;
	const RESIZE_TL = RESIZE_T + RESIZE_L;
	const RESIZE_TR = RESIZE_T + RESIZE_R;
	const RESIZE_BL = RESIZE_B + RESIZE_L;
	const RESIZE_BR = RESIZE_B + RESIZE_R;

	/**
	 * Make an element draggable/resizable
	 */
	class DragResize {
	  constructor({ elm, moveHandle, options }) {
	    this.options = defaultArgs({
	      enabledDrag: true,
	      enabledResize: true,
	      minWidth: 200,
	      maxWidth: Infinity,
	      minHeight: 100,
	      maxHeight: Infinity,
	      dragAllowX: true,
	      dragAllowY: true,
	      resizeAllowX: true,
	      resizeAllowY: true,
	      draggingClass: 'drag',
	      useMouseEvents: true,
	      useTouchEvents: true,
	      createHandlers: true,
	    }, options);
	    Object.assign(this, options);
	    options = undefined;

	    elm.style.position = 'fixed';

	    this.drag_m = new Draggable(elm, moveHandle, MOVE, this.options);

	    if (this.options.createHandlers) {
	      this.el_t = createElement('div', { name: 'grab-t' }, elm);
	      this.drag_t = new Draggable(elm, this.el_t, RESIZE_T, this.options);
	      this.el_r = createElement('div', { name: 'grab-r' }, elm);
	      this.drag_r = new Draggable(elm, this.el_r, RESIZE_R, this.options);
	      this.el_b = createElement('div', { name: 'grab-b' }, elm);
	      this.drag_b = new Draggable(elm, this.el_b, RESIZE_B, this.options);
	      this.el_l = createElement('div', { name: 'grab-l' }, elm);
	      this.drag_l = new Draggable(elm, this.el_l, RESIZE_L, this.options);
	      this.el_tl = createElement('div', { name: 'grab-tl' }, elm);
	      this.drag_tl = new Draggable(elm, this.el_tl, RESIZE_TL, this.options);
	      this.el_tr = createElement('div', { name: 'grab-tr' }, elm);
	      this.drag_tr = new Draggable(elm, this.el_tr, RESIZE_TR, this.options);
	      this.el_br = createElement('div', { name: 'grab-br' }, elm);
	      this.drag_br = new Draggable(elm, this.el_br, RESIZE_BR, this.options);
	      this.el_bl = createElement('div', { name: 'grab-bl' }, elm);
	      this.drag_bl = new Draggable(elm, this.el_bl, RESIZE_BL, this.options);
	    }
	  }
	}

	class Draggable {
	  constructor(targetElm, handleElm, op, options) {
	    Object.assign(this, options);
	    options = undefined;

	    this._targetElm = targetElm;
	    this._handleElm = handleElm;

	    let vw = window.innerWidth;
	    let vh = window.innerHeight;
	    let initialX, initialY, initialT, initialL, initialW, initialH;

	    const clamp = (value, min, max) => value < min ? min : value > max ? max : value;

	    const moveOp = (x, y) => {
	      const deltaX = (x - initialX);
	      const deltaY = (y - initialY);
	      const t = clamp(initialT + deltaY, 0, vh - initialH);
	      const l = clamp(initialL + deltaX, 0, vw - initialW);
	      this._targetElm.style.top = t + 'px';
	      this._targetElm.style.left = l + 'px';
	    };

	    const resizeOp = (x, y) => {
	      x = clamp(x, 0, vw);
	      y = clamp(y, 0, vh);
	      const deltaX = (x - initialX);
	      const deltaY = (y - initialY);
	      const resizeDirX = (op & RESIZE_L) ? -1 : 1;
	      const resizeDirY = (op & RESIZE_T) ? -1 : 1;
	      const deltaXMax = (this.maxWidth - initialW);
	      const deltaXMin = (this.minWidth - initialW);
	      const deltaYMax = (this.maxHeight - initialH);
	      const deltaYMin = (this.minHeight - initialH);
	      const t = initialT + clamp(deltaY * resizeDirY, deltaYMin, deltaYMax) * resizeDirY;
	      const l = initialL + clamp(deltaX * resizeDirX, deltaXMin, deltaXMax) * resizeDirX;
	      const w = initialW + clamp(deltaX * resizeDirX, deltaXMin, deltaXMax);
	      const h = initialH + clamp(deltaY * resizeDirY, deltaYMin, deltaYMax);
	      if (op & RESIZE_T) { // resize ↑
	        this._targetElm.style.top = t + 'px';
	        this._targetElm.style.height = h + 'px';
	      }
	      if (op & RESIZE_B) { // resize ↓
	        this._targetElm.style.height = h + 'px';
	      }
	      if (op & RESIZE_L) { // resize ←
	        this._targetElm.style.left = l + 'px';
	        this._targetElm.style.width = w + 'px';
	      }
	      if (op & RESIZE_R) { // resize →
	        this._targetElm.style.width = w + 'px';
	      }
	    };

	    let operation = op === MOVE ? moveOp : resizeOp;

	    function dragStartHandler(e) {
	      if (op === MOVE && e.target.closest('button, a, input, select, textarea')) return;
	      const touch = e.type === 'touchstart';
	      if ((e.buttons === 1 || e.which === 1) || touch) {
	        e.preventDefault();
	        const x = touch ? e.touches[0].clientX : e.clientX;
	        const y = touch ? e.touches[0].clientY : e.clientY;
	        initialX = x;
	        initialY = y;
	        vw = window.innerWidth;
	        vh = window.innerHeight;
	        initialT = this._targetElm.offsetTop;
	        initialL = this._targetElm.offsetLeft;
	        initialW = this._targetElm.clientWidth;
	        initialH = this._targetElm.clientHeight;
	        if (this.useMouseEvents) {
	          document.addEventListener('mousemove', this._dragMoveHandler);
	          document.addEventListener('mouseup', this._dragEndHandler);
	        }
	        if (this.useTouchEvents) {
	          document.addEventListener('touchmove', this._dragMoveHandler, { passive: false });
	          document.addEventListener('touchend', this._dragEndHandler);
	        }
	        this._targetElm.classList.add(this.draggingClass);
	      }
	    }

	    function dragMoveHandler(e) {
	      e.preventDefault();
	      let x, y;
	      const touch = e.type === 'touchmove';
	      if (touch) {
	        const t = e.touches[0];
	        x = t.clientX;
	        y = t.clientY;
	      } else { //mouse
	        // If the button is not down, dispatch a "fake" mouse up event, to stop listening to mousemove
	        // This happens when the mouseup is not captured (outside the browser)
	        if ((e.buttons || e.which) !== 1) {
	          this._dragEndHandler();
	          return;
	        }
	        x = e.clientX;
	        y = e.clientY;
	      }
	      // perform drag / resize operation
	      operation(x, y);
	    }

	    function dragEndHandler(e) {
	      if (this.useMouseEvents) {
	        document.removeEventListener('mousemove', this._dragMoveHandler);
	        document.removeEventListener('mouseup', this._dragEndHandler);
	      }
	      if (this.useTouchEvents) {
	        document.removeEventListener('touchmove', this._dragMoveHandler);
	        document.removeEventListener('touchend', this._dragEndHandler);
	      }
	      this._targetElm.classList.remove(this.draggingClass);
	    }

	    // We need to bind the handlers to this instance
	    this._dragStartHandler = dragStartHandler.bind(this);
	    this._dragMoveHandler = dragMoveHandler.bind(this);
	    this._dragEndHandler = dragEndHandler.bind(this);

	    this.enable();
	  }

	  /** Turn on the drag and drop of the instance */
	  enable() {
	    this.destroy(); // prevent events from getting binded twice
	    if (this.useMouseEvents) this._handleElm.addEventListener('mousedown', this._dragStartHandler);
	    if (this.useTouchEvents) this._handleElm.addEventListener('touchstart', this._dragStartHandler, { passive: false });
	  }

	  /** Teardown all events bound to the document and elements. You can resurrect this instance by calling enable() */
	  destroy() {
	    this._targetElm.classList.remove(this.draggingClass);
	    if (this.useMouseEvents) {
	      this._handleElm.removeEventListener('mousedown', this._dragStartHandler);
	      document.removeEventListener('mousemove', this._dragMoveHandler);
	      document.removeEventListener('mouseup', this._dragEndHandler);
	    }
	    if (this.useTouchEvents) {
	      this._handleElm.removeEventListener('touchstart', this._dragStartHandler);
	      document.removeEventListener('touchmove', this._dragMoveHandler);
	      document.removeEventListener('touchend', this._dragEndHandler);
	    }
	  }
	}

	function createElement(tag='div', attrs, parent) {
	  const elm = document.createElement(tag);
	  if (attrs) Object.entries(attrs).forEach(([k, v]) => elm.setAttribute(k, v));
	  if (parent) parent.appendChild(elm);
	  return elm;
	}

	function defaultArgs(defaults, options) {
	  function isObj(x) { return x !== null && typeof x === 'object'; }
	  function hasOwn(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
	  if (isObj(options)) for (let prop in defaults) {
	    if (hasOwn(defaults, prop) && hasOwn(options, prop) && options[prop] !== undefined) {
	      if (isObj(defaults[prop])) defaultArgs(defaults[prop], options[prop]);
	      else defaults[prop] = options[prop];
	    }
	  }
	  return defaults;
	}

	/** Build trusted template data with DOM APIs; substituted values stay inert. */
	function createElm(template, values = {}) {
	  if (typeof template === 'string') return document.createTextNode(replaceInterpolations(template, values));
	  const element = document.createElementNS(template.namespace, template.tag);
	  // Range inputs clamp their value as attributes arrive. Apply bounds first.
	  const attributes = [...template.attributes].sort(([left], [right]) => Number(left === 'value') - Number(right === 'value'));
	  for (const [name, value, namespace, prefix] of attributes) {
	    element.setAttributeNS(namespace, prefix ? `${prefix}:${name}` : name, replaceInterpolations(value, values));
	  }
	  for (const child of template.children) element.appendChild(createElm(child, values));
	  return element;
	}

	const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': '\'' };
	const decode = text => text.replace(/&(amp|lt|gt|quot|#039);/g, (_, name) => entities[name]);

	/** Only the four attribute-free formatting tags can become elements. */
	function renderLog(type, args) {
	  const line = document.createElement('div');
	  const levels = ['debug', 'info', 'verb', 'warn', 'error', 'success'];
	  line.className = `log log-${levels.includes(type) ? type : 'info'}`;
	  const text = Array.from(args).map(value => typeof value === 'object' && value !== null
	    ? escapeHTML(JSON.stringify(value, value instanceof Error ? Object.getOwnPropertyNames(value) : undefined))
	    : String(value)).join('\t');
	  const stack = [line];
	  let offset = 0;
	  for (const match of text.matchAll(/<\/?(?:b|i|sup|x)>/g)) {
	    stack.at(-1).appendChild(document.createTextNode(decode(text.slice(offset, match.index))));
	    const tag = match[0].replace(/[<>/]/g, '');
	    if (match[0][1] === '/') {
	      if (stack.length > 1 && stack.at(-1).localName === tag) stack.pop();
	      else stack.at(-1).appendChild(document.createTextNode(match[0]));
	    } else {
	      const element = document.createElement(tag);
	      stack.at(-1).appendChild(element);
	      stack.push(element);
	    }
	    offset = match.index + match[0].length;
	  }
	  stack.at(-1).appendChild(document.createTextNode(decode(text.slice(offset))));
	  return line;
	}

	/** Resolve only from explicit controls. A missing/failed dialog cancels safely. */
	function confirmation(panel, stopRun) {
	  const dialog = panel.querySelector('#confirmDeletion');
	  const cancelButton = panel.querySelector('#cancelDeletion');
	  const acceptButton = panel.querySelector('#acceptDeletion');
	  let pending;

	  const cancel = () => pending?.(false);
	  function open({ summary, batchNotice, preview, sampleNotice, fields }) {
	    if (pending || panel.style.display === 'none') return Promise.resolve(false);
	    if (typeof dialog.showModal !== 'function') {
	      log.error('This browser cannot display the cleanup confirmation. No deletion was authorized. Update your browser before retrying.');
	      return Promise.resolve(false);
	    }
	    panel.querySelector('#confirmSummary').textContent = summary;
	    panel.querySelector('#confirmPrivacy').textContent = panel.classList.contains('redact')
	      ? 'Streamer mode is on. Hold the masked text to reveal it.'
	      : 'Streamer mode is off. Personal details are visible.';
	    const notice = panel.querySelector('#confirmBatch');
	    notice.textContent = batchNotice.trim();
	    notice.hidden = !batchNotice;
	    const previewNode = panel.querySelector('#confirmPreview');
	    previewNode.textContent = preview;
	    panel.querySelector('#confirmSample').open = false;
	    panel.querySelector('#confirmSampleNotice').textContent = sampleNotice;
	    const scope = panel.querySelector('#confirmScope');
	    scope.replaceChildren();
	    for (const [label, value, privateValue] of fields) {
	      const line = document.createElement('p');
	      const title = document.createElement('strong');
	      title.textContent = `${label}: `;
	      const text = document.createElement(privateValue ? 'x' : 'span');
	      text.textContent = String(value);
	      line.append(title, text);
	      scope.appendChild(line);
	    }

	    const previousFocus = document.activeElement;
	    return new Promise(resolve => {
	      let finished = false;
	      const finish = answer => {
	        if (finished) return;
	        finished = true;
	        pending = undefined;
	        cancelButton.removeEventListener('click', reject);
	        acceptButton.removeEventListener('click', accept);
	        panel.querySelector('#closeConfirmation').removeEventListener('click', reject);
	        panel.querySelector('#stopConfirmation').removeEventListener('click', stop);
	        dialog.removeEventListener('cancel', escape);
	        dialog.removeEventListener('close', closed);
	        dialog.removeEventListener('click', backdrop);
	        if (dialog.open) dialog.close();
	        scope.replaceChildren();
	        previewNode.textContent = '';
	        resolve(answer === true);
	        requestAnimationFrame(() => {
	          if (panel.style.display === 'none') return;
	          const restore = panel.contains(previousFocus) && previousFocus?.isConnected && !previousFocus.disabled
	            ? previousFocus : panel.querySelector(panel.querySelector('#start').disabled ? '#stop' : '#start');
	          restore?.focus({ preventScroll: true });
	        });
	      };
	      const reject = () => finish(false);
	      const accept = () => finish(true);
	      const stop = () => { stopRun(); finish(false); };
	      const escape = event => { event.preventDefault(); finish(false); };
	      const closed = () => { if (!dialog.open) finish(false); };
	      const backdrop = event => {
	        const rect = dialog.getBoundingClientRect();
	        if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) finish(false);
	      };
	      pending = finish;
	      cancelButton.addEventListener('click', reject);
	      acceptButton.addEventListener('click', accept);
	      panel.querySelector('#closeConfirmation').addEventListener('click', reject);
	      panel.querySelector('#stopConfirmation').addEventListener('click', stop);
	      dialog.addEventListener('cancel', escape);
	      dialog.addEventListener('close', closed);
	      dialog.addEventListener('click', backdrop);
	      try {
	        dialog.showModal();
	        cancelButton.focus({ preventScroll: true });
	      } catch {
	        log.error('Could not open the cleanup confirmation. No deletion was authorized. Reopen Wipecord and refresh Discord before retrying.');
	        finish(false);
	      }
	    });
	  }
	  return { open, cancel };
	}

	function insertCss(css) {
	  const style = document.createElement('style');
	  style.appendChild(document.createTextNode(css));
	  document.head.appendChild(style);
	  return style;
	}

	const messagePickerCss = `
body.wipecord-pick-message [data-list-id="chat-messages"] {
  background-color: var(--background-secondary-alt);
  box-shadow: inset 0 0 0px 2px var(--background-brand, var(--button-outline-brand-border));
}

body.wipecord-pick-message [id^="message-content-"]:hover {
  cursor: pointer;
  cursor: cell;
  background: var(--message-automod-background-hover, var(--background-message-automod-hover));
}
body.wipecord-pick-message [id^="message-content-"]:hover::after {
  position: absolute;
  top: calc(50% - 11px);
  left: 4px;
  z-index: 1;
  width: 65px;
  height: 22px;
  line-height: 22px;
  font-family: var(--font-display);
  background-color: var(--control-secondary-background-default, var(--button-secondary-background));
  color: var(--text-subtle, var(--header-secondary));
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  text-align: center;
  border-radius: 3px;
  content: 'This 👉';
}
body.wipecord-pick-message.before [id^="message-content-"]:hover::after {
  content: 'Before 👆';
}
body.wipecord-pick-message.after [id^="message-content-"]:hover::after {
  content: 'After 👇';
}
`;

	const messagePicker = {
	  init() {
	    insertCss(messagePickerCss);
	    window.messagePicker = messagePicker;
	  },
	  grab(auxiliary) {
	    return new Promise((resolve) => {
	      document.body.classList.add('wipecord-pick-message');
	      if (auxiliary) document.body.classList.add(auxiliary);

	      function done(id) {
	        if (auxiliary) document.body.classList.remove(auxiliary);
	        document.body.classList.remove('wipecord-pick-message');
	        document.removeEventListener('click', clickHandler, true);
	        document.removeEventListener('keydown', keyHandler, true);
	        resolve(id);
	      }

	      function clickHandler(e) {
	        // Accept a click anywhere on the message row, not only on its text.
	        const message = e.target.closest('[id^="message-content-"], li[id^="chat-messages-"], [data-list-item-id^="chat-messages___"]');
	        if (!message) return;
	        e.preventDefault();
	        e.stopPropagation();
	        e.stopImmediatePropagation();
	        const id = message.id || message.getAttribute('data-list-item-id') || '';
	        const match = id.match(/(?:message-content-|chat-messages-\d+-|chat-messages___)(\d+)/);
	        done(match ? match[1] : null);
	      }

	      function keyHandler(e) {
	        if (e.key === 'Escape') done(null); // otherwise the handler leaks forever
	      }

	      document.addEventListener('click', clickHandler, true);
	      document.addEventListener('keydown', keyHandler, true);
	    });
	  }
	};

	/** Discord encrypts the stored token in the desktop app; that value is unusable here. */
	const ENCRYPTED_TOKEN_PREFIX = 'dQw4w9WgXcQ:';
	const API = new URL('/api/v9', window.location.href).href;
	const REQUEST_TIMEOUT = 30000;

	/**
	 * Discord deletes window.localStorage, but only the window reference — the
	 * origin's storage is untouched, so a throwaway same-origin iframe still
	 * exposes it.
	 */
	function readLocalStorage(keys) {
	  const iframe = document.createElement('iframe');
	  iframe.style.display = 'none';
	  document.body.appendChild(iframe);
	  try {
	    const storage = iframe.contentWindow.localStorage;
	    const values = {};
	    for (const key of keys) values[key] = storage[key];
	    return values; // read before the frame is detached, contentWindow dies with it
	  } catch {
	    log.verb('Could not read the saved Discord session. Trying the Discord client instead.');
	    return {};
	  } finally {
	    iframe.remove();
	  }
	}

	function parseStored(raw) {
	  if (raw === undefined || raw === null) return null;
	  try { return JSON.parse(raw); } catch { return null; }
	}

	function looksLikeToken(token) {
	  return typeof token === 'string' && token.length > 0 && !token.startsWith(ENCRYPTED_TOKEN_PREFIX);
	}

	/**
	 * Walk Discord's webpack module cache looking for a module that can hand us
	 * something. Used as a fallback because Discord removes the token from local
	 * storage whenever DevTools is open.
	 */
	function fromWebpack(pick) {
	  const chunks = window.webpackChunkdiscord_app;
	  if (!chunks || typeof chunks.push !== 'function') return null;

	  let found = null;
	  try {
	    // A unique chunk id, so we can never collide with a real one and mark it
	    // as already installed (which breaks the client).
	    chunks.push([[Symbol('wipecord')], {}, (require) => {
	      let modules;
	      try { modules = Object.values(require.c || {}); } catch { return; }
	      for (const module of modules) {
	        try {
	          const value = pick(module && module.exports);
	          if (value) { found = value; return; }
	        } catch { /* individual module getters can throw */ }
	      }
	    }]);
	  } catch {
	    log.verb('Automatic Discord client lookup failed. Refresh Discord and update Wipecord if session detection still fails.');
	  } finally {
	    chunks.pop(); // don't leave our fake chunk behind
	  }
	  return found;
	}

	function getToken() {
	  const stored = parseStored(readLocalStorage(['token']).token);
	  if (looksLikeToken(stored)) return stored;

	  log.info('Trying another method to detect your Discord session...');
	  // The token module exports getToken directly; the auth store exposes it on
	  // default. Other modules (i18n) also have a getToken that returns an object,
	  // hence the string check.
	  const token = fromWebpack(exports => {
	    if (!exports) return null;
	    const source = (typeof exports.getToken === 'function' && exports)
	      || (exports.default && typeof exports.default.getToken === 'function' && exports.default);
	    if (!source) return null;
	    const value = source.getToken();
	    return looksLikeToken(value) ? value : null;
	  });

	  if (!token) throw new Error('Could not find the Authorization Token.');
	  return token;
	}

	function getAuthorId() {
	  const cached = parseStored(readLocalStorage(['user_id_cache']).user_id_cache);
	  if (isSnowflake(cached)) return String(cached);

	  const fromStore = fromWebpack(exports => {
	    const store = exports && exports.default;
	    if (!store || typeof store.getId !== 'function' || typeof store.getToken !== 'function') return null;
	    const id = store.getId();
	    return isSnowflake(id) ? String(id) : null;
	  });
	  if (fromStore) return fromStore;

	  log.error('Could not detect your User ID, please fill the "Author ID" field manually.');
	  return '';
	}

	function guildIdsFrom(value) {
	  const guilds = Array.isArray(value) ? value : Object.values(value || {});
	  return [...new Set(guilds
	    .map(guild => guild && String(guild.id))
	    .filter(isSnowflake))];
	}

	/** Return server IDs already held by Discord's in-memory guild store. */
	function getGuildIds() {
	  return fromWebpack(exports => {
	    const candidates = [exports, exports && exports.default, exports && exports.Z, exports && exports.ZP];
	    for (const store of candidates) {
	      if (!store || typeof store.getGuild !== 'function' || typeof store.getGuilds !== 'function') continue;
	      const ids = guildIdsFrom(store.getGuilds());
	      if (ids.length) return ids;
	    }
	    return null;
	  }) || [];
	}

	/** Fall back to Discord's current-user guild endpoint when the store moved. */
	async function fetchGuildIds(authToken) {
	  if (!looksLikeToken(authToken)) return [];

	  let resp;
	  try {
	    resp = await fetch(`${API}/users/@me/guilds?limit=200`, {
	      headers: { 'Authorization': authToken },
	      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
	    });
	  } catch {
	    log.error(connectionError('load your servers'), 'Click all again after checking your connection; the server list is not retried automatically.');
	    return [];
	  }

	  let data;
	  try { data = await resp.json(); } catch { data = null; }


	  if ((data && data.code === 40333) || (resp.status === 429 && !data)) {
	    log.error(TEMPORARY_BLOCK);
	    return [];
	  }
	  if (!resp.ok) {
	    if (resp.status === 429) {
	      const retryAfter = Number(data && data.retry_after);
	      const suffix = Number.isFinite(retryAfter) && retryAfter > 0 ? ` Wait at least ${retryAfter.toFixed(1)} seconds before clicking all again.` : ' Wait before clicking all again.';
	      log.warn(`Discord requested a pause while loading your servers.${suffix} The server list is not retried automatically.`);
	    }
	    else log.error(requestError(resp.status, data && data.code, 'load your servers'));
	    return [];
	  }

	  const ids = guildIdsFrom(data);
	  if (!ids.length) log.warn('Discord did not return any servers for this account.');
	  return ids;
	}

	function getGuildId() {
	  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
	  if (m) return m[1];
	  alert('Could not detect the Server ID.\nOpen a server channel or conversation, then retry.');
	  return '';
	}

	function getChannelId() {
	  const m = location.href.match(/channels\/([\w@]+)\/(\d+)/);
	  if (m) return m[2];
	  alert('Could not find the Channel ID!\nPlease make sure you are on a Channel or DM.');
	  return '';
	}

	function fillToken() {
	  try {
	    return getToken();
	  } catch {
	    log.error('Could not detect your Discord session. Open a conversation while signed in, refresh Discord, and make sure Wipecord is up to date before retrying. Never share your authorization token.');
	  }
	  return '';
	}

	const PREFIX = '[WIPECORD]';

	// -------------------------- User interface ------------------------------- //

	// links
	const HOME = 'https://github.com/rafelolv/Wipecord';
	const WIKI = 'https://github.com/rafelolv/Wipecord/blob/main/docs/USER-GUIDE.md';

	const wipecordCore = new WipecordCore();

	const ui = {
	  wipecordWindow: null,
	  wipecordBtn: null,
	  logArea: null,
	  autoScroll: null,

	  // progress handler
	  progressMain: null,
	  progressIcon: null,
	  percent: null,
	};
	const $ = s => ui.wipecordWindow.querySelector(s);

	/** Find the channel-header toolbar using semantics first, then CSS-module fallbacks. */
	function findToolbar() {
	  const selectors = [
	    '#app-mount section[aria-label="Channel header"] [role="toolbar"]',
	    '#app-mount section[aria-label="Channel header"] [class*="toolbar_"]',
	    '#app-mount [class*="upperContainer_"] [class*="toolbar_"]',
	    '#app-mount section[class*="container_"]:has([class*="children_"]) > [class*="toolbar_"]',
	  ];
	  for (const selector of selectors) {
	    const toolbar = [...document.querySelectorAll(selector)].find(element => element.getClientRects().length);
	    if (toolbar) return toolbar;
	  }
	}

	let previousToolbar;
	function stableToolbar() {
	  const toolbar = findToolbar();
	  const stable = toolbar && toolbar === previousToolbar;
	  previousToolbar = toolbar;
	  return stable ? toolbar : null;
	}

	function mountBtn() {
	  const toolbar = stableToolbar();
	  if (toolbar) {
	    if (!toolbar.contains(ui.wipecordBtn)) toolbar.appendChild(ui.wipecordBtn);
	  }
	}

	function initUI() {
	  messagePicker.init();

	  insertCss(themeCss);
	  insertCss(mainCss);
	  insertCss(dragCss);

	  // create wipecord window
	  ui.wipecordWindow = createElm(wipecordTemplate, {
	    VERSION,
	    HOME,
	    WIKI,
	  });
	  document.body.appendChild(ui.wipecordWindow);

	  // enable drag and resize on wipecord window
	  new DragResize({ elm: ui.wipecordWindow, moveHandle: $('.header') });

	  // Create the Wipecord logo button.
	  ui.wipecordBtn = createElm(buttonHtml);
	  ui.wipecordBtn.onclick = toggleWindow;
	  mountBtn();
	  // Discord rebuilds the header bar on channel switches and may leave the old
	  // toolbar mounted briefly. Re-resolve the preferred toolbar so the button is
	  // moved into the current header instead of remaining in a stale one.
	  setInterval(mountBtn, 1000);

	  function toggleWindow() {
	    if (ui.wipecordWindow.style.display !== 'none') {
	      wipecordCore.onCancelConfirmation?.();
	      ui.wipecordWindow.style.display = 'none';
	      ui.wipecordBtn.style.color = 'var(--interactive-icon-default, var(--interactive-normal))';
	    }
	    else {
	      ui.wipecordWindow.style.display = '';
	      ui.wipecordBtn.style.color = 'var(--interactive-icon-active, var(--interactive-active))';
	    }
	  }

	  // cached elements
	  ui.logArea = $('#logArea');
	  ui.autoScroll = $('#autoScroll');
	  ui.progressMain = $('#progressBar');
	  ui.progressIcon = ui.wipecordBtn.querySelector('progress');
	  ui.percent = $('#progressPercent');

	  const prompt = confirmation(ui.wipecordWindow, () => wipecordCore.stop());
	  wipecordCore.onCancelConfirmation = prompt.cancel;
	  wipecordCore.onConfirm = details => {
	    const options = wipecordCore.options;
	    // Snapshot only the target/filter whitelist; never pass tokens or core state.
	    const fields = [
	      ['Server', options.guildId === '@me' ? 'Direct messages / group DMs' : options.guildId, options.guildId !== '@me'],
	      ['Channel', options.channelId || 'All server channels', !!options.channelId],
	      ['Author', options.authorId || 'All matching authors', !!options.authorId],
	      ['Containing text', options.content || 'Any text', !!options.content],
	      ['Pattern', options.pattern || 'None', !!options.pattern],
	      ['After', options.minId || 'No lower bound', !!options.minId],
	      ['Before', options.maxId || 'No upper bound', !!options.maxId],
	      ['Message filters', `${options.hasLink ? 'Links only; ' : ''}${options.hasFile ? 'Files only; ' : ''}${options.includePinned ? 'Pinned included' : 'Pinned excluded'}${options.guildId !== '@me' ? (options.includeNsfw ? '; NSFW included' : '; NSFW excluded') : ''}`, false],
	    ];
	    return prompt.open({ ...details, fields });
	  };

	  // register event listeners
	  $('#hide').onclick = toggleWindow;
	  $('#toggleSidebar').onclick = () => {
	    const hidden = ui.wipecordWindow.classList.toggle('hide-sidebar');
	    $('#toggleSidebar').setAttribute('aria-expanded', String(!hidden));
	    $('#toggleSidebar').setAttribute('aria-label', hidden ? 'Show settings' : 'Hide settings');
	  };
	  $('button#start').onclick = startAction;
	  $('button#stop').onclick = stopAction;
	  let finalReport;
	  $('#exportReport').onclick = () => {
	    if (!finalReport) return;
	    const url = URL.createObjectURL(new Blob([JSON.stringify(finalReport, null, 2) + '\n'], { type: 'application/json' }));
	    const link = document.createElement('a');
	    link.href = url;
	    link.download = 'wipecord-report.json';
	    document.body.appendChild(link);
	    link.click();
	    link.remove();
	    setTimeout(() => URL.revokeObjectURL(url), 1000);
	  };
	  ui.showReport = report => {
	    finalReport = report ? { ...report, version: VERSION } : undefined;
	    $('#runSummary').hidden = !finalReport;
	    if (!finalReport) return;
	    const labels = { completed: 'Completed', cancelled: 'Confirmation cancelled', stopped: 'Stopped by you', error: 'Ended with errors' };
	    const { counts, reason, durationMs } = finalReport;
	    const outcome = reason === 'completed' && counts.failed > 0 ? 'Finished with failed messages' : labels[reason];
	    $('#runSummary').dataset.outcome = counts.failed > 0 || reason === 'error' ? 'error' : reason;
	    $('#summaryOutcome').textContent = outcome;
	    $('#summaryDeleted').textContent = String(counts.deleted);
	    $('#summaryBreakdown').textContent = `${counts.ignored} ignored · ${counts.failed} failed · ${counts.alreadyGone} already gone`;
	    $('#summaryDuration').textContent = `Elapsed ${msToHMS(durationMs)}`;
	  };
	  const emptyState = [...ui.logArea.childNodes].map(node => node.cloneNode(true));
	  $('button#clear').onclick = () => {
	    ui.logArea.replaceChildren(...(wipecordCore.busy
	      ? [renderLog('verb', ['Log cleared. Cleanup is still running.'])]
	      : emptyState.map(node => node.cloneNode(true))));
	  };
	  // Only overwrite a field when we actually found something, otherwise a failed
	  // lookup wipes what the user typed (or stamps it with "undefined").
	  let allServersSelected = false;
	  const updateServerScope = () => {
	    const multiple = $('input#guildId').value.split(',').filter(value => value.trim()).length > 1;
	    const broad = multiple || allServersSelected;
	    $('#guildId').classList.toggle('broad-scope', broad);
	    $('#getGuilds').classList.toggle('broad-scope', broad);
	    $('#serverScopeWarning').hidden = !broad;
	    const limited = !!$('input#channelId').value.trim();
	    $('#serverScopeTitle').textContent = limited ? 'Multiple servers selected' : 'All server channels selected';
	    $('#serverScopeDetails').textContent = limited
	      ? 'Channel IDs, author and filters still apply. Review before starting.'
	      : 'Author and filters still apply. Deletion requires Start and confirmation.';
	  };
	  $('#guildId').addEventListener('input', () => { allServersSelected = false; updateServerScope(); });
	  $('#channelId').addEventListener('input', updateServerScope);
	  const fillField = (selector, value) => {
	    if (value) {
	      $(selector).value = value;
	      $(selector).dispatchEvent(new Event('input', { bubbles: true }));
	    }
	  };
	  $('button#getAuthor').onclick = () => fillField('input#authorId', getAuthorId());
	  $('button#getGuild').onclick = () => {
	    const guildId = getGuildId();
	    fillField('input#guildId', guildId);
	    if (guildId === '@me') fillField('input#channelId', getChannelId());
	  };
	  let loadingGuilds = false;
	  $('button#getGuilds').onclick = async () => {
	    if (wipecordCore.busy) return log.error('Stop the current run before loading the server list.');
	    if (loadingGuilds) return;
	    loadingGuilds = true;
	    try {
	      let guildIds = getGuildIds();
	      if (!guildIds.length) {
	        const authToken = $('input#token').value.trim() || fillToken();
	        if (!authToken) return;
	        guildIds = await fetchGuildIds(authToken);
	      }
	      if (!guildIds.length) return;

	      $('input#guildId').value = guildIds.join(',');
	      $('input#channelId').value = '';
	      if (!$('input#authorId').value.trim()) fillField('input#authorId', getAuthorId());
	      allServersSelected = true;
	      updateServerScope();
	      log.warn(`Selected ${guildIds.length} servers and all their channels. The selected author and filters still apply. Review the targets, then start and confirm to delete messages.`);
	    } finally {
	      loadingGuilds = false;
	    }
	  };
	  $('button#getChannel').onclick = () => {
	    fillField('input#channelId', getChannelId());
	    fillField('input#guildId', getGuildId());
	  };
	  $('#redact').onchange = () => {
	    const b = $('#redact').checked;
	    ui.wipecordWindow.classList.toggle('redact', b);
	    if (b) alert('This mode will attempt to hide personal information, so you can screen share / take screenshots.\nAlways double check you are not sharing sensitive information!');
	  };
	  $('#pickMessageAfter').onclick = async () => {
	    alert('Select a message to set the lower limit.\nOnly matching messages newer than it will be eligible. The selected message is excluded. Nothing is deleted until you start and confirm.');
	    toggleWindow();
	    const id = await messagePicker.grab('after');
	    if (id) $('input#minId').value = id;
	    toggleWindow();
	  };
	  $('#pickMessageBefore').onclick = async () => {
	    alert('Select a message to set the upper limit.\nOnly matching messages older than it will be eligible. The selected message is excluded. Nothing is deleted until you start and confirm.');
	    toggleWindow();
	    const id = await messagePicker.grab('before');
	    if (id) $('input#maxId').value = id;
	    toggleWindow();
	  };
	  $('button#getToken').onclick = () => fillField('input#token', fillToken());

	  // sync delays
	  $('input#searchDelay').onchange = (e) => {
	    const v = parseInt(e.target.value);
	    if (v) wipecordCore.options.searchDelay = v;
	  };
	  $('input#deleteDelay').onchange = (e) => {
	    const v = parseInt(e.target.value);
	    if (v) wipecordCore.options.deleteDelay = v;
	  };

	  $('input#searchDelay').addEventListener('input', (event) => {
	    $('div#searchDelayValue').textContent = event.target.value + 'ms';
	  });
	  $('input#deleteDelay').addEventListener('input', (event) => {
	    $('div#deleteDelayValue').textContent = event.target.value + 'ms';
	  });

	  // the labels are empty until the first drag, so seed them from the markup
	  $('div#searchDelayValue').textContent = $('input#searchDelay').value + 'ms';
	  $('div#deleteDelayValue').textContent = $('input#deleteDelay').value + 'ms';

	  // import json
	  const fileSelection = $('input#importJsonInput');
	  fileSelection.onchange = async () => {
	    const files = fileSelection.files;

	    // No files added
	    if (files.length === 0) return log.warn('No file selected.');

	    if (wipecordCore.busy || startPending) return log.error('Stop the current run before importing targets.');
	    // Get channel id field to set it later
	    const channelIdField = $('input#channelId');

	    const guildIdField = $('input#guildId');
	    try {
	      const file = files[0];
	      const text = await file.text();
	      const channelIds = parseArchive(text);
	      // File reads are asynchronous; recheck before committing target changes.
	      if (wipecordCore.busy || startPending || fileSelection.files[0] !== file) return log.warn('Import discarded because the selection or run changed.');
	      const authorId = $('input#authorId').value.trim() || getAuthorId();
	      if (!isSnowflake(authorId)) throw Error('Fill a valid Author ID before importing conversations.');
	      guildIdField.value = '@me';
	      $('input#authorId').value = authorId;
	      channelIdField.value = channelIds.join(',');
	      allServersSelected = false;
	      updateServerScope();
	      log.info(`Loaded ${channelIds.length} channels.`);
	    } catch(err) {
	      log.error('Could not import conversations:', err);
	    }
	  };

	  // redirect console logs to inside the window after setting up the UI
	  setLogFn(printLog);

	  setupWipecordCore();
	}

	/** Keep the log pane useful without letting a long run fill the DOM. */
	const MAX_LOG_LINES = 5000;

	function printLog(type = '', args) {
	  ui.logArea.querySelector('.empty-state')?.remove();
	  ui.logArea.appendChild(renderLog(type, args));

	  if (ui.logArea.childElementCount > MAX_LOG_LINES) {
	    while (ui.logArea.childElementCount > MAX_LOG_LINES) ui.logArea.firstElementChild.remove();
	    ui.logArea.prepend(renderLog('verb', ['[older lines trimmed]']));
	  }

	  if (ui.autoScroll.checked) ui.logArea.lastElementChild.scrollIntoView(false);
	  if (type === 'error') console.error(PREFIX, ...Array.from(args));
	}

	function setupWipecordCore() {

	  wipecordCore.onStart = (state, stats) => {
	    ui.showReport();
	    setRuntimeState('running');
	    $('#start').disabled = true;
	    $('#stop').disabled = false;

	    ui.wipecordBtn.classList.add('running');
	    ui.progressMain.style.display = 'block';
	    ui.progressMain.removeAttribute('value');
	    ui.progressIcon.removeAttribute('value');
	    ui.percent.style.display = 'block';
	    const { index, total } = wipecordCore.targetProgress;
	    $('#progressPrimary').textContent = 'Preparing cleanup…';
	    $('#progressTarget').textContent = `Target ${index} of ${total}`;
	    $('#progressDetails').textContent = 'Waiting for matching messages. You can stop at any time.';
	  };

	  wipecordCore.onProgress = (state, stats) => {
	    // console.log(PREFIX, 'onProgress', state, stats);
	    const value = state.delCount + state.failCount;
	    const estimate = Math.max(state.grandTotal, value, 0);
	    const elapsed = msToHMS(Date.now() - stats.startTime.getTime());
	    // Show when we are pacing ourselves above the configured delay, instead of
	    // rewriting the user's slider behind their back.
	    const throttled = stats.deleteBackoff > 0 ? ` (extra delay: ${(stats.deleteBackoff / 1000).toFixed(1)}s)` : '';

	    const { index, total } = wipecordCore.targetProgress;
	    $('#progressTarget').textContent = `Target ${index} of ${total}`;
	    // A search estimate is not a completion boundary. Stay indeterminate
	    // through pagination, retries and final sweeps; the report owns completion.
	    ui.progressIcon.removeAttribute('value');
	    ui.progressMain.removeAttribute('value');
	    if (state.historyMode) {
	      $('#progressPrimary').textContent = `${value} processed · Scanning history`;
	      $('#progressDetails').textContent = `History: ${state.historyScanned} checked · Elapsed ${elapsed} · Total unknown${throttled}`;
	      return;
	    }
	    $('#progressPrimary').textContent = `${value} processed · Still checking search results`;
	    $('#progressDetails').textContent = estimate
	      ? `Search estimate: ~${estimate} (not a final total) · Elapsed ${elapsed}${throttled}`
	      : `Elapsed ${elapsed} · Total unknown${throttled}`;
	  };

	  wipecordCore.onStop = (state, stats) => {
	    ui.showReport(wipecordCore.report);
	    setRuntimeState('idle');
	    $('#start').disabled = false;
	    $('#stop').disabled = true;
	    ui.wipecordBtn.classList.remove('running');
	    ui.progressMain.style.display = 'none';
	    ui.percent.style.display = 'none';
	  };
	}

	let startPending = false;
	async function startAction() {
	  if (startPending || wipecordCore.busy) return log.error('Already running!');
	  startPending = true;
	  try {
	    // Compatible installations in other tabs share this origin-wide lock.
	    // Never queue a destructive run to start automatically when another ends.
	    if (!navigator.locks) return log.error('This browser cannot coordinate deletion runs. Update your browser.');
	    await navigator.locks.request('wipecord-deletion', { ifAvailable: true }, async lock => {
	      if (!lock) return log.error('Wipecord is already running in another tab. Stop it before starting here.');
	      await performStartAction();
	    });
	  } catch {
	    log.error('Wipecord could not coordinate this run between tabs. Review any existing run summary, then refresh Discord and update your browser before retrying.');
	  } finally {
	    startPending = false;
	  }
	}

	async function performStartAction() {
	  console.log(PREFIX, 'startAction');
	  // Bail before resetState(), which would otherwise clear the flag the core
	  // checks and let a second delete loop run over the same state.
	  if (wipecordCore.busy) return log.error('Already running!');
	  // general
	  const authorId = $('input#authorId').value.trim();
	  let plan;
	  try {
	    plan = buildPurgePlan($('input#guildId').value, $('input#channelId').value);
	  } catch (err) {
	    return log.error(escapeHTML(err && err.message || err));
	  }
	  const { guildIds, jobs } = plan;
	  const { guildId, channelId } = jobs[0];
	  const includeNsfw = $('input#includeNsfw').checked;
	  // filter
	  const content = $('input#search').value.trim();
	  const hasLink = $('input#hasLink').checked;
	  const hasFile = $('input#hasFile').checked;
	  const includePinned = $('input#includePinned').checked;
	  const pattern = $('input#pattern').value;
	  // message interval
	  const minId = $('input#minId').value.trim();
	  const maxId = $('input#maxId').value.trim();
	  // date range
	  const minDate = $('input#minDate').value.trim();
	  const maxDate = $('input#maxDate').value.trim();
	  //advanced
	  const searchDelay = parseInt($('input#searchDelay').value.trim()) || 2000;
	  const deleteDelay = parseInt($('input#deleteDelay').value.trim()) || 1000;

	  let filters;
	  try {
	    if ($('#minDate').validity.badInput || $('#maxDate').validity.badInput) throw Error('Complete or clear the date fields before starting.');
	    filters = resolveFilters({ pattern, minId, maxId, minDate, maxDate });
	  } catch (error) {
	    return log.error(escapeHTML(error.message));
	  }


	  if (authorId && !isSnowflake(authorId)) return log.error('"Author ID" must be a Discord id.');
	  if (guildIds.length > 1 && !authorId) {
	    return log.error('"Author ID" is required when purging multiple servers. Click "me" to use your own account.');
	  }
	  if (guildId === '@me' && !authorId) {
	    return log.error('"Author ID" is required for DMs and group DMs. Click "me" to use your own account.');
	  }
	  for (const [label, value] of [['After a message', minId], ['Before a message', maxId]]) {
	    if (value && !isSnowflake(value)) return log.error(`"${label}" must be a message id.`, escapeHTML(value));
	  }
	  // token
	  const authToken = $('input#token').value.trim() || fillToken();
	  if (!authToken) return; // get token already logs an error.

	  // clear logArea
	  ui.logArea.replaceChildren();

	  wipecordCore.resetState();
	  wipecordCore.options = {
	    ...wipecordCore.options,
	    authToken,
	    authorId,
	    guildId,
	    channelId,
	    minId: filters.minId,
	    maxId: filters.maxId,
	    content,
	    hasLink,
	    hasFile,
	    includeNsfw,
	    includePinned,
	    pattern,
	    searchDelay,
	    deleteDelay,
	    // maxAttempt: 2,
	  };

	  try {
	    if (jobs.length > 1) await wipecordCore.runBatch(jobs);
	    else await wipecordCore.run();
	  } catch (err) {
	    log.error('Run ended with an error:', err?.name === 'WipecordError' ? escapeHTML(err.message) : 'An unexpected error occurred. Refresh Discord and update Wipecord before retrying. If it persists, report the problem without account or message data.');
	  } finally {
	    // run() unlocks the UI itself; this only covers a throw that escaped it.
	    if (wipecordCore.state.running) wipecordCore.stop();
	  }
	}

	function stopAction() {
	  console.log(PREFIX, 'stopAction');
	  wipecordCore.stop();
	}

	/** Let Discord finish mounting its header before adding any interface DOM. */
	function waitForUI() {
	  const timer = setInterval(() => {
	    if (!document.body || !stableToolbar()) return;
	    clearInterval(timer);
	    initUI();
	  }, 500);
	}

	// ---- END Wipecord ----

	if (claimRuntime(document, VERSION)) waitForUI();
	else console.warn('[WIPECORD] Another installation already owns this page. Disable the duplicate and reload.');

})();
