import SwiftUI

@main struct SONORAApp: App {
  @StateObject private var spotify = SpotifyClient()
  var body: some Scene { WindowGroup { RootView().environmentObject(spotify) } }
}

struct RootView: View {
  @EnvironmentObject var spotify: SpotifyClient
  @State private var showingSpotify = false
  @State private var mode: RendererMode = .idle
  @State private var sensitivity = 1.0
  @State private var style = "bloom"
  @State private var previousMode: RendererMode = .idle
  var body: some View {
    RendererHost(mode: mode, sensitivity: sensitivity, style: style)
      .safeAreaInset(edge: .bottom) {
        VStack(spacing: 8) {
          Picker("Source", selection: $mode) { Text("Choose source").tag(RendererMode.idle); Text("Microphone").tag(RendererMode.microphone); Text("Apple Music").tag(RendererMode.apple); Text("Spotify").tag(RendererMode.spotify) }.pickerStyle(.segmented)
          if mode == .microphone { HStack { Text("Mic sensitivity"); Slider(value: $sensitivity, in: 0.5...3, step: 0.1).accessibilityLabel("Microphone sensitivity") }.font(.caption) }
          Picker("Visual style", selection: $style) { Text("Bloom").tag("bloom"); Text("Orbit").tag("orbit"); Text("Tide").tag("tide"); Text("Dub").tag("dub") }.pickerStyle(.segmented)
        }.padding().background(.ultraThinMaterial)
      }
      .onChange(of: mode) { _, next in if next == .spotify { previousMode = previousMode == .spotify ? .idle : previousMode; showingSpotify = true } else { previousMode = next } }
      .sheet(isPresented: $showingSpotify, onDismiss: { spotify.disconnect(); if mode == .spotify { mode = previousMode } }) { SpotifyMetadataView().environmentObject(spotify) }
  }
}
extension Notification.Name { static let sonoraApple = Notification.Name("sonora.apple") }
