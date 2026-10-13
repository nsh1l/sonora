import SwiftUI
import UIKit
import WebKit
import MediaPlayer
import AVFoundation
import Accelerate

enum RendererMode: Hashable { case idle, microphone, apple, spotify }

struct RendererHost: UIViewControllerRepresentable {
  let mode: RendererMode
  let sensitivity: Double
  let style: String

  func makeUIViewController(context: Context) -> RendererController { RendererController() }
  func updateUIViewController(_ controller: RendererController, context: Context) {
    controller.loadViewIfNeeded()
    controller.setSensitivity(sensitivity)
    controller.setStyle(style)
    controller.setMode(mode)
  }
  static func dismantleUIViewController(_ controller: RendererController, coordinator: ()) {
    controller.shutdown()
  }
}

final class RendererController: UIViewController, WKNavigationDelegate {
  private let web = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
  private let audio = MicrophoneAnalyzer()
  private let player = MPMusicPlayerController.systemMusicPlayer
  private var mode: RendererMode = .idle
  private var generation = 0
  private var style = "bloom"
  private var timer: Timer?
  private var observers: [NSObjectProtocol] = []
  private var active = false
  private var interrupted = false
  private var appleAuthorized = false
  private var pageReady = false
  private var pending: [String: Any] = ["mode": "none", "generation": 0, "status": "Choose a source to begin."]

  override func viewDidLoad() {
    super.viewDidLoad()
    active = UIApplication.shared.applicationState == .active
    web.navigationDelegate = self
    web.isOpaque = true
    web.backgroundColor = .black
    view.addSubview(web)
    web.frame = view.bounds
    web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    if let url = Bundle.main.url(forResource: "index", withExtension: "html") {
      web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }
    // ponytail: 20 Hz foreground snapshots, lower this rate if measured battery use warrants it.
    timer = Timer.scheduledTimer(withTimeInterval: 1.0 / 20, repeats: true) { [weak self] _ in
      self?.bridge()
    }
    observe(UIApplication.willResignActiveNotification) { [weak self] _ in self?.suspend() }
    observe(UIApplication.didBecomeActiveNotification) { [weak self] _ in self?.resume() }
    observe(AVAudioSession.interruptionNotification) { [weak self] note in self?.handleInterruption(note) }
    observe(AVAudioSession.routeChangeNotification) { [weak self] note in self?.handleRouteChange(note) }
  }

  private func observe(_ name: Notification.Name, handler: @escaping (Notification) -> Void) {
    observers.append(NotificationCenter.default.addObserver(forName: name, object: nil, queue: .main, using: handler))
  }

  deinit { shutdown() }
  func shutdown() {
    timer?.invalidate()
    timer = nil
    audio.stop()
    observers.forEach { NotificationCenter.default.removeObserver($0) }
    observers.removeAll()
  }

  func setSensitivity(_ value: Double) { audio.setSensitivity(value) }
  func setStyle(_ value: String) {
    guard ["bloom", "orbit", "tide", "dub", "datamosh"].contains(value) else { return }
    style = value
    if pageReady { web.callAsyncJavaScript("window.SONORA.setStyle(style)", arguments: ["style": style], in: nil, in: .page) { _ in } }
  }

  func setMode(_ next: RendererMode) {
    guard mode != next else { return }
    generation += 1
    audio.stop()
    interrupted = false
    appleAuthorized = false
    mode = next
    switch mode {
    case .idle: clear("Choose a source to begin.")
    case .microphone:
      clear("Starting microphone input…")
      beginMic()
    case .apple:
      clear("Requesting Apple Music library access…")
      requestApplePermission()
    case .spotify:
      send(["mode": "spotify", "generation": generation])
    }
  }

  private func beginMic() {
    guard active, !interrupted, mode == .microphone else { return }
    let expected = generation
    let session = AVAudioSession.sharedInstance()
    switch session.recordPermission {
    case .granted: startMic(expected)
    case .undetermined:
      session.requestRecordPermission { [weak self] granted in
        DispatchQueue.main.async {
          guard let self, self.mode == .microphone, expected == self.generation else { return }
          if granted { self.startMic(expected) }
          else { self.clear("Microphone permission was denied. Enable it in Settings.") }
        }
      }
    case .denied: clear("Microphone permission was denied. Enable it in Settings.")
    @unknown default: clear("Microphone permission is unavailable.")
    }
  }

  private func startMic(_ expected: Int) {
    guard active, !interrupted, mode == .microphone, generation == expected else { return }
    do { try audio.start() }
    catch {
      audio.stop()
      clear("Couldn’t start microphone input: \(error.localizedDescription)")
    }
  }

  private func requestApplePermission() {
    guard mode == .apple else { return }
    if MPMediaLibrary.authorizationStatus() == .authorized {
      appleAuthorized = true
      return
    }
    MPMediaLibrary.requestAuthorization { [weak self] status in
      DispatchQueue.main.async {
        guard let self, self.mode == .apple else { return }
        self.appleAuthorized = status == .authorized
        if !self.appleAuthorized { self.clear("Apple Music library access was denied. Enable it in Settings.") }
      }
    }
  }

  private func suspend() {
    active = false
    generation += 1
    timer?.fireDate = .distantFuture
    audio.stop()
    if mode != .spotify { clear("Paused while SONORA is inactive.") }
  }

  private func resume() {
    active = true
    timer?.fireDate = .distantPast
    if mode == .microphone { beginMic() }
    if mode == .apple { requestApplePermission() }
  }

  private func handleInterruption(_ note: Notification) {
    guard mode == .microphone,
          let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: raw) else { return }
    if type == .began {
      interrupted = true
      generation += 1
      audio.stop()
      clear("Microphone input was interrupted.")
    } else {
      let options = AVAudioSession.InterruptionOptions(rawValue: (note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt) ?? 0)
      interrupted = !options.contains(.shouldResume)
      if !interrupted { beginMic() }
      else { clear("Microphone paused. Choose another source, then Microphone, to restart.") }
    }
  }

  private func handleRouteChange(_ note: Notification) {
    guard active, !interrupted, mode == .microphone,
          let raw = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: raw),
          reason == .oldDeviceUnavailable || reason == .newDeviceAvailable else { return }
    generation += 1
    audio.stop()
    clear("Audio route changed. Restarting microphone…")
    beginMic()
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    pageReady = true
    web.callAsyncJavaScript("window.SONORA.setShell(); window.SONORA.setStyle(style); window.SONORA.setPayload(payload)", arguments: ["style": style, "payload": pending], in: nil, in: .page) { _ in }
  }

  func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
    guard let url = action.request.url else { decisionHandler(.cancel); return }
    let bundlePath = Bundle.main.bundleURL.standardizedFileURL.path + "/"
    let local = url.isFileURL && url.standardizedFileURL.path.hasPrefix(bundlePath)
    decisionHandler(local || url.absoluteString == "about:blank" ? .allow : .cancel)
  }

  private func bridge() {
    guard active else { return }
    switch mode {
    case .idle, .spotify: return
    case .microphone:
      guard audio.isRunning else { return }
      let snapshot = audio.snapshot()
      send(["mode": "microphone", "bands": snapshot.bands, "rms": snapshot.rms,
            "timeline": ["playing": true, "position": 0, "duration": 0, "track": ""], "generation": generation])
    case .apple:
      guard appleAuthorized else { return }
      guard let item = player.nowPlayingItem else { clear("Apple Music has no current item."); return }
      let duration = item.playbackDuration
      let position = player.currentPlaybackTime
      guard duration.isFinite, duration > 0, position.isFinite, position >= 0 else {
        clear("Apple Music has no valid playback timeline.")
        return
      }
      send(["mode": "apple", "bands": [0, 0, 0], "rms": 0,
            "title": item.title ?? "", "artist": item.artist ?? "",
            "timeline": ["playing": player.playbackState == .playing, "position": min(position, duration), "duration": duration, "track": String(item.persistentID)],
            "generation": generation])
    }
  }

  private func clear(_ status: String) { send(["mode": "none", "status": status, "generation": generation]) }
  private func send(_ value: [String: Any]) {
    guard JSONSerialization.isValidJSONObject(value) else { return }
    pending = value
    guard pageReady else { return }
    web.callAsyncJavaScript("window.SONORA.setPayload(payload)", arguments: ["payload": value], in: nil, in: .page) { _ in }
  }
}

final class MicrophoneAnalyzer {
  struct Snapshot { var bands: [Double] = [0, 0, 0]; var rms: Double = 0 }
  private let engine = AVAudioEngine()
  // ponytail: one lock protects the tap snapshot; keep this until measured audio deadline misses require a lock-free handoff.
  private let lock = NSLock()
  private let setup = vDSP_DFT_zop_CreateSetup(nil, 1024, .FORWARD)
  private var latest = Snapshot()
  private var sensitivity = 1.0
  private var installedTap = false
  private var sessionActive = false
  private var epoch = 0
  private var running = false
  private var real = [Float](repeating: 0, count: 1024)
  private var imag = [Float](repeating: 0, count: 1024)
  private var outR = [Float](repeating: 0, count: 1024)
  private var outI = [Float](repeating: 0, count: 1024)

  deinit { if let setup { vDSP_DFT_DestroySetup(setup) } }
  var isRunning: Bool { lock.lock(); defer { lock.unlock() }; return running }

  func start() throws {
    if isRunning { return }
    guard setup != nil else { throw NSError(domain: "SONORA", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not create the audio transform."]) }
    let session = AVAudioSession.sharedInstance()
    // Input-only tap; nothing is connected to output. Preserve other apps' playback.
    try session.setCategory(.record, mode: .measurement, options: [.mixWithOthers])
    try session.setActive(true)
    sessionActive = true
    do {
      let input = engine.inputNode
      let format = input.outputFormat(forBus: 0)
      guard format.commonFormat == .pcmFormatFloat32, format.sampleRate.isFinite, format.sampleRate > 0, format.channelCount > 0 else {
        throw NSError(domain: "SONORA", code: 2, userInfo: [NSLocalizedDescriptionKey: "No usable microphone input route."])
      }
      lock.lock()
      epoch += 1
      let expected = epoch
      running = true
      latest = Snapshot()
      lock.unlock()
      input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in self?.analyze(buffer, expected: expected) }
      installedTap = true
      engine.prepare()
      try engine.start()
    } catch { stop(); throw error }
  }

  func stop() {
    lock.lock()
    running = false
    epoch += 1
    latest = Snapshot()
    lock.unlock()
    if installedTap { engine.inputNode.removeTap(onBus: 0); installedTap = false }
    engine.stop()
    if sessionActive {
      try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
      sessionActive = false
    }
  }

  func snapshot() -> Snapshot { lock.lock(); defer { lock.unlock() }; return latest }
  func setSensitivity(_ value: Double) {
    guard value.isFinite else { return }
    lock.lock()
    sensitivity = min(3, max(0.5, value))
    lock.unlock()
  }

  private func analyze(_ buffer: AVAudioPCMBuffer, expected: Int) {
    let sampleRate = buffer.format.sampleRate
    guard sampleRate.isFinite, sampleRate > 0, buffer.frameLength > 0, let samples = buffer.floatChannelData?[0], let setup else { return }
    lock.lock()
    defer { lock.unlock() }
    guard running, epoch == expected else { return }
    let count = min(Int(buffer.frameLength), 1024)
    real.withUnsafeMutableBufferPointer { r in
      imag.withUnsafeMutableBufferPointer { i in
        outR.withUnsafeMutableBufferPointer { outputReal in
          outI.withUnsafeMutableBufferPointer { outputImag in
            for x in 0..<1024 {
              let sample = x < count && samples[x].isFinite ? samples[x] : 0
              r[x] = sample * Float(0.5 - 0.5 * cos(2 * Double.pi * Double(x) / 1023))
              i[x] = 0
            }
            vDSP_DFT_Execute(setup, r.baseAddress!, i.baseAddress!, outputReal.baseAddress!, outputImag.baseAddress!)
          }
        }
      }
    }
    var energy = 0.0
    for x in 0..<count { let sample = Double(samples[x]); if sample.isFinite { energy += sample * sample } }
    func band(_ low: Double, _ high: Double) -> Double {
      let first = max(1, Int(low * 1024 / sampleRate))
      let last = min(512, Int(high * 1024 / sampleRate))
      guard last > first else { return 0 }
      var power = 0.0
      for bin in first..<last {
        let magnitude = Double(hypot(outR[bin], outI[bin]))
        power += magnitude * magnitude
      }
      // Hann coherent gain is ~0.5; RMS across the band avoids dependence on its bin count.
      return min(1, sqrt(power / Double(last - first)) / 256 * sensitivity)
    }
    latest = Snapshot(bands: [band(40, 250), band(250, 2000), band(2000, min(12000, sampleRate / 2))], rms: min(1, sqrt(energy / Double(count)) * sensitivity))
  }
}
