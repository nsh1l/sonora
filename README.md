# SONORA

A browser-native artistic audio visualizer prototype. Select an audio file you own, press play, and watch the generated field respond to its spectrum. Audio is processed locally in your browser; no upload or external service is used.

## Run

Serve this directory on localhost (needed for browser audio permissions), for example:

```sh
bun -e 'Bun.serve({port:4178,fetch(){return new Response(Bun.file("index.html"))}})'
```

Then open `http://localhost:4178`. No package installation is needed. The prototype supports common browser-decodable audio formats; exact format support depends on the browser.

SONORA is an independent prototype and is not affiliated with SoundSpectrum.
