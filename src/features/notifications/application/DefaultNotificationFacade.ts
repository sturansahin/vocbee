import type { NotificationFacade } from './contracts';
import type { NotificationResponsePayload, NotificationSettings } from '../domain/types';
import {
  addNotificationResponseListener,
  clearLastNotificationResponse,
  clearPendingNotificationWord,
  configureNotifications,
  getLastNotificationResponse,
  getNotificationPermissionState,
  getNotificationSettings,
  getPendingNotificationWord,
  getScheduledNotificationCount,
  handleNotificationResponse,
  hasSeenNotificationPermissionPrompt,
  markNotificationPermissionPromptSeen,
  processDeliveredNotifications,
  refillNotifications,
  requestNotificationPermissions,
  saveNotificationSettings,
  scheduleVocabularyNotifications,
  sendTestNotification,
  setLastBackgroundTime,
  setLastForegroundTime,
} from './notificationService';

export class DefaultNotificationFacade implements NotificationFacade {
  configure() {
    configureNotifications();
  }

  getPermissionState() {
    return getNotificationPermissionState();
  }

  requestPermission() {
    return requestNotificationPermissions();
  }

  hasSeenPermissionPrompt(userId: string) {
    return hasSeenNotificationPermissionPrompt(userId);
  }

  markPermissionPromptSeen(userId: string) {
    return markNotificationPermissionPromptSeen(userId);
  }

  reschedule() {
    return scheduleVocabularyNotifications();
  }

  refill() {
    return refillNotifications();
  }

  processDelivered() {
    return processDeliveredNotifications();
  }

  setForegroundTime() {
    return setLastForegroundTime();
  }

  setBackgroundTime() {
    return setLastBackgroundTime();
  }

  handleResponse(response: NotificationResponsePayload) {
    return handleNotificationResponse(response);
  }

  getLastResponse() {
    return getLastNotificationResponse();
  }

  addResponseListener(listener: (response: NotificationResponsePayload) => void) {
    return addNotificationResponseListener(listener);
  }

  clearLastResponse() {
    return clearLastNotificationResponse();
  }

  getPendingWord() {
    return getPendingNotificationWord();
  }

  clearPendingWord() {
    return clearPendingNotificationWord();
  }

  sendTest() {
    return sendTestNotification();
  }

  getSettings() {
    return getNotificationSettings();
  }

  updateSettings(settings: Partial<NotificationSettings>, skipScheduling = false) {
    return saveNotificationSettings(settings, skipScheduling);
  }

  getScheduledCount() {
    return getScheduledNotificationCount();
  }
}
