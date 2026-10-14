import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';

// Run the real userscript against local fixtures. No Discord account is used.
const directory = mkdtempSync(join(tmpdir(), 'wipecord-ui-'));
const artifact = readFileSync('wipecord.user.js', 'utf8');
const guild = '22222222222222222';
const channel = '33333333333333333';
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#252933;color:#bbc4d2;font:14px system-ui}header{height:48px;padding:8px 24px;border-bottom:1px solid #39414e}section{display:flex;justify-content:space-between;align-items:center}main{padding:24px;opacity:.5}
</style></head><body><div id="app-mount"><nav id="server-rail" aria-label="Servers sidebar" style="position:fixed;left:8px;top:80px;width:64px"><div data-list-id="guildsnav" style="width:64px"><div class="listItem_fixture" style="width:64px;height:48px"><button type="button" data-list-item-id="guildsnav___home" aria-label="Direct Messages">DM</button></div><div id="fixture-server" style="width:64px;height:48px">Server</div></div></nav><header><section aria-label="Channel header"><span># test-conversation</span><div role="toolbar"></div></section></header><main>Local preview · no Discord account or live messages</main></div>
<script>
window.fixtureRequests=[];window.fixturePrompts=[];window.fixtureErrors=[];
window.addEventListener('error',e=>window.fixtureErrors.push(e.message));
window.addEventListener('unhandledrejection',e=>window.fixtureErrors.push(String(e.reason)));
localStorage.setItem('user_id_cache',JSON.stringify('11111111111111111'));
localStorage.setItem('token',JSON.stringify('fixture-token'));
window.alert=()=>{};
window.alert=()=>{};window.confirm=()=>{throw Error('Native confirmation must not be used');};
new MutationObserver(()=>{const dialog=document.getElementById('confirmDeletion');if(!dialog)return;if(!dialog.open){dialog.dataset.observed='';return;}if(dialog.dataset.observed)return;dialog.dataset.observed='yes';window.fixturePrompts.push(dialog.textContent); if(!window.manualConfirmation)setTimeout(()=>document.getElementById('cancelDeletion').click(),10);}).observe(document,{subtree:true,attributes:true,attributeFilter:['open']});
window.fetch=async(url,options={})=>{
 window.fixtureRequests.push({url:String(url),method:options.method||'GET'});
 if(options.method==='DELETE')throw Error('Unexpected deletion in cancelled fixture');
 if(window.fixtureHold)await new Promise(resolve=>{window.fixtureRelease=resolve;});
 return new Response(JSON.stringify({total_results:1,messages:[[{id:'44444444444444444',channel_id:'${channel}',timestamp:'2026-10-11T12:00:00Z',content:'Synthetic preview message',type:0,hit:true,pinned:false,author:{username:'fixture',id:'11111111111111111'},attachments:[],embeds:[],flags:0}]]}),{status:200,headers:{'content-type':'application/json'}});
};
</script><script src="/wipecord.user.js"></script></body></html>`;
const server = createServer((req, res) => {
  res.setHeader('Content-Type', req.url === '/wipecord.user.js' ? 'application/javascript' : 'text/html');
  res.end(req.url === '/wipecord.user.js' ? artifact : fixture);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const chrome = spawn(process.env.CHROME_BIN || 'google-chrome', [
  '--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking',
  '--disable-component-update', '--no-first-run', '--remote-debugging-port=0',
  `--user-data-dir=${join(directory, 'profile')}`, 'about:blank',
], { stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const activePort = join(directory, 'profile', 'DevToolsActivePort');
  for (let i = 0; i < 100 && !existsSync(activePort); i++) await delay(100);
  assert.ok(existsSync(activePort), 'Chrome did not start; set CHROME_BIN to a Chromium browser');
  const [port, path] = readFileSync(activePort, 'utf8').trim().split('\n');
  socket = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  };
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => call(method, params, sessionId);
  const evaluate = async expression => {
    const result = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await page('Page.enable');
  await page('Emulation.setDeviceMetricsOverride', { width: 1280, height: 960, deviceScaleFactor: 1, mobile: false });
  await page('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/channels/${guild}/${channel}` });
  for (let i = 0; i < 100 && !await evaluate('!!document.querySelector("#wipecord-btn")'); i++) await delay(50);
  await evaluate('document.getElementById("wipecord-btn").click()');
  const idleImage = await page('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(directory, 'idle.png'), Buffer.from(idleImage.data, 'base64'));
  await evaluate('document.getElementById("hide").click()');
  const results = await evaluate(`(async()=>{
    const checks=[];const $=id=>document.getElementById(id);
    const check=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
    const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,50));}throw Error('UI timeout');};
    check(!!$('wipecord-btn'),'Toolbar mounts');
    check(!document.querySelector('#server-rail [id^="wipecord"]')&&document.querySelector('#server-rail [data-list-id]').childElementCount===2,'Server rail remains untouched');
    $('wipecord-btn').click();
    check(getComputedStyle($('wipecord')).display!=='none','Toolbar opens panel');
    check(!$('redact').checked&&!$('wipecord').classList.contains('redact'),'Streamer mode disabled by default');
    check($('token').type==='password','Token field stays masked');
    check(document.querySelectorAll('#wipecord .brand-mark').length===1&&!$('logArea').querySelector('svg,img,.idle-dot'),'Brand appears only in the panel header');
    check($('wipecord-btn').querySelector('.logo-body').getAttribute('d')===$('wipecord').querySelector('.logo-body').getAttribute('d'),'Panel and toolbar share the W mark');
    check(!$('includePinned').checked&&$('searchDelay').value==='2000'&&$('deleteDelay').value==='1000','Deletion defaults preserved');
    check($('stop').disabled&&getComputedStyle($('stop')).display!=='none','Disabled Stop stays visible');
    $('getAuthor').click();$('getChannel').click();
    check($('authorId').value==='11111111111111111'&&$('channelId').value==='${channel}'&&$('guildId').value==='${guild}','Current target buttons fill correct IDs');
    const originalFetch=window.fetch;
    window.fetch=async()=>new Response(JSON.stringify([{id:'${guild}'},{id:'55555555555555555'}]),{status:200});
    try { await $('getGuilds').onclick(); } finally { window.fetch=originalFetch; }
    check($('guildId').classList.contains('broad-scope')&&$('getGuilds').classList.contains('broad-scope')&&!$('serverScopeWarning').hidden,'All servers shows a persistent scope warning');
    check($('channelId').value===''&&$('authorId').value==='11111111111111111'&&window.fixturePrompts.length===0&&window.fixtureRequests.length===0,'All servers preserves author and never starts deletion');
    const darkColor=getComputedStyle($('getGuilds')).color;
    document.documentElement.classList.add('theme-light');
    check(getComputedStyle($('getGuilds')).color!==darkColor&&!$('serverScopeWarning').hidden,'Scope warning adapts to light theme');
    document.documentElement.classList.remove('theme-light');
    $('getChannel').click();
    check(!$('guildId').classList.contains('broad-scope')&&$('serverScopeWarning').hidden,'Current target clears the broad selection warning');
    $('guildId').value='${guild},55555555555555555';$('guildId').dispatchEvent(new Event('input'));
    check(!$('serverScopeWarning').hidden&&$('serverScopeWarning').textContent.includes('Channel IDs'),'Manual server lists also warn without misrepresenting channel limits');
    $('getChannel').click();
    $('toggleSidebar').click();
    check($('wipecord').classList.contains('hide-sidebar')&&$('toggleSidebar').getAttribute('aria-expanded')==='false','Settings toggle collapses');
    $('toggleSidebar').click();
    check(!$('wipecord').classList.contains('hide-sidebar'),'Settings toggle restores');
    $('redact').checked=false;$('redact').dispatchEvent(new Event('change'));
    check(!$('wipecord').classList.contains('redact'),'Privacy toggle follows checkbox');
    $('redact').checked=true;$('redact').dispatchEvent(new Event('change'));
    check($('wipecord').classList.contains('redact'),'Streamer mode can be enabled explicitly');
    $('guildId').value='invalid';$('start').click();
    await wait(()=>$('logArea').textContent.includes('Server ID'));
    check(window.fixtureRequests.length===0&&$('logArea').textContent.includes('Server ID'),'Invalid target makes no API request');
    $('getChannel').click();$('start').click();
    await wait(()=>window.fixturePrompts.length===1&&!$('start').disabled);
    check(window.fixturePrompts[0].includes('Synthetic preview message'),'Confirmation appears before deletion');
    check(window.fixtureRequests.every(r=>r.method!=='DELETE'),'Cancelling confirmation deletes nothing');
    check($('stop').disabled&&!$('start').disabled,'Actions reset after cancellation');
    check($('logArea').textContent.includes('Confirmation cancelled by you.')&&!Array.from($('logArea').querySelectorAll('.log-error')).some(node=>node.textContent.includes('cancelled')),'Cancellation is logged as a normal user action');
    check(!$('logArea').querySelector('.empty-state'),'Activity replaces placeholder');
    window.fixtureHold=true;$('start').click();
    await wait(()=>!!window.fixtureRelease);
    check($('start').disabled&&!$('stop').disabled,'Running state enables Stop');
    check(getComputedStyle($('progressPercent')).display!=='none'&&$('progressTarget').textContent==='Target 1 of 1','Running status prominently shows target position');
    $('clear').click();
    check($('logArea').textContent.includes('still running'),'Clearing a running log keeps its status');
    $('stop').click();window.fixtureRelease();window.fixtureHold=false;
    await wait(()=>!$('start').disabled);
    check($('stop').disabled&&window.fixturePrompts.length===1&&window.fixtureRequests.every(r=>r.method!=='DELETE'),'Stop prevents confirmation and deletion of pending work');
    $('clear').click();check(!!$('logArea').querySelector('.empty-state'),'Clear restores idle placeholder');
    $('hide').focus();
    check(document.activeElement===$('hide'),'Close button accepts keyboard focus');
    check(window.fixtureErrors.length===0,'No browser exceptions');
    $('authorId').value='';$('guildId').value='';$('channelId').value='';
    return checks;
  })()`);
  await page('Page.bringToFront');
  // Exercise native keyboard behavior, rather than dispatching a synthetic click.
  await page('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await page('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate('document.getElementById("wipecord").style.display'), 'none', 'Enter closes the panel');
  await evaluate('document.getElementById("wipecord-btn").focus()');
  await page('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await page('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.notEqual(await evaluate('document.getElementById("wipecord").style.display'), 'none', 'Enter opens the panel');
  for (const key of ['Escape', 'Enter']) {
    await evaluate('window.manualConfirmation=true;document.getElementById("getAuthor").click();document.getElementById("getChannel").click();document.getElementById("start").click()');
    for (let i = 0; i < 100 && !await evaluate('document.getElementById("confirmDeletion").open'); i++) await delay(50);
    assert.equal(await evaluate('document.activeElement.id'), 'cancelDeletion');
    await page('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, ...(key === 'Enter' ? { text: '\r' } : {}), windowsVirtualKeyCode: key === 'Escape' ? 27 : 13 });
    await page('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: key === 'Escape' ? 27 : 13 });
    for (let i = 0; i < 100 && await evaluate('document.getElementById("start").disabled'); i++) await delay(50);
    assert.equal(await evaluate('document.getElementById("confirmDeletion").open || window.fixtureRequests.some(r=>r.method === "DELETE")'), false, `${key} must cancel, never delete`);
  }
  await evaluate('window.manualConfirmation=false');
  await evaluate(`(()=>{
    window.manualConfirmation=true;window.confirmInjected=false;window.dialogOriginalFetch=window.fetch;
    const payload='<img src=x onerror="window.confirmInjected=true">';document.getElementById('search').value=payload;
    window.fetch=async()=>new Response(JSON.stringify({total_results:1,messages:[[{id:'44444444444444444',channel_id:'${channel}',type:0,hit:true,content:payload,timestamp:'2026-10-13T12:00:00Z',author:{id:'11111111111111111',username:'fixture'}}]]}),{status:200});
    document.getElementById('start').click();
  })()`);
  for (let i = 0; i < 100 && !await evaluate('document.getElementById("confirmDeletion").open'); i++) await delay(50);
  assert.equal(await evaluate('document.getElementById("confirmPreview").textContent.includes("<img") && !document.querySelector("#confirmDeletion img, #confirmDeletion script, #confirmDeletion iframe") && !window.confirmInjected'), true, 'Preview and filter markup remain inert text');
  await evaluate('document.getElementById("cancelDeletion").click();window.fetch=window.dialogOriginalFetch;document.getElementById("search").value="";window.manualConfirmation=false');
  for (let i = 0; i < 100 && await evaluate('document.getElementById("start").disabled'); i++) await delay(50);
  await evaluate('window.savedShowModal=document.getElementById("confirmDeletion").showModal;document.getElementById("confirmDeletion").showModal=()=>{throw Error("synthetic dialog failure")};document.getElementById("start").click()');
  for (let i = 0; i < 100 && !await evaluate('document.getElementById("logArea").textContent.includes("Could not open the cleanup confirmation") && !document.getElementById("start").disabled'); i++) await delay(50);
  assert.equal(await evaluate('!document.getElementById("confirmDeletion").open && !window.fixtureRequests.some(r=>r.method==="DELETE") && !document.getElementById("start").disabled'), true, 'Failed dialog must cancel without native fallback or deletion');
  await evaluate('document.getElementById("confirmDeletion").showModal=window.savedShowModal');
  const bounds = await evaluate('(()=>{const r=document.getElementById("wipecord").getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};})()');
  await page('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.left + 180, y: bounds.top + 30, button: 'left', buttons: 1, clickCount: 1 });
  await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.left + 150, y: bounds.top + 46, buttons: 1 });
  await page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.left + 150, y: bounds.top + 46, button: 'left', buttons: 0, clickCount: 1 });
  const moved = await evaluate('document.getElementById("wipecord").getBoundingClientRect().left');
  assert.ok(moved < bounds.left, 'Header drag moves the panel');
  await evaluate('Object.assign(document.getElementById("wipecord").style,{left:"",top:""})');
  await page('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.right - 12, y: bounds.bottom - 12, button: 'left', buttons: 1, clickCount: 1 });
  await page('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.right - 2, y: bounds.bottom - 2, buttons: 1 });
  await page('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.right - 2, y: bounds.bottom - 2, button: 'left', buttons: 0, clickCount: 1 });
  assert.ok(await evaluate('document.getElementById("wipecord").getBoundingClientRect().width') > bounds.width, 'Resize handle changes panel width');
  await evaluate('Object.assign(document.getElementById("wipecord").style,{left:"",top:"",width:"",height:""})');
  await evaluate('document.getElementById("guildId").value="22222222222222222,55555555555555555";document.getElementById("channelId").value="";document.getElementById("guildId").dispatchEvent(new Event("input"))');
  for (const [name, width, height, light] of [['desktop', 1280, 960, false], ['light', 1280, 960, true], ['medium', 800, 720, false], ['compact', 390, 844, false], ['short', 520, 480, false]]) {
    await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.documentElement.classList.toggle('theme-light', ${light})`);
    const layout = await evaluate('(()=>{const p=document.getElementById(\'wipecord\'),r=p.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:p.scrollWidth>p.clientWidth};})()');
    assert.ok(layout.left >= 0 && layout.top >= 0 && layout.right <= layout.width && layout.bottom <= layout.height, `${name}: panel fits viewport`);
    assert.equal(layout.overflow, false, `${name}: no horizontal panel overflow`);
    const footer = await evaluate('(()=>{const f=document.querySelector("#wipecord .footer").getBoundingClientRect(),c=document.getElementById("autoScroll").parentElement.getBoundingClientRect();return {aligned:c.left>f.left+f.width/2&&f.right-c.right<=30};})()');
    assert.equal(footer.aligned, true, `${name}: Auto scroll stays at the right`);
    const help = await evaluate('(()=>{const s=document.querySelector("#wipecord .sidebar").getBoundingClientRect(),i=document.querySelector("#wipecord .info").getBoundingClientRect();return i.top>=s.top&&i.bottom<=s.bottom;})()');
    assert.equal(help, true, `${name}: sidebar help stays visible outside settings scroll`);
    await delay(200);
    const screenshot = await page('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(directory, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
    await evaluate('window.manualConfirmation=true;document.getElementById("getChannel").click();document.getElementById("start").click()');
    for (let i = 0; i < 100 && !await evaluate('document.getElementById("confirmDeletion").open'); i++) await delay(50);
    const modal = await evaluate('(()=>{const r=document.getElementById("confirmDeletion").getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};})()');
    assert.ok(modal.left >= 0 && modal.top >= 0 && modal.right <= modal.width && modal.bottom <= modal.height, `${name}: confirmation fits viewport`);
    const modalImage = await page('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(directory, `${name}-confirmation.png`), Buffer.from(modalImage.data, 'base64'));
    await evaluate('document.getElementById("cancelDeletion").click();window.manualConfirmation=false');
    for (let i = 0; i < 100 && await evaluate('document.getElementById("start").disabled'); i++) await delay(50);
  }
  console.log(`${results.length} interaction checks, keyboard controls, dragging, resizing, inert confirmation markup and five panel/dialog viewport/theme checks passed.`);
  console.log(`Visual previews: ${directory}`);
  await call('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
  await new Promise(resolve => server.close(resolve));
}
