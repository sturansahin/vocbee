package com.vocbee.unity

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference
import org.json.JSONObject

private const val BRIDGE_VERSION = 1
private const val EVENT_NAME = "onGameEvent"
private const val MAX_JSON_BYTES = 64 * 1024
private const val UNITY_UNAVAILABLE = "UNITY_RUNTIME_UNAVAILABLE"

class VocbeeUnityModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VocbeeUnity")
    Events(EVENT_NAME)

    OnCreate {
      activeModule = WeakReference(this@VocbeeUnityModule)
    }

    OnDestroy {
      if (activeModule.get() === this@VocbeeUnityModule) {
        activeModule.clear()
      }
    }

    AsyncFunction("getGameInfo") {
      gameInfo()
    }

    AsyncFunction("openGame") { sessionJson: String ->
      if (!isJsonObject(sessionJson)) {
        failure("INVALID_SESSION_JSON", "sessionJson must contain one JSON object up to 64 KiB.")
      } else {
        val activity = appContext.currentActivity
        val context = appContext.reactContext
        when {
          activity == null || context == null -> failure(
            "HOST_ACTIVITY_UNAVAILABLE",
            "The host Activity is not available."
          )
          !VocbeeUnityRuntime.isAvailable(context) -> failure(
            UNITY_UNAVAILABLE,
            "The Unity Android runtime has not been exported yet."
          )
          else -> try {
            VocbeeUnityRuntime.open(activity, sessionJson)
            success()
          } catch (_: Throwable) {
            failure("UNITY_LAUNCH_FAILED", "The Unity Android Activity could not be opened.")
          }
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("unloadGame") {
      VocbeeUnityActivity.requestUnload()
      success()
    }.runOnQueue(Queues.MAIN)
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
        VocbeeUnityActivity.finishForEvent(eventType)
      }
    }

    internal fun emitFatal(code: String) {
      emitFromUnity(
        JSONObject()
          .put("type", "error")
          .put("code", code)
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
