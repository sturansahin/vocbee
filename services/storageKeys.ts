// Central storage key management for AsyncStorage
// Single source of truth for all storage keys used across services
// IMPORTANT: Do NOT change string values — existing user data depends on them

export const STORAGE_KEYS = {
    // ─── Onboarding ───────────────────────────────────────────────
    HAS_SEEN_ONBOARDING: '@VocBee:hasSeenOnboarding',
    HAS_SEEN_HOME_TUTORIAL: '@VocBee:hasSeenHomeTutorial',

    // ─── User Data (storage.ts) ───────────────────────────────────
    USER_DATA: '@vocbee_user_data',
    USER_PROGRESS_LEGACY: '@vocbee_user_progress',
    SYNC_FLAG: '@vocbee_needs_sync',
    LAST_SYNC: '@vocbee_last_sync',
    DEVICE_ID: '@vocbee_device_id',

    // ─── Progress (progressService.ts) ────────────────────────────
    PROGRESS: '@user_progress',
    // Legacy (skip feature removed, kept for cleanup)
    SKIPPED: '@user_skipped',
    CURRENT_LEVEL: '@current_level',
    LAST_WORD_ID: '@last_word_id',
    USER_LEVEL: '@user_level',

    // ─── Vocabulary (vocabularyService.ts) ────────────────────────
    VOCABULARY: '@vocabulary',
    // Per-level vocabulary keys: `@vocabulary_A1`, `@vocabulary_A2`, etc.
    VOCABULARY_LEVEL_PREFIX: '@vocabulary_',
    NATIVE_LANGUAGE: '@native_language',
    TARGET_LANGUAGE: '@target_language',

    // ─── Notifications (notificationService.ts) ──────────────────
    NOTIFICATION_SETTINGS: '@notification_settings',
    PENDING_NOTIFICATION_WORD: '@pending_notification_word',
    TRACKED_NOTIFICATIONS: '@tracked_notifications',
    LAST_FOREGROUND_TIME: '@last_foreground_time',
    LAST_BACKGROUND_TIME: '@last_background_time',

    // ─── Favorites (favoritesService.ts) ──────────────────────────
    // Dynamic: `@favorites_${userId}` or `@favorites` (legacy)
    FAVORITES_PREFIX: '@favorites',

    // ─── Profile (AuthContext) ────────────────────────────────────
    // Dynamic: `profile_${userId}`
    PROFILE_PREFIX: 'profile_',

    // ─── Shuffle Order Cache (HomeScreen) ─────────────────────────
    // Dynamic: `@shuffle_order_${level}`
    SHUFFLE_ORDER_PREFIX: '@shuffle_order_',

    // ─── Grammar Cache (groqService.ts) ──────────────────────────
    GRAMMAR_CACHE: '@grammar_cache',

    // ─── i18n (i18n.ts) ──────────────────────────────────────────
    USER_LANGUAGE: '@user_language',
} as const;
