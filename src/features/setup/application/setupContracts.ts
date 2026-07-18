import type { NotificationFrequencyKey } from '@features/notifications';

import type { UserPreferences } from '../domain/types';

export interface SetupCompletionInput extends UserPreferences {
  user: {
    uid: string;
    email: string;
    displayName?: string | null;
  } | null;
  notificationPermissionGranted: boolean;
  startHour: string;
  startMinute: string;
  endHour: string;
  endMinute: string;
  frequency: NotificationFrequencyKey;
}

export interface SetupPlatformGateway {
  getNotificationPermissionGranted(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
  openSystemSettings(): Promise<void>;
  persistCompletion(input: SetupCompletionInput): Promise<void>;
  prepareLearningContent(input: SetupCompletionInput): Promise<void>;
}

export interface SetupFacade {
  getNotificationPermissionGranted(): Promise<boolean>;
  requestNotificationPermission(): Promise<boolean>;
  openSystemSettings(): Promise<void>;
  complete(
    input: SetupCompletionInput,
    refreshNotificationSettings: () => Promise<void>,
  ): Promise<void>;
}
