// src/features/monetization/domain/constants.ts
// Pure constants for the monetization domain. No SDK imports (docs/architecture.md).

/**
 * RevenueCat dashboard entitlement id. Every premium product removes ads.
 * MUST NOT change without a corresponding RevenueCat dashboard migration (docs/architecture.md).
 */
export const REVENUECAT_AD_FREE_ENTITLEMENT_ID = 'premium';

/** AsyncStorage key for the app-launch counter used to gate app-open ad frequency. */
export const APP_LAUNCH_COUNT_KEY = '@app_launch_count';

/** Show an app-open ad every Nth launch (services/adMobService.ts behavior: count % 3 === 0). */
export const APP_OPEN_AD_LAUNCH_INTERVAL = 3;

/** Timeout (ms) before giving up on waiting for an app-open ad to load/show. */
export const APP_OPEN_TIMEOUT_MS = 5000;

/** Timeout (ms) before an in-flight interstitial load is considered stale and retried. */
export const INTERSTITIAL_LOAD_TIMEOUT_MS = 15000;

/** Max banner reload retries before giving up (SafeBannerAd behavior). */
export const MAX_BANNER_RETRIES = 3;

/** Base delay (ms) between banner reload retries (multiplied by retry count). */
export const BANNER_RETRY_DELAY_MS = 3000;

/** After this many ms without a successful load/reload, the banner watchdog force-reloads. */
export const BANNER_STALE_AFTER_MS = 180000;

/** Interval (ms) at which the banner staleness watchdog checks. */
export const BANNER_WATCHDOG_INTERVAL_MS = 30000;
