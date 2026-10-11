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
</style></head><body><div id="app-mount"><header><section aria-label="Channel header"><span># test-conversation</span><div role="toolbar"></div></section></header><main>Local preview · no Discord account or live messages</main></div>
<script>
window.fixtureRequests=[];window.fixturePrompts=[];window.fixtureErrors=[];
window.addEventListener('error',e=>window.fixtureErrors.push(e.message));
window.addEventListener('unhandledrejection',e=>window.fixtureErrors.push(String(e.reason)));
localStorage.setItem('user_id_cache',JSON.stringify('11111111111111111'));
localStorage.setItem('token',JSON.stringify('fixture-token'));
window.alert=()=>{};
window.confirm=message=>{window.fixturePrompts.push(message);return false;};
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
  const results = await evaluate(`(async()=>{
    const checks=[];const $=id=>document.getElementById(id);
    const check=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
    const wait=async predicate=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,50));}throw Error('UI timeout');};
    check(!!$('wipecord-btn'),'Toolbar mounts');
    $('wipecord-btn').click();
    check(getComputedStyle($('wipecord')).display!=='none','Toolbar opens panel');
    check($('redact').checked&&$('wipecord').classList.contains('redact'),'Privacy enabled by default');
    check($('token').type==='password','Token field stays masked');
    check(!$('includePinned').checked&&$('searchDelay').value==='2000'&&$('deleteDelay').value==='1000','Deletion defaults preserved');
    check($('stop').disabled&&getComputedStyle($('stop')).display!=='none','Disabled Stop stays visible');
    $('getAuthor').click();$('getChannel').click();
    check($('authorId').value==='11111111111111111'&&$('channelId').value==='${channel}'&&$('guildId').value==='${guild}','Current target buttons fill correct IDs');
    $('toggleSidebar').click();
    check($('wipecord').classList.contains('hide-sidebar')&&$('toggleSidebar').getAttribute('aria-expanded')==='false','Settings toggle collapses');
    $('toggleSidebar').click();
    check(!$('wipecord').classList.contains('hide-sidebar'),'Settings toggle restores');
    $('redact').checked=false;$('redact').dispatchEvent(new Event('change'));
    check(!$('wipecord').classList.contains('redact'),'Privacy toggle follows checkbox');
    $('redact').checked=true;$('redact').dispatchEvent(new Event('change'));
    $('guildId').value='invalid';$('start').click();
    await wait(()=>$('logArea').textContent.includes('Server ID'));
    check(window.fixtureRequests.length===0&&$('logArea').textContent.includes('Server ID'),'Invalid target makes no API request');
    $('getChannel').click();$('start').click();
    await wait(()=>window.fixturePrompts.length===1&&!$('start').disabled);
    check(window.fixturePrompts[0].includes('Synthetic preview message'),'Confirmation appears before deletion');
    check(window.fixtureRequests.every(r=>r.method!=='DELETE'),'Cancelling confirmation deletes nothing');
    check($('stop').disabled&&!$('start').disabled,'Actions reset after cancellation');
    check(!$('logArea').querySelector('.empty-state'),'Activity replaces placeholder');
    window.fixtureHold=true;$('start').click();
    await wait(()=>!!window.fixtureRelease);
    check($('start').disabled&&!$('stop').disabled,'Running state enables Stop');
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
  for (const [name, width, height, light] of [['desktop', 1280, 960, false], ['light', 1280, 960, true], ['compact', 390, 844, false], ['short', 520, 480, false]]) {
    await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await evaluate(`document.documentElement.classList.toggle('theme-light', ${light})`);
    const layout = await evaluate('(()=>{const p=document.getElementById(\'wipecord\'),r=p.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,overflow:p.scrollWidth>p.clientWidth};})()');
    assert.ok(layout.left >= 0 && layout.top >= 0 && layout.right <= layout.width && layout.bottom <= layout.height, `${name}: panel fits viewport`);
    assert.equal(layout.overflow, false, `${name}: no horizontal panel overflow`);
    await delay(200);
    const screenshot = await page('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(directory, `${name}.png`), Buffer.from(screenshot.data, 'base64'));
  }
  console.log(`${results.length} interaction checks, keyboard controls, dragging, resizing and four viewport/theme checks passed.`);
  console.log(`Visual previews: ${directory}`);
  await call('Browser.close');
} finally {
  socket?.close();
  chrome.kill();
  await new Promise(resolve => server.close(resolve));
}
