// src/features/monetization/application/__tests__/MonetizationFacade.test.ts
// Fake-repository use-case tests (docs/refactor-v2/37 §3, /28 §11). No SDK involved — verifies the
// facade delegates correctly and applies the gating rule before calling AdMob repository methods.

import { MonetizationFacade } from '../MonetizationFacade';
import type { AdMobRepository, RevenueCatRepository } from '../../data/contracts';
import type { CustomerInfoLike, RevenueCatUserAttributes } from '../../domain/types';

function makeFakeRevenueCatRepository(): jest.Mocked<RevenueCatRepository> {
    return {
        getCustomerInfo: jest.fn(async (_userId: string, _attributes?: RevenueCatUserAttributes) => null),
        presentPaywall: jest.fn(async (_userId: string, _attributes?: RevenueCatUserAttributes) => ({ result: 'NOT_PRESENTED' as const, customerInfo: null })),
        restore: jest.fn(async (_userId: string, _attributes?: RevenueCatUserAttributes) => null),
        openCustomerCenter: jest.fn(async (_userId: string, _attributes?: RevenueCatUserAttributes) => null),
        onCustomerInfoChanged: jest.fn((_cb: (info: CustomerInfoLike) => void) => () => undefined),
        syncPreferredUILocale: jest.fn(async (_language?: string | null) => undefined),
    };
}

function makeFakeAdMobRepository(): jest.Mocked<AdMobRepository> {
    return {
        requestConsent: jest.fn(async () => undefined),
        initialize: jest.fn(async () => true),
        ensureReady: jest.fn(async () => true),
        loadInterstitial: jest.fn(async () => true),
        showInterstitial: jest.fn(async () => true),
        refreshAdInventoryOnForeground: jest.fn(async () => undefined),
        checkAndShowAppOpenAd: jest.fn(async () => undefined),
        getAdIds: jest.fn(() => ({ BANNER: 'b', INTERSTITIAL: 'i', APP_OPEN: 'a' })),
        getDefaultAdRequestOptions: jest.fn(() => ({ requestNonPersonalizedAdsOnly: true })),
        getBannerAdComponent: jest.fn(() => null),
        getBannerAdSize: jest.fn(() => ({})),
        areAdsSupported: jest.fn(() => true),
    };
}

describe('MonetizationFacade', () => {
    it('delegates restorePurchases to the RevenueCat repository', async () => {
        const revenueCatRepository = makeFakeRevenueCatRepository();
        const adMobRepository = makeFakeAdMobRepository();
        const facade = new MonetizationFacade({ revenueCatRepository, adMobRepository });

        await facade.restorePurchases('user-1', { email: 'a@b.com' });

        expect(revenueCatRepository.restore).toHaveBeenCalledWith('user-1', { email: 'a@b.com' });
    });

    it('shows an interstitial for free users (maybeShowInterstitial)', async () => {
        const revenueCatRepository = makeFakeRevenueCatRepository();
        const adMobRepository = makeFakeAdMobRepository();
        const facade = new MonetizationFacade({ revenueCatRepository, adMobRepository });

        await facade.maybeShowInterstitial(false);

        expect(adMobRepository.showInterstitial).toHaveBeenCalledTimes(1);
    });

    it('does NOT show an interstitial for ad-free (premium) users', async () => {
        const revenueCatRepository = makeFakeRevenueCatRepository();
        const adMobRepository = makeFakeAdMobRepository();
        const facade = new MonetizationFacade({ revenueCatRepository, adMobRepository });

        await facade.maybeShowInterstitial(true);

        expect(adMobRepository.showInterstitial).not.toHaveBeenCalled();
    });

    it('does NOT trigger an app-open ad for ad-free (premium) users', async () => {
        const revenueCatRepository = makeFakeRevenueCatRepository();
        const adMobRepository = makeFakeAdMobRepository();
        const facade = new MonetizationFacade({ revenueCatRepository, adMobRepository });

        await facade.maybeShowAppOpenAd(true);

        expect(adMobRepository.checkAndShowAppOpenAd).not.toHaveBeenCalled();
    });

    it('shouldShowAds mirrors the domain gating rule', () => {
        const revenueCatRepository = makeFakeRevenueCatRepository();
        const adMobRepository = makeFakeAdMobRepository();
        const facade = new MonetizationFacade({ revenueCatRepository, adMobRepository });

        expect(facade.shouldShowAds(true)).toBe(false);
        expect(facade.shouldShowAds(false)).toBe(true);
    });
});
