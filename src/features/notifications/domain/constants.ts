// src/features/notifications/domain/constants.ts
// Layer: domain | Feature: notifications | Pure TS (NO SDK).
// VERBATIM values from services/notificationService.ts (binding behavior — docs/refactor-v2/03 §9, /12, /26 §9).

export const MAX_SCHEDULED_NOTIFICATIONS = 64;
export const STREAK_NOTIFICATION_RESERVED_SLOTS = 1;
export const MAX_VOCABULARY_NOTIFICATIONS = MAX_SCHEDULED_NOTIFICATIONS - STREAK_NOTIFICATION_RESERVED_SLOTS; // 63

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
