import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { browserSession, delay, waitFor } from './browser-session.mjs';

// Only the temporary manifests' matches change to loopback. Shipped manifests
// remain Discord-only; all executable files are copied byte-for-byte.
const directory = mkdtempSync(join(tmpdir(), 'wipecord-extensions-'));
const artifact = readFileSync('wipecord.user.js', 'utf8');
const author = '11111111111111111', channel = '33333333333333333';
const fixture = first => `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="app-mount"><section aria-label="Channel header"><div role="toolbar"></div></section></div>
<script>
window.requests=[];window.prompts=[];window.errors=[];window.accept=false;window.deleted=[];
window.addEventListener('error',e=>window.errors.push(e.message));
window.addEventListener('unhandledrejection',e=>window.errors.push(String(e.reason)));
localStorage.setItem('user_id_cache',JSON.stringify('${author}'));
localStorage.setItem('token',JSON.stringify('synthetic-test-token'));
window.alert=()=>{};window.confirm=text=>{window.prompts.push(text);return window.accept;};
window.rows=()=>{
 const row=(id,patch={})=>({id,channel_id:'${channel}',timestamp:'2026-10-11T12:00:00Z',content:'keep https://example.test',type:0,pinned:false,author:{id:'${author}',username:'fixture'},attachments:[{filename:'fixture.txt'}],embeds:[],flags:0,...patch});
 return [row('44444444444444449',{pinned:true}),row('44444444444444448',{author:{id:'99999999999999999'}}),row('44444444444444447',{content:'other https://example.test'}),row('44444444444444446',{content:'keep without a link'}),row('44444444444444445',{attachments:[]}),row('44444444444444444'),row('44444444444444443',{content:'keep https://wrong.test'}),row('44444444444444442',{type:1}),row('44444444444444441')];
};
window.fetch=async(url,init={})=>{
 const method=init.method||'GET';window.requests.push({url:String(url),method});
 if(window.hold===method)await new Promise(resolve=>window.release=resolve);
 if(method==='DELETE'){window.deleted.push(String(url).split('/').pop());return new Response(null,{status:204});}
 if(method!=='GET')throw Error('Unexpected mutation');
 if(String(url).endsWith('/channels/${channel}'))return new Response(JSON.stringify({id:'${channel}',type:1}),{status:200,headers:{'content-type':'application/json'}});
 const data=String(url).includes('before=')?[]:window.rows();
 return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
};
</script>${first ? '<script src="/wipecord.user.js"></script>' : ''}</body></html>`;
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/wipecord.user.js' ? 'application/javascript' : 'text/html');
  response.end(request.url === '/wipecord.user.js' ? artifact : fixture(request.url.includes('userscript-first')));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = `${origin}/channels/@me/${channel}`;
const prepare = `(()=>{const $=id=>document.getElementById(id);$('wipecord-btn').click();$('authorId').value='${author}';$('guildId').value='@me';$('channelId').value='${channel}';$('token').value='synthetic-test-token';})()`;
const idle = page => waitFor(() => page.evaluate('!document.getElementById("start").disabled && !window.release'), 'Run did not finish');
const start = page => page.evaluate('document.getElementById("start").click()');
const checks = [];
const versions = [];
try {
  for (const browser of (process.env.WIPECORD_TEST_BROWSERS || 'chromium,firefox').split(',')) {
    assert.ok(['chromium', 'firefox'].includes(browser), 'Choose chromium and/or firefox');
    const extension = join(directory, browser);
    cpSync(`dist/${browser}`, extension, { recursive: true });
    const manifest = JSON.parse(readFileSync(join(extension, 'manifest.json')));
    for (const script of manifest.content_scripts) script.matches = ['http://127.0.0.1/channels/*'];
    writeFileSync(join(extension, 'manifest.json'), JSON.stringify(manifest));
    for (const file of ['wipecord.user.js', 'status.js', 'popup.js']) assert.deepEqual(readFileSync(join(extension, file)), readFileSync(`dist/${browser}/${file}`));
    const session = await browserSession(browser, directory, resolve(extension));
    versions.push({ browser, version: session.version });
    try {
      const page = await session.createPage();
      await page.navigate(url);
      await waitFor(() => page.evaluate('!!document.getElementById("wipecord-btn")'), `${browser}: extension did not mount`).catch(async error => { console.log(browser, session.events, await page.evaluate('JSON.stringify({errors,marker:!!document.getElementById("wipecord-runtime")})')); throw error; });
      assert.equal(await page.evaluate('requests.length+prompts.length'), 0, 'Page load must not start a run');
      assert.equal(await page.evaluate('document.getElementById("wipecord").style.display'), 'none');
      await page.evaluate(prepare);
      assert.equal(await page.evaluate('document.getElementById("redact").checked && !document.getElementById("includePinned").checked && document.getElementById("searchDelay").value === "2000" && document.getElementById("deleteDelay").value === "1000"'), true);

      const popup = await session.createPage(session.popupURL);
      await page.activate();
      await waitFor(() => popup.evaluate('document.getElementById("status").textContent === "Ready in this tab"'), `${browser}: popup cannot read status`);
      assert.equal(await popup.evaluate('document.querySelectorAll("nav a").length'), 3);
      assert.equal(await popup.evaluate('document.querySelectorAll("button,input,form").length'), 0, 'Popup has no destructive control');
      assert.equal(await page.evaluate('requests.length+prompts.length'), 0, 'Popup must not start a run');
      // Firefox BiDi cannot capture extension pages in privileged scope.
      if (browser === 'chromium') await popup.screenshot(join(directory, `${browser}-popup.png`));
      await page.screenshot(join(directory, `${browser}-panel.png`));
      checks.push(`${browser}: native MAIN-world mount, privacy defaults, idle load and read-only popup`);

      // Extension first, then the userscript. Its entire IIFE runs, so duplicate
      // prevention is exercised at the real entry point rather than a helper.
      await page.evaluate('new Promise(resolve=>{const script=document.createElement("script");script.src="/wipecord.user.js";script.onload=resolve;document.head.appendChild(script);})');
      assert.equal(await page.evaluate('document.querySelectorAll("#wipecord").length'), 1);
      assert.equal(await page.evaluate('document.getElementById("wipecord-runtime").dataset.duplicates'), '1');
      await waitFor(() => popup.evaluate('document.getElementById("detail").textContent.includes("Another installation")'), 'Popup duplicate notice missing');
      await start(page);
      await waitFor(() => page.evaluate('prompts.length===1 && !document.getElementById("start").disabled'), 'Cancel did not finish').catch(async error => { console.log(browser, await page.evaluate('JSON.stringify({requests,promptCount:prompts.length,errors,log:document.getElementById("logArea").textContent})')); throw error; });
      assert.equal(await page.evaluate('deleted.length'), 0, 'Cancelled confirmation must not delete');

      const second = await session.createPage();
      await second.navigate(url + '?userscript-first');
      await waitFor(() => second.evaluate('document.getElementById("wipecord-runtime")?.dataset.duplicates === "1"'), 'Userscript-first duplicate not detected');
      assert.equal(await second.evaluate('document.querySelectorAll("#wipecord").length'), 1);
      await second.evaluate(prepare);
      checks.push(`${browser}: both duplicate load orders, one panel and cancelled confirmation`);

      await page.evaluate('window.hold="GET";window.release=null;');
      await start(page);
      await waitFor(() => page.evaluate('!!window.release'), 'Search not held');
      await page.activate();
      await waitFor(() => popup.evaluate('document.getElementById("status").textContent === "Deletion in progress"'), 'Popup running status missing');
      await start(second);
      await waitFor(() => second.evaluate('document.getElementById("logArea").textContent.includes("another tab")'), 'Other tab must refuse a concurrent run');
      assert.equal(await second.evaluate('requests.length'), 0);
      await page.evaluate('document.getElementById("stop").click();window.hold=null;window.release();window.release=null;');
      await idle(page);
      assert.equal(await page.evaluate('prompts.length'), 1);
      assert.equal(await page.evaluate('deleted.length'), 0);
      await delay(300);
      assert.equal(await second.evaluate('requests.length'), 0, 'Refused run must never start later');
      await start(second);
      await waitFor(() => second.evaluate('prompts.length===1 && !document.getElementById("start").disabled'), 'Lock did not release');
      checks.push(`${browser}: Stop during search, cross-tab exclusion, no queued start and lock release`);

      // DM history requires local author/content/link/file/bounds filtering.
      await page.evaluate('(()=>{const $=id=>document.getElementById(id);$(\'search\').value=\'keep\';$(\'hasLink\').checked=true;$(\'hasFile\').checked=true;$(\'pattern\').value=\'example\\.test\';$(\'minId\').value=\'44444444444444441\';window.accept=true;window.requests=[];window.deleted=[];window.prompts=[];})()');
      await start(page);
      await waitFor(() => page.evaluate('deleted.length===1 && !document.getElementById("start").disabled'), 'Filtered deletion did not finish');
      assert.equal(await page.evaluate('JSON.stringify(deleted)'), '["44444444444444444"]', 'Only the exact matching message may be deleted');
      assert.equal(await page.evaluate('prompts.length'), 1);
      assert.equal(await page.evaluate('requests.some(r=>r.url.includes("before="))'), false, 'Crossing the lower boundary must end the history walk');
      checks.push(`${browser}: simulated confirmed deletion preserves author, text, link, file, pattern, ID bound, pinned and system-message filters`);

      await page.evaluate('document.getElementById("minId").value="";window.rows=()=>[{id:"44444444444444444",channel_id:"33333333333333333",timestamp:"2026-10-11T12:00:00Z",content:"keep https://example.test",type:0,pinned:false,author:{id:"11111111111111111",username:"fixture"},attachments:[{}],embeds:[]}];window.deleted=[];window.requests=[];');
      await start(page);
      await waitFor(() => page.evaluate('deleted.length===1 && !document.getElementById("start").disabled'), 'Paginated deletion did not finish');
      assert.equal(await page.evaluate('requests.some(r=>r.url.includes("before="))'), true, 'History pagination retained');
      checks.push(`${browser}: history pagination fetches older messages after a simulated deletion`);

      await page.evaluate('window.rows=()=>[...["44444444444444444","44444444444444443"].map(id=>({id,channel_id:"33333333333333333",timestamp:"2026-10-11T12:00:00Z",content:"keep https://example.test",type:0,pinned:false,author:{id:"11111111111111111",username:"fixture"},attachments:[{}],embeds:[]}))];window.hold="DELETE";window.release=null;window.deleted=[];');
      await start(page);
      await waitFor(() => page.evaluate('!!window.release'), 'Deletion not held');
      await page.evaluate('document.getElementById("stop").click();window.hold=null;window.release();window.release=null;');
      await idle(page);
      assert.equal(await page.evaluate('deleted.length'), 1, 'Stop permits only the already in-flight simulated deletion');
      assert.equal(await page.evaluate('errors.length'), 0, 'No page errors');
      checks.push(`${browser}: Stop during DELETE prevents the next deletion; no browser exceptions`);

      const unsupported = await session.createPage(origin + '/unmatched');
      assert.equal(await unsupported.evaluate('!!document.getElementById("wipecord")'), false);
      await unsupported.activate();
      await waitFor(() => popup.evaluate('document.getElementById("status").textContent === "Open Discord in your browser"'), 'Unsupported tab status missing');
      checks.push(`${browser}: no injection outside matched routes and unsupported-tab popup`);
      console.log(`${session.version}: all extension integration scenarios passed`);
    } finally { await session.close(); }
  }
  writeFileSync(join(directory, 'results.json'), JSON.stringify({ versions, checks, fixture: 'Loopback-only manifests; byte-identical packaged executable files; synthetic API responses; temporary browser profiles.' }, null, 2));
  console.log(checks.join('\n'));
  console.log(`Browser results and popup screenshots: ${directory}`);
} finally { await new Promise(resolve => server.close(resolve)); }
