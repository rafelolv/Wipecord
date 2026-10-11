import { escapeHTML } from './helpers.js';

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': '\'' };
const decode = text => text.replace(/&(amp|lt|gt|quot|#039);/g, (_, name) => entities[name]);

/** Only the four attribute-free formatting tags can become elements. */
export default function renderLog(type, args) {
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
