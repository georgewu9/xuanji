/* ============================================================
   XUANJI · 玄机 — background music
   The supplied theme is embedded at build time and looped
   through Web Audio, so the seam is sample-accurate and the
   level can be faded gently. Volume is deliberately low.
   ============================================================ */
(function (global) {
  'use strict';

  const VOLUME = 0.14;          // roughly −17 dB against the supplied master
  const FADE_IN = 2.8;
  const FADE_OUT = 0.7;

  let ctx = null;
  let gain = null;
  let buffer = null;
  let source = null;
  let running = false;
  let wanted = false;
  let starting = null;
  let decoding = null;
  const listeners = [];

  function emit() {
    listeners.forEach(fn => { try { fn(running); } catch (e) {} });
  }

  function onState(fn) {
    listeners.push(fn);
    fn(running);
  }

  function ensureCtx() {
    if (ctx) return true;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
      gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(ctx.destination);
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  function decode() {
    if (buffer) return Promise.resolve(buffer);
    if (decoding) return decoding;
    const b64 = global.XUANJI_BGM || '';
    if (!b64) return Promise.reject(new Error('no soundtrack'));

    const bin = global.atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    decoding = new Promise((resolve, reject) => {
      ctx.decodeAudioData(bytes.buffer, b => { buffer = b; resolve(b); }, reject);
    });
    return decoding;
  }

  function start() {
    wanted = true;
    if (running) {
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
      return Promise.resolve();
    }
    if (starting) return starting;
    starting = boot().finally(() => { starting = null; });
    return starting;
  }

  async function boot() {
    if (!ensureCtx()) return;

    // resume inside the gesture; do not block the decode on it
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }

    try {
      await decode();
    } catch (e) {
      return;
    }
    if (!wanted) return;

    const now = ctx.currentTime;
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration;
    source.connect(gain);

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.linearRampToValueAtTime(VOLUME, now + FADE_IN);

    source.start(now);
    running = true;
    emit();
  }

  function stop() {
    wanted = false;
    if (!running || !ctx) return;
    const now = ctx.currentTime;
    const old = source;
    source = null;
    running = false;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.linearRampToValueAtTime(0.0001, now + FADE_OUT);

    setTimeout(() => {
      try { old.stop(); } catch (e) {}
      try { old.disconnect(); } catch (e) {}
    }, FADE_OUT * 1000 + 80);

    emit();
  }

  function toggle() {
    if (running) stop(); else start();
    return running;
  }

  global.Music = {
    start,
    stop,
    toggle,
    isRunning: () => running,
    state: () => (ctx ? ctx.state : 'none'),
    volume: VOLUME,
    onState
  };
})(typeof window !== 'undefined' ? window : globalThis);
