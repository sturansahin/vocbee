// src/features/monetization/data/repositories/__tests__/AdMobRepository.web.test.ts
// Web no-op variant test (docs/refactor-v2/28 §11: "web no-op").

import { AdMobRepositoryImpl, AD_IDS } from '../AdMobRepository.web';

describe('AdMobRepositoryImpl (web no-op)', () => {
  let repo: AdMobRepositoryImpl;

  beforeEach(() => {
    repo = new AdMobRepositoryImpl();
  });

  it('reports ads as not supported', () => {
    expect(repo.areAdsSupported()).toBe(false);
  });

  it('all ad ids are empty strings', () => {
    expect(AD_IDS).toEqual({ BANNER: '', INTERSTITIAL: '', APP_OPEN: '' });
  });

  it('every method resolves to its no-op default without throwing', async () => {
    await expect(repo.requestConsent()).resolves.toBeUndefined();
    await expect(repo.initialize()).resolves.toBe(false);
    await expect(repo.ensureReady()).resolves.toBe(false);
    await expect(repo.loadInterstitial()).resolves.toBe(false);
    await expect(repo.showInterstitial()).resolves.toBe(false);
    await expect(repo.refreshAdInventoryOnForeground()).resolves.toBeUndefined();
    await expect(repo.checkAndShowAppOpenAd()).resolves.toBeUndefined();
    expect(repo.getBannerAdComponent()).toBeNull();
    expect(repo.getBannerAdSize()).toEqual({});
    expect(repo.getDefaultAdRequestOptions()).toEqual({ requestNonPersonalizedAdsOnly: true });
  });
});
