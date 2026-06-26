// src/features/notifications/application/contracts.ts
// Layer: application (contracts) | Feature: notifications. The simple facade surface that App/lifecycle
// will call (docs/refactor-v2/12, /35 §6). Interface only — PREP; the impl + lifecycle wiring is a
// later, device-QA'd step.

import type { NotificationSettings, PendingNotificationWord } from '../domain/types';

export interface NotificationFacade {
  setup(): Promise<void>;
  reschedule(): Promise<void>;
  handleResponse(): Promise<PendingNotificationWord | null>;
  sendTest(): Promise<void>;
  getSettings(): Promise<NotificationSettings>;
  updateSettings(settings: Partial<NotificationSettings>): Promise<void>;
}
