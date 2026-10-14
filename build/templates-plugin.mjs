import { parseFragment } from 'parse5';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Compile repository-owned templates to data, never executable HTML strings. */
export function templates() {
  function describe(node) {
    if (node.nodeName === '#text') return node.value;
    if (!node.tagName) return null;
    if (node.tagName === 'wipecord-logo') {
      const root = parseFragment(readFileSync(new URL('../images/icon.svg', import.meta.url), 'utf8')).childNodes.find(child => child.tagName === 'svg');
      root.attrs.push(...node.attrs);
      return describe(root);
    }
    if (node.tagName === 'script' || node.attrs.some(attribute => /^on/i.test(attribute.name))) throw Error('Executable template markup is not allowed.');
    return {
      tag: node.tagName,
      namespace: node.namespaceURI,
      attributes: node.attrs.map(attribute => [attribute.name, attribute.value, attribute.namespace || null, attribute.prefix || null]),
      children: (node.childNodes || []).map(describe).filter(child => child !== null),
    };
  }
  return {
    name: 'wipecord-templates',
    transform(code, id) {
      if (!id.endsWith('.html')) return;
      if (code.includes('<wipecord-logo')) this.addWatchFile(fileURLToPath(new URL('../images/icon.svg', import.meta.url)));
      const root = parseFragment(code).childNodes.find(node => node.tagName);
      if (!root) throw Error('Template must have a root element.');
      return { code: `export default ${JSON.stringify(describe(root))};`, map: { mappings: '' } };
    },
  };
}
