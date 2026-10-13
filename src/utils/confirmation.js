import { log } from './log.js';

/** Resolve only from explicit controls. A missing/failed dialog cancels safely. */
export default function confirmation(panel, stopRun) {
  const dialog = panel.querySelector('#confirmDeletion');
  const cancelButton = panel.querySelector('#cancelDeletion');
  const acceptButton = panel.querySelector('#acceptDeletion');
  let pending;

  const cancel = () => pending?.(false);
  function open({ summary, batchNotice, preview, fields }) {
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
    previewNode.textContent = preview.slice(0, 6000);
    panel.querySelector('#confirmTruncated').hidden = preview.length <= 6000;
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
