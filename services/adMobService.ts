import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & IDs
// ─────────────────────────────────────────────────────────────────────────────

// Unit IDs (provided by user, currently Test IDs)
const BANNER_ID = 'ca-app-pub-3940256099942544/2934735716';
const INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/4411468910';
const APP_OPEN_ID = 'ca-app-pub-3940256099942544/5662855259';

// Storage Keys
const APP_LAUNCH_COUNT_KEY = '@app_launch_count';

// Check if running in Expo Go or if native module is missing
let AdMobModule: any = null;
let MobileAds: any = null;
let InterstitialAd: any = null;
let AppOpenAd: any = null;
let AdEventType: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;

let isModuleLoaded = false;

// Helper to safely load the module
function loadAdMobModule() {
    if (isModuleLoaded) return;

    // Robust Expo Go detection
    const isExpoGo =
        Constants.executionEnvironment === 'storeClient' ||
        Constants.appOwnership === 'expo' ||
        Constants.appOwnership === 'guest'; // 'guest' is sometimes used in Expo Go

    if (isExpoGo) {
        console.log('Running in Expo Go - AdMob skipped to prevent crash');
        isModuleLoaded = true;
        AdMobModule = null; // Ensure null
        return;
    }

    try {
        // Attempt to require the module
        // We strictly catch ANY error here, including Invariant Violation
        const adMob = require('react-native-google-mobile-ads');

        // Quick check if the module actually exported what we need
        if (adMob && adMob.MobileAds) {
            MobileAds = adMob.MobileAds;
            InterstitialAd = adMob.InterstitialAd;
            AppOpenAd = adMob.AppOpenAd;
            AdEventType = adMob.AdEventType;
            BannerAd = adMob.BannerAd;
            BannerAdSize = adMob.BannerAdSize;
            AdMobModule = true;
        } else {
            throw new Error('AdMob module loaded but exports are missing');
        }
    } catch (error) {
        console.log('AdMob native module could not be loaded (safely caught):', error);
        AdMobModule = null;
    } finally {
        isModuleLoaded = true;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Initialization
// ─────────────────────────────────────────────────────────────────────────────

let isInitialized = false;

export const initializeAdMob = async () => {
    loadAdMobModule(); // Try to load

    if (!AdMobModule || isInitialized) return;

    try {
        await MobileAds().initialize();
        isInitialized = true;
        console.log('AdMob initialized');
    } catch (error) {
        console.error('Failed to initialize AdMob', error);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Interstitial Ad (Transition Ad)
// ─────────────────────────────────────────────────────────────────────────────

let interstitial: any = null;
let isInterstitialLoaded = false;

export const loadInterstitial = () => {
    loadAdMobModule();
    if (!AdMobModule) return;

    try {
        // Unsubscribe old events if any (simplified here by just creating new)
        interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
            requestNonPersonalizedAdsOnly: true,
        });

        interstitial.addAdEventListener(AdEventType.LOADED, () => {
            isInterstitialLoaded = true;
            console.log('Interstitial Ad Loaded');
        });

        interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            console.log('Interstitial Ad Closed');
            isInterstitialLoaded = false;
            // Load the next one immediately
            loadInterstitial();
        });

        interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
            console.error('Interstitial Ad Error:', error);
            isInterstitialLoaded = false;
        });

        interstitial.load();
    } catch (e) {
        console.error('Error loading interstitial', e);
    }
};

export const showInterstitial = async () => {
    loadAdMobModule();
    if (!AdMobModule) {
        console.log('Show Interstitial (Mock) - AdMob not enabled');
        Alert.alert(
            "AdMob (Development Mode)",
            "Geçiş Reklamı (Interstitial) burada gösterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
            [{ text: "Tamam" }]
        );
        return;
    }

    if (isInterstitialLoaded && interstitial) {
        await interstitial.show();
        isInterstitialLoaded = false; // Reset immediately
    } else {
        console.log('Interstitial not ready yet, reloading...');
        loadInterstitial();
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// App Open Ad
// ─────────────────────────────────────────────────────────────────────────────

let appOpenAd: any = null;

/**
 * Checks the launch count and shows App Open Ad if it's the 3rd launch (modulo 3).
 * Must be called on app startup.
 */
export const checkAndShowAppOpenAd = async () => {
    try {
        // 1. Load, increment, and save launch count
        const countStr = await AsyncStorage.getItem(APP_LAUNCH_COUNT_KEY);
        let count = countStr ? parseInt(countStr, 10) : 0;

        count += 1;
        await AsyncStorage.setItem(APP_LAUNCH_COUNT_KEY, count.toString());

        console.log(`App Launch Count: ${count}`);

        loadAdMobModule();
        if (!AdMobModule) {
            console.log('App Open Ad Check (Mock) - AdMob not enabled');
            if (count % 3 === 0) {
                Alert.alert(
                    "AdMob (Development Mode)",
                    "Uygulama Açılış Reklamı (App Open) burada gösterilecek.\n(Expo Go'da native reklamlar desteklenmez)",
                    [{ text: "Tamam" }]
                );
            }
            return;
        }

        // 2. Check overlap condition (Every 3rd launch: 3, 6, 9...)
        if (count % 3 === 0) {
            console.log('Condition met for App Open Ad. Attempting to show...');

            appOpenAd = AppOpenAd.createForAdRequest(APP_OPEN_ID, {
                requestNonPersonalizedAdsOnly: true,
            });

            // Return a promise that resolves when ad is closed or fails, 
            // so the app splash screen can wait if desired (optional)
            return new Promise<void>((resolve) => {
                const showTimeout = setTimeout(() => {
                    console.log('App Open Ad load timeout - proceeding');
                    resolve();
                }, 5000); // 5 sec timeout to not block app start too long

                appOpenAd?.addAdEventListener(AdEventType.LOADED, () => {
                    if (appOpenAd) {
                        try {
                            appOpenAd.show();
                        } catch (e) {
                            console.error('Error showing App Open Ad:', e);
                            resolve();
                        }
                    }
                });

                appOpenAd?.addAdEventListener(AdEventType.CLOSED, () => {
                    clearTimeout(showTimeout);
                    resolve();
                });

                appOpenAd?.addAdEventListener(AdEventType.ERROR, (e: any) => {
                    console.error('App Open Ad failed to load:', e);
                    clearTimeout(showTimeout);
                    resolve();
                });

                appOpenAd?.load();
            });
        }
    } catch (error) {
        console.error('Error in App Open Ad logic:', error);
    }
};

// Export IDs and Types for usage
export const AD_IDS = {
    BANNER: BANNER_ID,
    INTERSTITIAL: INTERSTITIAL_ID,
    APP_OPEN: APP_OPEN_ID
};

export const getBannerAdComponent = () => {
    loadAdMobModule();
    return BannerAd || null;
};

export const getBannerAdSize = () => {
    loadAdMobModule();
    return BannerAdSize || {};
};

// Export boolean to let components know if ads are supported
export const areAdsSupported = () => {
    loadAdMobModule();
    return !!AdMobModule;
};
