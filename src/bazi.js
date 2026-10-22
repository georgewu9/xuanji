/* ============================================================
   XUANJI · 玄机 — Four Pillars engine
   Astronomy: apparent solar longitude (Meeus, low precision)
   Calendar: sexagenary day cycle, solar-term month/year boundaries
   ============================================================ */
(function (global) {
  'use strict';

  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const STEM_PY = ['Jiǎ', 'Yǐ', 'Bǐng', 'Dīng', 'Wù', 'Jǐ', 'Gēng', 'Xīn', 'Rén', 'Guǐ'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const BRANCH_PY = ['Zǐ', 'Chǒu', 'Yín', 'Mǎo', 'Chén', 'Sì', 'Wǔ', 'Wèi', 'Shēn', 'Yǒu', 'Xū', 'Hài'];
  const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const ANIMALS_ZH = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

  const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'];
  const ELEMENT_ZH = ['木', '火', '土', '金', '水'];

  // hidden stems (藏干) for each earthly branch, strongest first
  const HIDDEN = [
    [9],            // 子 癸
    [5, 9, 7],      // 丑 己 癸 辛
    [0, 2, 4],      // 寅 甲 丙 戊
    [1],            // 卯 乙
    [4, 1, 9],      // 辰 戊 乙 癸
    [2, 6, 4],      // 巳 丙 庚 戊
    [3, 5],         // 午 丁 己
    [5, 3, 1],      // 未 己 丁 乙
    [6, 8, 4],      // 申 庚 壬 戊
    [7],            // 酉 辛
    [4, 7, 3],      // 戌 戊 辛 丁
    [8, 0]          // 亥 壬 甲
  ];

  const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

  const GEN = [1, 2, 3, 4, 0];                 // element i generates
  const CTRL = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 }; // element i controls

  const TEN_GOD_KEYS = ['friend', 'rival', 'output', 'expression', 'indirectWealth', 'directWealth', 'sevenKill', 'directOfficer', 'indirectResource', 'directResource'];

  const SEASON = {
    0: { element: 4, en: 'deep winter', zh: '寒冬' },
    1: { element: 2, en: 'late winter', zh: '残冬' },
    2: { element: 0, en: 'early spring', zh: '初春' },
    3: { element: 0, en: 'high spring', zh: '仲春' },
    4: { element: 2, en: 'the turn of spring', zh: '暮春' },
    5: { element: 1, en: 'early summer', zh: '初夏' },
    6: { element: 1, en: 'high summer', zh: '盛夏' },
    7: { element: 2, en: 'late summer', zh: '长夏' },
    8: { element: 3, en: 'early autumn', zh: '初秋' },
    9: { element: 3, en: 'high autumn', zh: '仲秋' },
    10: { element: 2, en: 'late autumn', zh: '深秋' },
    11: { element: 4, en: 'early winter', zh: '初冬' }
  };

  const mod = (n, m) => ((n % m) + m) % m;

  /* ---------- astronomy ---------- */

  function julianDay(ms) {
    return ms / 86400000 + 2440587.5;
  }

  function solarLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
      0.000289 * Math.sin(3 * M);
    const omega = (125.04 - 1934.136 * T) * Math.PI / 180;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
    return mod(lambda, 360);
  }

  // 0 = 寅 month (from 立春), ... 11 = 丑 month
  function monthIndexAt(jd) {
    return Math.floor(mod(solarLongitude(jd) - 315, 360) / 30);
  }

  // first moment the month-sector changes, walking in direction dir (+1 / -1)
  function termBoundary(jd, dir) {
    const start = monthIndexAt(jd);
    let prev = jd;
    for (let i = 1; i <= 45; i++) {
      const probe = jd + dir * i;
      if (monthIndexAt(probe) !== start) {
        let lo = prev, hi = probe;
        for (let k = 0; k < 42; k++) {
          const mid = (lo + hi) / 2;
          if (monthIndexAt(mid) === start) lo = mid; else hi = mid;
        }
        return (lo + hi) / 2;
      }
      prev = probe;
    }
    return null;
  }

  /* ---------- time zones ---------- */

  function tzOffsetMinutes(tz, date) {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const p = {};
      dtf.formatToParts(date).forEach(x => { if (x.type !== 'literal') p[x.type] = x.value; });
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return Math.round((asUTC - date.getTime()) / 60000);
    } catch (e) {
      return -date.getTimezoneOffset();
    }
  }

  function wallToUTC(y, m, d, h, mi, tz) {
    const guess = Date.UTC(y, m - 1, d, h, mi);
    let off = tzOffsetMinutes(tz, new Date(guess));
    let ts = guess - off * 60000;
    const off2 = tzOffsetMinutes(tz, new Date(ts));
    if (off2 !== off) ts = guess - off2 * 60000;
    return ts;
  }

  /* ---------- calendar ---------- */

  function jdnFromYMD(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  function dayIndexFromJDN(jdn) {
    return mod(jdn - 11, 60);
  }

  function tenGod(dayStem, otherStem) {
    const dEl = Math.floor(dayStem / 2);
    const oEl = Math.floor(otherStem / 2);
    const same = (dayStem % 2) === (otherStem % 2);
    if (dEl === oEl) return same ? 'friend' : 'rival';
    if (GEN[dEl] === oEl) return same ? 'output' : 'expression';
    if (CTRL[dEl] === oEl) return same ? 'indirectWealth' : 'directWealth';
    if (CTRL[oEl] === dEl) return same ? 'sevenKill' : 'directOfficer';
    return same ? 'indirectResource' : 'directResource';
  }

  /* ---------- the chart ---------- */

  function buildChart(input) {
    const { y, m, d, h, mi, tz, gender, name, place } = input;
    const utcMs = wallToUTC(y, m, d, h, mi, tz);
    const jd = julianDay(utcMs);
    const lambda = solarLongitude(jd);
    const mIdx = monthIndexAt(jd);

    // year pillar: the solar year begins at 立春 (λ = 315°)
    // 寅…亥 months are always after 立春 of their calendar year;
    // 子 month straddles New Year; 丑 month (Jan–early Feb) precedes 立春.
    let solarYear = y;
    if (mIdx === 11 || (mIdx === 10 && m === 1)) solarYear = y - 1;
    const yearStem = mod(solarYear - 4, 10);
    const yearBranch = mod(solarYear - 4, 12);

    const monthStem = mod(yearStem * 2 + 2 + mIdx, 10);
    const monthBranch = mod(2 + mIdx, 12);

    // day changes at midnight; the 23:00–24:00 hour is treated as the next day's 子 hour
    let dayJDN = jdnFromYMD(y, m, d);
    if (h >= 23) dayJDN += 1;
    const dIdx = dayIndexFromJDN(dayJDN);
    const dayStem = dIdx % 10;
    const dayBranch = dIdx % 12;

    const hourBranch = Math.floor(mod(h + 1, 24) / 2);
    const hourStem = mod(dayStem * 2 + hourBranch, 10);

    const pillars = [
      { stem: yearStem, branch: yearBranch, key: 'year' },
      { stem: monthStem, branch: monthBranch, key: 'month' },
      { stem: dayStem, branch: dayBranch, key: 'day' },
      { stem: hourStem, branch: hourBranch, key: 'hour' }
    ];

    // element weighting: stems + hidden stems, month branch carries the season
    const score = [0, 0, 0, 0, 0];
    const stemW = [1.0, 1.25, 1.2, 1.0];
    const branchW = [[1.15, 0.35, 0.2], [1.9, 0.7, 0.35], [1.2, 0.4, 0.22], [1.05, 0.3, 0.18]];
    pillars.forEach((p, i) => {
      score[Math.floor(p.stem / 2)] += stemW[i];
      HIDDEN[p.branch].forEach((s, j) => {
        score[Math.floor(s / 2)] += branchW[i][j] || 0.15;
      });
    });
    const totalScore = score.reduce((a, b) => a + b, 0);
    const pct = score.map(v => Math.round(v / totalScore * 1000) / 10);
    const dominant = score.indexOf(Math.max(...score));
    const weakest = score.indexOf(Math.min(...score));

    const dmEl = Math.floor(dayStem / 2);
    const resourceEl = mod(dmEl + 4, 5);
    const support = pct[dmEl] + pct[resourceEl];
    const strength = support >= 47 ? 'strong' : support <= 31 ? 'weak' : 'balanced';

    // useful element (用神) — a balancing heuristic, not a verdict
    let useful;
    if (strength === 'strong') {
      const drain = [mod(dmEl + 1, 5), mod(dmEl + 2, 5), mod(dmEl + 3, 5)];
      drain.sort((a, b) => pct[a] - pct[b]);
      useful = drain[0];
    } else if (strength === 'weak') {
      const feed = [resourceEl, dmEl];
      feed.sort((a, b) => pct[a] - pct[b]);
      useful = feed[0];
    } else {
      useful = weakest;
    }

    // ten-god census across stems and main hidden stems
    const gods = TEN_GOD_KEYS.reduce((o, k) => (o[k] = 0, o), {});
    pillars.forEach((p, i) => {
      if (i !== 2) gods[tenGod(dayStem, p.stem)] += 1.2;
      gods[tenGod(dayStem, HIDDEN[p.branch][0])] += i === 1 ? 1.6 : 1;
    });
    const godRank = Object.keys(gods).sort((a, b) => gods[b] - gods[a]);

    // clashes and combinations
    const CLASH = { 0: 6, 6: 0, 1: 7, 7: 1, 2: 8, 8: 2, 3: 9, 9: 3, 4: 10, 10: 4, 5: 11, 11: 5 };
    const clashes = [];
    const pairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    pairs.forEach(([a, b]) => {
      if (CLASH[pillars[a].branch] === pillars[b].branch) {
        clashes.push({ a: pillars[a].key, b: pillars[b].key, branch: pillars[a].branch });
      }
    });

    const peach = pillars.some(p => [0, 3, 6, 9].indexOf(p.branch) >= 0);

    // luck cycles (大运)
    const yangYear = mod(solarYear - 4, 2) === 0;
    const forward = (yangYear && gender === 'male') || (!yangYear && gender === 'female');
    const boundary = termBoundary(jd, forward ? 1 : -1) || jd + 15 * (forward ? 1 : -1);
    const startAge = Math.abs(boundary - jd) / 3; // 3 days ≈ 1 year
    const luck = [];
    let ls = monthStem, lb = monthBranch;
    for (let i = 0; i < 8; i++) {
      ls = mod(ls + (forward ? 1 : -1), 10);
      lb = mod(lb + (forward ? 1 : -1), 12);
      luck.push({ stem: ls, branch: lb, from: startAge + i * 10, to: startAge + i * 10 + 9 });
    }

    const now = Date.now();
    const age = Math.max(0, (now - utcMs) / 86400000 / 365.2425);
    let luckIndex = -1;
    luck.forEach((l, i) => { if (age >= l.from && age <= l.to) luckIndex = i; });

    // annual pillars, four years from the current one
    const thisYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 4; i++) {
      const yy = thisYear + i;
      years.push({
        year: yy,
        age: Math.round(age + i),
        stem: mod(yy - 4, 10),
        branch: mod(yy - 4, 12),
        god: tenGod(dayStem, mod(yy - 4, 10)),
        clash: CLASH[pillars[2].branch] === mod(yy - 4, 12)
      });
    }

    return {
      input: { y, m, d, h, mi, tz, gender, name: name || '', place: place || '' },
      utcMs, jd, lambda, monthIndex: mIdx,
      pillars,
      dayMaster: { stem: dayStem, element: dmEl, strength, support },
      scores: score, pct, dominant, weakest, missing: ELEMENTS.filter((e, i) => pct[i] < 3.5),
      useful,
      gods, godRank, dominantGod: godRank[0],
      clashes, peach,
      season: SEASON[monthBranch],
      luck: { list: luck, startAge, forward, index: luckIndex, age },
      years,
      dayBranch
    };
  }

  const api = {
    STEMS, STEM_PY, BRANCHES, BRANCH_PY, ANIMALS, ANIMALS_ZH,
    ELEMENTS, ELEMENT_ZH, HIDDEN, BRANCH_ELEMENT, GEN, CTRL, TEN_GOD_KEYS, SEASON,
    mod, solarLongitude, monthIndexAt, termBoundary, julianDay,
    jdnFromYMD, dayIndexFromJDN, tenGod, tzOffsetMinutes, wallToUTC, buildChart
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Xuanji = api;
})(typeof window !== 'undefined' ? window : globalThis);
