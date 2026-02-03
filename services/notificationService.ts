/**
 * Notification Service
 * 
 * Handles vocabulary word notifications with scheduling based on user preferences.
 * Features:
 * - Request notification permissions
 * - Schedule notifications within time range (start to end)
 * - Send word + translation in notification
 * - Auto-mark words as learned when notification is sent (if enabled)
 * - Unmark word when notification is clicked (for review)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { VocabularyWord, getStoredVocabulary } from './vocabularyService';
import { getCurrentLevel, markWordAsLearned, unmarkWord, getLearnedWords } from './progressService';

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const PENDING_NOTIFICATION_WORD_KEY = '@pending_notification_word';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NotificationSettings {
    enabled: boolean;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    frequencyMinutes: number; // 15, 30, 60, 120
    autoMarkLearned: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    startHour: 9,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    frequencyMinutes: 120, // Every 2 hours
    autoMarkLearned: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Notification Content Templates (Patterns)
// ─────────────────────────────────────────────────────────────────────────────
export const getNotificationContent = (word: VocabularyWord) => ({
    title: `VocBee`,
    body: `${word.word} - ${word.translation}, Tap to see example sentences`,
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission & Setup
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configure notification handler - call this in App.tsx
 */
export function configureNotifications(): void {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    // Note: We removed Device.isDevice check as it can return false in Expo Go
    // even on physical devices. The permission request itself will handle errors.

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        console.log('Current notification permission status:', existingStatus);

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('Requested notification permission, new status:', status);
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return false;
        }

        // Android specific channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('vocabulary', {
                name: 'Vocabulary Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
            });
        }

        console.log('Notification permissions granted successfully');
        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get notification settings from storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
    try {
        const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (data) {
            const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) };
            // Enforce minimum 60 minutes (migration for legacy 30-min settings)
            if (settings.frequencyMinutes < 60) {
                settings.frequencyMinutes = 60;
            }
            return settings;
        }
        return DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
        console.error('Error loading notification settings:', error);
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
}

/**
 * Save notification settings and reschedule if needed
 */
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
        const current = await getNotificationSettings();
        const updated = { ...current, ...settings };
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));

        // Reschedule notifications when settings change
        if (updated.enabled) {
            await scheduleVocabularyNotifications();
        } else {
            await cancelAllNotifications();
        }
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Scheduling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a random unlearned word for notification
 */
async function getRandomUnlearnedWord(): Promise<VocabularyWord | null> {
    try {
        const level = await getCurrentLevel();
        const vocabulary = await getStoredVocabulary(level);
        const learnedIds = await getLearnedWords(level);

        const unlearnedWords = vocabulary.filter(word => !learnedIds.includes(word.id));

        if (unlearnedWords.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * unlearnedWords.length);
        return unlearnedWords[randomIndex];
    } catch (error) {
        console.error('Error getting random word:', error);
        return null;
    }
}

/**
 * Schedule vocabulary notifications based on settings
 * Dynamically calculates how many days to schedule based on user settings
 * Max 64 notifications (iOS/Android limit)
 */
export async function scheduleVocabularyNotifications(): Promise<void> {
    try {
        const settings = await getNotificationSettings();

        if (!settings.enabled) {
            await cancelAllNotifications();
            return;
        }

        // Cancel existing notifications first
        await cancelAllNotifications();

        const MAX_NOTIFICATIONS = 64;
        const now = new Date();

        // Calculate notifications per day based on user settings
        const dailyStartMinutes = settings.startHour * 60 + settings.startMinute;
        const dailyEndMinutes = settings.endHour * 60 + settings.endMinute;
        const dailyTimeRangeMinutes = dailyEndMinutes - dailyStartMinutes;
        const notificationsPerDay = Math.floor(dailyTimeRangeMinutes / settings.frequencyMinutes) + 1;

        // Calculate how many days we can schedule
        const daysToSchedule = Math.ceil(MAX_NOTIFICATIONS / notificationsPerDay);

        console.log(`Notifications per day: ${notificationsPerDay}, scheduling for ${daysToSchedule} days`);

        let scheduledCount = 0;

        // Schedule for multiple days
        for (let day = 0; day < daysToSchedule && scheduledCount < MAX_NOTIFICATIONS; day++) {
            const baseDate = new Date(now);
            baseDate.setDate(baseDate.getDate() + day);

            const startTime = new Date(baseDate);
            startTime.setHours(settings.startHour, settings.startMinute, 0, 0);

            const endTime = new Date(baseDate);
            endTime.setHours(settings.endHour, settings.endMinute, 0, 0);

            // Schedule notifications for this day
            for (let i = 0; i < notificationsPerDay && scheduledCount < MAX_NOTIFICATIONS; i++) {
                const notificationTime = new Date(startTime.getTime() + i * settings.frequencyMinutes * 60 * 1000);

                // Skip if notification time is in the past
                if (notificationTime <= now) continue;

                const word = await getRandomUnlearnedWord();
                if (!word) continue;

                const { title, body } = getNotificationContent(word);

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title,
                        body,
                        data: {
                            wordId: word.id,
                            word: word.word,
                            translation: word.translation,
                            autoMark: settings.autoMarkLearned,
                        },
                        sound: 'default',
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: Math.max(1, Math.floor((notificationTime.getTime() - now.getTime()) / 1000)),
                        repeats: false,
                    },
                });

                // If autoMarkLearned is enabled, mark word as learned when scheduling
                if (settings.autoMarkLearned) {
                    const level = await getCurrentLevel();
                    await markWordAsLearned(level, word.id);
                }

                scheduledCount++;
            }
        }

        console.log(`Scheduled ${scheduledCount} notifications for ${daysToSchedule} days`);
    } catch (error) {
        console.error('Error scheduling notifications:', error);
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Response Handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store word ID when notification is clicked (for HomeScreen to show)
 */
export async function setPendingNotificationWord(wordId: number): Promise<void> {
    await AsyncStorage.setItem(PENDING_NOTIFICATION_WORD_KEY, wordId.toString());
}

/**
 * Get and clear pending notification word
 */
export async function getPendingNotificationWord(): Promise<number | null> {
    try {
        const wordId = await AsyncStorage.getItem(PENDING_NOTIFICATION_WORD_KEY);
        if (wordId) {
            await AsyncStorage.removeItem(PENDING_NOTIFICATION_WORD_KEY);
            return parseInt(wordId, 10);
        }
        return null;
    } catch (error) {
        console.error('Error getting pending word:', error);
        return null;
    }
}

/**
 * Handle notification response (when user taps notification)
 * - Unmark the word (revert learned status) so user can review
 * - Store word ID for HomeScreen to display
 */
export async function handleNotificationResponse(
    response: Notifications.NotificationResponse
): Promise<void> {
    const data = response.notification.request.content.data;

    if (data?.wordId) {
        const wordId = data.wordId as number;

        // If auto-mark was enabled, unmark the word so user can review it
        if (data.autoMark) {
            const level = await getCurrentLevel();
            await unmarkWord(level, wordId);
        }

        // Store word ID for HomeScreen
        await setPendingNotificationWord(wordId);
    }
}

/**
 * Send an immediate test notification
 */
export async function sendTestNotification(): Promise<void> {
    const word = await getRandomUnlearnedWord();

    if (!word) {
        console.log('No unlearned words available for test notification');
        return;
    }

    const { title, body } = getNotificationContent(word);

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: {
                wordId: word.id,
                word: word.word,
                translation: word.translation,
                autoMark: false, // Don't auto-mark for test
            },
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
            repeats: false,
        },
    });

    console.log('Test notification scheduled');
}
