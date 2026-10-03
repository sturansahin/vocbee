import ExpoModulesCore
import Foundation
import MachO
import ObjectiveC
import UIKit

private let bridgeVersion = 1
private let eventName = "onGameEvent"
private let maxJSONBytes = 64 * 1024
private let unityUnavailable = "UNITY_RUNTIME_UNAVAILABLE"
private let unityGameEventNotification = Notification.Name("VocbeeUnityGameEvent")
private let unityFrameworkName = "UnityFramework.framework"
private let unityFrameworkClassName = "UnityFramework"
private let unityDataBundleId = "com.unity3d.framework"
private let unityGameObject = "VocbeeGameBridge"
private let unityLoadSessionMethod = "LoadSessionJson"

public final class VocbeeUnityModule: Module {
  fileprivate static weak var activeModule: VocbeeUnityModule?
  private let unityHost = VocbeeUnityHost()
  private var unityEventObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("VocbeeUnity")
    Events(eventName)

    OnCreate {
      VocbeeUnityModule.activeModule = self
      unityEventObserver = NotificationCenter.default.addObserver(
        forName: unityGameEventNotification,
        object: nil,
        queue: nil
      ) { notification in
        VocbeeUnityModule.emitFromUnity(notification.userInfo?["json"] as? String ?? "")
      }
    }

    OnDestroy {
      if let unityEventObserver {
        NotificationCenter.default.removeObserver(unityEventObserver)
        self.unityEventObserver = nil
      }
      DispatchQueue.main.async { [unityHost = self.unityHost] in
        unityHost.deactivate()
      }
      if VocbeeUnityModule.activeModule === self {
        VocbeeUnityModule.activeModule = nil
      }
    }

    AsyncFunction("getGameInfo") {
      gameInfo(runtimeAvailable: unityHost.isRuntimeAvailable)
    }

    AsyncFunction("openGame") { (sessionJson: String, promise: Promise) in
      guard isJSONObject(sessionJson) else {
        promise.resolve(failure(
          code: "INVALID_SESSION_JSON",
          message: "sessionJson must contain one JSON object up to 64 KiB."
        ))
        return
      }
      unityHost.open(sessionJson: sessionJson, promise: promise)
    }.runOnQueue(.main)

    AsyncFunction("unloadGame") {
      unityHost.returnToHost()
    }.runOnQueue(.main)
  }

  fileprivate static func emitFromUnity(_ eventJson: String) {
    let parsed = parseJSONObject(eventJson)
    let payload =
      parsed == nil
      ? "{\"type\":\"error\",\"code\":\"INVALID_EVENT_JSON\"}"
      : eventJson
    let eventType = parsed?["type"] as? String

    guard let module = activeModule else {
      return
    }
    DispatchQueue.main.async { [weak module] in
      guard let module else {
        return
      }
      module.sendEvent(eventName, ["json": payload])
      if eventType == "ready", !module.unityHost.handleReady() {
        module.sendEvent(
          eventName,
          ["json": "{\"type\":\"error\",\"code\":\"UNITY_MESSAGE_FAILED\"}"]
        )
        _ = module.unityHost.returnToHost()
      } else if eventType == "sessionReady", parsed?["bridgeVersion"] as? Int == bridgeVersion {
        module.unityHost.handleSessionReady(parsed?["sessionId"] as? String)
      } else if eventType == "error" {
        module.unityHost.handleLaunchError(
          sessionId: parsed?["sessionId"] as? String,
          code: parsed?["code"] as? String ?? "UNITY_LAUNCH_FAILED"
        )
      } else if eventType == "finished" {
        module.unityHost.scheduleReturnToHostAfterEvent(sessionId: parsed?["sessionId"] as? String)
      }
    }
  }
}

private final class VocbeeUnityHost: NSObject {
  private weak var hostWindow: UIWindow?
  private var frameworkBundle: Bundle?
  private var framework: NSObject?
  private var pendingSessionJson: String?
  private var unityReady = false
  private var returnScheduled = false
  private var lifecycleGeneration = 0
  private var listenerRegistered = false
  private var launchPromise: Promise?
  private var launchSessionId: String?
  private var launchTimeout: DispatchWorkItem?
  private var loadingWindow: UIWindow?

  var isRuntimeAvailable: Bool {
    if NSClassFromString(unityFrameworkClassName) != nil {
      return true
    }
    guard let path = unityFrameworkPath() else {
      return false
    }
    return FileManager.default.fileExists(atPath: path)
  }

  func open(sessionJson: String, promise: Promise) {
    guard launchPromise == nil else {
      promise.resolve(failure(code: "UNITY_LAUNCH_FAILED", message: "A game launch is already in progress."))
      return
    }
    guard let sessionId = parseJSONObject(sessionJson)?["sessionId"] as? String, !sessionId.isEmpty else {
      promise.resolve(failure(code: "INVALID_SESSION_JSON", message: "The game session must have a sessionId."))
      return
    }
    guard let windowScene = (hostWindow ?? currentKeyWindow())?.windowScene else {
      promise.resolve(failure(code: "HOST_ACTIVITY_UNAVAILABLE", message: "The host window is not available."))
      return
    }

    hostWindow = hostWindow ?? currentKeyWindow()
    launchPromise = promise
    launchSessionId = sessionId
    showLoadingWindow(in: windowScene)
    let timeout = DispatchWorkItem { [weak self] in
      self?.handleLaunchError(sessionId: sessionId, code: "UNITY_LAUNCH_FAILED")
    }
    launchTimeout = timeout
    DispatchQueue.main.asyncAfter(deadline: .now() + 30, execute: timeout)

    let result = open(sessionJson: sessionJson)
    if result["ok"] as? Bool != true {
      finishLaunch(result)
      _ = returnToHost()
    }
  }

  private func open(sessionJson: String) -> [String: Any] {
    lifecycleGeneration &+= 1
    returnScheduled = false
    if hostWindow == nil {
      hostWindow = currentKeyWindow()
    }
    pendingSessionJson = sessionJson
    guard let framework = loadFramework() else {
      pendingSessionJson = nil
      return failure(
        code: unityUnavailable,
        message: "The Unity iOS runtime has not been exported yet."
      )
    }

    if objectResult(framework, selectorName: "appController") == nil {
      unityReady = false
      guard setExecuteHeader(framework),
        setDataBundleId(framework),
        runEmbedded(framework)
      else {
        pendingSessionJson = nil
        finishUnload()
        return failure(code: "UNITY_LAUNCH_FAILED", message: "UnityFramework could not start.")
      }
    } else {
      unityReady = true
      _ = callWithBool(framework, selectorName: "pause:", value: false)
      _ = callVoid(framework, selectorName: "showUnityWindow")
    }

    guard sendPendingSessionIfReady() else {
      _ = returnToHost()
      return failure(code: "UNITY_MESSAGE_FAILED", message: "Unity did not accept the session.")
    }

    return success()
  }

  func handleReady() -> Bool {
    unityReady = true
    return sendPendingSessionIfReady()
  }

  func handleSessionReady(_ sessionId: String?) {
    guard launchPromise != nil, sessionId == launchSessionId else {
      return
    }
    loadingWindow?.isHidden = true
    loadingWindow = nil
    finishLaunch(success())
  }

  func handleLaunchError(sessionId: String?, code: String) {
    guard launchPromise != nil,
      sessionId == nil || sessionId == "" || sessionId == launchSessionId
    else {
      return
    }
    finishLaunch(failure(code: "UNITY_LAUNCH_FAILED", message: "The game menu could not start: \(code)"))
    _ = returnToHost()
  }

  private func finishLaunch(_ result: [String: Any]) {
    launchTimeout?.cancel()
    launchTimeout = nil
    let promise = launchPromise
    launchPromise = nil
    promise?.resolve(result)
  }

  private func showLoadingWindow(in scene: UIWindowScene) {
    let controller = UIViewController()
    controller.view.backgroundColor = .black
    let spinner = UIActivityIndicatorView(style: .large)
    spinner.color = .white
    spinner.translatesAutoresizingMaskIntoConstraints = false
    controller.view.addSubview(spinner)
    NSLayoutConstraint.activate([
      spinner.centerXAnchor.constraint(equalTo: controller.view.centerXAnchor),
      spinner.centerYAnchor.constraint(equalTo: controller.view.centerYAnchor),
    ])
    spinner.startAnimating()

    let window = UIWindow(windowScene: scene)
    window.rootViewController = controller
    window.windowLevel = .alert + 1
    loadingWindow = window
    window.isHidden = false
  }

  func scheduleReturnToHostAfterEvent(sessionId: String?) {
    guard !returnScheduled, sessionId == launchSessionId else {
      return
    }
    returnScheduled = true
    let scheduledGeneration = lifecycleGeneration
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
      guard let self else {
        return
      }
      guard self.lifecycleGeneration == scheduledGeneration else {
        return
      }
      self.returnScheduled = false
      _ = self.returnToHost()
    }
  }

  func returnToHost() -> [String: Any] {
    // Unity 6 can execute one more display-link frame after unloadApplication tears down
    // lighting state. Keep Unity loaded for the process lifetime and pause it instead.
    lifecycleGeneration &+= 1
    returnScheduled = false
    pendingSessionJson = nil
    unityReady = false
    finishLaunch(failure(code: "UNITY_LAUNCH_FAILED", message: "The game launch was closed before the menu was ready."))
    launchSessionId = nil
    guard let framework else {
      restoreHostWindow()
      return success()
    }
    guard objectResult(framework, selectorName: "appController") != nil else {
      restoreHostWindow()
      return success()
    }
    guard callWithBool(framework, selectorName: "pause:", value: true) else {
      restoreHostWindow()
      return failure(code: "NATIVE_CALL_FAILED", message: "UnityFramework could not pause.")
    }
    restoreHostWindow()
    return success()
  }

  func deactivate() {
    lifecycleGeneration &+= 1
    returnScheduled = false
    pendingSessionJson = nil
    unityReady = false
    finishLaunch(failure(code: "UNITY_LAUNCH_FAILED", message: "The game launcher was closed."))
    launchSessionId = nil

    if let framework {
      if objectResult(framework, selectorName: "appController") != nil {
        _ = callWithBool(framework, selectorName: "pause:", value: true)
      }
      unregisterListener(from: framework)
    }
    framework = nil
    frameworkBundle = nil
    restoreHostWindow()
  }

  @objc private func unityDidUnload(_ notification: Notification) {
    finishUnload()
  }

  @objc private func unityDidQuit(_ notification: Notification) {
    finishUnload()
  }

  private func finishUnload() {
    finishLaunch(failure(code: "UNITY_LAUNCH_FAILED", message: "Unity closed before the menu was ready."))
    launchSessionId = nil
    if let framework {
      unregisterListener(from: framework)
    }
    framework = nil
    frameworkBundle = nil
    pendingSessionJson = nil
    unityReady = false
    returnScheduled = false
    lifecycleGeneration &+= 1
    restoreHostWindow()
  }

  private func loadFramework() -> NSObject? {
    if let framework {
      guard registerListenerIfNeeded(on: framework) else {
        return nil
      }
      return framework
    }

    var principalClass = NSClassFromString(unityFrameworkClassName)
    if principalClass == nil {
      guard let path = unityFrameworkPath(),
        let bundle = Bundle(path: path)
      else {
        return nil
      }
      do {
        if !bundle.isLoaded {
          try bundle.loadAndReturnError()
        }
      } catch {
        return nil
      }
      frameworkBundle = bundle
      principalClass = bundle.principalClass ?? NSClassFromString(unityFrameworkClassName)
    }

    guard let principalClass,
      let instance = classObjectResult(principalClass, selectorName: "getInstance") as? NSObject
    else {
      return nil
    }
    framework = instance
    guard registerListenerIfNeeded(on: instance) else {
      framework = nil
      return nil
    }
    return instance
  }

  private func registerListenerIfNeeded(on framework: NSObject) -> Bool {
    if listenerRegistered {
      return true
    }
    guard
      callWithObject(
        framework,
        selectorName: "registerFrameworkListener:",
        value: self
      )
    else {
      return false
    }
    listenerRegistered = true
    return true
  }

  private func unregisterListener(from framework: NSObject) {
    guard listenerRegistered else {
      return
    }
    _ = callWithObject(
      framework,
      selectorName: "unregisterFrameworkListener:",
      value: self
    )
    listenerRegistered = false
  }

  private func setExecuteHeader(_ framework: NSObject) -> Bool {
    guard let header = _dyld_get_image_header(0) else {
      return false
    }
    return callWithPointer(
      framework,
      selectorName: "setExecuteHeader:",
      value: UnsafeRawPointer(header)
    )
  }

  private func setDataBundleId(_ framework: NSObject) -> Bool {
    return unityDataBundleId.withCString { pointer in
      callWithCString(framework, selectorName: "setDataBundleId:", value: pointer)
    }
  }

  private func runEmbedded(_ framework: NSObject) -> Bool {
    let selector = NSSelectorFromString("runEmbeddedWithArgc:argv:appLaunchOpts:")
    guard framework.responds(to: selector) else {
      return false
    }
    typealias Method =
      @convention(c) (
        AnyObject,
        Selector,
        Int32,
        UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>?,
        NSDictionary
      ) -> Void
    let method = unsafeBitCast(framework.method(for: selector), to: Method.self)
    method(framework, selector, CommandLine.argc, CommandLine.unsafeArgv, NSDictionary())
    return true
  }

  private func sendSession(_ framework: NSObject, sessionJson: String) -> Bool {
    let selector = NSSelectorFromString(
      "sendMessageToGOWithName:functionName:message:"
    )
    guard framework.responds(to: selector) else {
      return false
    }
    typealias Method =
      @convention(c) (
        AnyObject,
        Selector,
        UnsafePointer<CChar>,
        UnsafePointer<CChar>,
        UnsafePointer<CChar>
      ) -> Void
    let method = unsafeBitCast(framework.method(for: selector), to: Method.self)
    unityGameObject.withCString { gameObject in
      unityLoadSessionMethod.withCString { functionName in
        sessionJson.withCString { message in
          method(framework, selector, gameObject, functionName, message)
        }
      }
    }
    return true
  }

  private func sendPendingSessionIfReady() -> Bool {
    guard unityReady, let sessionJson = pendingSessionJson else {
      return true
    }
    guard let framework, sendSession(framework, sessionJson: sessionJson) else {
      return false
    }
    pendingSessionJson = nil
    return true
  }

  private func restoreHostWindow() {
    hostWindow?.makeKeyAndVisible()
    loadingWindow?.isHidden = true
    loadingWindow = nil
  }

  private func currentKeyWindow() -> UIWindow? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
  }
}

private func unityFrameworkPath() -> String? {
  guard let frameworksPath = Bundle.main.privateFrameworksPath else {
    return nil
  }
  return URL(fileURLWithPath: frameworksPath)
    .appendingPathComponent(unityFrameworkName)
    .path
}

private func classObjectResult(_ targetClass: AnyClass, selectorName: String) -> AnyObject? {
  let selector = NSSelectorFromString(selectorName)
  guard let rawMethod = class_getClassMethod(targetClass, selector) else {
    return nil
  }
  typealias Method = @convention(c) (AnyObject, Selector) -> AnyObject?
  let method = unsafeBitCast(method_getImplementation(rawMethod), to: Method.self)
  return method(targetClass as AnyObject, selector)
}

private func objectResult(_ target: NSObject, selectorName: String) -> AnyObject? {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return nil
  }
  typealias Method = @convention(c) (AnyObject, Selector) -> AnyObject?
  let method = unsafeBitCast(target.method(for: selector), to: Method.self)
  return method(target, selector)
}

private func callVoid(_ target: NSObject, selectorName: String) -> Bool {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return false
  }
  typealias Method = @convention(c) (AnyObject, Selector) -> Void
  unsafeBitCast(target.method(for: selector), to: Method.self)(target, selector)
  return true
}

private func callWithObject(
  _ target: NSObject,
  selectorName: String,
  value: AnyObject
) -> Bool {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return false
  }
  typealias Method = @convention(c) (AnyObject, Selector, AnyObject) -> Void
  unsafeBitCast(target.method(for: selector), to: Method.self)(target, selector, value)
  return true
}

private func callWithBool(_ target: NSObject, selectorName: String, value: Bool) -> Bool {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return false
  }
  typealias Method = @convention(c) (AnyObject, Selector, Bool) -> Void
  unsafeBitCast(target.method(for: selector), to: Method.self)(target, selector, value)
  return true
}

private func callWithPointer(
  _ target: NSObject,
  selectorName: String,
  value: UnsafeRawPointer
) -> Bool {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return false
  }
  typealias Method = @convention(c) (AnyObject, Selector, UnsafeRawPointer) -> Void
  unsafeBitCast(target.method(for: selector), to: Method.self)(target, selector, value)
  return true
}

private func callWithCString(
  _ target: NSObject,
  selectorName: String,
  value: UnsafePointer<CChar>
) -> Bool {
  let selector = NSSelectorFromString(selectorName)
  guard target.responds(to: selector) else {
    return false
  }
  typealias Method = @convention(c) (AnyObject, Selector, UnsafePointer<CChar>) -> Void
  unsafeBitCast(target.method(for: selector), to: Method.self)(target, selector, value)
  return true
}

private func gameInfo(runtimeAvailable: Bool) -> [String: Any] {
  return [
    "bridgeVersion": bridgeVersion,
    "platform": "ios",
    "runtimeAvailable": runtimeAvailable,
    "unityVersion": NSNull(),
    "error": runtimeAvailable ? NSNull() : unityUnavailable,
  ]
}

private func success() -> [String: Any] {
  return ["ok": true]
}

private func failure(code: String, message: String) -> [String: Any] {
  return ["ok": false, "code": code, "message": message]
}

private func parseJSONObject(_ json: String) -> [String: Any]? {
  let data = Data(json.utf8)
  guard !data.isEmpty, data.count <= maxJSONBytes,
    let value = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
  else {
    return nil
  }
  return value
}

private func isJSONObject(_ json: String) -> Bool {
  return parseJSONObject(json) != nil
}
