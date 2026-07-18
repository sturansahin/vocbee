import type { NotificationSettings } from '@features/notifications';
import { resetProgress } from '@features/progress';

import {
  cancelAllNotifications,
  clearTrackedNotifications,
  getNotificationSettings,
  saveNotificationSettings,
} from '@features/notifications';
import type { AuthNotificationGateway, AuthProgressGateway } from '../../application/contracts';

export class LegacyAuthSideEffectsGateway implements AuthNotificationGateway, AuthProgressGateway {
  getSettings(): Promise<NotificationSettings> {
    return getNotificationSettings();
  }

  saveSettings(settings: Partial<NotificationSettings>): Promise<void> {
    return saveNotificationSettings(settings);
  }

  cancelAll(): Promise<void> {
    return cancelAllNotifications();
  }

  clearTracked(): Promise<void> {
    return clearTrackedNotifications();
  }

  async resetWithoutSync(): Promise<void> {
    await resetProgress({ markUnsynced: false });
  }
}
