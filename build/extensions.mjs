import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Resvg } from '@resvg/resvg-js';
import { zip } from './zip.mjs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const artifact = readFileSync(pkg.main);
if (!artifact.toString().includes(` ${pkg.version}\n`) || artifact.toString().includes('[DEV]')) throw Error('Build the production userscript first.');
const json = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const hash = data => createHash('sha256').update(data).digest('hex');

export function manifest(browser) {
  const result = {
    manifest_version: 3,
    name: 'Wipecord',
    version: pkg.version,
    description: 'Use Wipecord in Discord without a userscript manager. Deletions require your confirmation.',
    author: 'Rafael (rafelolv)',
    homepage_url: pkg.homepage,
    icons: Object.fromEntries([16, 32, 48, 128].map(size => [size, `icon-${size}.png`])),
    action: { default_title: 'Wipecord status', default_popup: 'popup.html' },
    content_scripts: [
      { matches: pkg.userScript.match, js: ['wipecord.user.js'], world: 'MAIN', run_at: 'document_idle', all_frames: false },
      { matches: pkg.userScript.match, js: ['status.js'], world: 'ISOLATED', run_at: 'document_idle', all_frames: false },
    ],
    content_security_policy: { extension_pages: 'script-src \'self\'; object-src \'none\'' },
  };
  if (browser === 'firefox') result.browser_specific_settings = {
    gecko: { id: 'wipecord@rafelolv.github.io', strict_min_version: '128.0', data_collection_permissions: { required: ['none'] } },
  };
  else result.minimum_chrome_version = '111';
  return result;
}

const common = { 'wipecord.user.js': artifact, LICENSE: readFileSync('LICENSE'), 'icon.svg': readFileSync('images/icon.svg') };
for (const name of ['status.js', 'popup.js', 'popup.html', 'popup.css']) common[name] = readFileSync(`src/${name.endsWith('.js') ? 'extension' : 'ui/extension'}/${name}`);
for (const size of [16, 32, 48, 128]) common[`icon-${size}.png`] = new Resvg(common['icon.svg'], { fitTo: { mode: 'width', value: size } }).render().asPng();
mkdirSync('dist', { recursive: true });
const sums = [];
for (const browser of ['chromium', 'firefox']) {
  const folder = `dist/${browser}`;
  rmSync(folder, { recursive: true, force: true });
  mkdirSync(folder, { recursive: true });
  const files = { ...common, 'manifest.json': json(manifest(browser)), 'build-info.json': json({ browser, version: pkg.version, userscriptVersion: pkg.version, userscriptSHA256: hash(artifact) }) };
  for (const [path, data] of Object.entries(files)) writeFileSync(`${folder}/${path}`, data);
  const filename = `wipecord-${browser}-${pkg.version}.zip`;
  const archive = zip(files);
  writeFileSync(`dist/${filename}`, archive);
  sums.push(`${hash(archive)}  ${filename}`);
  console.log(`Built ${folder} and dist/${filename} (shared runtime ${pkg.version})`);
}
writeFileSync('dist/SHA256SUMS', sums.join('\n') + '\n');
