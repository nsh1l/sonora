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

Open `http://localhost:4178`, choose an audio file, and use the Bloom, Orbit, Tide, Dub, Datamosh, Cymatic, Dice, or Velvet renderer. Use the stage’s top-right fullscreen button for an immersive visualizer; Escape or its minimal exit button returns to the controls. In fullscreen, swipe left for the next pattern or right for the previous; ArrowRight/ArrowLeft are keyboard alternatives. Pattern changes use a smooth five-second whole-frame crossfade, without tiled displacement or grid seams. Repeated swipes start from the currently visible blend; audio continues. Short/vertical/cancelled gestures are ignored. On each fullscreen entry, a faint bottom hint explains the horizontal swipe; it stays readable initially, then chromatically glitches and fades away by five seconds. It never intercepts gestures. Reduced motion keeps the fade but removes the glitch. Reduced motion switches immediately without the fade or glitch. Resize, fullscreen exit and loading a new track cancel stale transition frames. The server exposes the PWA shell, manifest, worker, and icons with correct MIME types.

Bloom keeps layered geometric petals and fine radial veins. Orbit keeps woven Lissajous trajectories and small orbiting points. Neither uses collage planes, negative-space cuts, sculptural plates or counterweights. Both reuse the existing audio bands and deterministic Apple timeline, with reduced motion preserving a still-phase composition.

Dub adds thick luminous ribbons, feedback trails, three delayed geometry taps (180/360/540 ms), bass-driven glow, and transient color separation. No full-screen strobe is used. Reduced motion disables feedback movement and transient color separation. Apple Music remains playback-position art, not audio analysis.

Datamosh is an original real-time Canvas2D P-frame-style reconstruction: a shared previous-frame buffer is displaced in bounded macroblocks, horizontal tears retain old image fragments, and 40–250 Hz rising-band events rebuild pigment islands. Bass drives vector displacement, mids bend the flow, and treble breaks up slices. It simulates datamoshing aesthetics; it does not corrupt or decode compressed video. The browser maps 40–250 Hz using the actual AudioContext sample rate; native microphone uses its existing 40–250 Hz bass band. A band rise of 0.035 above its 450 ms spectral envelope fires once (minimum magnitude 0.12), rearms when the rise falls to 0.01, and uses a 300 ms cooldown. This adaptive floor lets mastered tracks retrigger without needing a near-silent gap. Sustained notes, silence and procedural Apple bands never produce periodic refreshes. Initial/reduced-motion artwork is still seeded so the field is not blank. Reduced motion shows a static pigment composition without feedback/advection. Apple Music stays playback-position art, and a paused Apple timeline holds its frame.

Cymatic treats sound as a vibrating print plate: a bounded 96×96 analytical standing-wave field collects sand-like marks near its nodal lines. Bass and mids reshape the interference modes; treble pulls a cobalt-blue registration layer away from vermilion and chalk powder. The plate slowly tilts and its interference redistributes, without feedback trails or particle histories. This is Chladni-inspired generative art, not a physical simulation or measurement of actual resonances. Reduced motion freezes tilt/interference phase but retains real band response; Apple Music remains deterministic playback-position art and pauses with its timeline. Source switches and seeks cannot retain old particles because each field is rebuilt from current inputs. Cymatic joins the fullscreen swipe cycle and shared five-second whole-frame crossfade.

Dice is a floating sculpture of seven varied cubes, hand-projected orthographically in Canvas2D. Nearly transparent teal/coral ink planes, fine mint/coral contours and projected pip rings carry Bloom/Orbit’s spectral linework into recognizable cubes. A single faint pale-blue edge echo responds to treble; there are no opaque faces, black spots or decorative glow. Each cube has fixed 1–6 face-local pip layouts (opposite faces sum to seven); back faces are culled and visible faces are depth-sorted. Bass lifts/scales the cubes, mids tilt them, and treble shifts the pale-blue echo. Existing phase drives continuous tumbling; no randomness, wall-clock animation, physics engine, beat detection or BPM claim is involved. Geometry is bounded to 42 candidate faces, at most 21 visible faces and 12 vertices per pip, with no histories or feedback buffer. Reduced motion freezes rotation, tilt and bounce but retains live bass scaling and treble registration. Apple Music uses only deterministic playback position and holds when paused; seeks recompute directly. Dice shares the existing fullscreen cycle and five-second whole-frame transition. The native Visual style and Source pickers use menus.

Velvet extends the midnight/mint/coral world with local warm amber and rose, tuned for a slow, intimate Quiet Storm mood. **Velvet** layers four broad oblique velour-colored planes, each feathered with twelve nested 97-vertex contours and a broad radial light wash. Bass gently expands the planes; mids shift the coral/amber illumination; highs change only a subdued nap tint. Existing phase drives slow breathing and drift, with no outline sparks or flashes. Its fixed ceiling is 4,656 generated vertices, 52 translucent fills and four gradients per frame.

Velvet uses the existing phase/bands directly, so reduced motion freezes phase/drift but keeps gentle live band response; Apple Music is deterministic playback-position art that holds when paused. Resize, seek and source switches recompute without stale material state. It shares the existing fullscreen cycle and five-second whole-frame crossfade. Browser ID is `velvet`, also available in the native menu/allowlist. No cloth physics, isolated-vocal analysis, randomness, feedback buffer or frame histories are added.

## Credits

The subtle **Credits** button lives on the stage in both the browser and shared native HTML (not in the browser-only tools). It enters the existing document-root fullscreen visualizer, using CSS fullscreen when native fullscreen is unavailable or denied, and places centered credits in front of the live canvas with a restrained ink veil. Audio keeps playing; there is no additional player, AudioContext, timer or animation loop.

Only the text is filtered: SVG `feTurbulence` and `feDisplacementMap` bend glyph contours, not the dialog or Close button. A fixed noise seed and smoothly evolving spatial frequency avoid frame-random jitter. Existing bass/mid/high bands feed a 180 ms envelope, with displacement capped at 6 px and a padded filter region. Updates run inside the existing admitted draw path, so **24fps** also gates text deformation. Silence and browser pause settle to zero displacement; Reduced Motion removes deformation and noise drift completely. Native microphone uses real analyzed bands. Apple Music instead derives deterministic deformation from the existing playback-position art; a paused timeline holds it. This is not Apple audio FFT or beat detection. Source changes clear the envelope; no-source/Spotify metadata modes settle to static credits.

The labeled modal makes background controls inert, initially focuses **Close credits**, traps Tab/Shift+Tab on that sole control, and closes with Escape. Closing returns to the prior fullscreen mode and restores Credits-trigger focus; exiting native fullscreen also clears the dialog and deformation. Fullscreen exits, swipes and scene-arrow shortcuts cannot act behind the open dialog. The native bundle continues to use this same HTML; physical WKWebView/iPhone rendering and native fullscreen behavior remain unverified on Linux.

## 24fps

The **24fps** button is off by default: off uses the existing automatic `requestAnimationFrame` cadence. On limits visualization updates to approximately 24 per second using the rAF clock, independent of the display refresh rate. It does not detect a 24 Hz display, change audio playback, freeze animations, or enable Reduced Motion. Motion retains its elapsed-time speed; long stalls are bounded and missed frames are not replayed. Fullscreen crossfades still last five wall-clock seconds. Reduced Motion remains independent in either mode. The native iPhone source UI has a matching **24fps** toggle; its Swift/Xcode/device behavior remains unverified here. This session-only setting is not saved.

## Local audio formats

Choose audio explicitly includes MP3 (`.mp3`), raw AAC (`.aac`), AAC in MP4/M4A (`.m4a`, `.mp4`), PCM WAV (`.wav`, `.wave`), FLAC, Ogg Vorbis (`.ogg`, `.oga`), Ogg Opus (`.opus`) and WebM Opus (`.webm`, `.weba`). MIME aliases, blank MIME values and generic file-manager types share the same local audio-element, Web Audio analyser, seek and transport path; the picker filter is advisory, not a strict MIME validator. Files stay on-device and outside the PWA shell cache.

Actual synthetic files played in the verification Chromium: MP3, raw ADTS AAC, AAC-in-M4A, PCM16/PCM24 WAV, FLAC, Ogg Vorbis, Ogg Opus and WebM Opus. No extra library is necessary for those tested formats. Browser/OS decoders still determine availability: this is not a universal browser guarantee. M4A is a container, not a codec; ALAC-in-M4A failed in that Chromium and is **not** claimed supported. DRM-protected audio is not supported. Decode/unsupported-file errors suggest a PCM WAV or MP3 copy; network errors have separate guidance. Physical iPhone/Safari/Firefox playback remains unverified.

## Sample track

Click **So1loh — September 14** to start the full track without choosing a file. The source is `September 14.wav` from the external HDD Published directory; the original is untouched. The web copy is stereo MP3 at 192 kbps, encoded without source metadata. It streams from the same origin only after a click and is excluded from the PWA offline shell cache. Local files still remain on-device. The sample button is browser-only, not included in the native iPhone source UI.

## PWA

On HTTPS (or localhost), install SONORA from the browser's install UI; on iPhone/iPad use Share → Add to Home Screen. The app shell is precached for offline reopening, including an offline in-scope navigation, but selected local audio is never cached and must be chosen again after reopening. It also does not make remote audio, API requests, query URLs, or POST requests available offline.

Updates download in the background but wait until all SONORA windows are closed before applying, so playback is not interrupted. Reopen after closing all app windows to use an update. The native iOS `file://` shell intentionally does not start the service worker.

When changing a precached asset, bump the `CACHE` version in `sw.js` so existing installs receive the new shell. The cache holds application assets only, not uploaded or selected audio.

### Publish to the existing Cloudflare Pages project

```sh
bun checks/i18n-check.mjs && bun checks/native-bridge-check.mjs && bun checks/ios-release-prep-check.mjs && bun checks/pwa-check.mjs && bun checks/fullscreen-check.mjs && bun checks/dub-check.mjs && bun checks/credits-check.mjs && bun build.mjs
bunx wrangler pages deploy dist --project-name sonora-viz --branch main
```

`build.mjs` copies only the browser asset allowlist into `dist/`; iOS source, checks and repository metadata are not published. The existing project’s verified production branch is `main`.

## iPhone source app

`ios/SONORA.xcodeproj` is an iPhone target (iOS 17.4+) that bundles the repository-root `index.html`, `i18n.js` and `native-bridge.js` directly; there is one renderer, not a copied fork. The target uses bundle ID `party.alwaysyesterday.sonora`, version 1.0 (build 1), an opaque 1024 px icon derived from the existing SONORA motif, and `PrivacyInfo.xcprivacy`. Open it in Xcode, select a signing team for that bundle ID, then build:

```sh
xcodebuild -project ios/SONORA.xcodeproj -scheme SONORA -destination 'generic/platform=iOS' build
```

The source was prepared on Linux; Swift/Xcode compilation and iPhone hardware behavior have **not** been verified here. The `feat/ios-release-prep` workflow runs on `macos-latest` by manual dispatch or relevant branch pushes, requires iOS SDK 26+, and uploads the build log plus an explicitly **unsigned, non-installable** `.xcarchive`. It does not sign, distribute, or submit the app. A physical iPhone pass, signing setup, App Store privacy review, and distribution review remain release gates.

- **Local File:** choose Local File in the SwiftUI Source menu, then use the file chooser, Play/Pause, and seek rail shown in the WKWebView. It uses the existing browser audio element and Web Audio analyser. Selection is user initiated; the object URL and playback are cleared when leaving Local File or destroying the renderer. File decoding and the iOS picker still need device verification.

- **Microphone:** input-only `AVAudioEngine` + Accelerate frequency bands, using the actual input sample rate and a calibrated sensitivity control. Audio is not monitored through SONORA. Test permission denial, headphones, route changes, interruptions, and background/foreground behavior on an iPhone.
- **Apple Music:** read-only system-player track metadata and playback position. The existing canvas draws deterministic art from playback time; it is not audio capture, FFT, BPM, or beat detection. Test authorization, pause/seek, and track changes with MusicKit/MediaPlayer on a device. This source does not claim Apple policy or distribution approval.
- **Spotify (optional metadata screen):** hidden until a developer supplies `SpotifyClientID` and `SpotifyRedirectURL` in `ios/SONORA/Info.plist`. No associated-domain entitlement is shipped. To enable the HTTPS callback, configure the matching `applinks:` Associated Domain for a domain you control, register the exact redirect in Spotify Dashboard, and serve a valid `apple-app-site-association` file. Spotify requires HTTPS (localhost is not allowed). The app uses PKCE S256, random state, and only `user-read-currently-playing`; tokens stay in memory and are cleared on disconnect. Developer-mode eligibility and Spotify policy must be checked before enabling it for distribution. Spotify is isolated from the visualizer and has no playback controls, audio analysis, or visual synchronization.

Public [Privacy](https://sonora.alwaysyesterday.party/privacy.html) and [Support](https://sonora.alwaysyesterday.party/support.html) pages are part of the browser build and offline shell. Support points to [GitHub Issues](https://github.com/nsh1l/sonora/issues). These URLs become live only after a separate website deployment.

Run the executable checks with Bun:

```sh
bun checks/i18n-check.mjs
bun checks/native-bridge-check.mjs
bun checks/ios-release-prep-check.mjs
bun checks/pwa-check.mjs
bun checks/fullscreen-check.mjs
bun checks/dub-check.mjs
bun checks/credits-check.mjs
```

The native check executes the bundled renderer in a small DOM and verifies the native data boundary, source separation, Apple playback-time animation/pause/reduced-motion, and the original local-file flow. The PWA check executes the worker lifecycle and fetch handler with small mocks, verifies the manifest PNGs and precached assets, and exercises install/error UI states.

## English-first i18n

The shared web/native renderer uses one English dictionary in `i18n.js`, loaded as a classic script before the bridge and renderer (including native `file://`). `window.SONORA_I18N.t(key, params)` returns plain text; unknown keys remain literal and missing `{name}` parameters remain visible. Static `data-i18n` text and `data-i18n-aria-label` attributes retain usable English HTML before JavaScript. Split heading/hint spans preserve their existing line breaks; translations never use `innerHTML`. The HTML and manifest declare `en`.

Keys cover owned browser UI copy, accessibility labels, credits headings/actions, playback errors/states, native bridge defaults and PWA install/offline/update states. The Privacy and Support footer links are also keyed in the shared catalog; their native SwiftUI counterparts use the English source `ios/SONORA/en.lproj/Localizable.strings`, registered as a native localization resource. The credits title retains SONORA’s exact brand spelling; the credited person/team names remain literal data. Brand identifiers, pattern proper names/IDs, 24fps, sample attribution, user filenames, artist metadata, times and external native status strings are data, not translation keys. External status/metadata still use `textContent`. Only these two added native navigation labels have an explicit native localization resource; other native SwiftUI source labels retain their English LocalizedStringKey defaults.

There is no Japanese locale, language picker, locale storage, URL routing, browser-language guessing, runtime fetch or dependency. A future locale should supply the same plain-text keys/placeholders and an explicit locale selection contract; update static fallbacks and manifest language together. Current key types are plain text or parameterized plain text, plus the explicit ARIA-label binding—no HTML, pluralization or locale-aware date/number formatting.

`bun checks/i18n-check.mjs` checks key coverage, static English fallbacks, safe DOM application/interpolation, shared packaging and language declarations. Run all retained checks and `bun build.mjs` using the commands above; browser/device verification remains separate.
