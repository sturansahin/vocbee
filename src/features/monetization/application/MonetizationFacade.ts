// src/features/monetization/application/MonetizationFacade.ts
// Orchestrates RevenueCatRepository + AdMobRepository behind a single facade (docs/refactor-v2/06 §C
// Facade Pattern, /14, /28 PR-8.4). No SDK calls here — only repository-interface calls + domain rules.
// MonetizationProvider (presentation) depends on this facade instead of talking to the repositories
// directly, keeping the provider a thin state container.

import { shouldShowAds } from '../domain/rules';
import type { CustomerInfoLike, PaywallOutcome, RevenueCatUserAttributes } from '../domain/types';
import type { AdMobRepository, RevenueCatRepository } from '../data/contracts';

export interface MonetizationFacadeDeps {
    revenueCatRepository: RevenueCatRepository;
    adMobRepository: AdMobRepository;
}

export class MonetizationFacade {
    constructor(private readonly deps: MonetizationFacadeDeps) {}

    // --- RevenueCat / premium use-cases ---

    getCustomerInfo(userId: string, attributes?: RevenueCatUserAttributes): Promise<CustomerInfoLike | null> {
        return this.deps.revenueCatRepository.getCustomerInfo(userId, attributes);
    }

    presentRemoveAdsPaywall(userId: string, attributes?: RevenueCatUserAttributes): Promise<PaywallOutcome> {
        return this.deps.revenueCatRepository.presentPaywall(userId, attributes);
    }

    restorePurchases(userId: string, attributes?: RevenueCatUserAttributes): Promise<CustomerInfoLike | null> {
        return this.deps.revenueCatRepository.restore(userId, attributes);
    }

    openCustomerCenter(userId: string, attributes?: RevenueCatUserAttributes): Promise<CustomerInfoLike | null> {
        return this.deps.revenueCatRepository.openCustomerCenter(userId, attributes);
    }

    onCustomerInfoChanged(cb: (info: CustomerInfoLike) => void): () => void {
        return this.deps.revenueCatRepository.onCustomerInfoChanged(cb);
    }

    syncPreferredUILocale(language?: string | null): Promise<void> {
        return this.deps.revenueCatRepository.syncPreferredUILocale(language);
    }

    /** Pure gating decision: whether ads should be shown for the current ad-free status. */
    shouldShowAds(isAdFree: boolean): boolean {
        return shouldShowAds({ isAdFree });
    }

    // --- AdMob / ads use-cases ---

    requestAdConsent(): Promise<void> {
        return this.deps.adMobRepository.requestConsent();
    }

    initializeAds(): Promise<boolean> {
        return this.deps.adMobRepository.initialize();
    }

    ensureAdsReady(): Promise<boolean> {
        return this.deps.adMobRepository.ensureReady();
    }

    loadInterstitial(forceReload: boolean = false): Promise<boolean> {
        return this.deps.adMobRepository.loadInterstitial(forceReload);
    }

    showInterstitial(): Promise<boolean> {
        return this.deps.adMobRepository.showInterstitial();
    }

    refreshAdInventoryOnForeground(forceReload: boolean = true): Promise<void> {
        return this.deps.adMobRepository.refreshAdInventoryOnForeground(forceReload);
    }

    checkAndShowAppOpenAd(): Promise<void> {
        return this.deps.adMobRepository.checkAndShowAppOpenAd();
    }

    async maybeShowInterstitial(isAdFree: boolean): Promise<void> {
        if (!this.shouldShowAds(isAdFree)) {
            return;
        }

        await this.showInterstitial();
    }

    async maybeShowAppOpenAd(isAdFree: boolean): Promise<void> {
        if (!this.shouldShowAds(isAdFree)) {
            return;
        }

        await this.checkAndShowAppOpenAd();
    }

    async maybeRefreshAdInventoryOnForeground(isAdFree: boolean, forceReload: boolean = true): Promise<void> {
        if (!this.shouldShowAds(isAdFree)) {
            return;
        }

        await this.refreshAdInventoryOnForeground(forceReload);
    }

    getAdIds() {
        return this.deps.adMobRepository.getAdIds();
    }

    getDefaultAdRequestOptions() {
        return this.deps.adMobRepository.getDefaultAdRequestOptions();
    }

    getBannerAdComponent() {
        return this.deps.adMobRepository.getBannerAdComponent();
    }

    getBannerAdSize() {
        return this.deps.adMobRepository.getBannerAdSize();
    }

    areAdsSupported(): boolean {
        return this.deps.adMobRepository.areAdsSupported();
    }
}
