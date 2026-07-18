// src/features/notifications/domain/rules.ts
// Layer: domain | Feature: notifications | Pure TS (NO SDK). docs/refactor-v2/12, /26 §8, /37 §7.

import {
  DEFAULT_NOTIFICATION_FREQUENCY_KEY,
  MAX_VOCABULARY_NOTIFICATIONS,
  NOTIFICATION_CONTENT_VERSION,
  NOTIFICATION_FREQUENCY_OPTIONS,
  STREAK_REMINDER_HOUR,
  STREAK_REMINDER_MINUTE,
  type NotificationFrequencyKey,
} from './constants';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  type PendingNotificationWord,
} from './types';

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
  frequencyMinutes: number,
): number {
  const isFullDay = startMinutes === endMinutes;
  if (isFullDay) {
    // Full 24h mode is modeled as an inclusive range, but we must avoid
    // duplicating the next day's start timestamp in the same batch.
    return Math.floor((1440 - 1) / frequencyMinutes) + 1;
  }

  const rangeMinutes =
    endMinutes > startMinutes ? endMinutes - startMinutes : 1440 - startMinutes + endMinutes;

  return Math.floor(rangeMinutes / frequencyMinutes) + 1;
}

/** Vocabulary slots never exceed 63 (64 total minus 1 reserved for the streak reminder). */
export function capVocabularySlots(count: number): number {
  return Math.min(count, MAX_VOCABULARY_NOTIFICATIONS);
}

/** Reschedule when the stored content version differs from the current one (notificationService line ~204). */
export function shouldRescheduleForContentVersion(
  storedVersion: string | null | undefined,
): boolean {
  return storedVersion !== String(NOTIFICATION_CONTENT_VERSION);
}

/** Floor frequency at 60 minutes (mirrors normalizeNotificationSettings: `< 60 ? 60 : value`). */
export function normalizeFrequencyMinutes(frequencyMinutes: number): number {
  return frequencyMinutes < 60 ? 60 : frequencyMinutes;
}

export function normalizeNotificationSettings(
  settings?: Partial<NotificationSettings> | null,
): NotificationSettings {
  const normalized = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(settings ?? {}),
  };

  normalized.frequencyMinutes = normalizeFrequencyMinutes(normalized.frequencyMinutes);
  normalized.startHour = Number.isFinite(normalized.startHour)
    ? normalized.startHour
    : DEFAULT_NOTIFICATION_SETTINGS.startHour;
  normalized.startMinute = Number.isFinite(normalized.startMinute)
    ? normalized.startMinute
    : DEFAULT_NOTIFICATION_SETTINGS.startMinute;
  normalized.endHour = Number.isFinite(normalized.endHour)
    ? normalized.endHour
    : DEFAULT_NOTIFICATION_SETTINGS.endHour;
  normalized.endMinute = Number.isFinite(normalized.endMinute)
    ? normalized.endMinute
    : DEFAULT_NOTIFICATION_SETTINGS.endMinute;

  return normalized;
}

export function getNotificationFrequencyMinutes(key: string): number {
  return (
    NOTIFICATION_FREQUENCY_OPTIONS.find((option) => option.key === key)?.minutes ??
    NOTIFICATION_FREQUENCY_OPTIONS.find(
      (option) => option.key === DEFAULT_NOTIFICATION_FREQUENCY_KEY,
    )!.minutes
  );
}

export function getNotificationFrequencyKey(minutes: number): NotificationFrequencyKey {
  return (
    NOTIFICATION_FREQUENCY_OPTIONS.find((option) => option.minutes === minutes)?.key ??
    DEFAULT_NOTIFICATION_FREQUENCY_KEY
  );
}

export function isLegacyVocabularyNotificationId(identifier: string): boolean {
  return /^vocbee-\d+-\d+$/.test(identifier);
}

export function isVocabularyNotificationId(identifier: string): boolean {
  return (
    identifier.startsWith('vocbee-vocab-') ||
    identifier.startsWith('vocbee-refill-') ||
    isLegacyVocabularyNotificationId(identifier)
  );
}

export function isStreakNotificationId(identifier: string): boolean {
  return identifier === 'vocbee-streak-reminder' || identifier.startsWith('vocbee-streak-');
}

export function getNextStreakReminderTime(now: Date, completedToday: boolean): Date {
  const reminderTime = new Date(now);
  reminderTime.setHours(STREAK_REMINDER_HOUR, STREAK_REMINDER_MINUTE, 0, 0);

  if (completedToday || reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }

  return reminderTime;
}

/** Builds the same local-time schedule previously calculated inside notificationService. */
export function buildVocabularyScheduleTimes(
  settings: NotificationSettings,
  now: Date,
  capacity: number,
): number[] {
  if (capacity <= 0) return [];

  const dailyStartMinutes = settings.startHour * 60 + settings.startMinute;
  const dailyEndMinutes = settings.endHour * 60 + settings.endMinute;
  const isFullDayRange = dailyStartMinutes === dailyEndMinutes;
  const isOvernight = dailyEndMinutes <= dailyStartMinutes;
  const notificationsPerDay = getDailyNotificationSlotCount(
    dailyStartMinutes,
    dailyEndMinutes,
    settings.frequencyMinutes,
  );
  const daysToSchedule = Math.ceil(capacity / notificationsPerDay);
  const times: number[] = [];

  for (let day = 0; day < daysToSchedule && times.length < capacity; day++) {
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() + day);
    const startTime = new Date(baseDate);
    startTime.setHours(settings.startHour, settings.startMinute, 0, 0);

    for (let i = 0; i < notificationsPerDay && times.length < capacity; i++) {
      const notificationTime = new Date(
        startTime.getTime() + i * settings.frequencyMinutes * 60 * 1000,
      );

      if (isOvernight && !isFullDayRange) {
        const notificationMinutes =
          notificationTime.getHours() * 60 + notificationTime.getMinutes();
        if (
          notificationTime > startTime &&
          notificationMinutes > dailyEndMinutes &&
          notificationMinutes < dailyStartMinutes
        ) {
          break;
        }
      }

      if (notificationTime > now) times.push(notificationTime.getTime());
    }
  }

  return times;
}

export function getNextVocabularyRefillTime(
  previousTime: Date,
  settings: NotificationSettings,
): Date {
  const nextTime = new Date(previousTime.getTime() + settings.frequencyMinutes * 60 * 1000);
  const dailyStartMinutes = settings.startHour * 60 + settings.startMinute;
  const dailyEndMinutes = settings.endHour * 60 + settings.endMinute;
  const currentMinutes = nextTime.getHours() * 60 + nextTime.getMinutes();
  const isOvernight = dailyEndMinutes <= dailyStartMinutes;
  const isFullDayRange = dailyStartMinutes === dailyEndMinutes;

  if (isOvernight && !isFullDayRange) {
    if (currentMinutes > dailyEndMinutes && currentMinutes < dailyStartMinutes) {
      nextTime.setHours(settings.startHour, settings.startMinute, 0, 0);
    }
  } else if (currentMinutes > dailyEndMinutes) {
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(settings.startHour, settings.startMinute, 0, 0);
  } else if (currentMinutes < dailyStartMinutes) {
    nextTime.setHours(settings.startHour, settings.startMinute, 0, 0);
  }

  return nextTime;
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
