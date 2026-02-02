// Central storage key management for AsyncStorage
// All storage keys should be defined here for consistency

export const STORAGE_KEYS = {
    // Onboarding
    HAS_SEEN_ONBOARDING: '@VocBee:hasSeenOnboarding',

    // User Data
    USER_DATA: '@VocBee:userData',

    // Language Settings
    NATIVE_LANGUAGE: '@native_language',

    // Progress
    LEARNED_WORDS: '@VocBee:learnedWords',
    SKIPPED_WORDS: '@VocBee:skippedWords',
    LAST_WORD_ID: '@VocBee:lastWordId',

    // Favorites
    FAVORITE_WORDS: '@VocBee:favoriteWords',

    // Notifications
    NOTIFICATION_SETTINGS: '@VocBee:notificationSettings',

    // Profile (user-specific, append uid)
    PROFILE_PREFIX: 'profile_',
} as const;
