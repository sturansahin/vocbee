// src/features/notifications/domain/constants.ts
// Layer: domain | Feature: notifications | Pure TS (NO SDK).
// VERBATIM values from services/notificationService.ts (binding behavior — docs/refactor-v2/03 §9, /12, /26 §9).

export const MAX_SCHEDULED_NOTIFICATIONS = 64;
export const STREAK_NOTIFICATION_RESERVED_SLOTS = 1;
export const MAX_VOCABULARY_NOTIFICATIONS =
  MAX_SCHEDULED_NOTIFICATIONS - STREAK_NOTIFICATION_RESERVED_SLOTS; // 63

export const NOTIFICATION_CONTENT_VERSION = 4;

export const STREAK_REMINDER_HOUR = 21;
export const STREAK_REMINDER_MINUTE = 0;

export const FREQUENCY_MINUTES = [60, 120, 180, 360, 1440] as const;

// Scheduled-notification id prefixes / ids (services/notificationService.ts).
export const VOCABULARY_NOTIFICATION_PREFIX = 'vocbee-vocab-';
export const LEGACY_VOCABULARY_REFILL_PREFIX = 'vocbee-refill-';
export const STREAK_NOTIFICATION_ID = 'vocbee-streak-reminder';

// Android channels.
export const ANDROID_VOCABULARY_CHANNEL_ID = 'vocabulary';
export const ANDROID_STREAK_CHANNEL_ID = 'streak';

export const NOTIFICATION_FREQUENCY_OPTIONS = [
  { key: 'every1hour', minutes: 60 },
  { key: 'every2hours', minutes: 120 },
  { key: 'every3hours', minutes: 180 },
  { key: 'every6hours', minutes: 360 },
  { key: 'onceDaily', minutes: 1440 },
] as const;

export type NotificationFrequencyOption = (typeof NOTIFICATION_FREQUENCY_OPTIONS)[number];
export type NotificationFrequencyKey = NotificationFrequencyOption['key'];

export const DEFAULT_NOTIFICATION_FREQUENCY_KEY: NotificationFrequencyKey = 'every2hours';
export const NOTIFICATION_FREQUENCY_KEYS = NOTIFICATION_FREQUENCY_OPTIONS.map(
  (option) => option.key,
) as NotificationFrequencyKey[];
