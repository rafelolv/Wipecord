import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseFragment } from 'parse5';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const artifact = readFileSync(pkg.main, 'utf8');
// All runtime placements must use the same vector paths as store/package assets.
const brand = parseFragment(readFileSync('images/icon.svg', 'utf8')).childNodes.find(node => node.tagName === 'svg');
for (const path of brand.childNodes.filter(node => node.tagName === 'path')) {
  const geometry = path.attrs.find(attribute => attribute.name === 'd').value;
  assert.ok(artifact.split(JSON.stringify(geometry)).length >= 4, 'Panel and both Discord shortcuts must embed the canonical logo');
}
assert.ok(!artifact.includes('wipecord-logo'), 'Logo slots must be compiled before distribution');
const license = readFileSync('LICENSE', 'utf8').trim();
assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
assert.ok(artifact.includes(license), 'Distributed userscript must include the complete license');
for (const [key, value] of Object.entries({
  name: pkg.nameFull,
  version: pkg.version,
  namespace: pkg.userScript.namespace,
  downloadURL: pkg.userScript.downloadURL,
  updateURL: pkg.userScript.updateURL,
})) {
  assert.ok(artifact.split('\n').some(line => line.startsWith(`// @${key} `) && line.trimEnd().endsWith(` ${value}`)), `Incorrect @${key}`);
}
assert.equal(pkg.userScript.downloadURL, 'https://raw.githubusercontent.com/rafelolv/Wipecord/main/wipecord.user.js');
assert.equal(pkg.userScript.updateURL, pkg.userScript.downloadURL);
assert.equal(pkg.userScript.namespace, 'https://github.com/rafelolv/Wipecord');
assert.equal(pkg.main, 'wipecord.user.js');
execFileSync(process.execPath, ['--check', pkg.main], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/rollup/dist/bin/rollup', '-c'], { stdio: 'pipe' });
assert.equal(readFileSync(pkg.main, 'utf8'), artifact, 'Production builds must be deterministic');
console.log('Artifact metadata, license, syntax and deterministic build verified.');
