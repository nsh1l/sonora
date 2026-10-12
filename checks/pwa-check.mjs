const pathOf = value => new URL(typeof value === 'string' ? value : value.url, 'https://sonora.test').pathname;
const events = new Map();
const cacheData = new Map();
let claims = 0;

class Cache {
  constructor(name) { this.name = name; this.entries = cacheData.get(name) ?? new Map(); cacheData.set(name, this.entries); }
  async addAll(paths) { for (const path of paths) this.entries.set(pathOf(path), new Response(`precache:${pathOf(path)}`)); }
  async match(value) { return this.entries.get(pathOf(value)); }
}
globalThis.self = {
  location: {origin: 'https://sonora.test'},
  clients: {claim: async () => { claims++; }},
  addEventListener: (name, listener) => events.set(name, listener)
};
globalThis.caches = {
  open: async name => new Cache(name),
  keys: async () => [...cacheData.keys()],
  delete: async name => cacheData.delete(name)
};
let networkCalls = 0;
globalThis.fetch = async request => { networkCalls++; return new Response(`network:${pathOf(request)}`); };
await import(new URL('../sw.js?pwa-check', import.meta.url));

const dispatch = async (name, request) => {
  let waiting;
  let response;
  events.get(name)({request, waitUntil: promise => { waiting = promise; }, respondWith: promise => { response = promise; }});
  if (waiting) await waiting;
  return response && await response;
};
await dispatch('install');
const cacheSource = await Bun.file(new URL('../sw.js', import.meta.url)).text();
const cacheName = cacheSource.match(/const CACHE = '([^']+)'/)?.[1];
if (!cacheName) throw Error('service-worker cache revision is missing');
const shell = cacheData.get(cacheName);
if (!shell || !shell.has('/index.html') || !shell.has('/pwa.mjs')) throw Error('install did not precache the shell');
cacheData.set('sonora-pwa-old', new Map());
cacheData.set('other-app', new Map());
await dispatch('activate');
if (cacheData.has('sonora-pwa-old') || !cacheData.has('other-app') || claims !== 1) throw Error('activation cleanup was not scoped');

const request = (path, options = {}) => ({method: 'GET', mode: undefined, url: new URL(path, 'https://sonora.test').href, ...options});
const offlineShell = await dispatch('fetch', request('/remembered-route', {mode: 'navigate'}));
if (await offlineShell.text() !== 'precache:/index.html') throw Error('offline navigation did not receive the shell');
const cachedScript = await dispatch('fetch', request('/pwa.mjs'));
if (await cachedScript.text() !== 'precache:/pwa.mjs') throw Error('cached shell asset was not served');
for (const ignored of [
  request('/song.mp3'), request('/index.html?cache=1'), request('/api', {method: 'POST'}),
  request('https://elsewhere.test/index.html')
]) {
  const result = await dispatch('fetch', ignored);
  if (result !== undefined) throw Error(`request should not be cached or intercepted: ${ignored.url}`);
}
if (networkCalls !== 0) throw Error('cached/offline paths unexpectedly used the network');

const manifest = JSON.parse(await Bun.file(new URL('../manifest.webmanifest', import.meta.url)).text());
for (const icon of manifest.icons) {
  if (icon.type !== 'image/png') throw Error(`manifest icon is not PNG: ${icon.src}`);
  const bytes = new Uint8Array(await Bun.file(new URL(`..${icon.src}`, import.meta.url)).arrayBuffer());
  const width = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(16);
  const height = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(20);
  if (`${width}x${height}` !== icon.sizes) throw Error(`manifest icon dimensions disagree: ${icon.src}`);
}
for (const path of shell.keys()) {
  const asset = path === '/' ? '/index.html' : path;
  if (!await Bun.file(new URL(`..${asset}`, import.meta.url)).exists()) throw Error(`precache asset is missing: ${path}`);
}

class Element {
  constructor() { this.hidden = false; this.textContent = ''; this.listeners = new Map(); }
  addEventListener(name, listener) { const list = this.listeners.get(name) ?? []; list.push(listener); this.listeners.set(name, list); }
  async emit(name, value = {}) { await Promise.all((this.listeners.get(name) ?? []).map(listener => listener(value))); }
}
const installPwa = async ({reject = false} = {}) => {
  const button = new Element(), hint = new Element(), windowEvents = new Map();
  const serviceWorkerEvents = new Map();
  const registration = {waiting: null, addEventListener() {}};
  globalThis.document = {querySelector: selector => selector === '#installApp' ? button : hint};
  globalThis.window = globalThis;
  globalThis.addEventListener = (name, listener) => windowEvents.set(name, listener);
  globalThis.matchMedia = () => ({matches: false});
  Object.defineProperty(globalThis, 'location', {configurable: true, value: {protocol: 'https:'}});
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {standalone: false, serviceWorker: {
    controller: null, ready: Promise.resolve(registration),
    register: () => reject ? Promise.reject(Error('offline')) : Promise.resolve(registration),
    addEventListener: (name, listener) => serviceWorkerEvents.set(name, listener)
  }}});
  const source = await Bun.file(new URL('../pwa.mjs', import.meta.url)).text();
  new Function(source)();
  await Promise.resolve();
  await Promise.resolve();
  return {button, hint, windowEvents, serviceWorkerEvents};
};
const ui = await installPwa();
if (ui.hint.textContent !== 'Offline shell saved. Reload once to use it offline.') throw Error(`first-install offline state is misleading: ${ui.hint.textContent}`);
let prompted = false;
ui.windowEvents.get('beforeinstallprompt')({preventDefault() {}, prompt: async () => { prompted = true; }, userChoice: Promise.resolve({outcome: 'accepted'})});
if (ui.button.hidden) throw Error('install button was not revealed');
await ui.button.emit('click');
if (!prompted || ui.hint.textContent !== 'Installing SONORA…' || !ui.button.hidden) throw Error('install lifecycle UI failed');
ui.windowEvents.get('appinstalled')();
if (!ui.hint.hidden) throw Error('installed UI was not hidden');
const failure = await installPwa({reject: true});
if (failure.hint.textContent !== 'Offline setup failed. Reconnect and reload to try again.') throw Error('service-worker error UI failed');

console.log('PASS: PWA precache, scoped cleanup, offline shell, cache exclusions, manifest assets, and install UI');
