import { replaceInterpolations } from './helpers.js';

/** Build trusted template data with DOM APIs; substituted values stay inert. */
export default function createElm(template, values = {}) {
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
