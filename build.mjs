// Publish only the browser application, never iOS source, checks or repository metadata.
import {mkdir, copyFile, rm} from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const out = new URL('./dist/', root);
await rm(out, {recursive:true, force:true});
await mkdir(new URL('icons/', out), {recursive:true});
for (const name of ['index.html', 'native-bridge.js', 'pwa.mjs', 'sw.js', 'manifest.webmanifest', '_headers', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png']) {
  await copyFile(new URL(name, root), new URL(name, out));
}
console.log('Built SONORA browser-only assets in dist/');
