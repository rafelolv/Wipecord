/** A DOM claim is shared by page-world scripts and userscript wrappers alike. */
export function claimRuntime(document, version) {
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

export function setRuntimeState(state) {
  document.getElementById('wipecord-runtime').dataset.state = state;
}
