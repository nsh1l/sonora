# SONORA

SONORA is an original generative visual instrument. The browser prototype still accepts a local audio file and processes it locally; no upload is involved.

**Try it:** https://sonora.alwaysyesterday.party/

Cloudflare Pages fallback: https://sonora-viz.pages.dev/

## Why SONORA?

**SONORA — living sound. 音が生きた形になる。**

SONORAという名前は、*sonic* や *sonorous* を思わせる「音・響き」の印象と、楽器や作品のような独立した名前の佇まいを持っています。「ソノラ」と短く呼びやすく、音から花・軌道・波のような映像を生み出す視覚楽器に似合う名前です。

“living sound” は、音を単に測るのではなく、生きた形として描くというコンセプトを表しています。この説明は制作後に言語化して採用したもので、最初の命名時に記録されていた由来ではありません。

## Browser

```sh
bun server.mjs
```

Open `http://localhost:4178`, choose an audio file, and use the Bloom, Orbit, Tide, Dub, Datamosh, Cymatic, or Dice renderer. Use the stage’s top-right fullscreen button for an immersive visualizer; Escape or its minimal exit button returns to the controls. In fullscreen, swipe left for the next pattern or right for the previous; ArrowRight/ArrowLeft are keyboard alternatives. Pattern changes use a smooth five-second whole-frame crossfade, without tiled displacement or grid seams. Repeated swipes start from the currently visible blend; audio continues. Short/vertical/cancelled gestures are ignored. On each fullscreen entry, a faint bottom hint explains the horizontal swipe; it stays readable initially, then chromatically glitches and fades away by five seconds. It never intercepts gestures. Reduced motion keeps the fade but removes the glitch. Reduced motion switches immediately without the fade or glitch. Resize, fullscreen exit and loading a new track cancel stale transition frames. The server exposes the PWA shell, manifest, worker, and icons with correct MIME types.

Bloom keeps layered geometric petals and fine radial veins. Orbit keeps woven Lissajous trajectories and small orbiting points. Neither uses collage planes, negative-space cuts, sculptural plates or counterweights. Both reuse the existing audio bands and deterministic Apple timeline, with reduced motion preserving a still-phase composition.

Dub adds thick luminous ribbons, feedback trails, three delayed geometry taps (180/360/540 ms), bass-driven glow, and transient color separation. No full-screen strobe is used. Reduced motion disables feedback movement and transient color separation. Apple Music remains playback-position art, not audio analysis.

Datamosh is an original real-time Canvas2D P-frame-style reconstruction: a shared previous-frame buffer is displaced in bounded macroblocks, horizontal tears retain old image fragments, and 40–250 Hz rising-band events rebuild pigment islands. Bass drives vector displacement, mids bend the flow, and treble breaks up slices. It simulates datamoshing aesthetics; it does not corrupt or decode compressed video. The browser maps 40–250 Hz using the actual AudioContext sample rate; native microphone uses its existing 40–250 Hz bass band. A band rise of 0.035 above its 450 ms spectral envelope fires once (minimum magnitude 0.12), rearms when the rise falls to 0.01, and uses a 300 ms cooldown. This adaptive floor lets mastered tracks retrigger without needing a near-silent gap. Sustained notes, silence and procedural Apple bands never produce periodic refreshes. Initial/reduced-motion artwork is still seeded so the field is not blank. Reduced motion shows a static pigment composition without feedback/advection. Apple Music stays playback-position art, and a paused Apple timeline holds its frame.

Cymatic treats sound as a vibrating print plate: a bounded 96×96 analytical standing-wave field collects sand-like marks near its nodal lines. Bass and mids reshape the interference modes; treble pulls a cobalt-blue registration layer away from vermilion and chalk powder. The plate slowly tilts and its interference redistributes, without feedback trails or particle histories. This is Chladni-inspired generative art, not a physical simulation or measurement of actual resonances. Reduced motion freezes tilt/interference phase but retains real band response; Apple Music remains deterministic playback-position art and pauses with its timeline. Source switches and seeks cannot retain old particles because each field is rebuilt from current inputs. Cymatic joins the fullscreen swipe cycle and shared five-second whole-frame crossfade.

Dice is a floating sculpture of seven varied cubes, hand-projected orthographically in Canvas2D. Nearly transparent teal/coral ink planes, fine mint/coral contours and projected pip rings carry Bloom/Orbit’s spectral linework into recognizable cubes. A single faint pale-blue edge echo responds to treble; there are no opaque faces, black spots or decorative glow. Each cube has fixed 1–6 face-local pip layouts (opposite faces sum to seven); back faces are culled and visible faces are depth-sorted. Bass lifts/scales the cubes, mids tilt them, and treble shifts the pale-blue echo. Existing phase drives continuous tumbling; no randomness, wall-clock animation, physics engine, beat detection or BPM claim is involved. Geometry is bounded to 42 candidate faces, at most 21 visible faces and 12 vertices per pip, with no histories or feedback buffer. Reduced motion freezes rotation, tilt and bounce but retains live bass scaling and treble registration. Apple Music uses only deterministic playback position and holds when paused; seeks recompute directly. Dice shares the existing fullscreen cycle and five-second whole-frame transition. The native Visual style picker uses a menu for seven styles; Source remains segmented.

## Local FLAC files

Choose audio accepts `.flac` explicitly, including file managers reporting `audio/flac`, `audio/x-flac` or no MIME type. FLAC uses the same local audio element, Web Audio analyser, transport and visualization path as other local files; no upload, server conversion or extra decoder is added. Playback still depends on the browser/OS decoder and file encoding. A file the browser cannot decode uses the existing playback/read error state; try a supported browser or a WAV/MP3 copy. Physical iPhone playback remains unverified.

## Sample track

Click **So1loh — September 14** to start the full track without choosing a file. The source is `September 14.wav` from the external HDD Published directory; the original is untouched. The web copy is stereo MP3 at 192 kbps, encoded without source metadata. It streams from the same origin only after a click and is excluded from the PWA offline shell cache. Local files still remain on-device. The sample button is browser-only, not included in the native iPhone source UI.

## PWA

On HTTPS (or localhost), install SONORA from the browser's install UI; on iPhone/iPad use Share → Add to Home Screen. The app shell is precached for offline reopening, including an offline in-scope navigation, but selected local audio is never cached and must be chosen again after reopening. It also does not make remote audio, API requests, query URLs, or POST requests available offline.

Updates download in the background but wait until all SONORA windows are closed before applying, so playback is not interrupted. Reopen after closing all app windows to use an update. The native iOS `file://` shell intentionally does not start the service worker.

When changing a precached asset, bump the `CACHE` version in `sw.js` so existing installs receive the new shell. The cache holds application assets only, not uploaded or selected audio.

### Publish to the existing Cloudflare Pages project

```sh
bun checks/native-bridge-check.mjs && bun checks/pwa-check.mjs && bun checks/fullscreen-check.mjs && bun checks/dub-check.mjs && bun build.mjs
bunx wrangler pages deploy dist --project-name sonora-viz --branch main
```

`build.mjs` copies only the browser asset allowlist into `dist/`; iOS source, checks and repository metadata are not published. The existing project’s verified production branch is `main`.

## iPhone source app

`ios/SONORA.xcodeproj` is an iPhone target (iOS 17.4+) that bundles the repository-root `index.html` and `native-bridge.js` directly; there is one renderer, not a copied fork. Open it in Xcode, select a signing team and a unique bundle ID, then build:

```sh
xcodebuild -project ios/SONORA.xcodeproj -scheme SONORA -destination 'generic/platform=iOS' build
```

The source was prepared on Linux; Swift/Xcode compilation and iPhone hardware behavior have **not** been verified here.

- **Microphone:** input-only `AVAudioEngine` + Accelerate frequency bands, using the actual input sample rate and a calibrated sensitivity control. Audio is not monitored through SONORA. Test permission denial, headphones, route changes, interruptions, and background/foreground behavior on an iPhone.
- **Apple Music:** read-only system-player track metadata and playback position. The existing canvas draws deterministic art from playback time; it is not audio capture, FFT, BPM, or beat detection. Test authorization, pause/seek, and track changes with MusicKit/MediaPlayer on a device. This source does not claim Apple policy or distribution approval.
- **Spotify (optional metadata screen):** requires user-owned Spotify developer app setup; nothing is preconfigured. Set `SpotifyClientID` and `SpotifyRedirectURL` in `ios/SONORA/Info.plist` and replace the `webcredentials:example.com` placeholder in `ios/SONORA/SONORA.entitlements` with a domain you control. Register the exact HTTPS redirect in Spotify Dashboard, enable Associated Domains for the App ID, and serve a valid `apple-app-site-association` file for that app/domain. Apple requires the HTTPS callback host to be associated with the app; Spotify requires HTTPS (localhost is not allowed). The app uses PKCE S256, random state, and only `user-read-currently-playing`; tokens stay in memory and are cleared on disconnect. Spotify developer-mode testing is limited to the account owner (who needs Premium) and up to five allowlisted users; this does not grant public access or imply Spotify policy/commercial approval. Spotify is isolated from the visualizer and has no playback controls, audio analysis, or visual synchronization.

Run the executable checks with Bun:

```sh
bun checks/native-bridge-check.mjs
bun checks/pwa-check.mjs
bun checks/fullscreen-check.mjs
bun checks/dub-check.mjs
```

The native check executes the bundled renderer in a small DOM and verifies the native data boundary, source separation, Apple playback-time animation/pause/reduced-motion, and the original local-file flow. The PWA check executes the worker lifecycle and fetch handler with small mocks, verifies the manifest PNGs and precached assets, and exercises install/error UI states.
