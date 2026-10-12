# Product

<!-- impeccable:product-schema 1 -->

## Platform

Browser prototype and source-only native iPhone app (iOS 17.4+).

## Stack

Browser-native static HTML/CSS/JS and Web Audio; SwiftUI shell, AVAudioEngine/Accelerate microphone analysis, MediaPlayer playback metadata, and bundled WKWebView renderer. No JS package installation is needed.

## Users

Listeners who want an original generative visual companion to live sound or Apple Music playback.

## Product Purpose

An artistic audio visualizer inspired by expressive, music-reactive instruments. Success means the existing Bloom, Orbit, and Tide artwork can respond locally to a live microphone, or evolve procedurally from Apple Music playback position.

## Positioning

An independent generative visual instrument, not a conventional equalizer or a reproduction of SoundSpectrum G-Force.

## Capabilities and Constraints

- The browser keeps the user-selected local-file workflow; audio is processed on-device and not uploaded.
- iPhone microphone input is analyzed locally into frequency bands. SONORA does not monitor microphone audio through speakers.
- Apple Music contributes the system player's current item and playback position only. The resulting drawing is procedural time-based art, not stream capture, audio-spectrum analysis, BPM, or beat detection.
- Spotify is an optional isolated metadata view with attribution and an outbound Spotify link; it does not control playback, analyze audio, or synchronize visuals. A Spotify developer app, redirect domain/associated-domain setup, and account eligibility are user-configured prerequisites.
- No blanket Apple Music or Spotify policy, rights, or App Store approval is claimed. The native target has source-level checks, but Swift/Xcode compilation and physical-device behavior remain unverified until run on a Mac and iPhone.

## Evidence on Hand

The visual renderer already exists in the browser prototype. No user-provided brand assets, audio samples, or rights evidence are included.

## Product Principles

- Let the visual work lead.
- Make source, playback, and permissions obvious.
- Keep local and microphone audio on-device.
- Be exact about whether a visual is audio-reactive or only playback-position-reactive.
- Do not imply affiliation with or copy proprietary G-Force assets.
