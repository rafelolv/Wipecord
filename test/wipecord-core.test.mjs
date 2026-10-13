import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { rollup } from 'rollup';

globalThis.window = { location: { href: 'https://discord.com/channels/123/456' } };

async function importBundled(relativePath) {
  const bundle = await rollup({
    input: fileURLToPath(new URL(relativePath, import.meta.url)),
  });
  const { output } = await bundle.generate({ format: 'es' });
  await bundle.close();

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`;
  return import(moduleUrl);
}

const { default: WipecordCore } = await importBundled('../src/wipecord-core.js');
const { buildPurgePlan } = await importBundled('../src/wipecord-plan.js');
const { validateFilters, resolveFilters, parseArchive } = await importBundled('../src/validation.js');
const { default: RunReport } = await importBundled('../src/run-report.js');
const { getGuildIds, fetchGuildIds } = await importBundled('../src/utils/getIds.js');

function jsonResponse(status, body = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function errorTestCore() {
  const core = new WipecordCore();
  core.options = { ...core.options, guildId: '22222222222222222', channelId: '44444444444444444', deleteDelay: 0, searchDelay: 0 };
  core.state.running = true;
  core.state.historyValidated = true;
  core.pace = core.cooldown = async () => {};
  return core;
}

test('all API operations report expired sessions and blocks without exposing response data', async () => {
  for (const method of ['validatePrivateChannel', 'history', 'search', 'unarchiveThread', 'deleteMessage']) {
    for (const [status, code] of [[401, 0], [429, 40333]]) {
      const core = errorTestCore();
      let requests = 0;
      core.request = async () => { requests++; return jsonResponse(status, { code, message: 'synthetic-private-body' }); };
      const argument = method === 'deleteMessage' ? historyMessage('90000000000000000', '33333333333333333', 'synthetic-private-message') : '44444444444444444';
      await assert.rejects(core[method](argument), error => {
        assert.equal(error.fatal, true);
        assert.match(error.message, status === 401 ? /Sign in to Discord again/ : /will not retry this block automatically/);
        assert.equal(error.message.includes('synthetic-private'), false);
        return true;
      });
      assert.equal(requests, 1);
    }
  }
});

test('denied and missing read targets keep their skip behavior and show actionable diagnostics', async () => {
  const restoreConsole = muteConsole();
  const warnings = [];
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    for (const method of ['validatePrivateChannel', 'history', 'search']) {
      for (const [status, code] of [[403, 50001], [404, 10003]]) {
        const core = errorTestCore();
        let requests = 0;
        core.request = async () => { requests++; return jsonResponse(status, { code, message: 'synthetic-private-body' }); };
        const result = await core[method]();
        assert.equal(result, method === 'validatePrivateChannel' ? false : null);
        assert.equal(requests, 1);
        const text = warnings.at(-1);
        assert.match(text, status === 403 ? /permission/ : /Check the target/);
        assert.match(text, new RegExp(`HTTP ${status}`));
        assert.match(text, /Skipping this target/);
        assert.equal(text.includes('synthetic-private-body'), false);
      }
    }
  } finally { restoreConsole(); }
});

test('deletion guidance preserves permanent skips, missing messages, retries and rate-limit backoff', async () => {
  const restoreConsole = muteConsole(), logs = [];
  console.warn = console.error = (...args) => logs.push(args.join(' '));
  try {
    const message = historyMessage('90000000000000000', '33333333333333333', 'synthetic-private-message');
    for (const [status, code, outcome, wording] of [
      [403, 50013, 'SKIPPED', /permission/], [400, 50021, 'SKIPPED', /system message/],
      [403, 160005, 'SKIPPED', /locked/], [404, 10008, 'ALREADY_GONE', null],
      [503, 0, 'FAILED', /server error/], [400, 0, 'FAILED', /target IDs and filters/],
      [429, 0, 'RETRY', /continue automatically/],
    ]) {
      const core = errorTestCore();
      core.request = async () => jsonResponse(status, { code, retry_after: 2, message: 'synthetic-private-body' });
      const before = Date.now();
      assert.equal(await core.deleteMessage(message), outcome);
      if (wording) assert.match(logs.at(-1), wording);
      if (status === 429) {
        assert.ok(core.stats.deleteNextAt >= before + 2250);
        assert.equal(core.stats.throttledCount, 1);
      }
    }
    const core = errorTestCore();
    core.request = async () => { throw Error('synthetic-private-exception'); };
    assert.equal(await core.deleteMessage(message), 'FAILED');
    assert.match(logs.at(-1), /Check your connection/);
    assert.equal(logs.join(' ').includes('synthetic-private'), false);
  } finally { restoreConsole(); }
});

test('exhausted connection retries stop with guidance and server-list errors require manual retry', async () => {
  const restoreConsole = muteConsole(), originalFetch = globalThis.fetch, logs = [];
  console.warn = console.error = (...args) => logs.push(args.join(' '));
  try {
    const core = errorTestCore();
    let requests = 0;
    core.request = async () => { requests++; throw Error('synthetic-private-exception'); };
    await assert.rejects(core.search(), /after 20 attempts.*Check your connection/);
    assert.equal(requests, 20);
    globalThis.fetch = async () => { throw Error('synthetic-private-exception'); };
    assert.deepEqual(await fetchGuildIds('synthetic-session'), []);
    assert.match(logs.at(-1), /server list is not retried automatically/);
    assert.equal(logs.join(' ').includes('synthetic-private'), false);
  } finally { globalThis.fetch = originalFetch; restoreConsole(); }
});

test('a second cleanup without reload recovers from initially empty search results', async () => {
  const restoreConsole = muteConsole(), originalConfirm = window.confirm;
  let confirmations = 0;
  window.confirm = () => { confirmations++; return true; };
  try {
    const core = errorTestCore();
    core.options = { ...core.options, authorId: '11111111111111111', content: 'synthetic' };
    let phase = 0, searches = 0, deleted = false;
    const mutations = [], waits = [], queries = [];
    core.cooldown = async ms => { if (ms > 0) waits.push(ms); };
    core.request = async (url, init = {}) => {
      if (init.method === 'DELETE') { mutations.push(String(url)); deleted = true; return new Response(null, { status: 204 }); }
      assert.equal(init.cache, 'no-store');
      const query = new URL(url).searchParams;
      assert.equal(query.get('author_id'), '11111111111111111');
      assert.equal(query.get('content'), 'synthetic');
      queries.push(query.toString());
      searches++;
      if (deleted || (phase === 1 && searches === 1)) return jsonResponse(200, { total_results: 0, messages: [] });
      return jsonResponse(200, { total_results: 1, messages: [[historyMessage(phase === 0 ? '80000000000000000' : '90000000000000000', '11111111111111111', 'synthetic', { hit: true })]] });
    };
    await core.run();
    assert.equal(core.report.counts.deleted, 1);
    phase = 1; searches = 0; deleted = false; queries.length = 0;
    core.resetState();
    await core.run();
    assert.equal(mutations.length, 2);
    assert.equal(confirmations, 2);
    assert.equal(core.report.counts.deleted, 1);
    assert.equal(core.report.reason, 'completed');
    assert.equal(queries[0], queries[1], 'Retry must preserve the complete search query');
    assert.ok(waits.includes(2000));
  } finally { window.confirm = originalConfirm; restoreConsole(); }
});

test('initially empty search retries are bounded and Stop during the pause prevents further requests', async () => {
  const restoreConsole = muteConsole(), originalConfirm = window.confirm;
  window.confirm = () => { throw Error('An empty search must not request confirmation'); };
  try {
    for (const stop of [false, true]) {
      const core = errorTestCore();
      let requests = 0;
      core.request = async () => { requests++; return jsonResponse(200, { total_results: 0, messages: [] }); };
      core.cooldown = async ms => { if (stop && ms > 0) core.stop(); };
      await core.run();
      assert.equal(requests, stop ? 1 : 4);
      assert.equal(core.report.reason, stop ? 'stopped' : 'completed');
      assert.equal(core.report.counts.deleted, 0);
      assert.equal(core.busy, false);
    }
  } finally { window.confirm = originalConfirm; restoreConsole(); }
});

test('malformed search responses end with an error without confirmation or deletion', async () => {
  const restoreConsole = muteConsole(), originalConfirm = window.confirm;
  window.confirm = () => { throw Error('Invalid responses must not request confirmation'); };
  try {
    const bodies = ['not-json', {}, [], { total_results: -1, messages: [] }, { total_results: '0', messages: [] }, { total_results: 1, messages: [null] }, { total_results: 1, messages: [[{ id: 'bad', channel_id: '44444444444444444' }]] }];
    for (const body of bodies) {
      const core = errorTestCore();
      let requests = 0;
      core.request = async () => { requests++; return typeof body === 'string' ? new Response(body, { status: 200 }) : jsonResponse(200, body); };
      await assert.rejects(core.run(), /unexpected search response/);
      assert.equal(requests, 1);
      assert.equal(core.report.reason, 'error');
      assert.equal(core.report.runErrors, 1);
      assert.equal(core.report.counts.deleted, 0);
      assert.equal(core.busy, false);
    }
  } finally { window.confirm = originalConfirm; restoreConsole(); }
});

test('asynchronous confirmation blocks deletion and accepts only explicit true; Stop retains its outcome', async () => {
  const restoreConsole = muteConsole();
  try {
    for (const answer of [true, false, 'truthy', 'stop']) {
      const core = errorTestCore();
      let searches = 0, deleted = 0, settle;
      core.search = async () => ++searches === 1
        ? { total_results: 1, messages: [[historyMessage('90000000000000000', '11111111111111111', 'synthetic preview', { hit: true })]] }
        : { total_results: 0, messages: [] };
      core.deleteMessage = async () => { deleted++; return 'DELETED'; };
      core.onConfirm = details => {
        assert.match(details.preview, /synthetic preview/);
        assert.deepEqual(Object.keys(details).sort(), ['batchNotice', 'preview', 'sampleNotice', 'summary']);
        return new Promise(resolve => { settle = resolve; });
      };
      core.onCancelConfirmation = () => settle(false);
      const running = core.run();
      for (let i = 0; i < 100 && !settle; i++) await new Promise(resolve => setTimeout(resolve, 0));
      assert.equal(typeof settle, 'function');
      assert.equal(deleted, 0);
      assert.equal(core.busy, true);
      if (answer === 'stop') core.stop();
      else settle(answer);
      await running;
      assert.equal(deleted, answer === true ? 1 : 0);
      assert.equal(core.report.reason, answer === true ? 'completed' : answer === 'stop' ? 'stopped' : 'cancelled');
      assert.equal(core.busy, false);
    }
  } finally { restoreConsole(); }
});

test('rejects malformed patterns, invalid calendar dates and reversed effective bounds', () => {
  for (const options of [
    { pattern: '[' }, { minId: '2026-02-30T12:00' }, { minId: '2026-10-11T24:00' }, { minId: 'nonsense' },
    { minId: '90000000000000000', maxId: '90000000000000000' },
    { minId: '95000000000000000', maxId: '90000000000000000' },
    { minId: '2026-10-12T12:00', maxId: '2026-10-11T12:00' },
  ]) assert.throws(() => validateFilters(options));
  assert.doesNotThrow(() => validateFilters({ pattern: 'hello.*', minId: '2024-02-29T12:00', maxId: '2026-10-11T12:00' }));
  assert.throws(() => resolveFilters({ minId: '95000000000000000', maxDate: '2015-01-01T00:00:00Z' }));
  assert.deepEqual(resolveFilters({ minDate: '2015-01-01T00:00:00Z' }), { minId: '2015-01-01T00:00:00Z', maxId: undefined });
});

test('invalid core filters and batches fail before any request or confirmation', async () => {
  const originalFetch = globalThis.fetch, originalConfirm = window.confirm;
  let requests = 0, prompts = 0;
  globalThis.fetch = async () => { requests++; throw Error('Unexpected request'); };
  window.confirm = () => { prompts++; return true; };
  try {
    for (const method of ['run', 'runBatch']) {
      const core = new WipecordCore();
      core.options = { ...core.options, guildId: '22222222222222222', pattern: '[' };
      await assert.rejects(core[method]([{ guildId: '22222222222222222' }]), /regular expression/);
      assert.equal(core.busy, false);
      core.state._messagesToDelete = [];
      assert.throws(() => core.filterResponse({ messages: [historyMessage('90000000000000000', '33333333333333333', 'private')], total_results: 1 }), /regular expression/);
    }
  } finally { globalThis.fetch = originalFetch; window.confirm = originalConfirm; }
  assert.equal(requests + prompts, 0);
});

test('archive validation rejects unsafe shapes and keys without exposing labels', () => {
  for (const text of ['{', 'null', '[]', '42', '{}', '{"bad":"label"}', '{"44444444444444444":{}}', '{"44444444444444444":1}']) assert.throws(() => parseArchive(text));
  assert.deepEqual(parseArchive('{"44444444444444444":"private label","55555555555555555":null}'), ['44444444444444444', '55555555555555555']);
});

test('anonymous reports deduplicate outcomes and retain only aggregate data after finishing', () => {
  const report = new RunReport();
  report.record('private-message-id', 'ignored'); report.record('private-message-id', 'ignored');
  report.record('retry-id', 'failed'); report.record('retry-id', 'deleted'); report.record('retry-id', 'alreadyGone');
  report.record('gone-id', 'alreadyGone'); report.record('failure-id', 'failed');
  report.end('error'); report.end('stopped'); report.finish();
  const result = report.snapshot();
  assert.deepEqual(result.counts, { deleted: 1, ignored: 1, failed: 1, alreadyGone: 1 });
  assert.equal(result.reason, 'stopped'); assert.equal(result.runErrors, 1);
  assert.equal(JSON.stringify(result).includes('private-message-id'), false);
  result.counts.deleted = 99;
  assert.equal(report.snapshot().counts.deleted, 1);
});

test('batch summaries accumulate all jobs and separate skipped, missing and failed messages', async () => {
  const restoreConsole = muteConsole(), originalConfirm = window.confirm;
  const info = [];
  console.info = (...args) => info.push(args.join(' '));
  window.confirm = () => true;
  try {
    const core = new WipecordCore();
    const positions = [];
    core.onProgress = () => positions.push(core.targetProgress);
    core.options = { ...core.options, searchDelay: 0, deleteDelay: 0, jobDelay: 0 };
    const seen = new Set();
    core.search = async () => {
      const id = core.options.guildId;
      if (seen.has(id)) return { total_results: 0, messages: [] };
      seen.add(id);
      return { total_results: 5, messages: [0, 1, 2, 3, 4].map(index => [historyMessage(String(BigInt(id) + BigInt(index)), '33333333333333333', 'private', { hit: true, pinned: index === 4 })]) };
    };
    core.deleteMessage = async message => ['DELETED', 'ALREADY_GONE', 'SKIPPED', 'FAILED'][Number(BigInt(message.id) - BigInt(core.options.guildId))];
    await core.runBatch([{ guildId: '80000000000000000' }, { guildId: '90000000000000000' }]);
    assert.deepEqual(core.report.counts, { deleted: 2, ignored: 4, failed: 2, alreadyGone: 2 });
    assert.equal(core.report.reason, 'completed');
    assert.equal(core.busy, false);
    assert.deepEqual([...new Set(positions.map(position => position.index))], [1, 2]);
    assert.ok(positions.every(position => position.total === 2 && Object.keys(position).length === 2));
    const targetCounts = info.filter(line => line.includes('deletion(s) confirmed in this target'));
    assert.equal(targetCounts.length, 2);
    assert.ok(targetCounts.every(line => line.startsWith('1 deletion(s) confirmed')));
  } finally { window.confirm = originalConfirm; restoreConsole(); }
});

test('failed runs report a safe reason without exporting exception or account details', async () => {
  const restoreConsole = muteConsole();
  try {
    const core = new WipecordCore();
    core.options = { ...core.options, guildId: '22222222222222222', authToken: 'synthetic-secret' };
    core.search = async () => { throw Error('private-response'); };
    await assert.rejects(core.run(), /private-response/);
    assert.equal(core.report.reason, 'error');
    assert.equal(core.report.runErrors, 1);
    assert.equal(core.busy, false);
    assert.equal(/synthetic-secret|private-response|22222222222222222/.test(JSON.stringify(core.report)), false);
  } finally { restoreConsole(); }
});

function historyMessage(id, authorId, content, overrides = {}) {
  return {
    id,
    channel_id: '44444444444444444',
    timestamp: '2019-01-01T00:00:00.000Z',
    content,
    type: 0,
    pinned: false,
    author: { id: authorId, username: 'tester' },
    attachments: [],
    embeds: [],
    flags: 0,
    ...overrides,
  };
}

function muteConsole() {
  const original = {
    debug: console.debug,
    error: console.error,
    info: console.info,
    log: console.log,
    warn: console.warn,
  };
  console.debug = console.error = console.info = console.log = console.warn = () => {};
  return () => Object.assign(console, original);
}

async function exerciseThreadRecovery(patchResponse) {
  const requests = [];
  let deleteAttempts = 0;
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    const method = init.method || 'GET';
    requests.push({ url: String(url), method, headers: init.headers, body: init.body });

    if (method === 'DELETE') {
      deleteAttempts++;
      if (deleteAttempts === 1) {
        return jsonResponse(400, {
          code: 50083,
          message: 'Cannot execute action on an archived thread',
        });
      }
      return new Response(null, { status: 204 });
    }

    if (method === 'PATCH') return patchResponse;
    throw new Error(`Unexpected request: ${method} ${url}`);
  };


  try {
    const core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      deleteDelay: 0,
      maxAttempt: 2,
    };
    core.state.running = true;
    core.state.grandTotal = 1;
    core.state._messagesToDelete = [{
      id: 'message-1',
      channel_id: 'thread-1',
      timestamp: '2026-08-18T00:00:00.000Z',
      content: 'hello',
      author: { username: 'tester' },
      attachments: [],
      embeds: [],
      flags: 0,
    }];

    await core.deleteMessagesFromList();
    return { core, requests };
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }
}

test('reopens an archived thread and retries the deletion', async () => {
  const { core, requests } = await exerciseThreadRecovery(jsonResponse(200, {
    id: 'thread-1',
    thread_metadata: { archived: false },
  }));

  assert.deepEqual(requests.map(request => request.method), ['DELETE', 'PATCH', 'DELETE']);
  assert.equal(requests[1].url, 'https://discord.com/api/v9/channels/thread-1');
  assert.equal(requests[1].body, JSON.stringify({ archived: false }));
  assert.equal(requests[1].headers.Authorization, 'test-token');
  assert.equal(requests[1].headers['Content-Type'], 'application/json');
  assert.equal(core.state.delCount, 1);
  assert.equal(core.state.confirmedDelCount, 1);
  assert.equal(core.state.failCount, 0);
});

test('skips the message when the thread cannot be reopened', async () => {
  const { core, requests } = await exerciseThreadRecovery(jsonResponse(403, {
    code: 50013,
    message: 'Missing Permissions',
  }));

  assert.deepEqual(requests.map(request => request.method), ['DELETE', 'PATCH']);
  assert.equal(core.state.delCount, 0);
  assert.equal(core.state.failCount, 1);
});

test('plans one whole-server job per unique Server ID', () => {
  const firstGuild = '11111111111111111';
  const secondGuild = '22222222222222222';
  const plan = buildPurgePlan(`${firstGuild}, ${secondGuild} ${firstGuild}`, '');

  assert.deepEqual(plan.guildIds, [firstGuild, secondGuild]);
  assert.deepEqual(plan.channelIds, []);
  assert.deepEqual(plan.jobs, [
    { guildId: firstGuild, channelId: undefined },
    { guildId: secondGuild, channelId: undefined },
  ]);
});

test('rejects ambiguous or unsafe multi-server targets', () => {
  const firstGuild = '11111111111111111';
  const secondGuild = '22222222222222222';
  const channel = '33333333333333333';

  assert.throws(
    () => buildPurgePlan(`${firstGuild},${secondGuild}`, channel),
    /leave the "Channel ID" field empty/
  );
  assert.throws(
    () => buildPurgePlan(`@me,${firstGuild}`, ''),
    /cannot be combined/
  );
});

test('parses an empty target value without inventing a literal ID', () => {
  assert.throws(() => buildPurgePlan(undefined, ''), /fill the "Server ID" field/);
});

test('loads all server IDs from Discord\'s in-memory guild store', () => {
  const runtime = () => {};
  runtime.c = {
    guildStore: {
      exports: {
        default: {
          getGuild() {},
          getGuilds() {
            return {
              '11111111111111111': { id: '11111111111111111', name: 'One' },
              '22222222222222222': { id: '22222222222222222', name: 'Two' },
            };
          },
        },
      },
    },
  };
  window.webpackChunkdiscord_app = [];
  window.webpackChunkdiscord_app.push = ([, , load]) => load(runtime);

  try {
    assert.deepEqual(getGuildIds(), [
      '11111111111111111',
      '22222222222222222',
    ]);
  } finally {
    delete window.webpackChunkdiscord_app;
  }
});

test('loads all server IDs from Discord when the client store is unavailable', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  delete window.webpackChunkdiscord_app;

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), headers: init.headers });
    return jsonResponse(200, [
      { id: '11111111111111111', name: 'One' },
      { id: '22222222222222222', name: 'Two' },
    ]);
  };

  try {
    assert.deepEqual(await fetchGuildIds('test-token'), [
      '11111111111111111',
      '22222222222222222',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(requests, [{
    url: 'https://discord.com/api/v9/users/@me/guilds?limit=200',
    headers: { Authorization: 'test-token' },
  }]);
});

test('does not retry a Cloudflare edge block while loading servers', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  let errorLog = '';
  let requests = 0;
  console.error = (...args) => { errorLog += args.join(' '); };
  globalThis.fetch = async () => {
    requests++;
    return jsonResponse(429, { code: 40333, message: 'Cloudflare access denied' });
  };

  try {
    assert.deepEqual(await fetchGuildIds('test-token'), []);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }

  assert.equal(requests, 1);
  assert.match(errorLog, /temporarily blocked requests/);
});

test('runs each planned server as a separate whole-server search', async () => {
  const guildIds = ['11111111111111111', '22222222222222222'];
  const { jobs } = buildPurgePlan(guildIds.join(','), '');
  const originalFetch = globalThis.fetch;
  const requests = [];
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    return jsonResponse(200, { total_results: 0, messages: [] });
  };

  try {
    const core = new WipecordCore();
    core.cooldown = async () => {};
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '33333333333333333',
      searchDelay: 0,
      jobDelay: 0,
    };
    await core.runBatch(jobs);
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.deepEqual(requests.map(request => {
    const url = new URL(request.url);
    return {
      method: request.method,
      pathname: url.pathname,
      channelId: url.searchParams.get('channel_id'),
    };
  }), guildIds.flatMap(id => Array.from({ length: 4 }, () => ({ method: 'GET', pathname: `/api/v9/guilds/${id}/messages/search`, channelId: null }))));
});

test('warns that one confirmation covers the remaining batch jobs', async () => {
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  let prompt = '';
  const restoreConsole = muteConsole();

  globalThis.fetch = async () => jsonResponse(200, {
    total_results: 1,
    messages: [[{
      id: '44444444444444444',
      channel_id: '55555555555555555',
      timestamp: '2026-08-28T00:00:00.000Z',
      content: 'hello',
      type: 0,
      pinned: false,
      hit: true,
      author: { username: 'tester' },
      attachments: [],
      embeds: [],
      flags: 0,
    }]],
  });
  window.confirm = message => {
    prompt = message;
    return false;
  };

  try {
    const core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      searchDelay: 0,
      jobDelay: 0,
    };
    await core.runBatch([
      { guildId: '11111111111111111', channelId: undefined },
      { guildId: '22222222222222222', channelId: undefined },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.match(prompt, /job 1 of 2/);
  assert.match(prompt, /remaining jobs will continue without another confirmation/);
});

test('walks group DM history past non-matching pages and deletes only exact matches', async () => {
  const channelId = '44444444444444444';
  const authorId = '33333333333333333';
  const requests = [];
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  const restoreConsole = muteConsole();
  let prompt = '';

  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method || 'GET';
    requests.push({ method, pathname: parsed.pathname, before: parsed.searchParams.get('before') });

    if (method === 'DELETE') return new Response(null, { status: 204 });
    if (parsed.pathname === `/api/v9/channels/${channelId}`) return jsonResponse(200, { id: channelId, type: 3 });
    if (parsed.pathname !== `/api/v9/channels/${channelId}/messages`) throw new Error(`Unexpected request: ${url}`);

    const before = parsed.searchParams.get('before');
    if (!before) {
      return jsonResponse(200, [
        historyMessage('90000000000000000', '22222222222222222', 'needle https://example.com', { attachments: [{ id: '1' }] }),
        historyMessage('80000000000000000', authorId, 'does not match'),
      ]);
    }
    if (before === '80000000000000000') {
      return jsonResponse(200, [
        historyMessage('70000000000000000', authorId, 'needle https://example.com', { attachments: [{ id: '2' }] }),
      ]);
    }
    if (before === '70000000000000000') return jsonResponse(200, []);
    throw new Error(`Unexpected cursor: ${before}`);
  };
  window.confirm = message => {
    prompt = message;
    return true;
  };

  let core;
  try {
    core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId,
      guildId: '@me',
      channelId,
      content: 'needle',
      hasLink: true,
      hasFile: true,
      pattern: '^needle',
      searchDelay: 0,
      deleteDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.deepEqual(requests, [
    { method: 'GET', pathname: `/api/v9/channels/${channelId}`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '80000000000000000' },
    { method: 'DELETE', pathname: `/api/v9/channels/${channelId}/messages/70000000000000000`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '70000000000000000' },
  ]);
  assert.equal(core.state.delCount, 1);
  assert.equal(core.state.failCount, 0);
  assert.equal(core.state.historyScanned, 3);
  assert.match(prompt, /scan this entire chat history/);
  assert.match(prompt, /final total is unknown/);
  assert.equal(requests.some(request => request.pathname.endsWith('/search')), false);
});

test('applies DM message bounds and stops once the lower bound is crossed', async () => {
  const channelId = '44444444444444444';
  const authorId = '33333333333333333';
  const requests = [];
  const originalFetch = globalThis.fetch;
  const originalConfirm = window.confirm;
  const restoreConsole = muteConsole();

  globalThis.fetch = async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method || 'GET';
    requests.push({ method, pathname: parsed.pathname, before: parsed.searchParams.get('before') });
    if (method === 'DELETE') return new Response(null, { status: 204 });
    if (parsed.pathname === `/api/v9/channels/${channelId}`) return jsonResponse(200, { id: channelId, type: 1 });
    return jsonResponse(200, [
      historyMessage('90000000000000000', authorId, 'inside range'),
      historyMessage('70000000000000000', authorId, 'below range'),
    ]);
  };
  window.confirm = () => true;

  try {
    const core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId,
      guildId: '@me',
      channelId,
      minId: '75000000000000000',
      maxId: '95000000000000000',
      searchDelay: 0,
      deleteDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    window.confirm = originalConfirm;
    restoreConsole();
  }

  assert.deepEqual(requests, [
    { method: 'GET', pathname: `/api/v9/channels/${channelId}`, before: null },
    { method: 'GET', pathname: `/api/v9/channels/${channelId}/messages`, before: '95000000000000000' },
    { method: 'DELETE', pathname: `/api/v9/channels/${channelId}/messages/90000000000000000`, before: null },
  ]);
});

test('refuses to reinterpret a guild archive entry as a private chat', async () => {
  const channelId = '44444444444444444';
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method || 'GET' });
    return jsonResponse(200, { id: channelId, type: 0 });
  };

  try {
    const core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '33333333333333333',
      guildId: '@me',
      channelId,
      searchDelay: 0,
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.deepEqual(requests, [{
    url: `https://discord.com/api/v9/channels/${channelId}`,
    method: 'GET',
  }]);
});

test('plans imported DMs and group DMs as separate private-channel jobs', () => {
  const firstChannel = '44444444444444444';
  const secondChannel = '55555555555555555';
  assert.deepEqual(buildPurgePlan('@me', `${firstChannel},${secondChannel}`).jobs, [
    { guildId: '@me', channelId: firstChannel },
    { guildId: '@me', channelId: secondChannel },
  ]);
});

test('requires an author before reading any private-channel history', async () => {
  const originalFetch = globalThis.fetch;
  const restoreConsole = muteConsole();
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error('Private history must not be requested without an author');
  };

  try {
    const core = new WipecordCore();
    core.options = {
      ...core.options,
      authToken: 'test-token',
      authorId: '',
      guildId: '@me',
      channelId: '44444444444444444',
    };
    await core.run();
  } finally {
    globalThis.fetch = originalFetch;
    restoreConsole();
  }

  assert.equal(requests, 0);
});


test('confirmation uses a bounded sample rather than formatting the complete cleanup list', async () => {
  const restoreConsole = muteConsole();
  try {
    const core = errorTestCore();
    core.state.grandTotal = 1800;
    core.state._messagesToDelete = Array.from({ length: 100 }, (_, index) =>
      historyMessage(String(90000000000000000n + BigInt(index)), '11111111111111111', `${index}:` + 'x'.repeat(1800)));
    Object.defineProperty(core.state._messagesToDelete[3], 'author', { get() { throw new Error('Must not format unsampled messages'); } });
    core.onConfirm = details => {
      assert.match(details.summary, /~1800/);
      assert.match(details.sampleNotice, /3 example\(s\) from 100 eligible/);
      assert.equal(details.preview.split('\n\n').length, 3);
      assert.ok(details.preview.length <= 1207);
      assert.match(details.preview, /…/);
      return false;
    };
    assert.equal(await core.confirm(), false);
    core.state.historyMode = true;
    core.onConfirm = details => {
      assert.match(details.summary, /final total is unknown/);
      assert.match(details.sampleNotice, /not the complete cleanup list/);
      return false;
    };
    assert.equal(await core.confirm(), false);
  } finally { restoreConsole(); }
});
