// src/features/notifications/data/contracts.ts
// Layer: data (contracts) | Feature: notifications. The 4 interfaces that split notificationService's
// single surface by responsibility (ISP — docs/refactor-v2/35 §6, /12). Interfaces only — PREP.

import type {
  NotificationPermissionState,
  ScheduledSlot,
  TrackedNotification,
  NotificationSettings,
  PendingNotificationWord,
} from '../domain/types';

export interface NotificationPermissionRepository {
  getPermissionState(): Promise<NotificationPermissionState>;        // getNotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>;         // requestNotificationPermissions
  hasSeenPrompt(userId: string): Promise<boolean>;                   // @notification_permission_prompted_${uid}
  markPromptSeen(userId: string): Promise<void>;
}

export interface NotificationScheduler {
  scheduleVocabulary(plan: ScheduledSlot[]): Promise<void>;          // scheduleVocabularyNotifications
  scheduleStreakReminder(at: { hour: number; minute: number }): Promise<void>; // 21:00
  cancelVocabulary(): Promise<void>;
  cancelAll(): Promise<void>;
  getScheduledCount(): Promise<number>;                              // <= 64
}

export interface NotificationTrackingRepository {
  getTracked(): Promise<TrackedNotification[]>;                      // @tracked_notifications
  processDelivered(): Promise<void>;                                 // processDeliveredNotifications
  getSettings(): Promise<NotificationSettings>;                      // getNotificationSettings
  saveSettings(settings: Partial<NotificationSettings>): Promise<void>;
}

export interface NotificationResponseHandler {
  setPendingWord(word: PendingNotificationWord): Promise<void>;      // @pending_notification_word
  consumePendingWord(): Promise<PendingNotificationWord | null>;
}
