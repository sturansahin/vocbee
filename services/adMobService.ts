import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
    getTrackingPermissionsAsync,
    isAvailable as isTrackingTransparencyAvailable,
    PermissionStatus,
    requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { Alert, Platform } from 'react-native';

type AdRequestOptions = {
    requestNonPersonalizedAdsOnly?: boolean;
};

type ConsentInfoLike = {
    status?: string;
    canRequestAds?: boolean;
    isConsentFormAvailable?: boolean;
};

const IS_IOS = Platform.OS === 'ios';

const PRODUCTION_AD_IDS = {
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

const TEST_AD_IDS = {
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

const APP_LAUNCH_COUNT_KEY = '@app_launch_count';
const APP_OPEN_TIMEOUT_MS = 5000;

let mobileAdsFactory: any = null;
let InterstitialAd: any = null;
let AppOpenAd: any = null;
let AdEventType: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let AdsConsent: any = null;
let AdsConsentStatus: any = null;

let isModuleLoaded = false;
let isInitialized = false;
let isConsentResolved = false;
let canRequestAds = false;
let trackingPermissionStatus: PermissionStatus = IS_IOS
    ? PermissionStatus.UNDETERMINED
    : PermissionStatus.GRANTED;
let defaultAdRequestOptions: AdRequestOptions = {
    requestNonPersonalizedAdsOnly: true,
};
let latestConsentInfo: ConsentInfoLike | null = null;
let latestUserChoices: any = null;

let consentPromise: Promise<void> | null = null;
let initializePromise: Promise<boolean> | null = null;

let interstitial: any = null;
let isInterstitialLoaded = false;
let isInterstitialLoading = false;
let interstitialListeners: Array<() => void> = [];

export const AD_IDS = __DEV__ ? TEST_AD_IDS : PRODUCTION_AD_IDS;

function isExpoGoEnvironment() {
    const executionEnvironment = (Constants as any)?.executionEnvironment;
    const appOwnership = (Constants as any)?.appOwnership;

    return (
        executionEnvironment === (ExecutionEnvironment?.StoreClient ?? 'storeClient') ||
        appOwnership === 'expo' ||
        appOwnership === 'guest'
    );
}

function loadAdMobModule() {
    if (isModuleLoaded) {
        return;
    }

    if (isExpoGoEnvironment()) {
        console.log('[AdMob] Expo Go detected, native ads disabled');
        isModuleLoaded = true;
        return;
    }

    try {
        const adMob = require('react-native-google-mobile-ads');

        mobileAdsFactory = adMob.MobileAds ?? adMob.default ?? null;
        InterstitialAd = adMob.InterstitialAd ?? null;
        AppOpenAd = adMob.AppOpenAd ?? null;
        AdEventType = adMob.AdEventType ?? null;
        BannerAd = adMob.BannerAd ?? null;
        BannerAdSize = adMob.BannerAdSize ?? null;
        AdsConsent = adMob.AdsConsent ?? null;
        AdsConsentStatus = adMob.AdsConsentStatus ?? null;

        if (!mobileAdsFactory || !InterstitialAd || !AppOpenAd || !AdEventType || !BannerAd) {
            throw new Error('AdMob module is missing required exports');
        }
    } catch (error) {
        console.log('[AdMob] Native module unavailable:', error);
        mobileAdsFactory = null;
        InterstitialAd = null;
        AppOpenAd = null;
        AdEventType = null;
        BannerAd = null;
        BannerAdSize = null;
        AdsConsent = null;
        AdsConsentStatus = null;
    } finally {
        isModuleLoaded = true;
    }
}

function cleanupInterstitialListeners() {
    interstitialListeners.forEach(unsubscribe => {
        try {
            unsubscribe();
        } catch (error) {
            console.warn('[AdMob] Failed to remove interstitial listener', error);
        }
    });

    interstitialListeners = [];
}

function buildAdRequestOptions(consentInfo?: ConsentInfoLike | null, userChoices?: any): AdRequestOptions {
    const consentStatus = consentInfo?.status;
    const trackingAuthorized = !IS_IOS || trackingPermissionStatus === PermissionStatus.GRANTED;
    const personalizedAdsAllowed =
        (trackingAuthorized && consentStatus === (AdsConsentStatus?.NOT_REQUIRED ?? 'NOT_REQUIRED')) ||
        Boolean(
            trackingAuthorized &&
            userChoices?.selectPersonalisedAds &&
            userChoices?.storeAndAccessInformationOnDevice
        );

    return {
        requestNonPersonalizedAdsOnly: !personalizedAdsAllowed,
    };
}

async function refreshConsentState(consentInfo?: ConsentInfoLike | null) {
    let resolvedConsentInfo = consentInfo ?? null;

    if (!resolvedConsentInfo && AdsConsent?.getConsentInfo) {
        try {
            resolvedConsentInfo = await AdsConsent.getConsentInfo();
        } catch (error) {
            console.warn('[AdMob] Failed to read consent info', error);
        }
    }

    let userChoices: any = null;
    if (AdsConsent?.getUserChoices) {
        try {
            userChoices = await AdsConsent.getUserChoices();
        } catch (error) {
            console.log('[AdMob] User choices unavailable, falling back to non-personalized ads');
        }
    }

    latestConsentInfo = resolvedConsentInfo;
    latestUserChoices = userChoices;
    canRequestAds = Boolean(resolvedConsentInfo?.canRequestAds ?? !AdsConsent);
    defaultAdRequestOptions = buildAdRequestOptions(resolvedConsentInfo, userChoices);
    isConsentResolved = true;

    console.log('[AdMob] Consent resolved', {
        status: resolvedConsentInfo?.status ?? 'unknown',
        canRequestAds,
        requestNonPersonalizedAdsOnly: defaultAdRequestOptions.requestNonPersonalizedAdsOnly,
    });
}

async function requestTrackingPermissionIfNeeded(): Promise<void> {
    if (!IS_IOS) {
        trackingPermissionStatus = PermissionStatus.GRANTED;
        return;
    }

    try {
        if (!isTrackingTransparencyAvailable()) {
            trackingPermissionStatus = PermissionStatus.GRANTED;
            defaultAdRequestOptions = buildAdRequestOptions(latestConsentInfo, latestUserChoices);
            return;
        }

        const currentPermission = await getTrackingPermissionsAsync();
        trackingPermissionStatus = currentPermission.status;

        if (currentPermission.status === PermissionStatus.UNDETERMINED) {
            console.log('[AdMob] Requesting ATT permission');
            const requestedPermission = await requestTrackingPermissionsAsync();
            trackingPermissionStatus = requestedPermission.status;
        }

        defaultAdRequestOptions = buildAdRequestOptions(latestConsentInfo, latestUserChoices);
        console.log('[AdMob] ATT status resolved', {
            status: trackingPermissionStatus,
            requestNonPersonalizedAdsOnly: defaultAdRequestOptions.requestNonPersonalizedAdsOnly,
        });
    } catch (error) {
        trackingPermissionStatus = PermissionStatus.DENIED;
        defaultAdRequestOptions = buildAdRequestOptions(latestConsentInfo, latestUserChoices);
        console.warn('[AdMob] ATT request failed, defaulting to non-personalized ads', error);
    }
}

export const getDefaultAdRequestOptions = (): AdRequestOptions => ({
    ...defaultAdRequestOptions,
});

export const requestAdConsent = async (): Promise<void> => {
    loadAdMobModule();

    if (!mobileAdsFactory) {
        isConsentResolved = true;
        canRequestAds = false;
        return;
    }

    if (isConsentResolved) {
        return;
    }

    if (!consentPromise) {
        consentPromise = (async () => {
            if (!AdsConsent) {
                console.log('[AdMob] AdsConsent helper unavailable, defaulting to non-personalized ads');
                canRequestAds = true;
                isConsentResolved = true;
                defaultAdRequestOptions = {
                    requestNonPersonalizedAdsOnly: true,
                };
                return;
            }

            let latestConsentInfo: ConsentInfoLike | null = null;

            try {
                if (typeof AdsConsent.gatherConsent === 'function') {
                    latestConsentInfo = await AdsConsent.gatherConsent();
                } else {
                    latestConsentInfo = await AdsConsent.requestInfoUpdate();

                    if (
                        latestConsentInfo?.isConsentFormAvailable &&
                        latestConsentInfo?.status === (AdsConsentStatus?.REQUIRED ?? 'REQUIRED') &&
                        typeof AdsConsent.showForm === 'function'
                    ) {
                        latestConsentInfo = await AdsConsent.showForm();
                    }
                }
            } catch (error) {
                console.warn('[AdMob] Consent flow failed, continuing safely with fallback options', error);
            }

            await refreshConsentState(latestConsentInfo);
        })();
    }

    await consentPromise;
};

export const initializeAdMob = async (): Promise<boolean> => {
    loadAdMobModule();

    if (!mobileAdsFactory) {
        return false;
    }

    if (isInitialized) {
        return true;
    }

    if (!initializePromise) {
        initializePromise = (async () => {
            await requestAdConsent();

            if (canRequestAds) {
                await requestTrackingPermissionIfNeeded();
            }

            if (!canRequestAds) {
                console.log('[AdMob] SDK init skipped because ads cannot be requested yet');
                return false;
            }

            try {
                await mobileAdsFactory().initialize();
                isInitialized = true;
                console.log('[AdMob] SDK initialized');
                return true;
            } catch (error) {
                console.error('[AdMob] Failed to initialize SDK', error);
                return false;
            }
        })();
    }

    const ready = await initializePromise;

    if (!ready && !isInitialized) {
        initializePromise = null;
    }

    return ready;
};

export const ensureAdMobReady = async (): Promise<boolean> => initializeAdMob();

export const loadInterstitial = async (): Promise<boolean> => {
    loadAdMobModule();

    if (!mobileAdsFactory) {
        return false;
    }

    const isReady = await ensureAdMobReady();
    if (!isReady) {
        return false;
    }

    if (isInterstitialLoaded) {
        return true;
    }

    if (isInterstitialLoading) {
        return false;
    }

    try {
        cleanupInterstitialListeners();
        isInterstitialLoading = true;
        interstitial = InterstitialAd.createForAdRequest(
            AD_IDS.INTERSTITIAL,
            getDefaultAdRequestOptions()
        );

        interstitialListeners = [
            interstitial.addAdEventListener(AdEventType.LOADED, () => {
                isInterstitialLoaded = true;
                isInterstitialLoading = false;
                console.log('[AdMob] Interstitial loaded');
            }),
            interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                console.log('[AdMob] Interstitial closed');
                isInterstitialLoaded = false;
                isInterstitialLoading = false;
                void loadInterstitial();
            }),
            interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
                console.error('[AdMob] Interstitial failed', error);
                isInterstitialLoaded = false;
                isInterstitialLoading = false;
            }),
        ];

        interstitial.load();
        return true;
    } catch (error) {
        console.error('[AdMob] Failed to load interstitial', error);
        isInterstitialLoaded = false;
        isInterstitialLoading = false;
        cleanupInterstitialListeners();
        return false;
    }
};

export const showInterstitial = async (): Promise<boolean> => {
    loadAdMobModule();

    if (!mobileAdsFactory) {
        console.log('[AdMob] Interstitial skipped because native module is unavailable');
        if (__DEV__) {
            Alert.alert(
                'AdMob (Development Mode)',
                "Gecis reklami burada gosterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
                [{ text: 'Tamam' }]
            );
        }
        return false;
    }

    const isReady = await ensureAdMobReady();
    if (!isReady) {
        return false;
    }

    if (!isInterstitialLoaded || !interstitial) {
        console.log('[AdMob] Interstitial not ready, requesting preload');
        void loadInterstitial();
        return false;
    }

    try {
        isInterstitialLoaded = false;
        await interstitial.show();
        return true;
    } catch (error) {
        console.error('[AdMob] Failed to show interstitial', error);
        isInterstitialLoaded = false;
        isInterstitialLoading = false;
        void loadInterstitial();
        return false;
    }
};

export const checkAndShowAppOpenAd = async (): Promise<void> => {
    try {
        const countStr = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
        let count = countStr ? parseInt(countStr, 10) : 0;

        count += 1;
        await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, count.toString());

        console.log(`[AdMob] App launch count: ${count}`);

        if (count % 3 !== 0) {
            return;
        }

        loadAdMobModule();

        if (!mobileAdsFactory) {
            console.log('[AdMob] App open ad skipped because native module is unavailable');
            if (__DEV__) {
                Alert.alert(
                    'AdMob (Development Mode)',
                    "Uygulama acilis reklami burada gosterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
                    [{ text: 'Tamam' }]
                );
            }
            return;
        }

        const isReady = await ensureAdMobReady();
        if (!isReady) {
            return;
        }

        const appOpenAd = AppOpenAd.createForAdRequest(
            AD_IDS.APP_OPEN,
            getDefaultAdRequestOptions()
        );

        await new Promise<void>(resolve => {
            let settled = false;
            const listeners: Array<() => void> = [];

            const finish = () => {
                if (settled) {
                    return;
                }

                settled = true;
                clearTimeout(timeoutId);
                listeners.forEach(unsubscribe => {
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
                appOpenAd.addAdEventListener(AdEventType.LOADED, async () => {
                    if (settled) {
                        return;
                    }

                    try {
                        await appOpenAd.show();
                    } catch (error) {
                        console.error('[AdMob] Failed to show app open ad', error);
                        finish();
                    }
                })
            );

            listeners.push(
                appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
                    console.log('[AdMob] App open ad closed');
                    finish();
                })
            );

            listeners.push(
                appOpenAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
                    console.error('[AdMob] App open ad failed', error);
                    finish();
                })
            );

            appOpenAd.load();
        });
    } catch (error) {
        console.error('[AdMob] App open flow failed', error);
    }
};

export const getBannerAdComponent = () => {
    loadAdMobModule();
    return BannerAd || null;
};

export const getBannerAdSize = () => {
    loadAdMobModule();
    return BannerAdSize || {};
};

export const areAdsSupported = () => {
    loadAdMobModule();
    return Boolean(mobileAdsFactory);
};
