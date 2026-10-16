const html = await Bun.file(new URL('../index.html', import.meta.url)).text();
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(source => source.includes('fullscreenToggle'));
if (!script) throw Error('fullscreen controller is missing from index.html');
for (const assertion of [
  'transition:opacity 350ms cubic-bezier(.22,1,.36,1)',
  'body.visualizer-fullscreen #art{position:fixed',
  'const stage=document.documentElement',
  '.fullscreen-hint{display:none;position:fixed;z-index:12;',
  'body.visualizer-fullscreen .fullscreen-hint{display:block;animation:hint-fade 5s linear forwards,hint-glitch 5s steps(1,end) forwards}',
  '@keyframes hint-fade{0%,65%{opacity:1;visibility:visible}100%{opacity:0;visibility:hidden}}',
  '@media(prefers-reduced-motion:reduce){body.visualizer-fullscreen .fullscreen-hint{animation:hint-fade 5s linear forwards}}',
  'pointer-events:none;user-select:none',
  'bottom:calc(18px + env(safe-area-inset-bottom))',
  '<p class="fullscreen-hint" id="fullscreenHint">左右にスワイプしてパターンを切り替え</p>',
  '.top,.bottom,.pwa-install{position:relative;z-index:11}',
  'body.visualizer-fullscreen .top{opacity:0;transform:translateY(-38px)',
  '@media(prefers-reduced-motion:reduce){.top,.visual-label,.stage-copy,.bottom,.pwa-install,.fullscreen-toggle,.fullscreen-exit{transition:none!important}'
]) if (!html.includes(assertion)) throw Error(`fullscreen CSS assertion failed: ${assertion}`);

class Classes {
  constructor() { this.values = new Set(); }
  toggle(name, value) { value ? this.values.add(name) : this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}
class Element {
  constructor() { this.attributes = new Map(); this.listeners = new Map(); this.classList = new Classes(); this.inert = false; this.focused = false; }
  addEventListener(name, listener) { (this.listeners.get(name) ?? this.listeners.set(name, []).get(name)).push(listener); }
  emit(name, event = {}) { for (const listener of this.listeners.get(name) ?? []) listener(event); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, value) { value ? this.attributes.set(name, '') : this.attributes.delete(name); }
  focus() { this.focused = true; }
}
const mount = mode => {
  const stage = new Element(), toggle = new Element(), exit = new Element(), top = new Element(), state = new Element(), welcome = new Element(), bottom = new Element(), install = new Element();
  const nodes = new Map([['.stage', stage], ['#fullscreenToggle', toggle], ['#fullscreenExit', exit], ['.top', top], ['#state', state], ['#welcome', welcome], ['.bottom', bottom], ['.pwa-install', install]]);
  const events = new Map(), body = new Element();
  const document = {body, documentElement: stage, fullscreenElement: null, querySelector: selector => nodes.get(selector) ?? null, addEventListener: (name, listener) => events.set(name, listener), exitFullscreen() { document.fullscreenElement = null; events.get('fullscreenchange')(); }};
  if (mode === 'native') stage.requestFullscreen = () => { document.fullscreenElement = stage; events.get('fullscreenchange')(); return Promise.resolve(); };
  if (mode === 'rejected') stage.requestFullscreen = () => Promise.reject(Error('rejected'));
  if (mode === 'race') { let reject; stage.requestFullscreen = () => new Promise((_, fail) => { reject = fail; }); stage.reject = () => reject(Error('late rejection')); }
  new Function('document', script)(document);
  return {stage, toggle, exit, top, state, welcome, bottom, install, body, events, document};
};
const assertInactive = ui => {
  if (ui.body.classList.contains('visualizer-fullscreen') || ui.toggle.getAttribute('aria-pressed') !== 'false' || ui.toggle.getAttribute('aria-label') !== 'Enter visualizer fullscreen' || !ui.exit.inert || ui.top.inert) throw Error('fullscreen exit did not restore UI state');
};
const assertActive = ui => {
  if (!ui.body.classList.contains('visualizer-fullscreen') || ui.toggle.getAttribute('aria-pressed') !== 'true' || ui.toggle.getAttribute('aria-label') !== 'Exit visualizer fullscreen' || !ui.top.inert || ui.top.getAttribute('aria-hidden') !== 'true' || ui.exit.inert) throw Error('fullscreen entry did not make faded UI inert and expose exit');
};

const native = mount('native');
native.toggle.emit('click');
assertActive(native);
if (!native.exit.focused) throw Error('fullscreen entry did not focus the available exit control');
native.exit.emit('click');
assertInactive(native);
if (!native.toggle.focused) throw Error('exit did not restore focus to the entry toggle');

const fallback = mount('rejected');
fallback.toggle.emit('click');
await Promise.resolve();
assertActive(fallback);
fallback.events.get('keydown')({key: 'Escape'});
assertInactive(fallback);

const unsupported = mount('unsupported');
unsupported.toggle.emit('click');
assertActive(unsupported);
unsupported.events.get('keydown')({key: 'Escape'});
assertInactive(unsupported);

const browserExit = mount('native');
browserExit.toggle.emit('click');
browserExit.document.fullscreenElement = null;
browserExit.events.get('fullscreenchange')();
assertInactive(browserExit);

const race = mount('race');
race.toggle.emit('click');
race.events.get('keydown')({key: 'Escape'});
race.stage.reject();
await Promise.resolve();
assertInactive(race);

console.log('PASS: fullscreen native/fallback entry and exit, Escape, fullscreenchange, inert ARIA state, focus restoration, race handling, and CSS motion rules');
