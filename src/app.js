/* ============================================================
   XUANJI · 玄机 — interface, ritual flow, reading screens
   ============================================================ */
(function () {
  'use strict';

  const X = window.Xuanji;
  const C = window.Content;
  const UI = C.UI;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const Music = window.Music || {
    isRunning: () => false, start() {}, stop() {}, onState() {}
  };
  let musicOn = true;
  try { musicOn = localStorage.getItem('xuanji-music') !== 'off'; } catch (e) {}

  const MSG = {
    errDate: { en: 'A date after 1900, if you please.', zh: '请输入 1900 年之后的出生日期。' },
    errTime: { en: 'Even an approximate hour will do.', zh: '请选择出生时间，大致即可。' },
    errPlace: { en: 'A city is enough — two letters or more.', zh: '写上城市即可，至少两个字。' }
  };

  const EL_COLOR = { wood: '#7fa06f', fire: '#c05a41', earth: '#b08d57', metal: '#c9cdd4', water: '#5a7f96' };
  const EL_COLOR_SOFT = { wood: '#9dbb8a', fire: '#d97a5c', earth: '#cba76e', metal: '#e2e6ea', water: '#7b9fb5' };

  /* ---------- state ---------- */

  const browserTz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  })();

  const state = {
    lang: 'en',
    stage: 'intro',
    step: 0,
    page: 0,
    chart: null,
    form: { name: '', date: '', time: '', gender: '', place: '', tz: browserTz }
  };

  const t = obj => (obj && obj[state.lang] !== undefined ? obj[state.lang] : obj);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- cities & time zones ---------- */

  const CITIES = {
    'new york': 'America/New_York', 'los angeles': 'America/Los_Angeles', chicago: 'America/Chicago',
    'san francisco': 'America/Los_Angeles', seattle: 'America/Los_Angeles', boston: 'America/New_York',
    washington: 'America/New_York', 'washington dc': 'America/New_York', miami: 'America/New_York',
    denver: 'America/Denver', phoenix: 'America/Phoenix', 'las vegas': 'America/Los_Angeles',
    houston: 'America/Chicago', dallas: 'America/Chicago', atlanta: 'America/New_York',
    portland: 'America/Los_Angeles', philadelphia: 'America/New_York', 'san diego': 'America/Los_Angeles',
    austin: 'America/Chicago', toronto: 'America/Toronto', vancouver: 'America/Vancouver',
    montreal: 'America/Toronto', calgary: 'America/Edmonton', 'mexico city': 'America/Mexico_City',
    london: 'Europe/London', manchester: 'Europe/London', dublin: 'Europe/Dublin', paris: 'Europe/Paris',
    berlin: 'Europe/Berlin', munich: 'Europe/Berlin', amsterdam: 'Europe/Amsterdam',
    brussels: 'Europe/Brussels', zurich: 'Europe/Zurich', geneva: 'Europe/Zurich', vienna: 'Europe/Vienna',
    prague: 'Europe/Prague', warsaw: 'Europe/Warsaw', stockholm: 'Europe/Stockholm', oslo: 'Europe/Oslo',
    copenhagen: 'Europe/Copenhagen', helsinki: 'Europe/Helsinki', madrid: 'Europe/Madrid',
    barcelona: 'Europe/Madrid', rome: 'Europe/Rome', milan: 'Europe/Rome', lisbon: 'Europe/Lisbon',
    athens: 'Europe/Athens', istanbul: 'Europe/Istanbul', moscow: 'Europe/Moscow',
    beijing: 'Asia/Shanghai', shanghai: 'Asia/Shanghai', guangzhou: 'Asia/Shanghai', shenzhen: 'Asia/Shanghai',
    chengdu: 'Asia/Shanghai', hangzhou: 'Asia/Shanghai', wuhan: 'Asia/Shanghai', 'xi an': 'Asia/Shanghai',
    xian: 'Asia/Shanghai', 'hong kong': 'Asia/Hong_Kong', taipei: 'Asia/Taipei', macau: 'Asia/Macau',
    tokyo: 'Asia/Tokyo', osaka: 'Asia/Tokyo', seoul: 'Asia/Seoul', singapore: 'Asia/Singapore',
    bangkok: 'Asia/Bangkok', 'kuala lumpur': 'Asia/Kuala_Lumpur', jakarta: 'Asia/Jakarta',
    manila: 'Asia/Manila', mumbai: 'Asia/Kolkata', delhi: 'Asia/Kolkata', dubai: 'Asia/Dubai',
    sydney: 'Australia/Sydney', melbourne: 'Australia/Melbourne', brisbane: 'Australia/Brisbane',
    perth: 'Australia/Perth', auckland: 'Pacific/Auckland', 'sao paulo': 'America/Sao_Paulo',
    'rio de janeiro': 'America/Sao_Paulo', 'buenos aires': 'America/Argentina/Buenos_Aires',
    santiago: 'America/Santiago', lima: 'America/Lima', bogota: 'America/Bogota', cairo: 'Africa/Cairo',
    lagos: 'Africa/Lagos', nairobi: 'Africa/Nairobi', johannesburg: 'Africa/Johannesburg',
    'cape town': 'Africa/Johannesburg'
  };

  const TZ_LIST = Array.from(new Set(Object.values(CITIES).concat([browserTz, 'UTC']))).sort();

  const cityNames = Object.keys(CITIES).map(k => k.replace(/\b\w/g, c => c.toUpperCase()));

  function matchCity(value) {
    const key = value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
    if (CITIES[key]) return CITIES[key];
    const hit = Object.keys(CITIES).find(k => k.startsWith(key) && key.length >= 3);
    return hit ? CITIES[hit] : null;
  }

  /* ---------- language ---------- */

  function setLang(lang, opts) {
    state.lang = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh' : 'en';
    try { localStorage.setItem('xuanji-lang', lang); } catch (e) {}
    $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    renderChrome();
    if (state.stage === 'dialogue') renderStep(true);
    if (state.stage === 'reading' && state.chart) {
      const page = state.page;
      const keepScroll = $('#readingScroll').scrollTop;
      buildPages();
      buildRail();
      goPage(page, true);
      $('#readingScroll').scrollTop = keepScroll;
      $('#pages').classList.add('lang-swap');
    }
    if (state.stage === 'casting') renderCastStatic();
  }

  function paintMusic(on) {
    const btn = $('#musicToggle');
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
    const word = t(on ? UI.music.on : UI.music.off);
    btn.setAttribute('aria-label', word);
    btn.title = word;
    const label = $('#musicLabel');
    if (label) label.textContent = t(UI.music.label);
  }

  function renderChrome() {
    $('#introEyebrow').textContent = t(UI.intro.eyebrow);
    $('#introTitle').textContent = t(UI.intro.title);
    $('#introSub').textContent = t(UI.intro.sub);
    $('#introMeta').textContent = t(UI.intro.meta);
    $('#introCtaLabel').textContent = t(UI.intro.cta);
    $('#introNote').textContent = t(UI.intro.scroll);
    $('#guideName').textContent = t(UI.guideName);
    $('#btnPrevLabel').textContent = t(UI.nav.prev);
    $('#btnNextLabel').textContent = t(UI.nav.next);
    $('#railLabel').textContent = t(UI.nav.chapters);
    $('#footerNote').textContent = t(UI.footer);
    $('#brandWord').innerHTML = state.lang === 'zh' ? '玄机 <em>XUANJI</em>' : 'XUANJI <em>玄机</em>';
    paintMusic(Music.isRunning());
  }

  /* ---------- star field ---------- */

  function initSky() {
    const canvas = $('#sky');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, stars = [], shoot = null, raf = 0;
    let mouseX = 0, mouseY = 0, tx = 0, ty = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(220, Math.round(w * h / 11000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.15 + 0.25,
        a: Math.random() * 0.55 + 0.12,
        tw: Math.random() * Math.PI * 2,
        tws: 0.004 + Math.random() * 0.012,
        depth: 0.2 + Math.random() * 0.8,
        hue: Math.random() < 0.14 ? 'gold' : 'white'
      }));
    }

    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      tx += (mouseX - tx) * 0.03;
      ty += (mouseY - ty) * 0.03;
      for (const s of stars) {
        s.tw += s.tws;
        const a = s.a * (0.62 + 0.38 * Math.sin(s.tw));
        const px = s.x + tx * 14 * s.depth;
        const py = s.y + ty * 14 * s.depth;
        ctx.beginPath();
        ctx.fillStyle = s.hue === 'gold'
          ? `rgba(224,196,140,${a})`
          : `rgba(226,228,236,${a})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.05) {
          ctx.beginPath();
          ctx.fillStyle = s.hue === 'gold' ? `rgba(200,165,106,${a * 0.12})` : `rgba(200,210,255,${a * 0.1})`;
          ctx.arc(px, py, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // a rare shooting star
      if (!shoot && Math.random() < 0.0016) {
        shoot = { x: Math.random() * w * 0.7 + w * 0.15, y: Math.random() * h * 0.4, vx: 2.6 + Math.random() * 1.8, vy: 1.1 + Math.random(), life: 1 };
      }
      if (shoot) {
        shoot.x += shoot.vx * 3.2; shoot.y += shoot.vy * 3.2; shoot.life -= 0.012;
        const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 60, shoot.y - shoot.vy * 60);
        g.addColorStop(0, `rgba(238,220,180,${Math.max(0, shoot.life) * 0.85})`);
        g.addColorStop(1, 'rgba(238,220,180,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y);
        ctx.lineTo(shoot.x - shoot.vx * 60, shoot.y - shoot.vy * 60); ctx.stroke();
        if (shoot.life <= 0 || shoot.x > w + 100) shoot = null;
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    if (!reduceMotion) raf = requestAnimationFrame(frame);
    else {
      // one static frame
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => { ctx.beginPath(); ctx.fillStyle = `rgba(226,228,236,${s.a})`; ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); });
    }
  }

  /* ---------- stages ---------- */

  function showStage(name) {
    state.stage = name;
    ['intro', 'dialogue', 'casting', 'reading'].forEach(k => {
      const el = document.getElementById('stage-' + k);
      if (el) el.classList.toggle('on', k === name);
    });
    document.body.dataset.stage = name;
  }

  function begin() {
    if (musicOn) Music.start();
    showStage('dialogue');
    state.step = 0;
    renderStep();
  }

  /* ---------- steps ---------- */

  const STEP_KEYS = ['name', 'date', 'time', 'gender', 'place', 'confirm'];

  function questionFor(key) {
    const q = {
      name: UI.name.q, date: UI.date.q, time: UI.time.q,
      gender: UI.gender.q, place: UI.place.q, confirm: UI.confirm.q
    }[key];
    return t(q);
  }

  let typingToken = 0;
  let currentQ = '';

  function typeText(el, text, speed) {
    currentQ = text;
    const token = ++typingToken;
    el.classList.remove('typed');
    if (reduceMotion) { el.textContent = text; return; }
    el.textContent = '';
    const orb = $('#dialogueOrb');
    orb && orb.classList.add('speaking');
    let i = 0;
    const tick = () => {
      if (token !== typingToken) return;
      i += 1;
      el.textContent = text.slice(0, i);
      if (i < text.length) {
        const ch = text[i - 1];
        const pause = /[.,;—:!?]/.test(ch) ? 5 : 1;
        setTimeout(tick, speed * pause);
      } else {
        orb && orb.classList.remove('speaking');
        el.classList.add('typed');
      }
    };
    setTimeout(tick, 260);
  }

  function finishTyping() {
    const el = $('#askQ');
    if (!el) return;
    if (el.textContent !== currentQ) {
      typingToken++;
      el.textContent = currentQ;
      el.classList.add('typed');
      const orb = $('#dialogueOrb');
      orb && orb.classList.remove('speaking');
    }
  }

  function stepDots() {
    return STEP_KEYS.slice(0, 5).map((k, i) => {
      const done = i < state.step;
      const now = i === state.step;
      return `<span class="sd ${done ? 'done' : ''} ${now ? 'now' : ''}"><i></i></span>`;
    }).join('');
  }

  function fieldHTML(key) {
    const f = state.form;
    if (key === 'name') {
      return `<div class="field">
        <input id="fName" class="inp inp-big" type="text" autocomplete="name" maxlength="40"
          value="${esc(f.name)}" placeholder="${esc(t(UI.name.ph))}" />
        <p class="field-hint">${esc(t(UI.name.hint))}</p>
      </div>`;
    }
    if (key === 'date') {
      return `<div class="field">
        <input id="fDate" class="inp inp-big" type="date" min="1900-01-01" max="${todayStr()}" value="${esc(f.date)}" />
        <p class="field-hint">${esc(t(UI.date.hint))}</p>
      </div>`;
    }
    if (key === 'time') {
      return `<div class="field">
        <input id="fTime" class="inp inp-big" type="time" value="${esc(f.time)}" />
        <p class="field-hint">${esc(t(UI.time.hint))}</p>
      </div>`;
    }
    if (key === 'gender') {
      return `<div class="gender">
        <button class="gender-card ${f.gender === 'female' ? 'sel' : ''}" data-gender="female">
          <span class="g-symbol">♀</span>
          <span class="g-label">${esc(t(UI.gender.f))}</span>
          <span class="g-sub">${esc(t(UI.gender.fSub))}</span>
        </button>
        <button class="gender-card ${f.gender === 'male' ? 'sel' : ''}" data-gender="male">
          <span class="g-symbol">♂</span>
          <span class="g-label">${esc(t(UI.gender.m))}</span>
          <span class="g-sub">${esc(t(UI.gender.mSub))}</span>
        </button>
      </div>`;
    }
    if (key === 'place') {
      const tz = f.tz || browserTz;
      return `<div class="field">
        <input id="fPlace" class="inp inp-big" type="text" list="cityList" autocomplete="off" maxlength="60"
          value="${esc(f.place)}" placeholder="${esc(t(UI.place.ph))}" />
        <datalist id="cityList">${cityNames.map(c => `<option value="${esc(c)}"></option>`).join('')}</datalist>
        <p class="field-hint">${esc(t(UI.place.hint))}</p>
        <div class="tz-row">
          <label for="fTz">${esc(t(UI.place.tz))}</label>
          <select id="fTz" class="tz-select">
            ${TZ_LIST.map(z => `<option value="${esc(z)}" ${z === tz ? 'selected' : ''}>${esc(z.replace(/_/g, ' '))}</option>`).join('')}
          </select>
        </div>
      </div>`;
    }
    if (key === 'confirm') {
      const f = state.form;
      const rows = [
        ['name', t(UI.confirm.labels.name), f.name.trim() || t(UI.confirm.labels.unnamed)],
        ['date', t(UI.confirm.labels.date), prettyDate(f.date)],
        ['time', t(UI.confirm.labels.time), prettyTime(f.time)],
        ['gender', t(UI.confirm.labels.gender), f.gender === 'female' ? t(UI.confirm.labels.female) : t(UI.confirm.labels.male)],
        ['place', t(UI.confirm.labels.place), f.place.trim()]
      ];
      return `<div class="confirm">
        <div class="confirm-rows">
          ${rows.map(([k, label, val]) => `<div class="crow">
            <span class="crow-k">${esc(label)}</span>
            <span class="crow-v">${esc(val)}</span>
            <button class="crow-edit" data-edit="${k}">${esc(t(UI.edit))}</button>
          </div>`).join('')}
        </div>
        <div class="confirm-tz">${esc(t(UI.place.tz))} · ${esc((f.tz || browserTz).replace(/_/g, ' '))}</div>
      </div>`;
    }
    return '';
  }

  function canProceed() {
    const f = state.form;
    if (state.step === 0) return true;
    if (state.step === 1) return !!f.date && f.date >= '1900-01-01' && f.date <= todayStr();
    if (state.step === 2) return !!f.time;
    if (state.step === 3) return !!f.gender;
    if (state.step === 4) return f.place.trim().length >= 2;
    return true;
  }

  function renderStep(instant) {
    const key = STEP_KEYS[state.step];
    const card = $('#askCard');
    card.classList.remove('leaving');

    $('#askStep').textContent = key === 'confirm' ? '' : t(UI.steps).replace('{n}', state.step + 1);
    $('#stepsDots').innerHTML = stepDots();
    $('#askField').innerHTML = fieldHTML(key);

    const actions = $('#askActions');
    const back = state.step > 0
      ? `<button class="btn btn-ghost" id="stepBack"><span class="arrow">←</span> ${esc(t(UI.back))}</button>`
      : `<span></span>`;
    const primaryLabel = key === 'confirm' ? t(UI.confirm.cast) : t(UI.next);
    const primaryClass = key === 'confirm' ? 'btn btn-solid' : 'btn btn-solid';
    actions.innerHTML = `${back}<button class="${primaryClass}" id="stepNext" ${canProceed() ? '' : 'disabled'}><span>${esc(primaryLabel)}</span><i class="arrow">→</i></button>`;

    const hintEl = $('#askHint');
    hintEl.textContent = key === 'name' ? '' : '';
    hintEl.style.display = key === 'name' ? 'none' : 'none';

    if (key === 'name') {
      const skip = document.createElement('button');
      skip.className = 'skip-link';
      skip.id = 'btnSkip';
      skip.textContent = t(UI.skip);
      $('#askField').appendChild(skip);
    }

    bindFields(key);
    if (instant) {
      typingToken++;
      $('#askQ').textContent = questionFor(key);
      $('#askQ').classList.add('typed');
    } else {
      typeText($('#askQ'), questionFor(key), 16);
    }
    card.classList.remove('in');
    void card.offsetWidth;
    card.classList.add('in');
    card.classList.toggle('is-confirm', key === 'confirm');

    setTimeout(() => {
      const inp = $('#askField input');
      if (inp && window.innerWidth > 760 && !instant) inp.focus({ preventScroll: true });
    }, 700);
  }

  function bindFields(key) {
    const next = $('#stepNext');
    const update = () => { if (next) next.disabled = !canProceed(); };

    if (key === 'name') {
      const inp = $('#fName');
      inp.addEventListener('input', () => { state.form.name = inp.value; });
    }
    if (key === 'date') {
      const inp = $('#fDate');
      inp.addEventListener('input', () => { state.form.date = inp.value; update(); });
      inp.addEventListener('change', () => { state.form.date = inp.value; update(); });
    }
    if (key === 'time') {
      const inp = $('#fTime');
      inp.addEventListener('input', () => { state.form.time = inp.value; update(); });
      inp.addEventListener('change', () => { state.form.time = inp.value; update(); });
    }
    if (key === 'gender') {
      $$('.gender-card').forEach(b => b.addEventListener('click', () => {
        state.form.gender = b.dataset.gender;
        $$('.gender-card').forEach(x => x.classList.toggle('sel', x === b));
        update();
      }));
    }
    if (key === 'place') {
      const inp = $('#fPlace');
      const sel = $('#fTz');
      inp.addEventListener('input', () => {
        state.form.place = inp.value;
        const tz = matchCity(inp.value);
        if (tz && sel.value !== tz) { state.form.tz = tz; sel.value = tz; }
        update();
      });
      sel.addEventListener('change', () => { state.form.tz = sel.value; });
    }
    if (key === 'confirm') {
      $$('[data-edit]').forEach(b => b.addEventListener('click', () => {
        state.step = STEP_KEYS.indexOf(b.dataset.edit);
        renderStep();
      }));
    }

    if (next) next.addEventListener('click', advance);
    const back = $('#stepBack');
    if (back) back.addEventListener('click', () => { state.step = Math.max(0, state.step - 1); renderStep(); });
    const skip = $('#btnSkip');
    if (skip) skip.addEventListener('click', () => { state.form.name = ''; advance(); });
  }

  function advance() {
    if (!canProceed()) {
      const card = $('#askCard');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
      return;
    }
    const key = STEP_KEYS[state.step];
    if (key === 'name') state.form.name = ($('#fName').value || '').trim();
    if (key === 'place') state.form.place = ($('#fPlace').value || '').trim();
    if (key === 'confirm') { cast(); return; }
    state.step++;
    renderStep();
  }

  /* ---------- casting ---------- */

  let castTimers = [];

  async function cast() {
    const f = state.form;
    const chart = X.buildChart({
      y: +f.date.slice(0, 4), m: +f.date.slice(5, 7), d: +f.date.slice(8, 10),
      h: +f.time.slice(0, 2), mi: +f.time.slice(3, 5),
      tz: f.tz || browserTz, gender: f.gender,
      name: f.name.trim(), place: f.place.trim()
    });
    state.chart = chart;
    buildPages();
    showStage('casting');
    renderCastStatic();
    castTimers.forEach(clearTimeout); castTimers = [];

    const lines = $('#castLines');
    lines.innerHTML = UI.casting.lines.map((l, i) =>
      `<p class="cast-line" data-i="${i}" style="--i:${i}">${esc(t(l))}</p>`).join('');
    $('#castTitle').textContent = t(UI.casting.title);

    await sleep(reduceMotion ? 200 : 500);
    const stepDelay = reduceMotion ? 180 : 820;
    for (let i = 0; i < UI.casting.lines.length; i++) {
      $$('.cast-line').forEach(l => l.classList.remove('active'));
      const el = $(`.cast-line[data-i="${i}"]`);
      if (el) el.classList.add('on', 'active');
      $('#castBar').style.width = `${((i + 1) / (UI.casting.lines.length + 1)) * 100}%`;
      await sleep(stepDelay);
    }
    const done = document.createElement('p');
    done.className = 'cast-done';
    done.textContent = t(UI.casting.done);
    lines.appendChild(done);
    $('#castBar').style.width = '100%';
    await sleep(reduceMotion ? 200 : 700);
    enterReading();
  }

  function renderCastStatic() {
    if (!state.chart) return;
    $('#castTitle').textContent = t(UI.casting.title);
  }

  function enterReading() {
    showStage('reading');
    buildRail();
    goPage(0, true);
  }

  /* ---------- reading shell ---------- */

  function buildRail() {
    $('#rail').innerHTML = UI.chapters.map((c, i) =>
      `<button class="rail-dot" data-page="${i}" aria-label="${esc(t(c.label))}">
        <span class="rd-num">${pad(i + 1)}</span>
        <span class="rd-label">${esc(t(c.label))}</span>
      </button>`).join('');
    $$('#rail .rail-dot').forEach(b => b.addEventListener('click', () => goPage(+b.dataset.page)));
  }

  function goPage(i, instant) {
    if (!state.chart) return;
    const total = UI.chapters.length;
    i = Math.max(0, Math.min(total - 1, i));
    state.page = i;
    const scroll = $('#readingScroll');
    $('#pages').classList.remove('lang-swap');
    const apply = () => {
      $$('#pages .page').forEach((p, idx) => p.classList.toggle('is-current', idx === i));
      scroll.scrollTop = 0;
      $('#rhCount').textContent = `${pad(i + 1)} / ${pad(total)}`;
      $('#rhEyebrow').textContent = t(UI.chapters[i].label);
      $$('#rail .rail-dot').forEach((b, idx) => b.classList.toggle('on', idx === i));
      $('#btnPrev').disabled = i === 0;
      $('#btnNext').disabled = false;
      $('#btnNextLabel').textContent = i === total - 1 ? t(UI.scroll.restart) : t(UI.nav.next);
      $('#footBar').style.width = `${((i + 1) / total) * 100}%`;
      scroll.classList.remove('fading');
    };
    if (instant || reduceMotion) { apply(); return; }
    scroll.classList.add('fading');
    setTimeout(apply, 240);
  }

  function buildPages() {
    const chart = state.chart;
    $('#pages').innerHTML = [
      pageChart(chart), pageSelf(chart), pageHealth(chart), pageHeart(chart), pageFortune(chart),
      pageCycles(chart), pageCare(chart), pageScroll(chart)
    ].join('');
    $$('#pages [data-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'restart') restart();
      if (act === 'print') window.print();
      if (act === 'top') goPage(0);
    }));
  }

  function head(i, lede, meta) {
    return `<header class="page-head">
      <p class="eyebrow reveal" style="--i:0">${esc(t(PAGE_EYEBROWS[i]))}</p>
      <h2 class="page-title reveal" style="--i:1">${esc(t(PAGE_TITLES[i]))}</h2>
      <p class="page-lede reveal" style="--i:2">${lede}</p>
      ${meta ? `<p class="page-meta reveal" style="--i:3">${meta}</p>` : ''}
    </header>`;
  }

  const PAGE_TITLES = [
    UI.chart.title, UI.self.title, UI.health.title, UI.heart.title, UI.fortune.title,
    UI.cycles.title, UI.care.title, UI.scroll.title
  ];

  const PAGE_EYEBROWS = [
    UI.chart.eyebrow, UI.self.eyebrow, UI.health.eyebrow, UI.heart.eyebrow, UI.fortune.eyebrow,
    UI.cycles.eyebrow, UI.care.eyebrow, UI.scroll.eyebrow
  ];

  /* ---------- page I: the chart ---------- */

  function pageChart(chart) {
    const lang = state.lang;
    const dm = C.dmOf(chart);
    const dmEl = C.elOf(chart.dayMaster.element);
    const C0 = 2 * Math.PI * 70;
    let off = 0;
    const segs = chart.pct.map((v, i) => {
      const len = Math.max((v / 100) * C0 - 4, 1.5);
      const seg = `<circle class="ring-seg" cx="90" cy="90" r="70"
        style="--len:${len.toFixed(2)};stroke:${EL_COLOR[X.ELEMENTS[i]]};animation-delay:${0.45 + i * 0.09}s"
        stroke-dasharray="${len.toFixed(2)} 999" stroke-dashoffset="${(-off).toFixed(2)}" />`;
      off += (v / 100) * C0;
      return seg;
    }).join('');

    const pillars = chart.pillars.map((p, i) => {
      const god = i === 2 ? null : C.GOD[X.tenGod(chart.pillars[2].stem, p.stem)];
      const el = C.elOf(Math.floor(p.stem / 2));
      const stemLine = state.lang === 'en'
        ? `${p.stem % 2 === 0 ? 'Yang' : 'Yin'} ${el.name.en} · ${X.ANIMALS[p.branch]}`
        : `${p.stem % 2 === 0 ? '阳' : '阴'}${el.zh} · ${X.ANIMALS_ZH[p.branch]}`;
      return `<div class="pillar ${i === 2 ? 'is-self' : ''}" style="--i:${i + 2}">
        <span class="p-label">${esc(t(UI.chart[p.key]))}<em>${esc(state.lang === 'en' ? UI.chart[p.key].zh : UI.chart[p.key].en)}</em></span>
        <span class="p-char" style="--el:${EL_COLOR[el.key]}">${X.STEMS[p.stem]}</span>
        <span class="p-char p-branch" style="--el:${EL_COLOR[C.elOf(X.BRANCH_ELEMENT[p.branch]).key]}">${X.BRANCHES[p.branch]}</span>
        <span class="p-py">${esc(stemLine)}</span>
        <span class="p-god">${i === 2 ? esc(t(UI.chart.self)) + ' · ' + (state.lang === 'en' ? '日主' : 'Self') : esc(t(god.name)) + ' · ' + god.zh}</span>
        ${i === 2 ? '<span class="p-glow"></span>' : ''}
      </div>`;
    }).join('');

    const legend = chart.pct.map((v, i) => {
      const el = C.elOf(i);
      return `<div class="el-row" style="--i:${i + 5}">
        <span class="el-dot" style="background:${EL_COLOR[el.key]}"></span>
        <span class="el-name">${esc(el.name[lang])}<em>${el.zh}</em></span>
        <span class="el-bar"><i style="--w:${v}%;background:linear-gradient(90deg,${EL_COLOR[el.key]}55,${EL_COLOR[el.key]})"></i></span>
        <span class="el-val">${v}%</span>
      </div>`;
    }).join('');

    const born = t(UI.chart.born)
      .replace('{date}', C.formatDate(chart, lang))
      .replace('{time}', C.formatTime(chart, lang))
      .replace('{place}', esc(chart.input.place) || (lang === 'en' ? 'unknown ground' : '未记之地'));

    const z = C.zodiac(chart, lang);
    const zodiacBand = `<section class="zodiac reveal" style="--i:6">
      <div class="z-cell z-self">
        <span class="z-k">${esc(t(UI.zodiacPanel.yourSign))}</span>
        <span class="z-pair"><b>${z.animal.zh}</b> ${esc(z.animal.en)}</span>
        <span class="z-note">${esc(t(UI.zodiacPanel.yearOf).replace('{animal}', lang === 'en' ? z.animal.en : z.animal.zh))}</span>
      </div>
      ${z.groups.map(g => `<div class="z-cell z-${g.key}">
        <span class="z-k">${esc(g.label)}</span>
        <span class="z-pair">${g.animals.map(a => `<b>${a.zh}</b> ${esc(a.en)}`).join('<i>·</i>')}</span>
        <span class="z-note">${esc(g.note)}</span>
      </div>`).join('')}
    </section>`;

    return `<article class="page page-chart">
      <div class="page-inner">
        ${head(0, esc(t(UI.chart.lede)).replace('{name}', esc(C.displayName(chart, lang))), esc(born))}
        <div class="pillars">${pillars}</div>
        <div class="chart-split">
          <section class="panel dm-panel reveal" style="--i:8">
            <p class="panel-k">${esc(t(UI.chart.dayMaster))}</p>
            <div class="dm-head">
              <span class="dm-char" style="--el:${EL_COLOR[dmEl.key]}">${X.STEMS[chart.dayMaster.stem]}</span>
              <div>
                <h3 class="dm-name">${esc(dm.name[lang])} <span>${esc(dm.epithet[lang])}</span></h3>
                <p class="dm-py">${X.STEM_PY[chart.dayMaster.stem]} · ${dmEl.name[lang]} · ${chart.dayMaster.strength === 'strong' ? (lang === 'en' ? 'strong' : '偏旺') : chart.dayMaster.strength === 'weak' ? (lang === 'en' ? 'light' : '偏弱') : (lang === 'en' ? 'balanced' : '中和')}</p>
              </div>
            </div>
            <p class="dm-essence">“${esc(dm.essence[lang])}”</p>
            <p class="body-text">${esc(t(UI.chart.strength[chart.dayMaster.strength]))}</p>
            <p class="body-text muted">${esc(t(UI.chart.dayMasterNote))}</p>
            <p class="season-line"><i></i>${esc(t(UI.chart.season).replace('{season}', chart.season[lang]).replace('{element}', C.elOf(chart.season.element).name[lang]).replace('{zh}', C.elOf(chart.season.element).zh))}</p>
          </section>
          <section class="panel el-panel reveal" style="--i:9">
            <p class="panel-k">${esc(t(UI.chart.balance))}</p>
            <div class="el-wrap">
              <svg class="el-ring" viewBox="0 0 180 180" aria-hidden="true">
                <circle cx="90" cy="90" r="70" class="ring-track"/>
                <g transform="rotate(-90 90 90)">${segs}</g>
                <text x="90" y="86" class="ring-char">${X.STEMS[chart.dayMaster.stem]}</text>
                <text x="90" y="108" class="ring-sub">${esc(dmEl.zh)} · ${esc(dmEl.name[lang])}</text>
              </svg>
              <div class="el-legend">${legend}</div>
            </div>
            <p class="body-text muted small">${esc(t(UI.chart.balanceNote))}</p>
          </section>
        </div>
        ${zodiacBand}
        <p class="zodiac-foot">${esc(t(UI.zodiacPanel.note))}</p>
      </div>
    </article>`;
  }

  /* ---------- page II: self ---------- */

  function pageSelf(chart) {
    const p = C.personality(chart, state.lang);
    return `<article class="page">
      <div class="page-inner">
        ${head(1, esc(t(UI.self.lede)))}
        <div class="self-hero reveal" style="--i:4">
          <p class="self-epithet">${esc(p.dm.epithet)}<span>${esc(p.dm.name)} · ${esc(p.dm.pinyin)}</span></p>
          <p class="self-essence">“${esc(p.dm.essence)}”</p>
          <div class="chips">${p.traits.map((x, i) => `<span class="chip" style="--i:${i}">${esc(x)}</span>`).join('')}</div>
        </div>
        <div class="grid-2">
          <section class="panel reveal" style="--i:5">
            <p class="panel-k">${esc(t(UI.self.core))}</p>
            <p class="body-text lead-in">${esc(p.dm.body)}</p>
            <p class="soft-line">${esc(p.strength)}</p>
          </section>
          <div class="stack">
            <section class="panel reveal" style="--i:6">
              <p class="panel-k">${esc(t(UI.self.weather))}</p>
              <h3 class="panel-h">${esc(p.weather.title)}</h3>
              <p class="body-text">${esc(p.weather.strong)}</p>
              <p class="body-text">${esc(p.weather.weak)}</p>
            </section>
            <section class="panel reveal" style="--i:7">
              <p class="panel-k">${esc(t(UI.self.others))}</p>
              <h3 class="panel-h">${esc(p.social.name)}</h3>
              <p class="body-text">${esc(p.social.text)}</p>
            </section>
          </div>
        </div>
        <p class="chapter-rule reveal" style="--i:8"><span>${esc(t(UI.self.traits))}</span></p>
      </div>
    </article>`;
  }

  /* ---------- page III: health ---------- */

  function pageHealth(chart) {
    const h = C.health(chart, state.lang);
    return `<article class="page">
      <div class="page-inner">
        ${head(2, esc(t(UI.health.lede)))}
        <section class="panel health-hero reveal" style="--i:4">
          <p class="panel-k">${esc(t(UI.health.constitution))}</p>
          <p class="body-text lead-in">${esc(h.constitution)}</p>
          <p class="season-line"><i></i>${esc(h.season)}</p>
        </section>
        <section class="panel reveal" style="--i:5">
          <div class="health-head">
            <p class="panel-k">${esc(t(UI.health.organs))}</p>
            <p class="health-note">${esc(h.note)}</p>
          </div>
          <div class="organ-list">
            ${h.organs.map((o, i) => `<div class="organ-row" data-state="${o.state}" style="--i:${i}">
              <span class="el-dot" style="background:${EL_COLOR[o.key]}"></span>
              <span class="organ-el">${esc(o.name)}${state.lang === 'en' ? `<em>${esc(o.zh)}</em>` : ''}</span>
              <span class="organ-desc">${esc(o.organ)}</span>
              <span class="organ-state">${esc(o.stateLabel)}</span>
              <span class="organ-bar"><i style="--w:${o.pct}%;background:${EL_COLOR[o.key]}"></i></span>
              <span class="organ-pct">${o.pct}%</span>
            </div>`).join('')}
          </div>
        </section>
        <div class="grid-2 health-watch">
          ${h.watch.map((w, i) => `<section class="panel watch-card reveal" style="--i:${6 + i}">
            <p class="panel-k">${esc(w.label)}</p>
            <h3 class="panel-h">${esc(w.title)}</h3>
            <p class="body-text">${esc(w.body)}</p>
          </section>`).join('')}
        </div>
        <section class="panel reveal" style="--i:8">
          <p class="panel-k">${esc(t(UI.health.practice))}</p>
          <div class="daily-care">
            ${h.care.map((c, i) => `<div class="daily-item" style="--i:${i}">
              <span class="daily-k">${esc(c.k)}</span>
              <p>${esc(c.text)}</p>
            </div>`).join('')}
          </div>
        </section>
        <p class="health-disclaimer reveal" style="--i:9">${esc(h.disclaimer)}</p>
      </div>
    </article>`;
  }

  /* ---------- page IV: heart ---------- */

  function pageHeart(chart) {
    const l = C.love(chart, state.lang);
    return `<article class="page">
      <div class="page-inner">
        ${head(3, esc(t(UI.heart.lede)))}
        <div class="grid-2 heart-grid">
          <section class="panel big reveal" style="--i:4">
            <p class="panel-k">01 · ${esc(t(UI.heart.how))}</p>
            <p class="body-text lead-in">${esc(l.how)}</p>
          </section>
          <section class="panel big reveal" style="--i:5">
            <p class="panel-k">02 · ${esc(t(UI.heart.need))}</p>
            <p class="body-text lead-in">${esc(l.need)}</p>
          </section>
          <section class="panel big reveal" style="--i:6">
            <p class="panel-k">03 · ${esc(t(UI.heart.friction))}</p>
            <p class="body-text lead-in">${esc(l.friction)}</p>
          </section>
          <section class="panel big reveal" style="--i:7">
            <p class="panel-k">04 · ${esc(t(UI.heart.partner))}</p>
            <p class="body-text">${esc(l.partner)}</p>
            ${l.peach ? `<p class="peach"><span>桃花</span>${esc(t(UI.heart.peach))}</p>` : ''}
          </section>
        </div>
        <section class="panel band reveal" style="--i:8">
          <p class="band-mark">缘</p>
          <p class="body-text">${esc(l.starText)}</p>
        </section>
      </div>
    </article>`;
  }

  /* ---------- page IV: fortune ---------- */

  function pageFortune(chart) {
    const w = C.wealth(chart, state.lang);
    return `<article class="page">
      <div class="page-inner">
        ${head(4, esc(t(UI.fortune.lede)))}
        <section class="panel wide reveal" style="--i:4">
          <div class="fortune-top">
            <p class="panel-k">${esc(t(UI.fortune.temper))}</p>
            <span class="wealth-seal">财</span>
          </div>
          <p class="body-text lead-in">${esc(w.temper)}</p>
        </section>
        <div class="grid-2">
          <section class="panel reveal" style="--i:5">
            <p class="panel-k">${esc(t(UI.fortune.source))}</p>
            <p class="body-text">${esc(cap(w.short))}</p>
            <p class="fields-label">${esc(t(UI.fortune.fields))}</p>
            <div class="chips chips-start">${w.fields.map((f, i) => `<span class="chip chip-line" style="--i:${i}">${esc(f)}</span>`).join('')}</div>
          </section>
          <section class="panel reveal leak-panel" style="--i:6">
            <p class="panel-k">${esc(t(UI.fortune.leak))}</p>
            <p class="body-text">${esc(w.leak)}</p>
            <div class="mini-rule"></div>
            <p class="body-text muted small">${esc(t(UI.fortune.note))}</p>
          </section>
        </div>
      </div>
    </article>`;
  }

  /* ---------- page V: cycles ---------- */

  function pageCycles(chart) {
    const c = C.cycles(chart, state.lang);
    const lang = state.lang;
    const idx = chart.luck.index;
    return `<article class="page">
      <div class="page-inner">
        ${head(5, esc(t(UI.cycles.lede)), esc(t(UI.cycles.startAge).replace('{age}', c.startAge)))}
        <div class="luck-wrap reveal" style="--i:4">
          <div class="luck-track">
            ${chart.luck.list.map((l, i) => `<div class="luck ${i === idx ? 'now' : ''}" style="--i:${i}">
              <span class="luck-age">${Math.round(l.from)}<i>–</i>${Math.round(l.to)}</span>
              <span class="luck-pillar">${X.STEMS[l.stem]}${X.BRANCHES[l.branch]}</span>
              <span class="luck-py">${X.STEM_PY[l.stem]}-${X.BRANCH_PY[l.branch]}</span>
              ${i === idx ? `<span class="luck-now">${esc(t(UI.cycles.now))}</span>` : ''}
            </div>`).join('')}
          </div>

        </div>
        <section class="panel wide reveal tide-panel" style="--i:5">
          <p class="panel-k">${esc(t(UI.cycles.current))}</p>
          <p class="body-text lead-in">${esc(c.currentText)}</p>
        </section>
        <section class="years reveal" style="--i:6">
          <p class="panel-k years-k">${esc(t(UI.cycles.years))}</p>
          ${c.years.map((y, i) => `<div class="year-row" style="--i:${i}" data-clash="${y.clash ? '1' : '0'}">
            <span class="year-num">${y.year}</span>
            <span class="year-pillar">${X.STEMS[y.stem]}${X.BRANCHES[y.branch]}<em>${X.STEM_PY[y.stem]}-${X.BRANCH_PY[y.branch]}</em></span>
            <span class="year-age">${y.age} ${lang === 'en' ? 'yrs' : '岁'}</span>
            <span class="year-note">${esc(y.note)}</span>
          </div>`).join('')}
        </section>
      </div>
    </article>`;
  }

  /* ---------- page VI: care ---------- */

  function pageCare(chart) {
    const list = C.cautions(chart, state.lang);
    return `<article class="page">
      <div class="page-inner">
        ${head(6, esc(t(UI.care.lede)))}
        <div class="care-grid">
          ${list.map((c, i) => `<section class="panel care-card reveal" style="--i:${i + 4}">
            <span class="care-num">${pad(i + 1)}</span>
            <h3 class="care-title">${esc(c.title)}</h3>
            <p class="body-text">${esc(c.body)}</p>
            <div class="care-practice">
              <span class="cp-k">${esc(t(UI.care.practice))}</span>
              <p>${esc(state.lang === 'en' ? cap(c.practice) + (/[.!?]$/.test(c.practice) ? '' : '.') : c.practice)}</p>
            </div>
          </section>`).join('')}
        </div>
        <p class="care-close reveal" style="--i:8">“${esc(t(UI.care.close))}”</p>
      </div>
    </article>`;
  }

  /* ---------- page VII: the scroll ---------- */

  function pageScroll(chart) {
    const s = C.summary(chart, state.lang);
    const lang = state.lang;
    return `<article class="page page-scroll">
      <div class="page-inner">
        ${head(7, esc(t(UI.scroll.lede)))}
        <section class="summary-band reveal" style="--i:4">
          <p class="summary-text">${esc(s.paragraph)}</p>
          <div class="summary-seal"><span>命</span><span>书</span></div>
        </section>
        <div class="verdicts">
          ${[['character', t(UI.scroll.character), '性'], ['love', t(UI.scroll.love), '缘'], ['wealth', t(UI.scroll.wealth), '财'], ['health', t(UI.scroll.health), '身']].map(([k, label, glyph], i) => `<section class="verdict reveal" style="--i:${i + 5}">
            <span class="v-glyph">${glyph}</span>
            <p class="v-k">${esc(label)}</p>
            <p class="v-text">${esc(s.verdicts[k])}</p>
          </section>`).join('')}
        </div>
        <section class="keep reveal" style="--i:8">
          <p class="panel-k">${esc(t(UI.scroll.keep))}</p>
          <div class="keep-grid">
            <div class="keep-item">
              <span class="keep-k">${esc(t(UI.scroll.colors))}</span>
              <div class="swatches">${s.keep.colors.map(c => `<span class="swatch" style="--c:${c.hex}" title="${esc(c[lang])}"><i></i>${esc(c[lang])}</span>`).join('')}</div>
            </div>
            <div class="keep-item"><span class="keep-k">${esc(t(UI.scroll.direction))}</span><span class="keep-v">${esc(s.keep.direction)}</span></div>
            <div class="keep-item"><span class="keep-k">${esc(t(UI.scroll.numbers))}</span><span class="keep-v">${esc(s.keep.numbers)}</span></div>
            <div class="keep-item"><span class="keep-k">${esc(t(UI.scroll.element))}</span><span class="keep-v">${esc(s.keep.element)}</span></div>
          </div>
        </section>
        <p class="mantra reveal" style="--i:9">“${esc(s.mantra)}”</p>
        <p class="scroll-end reveal" style="--i:10">${esc(t(UI.scroll.end))}</p>
        <div class="scroll-actions reveal" style="--i:11">
          <button class="btn btn-ghost" data-act="restart"><span>${esc(t(UI.nav.restart))}</span></button>
          <button class="btn btn-ghost" data-act="print"><span>${esc(t(UI.scroll.print))}</span></button>
        </div>
      </div>
    </article>`;
  }

  /* ---------- chrome wiring ---------- */

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function prettyDate(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-').map(Number);
    if (state.lang === 'zh') return `${y}年${m}月${d}日`;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[m - 1]} ${d}, ${y}`;
  }

  function prettyTime(str) {
    if (!str) return '';
    const [h, mi] = str.split(':').map(Number);
    if (state.lang === 'zh') {
      const branch = X.BRANCHES[X.mod(h + 1, 24) >> 1];
      return `${pad(h)}:${pad(mi)} · ${branch}时`;
    }
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad(mi)} ${ampm}`;
  }

  function restart() {
    state.chart = null;
    state.page = 0;
    state.step = 0;
    state.form = { name: '', date: '', time: '', gender: '', place: '', tz: browserTz };
    showStage('intro');
  }

  function init() {
    let stored = null;
    try { stored = localStorage.getItem('xuanji-lang'); } catch (e) {}
    const nav = (navigator.language || 'en').toLowerCase();
    state.lang = stored || (nav.indexOf('zh') === 0 ? 'zh' : 'en');
    document.documentElement.lang = state.lang === 'zh' ? 'zh' : 'en';
    $$('.lang button').forEach(b => {
      b.classList.toggle('on', b.dataset.lang === state.lang);
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    initSky();
    renderChrome();

    if (window.Music) {
      Music.onState(paintMusic);
      const musicBtn = $('#musicToggle');
      if (musicBtn) {
        musicBtn.addEventListener('click', () => {
          musicOn = !Music.isRunning();
          try { localStorage.setItem('xuanji-music', musicOn ? 'on' : 'off'); } catch (e) {}
          if (musicOn) Music.start(); else Music.stop();
        });
      }
      document.addEventListener('pointerdown', e => {
        if (e.target.closest && e.target.closest('#musicToggle')) return;
        if (musicOn) Music.start();
      });
    } else {
      const musicBtn = $('#musicToggle');
      if (musicBtn) musicBtn.style.display = 'none';
    }

    $('#introCta').addEventListener('click', begin);
    $('#askQ').addEventListener('click', finishTyping);

    $('#btnPrev').addEventListener('click', () => goPage(state.page - 1));
    $('#btnNext').addEventListener('click', () => {
      if (state.page === UI.chapters.length - 1) restart();
      else goPage(state.page + 1);
    });

    document.addEventListener('keydown', e => {
      if (state.stage === 'dialogue' && e.key === 'Enter') {
      e.preventDefault();
      finishTyping();
      advance();
      return;
    }
    if (state.stage !== 'reading') return;
      if (e.key === 'ArrowRight') goPage(state.page + 1);
      if (e.key === 'ArrowLeft') goPage(state.page - 1);
      if (e.key === 'Escape') restart();
    });

    // swipe
    let sx = 0, sy = 0;
    const scroll = $('#readingScroll');
    scroll.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    scroll.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        goPage(state.page + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
