const port = Number(Bun.env.PORT || 4178);
const types = {'.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.webmanifest':'application/manifest+json', '.png':'image/png', '.mp3':'audio/mpeg'};
const files = new Map(['samples/september-14.mp3','index.html','privacy.html','support.html','i18n.js', 'native-bridge.js','pwa.mjs','sw.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'].map(name => ['/'+name,name]));
files.set('/', 'index.html');
Bun.serve({port, fetch(req) {
  const name = files.get(new URL(req.url).pathname);
  if (!name) return new Response('Not found', {status:404});
  const type = types[name.slice(name.lastIndexOf('.'))];
  return new Response(Bun.file(new URL(name, import.meta.url)), {headers:{'Content-Type':type, 'Cache-Control':'no-cache'}});
}});
console.log(`SONORA listening on http://localhost:${port}`);
