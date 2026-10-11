import { isSnowflake, toSnowflake } from './utils/helpers.js';

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
export function validateFilters({ pattern, minId, maxId }) {
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

export function resolveFilters({ pattern, minId, maxId, minDate, maxDate }) {
  for (const value of [minId, maxId]) if (value && !isSnowflake(value)) throw Error('Message bounds must be valid Discord message IDs.');
  validateFilters({ minId: minDate, maxId: maxDate });
  validateFilters({ pattern, minId: minId || minDate, maxId: maxId || maxDate });
  return { minId: minId || minDate || undefined, maxId: maxId || maxDate || undefined };
}

/** Archive labels are ignored; only validated string keys become targets. */
export function parseArchive(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw Error('The archive is not valid JSON.'); }
  if (data === null || Array.isArray(data) || typeof data !== 'object') throw Error('Choose messages/index.json: an object keyed by channel IDs.');
  const ids = Object.keys(data);
  if (!ids.length || ids.some(id => id !== id.trim() || !isSnowflake(id))) throw Error('The archive must contain only valid channel ID keys and cannot be empty.');
  if (Object.values(data).some(value => value !== null && typeof value !== 'string')) throw Error('Archive channel labels must be strings or null. Choose messages/index.json.');
  return ids;
}
