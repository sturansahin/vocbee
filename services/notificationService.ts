/**
 * Notification Service
 * 
 * Handles vocabulary word notifications with scheduling based on user preferences.
 * Features:
 * - Request notification permissions
 * - Schedule notifications within time range (start to end)
 * - Send target word + translation in notification
 * - Auto-mark words as learned when notification is sent (if enabled)
 * - Unmark word when notification is clicked (for review)
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { VocabularyWord, Level, LEVELS, getStoredVocabulary } from './vocabularyService';
import { getCurrentLevel, markWordAsLearned, unmarkWord, getLearnedWords } from './progressService';
import { STORAGE_KEYS } from './storageKeys';
import { getStreakState, isStreakCompletedToday } from './streakService';

// ─────────────────────────────────────────────────────────────────────────────
// Storage Keys (centralized via storageKeys.ts)
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFICATION_SETTINGS_KEY = STORAGE_KEYS.NOTIFICATION_SETTINGS;
const PENDING_NOTIFICATION_WORD_KEY = STORAGE_KEYS.PENDING_NOTIFICATION_WORD;
const TRACKED_NOTIFICATIONS_KEY = STORAGE_KEYS.TRACKED_NOTIFICATIONS;
const LAST_FOREGROUND_TIME_KEY = STORAGE_KEYS.LAST_FOREGROUND_TIME;
const LAST_BACKGROUND_TIME_KEY = STORAGE_KEYS.LAST_BACKGROUND_TIME;
const NOTIFICATION_CONTENT_VERSION_KEY = STORAGE_KEYS.NOTIFICATION_CONTENT_VERSION;
const NOTIFICATION_PERMISSION_PROMPT_PREFIX = STORAGE_KEYS.NOTIFICATION_PERMISSION_PROMPT_PREFIX;
const NOTIFICATION_CONTENT_VERSION = 4;

const MAX_SCHEDULED_NOTIFICATIONS = 64;
const STREAK_NOTIFICATION_RESERVED_SLOTS = 1;
export const MAX_VOCABULARY_NOTIFICATIONS = MAX_SCHEDULED_NOTIFICATIONS - STREAK_NOTIFICATION_RESERVED_SLOTS;

const VOCABULARY_NOTIFICATION_PREFIX = 'vocbee-vocab-';
const LEGACY_VOCABULARY_REFILL_PREFIX = 'vocbee-refill-';
const STREAK_NOTIFICATION_ID = 'vocbee-streak-reminder';
const STREAK_REMINDER_HOUR = 21;
const STREAK_REMINDER_MINUTE = 0;
const ANDROID_VOCABULARY_CHANNEL_ID = 'vocabulary';
const ANDROID_STREAK_CHANNEL_ID = 'streak';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface NotificationSettings {
    enabled: boolean;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    frequencyMinutes: number; // 60, 120, 180, 360, 1440
    autoMarkLearned: boolean;
}

/**
 * Tracked notification for processing delivered notifications
 */
export interface TrackedNotification {
    notificationId: string;
    wordId: number;
    word: string;
    pronunciation?: string | null;
    translation: string;
    scheduledTime: number;      // timestamp when notification will fire
    autoMarkLearned: boolean;   // setting at time of scheduling
    processed: boolean;         // true if notification has been processed
    level: string;              // CEFR level at time of scheduling (A1, A2, etc.)
    targetLanguage: string;     // target language at time of scheduling
}

export interface PendingNotificationWord {
    wordId: number;
    level?: string;
    targetLanguage?: string;
}

type NotificationKind = 'vocabulary' | 'streak';

export interface NotificationPermissionState {
    status: string;
    granted: boolean;
    canAskAgain: boolean;
    expires: string | number;
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

function normalizeNotificationSettings(
    settings?: Partial<NotificationSettings> | null
): NotificationSettings {
    const normalized = {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(settings ?? {}),
    };

    if (normalized.frequencyMinutes < 60) {
        normalized.frequencyMinutes = 60;
    }

    normalized.startHour = Number.isFinite(normalized.startHour)
        ? normalized.startHour
        : DEFAULT_NOTIFICATION_SETTINGS.startHour;
    normalized.startMinute = Number.isFinite(normalized.startMinute)
        ? normalized.startMinute
        : DEFAULT_NOTIFICATION_SETTINGS.startMinute;
    normalized.endHour = Number.isFinite(normalized.endHour)
        ? normalized.endHour
        : DEFAULT_NOTIFICATION_SETTINGS.endHour;
    normalized.endMinute = Number.isFinite(normalized.endMinute)
        ? normalized.endMinute
        : DEFAULT_NOTIFICATION_SETTINGS.endMinute;

    return normalized;
}

function getNotificationPermissionPromptKey(userId: string): string {
    return `${NOTIFICATION_PERMISSION_PROMPT_PREFIX}${userId}`;
}

function getDailyNotificationSlotCount(
    startMinutes: number,
    endMinutes: number,
    frequencyMinutes: number
): number {
    const isFullDay = startMinutes === endMinutes;
    if (isFullDay) {
        // Full 24h mode is modeled as an inclusive range, but we must avoid
        // duplicating the next day's start timestamp in the same batch.
        return Math.floor((1440 - 1) / frequencyMinutes) + 1;
    }

    const rangeMinutes = endMinutes > startMinutes
        ? endMinutes - startMinutes
        : (1440 - startMinutes) + endMinutes;

    return Math.floor(rangeMinutes / frequencyMinutes) + 1;
}

function isLegacyVocabularyNotificationId(identifier: string): boolean {
    return /^vocbee-\d+-\d+$/.test(identifier);
}

function isVocabularyNotificationId(identifier: string): boolean {
    return (
        identifier.startsWith(VOCABULARY_NOTIFICATION_PREFIX) ||
        identifier.startsWith(LEGACY_VOCABULARY_REFILL_PREFIX) ||
        isLegacyVocabularyNotificationId(identifier)
    );
}

function isStreakNotificationId(identifier: string): boolean {
    return identifier === STREAK_NOTIFICATION_ID || identifier.startsWith('vocbee-streak-');
}

async function cancelScheduledNotificationsByPredicate(
    predicate: (identifier: string) => boolean
): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const identifiers = scheduled
        .map(notification => notification.identifier)
        .filter((identifier): identifier is string => typeof identifier === 'string' && predicate(identifier));

    if (identifiers.length === 0) return;

    await Promise.all(
        identifiers.map(identifier => Notifications.cancelScheduledNotificationAsync(identifier))
    );
}

function getNextStreakReminderTime(now: Date, completedToday: boolean): Date {
    const reminderTime = new Date(now);
    reminderTime.setHours(STREAK_REMINDER_HOUR, STREAK_REMINDER_MINUTE, 0, 0);

    if (completedToday || reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }

    return reminderTime;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Content Templates (Patterns)
// ─────────────────────────────────────────────────────────────────────────────
import i18n from './i18n';

type NotificationWordSnapshot = Pick<VocabularyWord, 'word' | 'translation'>;

function formatNotificationBody(word: NotificationWordSnapshot): string {
    return `${word.word} - ${word.translation}, ${i18n.t('home.tapToSeeExamples')}`;
}

async function isNotificationContentOutdated(): Promise<boolean> {
    const storedVersion = await AsyncStorage.getItem(NOTIFICATION_CONTENT_VERSION_KEY);
    return storedVersion !== String(NOTIFICATION_CONTENT_VERSION);
}

async function markNotificationContentCurrent(): Promise<void> {
    await AsyncStorage.setItem(NOTIFICATION_CONTENT_VERSION_KEY, String(NOTIFICATION_CONTENT_VERSION));
}

export const getNotificationContent = (word: VocabularyWord) => ({
    title: `VocBee`,
    body: formatNotificationBody(word),
});

export const getStreakReminderContent = () => ({
    title: i18n.t('notifications.streakReminderTitle'),
    body: i18n.t('notifications.streakReminderBody'),
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
            shouldShowAlert: false,  // Don't show when app is open (we skip these in processDeliveredNotifications)
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: true,
        }),
    });
}

export async function ensureNotificationChannelConfigured(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync(ANDROID_VOCABULARY_CHANNEL_ID, {
        name: 'Vocabulary Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
    });

    await Notifications.setNotificationChannelAsync(ANDROID_STREAK_CHANNEL_ID, {
        name: 'Streak Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF8F1F',
    });
}

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
    const permissions = await Notifications.getPermissionsAsync();

    return {
        status: permissions.status,
        granted: permissions.granted,
        canAskAgain: permissions.canAskAgain,
        expires: permissions.expires,
    };
}

export async function hasNotificationPermission(): Promise<boolean> {
    const permissionState = await getNotificationPermissionState();
    return permissionState.granted;
}

export async function hasSeenNotificationPermissionPrompt(userId: string): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(getNotificationPermissionPromptKey(userId));
        return value === 'true';
    } catch (error) {
        console.error('[Notifications] Failed to read permission prompt flag:', error);
        return false;
    }
}

export async function markNotificationPermissionPromptSeen(userId: string): Promise<void> {
    try {
        await AsyncStorage.setItem(getNotificationPermissionPromptKey(userId), 'true');
    } catch (error) {
        console.error('[Notifications] Failed to persist permission prompt flag:', error);
    }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const existingPermissionState = await getNotificationPermissionState();
        let finalStatus = existingPermissionState.status;

        console.log('Current notification permission status:', existingPermissionState.status);

        if (existingPermissionState.granted) {
            await ensureNotificationChannelConfigured();
            console.log('Notification permissions already granted');
            return true;
        }

        if (!existingPermissionState.canAskAgain) {
            console.log('Notification permissions cannot be requested again from the system prompt');
            return false;
        }

        if (existingPermissionState.status !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                },
            });
            finalStatus = status;
            console.log('Requested notification permission, new status:', status);
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return false;
        }

        await ensureNotificationChannelConfigured();

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
            return normalizeNotificationSettings(JSON.parse(data));
        }
        return normalizeNotificationSettings();
    } catch (error) {
        console.error('Error loading notification settings:', error);
        return normalizeNotificationSettings();
    }
}

/**
 * Save notification settings and reschedule if needed
 * @param skipScheduling - If true, only saves settings without rescheduling (useful during setup)
 */
export async function saveNotificationSettings(
    settings: Partial<NotificationSettings>, 
    skipScheduling: boolean = false
): Promise<void> {
    try {
        const current = await getNotificationSettings();
        const updated = normalizeNotificationSettings({ ...current, ...settings });
        await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));

        // Skip rescheduling if requested (e.g., during setup before vocabulary exists)
        if (skipScheduling) {
            console.log('[Notifications] Settings saved without scheduling (skipScheduling=true)');
            return;
        }

        // Reschedule notifications when settings change (fire-and-forget to avoid UI freeze)
        if (updated.enabled) {
            scheduleVocabularyNotifications().catch(err =>
                console.error('[Notifications] Background scheduling failed:', err)
            );
        } else {
            cancelAllNotifications().catch(() => {});
            clearTrackedNotifications().catch(() => {}); // Clear tracking when disabled
        }
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Foreground Tracking (to skip notifications when app is open)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record when app entered foreground
 * Call this when app becomes active
 */
export async function setLastForegroundTime(): Promise<void> {
    await AsyncStorage.setItem(LAST_FOREGROUND_TIME_KEY, Date.now().toString());
}

/**
 * Record when app entered background
 * Call this when app becomes inactive/background
 */
export async function setLastBackgroundTime(): Promise<void> {
    await AsyncStorage.setItem(LAST_BACKGROUND_TIME_KEY, Date.now().toString());
}

/**
 * Get the last time app was in foreground
 */
async function getLastForegroundTime(): Promise<number> {
    try {
        const time = await AsyncStorage.getItem(LAST_FOREGROUND_TIME_KEY);
        return time ? parseInt(time, 10) : 0;
    } catch {
        return 0;
    }
}

/**
 * Get the last time app was in background
 */
async function getLastBackgroundTime(): Promise<number> {
    try {
        const time = await AsyncStorage.getItem(LAST_BACKGROUND_TIME_KEY);
        return time ? parseInt(time, 10) : 0;
    } catch {
        return 0;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Tracking System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all tracked notifications from storage
 */
async function getTrackedNotifications(): Promise<TrackedNotification[]> {
    try {
        const data = await AsyncStorage.getItem(TRACKED_NOTIFICATIONS_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('[Notifications] Error loading tracked notifications:', error);
        return [];
    }
}

/**
 * Save tracked notifications to storage
 */
async function saveTrackedNotifications(notifications: TrackedNotification[]): Promise<void> {
    try {
        await AsyncStorage.setItem(TRACKED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
        console.error('[Notifications] Error saving tracked notifications:', error);
    }
}

/**
 * Add a notification to tracking
 */
async function addTrackedNotification(notification: TrackedNotification): Promise<void> {
    const tracked = await getTrackedNotifications();
    tracked.push(notification);
    await saveTrackedNotifications(tracked);
}

/**
 * Clear all tracked notifications
 * Used when disabling notifications or during logout/account deletion
 */
export async function clearTrackedNotifications(): Promise<void> {
    await AsyncStorage.removeItem(TRACKED_NOTIFICATIONS_KEY);
}

/**
 * Process delivered notifications
 * 
 * This function is called when the app opens. It:
 * 1. Finds notifications that have been delivered (scheduledTime < now)
 * 2. Cross-checks with OS notification tray to verify actual delivery
 * 3. Checks if notification was delivered while app was in foreground (skip these)
 * 4. Validates level+language match (skip if user changed settings)
 * 5. Marks words as learned based on autoMarkLearned setting (only for verified deliveries)
 * 6. Removes processed notifications from tracking
 * 7. Returns count of processed notifications for refill
 */
export async function processDeliveredNotifications(): Promise<number> {
    try {
        const settings = await getNotificationSettings();
        
        // Don't process if notifications are disabled
        if (!settings.enabled) {
            console.log('[Notifications] Processing skipped - notifications disabled');
            return 0;
        }

        const tracked = await getTrackedNotifications();
        const now = Date.now();
        const lastForegroundTime = await getLastForegroundTime();
        const lastBackgroundTime = await getLastBackgroundTime();

        // Find delivered but unprocessed notifications
        const delivered = tracked.filter(n => !n.processed && n.scheduledTime < now);

        if (delivered.length === 0) {
            console.log('[Notifications] No delivered notifications to process');
            return 0;
        }

        console.log(`[Notifications] Processing ${delivered.length} delivered notifications`);
        if (lastForegroundTime > 0) {
            console.log(`[Notifications] Last foreground time: ${new Date(lastForegroundTime).toISOString()}`);
        }
        if (lastBackgroundTime > 0) {
            console.log(`[Notifications] Last background time: ${new Date(lastBackgroundTime).toISOString()}`);
        }

        // ── OS-level delivery verification ──────────────────────────────────
        // Query the OS notification tray for actually-delivered notifications.
        // If a notification was suppressed by DND, battery saver, or the user
        // revoked permission, it won't appear here → we skip the "learned" mark.
        let osDeliveredIds: Set<string> | null = null;
        try {
            const presentedNotifications = await Notifications.getPresentedNotificationsAsync();
            osDeliveredIds = new Set(presentedNotifications.map(n => n.request.identifier));
            console.log(`[Notifications] OS tray contains ${osDeliveredIds.size} notifications`);
        } catch (e) {
            // getPresentedNotificationsAsync may not be available on all platforms
            // Fall back to time-based heuristic (current behavior)
            console.warn('[Notifications] Could not query OS tray, using time-based heuristic:', e);
        }
        // ─────────────────────────────────────────────────────────────────────

        const currentLevel = await getCurrentLevel();
        const currentTargetLanguage = await AsyncStorage.getItem('@target_language');
        let processedCount = 0;
        let skippedCount = 0;

        const hasForegroundWindow =
            lastForegroundTime > 0 &&
            lastBackgroundTime > lastForegroundTime;

        // Process each delivered notification
        for (const notification of delivered) {
            // Check if notification was delivered while app was in foreground
            // Skip if scheduled time falls within the last foreground session window
            if (
                hasForegroundWindow &&
                notification.scheduledTime >= lastForegroundTime &&
                notification.scheduledTime <= lastBackgroundTime
            ) {
                // Skip - notification arrived while app was open
                console.log(`[Notifications] SKIPPED "${notification.word}" - delivered while app was open`);
                skippedCount++;
                continue;
            }

            // ── OS delivery check ───────────────────────────────────────────
            // If we successfully queried the OS tray AND this notification is
            // NOT present, it was likely suppressed (DND / permission revoked /
            // battery restrictions). Don't mark the word as learned.
            if (osDeliveredIds !== null && !osDeliveredIds.has(notification.notificationId)) {
                // Grace period: notifications fired very recently (< 2 min) may
                // not yet appear in the tray query on some devices.
                const ageMs = now - notification.scheduledTime;
                if (ageMs > 2 * 60 * 1000) {
                    console.log(`[Notifications] SKIPPED "${notification.word}" - not confirmed by OS (likely suppressed)`);
                    skippedCount++;
                    continue;
                }
            }
            // ─────────────────────────────────────────────────────────────────

            // CRITICAL: Validate level and language match
            // If user changed level or language, wordId may refer to a different word
            if (notification.level && notification.level !== currentLevel) {
                console.log(`[Notifications] SKIPPED "${notification.word}" - level changed (${notification.level} -> ${currentLevel})`);
                skippedCount++;
                continue;
            }
            if (notification.targetLanguage && notification.targetLanguage !== currentTargetLanguage) {
                console.log(`[Notifications] SKIPPED "${notification.word}" - language changed (${notification.targetLanguage} -> ${currentTargetLanguage})`);
                skippedCount++;
                continue;
            }

            // Notification was delivered while app was in background
            if (notification.autoMarkLearned) {
                // Mark word as learned
                await markWordAsLearned(currentLevel, notification.wordId);
                console.log(`[Notifications] Word "${notification.word}" marked as LEARNED`);
            } else {
                // Word was shown but not auto-marked - it stays in the pool
                console.log(`[Notifications] Word "${notification.word}" notification delivered (not auto-marked)`);
            }
            processedCount++;
        }

        // Remove all due notifications from tracking (processed or skipped).
        // Keeping tapped/processed items causes unbounded tracking growth.
        const remaining = tracked.filter(n => n.scheduledTime >= now);
        await saveTrackedNotifications(remaining);

        console.log(`[Notifications] Processed ${processedCount} notifications, skipped ${skippedCount}, ${remaining.length} remaining`);

        return processedCount;
    } catch (error) {
        console.error('[Notifications] Error processing delivered notifications:', error);
        return 0;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Scheduling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a random unlearned word for notification, avoiding duplicates
 * in the current scheduling batch.
 *
 * Accepts pre-loaded vocabulary & learnedIds to avoid repeated AsyncStorage
 * reads inside tight loops (was the root cause of UI freeze when scheduling
 * 64 notifications — 192+ storage reads).
 */
const _scheduledWordIds = new Set<number>();

function pickRandomUnlearnedWord(
    vocabulary: VocabularyWord[],
    learnedIds: number[],
): VocabularyWord | null {
    // Filter out learned words AND words already picked in this batch
    const unlearnedWords = vocabulary.filter(
        word => !learnedIds.includes(word.id) && !_scheduledWordIds.has(word.id)
    );

    if (unlearnedWords.length === 0) {
        // If all unlearned words exhausted in dedup set, allow repeats
        const fallback = vocabulary.filter(word => !learnedIds.includes(word.id));
        if (fallback.length === 0) return null;
        return fallback[Math.floor(Math.random() * fallback.length)];
    }

    const word = unlearnedWords[Math.floor(Math.random() * unlearnedWords.length)];
    _scheduledWordIds.add(word.id);
    return word;
}

/**
 * Legacy wrapper — still used by sendTestNotification.
 * Reads storage once per call (fine for single invocations).
 */
async function getRandomUnlearnedWord(): Promise<VocabularyWord | null> {
    try {
        const level = await getCurrentLevel();
        const vocabulary = await getStoredVocabulary(level);
        const learnedIds = await getLearnedWords(level);
        return pickRandomUnlearnedWord(vocabulary, learnedIds);
    } catch (error) {
        console.error('Error getting random word:', error);
        return null;
    }
}

/**
 * Schedule vocabulary notifications based on settings
 * Dynamically calculates how many days to schedule based on user settings
 * Max 63 vocabulary notifications. One pending notification slot is reserved
 * for the fixed 21:00 streak reminder.
 * 
 * IMPORTANT: Words are NOT marked as learned here anymore.
 * Instead, they are tracked and processed when app opens via processDeliveredNotifications()
 */
export async function scheduleVocabularyNotifications(): Promise<void> {
    try {
        const settings = await getNotificationSettings();

        if (!settings.enabled) {
            await cancelAllNotifications();
            await clearTrackedNotifications();
            return;
        }

        const permissionGranted = await hasNotificationPermission();
        if (!permissionGranted) {
            console.log('[Notifications] Scheduling skipped - notification permission not granted');
            await cancelAllNotifications();
            await clearTrackedNotifications();
            return;
        }

        await ensureNotificationChannelConfigured();

        // Cancel only vocabulary notifications and clear vocabulary tracking.
        // Streak reminder owns its reserved slot and must survive vocab rebuilds.
        await cancelVocabularyNotifications();
        await clearTrackedNotifications();

        // Reset dedup set for fresh scheduling batch
        _scheduledWordIds.clear();

        const now = new Date();
        const remainingScheduled = await Notifications.getAllScheduledNotificationsAsync();
        const nonStreakReservedCount = remainingScheduled.filter(notification =>
            !isStreakNotificationId(notification.identifier)
        ).length;
        const vocabularyCapacity = Math.max(
            0,
            Math.min(
                MAX_VOCABULARY_NOTIFICATIONS,
                MAX_SCHEDULED_NOTIFICATIONS - STREAK_NOTIFICATION_RESERVED_SLOTS - nonStreakReservedCount
            )
        );

        if (vocabularyCapacity <= 0) {
            console.log('[Notifications] No available notification slots for vocabulary schedule');
            await scheduleStreakReminderNotification();
            return;
        }

        // Get current level and target language for tracking
        const currentLevel = await getCurrentLevel();
        const currentTargetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
        if (!currentLevel || !currentTargetLanguage) {
            console.warn('[Notifications] Cannot schedule - level or language not set');
            return;
        }

        // Pre-load vocabulary & learned words ONCE (avoids N×3 storage reads in loop)
        const vocabulary = await getStoredVocabulary(currentLevel);
        const learnedIds = await getLearnedWords(currentLevel);

        // Calculate notifications per day based on user settings
        const dailyStartMinutes = settings.startHour * 60 + settings.startMinute;
        const dailyEndMinutes = settings.endHour * 60 + settings.endMinute;

        const isFullDayRange = dailyStartMinutes === dailyEndMinutes;
        const notificationsPerDay = getDailyNotificationSlotCount(
            dailyStartMinutes,
            dailyEndMinutes,
            settings.frequencyMinutes
        );

        // Calculate how many days we can schedule
        const daysToSchedule = Math.ceil(vocabularyCapacity / notificationsPerDay);

        console.log(`[Notifications] Per day: ${notificationsPerDay}, scheduling for ${daysToSchedule} days`);

        let scheduledCount = 0;
        const trackedNotifications: TrackedNotification[] = [];

        // Schedule for multiple days
        for (let day = 0; day < daysToSchedule && scheduledCount < vocabularyCapacity; day++) {
            const baseDate = new Date(now);
            baseDate.setDate(baseDate.getDate() + day);

            const startTime = new Date(baseDate);
            startTime.setHours(settings.startHour, settings.startMinute, 0, 0);

            const isOvernight = dailyEndMinutes <= dailyStartMinutes;

            // Schedule notifications for this day
            for (let i = 0; i < notificationsPerDay && scheduledCount < vocabularyCapacity; i++) {
                const notificationTime = new Date(startTime.getTime() + i * settings.frequencyMinutes * 60 * 1000);

                // For overnight ranges, check the notification hasn't passed the end time the next day
                if (isOvernight && !isFullDayRange) {
                    const ntMinutes = notificationTime.getHours() * 60 + notificationTime.getMinutes();
                    // After midnight and strictly past end time → stop for this day.
                    // End time is inclusive (e.g. 22:00→06:00 includes 06:00).
                    if (notificationTime > startTime && ntMinutes > dailyEndMinutes && ntMinutes < dailyStartMinutes) {
                        break;
                    }
                }

                // Skip if notification time is in the past
                if (notificationTime <= now) continue;

                const word = pickRandomUnlearnedWord(vocabulary, learnedIds);
                if (!word) continue;

                const notificationId = `${VOCABULARY_NOTIFICATION_PREFIX}${word.id}-${notificationTime.getTime()}`;

                // Track this notification (do NOT await schedule individually)
                trackedNotifications.push({
                    notificationId,
                    wordId: word.id,
                    word: word.word,
                    pronunciation: word.pronunciation ?? null,
                    translation: word.translation,
                    scheduledTime: notificationTime.getTime(),
                    autoMarkLearned: settings.autoMarkLearned,
                    processed: false,
                    level: currentLevel,
                    targetLanguage: currentTargetLanguage,
                });

                scheduledCount++;
            }
        }

        // Schedule all notifications in parallel (avoids sequential native bridge calls)
        await Promise.all(
            trackedNotifications.map(tracked =>
                Notifications.scheduleNotificationAsync({
                    identifier: tracked.notificationId,
                    content: {
                        title: 'VocBee',
                        body: formatNotificationBody(tracked),
                        data: {
                            kind: 'vocabulary' as NotificationKind,
                            wordId: tracked.wordId,
                            word: tracked.word,
                            pronunciation: tracked.pronunciation ?? undefined,
                            translation: tracked.translation,
                            autoMark: tracked.autoMarkLearned,
                            level: tracked.level,
                            targetLanguage: tracked.targetLanguage,
                            scheduledTime: tracked.scheduledTime,
                        },
                        sound: 'default',
                        ...(Platform.OS === 'android' ? { channelId: ANDROID_VOCABULARY_CHANNEL_ID } : {}),
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                        seconds: Math.max(1, Math.floor((tracked.scheduledTime - now.getTime()) / 1000)),
                        repeats: false,
                    },
                })
            )
        );

        // Save all tracked notifications at once
        await saveTrackedNotifications(trackedNotifications);
        await markNotificationContentCurrent();
        await scheduleStreakReminderNotification();

        console.log(`[Notifications] Scheduled ${scheduledCount} notifications for ${daysToSchedule} days`);
    } catch (error) {
        console.error('[Notifications] Error scheduling notifications:', error);
    }
}

/**
 * Cancel only scheduled vocabulary notifications.
 * Keeps the reserved streak reminder slot intact during vocabulary rebuilds.
 */
export async function cancelVocabularyNotifications(): Promise<void> {
    await cancelScheduledNotificationsByPredicate(isVocabularyNotificationId);
}

/**
 * Cancel only scheduled streak reminder notifications.
 */
export async function cancelStreakReminderNotification(): Promise<void> {
    await cancelScheduledNotificationsByPredicate(isStreakNotificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedule the single fixed 21:00 streak reminder.
 *
 * Local notifications cannot check streak state at delivery time, so we keep one
 * pending reminder and rebuild it whenever the app starts/resumes or the streak
 * changes. If today's streak is already complete, the reminder is moved to
 * tomorrow.
 */
export async function scheduleStreakReminderNotification(now: Date = new Date()): Promise<void> {
    try {
        const settings = await getNotificationSettings();
        if (!settings.enabled) {
            await cancelStreakReminderNotification();
            return;
        }

        const permissionGranted = await hasNotificationPermission();
        if (!permissionGranted) {
            await cancelStreakReminderNotification();
            return;
        }

        await ensureNotificationChannelConfigured();

        const streakState = await getStreakState(now);
        const completedToday = isStreakCompletedToday(streakState, now);
        const reminderTime = getNextStreakReminderTime(now, completedToday);
        const { title, body } = getStreakReminderContent();

        await cancelStreakReminderNotification();

        await Notifications.scheduleNotificationAsync({
            identifier: STREAK_NOTIFICATION_ID,
            content: {
                title,
                body,
                data: {
                    kind: 'streak' as NotificationKind,
                    scheduledTime: reminderTime.getTime(),
                    reminderHour: STREAK_REMINDER_HOUR,
                    reminderMinute: STREAK_REMINDER_MINUTE,
                },
                sound: 'default',
                ...(Platform.OS === 'android' ? { channelId: ANDROID_STREAK_CHANNEL_ID } : {}),
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: Math.max(1, Math.floor((reminderTime.getTime() - now.getTime()) / 1000)),
                repeats: false,
            },
        });

        console.log(`[Notifications] Streak reminder scheduled for ${reminderTime.toISOString()}`);
    } catch (error) {
        console.error('[Notifications] Error scheduling streak reminder:', error);
    }
}

/**
 * Smart Notification Refill
 * 
 * Instead of canceling all notifications and rescheduling, this function:
 * 1. Checks how many notifications are currently scheduled
 * 2. Calculates how many more vocabulary notifications can be added
 *    (up to 63, preserving one slot for streak)
 * 3. Schedules new notifications AFTER the last scheduled one
 * 
 * This ensures existing scheduled notifications are preserved.
 */
export async function refillNotifications(): Promise<void> {
    try {
        const settings = await getNotificationSettings();

        if (!settings.enabled) {
            console.log('[Notifications] Refill skipped - notifications disabled');
            await cancelStreakReminderNotification();
            return;
        }

        const permissionGranted = await hasNotificationPermission();
        if (!permissionGranted) {
            console.log('[Notifications] Refill skipped - notification permission not granted');
            await cancelAllNotifications();
            await clearTrackedNotifications();
            return;
        }

        await ensureNotificationChannelConfigured();

        if (await isNotificationContentOutdated()) {
            console.log('[Notifications] Notification content changed, rebuilding schedule');
            await scheduleVocabularyNotifications();
            return;
        }

        await scheduleStreakReminderNotification();

        // Get currently scheduled notifications
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const vocabularyScheduled = scheduled.filter(notification =>
            isVocabularyNotificationId(notification.identifier)
        );
        const currentVocabularyCount = vocabularyScheduled.length;

        console.log(`[Notifications] Vocabulary scheduled: ${currentVocabularyCount}/${MAX_VOCABULARY_NOTIFICATIONS}, total scheduled: ${scheduled.length}/${MAX_SCHEDULED_NOTIFICATIONS}`);

        // If already at max, no need to refill
        if (currentVocabularyCount >= MAX_VOCABULARY_NOTIFICATIONS) {
            console.log('[Notifications] Vocabulary notifications already at max capacity, no refill needed');
            return;
        }

        // Calculate how many notifications we can add
        const availableSystemSlots = Math.max(0, MAX_SCHEDULED_NOTIFICATIONS - scheduled.length);
        const availableVocabularySlots = MAX_VOCABULARY_NOTIFICATIONS - currentVocabularyCount;
        const availableSlots = Math.min(availableSystemSlots, availableVocabularySlots);

        if (availableSlots <= 0) {
            console.log('[Notifications] No available notification slots for vocabulary refill');
            return;
        }

        // Get current tracked notifications
        const trackedNotifications = await getTrackedNotifications();

        // Find the last scheduled notification time from tracking (preferred)
        let lastScheduledTime = new Date();
        if (trackedNotifications.length > 0) {
            const maxTime = Math.max(...trackedNotifications.map(n => n.scheduledTime));
            if (maxTime > lastScheduledTime.getTime()) {
                lastScheduledTime = new Date(maxTime);
            }
        }
        // Fallback: use scheduled notifications that include absolute scheduledTime in data
        if (vocabularyScheduled.length > 0 && trackedNotifications.length === 0) {
            for (const notification of vocabularyScheduled) {
                const scheduledTime = (notification.content?.data as any)?.scheduledTime;
                if (typeof scheduledTime === 'number' && scheduledTime > lastScheduledTime.getTime()) {
                    lastScheduledTime = new Date(scheduledTime);
                }
            }
        }

        console.log(`[Notifications] Last scheduled time: ${lastScheduledTime.toISOString()}`);
        console.log(`[Notifications] Available slots: ${availableSlots}`);

        // Calculate notifications per day for proper time spacing
        const dailyStartMinutes = settings.startHour * 60 + settings.startMinute;
        const dailyEndMinutes = settings.endHour * 60 + settings.endMinute;
        const isOvernight = dailyEndMinutes <= dailyStartMinutes;
        const isFullDayRange = dailyStartMinutes === dailyEndMinutes;

        let scheduledCount = 0;
        let currentTime = new Date(lastScheduledTime);
        const newTrackedNotifications: TrackedNotification[] = [];

        // Reset dedup set for this refill batch
        _scheduledWordIds.clear();

        // Hoist async I/O outside the loop for performance
        const currentLevel = await getCurrentLevel();
        const currentTargetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
        const safeTargetLanguage = currentTargetLanguage || 'english';
        const vocabulary = await getStoredVocabulary(currentLevel);
        const learnedIds = await getLearnedWords(currentLevel);

        // Schedule new notifications after the last one
        while (scheduledCount < availableSlots) {
            // Move to next notification time
            currentTime = new Date(currentTime.getTime() + settings.frequencyMinutes * 60 * 1000);

            // Check if we're outside the allowed time window
            const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
            if (isOvernight && !isFullDayRange) {
                // Overnight range (e.g. 22:00→06:00): gap is endMinutes..startMinutes
                if (currentMinutes > dailyEndMinutes && currentMinutes < dailyStartMinutes) {
                    // In the gap → jump to today's start time (which is later today)
                    currentTime.setHours(settings.startHour, settings.startMinute, 0, 0);
                }
            } else {
                // Normal range (e.g. 09:00→21:00)
                if (currentMinutes > dailyEndMinutes) {
                    // Past end → jump to next day's start
                    currentTime.setDate(currentTime.getDate() + 1);
                    currentTime.setHours(settings.startHour, settings.startMinute, 0, 0);
                } else if (currentMinutes < dailyStartMinutes) {
                    // Before start → jump to today's start
                    currentTime.setHours(settings.startHour, settings.startMinute, 0, 0);
                }
            }

            // Pick a random unlearned word (sync — no storage reads)
            const word = pickRandomUnlearnedWord(vocabulary, learnedIds);
            if (!word) {
                console.log('[Notifications] No unlearned words available, stopping refill');
                break;
            }

            newTrackedNotifications.push({
                notificationId: `${VOCABULARY_NOTIFICATION_PREFIX}refill-${word.id}-${currentTime.getTime()}`,
                wordId: word.id,
                word: word.word,
                pronunciation: word.pronunciation ?? null,
                translation: word.translation,
                scheduledTime: currentTime.getTime(),
                autoMarkLearned: settings.autoMarkLearned,
                processed: false,
                level: currentLevel,
                targetLanguage: safeTargetLanguage,
            });

            scheduledCount++;
        }

        // Schedule all notifications in parallel (avoids sequential native bridge calls)
        if (newTrackedNotifications.length > 0) {
            const now = new Date();
            await Promise.all(
                newTrackedNotifications.map(tracked =>
                    Notifications.scheduleNotificationAsync({
                        identifier: tracked.notificationId,
                        content: {
                            title: 'VocBee',
                            body: formatNotificationBody(tracked),
                            data: {
                                kind: 'vocabulary' as NotificationKind,
                                wordId: tracked.wordId,
                                word: tracked.word,
                                pronunciation: tracked.pronunciation ?? undefined,
                                translation: tracked.translation,
                                autoMark: tracked.autoMarkLearned,
                                level: tracked.level,
                                targetLanguage: tracked.targetLanguage,
                                scheduledTime: tracked.scheduledTime,
                            },
                            sound: 'default',
                            ...(Platform.OS === 'android' ? { channelId: ANDROID_VOCABULARY_CHANNEL_ID } : {}),
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                            seconds: Math.max(1, Math.floor((tracked.scheduledTime - now.getTime()) / 1000)),
                            repeats: false,
                        },
                    })
                )
            );

            // Append new tracked notifications to existing ones
            const allTracked = [...trackedNotifications, ...newTrackedNotifications];
            await saveTrackedNotifications(allTracked);
            await markNotificationContentCurrent();
        }

        console.log(`[Notifications] Refilled ${scheduledCount} vocabulary notifications. New vocabulary total: ${currentVocabularyCount + scheduledCount}`);
    } catch (error) {
        console.error('[Notifications] Error refilling notifications:', error);
    }
}

/**
 * Get the count of currently scheduled notifications
 */
export async function getScheduledNotificationCount(): Promise<number> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Response Handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store word ID when notification is clicked (for HomeScreen to show)
 */
export async function setPendingNotificationWord(
    pending: PendingNotificationWord
): Promise<void> {
    await AsyncStorage.setItem(PENDING_NOTIFICATION_WORD_KEY, JSON.stringify(pending));
}

/**
 * Parse pending notification word payload
 */
function parsePendingNotificationWord(raw: string): PendingNotificationWord | null {
    try {
        const parsed = JSON.parse(raw);
        if (parsed) {
            const parsedWordId =
                typeof parsed.wordId === 'number'
                    ? parsed.wordId
                    : typeof parsed.wordId === 'string'
                        ? parseInt(parsed.wordId, 10)
                        : NaN;

            if (Number.isFinite(parsedWordId)) {
                return {
                    wordId: parsedWordId,
                    ...(typeof parsed.level === 'string' ? { level: parsed.level } : {}),
                    ...(typeof parsed.targetLanguage === 'string' ? { targetLanguage: parsed.targetLanguage } : {}),
                };
            }
        }
    } catch {
        // fall back to legacy string format
    }

    const legacyId = parseInt(raw, 10);
    if (!Number.isNaN(legacyId)) {
        return { wordId: legacyId };
    }

    return null;
}

/**
 * Get pending notification word without clearing it.
 * Caller decides when it is safe to clear.
 */
export async function getPendingNotificationWord(): Promise<PendingNotificationWord | null> {
    try {
        const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_WORD_KEY);
        if (raw) {
            return parsePendingNotificationWord(raw);
        }
        return null;
    } catch (error) {
        console.error('Error getting pending word:', error);
        return null;
    }
}

/**
 * Clear pending notification word after successful consumption.
 */
export async function clearPendingNotificationWord(): Promise<void> {
    try {
        await AsyncStorage.removeItem(PENDING_NOTIFICATION_WORD_KEY);
    } catch (error) {
        console.error('Error clearing pending word:', error);
    }
}

/**
 * Handle notification response (when user taps notification)
 * 
 * In the new tracking system:
 * - If word was already marked as learned (by processDeliveredNotifications),
 *   unmark it so user can review
 * - Mark notification as processed to prevent race condition
 * - Store word ID for HomeScreen to display
 */
export async function handleNotificationResponse(
    response: Notifications.NotificationResponse
): Promise<void> {
    const data = response.notification.request.content.data;
    const kind = typeof data?.kind === 'string' ? data.kind : null;

    if (kind === 'streak') {
        await scheduleStreakReminderNotification();
        console.log('[Notifications] Streak reminder response handled');
        return;
    }

    const rawWordId = data?.wordId;
    const wordId =
        typeof rawWordId === 'number'
            ? rawWordId
            : typeof rawWordId === 'string'
                ? parseInt(rawWordId, 10)
                : NaN;

    if (!Number.isFinite(wordId)) {
        console.log('[Notifications] Ignored notification response - invalid wordId payload');
        return;
    }

    if (data) {
        const autoMarkEnabled = data.autoMark === true || data.autoMark === 'true';
        const dataLevel = typeof data.level === 'string' && LEVELS.includes(data.level as Level)
            ? (data.level as Level)
            : null;
        const storedLevel = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL);
        const currentLevel = storedLevel && LEVELS.includes(storedLevel as Level)
            ? (storedLevel as Level)
            : null;
        const currentTargetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);
        const dataTargetLanguage = typeof data.targetLanguage === 'string' ? data.targetLanguage : null;

        // Only enforce mismatch checks when we have current local values loaded.
        // On cold starts, storage restore can still be in progress.
        const levelMismatch = dataLevel !== null && currentLevel !== null && dataLevel !== currentLevel;
        const languageMismatch =
            dataTargetLanguage !== null &&
            currentTargetLanguage !== null &&
            dataTargetLanguage !== currentTargetLanguage;

        if (levelMismatch || languageMismatch) {
            console.log('[Notifications] Ignored notification response due to level/language mismatch');
            return;
        }

        const levelForUnmark: Level = dataLevel || currentLevel || (await getCurrentLevel());

        // Store pending word first so HomeScreen can consume it immediately.
        await setPendingNotificationWord({
            wordId,
            level: dataLevel || currentLevel || undefined,
            ...(dataTargetLanguage ? { targetLanguage: dataTargetLanguage } : {}),
        });

        // If autoMark was enabled and word might have been marked by processDeliveredNotifications,
        // unmark it so user can review (since they clicked to see it)
        if (autoMarkEnabled) {
            await unmarkWord(levelForUnmark, wordId);
            console.log(`[Notifications] Word ${wordId} unmarked for review (user tapped notification)`);
        }

        // Mark notification as processed to prevent race condition with processDeliveredNotifications
        // This ensures processDeliveredNotifications won't re-mark the word as learned
        const notificationId = response.notification.request.identifier;
        const tracked = await getTrackedNotifications();
        const notification = tracked.find(n => n.notificationId === notificationId);
        if (notification) {
            notification.processed = true;
            await saveTrackedNotifications(tracked);
            console.log(`[Notifications] Marked notification ${notificationId} as processed to prevent race condition`);
        }
    }
}

/**
 * Send an immediate test notification
 */
export async function sendTestNotification(): Promise<void> {
    const permissionGranted = await hasNotificationPermission();
    if (!permissionGranted) {
        console.log('Test notification skipped - permission not granted');
        return;
    }

    await ensureNotificationChannelConfigured();

    const word = await getRandomUnlearnedWord();

    if (!word) {
        console.log('No unlearned words available for test notification');
        return;
    }

    const { title, body } = getNotificationContent(word);
    const level = await getCurrentLevel();
    const targetLanguage = await AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE);

    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data: {
                kind: 'vocabulary' as NotificationKind,
                wordId: word.id,
                word: word.word,
                pronunciation: word.pronunciation ?? undefined,
                translation: word.translation,
                autoMark: false, // Don't auto-mark for test
                level,
                ...(targetLanguage ? { targetLanguage } : {}),
                scheduledTime: Date.now() + 5000,
            },
            sound: 'default',
            ...(Platform.OS === 'android' ? { channelId: ANDROID_VOCABULARY_CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
            repeats: false,
        },
    });

    console.log('Test notification scheduled');
}
