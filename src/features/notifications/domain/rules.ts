// src/features/notifications/domain/rules.ts
// Layer: domain | Feature: notifications | Pure TS (NO SDK). docs/refactor-v2/12, /26 §8, /37 §7.

import { MAX_VOCABULARY_NOTIFICATIONS, NOTIFICATION_CONTENT_VERSION } from './constants';
import type { PendingNotificationWord } from './types';

/**
 * Daily slot count for the given window + frequency.
 * VERBATIM extraction of services/notificationService.getDailyNotificationSlotCount
 * (behavior contract — docs/refactor-v2/03 §9). Examples (must match existing tests):
 *   09:00–21:00 @ 120min  -> floor(720/120)+1 = 7
 *   full day    @ 60min   -> floor((1440-1)/60)+1 = 24
 */
export function getDailyNotificationSlotCount(
  startMinutes: number,
  endMinutes: number,
  frequencyMinutes: number
): number {
  const isFullDay = startMinutes === endMinutes;
  if (isFullDay) {
    // Full 24h mode is modeled as an inclusive range, but we must avoid
    // duplicating the next day's start timestamp in the same batch.
    return Math.floor((1440 - 1) / frequencyMinutes) + 1;
  }

  const rangeMinutes = endMinutes > startMinutes
    ? endMinutes - startMinutes
    : (1440 - startMinutes) + endMinutes;

  return Math.floor(rangeMinutes / frequencyMinutes) + 1;
}

/** Vocabulary slots never exceed 63 (64 total minus 1 reserved for the streak reminder). */
export function capVocabularySlots(count: number): number {
  return Math.min(count, MAX_VOCABULARY_NOTIFICATIONS);
}

/** Reschedule when the stored content version differs from the current one (notificationService line ~204). */
export function shouldRescheduleForContentVersion(storedVersion: string | null | undefined): boolean {
  return storedVersion !== String(NOTIFICATION_CONTENT_VERSION);
}

/** Floor frequency at 60 minutes (mirrors normalizeNotificationSettings: `< 60 ? 60 : value`). */
export function normalizeFrequencyMinutes(frequencyMinutes: number): number {
  return frequencyMinutes < 60 ? 60 : frequencyMinutes;
}

// ─── Pending word (@pending_notification_word) serialization (pure) ───
export function serializePendingWord(word: PendingNotificationWord): string {
  return JSON.stringify(word);
}

/**
 * VERBATIM extraction of services/notificationService.parsePendingNotificationWord
 * (behavior contract — docs/refactor-v2/03 §9). Supports:
 *   1. Current JSON payload: {"wordId": number, level?, targetLanguage?}
 *   2. Legacy JSON payload with a string wordId (parsed via parseInt).
 *   3. Legacy plain-numeric-string payload (pre-JSON format, no JSON.parse success).
 */
export function parsePendingWord(raw: string | null | undefined): PendingNotificationWord | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed) {
      const parsedWordId =
        typeof parsed.wordId === 'number'
          ? parsed.wordId
          : typeof parsed.wordId === 'string'
            ? parseInt(parsed.wordId, 10)
            : NaN;

      if (Number.isFinite(parsedWordId)) {
        const out: PendingNotificationWord = { wordId: parsedWordId };
        if (typeof parsed.level === 'string') out.level = parsed.level;
        if (typeof parsed.targetLanguage === 'string') out.targetLanguage = parsed.targetLanguage;
        return out;
      }
    }
  } catch {
    // fall back to legacy string format
  }

  const legacyId = parseInt(raw, 10);
  if (!Number.isNaN(legacyId)) {
    return { wordId: legacyId };
  }

  return null;
}
