// src/features/monetization — public barrel (docs/refactor-v2/28, /33 §4).
// Real implementation landed in Phase 8. Domain types/rules, repository interfaces, presentation
// entrypoints, and stable application-facing ad operations are public. Concrete repository
// implementations and the facade singleton stay internal to the feature.

export type {
  AdGatingState,
  AdIds,
  AdRequestOptionsLike,
  CustomerInfoLike,
  EntitlementInfoLike,
  PaywallOutcome,
  PaywallResultLike,
  RevenueCatPaywallResult,
  RevenueCatUserAttributes,
} from './domain/types';
export {
  REVENUECAT_AD_FREE_ENTITLEMENT_ID,
  APP_LAUNCH_COUNT_KEY,
  APP_OPEN_AD_LAUNCH_INTERVAL,
  APP_OPEN_TIMEOUT_MS,
  INTERSTITIAL_LOAD_TIMEOUT_MS,
  MAX_BANNER_RETRIES,
  BANNER_RETRY_DELAY_MS,
  BANNER_STALE_AFTER_MS,
  BANNER_WATCHDOG_INTERVAL_MS,
} from './domain/constants';
export {
  shouldShowAds,
  hasActiveAdFreeEntitlement,
  getActiveEntitlement,
  shouldAttemptAppOpenAd,
} from './domain/rules';

export type { RevenueCatRepository, AdMobRepository } from './data/contracts';
// NOTE: RevenueCatRepositoryImpl / AdMobRepositoryImpl (concrete implementations) are NOT exported here.

export { MonetizationProvider, useMonetization } from './presentation/MonetizationProvider';
export { SafeBannerAd } from './presentation/SafeBannerAd';
export {
  AD_IDS,
  areAdsSupported,
  checkAndShowAppOpenAd,
  ensureAdMobReady,
  getBannerAdComponent,
  getBannerAdSize,
  getDefaultAdRequestOptions,
  initializeAdMob,
  loadInterstitial,
  refreshAdInventoryOnForeground,
  requestAdConsent,
  showInterstitial,
} from './composition/adMobService';
