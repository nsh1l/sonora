/* English baseline shared by HTTP(S) and the native file:// renderer. */
(function (global) {
  'use strict';
  const en = Object.freeze({
    "brand.tagline": "A living instrument for sound",
    "credits.open": "Credits",
    "credits.title": "A living instrument for sound",
    "credits.concept": "Concept & creative direction",
    "credits.development": "Development assistance",
    "credits.close": "Close credits",
    "links.privacy": "Privacy",
    "links.support": "Support",
    "stage.label": "Audio visualization",
    "state.awaiting": "AWAITING A TRACK",
    "welcome.sound": "Sound,",
    "welcome.motion": "in motion.",
    "welcome.description": "Bring a track. Watch it become something else.",
    "fullscreen.enter": "Enter visualizer fullscreen",
    "fullscreen.exit": "Exit visualizer fullscreen",
    "fullscreen.label": "Fullscreen visualizer",
    "fullscreen.exitLabel": "Exit fullscreen",
    "fullscreen.hint": "Swipe left or right to change patterns",
    "track.empty": "No track loaded",
    "track.privacy": "Your audio stays in this browser.",
    "transport.restart": "Restart",
    "transport.play": "Play",
    "transport.pause": "Pause",
    "transport.end": "Skip to end",
    "transport.seek": "Seek",
    "audio.choose": "＋ Choose audio",
    "style.label": "Visual style",
    "audio.formats": "MP3 · AAC/M4A · WAV · FLAC · Ogg/Opus",
    "audio.localHint": "Local files stay on-device.",
    "audio.sampleHint": "Sample streams online.",
    "pwa.install": "Install SONORA",
    "pwa.hint": "iPhone: Share → Add to Home Screen · Offline files must be selected again after reopening.",
    "state.unavailable": "WEB AUDIO IS NOT AVAILABLE",
    "state.ready": "READY",
    "track.ready": "Ready to play · audio remains on this device",
    "state.playbackError": "COULDN’T START PLAYBACK",
    "error.playbackRetry": "Press Play to retry, or choose another audio file.",
    "track.sample": "Sample track · streamed online",
    "state.playing": "NOW PLAYING",
    "state.paused": "PAUSED",
    "state.ended": "TRACK ENDED",
    "state.readError": "COULDN’T READ THIS AUDIO FILE",
    "error.audioFormat": "This browser could not decode the file. Try a PCM WAV or MP3 copy.",
    "error.audioNetwork": "The audio could not be loaded. Check your connection or choose the file again.",
    "native.invalid": "Native input was invalid.",
    "native.apple": "APPLE MUSIC · PLAYBACK-POSITION ART",
    "native.microphone": "MICROPHONE · LIVE AUDIO",
    "native.spotify": "SPOTIFY METADATA ONLY",
    "native.listening": "Listening to microphone",
    "native.procedural": "{artist}Procedural art, not audio analysis.",
    "native.privacy": "Live microphone analysis stays on this device.",
    "pwa.ready": "Offline shell ready · iPhone: Share → Add to Home Screen",
    "pwa.saved": "Offline shell saved. Reload once to use it offline.",
    "pwa.installing": "Installing SONORA…",
    "pwa.installError": "Installation could not start. Use your browser’s install menu.",
    "pwa.update": "Update ready · close all SONORA windows and reopen to apply.",
    "pwa.offlineError": "Offline setup failed. Reconnect and reload to try again."
});
  // Unknown keys remain literal; missing parameters remain visible as {name}.
  function t(key, params = {}) {
    if (!Object.hasOwn(en, key)) return key;
    return en[key].replace(/\{(\w+)\}/g, (token, name) =>
      params != null && Object.hasOwn(params, name) ? String(params[name]) : token);
  }
  function apply(root) {
    for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
    for (const node of root.querySelectorAll('[data-i18n-aria-label]')) node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  }
  global.SONORA_I18N = Object.freeze({locale: 'en', en, t, apply});
})(window);
