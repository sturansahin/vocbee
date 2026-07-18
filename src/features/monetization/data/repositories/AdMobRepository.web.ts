// src/features/monetization/data/repositories/AdMobRepository.web.ts
// Web no-op implementation, moved verbatim from services/adMobService.web.ts (docs/refactor-v2/28,
// PR-8.3). Metro/webpack resolve this file automatically for web builds via the `.web.ts` suffix.

import type { AdIds, AdRequestOptionsLike } from '../../domain/types';
import type { AdMobRepository as AdMobRepositoryContract } from '../contracts';

export const AD_IDS: AdIds = {
  BANNER: '',
  INTERSTITIAL: '',
  APP_OPEN: '',
};

export class AdMobRepositoryImpl implements AdMobRepositoryContract {
  getDefaultAdRequestOptions(): AdRequestOptionsLike {
    return { requestNonPersonalizedAdsOnly: true };
  }

  async requestConsent(): Promise<void> {
    return undefined;
  }

  async initialize(): Promise<boolean> {
    return false;
  }

  async ensureReady(): Promise<boolean> {
    return false;
  }

  async loadInterstitial(_forceReload: boolean = false): Promise<boolean> {
    return false;
  }

  async showInterstitial(): Promise<boolean> {
    return false;
  }

  async refreshAdInventoryOnForeground(_forceReload: boolean = true): Promise<void> {
    return undefined;
  }

  async checkAndShowAppOpenAd(): Promise<void> {
    return undefined;
  }

  getAdIds(): AdIds {
    return AD_IDS;
  }

  getBannerAdComponent() {
    return null;
  }

  getBannerAdSize() {
    return {};
  }

  areAdsSupported(): boolean {
    return false;
  }
}

export const adMobRepository = new AdMobRepositoryImpl();

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
