/* Headless preview driver: screenshots the whole ritual flow via CDP. */
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.CDP_PORT || 9333;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOTS = path.join(ROOT, 'shots');
const URL_APP = 'file://' + path.join(ROOT, 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function wsUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) {}
    await sleep(250);
  }
  throw new Error('Chrome CDP not reachable on ' + PORT);
}

const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

let seq = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
  } else if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    errors.push(m.params.entry.text);
  }
});
const send = (method, params = {}) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => pending.set(id, { res, rej }));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: URL_APP });
await sleep(3200);

const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(data, 'base64'));
  console.log('shot', name);
};

const js = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

const click = async sel => {
  const ok = await js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'missing'; el.click(); return 'ok'; })()`);
  if (ok !== 'ok') throw new Error('click failed: ' + sel);
};
const fill = async (sel, value) => js(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return 'missing';
  el.value = ${JSON.stringify(value)};
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return 'ok';
})()`);

await click('.lang button[data-lang="en"]');
await sleep(700);
await shot('01-intro');

// begin
await click('#introCta');
await sleep(2200);
await shot('02-dialogue-name');

// name
await fill('#fName', 'Mira');
await sleep(300);
await click('#stepNext');
await sleep(1600);

// date
await fill('#fDate', '1990-06-15');
await sleep(600);
await shot('02b-dialogue-date');
await click('#stepNext');
await sleep(1400);

// time
await fill('#fTime', '14:30');
await sleep(600);
await shot('02c-dialogue-time');
await click('#stepNext');
await sleep(1400);

// gender
await click('[data-gender="female"]');
await sleep(400);
await shot('03-dialogue-gender');
await click('#stepNext');
await sleep(1400);

// place
await fill('#fPlace', 'Shanghai');
await sleep(500);
await shot('04-dialogue-place');
await click('#stepNext');
await sleep(1600);
await shot('05-confirm');

// cast
await click('#stepNext');
await sleep(900);
await shot('06-casting');
await sleep(5200);
await shot('07-chart');

const pages = ['08-self', '08b-health', '09-heart', '10-fortune', '11-cycles', '12-care', '13-scroll'];
for (const name of pages) {
  await click('#btnNext');
  await sleep(1700);
  await shot(name);
  if (name === '08b-health') {
    await js(`document.querySelector('#readingScroll').scrollTop = 520`);
    await sleep(600);
    await shot('08c-health-scrolled');
  }
}

// chart scrolled
await js(`document.querySelector('#rail .rail-dot[data-page="0"]').click()`);
await sleep(1200);
await js(`document.querySelector('#readingScroll').scrollTop = 560`);
await sleep(700);
await shot('18-chart-scrolled');

// language swap on the summary
await js(`document.querySelector('#rail .rail-dot[data-page="7"]').click()`);
await sleep(1200);
await click('.lang button[data-lang="zh"]');
await sleep(1200);
await shot('14-scroll-zh');

// health in Chinese
await js(`document.querySelector('#rail .rail-dot[data-page="2"]').click()`);
await sleep(1400);
await shot('14b-health-zh');

// back to chart in Chinese
await js(`document.querySelector('#rail .rail-dot[data-page="0"]').click()`);
await sleep(1400);
await shot('15-chart-zh');

// back to English, mobile view
await click('.lang button[data-lang="en"]');
await sleep(900);
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(700);
await js(`document.querySelector('#rail .rail-dot[data-page="0"]').click()`);
await sleep(1200);
await shot('16-chart-mobile');

await js(`document.querySelector('#rail .rail-dot[data-page="7"]').click()`);
await sleep(1400);
await shot('17-scroll-mobile');

console.log('errors:', errors.length ? errors : 'none');
ws.close();
process.exit(0);
