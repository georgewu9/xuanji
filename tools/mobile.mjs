/* Mobile preview: intro + first question at 390×844. */
import fs from 'node:fs';
import path from 'node:path';

const PORT = 9333;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let seq = 0; const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
});
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pending.set(id, { res, rej })); };
const js = expr => send('Runtime.evaluate', { expression: expr, returnByValue: true }).then(r => r.result.value);
const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ROOT, 'shots', name + '.png'), Buffer.from(data, 'base64'));
  console.log('shot', name);
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: 'file://' + path.join(ROOT, 'index.html') });
await sleep(2800);
await js(`document.querySelector('.lang button[data-lang="en"]').click()`);
await sleep(500);
await shot('m1-intro');
await js(`document.querySelector('#introCta').click()`);
await sleep(2400);
await shot('m2-question');
await sleep(200);
console.log('scroll height', await js(`document.querySelector('#stage-dialogue').scrollHeight`), 'viewport', await js('innerHeight'));
ws.close();
process.exit(0);
