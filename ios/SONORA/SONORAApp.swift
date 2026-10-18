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
  @State private var use24fps = false
  @State private var previousMode: RendererMode = .idle
  var body: some View {
    RendererHost(mode: mode, sensitivity: sensitivity, style: style, frameRate: use24fps ? 24 : 0)
      .safeAreaInset(edge: .bottom) {
        VStack(spacing: 8) {
          Picker("Source", selection: $mode) { Text("Choose source").tag(RendererMode.idle); Text("Local File").tag(RendererMode.local); Text("Microphone").tag(RendererMode.microphone); Text("Apple Music").tag(RendererMode.apple); if spotify.isConfigured { Text("Spotify").tag(RendererMode.spotify) } }.pickerStyle(.menu)
          if mode == .microphone { HStack { Text("Mic sensitivity"); Slider(value: $sensitivity, in: 0.5...3, step: 0.1).accessibilityLabel("Microphone sensitivity") }.font(.caption) }
          Picker("Visual style", selection: $style) { Text("Bloom").tag("bloom"); Text("Orbit").tag("orbit"); Text("Tide").tag("tide"); Text("Dub").tag("dub"); Text("Mosh").tag("datamosh"); Text("Cymatic").tag("cymatic"); Text("Dice").tag("dice"); Text("Velvet").tag("velvet") }.pickerStyle(.menu)
          Toggle("24fps", isOn: $use24fps)
          HStack(spacing: 20) {
            Link("Privacy", destination: URL(string: "https://sonora.alwaysyesterday.party/privacy.html")!)
            Link("Support", destination: URL(string: "https://sonora.alwaysyesterday.party/support.html")!)
          }.font(.caption)
        }.padding().background(.ultraThinMaterial)
      }
      .onChange(of: mode) { _, next in if next == .spotify { previousMode = previousMode == .spotify ? .idle : previousMode; showingSpotify = true } else { previousMode = next } }
      .sheet(isPresented: $showingSpotify, onDismiss: { spotify.disconnect(); if mode == .spotify { mode = previousMode } }) { SpotifyMetadataView().environmentObject(spotify) }
  }
}
extension Notification.Name { static let sonoraApple = Notification.Name("sonora.apple") }
