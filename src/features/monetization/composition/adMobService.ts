import type { AdRequestOptionsLike } from '../domain/types';
import { monetizationFacade } from '../application/monetizationFacade.instance';

// Stable application-facing AdMob API. Concrete native/web repositories remain internal.
export const AD_IDS = monetizationFacade.getAdIds();

export const getDefaultAdRequestOptions = (): AdRequestOptionsLike =>
  monetizationFacade.getDefaultAdRequestOptions();

export const requestAdConsent = (): Promise<void> => monetizationFacade.requestAdConsent();

export const initializeAdMob = (): Promise<boolean> => monetizationFacade.initializeAds();

export const ensureAdMobReady = (): Promise<boolean> => monetizationFacade.ensureAdsReady();

export const loadInterstitial = (forceReload: boolean = false): Promise<boolean> =>
  monetizationFacade.loadInterstitial(forceReload);

export const showInterstitial = (): Promise<boolean> => monetizationFacade.showInterstitial();

export const refreshAdInventoryOnForeground = (forceReload: boolean = true): Promise<void> =>
  monetizationFacade.refreshAdInventoryOnForeground(forceReload);

export const checkAndShowAppOpenAd = (): Promise<void> =>
  monetizationFacade.checkAndShowAppOpenAd();

export const getBannerAdComponent = (): any => monetizationFacade.getBannerAdComponent();

export const getBannerAdSize = (): any => monetizationFacade.getBannerAdSize();

export const areAdsSupported = (): boolean => monetizationFacade.areAdsSupported();
