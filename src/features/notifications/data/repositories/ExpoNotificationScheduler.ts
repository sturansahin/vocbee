import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ANDROID_STREAK_CHANNEL_ID, ANDROID_VOCABULARY_CHANNEL_ID } from '../../domain/constants';
import type {
  NotificationResponsePayload,
  NotificationResponseSubscription,
  NotificationScheduleRequest,
  ScheduledNotificationSnapshot,
} from '../../domain/types';
import type { NotificationScheduler } from '../contracts';

export class ExpoNotificationScheduler implements NotificationScheduler {
  configureForegroundHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: true,
      }),
    });
  }

  schedule(request: NotificationScheduleRequest): Promise<string> {
    const channelId =
      request.kind === 'streak' ? ANDROID_STREAK_CHANNEL_ID : ANDROID_VOCABULARY_CHANNEL_ID;

    return Notifications.scheduleNotificationAsync({
      ...(request.identifier ? { identifier: request.identifier } : {}),
      content: {
        title: request.title,
        body: request.body,
        data: request.data,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, request.seconds),
        repeats: false,
      },
    });
  }

  async getScheduled(): Promise<ScheduledNotificationSnapshot[]> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.map((notification) => ({
      identifier: notification.identifier,
      data: notification.content?.data as Record<string, unknown> | undefined,
    }));
  }

  async getPresentedIds(): Promise<string[]> {
    const presented = await Notifications.getPresentedNotificationsAsync();
    return presented.map((notification) => notification.request.identifier);
  }

  cancel(identifier: string): Promise<void> {
    return Notifications.cancelScheduledNotificationAsync(identifier);
  }

  cancelAll(): Promise<void> {
    return Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getLastResponse(): Promise<NotificationResponsePayload | null> {
    return (await Notifications.getLastNotificationResponseAsync()) as unknown as NotificationResponsePayload | null;
  }

  addResponseListener(
    listener: (response: NotificationResponsePayload) => void,
  ): NotificationResponseSubscription {
    return Notifications.addNotificationResponseReceivedListener((response) =>
      listener(response as unknown as NotificationResponsePayload),
    );
  }

  clearLastResponse(): Promise<void> {
    return Notifications.clearLastNotificationResponseAsync();
  }
}
