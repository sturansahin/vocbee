// src/features/notifications/data/repositories/PendingWordRepository.ts
// Layer: data (repository impl) | Feature: notifications.
//
// WIRED (docs/refactor-v2/26 PR-6.5, /35 §6): composed by the notification feature's
// composition root (docs/refactor-v2/33 §4). Encapsulates the
// AsyncStorage read/write/clear for the pending-notification-word slot that was previously inlined
// in notificationService's setPendingNotificationWord/getPendingNotificationWord/
// clearPendingNotificationWord. Same storage key (STORAGE_KEYS.PENDING_NOTIFICATION_WORD =
// '@pending_notification_word'), same payload format — parsing/serialization delegates to the
// already-tested, verbatim-equivalent domain/rules.ts parsePendingWord/serializePendingWord (no
// duplicated logic, no behavior drift).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@shared/storage';
import { parsePendingWord, serializePendingWord } from '../../domain/rules';
import type { PendingNotificationWord } from '../../domain/types';
import type { NotificationResponseHandler } from '../contracts';

export class PendingWordRepository implements NotificationResponseHandler {
  async setPendingWord(word: PendingNotificationWord): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD, serializePendingWord(word));
  }

  /** Reads the pending word WITHOUT clearing it (caller decides when it's safe to clear). */
  async getPendingWord(): Promise<PendingNotificationWord | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD);
    return parsePendingWord(raw);
  }

  async clearPendingWord(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_NOTIFICATION_WORD);
  }

  /** NotificationResponseHandler.consumePendingWord — reads then clears in one call.
   *  The application keeps read/clear as two separate public
   *  functions to preserve its existing call sites verbatim). */
  async consumePendingWord(): Promise<PendingNotificationWord | null> {
    const word = await this.getPendingWord();
    if (word) {
      await this.clearPendingWord();
    }
    return word;
  }
}
