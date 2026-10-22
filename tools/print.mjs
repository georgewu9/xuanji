/* Print check: fills the flow and exports the reading to PDF via CDP. */
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
const js = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;
const click = s => js(`document.querySelector(${JSON.stringify(s)}).click()`);
const fill = (s, v) => js(`(() => { const el = document.querySelector(${JSON.stringify(s)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);

await send('Page.enable');
await send('Page.navigate', { url: 'file://' + path.join(ROOT, 'index.html') });
await sleep(2600);
await click('.lang button[data-lang="en"]');
await sleep(500);
await click('#introCta');
await sleep(1400);
await click('#stepNext');
await sleep(1200);
await fill('#fDate', '1990-06-15'); await sleep(200); await click('#stepNext');
await sleep(1000);
await fill('#fTime', '14:30'); await sleep(200); await click('#stepNext');
await sleep(1000);
await click('[data-gender="female"]'); await sleep(200); await click('#stepNext');
await sleep(1000);
await fill('#fPlace', 'Shanghai'); await sleep(400); await click('#stepNext');
await sleep(1200);
await click('#stepNext');
await sleep(6000);

const { data } = await send('Page.printToPDF', {
  printBackground: true,
  paperWidth: 8.27,
  paperHeight: 11.69,
  marginTop: 0.55,
  marginBottom: 0.55,
  marginLeft: 0.5,
  marginRight: 0.5,
  preferCSSPageSize: false
});
fs.writeFileSync(path.join(ROOT, 'shots', 'reading.pdf'), Buffer.from(data, 'base64'));
console.log('pdf written');
ws.close();
process.exit(0);
