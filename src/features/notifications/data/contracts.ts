// src/features/notifications/data/contracts.ts
// Layer: data (contracts) | Feature: notifications. The 4 interfaces that split notificationService's
// single surface by responsibility (ISP — docs/architecture.md).

import type {
  NotificationPermissionState,
  TrackedNotification,
  NotificationSettings,
  PendingNotificationWord,
  NotificationResponsePayload,
  NotificationResponseSubscription,
  NotificationScheduleRequest,
  ScheduledNotificationSnapshot,
} from '../domain/types';

export interface NotificationPermissionRepository {
  getPermissionState(): Promise<NotificationPermissionState>; // getNotificationPermissionState
  requestPermission(): Promise<NotificationPermissionState>; // requestNotificationPermissions
  hasSeenPrompt(userId: string): Promise<boolean>; // @notification_permission_prompted_${uid}
  markPromptSeen(userId: string): Promise<void>;
  ensureChannels(): Promise<void>;
}

export interface NotificationScheduler {
  configureForegroundHandler(): void;
  schedule(request: NotificationScheduleRequest): Promise<string>;
  getScheduled(): Promise<ScheduledNotificationSnapshot[]>;
  getPresentedIds(): Promise<string[]>;
  cancel(identifier: string): Promise<void>;
  cancelAll(): Promise<void>;
  getLastResponse(): Promise<NotificationResponsePayload | null>;
  addResponseListener(
    listener: (response: NotificationResponsePayload) => void,
  ): NotificationResponseSubscription;
  clearLastResponse(): Promise<void>;
}

export interface NotificationTrackingRepository {
  getTracked(): Promise<TrackedNotification[]>; // @tracked_notifications
  saveTracked(notifications: TrackedNotification[]): Promise<void>;
  getSettings(): Promise<NotificationSettings>; // getNotificationSettings
  saveSettings(settings: NotificationSettings): Promise<void>;
  clearTracked(): Promise<void>;
  setLastForegroundTime(timestamp: number): Promise<void>;
  setLastBackgroundTime(timestamp: number): Promise<void>;
  getLastForegroundTime(): Promise<number>;
  getLastBackgroundTime(): Promise<number>;
  getContentVersion(): Promise<string | null>;
  setContentVersion(version: number): Promise<void>;
  getTargetLanguage(): Promise<string | null>;
  getStoredCurrentLevel(): Promise<string | null>;
}

export interface NotificationResponseHandler {
  setPendingWord(word: PendingNotificationWord): Promise<void>; // @pending_notification_word
  getPendingWord(): Promise<PendingNotificationWord | null>;
  clearPendingWord(): Promise<void>;
  consumePendingWord(): Promise<PendingNotificationWord | null>;
}
