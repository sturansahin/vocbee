// src/features/monetization/data/contracts.ts
// Repository interfaces (docs/architecture.md). Application depends only on these interfaces,
// never on the concrete RevenueCat/AdMob SDK-backed implementations (docs/architecture.md import matrix).

import type {
  AdIds,
  AdRequestOptionsLike,
  CustomerInfoLike,
  PaywallOutcome,
  RevenueCatUserAttributes,
} from '../domain/types';

export interface RevenueCatRepository {
  getCustomerInfo(
    userId: string,
    attributes?: RevenueCatUserAttributes,
  ): Promise<CustomerInfoLike | null>;
  presentPaywall(userId: string, attributes?: RevenueCatUserAttributes): Promise<PaywallOutcome>;
  restore(userId: string, attributes?: RevenueCatUserAttributes): Promise<CustomerInfoLike | null>;
  openCustomerCenter(
    userId: string,
    attributes?: RevenueCatUserAttributes,
  ): Promise<CustomerInfoLike | null>;
  onCustomerInfoChanged(cb: (info: CustomerInfoLike) => void): () => void;
  syncPreferredUILocale(language?: string | null): Promise<void>;
}

export interface AdMobRepository {
  requestConsent(): Promise<void>;
  initialize(): Promise<boolean>;
  ensureReady(): Promise<boolean>;
  loadInterstitial(forceReload?: boolean): Promise<boolean>;
  showInterstitial(): Promise<boolean>;
  refreshAdInventoryOnForeground(forceReload?: boolean): Promise<void>;
  checkAndShowAppOpenAd(): Promise<void>;
  getAdIds(): AdIds;
  getDefaultAdRequestOptions(): AdRequestOptionsLike;
  getBannerAdComponent(): unknown;
  getBannerAdSize(): unknown;
  areAdsSupported(): boolean;
}
