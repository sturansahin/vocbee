// src/features/monetization/domain/types.ts
// Pure TypeScript types for the monetization domain. No SDK imports (docs/refactor-v2/33).
// These are lightweight, SDK-agnostic mirrors of the RevenueCat/AdMob shapes actually consumed
// by the app (context/MonetizationContext.tsx, services/revenueCatService.ts, services/adMobService.ts).

/** Minimal shape of RevenueCat's PurchasesEntitlementInfo actually used by the app. */
export interface EntitlementInfoLike {
    isActive: boolean;
    /** ISO date string of entitlement expiration (used by SettingsScreen to render renewal date). */
    expirationDate?: string | null;
}

/** Minimal shape of RevenueCat's CustomerInfo actually used by the app. */
export interface CustomerInfoLike {
    entitlements: {
        active: Record<string, EntitlementInfoLike | undefined>;
    };
}

/** Mirrors react-native-purchases-ui's PAYWALL_RESULT string union (kept as string to stay SDK-free). */
export type PaywallResultLike = 'NOT_PRESENTED' | 'ERROR' | 'CANCELLED' | 'PURCHASED' | 'RESTORED';

export interface PaywallOutcome {
    result: PaywallResultLike;
    customerInfo: CustomerInfoLike | null;
}

/** Alias kept for backwards compatibility with services/revenueCatService.ts's RevenueCatPaywallResult name. */
export type RevenueCatPaywallResult = PaywallOutcome;

export interface RevenueCatUserAttributes {
    email?: string | null;
    displayName?: string | null;
}

/** Ad unit ids for banner/interstitial/app-open placements (test or production, resolved by __DEV__). */
export interface AdIds {
    BANNER: string;
    INTERSTITIAL: string;
    APP_OPEN: string;
}

export interface AdRequestOptionsLike {
    requestNonPersonalizedAdsOnly?: boolean;
}

/** Gating input: whatever the domain needs to decide ad visibility — kept minimal and SDK-free. */
export interface AdGatingState {
    isAdFree: boolean;
}
