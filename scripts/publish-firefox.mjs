import { createHmac, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const API = 'https://addons.mozilla.org/api/v5/';
const GUID = 'wipecord@rafelolv.github.io';

export function firefoxReleaseNotes(notes) {
  const sections = notes.split(/^## Changes[ \t]*\r?\n/m);
  const summary = (sections.length > 1 ? sections[1].split(/^## /m)[0] : notes).trim();
  if (!summary || summary.length > 3000) throw new Error('Firefox release notes must contain a nonempty Changes summary of at most 3000 characters.');
  return summary;
}

export function token(issuer, secret) {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ iss: issuer, jti: randomUUID(), iat, exp: iat + 60 })}`;
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

/** Submit only to the existing listing; never create, replace or delete an add-on. */
export async function publishFirefox({ issuer, secret, version, addon, source, notes, fetchAPI = fetch, sleep = delay }) {
  if (!issuer || !secret) throw new Error('Configure AMO_JWT_ISSUER and AMO_JWT_SECRET in GitHub Actions repository secrets.');
  if (!/^\d+\.\d+\.\d+$/.test(version) || !addon?.length || !source?.length || !notes?.trim()) {
    throw new Error('A semantic version, Firefox ZIP, source archive and release notes are required.');
  }
  // AMO's release_notes field is limited to 3000 characters. Validate before uploading.
  const releaseNotes = firefoxReleaseNotes(notes);
  const listing = `addons/addon/${encodeURIComponent(GUID)}/`;
  const versionPath = `${listing}versions/${version}/`;
  async function request(path, method = 'GET', body, allowMissing = false, stage = 'request') {
    let response;
    try {
      response = await fetchAPI(`${API}${path}`, {
        method, body, redirect: 'error', signal: AbortSignal.timeout(60000),
        headers: { Authorization: `JWT ${token(issuer, secret)}`, ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}) },
      });
    } catch {
      // Request errors and response bodies may contain credentials; never print them.
      throw new Error('AMO request failed or timed out. Inspect the Developer Hub before retrying; a submission may have succeeded.');
    }
    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw new Error(`AMO returned HTTP ${response.status} during ${stage}. Inspect the Developer Hub before retrying; never replace a published version.`);
    try { return await response.json(); } catch { throw new Error('AMO returned an unreadable response. Inspect the Developer Hub before retrying.'); }
  }
  const existingAddon = await request(listing);
  if (existingAddon.guid !== GUID || existingAddon.slug !== 'wipecord') throw new Error('AMO listing identity does not match Wipecord.');
  if (await request(versionPath, 'GET', undefined, true)) {
    throw new Error('This version already exists on AMO. Inspect its package, source and notes in the Developer Hub; no files were replaced.');
  }
  const upload = new FormData();
  upload.set('channel', 'listed');
  upload.set('upload', new Blob([addon], { type: 'application/zip' }), `wipecord-firefox-${version}.zip`);
  let result = await request('addons/upload/', 'POST', upload);
  // AMO serializes UUIDs as 32 hexadecimal characters; also accept canonical UUIDs.
  if (typeof result.uuid !== 'string' || !/^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(result.uuid)) throw new Error('AMO returned an invalid upload identifier.');
  const uuid = result.uuid;
  for (let attempt = 0; !result.processed && attempt < 60; attempt++) {
    await sleep(10000);
    result = await request(`addons/upload/${uuid}/`);
  }
  if (!result.processed) throw new Error('AMO validation timed out. No version was created; retry the failed job.');
  if (!result.valid || result.version !== version || result.channel !== 'listed' || result.submitted) {
    throw new Error('AMO validation failed or the upload metadata does not match. Review validation results in the Developer Hub; no version was created.');
  }
  const submission = new FormData();
  submission.set('upload', uuid);
  submission.set('source', new Blob([source], { type: 'application/zip' }), `wipecord-firefox-source-${version}.zip`);
  submission.set('approval_notes', 'Source includes reproduction instructions in docs/FIREFOX-PUBLISHING.md. Use Node.js 24, npm ci and npm run build:extensions. The userscript is bundled byte-for-byte in both browser packages. All executable code is included locally.');
  const created = await request(`${listing}versions/`, 'POST', submission, false, 'version creation');
  if (created.version !== version || created.channel !== 'listed') throw new Error('Unexpected AMO submission result. Inspect the Developer Hub before retrying.');
  // AMO requires multipart source and translated release notes in separate requests.
  await request(versionPath, 'PATCH', JSON.stringify({ release_notes: { 'en-US': releaseNotes } }), false, 'release notes update (the package was already submitted)');
  return `Firefox ${version} submitted to AMO with source and release notes. Mozilla review/signing may still be pending. Check https://addons.mozilla.org/en-US/developers/addon/wipecord/versions`;
}

export function verifyReleasePackage(version, manifest, addon, released) {
  if (manifest.version !== version || manifest.browser_specific_settings?.gecko?.id !== GUID) throw new Error('Firefox manifest identity/version mismatch.');
  if (!addon.equals(released)) throw new Error('Firefox build differs from the published GitHub release ZIP.');
}

export function reviewerSource() {
  // Archive only tracked build inputs from the exact tag, never local secrets or node_modules.
  return execFileSync('git', ['archive', '--format=zip', 'HEAD', '--',
    'src', 'build', 'scripts', 'test', 'images', 'docs', 'package.json', 'package-lock.json',
    'rollup.config.mjs', '.eslintrc', 'LICENSE', 'README.md', 'AGENTS.md'], { maxBuffer: 20 * 1024 * 1024 });
}

export function prepareSubmission(env = process.env) {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== 'rafelolv/Wipecord' || env.GITHUB_EVENT_NAME !== 'push' || env.GITHUB_REF !== `refs/tags/v${version}`) {
    throw new Error('Store submission is allowed only in the official repository release-tag workflow.');
  }
  const manifest = JSON.parse(readFileSync('dist/firefox/manifest.json', 'utf8'));
  const addon = readFileSync(`dist/wipecord-firefox-${version}.zip`);
  const released = readFileSync(`/tmp/wipecord-release/wipecord-firefox-${version}.zip`);
  verifyReleasePackage(version, manifest, addon, released);
  const notes = readFileSync(`docs/releases/v${version}.md`, 'utf8');
  const source = reviewerSource();
  return { version, addon, source, notes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const input = prepareSubmission();
    const message = await publishFirefox({ ...input, issuer: process.env.AMO_JWT_ISSUER, secret: process.env.AMO_JWT_SECRET });
    console.log(message);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `- ${message}\n`, { flag: 'a' });
  } catch (error) {
    // Only controlled messages are printed; unexpected filesystem/process errors stay private.
    const safe = error instanceof Error && /^(AMO |Configure |A semantic |This version |Firefox |Store submission |Unexpected AMO )/.test(error.message);
    console.error(safe ? error.message : 'Firefox publication preparation failed. Check the tag, release assets and build inputs.');
    process.exitCode = 1;
  }
}
