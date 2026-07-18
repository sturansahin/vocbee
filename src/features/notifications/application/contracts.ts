// src/features/notifications/application/contracts.ts
// Layer: application (contracts) | Feature: notifications. The simple facade surface that App/lifecycle
// calls (docs/refactor-v2/12, /35 §6).

import type {
  NotificationPermissionState,
  NotificationResponsePayload,
  NotificationResponseSubscription,
  NotificationSettings,
  PendingNotificationWord,
} from '../domain/types';

export interface NotificationFacade {
  configure(): void;
  getPermissionState(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<boolean>;
  hasSeenPermissionPrompt(userId: string): Promise<boolean>;
  markPermissionPromptSeen(userId: string): Promise<void>;
  reschedule(): Promise<void>;
  refill(): Promise<void>;
  processDelivered(): Promise<number>;
  setForegroundTime(): Promise<void>;
  setBackgroundTime(): Promise<void>;
  handleResponse(response: NotificationResponsePayload): Promise<void>;
  getLastResponse(): Promise<NotificationResponsePayload | null>;
  addResponseListener(
    listener: (response: NotificationResponsePayload) => void,
  ): NotificationResponseSubscription;
  clearLastResponse(): Promise<void>;
  getPendingWord(): Promise<PendingNotificationWord | null>;
  clearPendingWord(): Promise<void>;
  sendTest(): Promise<void>;
  getSettings(): Promise<NotificationSettings>;
  updateSettings(settings: Partial<NotificationSettings>, skipScheduling?: boolean): Promise<void>;
  getScheduledCount(): Promise<number>;
}
