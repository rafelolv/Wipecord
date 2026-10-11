import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const artifact = readFileSync(pkg.main, 'utf8');
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
