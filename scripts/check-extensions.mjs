import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';

const pkg = JSON.parse(readFileSync('package.json'));
const runtime = readFileSync(pkg.main);
const hash = data => createHash('sha256').update(data).digest('hex');
const archives = {};
for (const browser of ['chromium', 'firefox']) {
  const folder = `dist/${browser}`;
  const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`));
  const info = JSON.parse(readFileSync(`${folder}/build-info.json`));
  assert.equal(manifest.version, pkg.version);
  assert.equal(info.version, pkg.version);
  assert.equal(info.userscriptVersion, pkg.version);
  assert.equal(info.userscriptSHA256, hash(runtime));
  assert.deepEqual(readFileSync(`${folder}/wipecord.user.js`), runtime, 'Packaged engine must be byte-identical');
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined, 'No extension API permissions are needed');
  assert.equal(manifest.host_permissions, undefined, 'Only declarative content script matches grant site access');
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.update_url, undefined);
  assert.equal(manifest.content_scripts.length, 2);
  for (const [index, script] of manifest.content_scripts.entries()) {
    assert.deepEqual(script.matches, pkg.userScript.match);
    assert.equal(script.all_frames, false);
    assert.equal(script.run_at, 'document_idle');
    assert.equal(script.world, index === 0 ? 'MAIN' : 'ISOLATED');
    assert.deepEqual(script.js, [index === 0 ? 'wipecord.user.js' : 'status.js']);
  }
  for (const name of ['status.js', 'popup.js', 'popup.html', 'popup.css']) assert.deepEqual(readFileSync(`${folder}/${name}`), readFileSync(`src/${name.endsWith('.js') ? 'extension' : 'ui/extension'}/${name}`));
  for (const name of readdirSync(folder).filter(name => name.endsWith('.js'))) execFileSync(process.execPath, ['--check', `${folder}/${name}`]);
  const path = `dist/wipecord-${browser}-${pkg.version}.zip`;
  const archive = readFileSync(path);
  archives[path] = archive;
  // Independently unpack each local header and compare its payload with the folder.
  let offset = 0;
  const names = [];
  while (archive.readUInt32LE(offset) === 0x04034b50) {
    const size = archive.readUInt32LE(offset + 18);
    const length = archive.readUInt16LE(offset + 26);
    const extra = archive.readUInt16LE(offset + 28);
    const name = archive.subarray(offset + 30, offset + 30 + length).toString();
    const start = offset + 30 + length + extra;
    assert.deepEqual(inflateRawSync(archive.subarray(start, start + size)), readFileSync(`${folder}/${name}`));
    names.push(name);
    offset = start + size;
  }
  assert.deepEqual(names.sort(), readdirSync(folder).sort());
  assert.ok(readFileSync('dist/SHA256SUMS', 'utf8').includes(`${hash(archive)}  ${path.split('/').pop()}`));
}
execFileSync(process.execPath, ['build/extensions.mjs'], { stdio: 'pipe' });
for (const [path, archive] of Object.entries(archives)) assert.deepEqual(readFileSync(path), archive, 'Extension packages must build deterministically');
console.log('Both manifests, permissions, runtime hashes, ZIP contents and deterministic packages verified.');
