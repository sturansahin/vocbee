// src/features/notifications/domain/types.ts
// Layer: domain | Feature: notifications | Pure TS (NO SDK). Shapes mirror services/notificationService.ts.

export interface NotificationSettings {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  frequencyMinutes: number; // 60, 120, 180, 360, 1440
  autoMarkLearned: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  startHour: 9,
  startMinute: 0,
  endHour: 21,
  endMinute: 0,
  frequencyMinutes: 120,
  autoMarkLearned: true,
};

export interface TrackedNotification {
  notificationId: string;
  wordId: number;
  word: string;
  pronunciation?: string | null;
  translation: string;
  scheduledTime: number;
  autoMarkLearned: boolean;
  processed: boolean;
  level: string;
  targetLanguage: string;
}

export interface PendingNotificationWord {
  wordId: number;
  level?: string;
  targetLanguage?: string;
}

export interface NotificationPermissionState {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
  expires: string | number;
}

/** A single scheduled time-of-day slot (used by the pure scheduling rules / future scheduler). */
export interface ScheduledSlot {
  hour: number;
  minute: number;
}

export type NotificationKind = 'vocabulary' | 'streak' | 'test';

export interface NotificationScheduleRequest {
  identifier?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  data: Record<string, unknown>;
  seconds: number;
}

export interface ScheduledNotificationSnapshot {
  identifier: string;
  data?: Record<string, unknown>;
}

export interface NotificationResponsePayload {
  actionIdentifier?: string;
  notification: {
    request: {
      identifier: string;
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
}

export interface NotificationResponseSubscription {
  remove(): void;
}

export interface NotificationVocabularyWord {
  id: number;
  word: string;
  pronunciation?: string | null;
  translation: string;
}
