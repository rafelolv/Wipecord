import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { publishFirefox, prepareSubmission, token, verifyReleasePackage, reviewerSource, firefoxReleaseNotes } from '../scripts/publish-firefox.mjs';

// Match FileUploadSerializer's UUIDField(format='hex') in addons-server.
const uuid = '12345678123412341234123456789012';
const validated = { uuid, channel: 'listed', version: '1.2.3', processed: true, valid: true, submitted: false };
const input = {
  issuer: 'test-issuer', secret: 'test-secret', version: '1.2.3',
  addon: Buffer.from('mock Firefox ZIP'), source: Buffer.from('mock reviewer source'), notes: '- Improve error guidance.',
  sleep: async () => {},
};
function api(responses) {
  const calls = [];
  return {
    calls,
    fetchAPI: async (url, options) => {
      calls.push({ url, ...options });
      assert.ok(url.startsWith('https://addons.mozilla.org/api/v5/'));
      assert.equal(options.redirect, 'error');
      assert.match(options.headers.Authorization, /^JWT /);
      const response = responses.shift();
      assert.ok(response, 'Unexpected API call');
      if (response instanceof Error) throw response;
      const { status = 200, data = {} } = response;
      return { status, ok: status >= 200 && status < 300, json: async () => data };
    },
  };
}
const listing = { data: { guid: 'wipecord@rafelolv.github.io', slug: 'wipecord' } };
const missing = { status: 404 };

test('AMO authentication uses unique short-lived HS256 JWTs', () => {
  const value = token(input.issuer, input.secret);
  const [header, claims, signature] = value.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'HS256', typ: 'JWT' });
  const payload = JSON.parse(Buffer.from(claims, 'base64url'));
  assert.equal(payload.iss, input.issuer);
  assert.equal(payload.exp - payload.iat, 60);
  assert.equal(signature, createHmac('sha256', input.secret).update(`${header}.${claims}`).digest('base64url'));
  assert.notEqual(value, token(input.issuer, input.secret));
});

test('Firefox submission sends the exact package, source and English notes after validation', async () => {
  const mock = api([listing, missing, { data: { uuid, processed: false } }, { data: validated },
    { data: { version: input.version, channel: 'listed' } }, { data: {} }]);
  const message = await publishFirefox({ ...input, fetchAPI: mock.fetchAPI });
  assert.match(message, /review\/signing may still be pending/);
  assert.deepEqual(mock.calls.map(call => call.method), ['GET', 'GET', 'POST', 'GET', 'POST', 'PATCH']);
  assert.equal(mock.calls[2].body.get('channel'), 'listed');
  assert.deepEqual(Buffer.from(await mock.calls[2].body.get('upload').arrayBuffer()), input.addon);
  assert.equal(mock.calls[4].body.get('upload'), uuid);
  assert.deepEqual(Buffer.from(await mock.calls[4].body.get('source').arrayBuffer()), input.source);
  assert.deepEqual(JSON.parse(mock.calls[5].body), { release_notes: { 'en-US': input.notes } });
});

test('missing credentials and invalid inputs make no requests', async () => {
  const mock = api([]);
  for (const patch of [{ secret: '' }, { issuer: '' }, { version: '../bad' }, { source: null }, { notes: '' }]) {
    await assert.rejects(publishFirefox({ ...input, ...patch, fetchAPI: mock.fetchAPI }));
  }
  assert.equal(mock.calls.length, 0);
});

test('AMO notes contain only Changes and fit Mozilla\'s limit even when the full release document exceeds it', async () => {
  const notes = readFileSync('docs/releases/v1.6.3.md', 'utf8');
  assert.ok(notes.length > 3000, 'Regression fixture must exceed the AMO notes limit');
  const summary = firefoxReleaseNotes(notes);
  assert.match(summary, /^- Fix automated Firefox submissions/);
  assert.doesNotMatch(summary, /##|Downloads|Validation|Install or update/);
  assert.ok(summary.length < 3000);
  const mock = api([listing, missing, { data: validated }, { data: { version: input.version, channel: 'listed' } }, { data: {} }]);
  await publishFirefox({ ...input, notes, fetchAPI: mock.fetchAPI });
  assert.deepEqual(JSON.parse(mock.calls.at(-1).body), { release_notes: { 'en-US': summary } });
  assert.equal(firefoxReleaseNotes('## Changes\n\n- Final change.\n'), '- Final change.');
});

test('oversized and empty AMO summaries fail before API access; 3000 characters are accepted', async () => {
  const mock = api([]);
  for (const notes of ['x'.repeat(3001), '## Changes\n\n## Downloads\n- Package.']) {
    await assert.rejects(publishFirefox({ ...input, notes, fetchAPI: mock.fetchAPI }), /at most 3000 characters/);
  }
  assert.equal(mock.calls.length, 0);
  assert.equal(firefoxReleaseNotes('x'.repeat(3000)).length, 3000);
});

test('AMO upload identifiers accept hex and canonical UUIDs and reject unsafe paths', async () => {
  const canonical = '12345678-1234-1234-1234-123456789012';
  const mock = api([listing, missing, { data: { ...validated, uuid: canonical } },
    { data: { version: input.version, channel: 'listed' } }, { data: {} }]);
  await publishFirefox({ ...input, fetchAPI: mock.fetchAPI });
  assert.equal(mock.calls[3].body.get('upload'), canonical);
  for (const invalid of [null, 123, '', '../outside', 'a'.repeat(36), '-'.repeat(36), 'z'.repeat(32)]) {
    const rejected = api([listing, missing, { data: { ...validated, uuid: invalid } }]);
    await assert.rejects(publishFirefox({ ...input, fetchAPI: rejected.fetchAPI }), /invalid upload identifier/);
    assert.equal(rejected.calls.length, 3);
  }
});

test('wrong listing and existing versions are never modified', async () => {
  const wrong = api([{ data: { guid: 'other', slug: 'wipecord' } }]);
  await assert.rejects(publishFirefox({ ...input, fetchAPI: wrong.fetchAPI }), /identity/);
  const existing = api([listing, { data: { version: input.version } }]);
  await assert.rejects(publishFirefox({ ...input, fetchAPI: existing.fetchAPI }), /already exists/);
  assert.ok([...wrong.calls, ...existing.calls].every(call => call.method === 'GET'));
});

test('rejected, mismatched and timed-out uploads cannot create versions', async () => {
  for (const patch of [{ valid: false }, { version: '9.9.9' }, { channel: 'unlisted' }, { submitted: true }]) {
    const mock = api([listing, missing, { data: { ...validated, ...patch } }]);
    await assert.rejects(publishFirefox({ ...input, fetchAPI: mock.fetchAPI }), /validation failed/);
    assert.equal(mock.calls.length, 3);
  }
  const pending = { data: { uuid, processed: false } };
  const mock = api([listing, missing, pending, ...Array(60).fill(pending)]);
  await assert.rejects(publishFirefox({ ...input, fetchAPI: mock.fetchAPI }), /validation timed out/);
  assert.equal(mock.calls.filter(call => call.method === 'POST').length, 1);
});

test('network, HTTP and partial-submission failures do not expose response bodies or tokens', async () => {
  const privateText = 'sensitive request details';
  for (const responses of [[new Error(privateText)], [{ status: 401, data: { error: privateText } }],
    [listing, missing, { data: validated }, { data: { version: input.version, channel: 'listed' } }, { status: 503 }]]) {
    const mock = api(responses);
    await assert.rejects(publishFirefox({ ...input, fetchAPI: mock.fetchAPI }), error => {
      assert.doesNotMatch(error.message, /sensitive request details|test-secret|test-issuer/);
      if (mock.calls.at(-1)?.method === 'PATCH') assert.match(error.message, /release notes update \(the package was already submitted\)/);
      return true;
    });
    assert.ok(mock.calls.every(call => !['PUT', 'DELETE'].includes(call.method)));
  }
});

test('only official release tags can prepare publication; the workflow runs after GitHub release', () => {
  assert.throws(() => prepareSubmission({}), /official repository release-tag/);
  assert.throws(() => prepareSubmission({ GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'someone/fork', GITHUB_EVENT_NAME: 'push', GITHUB_REF: 'refs/tags/v1.6.1' }), /official repository/);
  const workflow = readFileSync('.github/workflows/release.yml', 'utf8');
  assert.match(workflow, /needs: release/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /AMO_JWT_ISSUER: \$\{\{ secrets\.AMO_JWT_ISSUER \}\}/);
  assert.match(workflow, /AMO_JWT_SECRET: \$\{\{ secrets\.AMO_JWT_SECRET \}\}/);
  assert.doesNotMatch(readFileSync('.github/workflows/ci.yml', 'utf8'), /publish-firefox|AMO_JWT/);
});

test('publication refuses changed ZIP bytes and mismatched manifest identity/version', () => {
  const manifest = { version: input.version, browser_specific_settings: { gecko: { id: 'wipecord@rafelolv.github.io' } } };
  assert.doesNotThrow(() => verifyReleasePackage(input.version, manifest, input.addon, Buffer.from(input.addon)));
  assert.throws(() => verifyReleasePackage(input.version, manifest, input.addon, Buffer.from('other ZIP')), /differs/);
  assert.throws(() => verifyReleasePackage('9.9.9', manifest, input.addon, input.addon), /identity\/version/);
  assert.throws(() => verifyReleasePackage(input.version, {}, input.addon, input.addon), /identity\/version/);
});

test('reviewer archive includes tracked build inputs and excludes local files and dependencies', () => {
  const folder = mkdtempSync(join(tmpdir(), 'wipecord-source-test-'));
  const untracked = 'src/wipecord-publication-test-untracked.txt';
  try {
    writeFileSync(untracked, 'local file must not be uploaded', { flag: 'wx' });
    const path = join(folder, 'source.zip');
    writeFileSync(path, reviewerSource());
    const names = execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' }).trim().split('\n');
    for (const required of ['package.json', 'package-lock.json', 'rollup.config.mjs', '.eslintrc', 'docs/MAINTENANCE.md', 'build/extensions.mjs']) assert.ok(names.includes(required), required);
    assert.ok(names.some(name => name.startsWith('src/')));
    assert.ok(names.every(name => !/^(\.git\/|\.env|node_modules\/|dist\/)/.test(name)));
    assert.ok(!names.includes(untracked));
  } finally {
    rmSync(untracked, { force: true });
    rmSync(folder, { recursive: true, force: true });
  }
});
