/* global chrome */
// Read-only bridge. Tokens, targets and message data never cross this boundary.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message?.type !== 'wipecord:status') return;
  const marker = document.getElementById('wipecord-runtime');
  respond({
    ready: !!document.getElementById('wipecord'),
    version: marker?.dataset.version || 'unknown',
    state: marker?.dataset.state === 'running' ? 'running' : 'idle',
    duplicate: Number(marker?.dataset.duplicates || 0) > 0 || marker?.dataset.version === 'legacy',
  });
});
