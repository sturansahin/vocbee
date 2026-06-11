import { Platform } from 'react-native';
import Purchases, {
    CustomerInfo,
    CustomerInfoUpdateListener,
    LOG_LEVEL,
    PurchasesEntitlementInfo,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import i18n from './i18n';

// RevenueCat dashboard uses "premium"; every premium product removes ads.
export const REVENUECAT_AD_FREE_ENTITLEMENT_ID = 'premium';

const TEST_REVENUECAT_API_KEY = 'test_SwKWiFPJFyWvvsHYtFKNTzSNZXw';

type RevenueCatUserAttributes = {
    email?: string | null;
    displayName?: string | null;
};

export type RevenueCatPaywallResult = {
    result: PAYWALL_RESULT;
    customerInfo: CustomerInfo | null;
};

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

let hasConfigured = false;
let configurePromise: Promise<void> | null = null;
let activeAppUserId: string | null = null;

const normalizeAppLanguage = (language?: string | null): string => {
    const normalizedLanguage = language?.replace('_', '-').toLowerCase();
    return normalizedLanguage?.split('-')[0] || 'en';
};

export const getRevenueCatPreferredUILocale = (
    language: string | null | undefined = i18n.resolvedLanguage || i18n.language
): string => {
    const appLanguage = normalizeAppLanguage(language);
    return REVENUECAT_UI_LOCALE_BY_APP_LANGUAGE[appLanguage] ?? appLanguage;
};

const getPlatformApiKey = (): string => {
    const sharedKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

    if (Platform.OS === 'ios') {
        return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || sharedKey || (__DEV__ ? TEST_REVENUECAT_API_KEY : '');
    }

    if (Platform.OS === 'android') {
        return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || sharedKey || (__DEV__ ? TEST_REVENUECAT_API_KEY : '');
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

const getActiveEntitlement = (
    customerInfo: CustomerInfo | null,
    entitlementId: string = REVENUECAT_AD_FREE_ENTITLEMENT_ID
): PurchasesEntitlementInfo | null => {
    return customerInfo?.entitlements.active[entitlementId] ?? null;
};

export const hasActiveAdFreeEntitlement = (customerInfo: CustomerInfo | null): boolean =>
    Boolean(getActiveEntitlement(customerInfo)?.isActive);

export const getActiveAdFreeEntitlement = (
    customerInfo: CustomerInfo | null
): PurchasesEntitlementInfo | null => getActiveEntitlement(customerInfo);

const syncSubscriberAttributes = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<void> => {
    try {
        await Promise.all([
            Purchases.setAttributes({ firebase_uid: appUserId }),
            Purchases.setEmail(attributes.email ?? null),
            Purchases.setDisplayName(attributes.displayName ?? null),
        ]);
    } catch (error) {
        console.warn('[RevenueCat] Failed to sync subscriber attributes', error);
    }
};

export const syncRevenueCatPreferredUILocale = async (
    language: string | null | undefined = i18n.resolvedLanguage || i18n.language
): Promise<void> => {
    if (!hasConfigured) {
        return;
    }

    try {
        await Purchases.overridePreferredLocale(getRevenueCatPreferredUILocale(language));
    } catch (error) {
        console.warn('[RevenueCat] Failed to sync preferred UI locale', error);
    }
};

export const ensureRevenueCatConfigured = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<void> => {
    const apiKey = getPlatformApiKey();
    assertProductionSafeApiKey(apiKey);

    if (!hasConfigured) {
        if (!configurePromise) {
            configurePromise = (async () => {
                await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
                Purchases.configure({
                    apiKey,
                    appUserID: appUserId,
                    automaticDeviceIdentifierCollectionEnabled: false,
                    preferredUILocaleOverride: getRevenueCatPreferredUILocale(),
                });
                hasConfigured = true;
                activeAppUserId = appUserId;
            })();
        }

        await configurePromise;
        await syncSubscriberAttributes(appUserId, attributes);
        return;
    }

    if (activeAppUserId !== appUserId) {
        await Purchases.logIn(appUserId);
        activeAppUserId = appUserId;
        await syncSubscriberAttributes(appUserId, attributes);
        return;
    }

    await syncSubscriberAttributes(appUserId, attributes);
};

export const getRevenueCatCustomerInfo = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<CustomerInfo> => {
    await ensureRevenueCatConfigured(appUserId, attributes);
    return Purchases.getCustomerInfo();
};

export const presentAdFreePaywall = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<RevenueCatPaywallResult> => {
    await ensureRevenueCatConfigured(appUserId, attributes);

    const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: REVENUECAT_AD_FREE_ENTITLEMENT_ID,
        displayCloseButton: true,
    });

    const shouldRefresh =
        result === PAYWALL_RESULT.PURCHASED ||
        result === PAYWALL_RESULT.RESTORED ||
        result === PAYWALL_RESULT.NOT_PRESENTED;

    return {
        result,
        customerInfo: shouldRefresh ? await Purchases.getCustomerInfo() : null,
    };
};

export const restoreRevenueCatPurchases = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<CustomerInfo> => {
    await ensureRevenueCatConfigured(appUserId, attributes);
    return Purchases.restorePurchases();
};

export const openRevenueCatCustomerCenter = async (
    appUserId: string,
    attributes: RevenueCatUserAttributes = {}
): Promise<CustomerInfo> => {
    await ensureRevenueCatConfigured(appUserId, attributes);
    await RevenueCatUI.presentCustomerCenter();
    return Purchases.getCustomerInfo();
};

export const addRevenueCatCustomerInfoListener = (
    listener: CustomerInfoUpdateListener
): (() => void) => {
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
    };
};
