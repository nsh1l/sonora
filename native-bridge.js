/* Native input boundary; the browser's local-file player does not use it. */
(function (global) {
  'use strict';
  const t = global.SONORA_I18N.t;
  const finite = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  const clean = (v, max) => typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '';
  const empty = (status = '', generation = 0) => ({mode:'none', bands:[0,0,0], rms:0, timeline:{playing:false, position:0, duration:0, track:''}, title:'', artist:'', generation, status});
  let latest = empty(), newestGeneration = 0;
  function valid(raw) {
    if (!raw || !['microphone','apple','spotify','local','none'].includes(raw.mode) || !Number.isSafeInteger(raw.generation) || raw.generation < 0) return null;
    if (raw.generation < newestGeneration) return 'stale';
    if (raw.mode === 'none') return empty(clean(raw.status,180), raw.generation);
    if (raw.mode === 'spotify') return {...empty('', raw.generation), mode:'spotify'};
    if (raw.mode === 'local') return {...empty('', raw.generation), mode:'local'};
    if (!Array.isArray(raw.bands) || raw.bands.length !== 3 || !raw.bands.every(x => finite(x) && x <= 1) || !finite(raw.rms) || raw.rms > 1) return null;
    const t = raw.timeline || {};
    if (typeof t.playing !== 'boolean' || !finite(t.position) || !finite(t.duration) || t.position > t.duration) return null;
    return {mode:raw.mode, bands:raw.bands.slice(), rms:raw.rms, timeline:{playing:t.playing, position:t.position, duration:t.duration, track:clean(t.track,160)}, title:clean(raw.title,160), artist:clean(raw.artist,160), generation:raw.generation, status:clean(raw.status,180)};
  }
  function render(payload) {
    const next = valid(payload);
    if (next === 'stale') return;
    const enteringLocal = latest.mode !== 'local' && next?.mode === 'local';
    if (latest.mode === 'local' && next?.mode !== 'local') global.SONORA.releaseLocal?.();
    latest = next || empty(t('native.invalid'), newestGeneration);
    if (next) newestGeneration = Math.max(newestGeneration, next.generation);
    const on = ['microphone','apple'].includes(latest.mode), spotify = latest.mode === 'spotify';
    document.body.classList.toggle('sonora-native', on);
    document.body.classList.toggle('sonora-local', latest.mode === 'local');
    document.body.classList.toggle('sonora-spotify', spotify);
    const art = document.querySelector('#art');
    if (art) art.hidden = spotify;
    const state = document.querySelector('#state'), name = document.querySelector('#trackName'), sub = document.querySelector('#trackSub');
    if (enteringLocal) {
      if (state) state.textContent = t('state.awaiting');
      if (name) name.textContent = t('track.empty');
      if (sub) sub.textContent = t('audio.localHint');
    }
    if (state && latest.mode !== 'local') state.textContent = on ? (latest.status || (latest.mode === 'apple' ? t('native.apple') : t('native.microphone'))) : (spotify ? t('native.spotify') : (latest.status || t('state.awaiting')));
    if (name && latest.mode !== 'local') name.textContent = on ? (latest.title || t('native.listening')) : '';
    if (sub && latest.mode !== 'local') sub.textContent = on ? (latest.mode === 'apple' ? t('native.procedural', {artist: latest.artist ? latest.artist + ' · ' : ''}) : t('native.privacy')) : '';
    global.__sonoraNative = latest;
  }
  global.SONORA = {
    setShell() { global.__sonoraShell = true; document.body.classList.toggle('sonora-shell', true); },
    setPayload(value) { try { render(typeof value === 'string' ? JSON.parse(value) : value); } catch (_) { render(null); } },
    clear() { newestGeneration = 0; render(empty()); },
    snapshot() { return latest; }
  };
})(window);
