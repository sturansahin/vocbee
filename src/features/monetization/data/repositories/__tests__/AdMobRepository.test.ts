// src/features/monetization/data/repositories/__tests__/AdMobRepository.test.ts
// Repository test against the real class. jest.setup.js mocks react-native-google-mobile-ads with
// only { BannerAd, BannerAdSize, TestIds } — missing MobileAds/InterstitialAd/AppOpenAd/AdEventType —
// which reproduces the "native module unavailable" fallback path (docs/refactor-v2/28 §11: "AdMob
// unavailable case"), matching services/adMobService.ts's loadAdMobModule() guard behavior.

import { AdMobRepositoryImpl } from '../AdMobRepository';

describe('AdMobRepositoryImpl — native module unavailable', () => {
    let repo: AdMobRepositoryImpl;

    beforeEach(() => {
        repo = new AdMobRepositoryImpl();
    });

    it('reports ads as not supported when the native module is unavailable', () => {
        expect(repo.areAdsSupported()).toBe(false);
    });

    it('resolves requestConsent without throwing and marks consent as resolved without ads', async () => {
        await expect(repo.requestConsent()).resolves.toBeUndefined();
    });

    it('initialize() resolves to false when the native module is unavailable', async () => {
        await expect(repo.initialize()).resolves.toBe(false);
    });

    it('ensureReady() resolves to false when the native module is unavailable', async () => {
        await expect(repo.ensureReady()).resolves.toBe(false);
    });

    it('loadInterstitial() resolves to false when the native module is unavailable', async () => {
        await expect(repo.loadInterstitial()).resolves.toBe(false);
    });

    it('showInterstitial() resolves to false when the native module is unavailable', async () => {
        await expect(repo.showInterstitial()).resolves.toBe(false);
    });

    it('checkAndShowAppOpenAd() does not throw when the native module is unavailable', async () => {
        await expect(repo.checkAndShowAppOpenAd()).resolves.toBeUndefined();
    });

    it('getBannerAdComponent() returns null when the native module is unavailable', () => {
        expect(repo.getBannerAdComponent()).toBeNull();
    });

    it('getDefaultAdRequestOptions() defaults to non-personalized ads', () => {
        expect(repo.getDefaultAdRequestOptions()).toEqual({ requestNonPersonalizedAdsOnly: true });
    });

    it('getAdIds() returns the resolved AD_IDS (test ids in __DEV__)', () => {
        const ids = repo.getAdIds();
        expect(ids).toHaveProperty('BANNER');
        expect(ids).toHaveProperty('INTERSTITIAL');
        expect(ids).toHaveProperty('APP_OPEN');
    });
});

describe('AdMobRepositoryImpl — app-open ad launch gating', () => {
    it('increments the app-launch counter and skips ad attempts on non-gated launches', async () => {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        await AsyncStorage.clear();

        const repo = new AdMobRepositoryImpl();

        // 1st and 2nd launches: not a multiple of 3, ad flow should be skipped early (no throw).
        await expect(repo.checkAndShowAppOpenAd()).resolves.toBeUndefined();
        await expect(repo.checkAndShowAppOpenAd()).resolves.toBeUndefined();

        const stored = await AsyncStorage.getItem('@app_launch_count');
        expect(stored).toBe('2');
    });
});
