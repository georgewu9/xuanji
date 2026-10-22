/* Functional smoke test through CDP. */
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
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
});
const send = (method, params = {}) => { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pending.set(id, { res, rej })); };
const js = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
const click = s => js(`(() => { const el = document.querySelector(${JSON.stringify(s)}); if (!el) return 'missing'; el.click(); return 'ok'; })()`);
const fill = (s, v) => js(`(() => { const el = document.querySelector(${JSON.stringify(s)}); if (!el) return 'missing'; el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return 'ok'; })()`);
const text = s => js(`document.querySelector(${JSON.stringify(s)})?.textContent.trim()`);
const attr = (s, a) => js(`document.querySelector(${JSON.stringify(s)})?.getAttribute(${JSON.stringify(a)})`);

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('  ok  ', name); }
  else { fail++; console.log('  FAIL', name, extra); }
};

await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'file://' + path.join(ROOT, 'index.html') });
await sleep(2500);
await click('.lang button[data-lang="en"]');
await sleep(300);

ok('intro visible', await js(`document.querySelector('#stage-intro').classList.contains('on')`));
ok('music embedded', (await js(`(window.XUANJI_BGM || '').length`)) > 100000);
ok('music control present', await js(`!!document.querySelector('#musicToggle')`));
await send('Runtime.evaluate', { expression: `document.querySelector('#introCta').click()`, userGesture: true });
await sleep(1800);
ok('music playing', await js(`window.Music && window.Music.isRunning()`));
ok('music context live', (await js(`window.Music.state()`)) === 'running', await js(`window.Music.state()`));
ok('dialogue visible', await js(`document.querySelector('#stage-dialogue').classList.contains('on')`));
await click('#askQ');
await sleep(200);
ok('name step question', (await text('#askQ')).includes('by what name'));

// step 1 -> date
await fill('#fName', 'Ada');
await click('#stepNext');
await sleep(500);
ok('date step', (await text('#askStep')).includes('2 of 5'));
ok('continue disabled on empty date', (await attr('#stepNext', 'disabled')) !== null);

await fill('#fDate', '2035-05-05');
await sleep(200);
ok('future date rejected', (await attr('#stepNext', 'disabled')) !== null);

await fill('#fDate', '1988-12-03');
await sleep(200);
ok('valid date accepted', (await attr('#stepNext', 'disabled')) === null);

// language switch mid flow keeps the value
await click('.lang button[data-lang="zh"]');
await sleep(500);
ok('switch to zh mid flow', (await text('#askQ')).includes('世界第一次'));
ok('date value retained', (await js(`document.querySelector('#fDate')?.value`)) === '1988-12-03');
await click('.lang button[data-lang="en"]');
await sleep(400);

await click('#stepNext');
await sleep(500);
await fill('#fTime', '07:45');
await click('#stepNext');
await sleep(500);
await click('[data-gender="male"]');
await click('#stepNext');
await sleep(500);
await fill('#fPlace', 'London');
await sleep(400);
ok('timezone auto-detected', (await js(`document.querySelector('#fTz')?.value`)) === 'Europe/London');
await click('#stepNext');
await sleep(700);
ok('confirm step shows London', (await text('#askCard')).includes('London'));

// back & edit
await click('[data-edit="gender"]');
await sleep(500);
ok('edit returns to gender step', (await text('#askStep')).includes('4 of 5'));
await click('#stepNext');
await sleep(500);
await click('#stepNext');
await sleep(700);
await click('#stepNext');
await sleep(6000);

ok('reading visible', await js(`document.querySelector('#stage-reading').classList.contains('on')`));
ok('eight pages built', (await js(`document.querySelectorAll('#pages .page').length`)) === 8);
ok('four summary verdicts', (await js(`document.querySelectorAll('.verdict').length`)) === 4);
ok('summary paragraph includes the body', (await js(`document.querySelector('.summary-text').textContent`)).toLowerCase().includes('in the body'));
ok('zodiac band has five cells', (await js(`document.querySelectorAll('.zodiac .z-cell').length`)) === 5);
ok('health page has five organs', (await js(`document.querySelectorAll('.organ-row').length`)) === 5);
ok('page 1 current', (await js(`document.querySelectorAll('#pages .page')[0].classList.contains('is-current')`)));
ok('chart has four pillars', (await js(`document.querySelectorAll('.pillar').length`)) === 4);

const EXPECTED = ['The Chart of Heaven', 'The Shape of You', 'The Body You Live In', 'Matters of the Heart',
  'The Flow of Abundance', 'The Turning of Cycles', 'A Gentle Word of Care', 'The Scroll of You'];
for (let i = 0; i < EXPECTED.length; i++) {
  await js(`document.querySelector('#rail .rail-dot[data-page="${i}"]').click()`);
  await sleep(320);
  const title = await text('.page.is-current .page-title');
  ok('title ' + (i + 1) + ': ' + EXPECTED[i], title === EXPECTED[i], title);
}
await js(`document.querySelector('#rail .rail-dot[data-page="0"]').click()`);
await sleep(320);

await click('#btnNext');
await sleep(700);
ok('page 2', (await js(`document.querySelectorAll('#pages .page')[1].classList.contains('is-current')`)));
await click('#btnPrev');
await sleep(700);
ok('page 1 after prev', (await js(`document.querySelectorAll('#pages .page')[0].classList.contains('is-current')`)));
ok('prev disabled on first', (await attr('#btnPrev', 'disabled')) !== null);

// jump to last
await js(`document.querySelector('#rail .rail-dot[data-page="7"]').click()`);
await sleep(800);
ok('last page', (await js(`document.querySelectorAll('#pages .page')[7].classList.contains('is-current')`)));
ok('next enabled on last', (await attr('#btnNext', 'disabled')) === null);
ok('next says ask the sky again', (await text('#btnNextLabel')).toLowerCase().includes('ask the sky again'));
await click('#btnNext');
await sleep(800);
ok('restart returns to intro', await js(`document.querySelector('#stage-intro').classList.contains('on')`));

// print styles present
ok('print stylesheet present', (await js(`Array.from(document.styleSheets).some(s => { try { return Array.from(s.cssRules).some(r => r.cssText.includes('@media print')); } catch(e){ return false; } })`)));

await sleep(300);
console.log(`\n${pass} passed, ${fail} failed`);
console.log('runtime errors:', errors.length ? errors : 'none');
ws.close();
process.exit(fail ? 1 : 0);
