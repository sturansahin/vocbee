package com.vocbee.unity

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import java.lang.ref.WeakReference
import java.lang.reflect.Proxy

private const val SESSION_JSON_EXTRA = "com.vocbee.unity.SESSION_JSON"
private const val UNITY_PLAYER_CLASS = "com.unity3d.player.UnityPlayer"
private const val UNITY_PLAYER_HOST_CLASS = "com.unity3d.player.UnityPlayerForActivityOrService"
private const val UNITY_LIFECYCLE_CLASS = "com.unity3d.player.IUnityPlayerLifecycleEvents"
private const val UNITY_GAME_OBJECT = "VocbeeGameBridge"
private const val UNITY_LOAD_SESSION_METHOD = "LoadSessionJson"

internal object VocbeeUnityRuntime {
  fun isAvailable(context: Context): Boolean {
    val loader = context.classLoader
    return runCatching {
      Class.forName(UNITY_PLAYER_CLASS, false, loader)
      true
    }.getOrDefault(false)
  }

  fun open(activity: Activity, sessionJson: String) {
    activity.startActivity(
      Intent(activity, VocbeeUnityActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        .putExtra(SESSION_JSON_EXTRA, sessionJson)
    )
  }
}

class VocbeeUnityActivity : Activity() {
  private var unityPlayer: Any? = null
  private var unloadRequested = false
  private var unityReady = false
  private var pendingSessionJson: String? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    activeActivity = WeakReference(this)
    window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
    @Suppress("DEPRECATION")
    window.decorView.systemUiVisibility = (
      View.SYSTEM_UI_FLAG_FULLSCREEN or
        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
      )

    try {
      val player = createUnityPlayer()
      val playerView = findPlayerView(player)
        ?: throw IllegalStateException("Unity player view is unavailable")
      (playerView.parent as? ViewGroup)?.removeView(playerView)
      setContentView(
        playerView,
        ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
      unityPlayer = player
      callNoArg(player, "resume")
      call(player, "windowFocusChanged", true)
      playerView.requestFocus()
      loadSession(intent)
    } catch (_: Throwable) {
      VocbeeUnityModule.emitFatal("UNITY_LAUNCH_FAILED")
      finish()
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    loadSession(intent)
  }

  override fun onPause() {
    unityPlayer?.let { callNoArg(it, "pause") }
    super.onPause()
  }

  override fun onResume() {
    super.onResume()
    unityPlayer?.let { callNoArg(it, "resume") }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    unityPlayer?.let { call(it, "windowFocusChanged", hasFocus) }
  }

  @Deprecated("Android dispatches system back presses here for this full-screen activity.")
  override fun onBackPressed() {
    requestUnloadAndFinish()
  }

  override fun onDestroy() {
    if (!unloadRequested) {
      unityPlayer?.let { callNoArg(it, "unload") }
    }
    if (activeActivity.get() === this) {
      activeActivity.clear()
    }
    unityPlayer = null
    super.onDestroy()
  }

  private fun loadSession(intent: Intent?) {
    pendingSessionJson = intent?.getStringExtra(SESSION_JSON_EXTRA) ?: return
    sendPendingSession()
  }

  private fun sendPendingSession() {
    val sessionJson = pendingSessionJson ?: return
    if (!unityReady) {
      return
    }
    window.decorView.post {
      if (sendMessage(sessionJson)) {
        pendingSessionJson = null
      } else {
        VocbeeUnityModule.emitFatal("UNITY_MESSAGE_FAILED")
        requestUnloadAndFinish()
      }
    }
  }

  private fun createUnityPlayer(): Any {
    val loader = classLoader
    val lifecycleClass = Class.forName(UNITY_LIFECYCLE_CLASS, false, loader)
    val lifecycle = Proxy.newProxyInstance(
      loader,
      arrayOf(lifecycleClass)
    ) { proxy, method, args ->
      when (method.name) {
        "onUnityPlayerUnloaded", "onUnityPlayerQuitted" -> {
          runOnUiThread { finishFromUnity() }
          null
        }
        "equals" -> proxy === args?.firstOrNull()
        "hashCode" -> System.identityHashCode(proxy)
        "toString" -> "VocbeeUnityLifecycle"
        else -> null
      }
    }

    for (className in arrayOf(UNITY_PLAYER_HOST_CLASS, UNITY_PLAYER_CLASS)) {
      val playerClass = runCatching { Class.forName(className, true, loader) }.getOrNull() ?: continue
      for (constructor in playerClass.declaredConstructors.sortedBy { it.parameterCount }) {
        val arguments = constructor.parameterTypes.map { parameter ->
          when {
            parameter.isInstance(this) -> this
            parameter == lifecycleClass -> lifecycle
            else -> return@map null
          }
        }
        if (arguments.any { it == null }) {
          continue
        }
        val player = runCatching {
          constructor.isAccessible = true
          constructor.newInstance(*arguments.toTypedArray())
        }.getOrNull()
        if (player != null) {
          return player
        }
      }
    }

    throw IllegalStateException("No supported Unity player constructor")
  }

  private fun findPlayerView(player: Any): View? {
    if (player is View) {
      return player
    }
    for (methodName in arrayOf("getFrameLayout", "getView", "getPlayerView", "getRootView")) {
      val view = runCatching {
        player.javaClass.getMethod(methodName).invoke(player) as? View
      }.getOrNull()
      if (view != null) {
        return view
      }
    }
    return null
  }

  private fun sendMessage(sessionJson: String): Boolean {
    return runCatching {
      Class.forName(UNITY_PLAYER_CLASS)
        .getMethod("UnitySendMessage", String::class.java, String::class.java, String::class.java)
        .invoke(null, UNITY_GAME_OBJECT, UNITY_LOAD_SESSION_METHOD, sessionJson)
      true
    }.getOrDefault(false)
  }

  private fun requestUnloadAndFinish() {
    if (unloadRequested) {
      return
    }
    unloadRequested = true
    unityPlayer?.let { callNoArg(it, "unload") }
    finishFromUnity()
  }

  private fun finishFromUnity() {
    unloadRequested = true
    if (!isFinishing) {
      finish()
    }
  }

  private fun callNoArg(target: Any, methodName: String): Boolean {
    return runCatching {
      target.javaClass.getMethod(methodName).invoke(target)
      true
    }.getOrDefault(false)
  }

  private fun call(target: Any, methodName: String, argument: Boolean): Boolean {
    return runCatching {
      target.javaClass.getMethod(methodName, java.lang.Boolean.TYPE).invoke(target, argument)
      true
    }.getOrDefault(false)
  }

  companion object {
    private var activeActivity = WeakReference<VocbeeUnityActivity>(null)

    internal fun requestUnload(): Boolean {
      val activity = activeActivity.get() ?: return false
      activity.runOnUiThread { activity.requestUnloadAndFinish() }
      return true
    }

    internal fun finishForEvent(eventType: String?) {
      if (eventType == "finished") {
        requestUnload()
      }
    }

    internal fun onUnityReady() {
      activeActivity.get()?.runOnUiThread {
        activeActivity.get()?.apply {
          unityReady = true
          sendPendingSession()
        }
      }
    }
  }
}
