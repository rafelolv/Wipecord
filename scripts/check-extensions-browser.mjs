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
const fixture = (first, late) => `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="app-mount">${late ? '<div id="message-tools" class="toolbar_message"></div>' : '<section aria-label="Channel header"><div role="toolbar"></div></section>'}</div>
<script>
window.requests=[];window.prompts=[];window.errors=[];window.accept=false;window.deleted=[];
window.addEventListener('error',e=>window.errors.push(e.message));
window.addEventListener('unhandledrejection',e=>window.errors.push(String(e.reason)));
localStorage.setItem('user_id_cache',JSON.stringify('${author}'));
localStorage.setItem('token',JSON.stringify('synthetic-test-token'));
window.alert=()=>{};window.confirm=()=>{throw Error('Native confirmation must not be used');};
new MutationObserver(()=>{const dialog=document.getElementById('confirmDeletion');if(!dialog)return;if(!dialog.open){dialog.dataset.observed='';return;}if(dialog.dataset.observed)return;dialog.dataset.observed='yes';window.prompts.push(dialog.textContent); if(!window.manualConfirmation)setTimeout(()=>document.getElementById(window.accept?'acceptDeletion':'cancelDeletion').click(),10);}).observe(document,{subtree:true,attributes:true,attributeFilter:['open']});
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
  response.end(request.url === '/wipecord.user.js' ? artifact : fixture(request.url.includes('userscript-first'), request.url.includes('late-header')));
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
      const loading = await session.createPage();
      await loading.navigate(url + '?late-header');
      await waitFor(() => loading.evaluate('!!document.getElementById("wipecord-runtime")'), 'Startup claim missing');
      await delay(1600);
      assert.equal(await loading.evaluate('!!document.getElementById("wipecord") || !!document.getElementById("wipecord-btn")'), false, 'Loading screens must not initialize the UI');
      assert.equal(await loading.evaluate('document.getElementById("message-tools").childElementCount'), 0, 'Message toolbars must remain untouched');
      await loading.evaluate('document.getElementById("app-mount").insertAdjacentHTML("beforeend", \'<section aria-label="Channel header" style="display:none"><div role="toolbar" id="hidden-toolbar"></div></section><section aria-label="Channel header"><div role="toolbar" id="active-toolbar"></div></section>\')');
      await waitFor(() => loading.evaluate('!!document.querySelector("#active-toolbar #wipecord-btn")'), 'Late header did not mount');
      await loading.evaluate('document.getElementById("active-toolbar").parentElement.style.display="none";document.getElementById("app-mount").insertAdjacentHTML("beforeend", \'<section aria-label="Channel header"><div role="toolbar" id="next-toolbar"></div></section>\')');
      await waitFor(() => loading.evaluate('!!document.querySelector("#next-toolbar #wipecord-btn")'), 'Button did not follow the visible replacement header');
      assert.equal(await loading.evaluate('document.querySelectorAll("#wipecord").length'), 1);
      assert.equal(await loading.evaluate('requests.length + prompts.length + errors.length'), 0, 'Startup and header replacement must stay idle without page errors');
      await loading.navigate(url + '?late-header-reload');
      await waitFor(() => loading.evaluate('location.search === "?late-header-reload" && !!document.getElementById("message-tools") && !!document.getElementById("wipecord-runtime") && !document.getElementById("next-toolbar")'), 'Reload did not reach its new loading document');
      await delay(1600);
      assert.equal(await loading.evaluate('!!document.getElementById("wipecord") || !!document.getElementById("wipecord-btn")'), false, 'Reload must also wait for the real header');
      await loading.evaluate('document.getElementById("app-mount").insertAdjacentHTML("beforeend", \'<section aria-label="Channel header"><div role="toolbar" id="reloaded-toolbar"></div></section>\')');
      await waitFor(() => loading.evaluate('!!document.querySelector("#reloaded-toolbar #wipecord-btn")'), 'Reloaded header did not mount');
      assert.equal(await loading.evaluate('requests.length + prompts.length + errors.length'), 0);
      checks.push(`${browser}: delayed initialization after load/reload, untouched message toolbars, hidden-header exclusion and visible header replacement`);

      const page = await session.createPage();
      await page.navigate(url);
      await waitFor(() => page.evaluate('!!document.getElementById("wipecord-btn")'), `${browser}: extension did not mount`).catch(async error => { console.log(browser, session.events, await page.evaluate('JSON.stringify({errors,marker:!!document.getElementById("wipecord-runtime")})')); throw error; });
      assert.equal(await page.evaluate('requests.length+prompts.length'), 0, 'Page load must not start a run');
      assert.equal(await page.evaluate('document.getElementById("wipecord").style.display'), 'none');
      await page.evaluate(prepare);
      assert.equal(await page.evaluate('document.getElementById("redact").checked === false && !document.getElementById("includePinned").checked && document.getElementById("searchDelay").value === "2000" && document.getElementById("deleteDelay").value === "1000"'), true);

      await page.evaluate(`(async()=>{
        const original=window.fetch;
        window.htmlInjected=false;
        const payload='<img src=x onerror="window.htmlInjected=true"><svg onload="window.htmlInjected=true">';
        window.fetch=async()=>{throw Error(payload);};
        try{await document.getElementById('getGuilds').onclick();}finally{window.fetch=original;}
        const log=document.getElementById('logArea');
        if(log.textContent.includes(payload)||!log.textContent.includes('Check your connection')||log.querySelector('img,svg,script,iframe')||window.htmlInjected)throw Error('Network error exposed payload or lost safe guidance');
        document.getElementById('clear').click();
        if(!log.querySelector('.empty-state'))throw Error('Clear did not restore the empty state');
      })()`);
      checks.push(`${browser}: network errors provide safe guidance without exposing hostile payloads; clearing restores the empty state`);

      await page.evaluate(`(async()=>{
        const $=id=>document.getElementById(id), original=window.fetch;
        const initial=[requests.length,prompts.length,$('authorId').value,$('search').value];
        window.fetch=async()=>new Response(JSON.stringify([{id:'22222222222222222'},{id:'55555555555555555'}]),{status:200});
        try{await $('getGuilds').onclick();}finally{window.fetch=original;}
        if(!$('guildId').classList.contains('broad-scope')||!$('getGuilds').classList.contains('broad-scope')||$('serverScopeWarning').hidden)throw Error('All servers did not show a scope warning');
        if($('channelId').value||$('authorId').value!==initial[2]||$('search').value!==initial[3]||requests.length!==initial[0]||prompts.length!==initial[1])throw Error('Selecting all changed filters or started a run');
        $('getChannel').click();
        if(!$('serverScopeWarning').hidden||$('getGuilds').classList.contains('broad-scope'))throw Error('Current target did not clear the scope warning');
        $('guildId').value='22222222222222222,55555555555555555';$('guildId').dispatchEvent(new Event('input'));
        if($('serverScopeWarning').hidden||!$('serverScopeWarning').textContent.includes('Channel IDs'))throw Error('Manual server selection lost its channel limits');
        $('getChannel').click();$('clear').click();
      })()`);
      checks.push(`${browser}: all-server and manual selection warnings, reset to current target, preserved filters and no automatic run`);

      await page.evaluate(`(async()=>{
        const $=id=>document.getElementById(id);
        const wait=async()=>{for(let i=0;i<100;i++){if($('logArea').textContent.includes('before starting')||$('logArea').textContent.includes('earlier'))return;await new Promise(r=>setTimeout(r,20));}throw Error('Validation timeout');};
        $('pattern').value='[';$('start').click();await wait();
        if(requests.length||prompts.length)throw Error('Malformed pattern reached API');
        $('pattern').value='';$('minDate').value='2026-10-12T12:00';$('maxDate').value='2026-10-11T12:00';$('logArea').textContent='';$('start').click();await wait();
        if(requests.length||prompts.length)throw Error('Reversed dates reached API');
        $('minDate').value='';$('maxDate').value='';
        const snapshot=()=>[$('guildId').value,$('channelId').value,$('authorId').value].join('|');
        const initial=snapshot();
        const upload=async text=>{const transfer=new DataTransfer();transfer.items.add(new File([text],'index.json',{type:'application/json'}));$('importJsonInput').files=transfer.files;await $('importJsonInput').onchange();};
        for(const text of ['{','[]','{}','{"bad":"label"}','{"44444444444444444":{}}']){await upload(text);if(snapshot()!==initial)throw Error('Rejected archive changed targets');}
        await upload('{"44444444444444444":"Synthetic label","55555555555555555":null}');
        if($('guildId').value!=='@me'||$('channelId').value!=='44444444444444444,55555555555555555')throw Error('Valid archive did not load');
        const transfer=new DataTransfer();transfer.items.add(new File(['{}'],'old.json',{type:'application/json'}));$('importJsonInput').files=transfer.files;
        let release;transfer.files[0].text=()=>new Promise(resolve=>release=resolve);
        const oldImport=$('importJsonInput').onchange();
        await upload('{"66666666666666666":null}');release('{"77777777777777777":null}');await oldImport;
        if($('channelId').value!=='66666666666666666')throw Error('Stale import overwrote a newer selection');
        $('channelId').value='${channel}';
      })()`);
      checks.push(`${browser}: malformed filters and reversed dates make no requests; rejected archives preserve targets and valid archives load atomically`);

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
      assert.ok(await page.evaluate('document.getElementById("summaryText").textContent.includes("Confirmation cancelled")'));

      const second = await session.createPage();
      await second.navigate(url + '?userscript-first');
      await waitFor(() => second.evaluate('document.getElementById("wipecord-runtime")?.dataset.duplicates === "1"'), 'Userscript-first duplicate not detected');
      await waitFor(() => second.evaluate('!!document.getElementById("wipecord-btn")'), 'Claim owner did not finish delayed initialization');
      assert.equal(await second.evaluate('document.querySelectorAll("#wipecord").length'), 1);
      await second.evaluate(prepare);
      checks.push(`${browser}: both duplicate load orders, one panel and cancelled confirmation`);

      await page.evaluate('document.getElementById("redact").checked=true;document.getElementById("redact").dispatchEvent(new Event("change"));window.manualConfirmation=true;window.savedPrompts=prompts.slice();document.getElementById("searchDelay").value="100";');
      try {
        for (const action of ['cancel', 'escape', 'close', 'panel', 'stop']) {
          await start(page);
          await waitFor(() => page.evaluate('document.getElementById("confirmDeletion").open'), 'Custom confirmation did not open');
          assert.equal(await page.evaluate('document.activeElement.id'), 'cancelDeletion');
          assert.equal(await page.evaluate('document.getElementById("confirmSample").open'), false);
          assert.ok(await page.evaluate('document.getElementById("confirmSampleNotice").textContent.includes("not the complete cleanup list")'));
          assert.equal(await page.evaluate('deleted.length'), 0);
          assert.equal(await page.evaluate('getComputedStyle(document.getElementById("confirmPreview")).color'), 'rgba(0, 0, 0, 0)');
          if (action === 'cancel') await page.screenshot(join(directory, `${browser}-confirmation.png`));
          await page.evaluate('document.getElementById("confirmSample").open=true');
          await page.evaluate(`(()=>{
            const $=id=>document.getElementById(id);
            if('${action}'==='escape')$('confirmDeletion').dispatchEvent(new Event('cancel',{cancelable:true}));
            else $('${{ cancel: 'cancelDeletion', close: 'closeConfirmation', panel: 'hide', stop: 'stopConfirmation' }[action] || 'cancelDeletion'}').click();
          })()`);
          await waitFor(() => page.evaluate('!document.getElementById("start").disabled && !document.getElementById("confirmDeletion").open'), 'Cancellation left the run locked');
          assert.equal(await page.evaluate('deleted.length'), 0);
          assert.equal(await page.evaluate('document.getElementById("confirmPreview").textContent'), '');
          assert.equal(await page.evaluate('document.getElementById("summaryOutcome").textContent'), action === 'stop' ? 'Stopped by you' : 'Confirmation cancelled');
          if (action === 'panel') await page.evaluate('document.getElementById("wipecord-btn").click()');
        }
      } finally { await page.evaluate('window.manualConfirmation=false;prompts.splice(0,prompts.length,...window.savedPrompts);document.getElementById("searchDelay").value="2000";'); }
      checks.push(`${browser}: custom modal defaults to Cancel, redacts preview and cancels safely via Cancel, Escape, close, panel hide or Stop`);

      await page.evaluate(`(async()=>{
        const $=id=>document.getElementById(id), original=window.fetch, priorPrompts=prompts.slice();
        const wait=async requested=>{for(let i=0;i<150;i++){if(requested()&&!$('start').disabled&&$('summaryText').textContent.includes('Ended with errors'))return;await new Promise(resolve=>setTimeout(resolve,20));}throw Error('Error run did not end');};
        try {
          for(const [status,code,guidance] of [[401,0,'Sign in to Discord again'],[403,50001,'permission'],[404,10003,'Check the target'],[503,0,'server error'],[429,40333,'will not retry this block automatically']]) {
            $('clear').click();let calls=0;
            const before=[deleted.length,prompts.length];
            window.fetch=async()=>{calls++;return new Response(JSON.stringify({code,message:'synthetic-private-body'}),{status});};
            $('start').click();await wait(()=>calls>0);
            const text=$('logArea').textContent;
            if(!text.includes(guidance)||text.includes('synthetic-private-body'))throw Error('Error guidance was missing or exposed response data');
            if(calls!==1||deleted.length!==before[0]||prompts.length!==before[1])throw Error('Error changed retry or deletion safeguards');
            if(!$('stop').disabled||$('start').disabled)throw Error('Error left controls locked');
          }
        } finally {window.fetch=original;prompts.splice(0,prompts.length,...priorPrompts);$('clear').click();}
      })()`);
      checks.push(`${browser}: session, access, missing target, service and temporary-block guidance; no payload exposure or destructive requests`);

      await page.evaluate('window.hold="GET";window.release=null;');
      await start(page);
      await waitFor(() => page.evaluate('!!window.release'), 'Search not held');
      await page.evaluate(`(async()=>{
        const field=document.getElementById('channelId'), before=field.value;
        const transfer=new DataTransfer();transfer.items.add(new File(['{"66666666666666666":null}'],'index.json',{type:'application/json'}));
        const input=document.getElementById('importJsonInput');input.files=transfer.files;await input.onchange();
        if(field.value!==before)throw Error('Import changed a running target');
      })()`);
      await page.activate();
      await waitFor(() => popup.evaluate('document.getElementById("status").textContent === "Deletion in progress"'), 'Popup running status missing');
      await start(second);
      await waitFor(() => second.evaluate('document.getElementById("logArea").textContent.includes("another tab")'), 'Other tab must refuse a concurrent run');
      assert.equal(await second.evaluate('requests.length'), 0);
      await page.evaluate('document.getElementById("stop").click();window.hold=null;window.release();window.release=null;');
      await idle(page);
      assert.equal(await page.evaluate('prompts.length'), 1);
      assert.ok(await page.evaluate('document.getElementById("summaryText").textContent.includes("Stopped by you")'));
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
      assert.equal(await page.evaluate('!!document.querySelector("#logArea b x") && getComputedStyle(document.querySelector("#logArea b x")).color === "rgba(0, 0, 0, 0)"'), true, 'Log formatting and default redaction must survive DOM rendering');
      assert.equal(await page.evaluate('prompts.length'), 1);
      assert.ok(await page.evaluate('document.getElementById("summaryText").textContent.includes("1 deleted") && document.getElementById("summaryText").textContent.includes("7 ignored")'));
      assert.equal(await page.evaluate('document.getElementById("summaryDeleted").textContent'), '1');
      assert.equal(await page.evaluate('document.getElementById("summaryOutcome").textContent'), 'Completed');
      assert.equal(await page.evaluate('!!document.querySelector("#logArea .log-success")'), true);
      await page.screenshot(join(directory, `${browser}-completed-panel.png`));
      const exported = await page.evaluate(`(async()=>{
        let payload;const create=URL.createObjectURL;const click=HTMLAnchorElement.prototype.click;
        URL.createObjectURL=blob=>{payload=blob;return create(blob);};HTMLAnchorElement.prototype.click=()=>{};
        try{document.getElementById('exportReport').click();return await payload.text();}
        finally{URL.createObjectURL=create;HTMLAnchorElement.prototype.click=click;}
      })()`);
      const report = JSON.parse(exported);
      assert.deepEqual(report.counts, { deleted: 1, ignored: 7, failed: 0, alreadyGone: 0 });
      assert.equal(report.reason, 'completed');
      for (const privateValue of ['synthetic-test-token', author, channel, 'example.test', 'fixture']) assert.equal(exported.includes(privateValue), false, 'Export must contain no session, target or message data');
      checks.push(`${browser}: completed summary and anonymous JSON export preserve exact counts`);
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

      await page.evaluate(`(async()=>{
        const $=id=>document.getElementById(id), original=window.fetch;
        const wait=async predicate=>{for(let i=0;i<1000;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Search recovery timeout');};
        $('guildId').value='22222222222222222';$('channelId').value='${channel}';$('searchDelay').value='100';$('deleteDelay').value='50';
        let phase=0,searches=0,removed=false;const mutations=[],queries=[];window.accept=true;
        const initialPrompts=prompts.length;
        window.fetch=async(url,init={})=>{
          if(init.method==='DELETE'){mutations.push(String(url));removed=true;return new Response(null,{status:204});}
          if(!String(url).includes('/messages/search'))throw Error('Unexpected recovery request');
          if(init.cache!=='no-store')throw Error('Search reused browser cache');
          const query=new URL(url).searchParams;
          if(query.get('author_id')!=='${author}'||query.get('channel_id')!=='${channel}'||query.get('content')!=='keep')throw Error('Search retry changed filters');
          queries.push(query.toString());searches++;
          if(removed||(phase===1&&searches===1))return new Response(JSON.stringify({total_results:0,messages:[]}),{status:200});
          return new Response(JSON.stringify({total_results:1,messages:[[{id:phase===0?'44444444444444444':'55555555555555555',channel_id:'${channel}',type:0,hit:true,content:'keep https://example.test',timestamp:'2026-10-13T12:00:00Z',author:{id:'${author}',username:'fixture'},attachments:[{}],embeds:[]}]]}),{status:200});
        };
        try{
          $('start').click();await wait(()=>mutations.length===1&&!$('start').disabled);
          phase=1;searches=0;removed=false;queries.length=0;
          $('start').click();await wait(()=>mutations.length===2&&!$('start').disabled);
          if(prompts.length!==initialPrompts+2||queries[0]!==queries[1]||$('summaryDeleted').textContent!=='1')throw Error('Second cleanup lost confirmation, filters or counts');
          let emptyRequests=0;window.fetch=async()=>{emptyRequests++;return new Response(JSON.stringify({total_results:0,messages:[]}),{status:200});};
          const beforePrompts=prompts.length;$('start').click();await wait(()=>emptyRequests===1&&$('logArea').textContent.includes('Checking again'));
          $('stop').click();await wait(()=>!$('start').disabled);
          if(emptyRequests!==1||prompts.length!==beforePrompts)throw Error('Stop during retry allowed another request');
          let invalidRequests=0;window.fetch=async()=>{invalidRequests++;return new Response('not-json',{status:200});};
          $('start').click();await wait(()=>invalidRequests===1&&!$('start').disabled);
          if(!$('summaryText').textContent.includes('Ended with errors')||prompts.length!==beforePrompts)throw Error('Invalid search response looked completed');
        }finally{window.fetch=original;}
      })()`);
      checks.push(`${browser}: fresh uncached search retries recover new messages without reload, preserve confirmation/filters, Stop cancels retry and malformed responses fail safely`);

      await page.evaluate(`(()=>{
        window.auditOriginalFetch=window.fetch;window.auditRemoved=new Set();window.releaseAuditSearch=null;
        const row=index=>({id:String(44444444444444453n-BigInt(index)),channel_id:'${channel}',hit:true,type:0,content:'keep https://example.test',author:{id:'${author}',username:'fixture'},attachments:[{}],embeds:[],timestamp:'2026-10-13T12:00:00Z'});
        window.fetch=async(url,init={})=>{
          if(init.method==='DELETE'){window.auditRemoved.add(String(url).split('/').pop());return new Response(null,{status:204});}
          if(window.auditRemoved.size===0)return new Response(JSON.stringify({total_results:7,messages:Array.from({length:7},(_,i)=>[row(i)])}),{status:200});
          if(window.auditRemoved.size===7)return new Promise(resolve=>{window.releaseAuditSearch=()=>resolve(new Response(JSON.stringify({total_results:4,messages:Array.from({length:4},(_,i)=>[row(i+7)])}),{status:200}));});
          return new Response(JSON.stringify({total_results:0,messages:[]}),{status:200});
        };
      })()`);
      try {
        await start(page);
        await waitFor(() => page.evaluate('typeof window.releaseAuditSearch === "function"'), 'Estimated total did not reach the pending search');
        assert.equal(await page.evaluate('document.getElementById("progressPrimary").textContent.includes("7 processed") && document.getElementById("progressPrimary").textContent.includes("Still checking")'), true);
        assert.equal(await page.evaluate('document.getElementById("progressPercent").textContent.includes("%")'), false);
        assert.equal(await page.evaluate('!document.getElementById("progressBar").hasAttribute("value") && !document.querySelector("#wipecord-btn progress").hasAttribute("value")'), true);
        assert.equal(await page.evaluate('document.getElementById("runSummary").hidden && !document.getElementById("stop").disabled'), true);
        await page.screenshot(join(directory, `${browser}-checking-search.png`));
        await page.evaluate('window.releaseAuditSearch()');
        await waitFor(() => page.evaluate('!document.getElementById("start").disabled'), 'Remaining four messages did not finish');
        assert.equal(await page.evaluate('window.auditRemoved.size'), 11);
        assert.equal(await page.evaluate('document.getElementById("summaryDeleted").textContent'), '11');
        assert.equal(await page.evaluate('document.getElementById("summaryOutcome").textContent'), 'Completed');
      } finally { await page.evaluate('window.fetch=window.auditOriginalFetch'); }
      checks.push(`${browser}: reaching seven estimated matches stays active without a percentage or full bar; four later matches produce an eleven-deletion final summary`);

      await page.evaluate(`(()=>{
        window.batchOriginalFetch=window.fetch;window.batchRemoved=new Set();window.manualConfirmation=true;window.batchPromptCount=prompts.length;
        const $=id=>document.getElementById(id);$('guildId').value='22222222222222222,55555555555555555';$('channelId').value='';
        window.fetch=async(url,init={})=>{
          if(init.method==='DELETE'){window.batchRemoved.add(String(url).split('/').pop());return new Response(null,{status:204});}
          const id=String(url).split('/guilds/')[1].split('/')[0];
          return new Response(JSON.stringify(window.batchRemoved.has(id)?{total_results:0,messages:[]}:{total_results:1,messages:[[{id,channel_id:'${channel}',hit:true,type:0,content:'keep https://example.test',timestamp:'2026-10-13T12:00:00Z',author:{id:'${author}',username:'fixture'},attachments:[{}],embeds:[]}]]}),{status:200});
        };
      })()`);
      try {
        await start(page);
        await waitFor(() => page.evaluate('document.getElementById("confirmDeletion").open'), 'Batch confirmation did not open');
        assert.equal(await page.evaluate('document.getElementById("confirmBatch").textContent.includes("remaining jobs will continue without another confirmation")'), true);
        assert.equal(await page.evaluate('document.getElementById("confirmDeletion").textContent.includes("synthetic-test-token")'), false);
        assert.equal(await page.evaluate('window.batchRemoved.size'), 0);
        await page.evaluate('document.getElementById("acceptDeletion").click()');
        await waitFor(() => page.evaluate('!document.getElementById("start").disabled'), 'Confirmed batch did not finish');
        assert.equal(await page.evaluate('window.batchRemoved.size'), 2);
        assert.equal(await page.evaluate('prompts.length-window.batchPromptCount'), 1);
        assert.equal(await page.evaluate('document.getElementById("summaryDeleted").textContent'), '2');
      } finally { await page.evaluate('window.fetch=window.batchOriginalFetch;window.manualConfirmation=false;'); }
      checks.push(`${browser}: custom batch confirmation blocks deletion until acceptance, warns about remaining targets and prompts once for two jobs`);

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
