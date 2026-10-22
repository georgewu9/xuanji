/* Variant flow: unnamed user, different chart, verifies three-caution layout. */
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
});
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pending.set(id, { res, rej })); };
const js = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const click = s => js(`document.querySelector(${JSON.stringify(s)}).click()`);
const fill = (s, v) => js(`(() => { const el = document.querySelector(${JSON.stringify(s)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); })()`);
const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'shots', name + '.png'), Buffer.from(data, 'base64'));
  console.log('shot', name);
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'file://' + path.join(ROOT, 'index.html') });
await sleep(2600);
await click('.lang button[data-lang="en"]');
await sleep(400);
await click('#introCta');
await sleep(1500);
await click('#btnSkip');           // remain unnamed
await sleep(900);
await fill('#fDate', '1987-06-10'); await sleep(250); await click('#stepNext');
await sleep(900);
await fill('#fTime', '15:59'); await sleep(250); await click('#stepNext');
await sleep(900);
await click('[data-gender="male"]'); await sleep(200); await click('#stepNext');
await sleep(900);
await fill('#fPlace', 'Boston'); await sleep(400); await click('#stepNext');
await sleep(1200);
await click('#stepNext');
await sleep(6000);
await shot('v1-chart');

for (const [idx, name] of [[1, 'v2-self'], [2, 'v3-heart'], [3, 'v4-fortune'], [5, 'v5-care']]) {
  await js(`document.querySelector('#rail .rail-dot[data-page="${idx}"]').click()`);
  await sleep(1600);
  await shot(name);
}
console.log('errors:', errors.length ? errors : 'none');
ws.close();
process.exit(0);
