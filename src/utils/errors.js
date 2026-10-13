// Keep API diagnostics numeric; response bodies and exceptions can contain private data.
export const SESSION_EXPIRED = 'Your Discord session is invalid or expired. Sign in to Discord again, refresh the page, then retry.';
export const TEMPORARY_BLOCK = 'Discord temporarily blocked requests. Wipecord will not retry this block automatically. Stop other deletion tools and wait before trying again; use longer request delays next time.';

export function requestError(status, code, action) {
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

export function connectionError(action) {
  return `Could not reach Discord to ${action}; the connection failed or timed out. Check your connection. Retries are limited; if this run cannot recover, wait and try again.`;
}

export function exhaustedRetries(action, attempts) {
  return `Stopped trying to ${action} after ${attempts} attempts. Check your connection and the warnings above. Wait before starting another run.`;
}
