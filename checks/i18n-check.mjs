import assert from 'node:assert/strict';
import vm from 'node:vm';
const read = name => Bun.file(new URL('../' + name, import.meta.url)).text();
const catalog = await read('i18n.js');
const sandbox = {}; sandbox.window = sandbox;
vm.runInNewContext(catalog, sandbox);
const {en, t, apply, locale} = sandbox.SONORA_I18N;
assert.equal(locale, 'en');
assert.equal(t('unknown.{artist}', {artist:'not substituted'}), 'unknown.{artist}');
assert.equal(t('toString'), 'toString');
assert.equal(t('native.procedural'), '{artist}Procedural art, not audio analysis.');
assert.equal(t('native.procedural', null), '{artist}Procedural art, not audio analysis.');
assert.equal(t('native.procedural', {artist:'<img onerror=bad> · '}), '<img onerror=bad> · Procedural art, not audio analysis.');
assert.equal(t('native.procedural', {artist:'$&{artist}'}), '$&{artist}Procedural art, not audio analysis.');
assert.equal(t('native.procedural', Object.create({artist:'inherited'})), '{artist}Procedural art, not audio analysis.');
const html = await read('index.html');
const used = new Set();
for (const source of [html, await read('native-bridge.js'), await read('pwa.mjs')]) {
  for (const match of source.matchAll(/\bt\('([^']+)'/g)) used.add(match[1]);
}
// Each static binding must be a text-only leaf and exactly match its no-JS fallback.
const texts = [];
for (const match of html.matchAll(/<([\w-]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>([^<]*)<\/\1>/g)) {
  const [, , key, fallback] = match;
  used.add(key); assert.equal(fallback, t(key), `static fallback: ${key}`);
  const node = {dataset:{i18n:key}, textContent:''};
  Object.defineProperty(node, 'innerHTML', {set(){throw Error('unsafe HTML sink');}});
  texts.push(node);
}
assert.equal(texts.length, [...html.matchAll(/\bdata-i18n="/g)].length, 'every text binding must preserve child markup');
const labels = [];
for (const match of html.matchAll(/<[^>]*?\saria-label="([^"]+)"[^>]*>/g)) {
  const key = match[0].match(/data-i18n-aria-label="([^"]+)"/)?.[1];
  assert(key, `unbound accessibility label: ${match[1]}`);
  used.add(key); assert.equal(match[1], t(key));
  labels.push({dataset:{i18nAriaLabel:key}, setAttribute(name,value){assert.equal(name,'aria-label'); this.label=value;}});
}
apply({querySelectorAll: selector => selector === '[data-i18n]' ? texts : labels});
for (const node of texts) assert.equal(node.textContent, en[node.dataset.i18n]);
for (const node of labels) assert.equal(node.label, en[node.dataset.i18nAriaLabel]);
assert.deepEqual([...used].sort(), Object.keys(en).sort(), 'missing or unused catalog keys');
assert(html.includes('<html lang="en">'));
assert.equal(JSON.parse(await read('manifest.webmanifest')).lang, 'en');
assert(html.indexOf('src="i18n.js"') < html.indexOf("import('/pwa.mjs')"));
assert(html.indexOf('src="i18n.js"') < html.indexOf('src="native-bridge.js"'));
assert(html.includes('<h1><span data-i18n="welcome.sound">Sound,</span><br><span data-i18n="welcome.motion">in motion.</span></h1>'));
for (const name of ['build.mjs','server.mjs','sw.js']) assert((await read(name)).includes("'" + (name==='sw.js'?'/':'') + "i18n.js'"), `catalog packaging: ${name}`);
const project = await read('ios/SONORA.xcodeproj/project.pbxproj');
const ref = project.match(/(\w+) = \{isa = PBXFileReference;[^\n]*?name = i18n.js; path = ..\/..\/i18n.js;/)?.[1];
assert(ref, 'native catalog file reference');
const buildRef = project.match(new RegExp('(\\w+) = \\{isa = PBXBuildFile; fileRef = '+ref+';'))?.[1];
assert(buildRef && project.match(/isa = PBXResourcesBuildPhase; files = \(([^)]+)\)/)?.[1].includes(buildRef), 'catalog must be copied as an iOS bundle resource');
assert(project.match(/path = SONORA; sourceTree/));
assert((await read('sw.js')).includes("sonora-pwa-v24"));
console.log(`PASS: i18n ${used.size}/${Object.keys(en).length} keys; ${texts.length} static text and ${labels.length} ARIA fallbacks; safe interpolation/DOM, English declarations, web/PWA/native packaging`);
