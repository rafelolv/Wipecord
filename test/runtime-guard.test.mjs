import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const { claimRuntime } = await import(`data:text/javascript;base64,${readFileSync('src/runtime-guard.js').toString('base64')}`);
function fixture(legacy = false) {
  const elements = new Map(legacy ? [['wipecord', {}]] : []);
  return {
    getElementById: id => elements.get(id),
    createElement: () => ({ dataset: {} }),
    head: { appendChild: element => elements.set(element.id, element) },
  };
}
test('Only the first installation can initialize; duplicate versions share the claim', () => {
  const document = fixture();
  assert.equal(claimRuntime(document, '1.2.0'), true);
  assert.equal(claimRuntime(document, '1.3.0'), false);
  assert.equal(claimRuntime(document, '1.2.0'), false);
  assert.deepEqual(document.getElementById('wipecord-runtime').dataset, { version: '1.2.0', state: 'idle', duplicates: '2' });
});
test('An existing legacy panel blocks the new engine', () => {
  const document = fixture(true);
  assert.equal(claimRuntime(document, '1.2.0'), false);
  assert.equal(document.getElementById('wipecord-runtime').dataset.version, 'legacy');
});
