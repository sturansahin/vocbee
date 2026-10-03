package com.vocbee.unity

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference
import org.json.JSONObject

private const val BRIDGE_VERSION = 1
private const val EVENT_NAME = "onGameEvent"
private const val MAX_JSON_BYTES = 64 * 1024
private const val UNITY_UNAVAILABLE = "UNITY_RUNTIME_UNAVAILABLE"

class VocbeeUnityModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var launchPromise: Promise? = null
  private var launchSessionId: String? = null
  private val launchTimeout = Runnable {
    emitFatal("UNITY_LAUNCH_FAILED", launchSessionId)
  }

  override fun definition() = ModuleDefinition {
    Name("VocbeeUnity")
    Events(EVENT_NAME)

    OnCreate {
      activeModule = WeakReference(this@VocbeeUnityModule)
    }

    OnDestroy {
      mainHandler.post {
        finishLaunch(failure("UNITY_LAUNCH_FAILED", "The game launcher was closed."))
        VocbeeUnityActivity.requestUnload()
      }
      if (activeModule.get() === this@VocbeeUnityModule) {
        activeModule.clear()
      }
    }

    AsyncFunction("getGameInfo") {
      gameInfo()
    }

    AsyncFunction("openGame") { sessionJson: String, promise: Promise ->
      if (!isJsonObject(sessionJson)) {
        promise.resolve(failure("INVALID_SESSION_JSON", "sessionJson must contain one JSON object up to 64 KiB."))
      } else {
        val activity = appContext.currentActivity
        val context = appContext.reactContext
        val result = when {
          launchPromise != null -> failure("UNITY_LAUNCH_FAILED", "A game launch is already in progress.")
          JSONObject(sessionJson).optString("sessionId").isEmpty() -> failure(
            "INVALID_SESSION_JSON", "The game session must have a sessionId."
          )
          activity == null || context == null -> failure(
            "HOST_ACTIVITY_UNAVAILABLE",
            "The host Activity is not available."
          )
          !VocbeeUnityRuntime.isAvailable(context) -> failure(
            UNITY_UNAVAILABLE,
            "The Unity Android runtime has not been exported yet."
          )
          else -> try {
            launchPromise = promise
            launchSessionId = JSONObject(sessionJson).getString("sessionId")
            mainHandler.postDelayed(launchTimeout, 30_000L)
            VocbeeUnityRuntime.open(activity, sessionJson)
            null
          } catch (_: Throwable) {
            finishLaunch(failure("UNITY_LAUNCH_FAILED", "The Unity Android Activity could not be opened."))
            null
          }
        }
        if (result != null) promise.resolve(result)
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("unloadGame") {
      VocbeeUnityActivity.requestUnload()
      success()
    }.runOnQueue(Queues.MAIN)
  }

  private fun finishLaunch(result: Bundle) {
    mainHandler.removeCallbacks(launchTimeout)
    val promise = launchPromise
    launchPromise = null
    launchSessionId = null
    promise?.resolve(result)
  }

  private fun gameInfo() = Bundle().apply {
    val available = appContext.reactContext?.let(VocbeeUnityRuntime::isAvailable) == true
    putInt("bridgeVersion", BRIDGE_VERSION)
    putString("platform", "android")
    putBoolean("runtimeAvailable", available)
    putString("unityVersion", null)
    putString("error", if (available) null else UNITY_UNAVAILABLE)
  }

  private fun success() = Bundle().apply {
    putBoolean("ok", true)
  }

  private fun failure(code: String, message: String) = Bundle().apply {
    putBoolean("ok", false)
    putString("code", code)
    putString("message", message)
  }

  companion object {
    private var activeModule = WeakReference<VocbeeUnityModule>(null)

    @JvmStatic
    fun emitFromUnity(eventJson: String?) {
      val parsed = if (eventJson != null && isJsonObject(eventJson)) {
        JSONObject(eventJson)
      } else {
        null
      }
      val payload = parsed?.toString()
        ?: "{\"type\":\"error\",\"code\":\"INVALID_EVENT_JSON\"}"

      Handler(Looper.getMainLooper()).post {
        activeModule.get()?.sendEvent(
          EVENT_NAME,
          Bundle().apply { putString("json", payload) }
        )
        val eventType = parsed?.optString("type")
        if (eventType == "ready") {
          VocbeeUnityActivity.onUnityReady()
        }
        val module = activeModule.get()
        val sessionId = parsed?.optString("sessionId")
        if (module?.launchPromise != null &&
          (sessionId.isNullOrEmpty() || sessionId == module.launchSessionId)) {
          when (eventType) {
            "sessionReady" -> if (sessionId == module.launchSessionId &&
              parsed?.optInt("bridgeVersion") == BRIDGE_VERSION &&
              VocbeeUnityActivity.revealSession(sessionId!!)) {
              module.finishLaunch(module.success())
            }
            "error", "finished" -> {
              module.finishLaunch(module.failure(
                "UNITY_LAUNCH_FAILED", "The game menu could not start: ${parsed?.optString("code") ?: eventType}"
              ))
              VocbeeUnityActivity.requestUnload()
            }
          }
        }
        VocbeeUnityActivity.finishForEvent(eventType, sessionId)
      }
    }

    internal fun emitFatal(code: String, sessionId: String? = null) {
      emitFromUnity(
        JSONObject()
          .put("type", "error")
          .put("code", code)
          .put("sessionId", sessionId)
          .toString()
      )
    }

    private fun isJsonObject(json: String): Boolean {
      if (json.toByteArray(Charsets.UTF_8).size !in 1..MAX_JSON_BYTES) {
        return false
      }

      return try {
        JSONObject(json)
        true
      } catch (_: Exception) {
        false
      }
    }
  }
}
