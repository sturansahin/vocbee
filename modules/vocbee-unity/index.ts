import { requireOptionalNativeModule } from 'expo-modules-core';
import type { EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

export const VOCBEE_UNITY_BRIDGE_VERSION = 1 as const;

export type GamePlatform = 'android' | 'ios' | 'unsupported';
export type GameLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ReviewCompletedGameEvent = {
  type: 'reviewCompleted';
  eventVersion: 1;
  bridgeVersion: typeof VOCBEE_UNITY_BRIDGE_VERSION;
  sessionId: string;
  level: GameLevel;
  targetCount: number;
};

export type FinishedGameEvent = {
  type: 'finished';
  sessionId: string;
};

export type GameLifecycleEvent = ReviewCompletedGameEvent | FinishedGameEvent;

export type GameBridgeErrorCode =
  | 'HOST_ACTIVITY_UNAVAILABLE'
  | 'INVALID_SESSION_JSON'
  | 'NATIVE_CALL_FAILED'
  | 'NATIVE_MODULE_UNAVAILABLE'
  | 'UNITY_LAUNCH_FAILED'
  | 'UNITY_MESSAGE_FAILED'
  | 'UNITY_RUNTIME_UNAVAILABLE'
  | 'UNSUPPORTED_PLATFORM';

export type GameInfo = {
  bridgeVersion: typeof VOCBEE_UNITY_BRIDGE_VERSION;
  platform: GamePlatform;
  runtimeAvailable: boolean;
  unityVersion: string | null;
  error: GameBridgeErrorCode | null;
};

export type GameActionResult =
  { ok: true } | { ok: false; code: GameBridgeErrorCode; message: string };

type NativeVocbeeUnityModule = {
  getGameInfo(): Promise<GameInfo>;
  openGame(sessionJson: string): Promise<GameActionResult>;
  unloadGame(): Promise<GameActionResult>;
  addListener(
    eventName: 'onGameEvent',
    listener: (event: { json?: unknown }) => void,
  ): EventSubscription;
};

const nativeModule = requireOptionalNativeModule<NativeVocbeeUnityModule>('VocbeeUnity');

const platform: GamePlatform =
  Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'unsupported';

function failure(code: GameBridgeErrorCode, message: string): GameActionResult {
  return { ok: false, code, message };
}

function unavailableCode(): GameBridgeErrorCode {
  return platform === 'unsupported' ? 'UNSUPPORTED_PLATFORM' : 'NATIVE_MODULE_UNAVAILABLE';
}

function unavailableMessage(): string {
  return platform === 'unsupported'
    ? 'The VocBee game is supported only on Android and iOS.'
    : 'The VocBee native game module is not included in this build.';
}

function isSessionJsonValid(sessionJson: string): boolean {
  if (sessionJson.length === 0 || utf8ByteLength(sessionJson) > 64 * 1024) {
    return false;
  }

  try {
    const value: unknown = JSON.parse(sessionJson);
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  } catch {
    return false;
  }
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
    if (bytes > 64 * 1024) {
      return bytes;
    }
  }
  return bytes;
}

export async function getGameInfo(): Promise<GameInfo> {
  if (!nativeModule) {
    return {
      bridgeVersion: VOCBEE_UNITY_BRIDGE_VERSION,
      platform,
      runtimeAvailable: false,
      unityVersion: null,
      error: unavailableCode(),
    };
  }

  try {
    return await nativeModule.getGameInfo();
  } catch {
    return {
      bridgeVersion: VOCBEE_UNITY_BRIDGE_VERSION,
      platform,
      runtimeAvailable: false,
      unityVersion: null,
      error: 'NATIVE_CALL_FAILED',
    };
  }
}

export async function openGame(sessionJson: string): Promise<GameActionResult> {
  if (!isSessionJsonValid(sessionJson)) {
    return failure(
      'INVALID_SESSION_JSON',
      'sessionJson must contain one JSON object up to 64 KiB.',
    );
  }

  if (!nativeModule) {
    return failure(unavailableCode(), unavailableMessage());
  }

  try {
    // Native launch resolves only after this session's menu frame is rendered and revealed.
    return await nativeModule.openGame(sessionJson);
  } catch {
    return failure('NATIVE_CALL_FAILED', 'The native game launcher failed.');
  }
}

export async function unloadGame(): Promise<GameActionResult> {
  if (!nativeModule) {
    return failure(unavailableCode(), unavailableMessage());
  }

  try {
    return await nativeModule.unloadGame();
  } catch {
    return failure('NATIVE_CALL_FAILED', 'The native game could not be unloaded.');
  }
}

export function onGameEvent(listener: (eventJson: string) => void): EventSubscription {
  if (!nativeModule) {
    return { remove() {} };
  }

  return nativeModule.addListener('onGameEvent', (event) => {
    listener(
      typeof event.json === 'string' ? event.json : '{"type":"error","code":"INVALID_EVENT_JSON"}',
    );
  });
}
