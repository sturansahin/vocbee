// src/features/monetization/data/repositories/AdMobRepository.ts
// Real AdMob SDK access, moved verbatim from services/adMobService.ts (docs/architecture.md).
// Behavior preserved exactly: same consent (UMP) flow, same ATT flow, same interstitial load/show
// lifecycle + timeouts, same app-open ad launch-count gating, same Expo Go / native-module-unavailable
// fallbacks. This is the ONLY file that imports `react-native-google-mobile-ads` /
// `expo-tracking-transparency` (docs/architecture.md — SDK access confined to `data`).

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  getTrackingPermissionsAsync,
  isAvailable as isTrackingTransparencyAvailable,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Alert, Platform } from 'react-native';
import {
  APP_LAUNCH_COUNT_KEY,
  APP_OPEN_AD_LAUNCH_INTERVAL,
  APP_OPEN_TIMEOUT_MS,
  INTERSTITIAL_LOAD_TIMEOUT_MS,
} from '../../domain/constants';
import { shouldAttemptAppOpenAd } from '../../domain/rules';
import type { AdIds, AdRequestOptionsLike } from '../../domain/types';
import type { AdMobRepository as AdMobRepositoryContract } from '../contracts';

type ConsentInfoLike = {
  status?: string;
  canRequestAds?: boolean;
  isConsentFormAvailable?: boolean;
};

const IS_IOS = Platform.OS === 'ios';

const PRODUCTION_AD_IDS: AdIds = {
  BANNER: IS_IOS
    ? 'ca-app-pub-3149431742550187/7394218632'
    : 'ca-app-pub-3149431742550187/9284732452',
  INTERSTITIAL: IS_IOS
    ? 'ca-app-pub-3149431742550187/3271140796'
    : 'ca-app-pub-3149431742550187/8813959164',
  APP_OPEN: IS_IOS
    ? 'ca-app-pub-3149431742550187/2904309285'
    : 'ca-app-pub-3149431742550187/3501266196',
};

const TEST_AD_IDS: AdIds = {
  BANNER: IS_IOS
    ? 'ca-app-pub-3940256099942544/2934735716'
    : 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: IS_IOS
    ? 'ca-app-pub-3940256099942544/4411468910'
    : 'ca-app-pub-3940256099942544/1033173712',
  APP_OPEN: IS_IOS
    ? 'ca-app-pub-3940256099942544/5575463023'
    : 'ca-app-pub-3940256099942544/9257395921',
};

export const AD_IDS: AdIds = __DEV__ ? TEST_AD_IDS : PRODUCTION_AD_IDS;

function isExpoGoEnvironment() {
  const executionEnvironment = (Constants as any)?.executionEnvironment;
  const appOwnership = (Constants as any)?.appOwnership;

  return (
    executionEnvironment === (ExecutionEnvironment?.StoreClient ?? 'storeClient') ||
    appOwnership === 'expo' ||
    appOwnership === 'guest'
  );
}

/**
 * Thin SDK-facing repository. Module-level mutable state from the original service is kept as
 * instance state; a shared singleton instance (`adMobRepository`) preserves the original
 * module-singleton runtime behavior.
 */
export class AdMobRepositoryImpl implements AdMobRepositoryContract {
  private mobileAdsFactory: any = null;
  private InterstitialAd: any = null;
  private AppOpenAd: any = null;
  private AdEventType: any = null;
  private BannerAd: any = null;
  private BannerAdSize: any = null;
  private AdsConsent: any = null;
  private AdsConsentStatus: any = null;

  private isModuleLoaded = false;
  private isInitialized = false;
  private isConsentResolved = false;
  private canRequestAds = false;
  private trackingPermissionStatus: PermissionStatus = IS_IOS
    ? PermissionStatus.UNDETERMINED
    : PermissionStatus.GRANTED;
  private defaultAdRequestOptions: AdRequestOptionsLike = {
    requestNonPersonalizedAdsOnly: true,
  };
  private latestConsentInfo: ConsentInfoLike | null = null;
  private latestUserChoices: any = null;

  private consentPromise: Promise<void> | null = null;
  private initializePromise: Promise<boolean> | null = null;

  private interstitial: any = null;
  private isInterstitialLoaded = false;
  private isInterstitialLoading = false;
  private interstitialListeners: Array<() => void> = [];
  private interstitialLoadStartedAt = 0;
  private interstitialLoadTimeout: ReturnType<typeof setTimeout> | null = null;

  private loadAdMobModule() {
    if (this.isModuleLoaded) {
      return;
    }

    if (isExpoGoEnvironment()) {
      console.log('[AdMob] Expo Go detected, native ads disabled');
      this.isModuleLoaded = true;
      return;
    }

    try {
      const adMob = require('react-native-google-mobile-ads');

      this.mobileAdsFactory = adMob.MobileAds ?? adMob.default ?? null;
      this.InterstitialAd = adMob.InterstitialAd ?? null;
      this.AppOpenAd = adMob.AppOpenAd ?? null;
      this.AdEventType = adMob.AdEventType ?? null;
      this.BannerAd = adMob.BannerAd ?? null;
      this.BannerAdSize = adMob.BannerAdSize ?? null;
      this.AdsConsent = adMob.AdsConsent ?? null;
      this.AdsConsentStatus = adMob.AdsConsentStatus ?? null;

      if (
        !this.mobileAdsFactory ||
        !this.InterstitialAd ||
        !this.AppOpenAd ||
        !this.AdEventType ||
        !this.BannerAd
      ) {
        throw new Error('AdMob module is missing required exports');
      }
    } catch (error) {
      console.log('[AdMob] Native module unavailable:', error);
      this.mobileAdsFactory = null;
      this.InterstitialAd = null;
      this.AppOpenAd = null;
      this.AdEventType = null;
      this.BannerAd = null;
      this.BannerAdSize = null;
      this.AdsConsent = null;
      this.AdsConsentStatus = null;
    } finally {
      this.isModuleLoaded = true;
    }
  }

  private cleanupInterstitialListeners() {
    this.interstitialListeners.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('[AdMob] Failed to remove interstitial listener', error);
      }
    });

    this.interstitialListeners = [];
  }

  private clearInterstitialLoadTimeout() {
    if (this.interstitialLoadTimeout) {
      clearTimeout(this.interstitialLoadTimeout);
      this.interstitialLoadTimeout = null;
    }
  }

  private resetInterstitialState(reason: string) {
    this.clearInterstitialLoadTimeout();
    this.cleanupInterstitialListeners();
    this.interstitial = null;
    this.isInterstitialLoaded = false;
    this.isInterstitialLoading = false;
    this.interstitialLoadStartedAt = 0;
    console.log(`[AdMob] Interstitial state reset (${reason})`);
  }

  private buildAdRequestOptions(
    consentInfo?: ConsentInfoLike | null,
    userChoices?: any,
  ): AdRequestOptionsLike {
    const consentStatus = consentInfo?.status;
    const trackingAuthorized =
      !IS_IOS || this.trackingPermissionStatus === PermissionStatus.GRANTED;
    const personalizedAdsAllowed =
      (trackingAuthorized &&
        consentStatus === (this.AdsConsentStatus?.NOT_REQUIRED ?? 'NOT_REQUIRED')) ||
      Boolean(
        trackingAuthorized &&
        userChoices?.selectPersonalisedAds &&
        userChoices?.storeAndAccessInformationOnDevice,
      );

    return {
      requestNonPersonalizedAdsOnly: !personalizedAdsAllowed,
    };
  }

  private async refreshConsentState(consentInfo?: ConsentInfoLike | null) {
    let resolvedConsentInfo = consentInfo ?? null;

    if (!resolvedConsentInfo && this.AdsConsent?.getConsentInfo) {
      try {
        resolvedConsentInfo = await this.AdsConsent.getConsentInfo();
      } catch (error) {
        console.warn('[AdMob] Failed to read consent info', error);
      }
    }

    let userChoices: any = null;
    if (this.AdsConsent?.getUserChoices) {
      try {
        userChoices = await this.AdsConsent.getUserChoices();
      } catch (error) {
        console.log('[AdMob] User choices unavailable, falling back to non-personalized ads');
      }
    }

    this.latestConsentInfo = resolvedConsentInfo;
    this.latestUserChoices = userChoices;
    this.canRequestAds = Boolean(resolvedConsentInfo?.canRequestAds ?? !this.AdsConsent);
    this.defaultAdRequestOptions = this.buildAdRequestOptions(resolvedConsentInfo, userChoices);
    this.isConsentResolved = true;

    console.log('[AdMob] Consent resolved', {
      status: resolvedConsentInfo?.status ?? 'unknown',
      canRequestAds: this.canRequestAds,
      requestNonPersonalizedAdsOnly: this.defaultAdRequestOptions.requestNonPersonalizedAdsOnly,
    });
  }

  private async requestTrackingPermissionIfNeeded(): Promise<void> {
    if (!IS_IOS) {
      this.trackingPermissionStatus = PermissionStatus.GRANTED;
      return;
    }

    try {
      if (!isTrackingTransparencyAvailable()) {
        this.trackingPermissionStatus = PermissionStatus.GRANTED;
        this.defaultAdRequestOptions = this.buildAdRequestOptions(
          this.latestConsentInfo,
          this.latestUserChoices,
        );
        return;
      }

      const currentPermission = await getTrackingPermissionsAsync();
      this.trackingPermissionStatus = currentPermission.status;

      if (currentPermission.status === PermissionStatus.UNDETERMINED) {
        console.log('[AdMob] Requesting ATT permission');
        const requestedPermission = await requestTrackingPermissionsAsync();
        this.trackingPermissionStatus = requestedPermission.status;
      }

      this.defaultAdRequestOptions = this.buildAdRequestOptions(
        this.latestConsentInfo,
        this.latestUserChoices,
      );
      console.log('[AdMob] ATT status resolved', {
        status: this.trackingPermissionStatus,
        requestNonPersonalizedAdsOnly: this.defaultAdRequestOptions.requestNonPersonalizedAdsOnly,
      });
    } catch (error) {
      this.trackingPermissionStatus = PermissionStatus.DENIED;
      this.defaultAdRequestOptions = this.buildAdRequestOptions(
        this.latestConsentInfo,
        this.latestUserChoices,
      );
      console.warn('[AdMob] ATT request failed, defaulting to non-personalized ads', error);
    }
  }

  getDefaultAdRequestOptions(): AdRequestOptionsLike {
    return { ...this.defaultAdRequestOptions };
  }

  async requestConsent(): Promise<void> {
    this.loadAdMobModule();

    if (!this.mobileAdsFactory) {
      this.isConsentResolved = true;
      this.canRequestAds = false;
      return;
    }

    if (this.isConsentResolved) {
      return;
    }

    if (!this.consentPromise) {
      this.consentPromise = (async () => {
        if (!this.AdsConsent) {
          console.log('[AdMob] AdsConsent helper unavailable, defaulting to non-personalized ads');
          this.canRequestAds = true;
          this.isConsentResolved = true;
          this.defaultAdRequestOptions = {
            requestNonPersonalizedAdsOnly: true,
          };
          return;
        }

        let latestConsentInfo: ConsentInfoLike | null = null;

        try {
          if (typeof this.AdsConsent.gatherConsent === 'function') {
            latestConsentInfo = await this.AdsConsent.gatherConsent();
          } else {
            latestConsentInfo = await this.AdsConsent.requestInfoUpdate();

            if (
              latestConsentInfo?.isConsentFormAvailable &&
              latestConsentInfo?.status === (this.AdsConsentStatus?.REQUIRED ?? 'REQUIRED') &&
              typeof this.AdsConsent.showForm === 'function'
            ) {
              latestConsentInfo = await this.AdsConsent.showForm();
            }
          }
        } catch (error) {
          console.warn(
            '[AdMob] Consent flow failed, continuing safely with fallback options',
            error,
          );
        }

        await this.refreshConsentState(latestConsentInfo);
      })();
    }

    await this.consentPromise;
  }

  async initialize(): Promise<boolean> {
    this.loadAdMobModule();

    if (!this.mobileAdsFactory) {
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        await this.requestConsent();

        if (this.canRequestAds) {
          await this.requestTrackingPermissionIfNeeded();
        }

        if (!this.canRequestAds) {
          console.log('[AdMob] SDK init skipped because ads cannot be requested yet');
          return false;
        }

        try {
          await this.mobileAdsFactory().initialize();
          this.isInitialized = true;
          console.log('[AdMob] SDK initialized');
          return true;
        } catch (error) {
          console.error('[AdMob] Failed to initialize SDK', error);
          return false;
        }
      })();
    }

    const ready = await this.initializePromise;

    if (!ready && !this.isInitialized) {
      this.initializePromise = null;
    }

    return ready;
  }

  async ensureReady(): Promise<boolean> {
    return this.initialize();
  }

  async loadInterstitial(forceReload: boolean = false): Promise<boolean> {
    this.loadAdMobModule();

    if (!this.mobileAdsFactory) {
      return false;
    }

    const isReady = await this.ensureReady();
    if (!isReady) {
      return false;
    }

    if (forceReload) {
      this.resetInterstitialState('force reload');
    }

    if (this.isInterstitialLoaded) {
      return true;
    }

    if (this.isInterstitialLoading) {
      const isStaleLoad =
        Date.now() - this.interstitialLoadStartedAt > INTERSTITIAL_LOAD_TIMEOUT_MS;
      if (!isStaleLoad) {
        return false;
      }

      this.resetInterstitialState('stale load timeout');
    }

    try {
      this.cleanupInterstitialListeners();
      this.isInterstitialLoading = true;
      this.interstitialLoadStartedAt = Date.now();
      this.interstitial = this.InterstitialAd.createForAdRequest(
        AD_IDS.INTERSTITIAL,
        this.getDefaultAdRequestOptions(),
      );

      this.interstitialListeners = [
        this.interstitial.addAdEventListener(this.AdEventType.LOADED, () => {
          this.clearInterstitialLoadTimeout();
          this.isInterstitialLoaded = true;
          this.isInterstitialLoading = false;
          this.interstitialLoadStartedAt = 0;
          console.log('[AdMob] Interstitial loaded');
        }),
        this.interstitial.addAdEventListener(this.AdEventType.CLOSED, () => {
          this.clearInterstitialLoadTimeout();
          console.log('[AdMob] Interstitial closed');
          this.interstitial = null;
          this.isInterstitialLoaded = false;
          this.isInterstitialLoading = false;
          this.interstitialLoadStartedAt = 0;
          void this.loadInterstitial();
        }),
        this.interstitial.addAdEventListener(this.AdEventType.ERROR, (error: any) => {
          this.clearInterstitialLoadTimeout();
          console.error('[AdMob] Interstitial failed', error);
          this.interstitial = null;
          this.isInterstitialLoaded = false;
          this.isInterstitialLoading = false;
          this.interstitialLoadStartedAt = 0;
        }),
      ];

      this.interstitialLoadTimeout = setTimeout(() => {
        if (this.isInterstitialLoading) {
          console.warn('[AdMob] Interstitial load timed out');
          this.resetInterstitialState('load timed out');
        }
      }, INTERSTITIAL_LOAD_TIMEOUT_MS);

      this.interstitial.load();
      return true;
    } catch (error) {
      console.error('[AdMob] Failed to load interstitial', error);
      this.resetInterstitialState('load threw');
      return false;
    }
  }

  async showInterstitial(): Promise<boolean> {
    this.loadAdMobModule();

    if (!this.mobileAdsFactory) {
      console.log('[AdMob] Interstitial skipped because native module is unavailable');
      if (__DEV__) {
        Alert.alert(
          'AdMob (Development Mode)',
          "Gecis reklami burada gosterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
          [{ text: 'Tamam' }],
        );
      }
      return false;
    }

    const isReady = await this.ensureReady();
    if (!isReady) {
      return false;
    }

    if (!this.isInterstitialLoaded || !this.interstitial) {
      console.log('[AdMob] Interstitial not ready, requesting preload');
      void this.loadInterstitial();
      return false;
    }

    try {
      this.isInterstitialLoaded = false;
      await this.interstitial.show();
      return true;
    } catch (error) {
      console.error('[AdMob] Failed to show interstitial', error);
      this.interstitial = null;
      this.isInterstitialLoaded = false;
      this.isInterstitialLoading = false;
      this.interstitialLoadStartedAt = 0;
      void this.loadInterstitial();
      return false;
    }
  }

  async refreshAdInventoryOnForeground(forceReload: boolean = true): Promise<void> {
    this.loadAdMobModule();

    if (!this.mobileAdsFactory) {
      return;
    }

    const isReady = await this.ensureReady();
    if (!isReady) {
      return;
    }

    await this.loadInterstitial(forceReload);
  }

  async checkAndShowAppOpenAd(): Promise<void> {
    try {
      const countStr = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
      let count = countStr ? parseInt(countStr, 10) : 0;

      count += 1;
      await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, count.toString());

      console.log(`[AdMob] App launch count: ${count}`);

      if (!shouldAttemptAppOpenAd(count, APP_OPEN_AD_LAUNCH_INTERVAL)) {
        return;
      }

      this.loadAdMobModule();

      if (!this.mobileAdsFactory) {
        console.log('[AdMob] App open ad skipped because native module is unavailable');
        if (__DEV__) {
          Alert.alert(
            'AdMob (Development Mode)',
            "Uygulama acilis reklami burada gosterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
            [{ text: 'Tamam' }],
          );
        }
        return;
      }

      const isReady = await this.ensureReady();
      if (!isReady) {
        return;
      }

      const appOpenAd = this.AppOpenAd.createForAdRequest(
        AD_IDS.APP_OPEN,
        this.getDefaultAdRequestOptions(),
      );

      await new Promise<void>((resolve) => {
        let settled = false;
        const listeners: Array<() => void> = [];

        const finish = () => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeoutId);
          listeners.forEach((unsubscribe) => {
            try {
              unsubscribe();
            } catch (error) {
              console.warn('[AdMob] Failed to remove app open listener', error);
            }
          });
          resolve();
        };

        const timeoutId = setTimeout(() => {
          console.log('[AdMob] App open ad timed out, continuing app launch');
          finish();
        }, APP_OPEN_TIMEOUT_MS);

        listeners.push(
          appOpenAd.addAdEventListener(this.AdEventType.LOADED, async () => {
            if (settled) {
              return;
            }

            try {
              await appOpenAd.show();
            } catch (error) {
              console.error('[AdMob] Failed to show app open ad', error);
              finish();
            }
          }),
        );

        listeners.push(
          appOpenAd.addAdEventListener(this.AdEventType.CLOSED, () => {
            console.log('[AdMob] App open ad closed');
            finish();
          }),
        );

        listeners.push(
          appOpenAd.addAdEventListener(this.AdEventType.ERROR, (error: any) => {
            console.error('[AdMob] App open ad failed', error);
            finish();
          }),
        );

        appOpenAd.load();
      });
    } catch (error) {
      console.error('[AdMob] App open flow failed', error);
    }
  }

  getAdIds(): AdIds {
    return AD_IDS;
  }

  getBannerAdComponent() {
    this.loadAdMobModule();
    return this.BannerAd || null;
  }

  getBannerAdSize() {
    this.loadAdMobModule();
    return this.BannerAdSize || {};
  }

  areAdsSupported(): boolean {
    this.loadAdMobModule();
    return Boolean(this.mobileAdsFactory);
  }
}

/** Shared singleton instance used by the app (preserves the original module-level singleton behavior). */
export const adMobRepository = new AdMobRepositoryImpl();

// --- Backwards-compatible free functions (identical signatures to services/adMobService.ts) ---
// Kept so the shim (services/adMobService.ts) can re-export the exact same public API without
// behavior drift.

export const getDefaultAdRequestOptions = (): AdRequestOptionsLike =>
  adMobRepository.getDefaultAdRequestOptions();
export const requestAdConsent = (): Promise<void> => adMobRepository.requestConsent();
export const initializeAdMob = (): Promise<boolean> => adMobRepository.initialize();
export const ensureAdMobReady = (): Promise<boolean> => adMobRepository.ensureReady();
export const loadInterstitial = (forceReload: boolean = false): Promise<boolean> =>
  adMobRepository.loadInterstitial(forceReload);
export const showInterstitial = (): Promise<boolean> => adMobRepository.showInterstitial();
export const refreshAdInventoryOnForeground = (forceReload: boolean = true): Promise<void> =>
  adMobRepository.refreshAdInventoryOnForeground(forceReload);
export const checkAndShowAppOpenAd = (): Promise<void> => adMobRepository.checkAndShowAppOpenAd();
export const getBannerAdComponent = () => adMobRepository.getBannerAdComponent();
export const getBannerAdSize = () => adMobRepository.getBannerAdSize();
export const areAdsSupported = () => adMobRepository.areAdsSupported();
