import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function waitFor(predicate, message) {
  for (let i = 0; i < 150; i++) {
    if (await predicate()) return;
    await delay(100);
  }
  throw Error(message);
}

async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const requests = new Map();
  const events = [];
  socket.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.method) events.push(data);
    const request = requests.get(data.id);
    if (!request) return;
    requests.delete(data.id);
    clearTimeout(request.timer);
    if (data.error || data.type === 'error') request.reject(Error(JSON.stringify(data)));
    else request.resolve(data.result);
  };
  return {
    socket,
    events,
    call: (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const next = ++id;
      const timer = setTimeout(() => { requests.delete(next); reject(Error(`Timeout: ${method}`)); }, 20000);
      requests.set(next, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: next, method, params, ...(sessionId ? { sessionId } : {}) }));
    }),
  };
}

export async function browserSession(browser, directory, extension) {
  const profile = join(directory, `${browser}-profile`);
  mkdirSync(profile);
  let process, connection;
  try {
    if (browser === 'chromium') {
      process = spawn(globalThis.process.env.CHROME_BIN || 'google-chrome', [
        '--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
        '--disable-component-update', '--no-first-run', '--enable-unsafe-extension-debugging',
        '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
      ], { stdio: 'ignore' });
      const path = join(profile, 'DevToolsActivePort');
      await waitFor(() => existsSync(path), 'Chrome did not start');
      const [port, endpoint] = readFileSync(path, 'utf8').trim().split('\n');
      connection = await connect(`ws://127.0.0.1:${port}${endpoint}`);
      const { call } = connection;
      const { product } = await call('Browser.getVersion');
      const { id } = await call('Extensions.loadUnpacked', { path: extension });
      const createPage = async (url = 'about:blank') => {
        const { targetId } = await call('Target.createTarget', { url, background: true });
        const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
        const pageCall = (method, params) => call(method, params, sessionId);
        await pageCall('Page.enable');
        return {
          navigate: url => pageCall('Page.navigate', { url }),
          activate: () => pageCall('Page.bringToFront'),
          evaluate: async expression => {
            const result = await pageCall('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
            if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
            return result.result.value;
          },
          screenshot: async path => writeFileSync(path, Buffer.from((await pageCall('Page.captureScreenshot', { format: 'png' })).data, 'base64')),
        };
      };
      return { createPage, version: product, popupURL: `chrome-extension://${id}/popup.html`, close: async () => { await call('Browser.close').catch(() => {}); connection.socket.close(); process.kill(); } };
    }
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    writeFileSync(join(profile, 'user.js'), [
      'user_pref("extensions.webextensions.uuids", "{\\"wipecord@rafelolv.github.io\\":\\"0bbfd900-7477-4eae-a89e-52e9c410982f\\"}");',
      'user_pref("remote.experimental.enabled", true);',
      'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
      'user_pref("toolkit.telemetry.enabled", false);',
      'user_pref("browser.shell.checkDefaultBrowser", false);',
    ].join('\n'));
    process = spawn(globalThis.process.env.FIREFOX_BIN || 'firefox', [
      '--headless', '--no-remote', '--profile', profile, '--remote-debugging-port', String(port), 'about:blank',
    ], { stdio: 'ignore', env: { ...globalThis.process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' } });
    await waitFor(async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).status > 0; } catch { return false; } }, 'Firefox did not start');
    connection = await connect(`ws://127.0.0.1:${port}/session`);
    const { call } = connection;
    const { capabilities } = await call('session.new', { capabilities: { alwaysMatch: {} } });
    await call('session.subscribe', { events: ['log.entryAdded'] });
    await call('webExtension.install', { extensionData: { type: 'path', path: extension } });
    const createPage = async (url = 'about:blank') => {
      const { context } = await call('browsingContext.create', { type: 'tab' });
      const page = {
        navigate: url => call('browsingContext.navigate', { context, url, wait: 'complete' }),
        activate: () => call('browsingContext.activate', { context }),
        evaluate: async expression => {
          const result = await call('script.evaluate', { expression, target: { context }, awaitPromise: true });
          if (result.type === 'exception') throw Error(result.exceptionDetails.text);
          return result.result.value;
        },
        screenshot: async path => writeFileSync(path, Buffer.from((await call('browsingContext.captureScreenshot', { context })).data, 'base64')),
      };
      await page.navigate(url);
      return page;
    };
    return { createPage, version: `Firefox/${capabilities.browserVersion}`, events: connection.events, popupURL: 'moz-extension://0bbfd900-7477-4eae-a89e-52e9c410982f/popup.html', close: async () => { await call('session.end').catch(() => {}); connection.socket.close(); process.kill(); } };
  } catch (error) {
    connection?.socket.close();
    process?.kill();
    throw error;
  }
}
