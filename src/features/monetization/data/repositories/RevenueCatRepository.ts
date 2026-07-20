// src/features/monetization/data/repositories/RevenueCatRepository.ts
// Real RevenueCat SDK access, moved verbatim from services/revenueCatService.ts (docs/architecture.md,
// PR-8.2). Behavior preserved exactly: same API key resolution, same production-safety assertions,
// same subscriber-attribute sync, same paywall/restore/customer-center flows.
//
// This is the ONLY file in the monetization feature that imports `react-native-purchases` /
// `react-native-purchases-ui` (docs/architecture.md — SDK access confined to `data`).

import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  CustomerInfoUpdateListener,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import i18n from '@shared/i18n';
import { REVENUECAT_AD_FREE_ENTITLEMENT_ID } from '../../domain/constants';
import { hasActiveAdFreeEntitlement as domainHasActiveAdFreeEntitlement } from '../../domain/rules';
import type {
  CustomerInfoLike,
  PaywallOutcome,
  RevenueCatUserAttributes,
} from '../../domain/types';
import type { RevenueCatRepository as RevenueCatRepositoryContract } from '../contracts';

const TEST_REVENUECAT_API_KEY = 'test_SwKWiFPJFyWvvsHYtFKNTzSNZXw';

const REVENUECAT_UI_LOCALE_BY_APP_LANGUAGE: Record<string, string> = {
  am: 'am',
  ar: 'ar-SA',
  zh: 'zh-Hans',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  fa: 'fa',
  pt: 'pt-BR',
  ru: 'ru',
  sr: 'sr-Cyrl',
  es: 'es-ES',
  sw: 'sw',
  th: 'th',
  tr: 'tr',
  ur: 'ur',
  vi: 'vi',
};

const normalizeAppLanguage = (language?: string | null): string => {
  const normalizedLanguage = language?.replace('_', '-').toLowerCase();
  return normalizedLanguage?.split('-')[0] || 'en';
};

export const getRevenueCatPreferredUILocale = (
  language: string | null | undefined = i18n.resolvedLanguage || i18n.language,
): string => {
  const appLanguage = normalizeAppLanguage(language);
  return REVENUECAT_UI_LOCALE_BY_APP_LANGUAGE[appLanguage] ?? appLanguage;
};

const getPlatformApiKey = (): string => {
  const sharedKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
      sharedKey ||
      (__DEV__ ? TEST_REVENUECAT_API_KEY : '')
    );
  }

  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ||
      sharedKey ||
      (__DEV__ ? TEST_REVENUECAT_API_KEY : '')
    );
  }

  return sharedKey || (__DEV__ ? TEST_REVENUECAT_API_KEY : '');
};

const assertProductionSafeApiKey = (apiKey: string): void => {
  if (!apiKey) {
    throw new Error('RevenueCat API key is missing for this build.');
  }

  if (!__DEV__ && apiKey === TEST_REVENUECAT_API_KEY) {
    throw new Error('RevenueCat test API key cannot be used in production builds.');
  }

  if (__DEV__) {
    return;
  }

  if (Platform.OS === 'ios' && !apiKey.startsWith('appl_')) {
    throw new Error('RevenueCat iOS API key must use the appl_ public SDK key.');
  }

  if (Platform.OS === 'android' && !apiKey.startsWith('goog_')) {
    throw new Error('RevenueCat Android API key must use the goog_ public SDK key.');
  }
};

/**
 * Thin SDK-facing repository. All state (hasConfigured/activeAppUserId/configurePromise) is kept as
 * instance state so tests can construct fresh instances without cross-test bleed, while a shared
 * singleton instance (`revenueCatRepository`) preserves the original module-singleton behavior for
 * the running app.
 */
export class RevenueCatRepositoryImpl implements RevenueCatRepositoryContract {
  private hasConfigured = false;
  private configurePromise: Promise<void> | null = null;
  private activeAppUserId: string | null = null;

  private async syncSubscriberAttributes(
    appUserId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<void> {
    try {
      await Promise.all([
        Purchases.setAttributes({ firebase_uid: appUserId }),
        Purchases.setEmail(attributes.email ?? null),
        Purchases.setDisplayName(attributes.displayName ?? null),
      ]);
    } catch (error) {
      console.warn('[RevenueCat] Failed to sync subscriber attributes', error);
    }
  }

  async syncPreferredUILocale(
    language: string | null | undefined = i18n.resolvedLanguage || i18n.language,
  ): Promise<void> {
    if (!this.hasConfigured) {
      return;
    }

    try {
      await Purchases.overridePreferredLocale(getRevenueCatPreferredUILocale(language));
    } catch (error) {
      console.warn('[RevenueCat] Failed to sync preferred UI locale', error);
    }
  }

  async ensureConfigured(
    appUserId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<void> {
    const apiKey = getPlatformApiKey();
    assertProductionSafeApiKey(apiKey);

    if (!this.hasConfigured) {
      if (!this.configurePromise) {
        this.configurePromise = (async () => {
          await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
          Purchases.configure({
            apiKey,
            appUserID: appUserId,
            automaticDeviceIdentifierCollectionEnabled: false,
            preferredUILocaleOverride: getRevenueCatPreferredUILocale(),
          });
          this.hasConfigured = true;
          this.activeAppUserId = appUserId;
        })();
      }

      await this.configurePromise;
      await this.syncSubscriberAttributes(appUserId, attributes);
      return;
    }

    if (this.activeAppUserId !== appUserId) {
      await Purchases.logIn(appUserId);
      this.activeAppUserId = appUserId;
      await this.syncSubscriberAttributes(appUserId, attributes);
      return;
    }

    await this.syncSubscriberAttributes(appUserId, attributes);
  }

  async getCustomerInfo(
    userId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<CustomerInfoLike | null> {
    await this.ensureConfigured(userId, attributes);
    return Purchases.getCustomerInfo();
  }

  async presentPaywall(
    userId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<PaywallOutcome> {
    await this.ensureConfigured(userId, attributes);

    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: REVENUECAT_AD_FREE_ENTITLEMENT_ID,
      displayCloseButton: true,
    });

    const shouldRefresh =
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED ||
      result === PAYWALL_RESULT.NOT_PRESENTED;

    return {
      result: result as unknown as PaywallOutcome['result'],
      customerInfo: shouldRefresh ? await Purchases.getCustomerInfo() : null,
    };
  }

  async restore(
    userId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<CustomerInfoLike | null> {
    await this.ensureConfigured(userId, attributes);
    return Purchases.restorePurchases();
  }

  async openCustomerCenter(
    userId: string,
    attributes: RevenueCatUserAttributes = {},
  ): Promise<CustomerInfoLike | null> {
    await this.ensureConfigured(userId, attributes);
    await RevenueCatUI.presentCustomerCenter();
    return Purchases.getCustomerInfo();
  }

  onCustomerInfoChanged(listener: (info: CustomerInfoLike) => void): () => void {
    const sdkListener = listener as CustomerInfoUpdateListener;
    Purchases.addCustomerInfoUpdateListener(sdkListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(sdkListener);
    };
  }
}

/** Shared singleton instance used by the app (preserves the original module-level singleton behavior). */
export const revenueCatRepository = new RevenueCatRepositoryImpl();

// --- Backwards-compatible free functions (identical signatures to services/revenueCatService.ts) ---
// Kept so the shim (services/revenueCatService.ts) can re-export the exact same public API without
// behavior drift, and so any direct consumers relying on named function imports keep working.

export const hasActiveAdFreeEntitlement = (customerInfo: CustomerInfo | null): boolean =>
  domainHasActiveAdFreeEntitlement(customerInfo as unknown as CustomerInfoLike | null);

export const getActiveAdFreeEntitlement = (customerInfo: CustomerInfo | null) =>
  customerInfo?.entitlements.active[REVENUECAT_AD_FREE_ENTITLEMENT_ID] ?? null;

export const syncRevenueCatPreferredUILocale = (language?: string | null): Promise<void> =>
  revenueCatRepository.syncPreferredUILocale(language);

export const ensureRevenueCatConfigured = (
  appUserId: string,
  attributes: RevenueCatUserAttributes = {},
): Promise<void> => revenueCatRepository.ensureConfigured(appUserId, attributes);

export const getRevenueCatCustomerInfo = (
  appUserId: string,
  attributes: RevenueCatUserAttributes = {},
): Promise<CustomerInfo> =>
  revenueCatRepository.getCustomerInfo(appUserId, attributes) as Promise<CustomerInfo>;

export const presentAdFreePaywall = (
  appUserId: string,
  attributes: RevenueCatUserAttributes = {},
) => revenueCatRepository.presentPaywall(appUserId, attributes);

export const restoreRevenueCatPurchases = (
  appUserId: string,
  attributes: RevenueCatUserAttributes = {},
): Promise<CustomerInfo> =>
  revenueCatRepository.restore(appUserId, attributes) as Promise<CustomerInfo>;

export const openRevenueCatCustomerCenter = (
  appUserId: string,
  attributes: RevenueCatUserAttributes = {},
): Promise<CustomerInfo> =>
  revenueCatRepository.openCustomerCenter(appUserId, attributes) as Promise<CustomerInfo>;

export const addRevenueCatCustomerInfoListener = (
  listener: CustomerInfoUpdateListener,
): (() => void) =>
  revenueCatRepository.onCustomerInfoChanged(listener as (info: CustomerInfoLike) => void);

export type { RevenueCatPaywallResult } from '../../domain/types';

// Re-exported for shim parity: services/revenueCatService.ts originally exported this constant.
export { REVENUECAT_AD_FREE_ENTITLEMENT_ID } from '../../domain/constants';
