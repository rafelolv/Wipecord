/* global chrome */
const status = document.getElementById('status');
document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version} · experimental`;

async function refresh() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.tabs.sendMessage(tab.id, { type: 'wipecord:status' });
    status.textContent = result.ready ? (result.state === 'running' ? 'Deletion in progress' : 'Ready in this tab') : 'Reload Discord to load Wipecord';
    document.getElementById('detail').textContent = result.duplicate
      ? 'Another installation was detected. Keep only one enabled and reload.'
      : `Open the Wipecord button in Discord to choose a target. Runtime: ${result.version}.`;
    status.dataset.ready = String(result.ready);
  } catch {
    status.textContent = 'Open Discord in your browser';
    document.getElementById('detail').textContent = 'Use a channel or DM tab, allow site access, then reload. Opening this popup never starts a deletion.';
    status.dataset.ready = 'false';
  }
}
refresh();
setInterval(refresh, 1500);
