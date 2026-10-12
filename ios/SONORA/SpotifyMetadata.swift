import SwiftUI
import AuthenticationServices
import CryptoKit

@MainActor final class SpotifyClient: NSObject, ObservableObject {
  @Published var message = "Connect Spotify to display the currently playing track."
  @Published var track: SpotifyTrack?
  private var session: ASWebAuthenticationSession?
  private var task: Task<Void, Never>?
  private var token: String?
  private var state = ""
  private var verifier = ""
  private var generation = 0
  private var requestID = 0
  private var retryAfter = Date.distantPast
  private var clientID: String { Bundle.main.object(forInfoDictionaryKey: "SpotifyClientID") as? String ?? "" }
  private var redirect: URL? { URL(string: Bundle.main.object(forInfoDictionaryKey: "SpotifyRedirectURL") as? String ?? "") }

  func connect() {
    disconnect()
    guard !clientID.isEmpty, let redirect, redirect.scheme == "https", let host = redirect.host,
          host != "example.invalid", !host.contains("$("), !redirect.path.isEmpty,
          redirect.user == nil, redirect.password == nil, redirect.port == nil,
          redirect.query == nil, redirect.fragment == nil else {
      message = "Configure SpotifyClientID and SPOTIFY_CALLBACK_HOST, then register the HTTPS redirect URL and associated domain."
      return
    }
    let expected = generation
    state = random(32)
    verifier = random(64)
    var components = URLComponents(string: "https://accounts.spotify.com/authorize")!
    components.queryItems = [
      URLQueryItem(name: "client_id", value: clientID),
      URLQueryItem(name: "response_type", value: "code"),
      URLQueryItem(name: "redirect_uri", value: redirect.absoluteString),
      URLQueryItem(name: "scope", value: "user-read-currently-playing"),
      URLQueryItem(name: "state", value: state),
      URLQueryItem(name: "code_challenge_method", value: "S256"),
      URLQueryItem(name: "code_challenge", value: Data(SHA256.hash(data: Data(verifier.utf8))).base64URL)
    ]
    let auth = ASWebAuthenticationSession(url: components.url!, callback: .https(host: host, path: redirect.path)) { [weak self] url, error in
      Task { @MainActor in
        guard let self, expected == self.generation else { return }
        self.session = nil
        guard error == nil, let url else { self.message = "Spotify authorization was cancelled or failed."; return }
        self.accept(url, redirect: redirect, expected: expected)
      }
    }
    auth.presentationContextProvider = self
    auth.prefersEphemeralWebBrowserSession = true
    session = auth
    message = "Waiting for Spotify authorization…"
    if !auth.start() { session = nil; message = "Spotify authorization could not start." }
  }

  private func accept(_ url: URL, redirect: URL, expected: Int) {
    guard url.scheme == redirect.scheme, url.host == redirect.host, url.port == redirect.port,
          url.path == redirect.path, url.user == nil, url.password == nil, url.fragment == nil,
          let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
      message = "Rejected Spotify callback."
      return
    }
    let items = components.queryItems ?? []
    guard Set(items.map(\.name)).count == items.count, !state.isEmpty,
          items.first(where: { $0.name == "state" })?.value == state,
          items.first(where: { $0.name == "error" }) == nil,
          let code = items.first(where: { $0.name == "code" })?.value, !code.isEmpty else {
      message = "Spotify denied access or returned an invalid authorization response."
      return
    }
    state = "" // Accept each authorization callback only once.
    let codeVerifier = verifier
    verifier = ""
    task = Task { [weak self] in
      guard let self else { return }
      var request = URLRequest(url: URL(string: "https://accounts.spotify.com/api/token")!)
      request.httpMethod = "POST"
      request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
      let values = ["grant_type": "authorization_code", "code": code, "redirect_uri": redirect.absoluteString, "client_id": self.clientID, "code_verifier": codeVerifier]
      request.httpBody = values.map { "\($0.key.formEncoded)=\($0.value.formEncoded)" }.joined(separator: "&").data(using: .utf8)
      do {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard !Task.isCancelled, self.generation == expected else { return }
        guard let http = response as? HTTPURLResponse, http.statusCode == 200,
              let object = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let accessToken = object["access_token"] as? String, !accessToken.isEmpty,
              let type = object["token_type"] as? String, type.lowercased() == "bearer" else {
          self.message = "Spotify token exchange failed. Reconnect to try again."
          return
        }
        self.token = accessToken
        self.fetch()
      } catch {
        guard !Task.isCancelled, self.generation == expected else { return }
        self.message = "Spotify token exchange failed due to a network or response error."
      }
    }
  }

  func fetch() {
    guard let token else { message = "Connect Spotify first."; return }
    guard Date() >= retryAfter else { message = "Spotify asked us to wait. Retry after \(retryAfter.formatted(date: .omitted, time: .standard))."; return }
    task?.cancel()
    requestID += 1
    let expected = generation, expectedRequest = requestID
    task = Task { [weak self] in
      guard let self else { return }
      var request = URLRequest(url: URL(string: "https://api.spotify.com/v1/me/player/currently-playing")!)
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
      do {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard !Task.isCancelled, self.generation == expected, self.requestID == expectedRequest else { return }
        self.track = nil
        guard let http = response as? HTTPURLResponse else { self.message = "Invalid Spotify response."; return }
        switch http.statusCode {
        case 204: self.message = "Nothing is currently playing."; return
        case 401: self.token = nil; self.message = "Spotify authorization expired. Reconnect."; return
        case 403: self.message = "Spotify access is forbidden. Check the developer account Premium subscription and user allowlist."; return
        case 429:
          if let value = http.value(forHTTPHeaderField: "Retry-After"), let seconds = TimeInterval(value), seconds.isFinite, seconds > 0 {
            self.retryAfter = Date().addingTimeInterval(seconds)
          }
          self.message = "Spotify rate limited this request. Wait before refreshing."
          return
        case 200: break
        default: self.message = "Spotify returned HTTP \(http.statusCode)."; return
        }
        guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let item = root["item"] as? [String: Any], let name = item["name"] as? String,
              let links = item["external_urls"] as? [String: String], let link = links["spotify"],
              let url = URL(string: link), url.scheme == "https", url.host == "open.spotify.com",
              url.user == nil, url.password == nil, url.port == nil else {
          self.message = "No supported track metadata was returned."
          return
        }
        let artists = (item["artists"] as? [[String: Any]])?.compactMap { $0["name"] as? String }.joined(separator: ", ") ?? ""
        self.track = SpotifyTrack(name: name, artists: artists, url: url)
        self.message = "Metadata only. No audio analysis, playback control, or visual synchronization. Refresh to update."
      } catch {
        guard !Task.isCancelled, self.generation == expected, self.requestID == expectedRequest else { return }
        self.track = nil
        self.message = "Spotify request failed due to a network or response error."
      }
    }
  }

  func disconnect() {
    generation += 1
    task?.cancel()
    session?.cancel()
    task = nil
    session = nil
    token = nil
    track = nil
    state = ""
    verifier = ""
    retryAfter = .distantPast
    message = "Disconnected. Tokens and track data were kept only in memory."
  }

  private func random(_ count: Int) -> String { Data((0..<count).map { _ in UInt8.random(in: 0...255) }).base64URL }
}

extension SpotifyClient: ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    return UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.flatMap { $0.windows }.first(where: { $0.isKeyWindow }) ?? UIWindow(frame: .zero)
  }
}

struct SpotifyTrack { let name: String; let artists: String; let url: URL }
struct SpotifyMetadataView: View {
  @Environment(\.dismiss) private var dismiss
  @EnvironmentObject var spotify: SpotifyClient
  var body: some View {
    NavigationStack {
      VStack(spacing: 18) {
        Text(spotify.message).multilineTextAlignment(.center).accessibilityAddTraits(.updatesFrequently)
        if let track = spotify.track {
          Text(track.name).font(.headline)
          Text(track.artists)
          Link("Open in Spotify", destination: track.url)
        }
        Button("Connect Spotify", action: spotify.connect)
        Button("Refresh", action: spotify.fetch)
        Button("Disconnect", role: .destructive, action: spotify.disconnect)
        Spacer()
        Link("Provided by Spotify", destination: URL(string: "https://open.spotify.com")!).font(.footnote)
      }
      .padding()
      .navigationTitle("Spotify metadata")
      .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
    }
  }
}

private extension String {
  var formEncoded: String { addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")) ?? "" }
}
private extension Data {
  var base64URL: String { base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "") }
}
