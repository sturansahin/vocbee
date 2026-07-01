// src/features/monetization/domain/__tests__/rules.test.ts
// Pure gating rule tests (docs/refactor-v2/37 §10, /28 PR-8.1). No SDK/mock needed.

import {
    getActiveEntitlement,
    hasActiveAdFreeEntitlement,
    shouldAttemptAppOpenAd,
    shouldShowAds,
} from '../rules';
import { REVENUECAT_AD_FREE_ENTITLEMENT_ID } from '../constants';
import type { CustomerInfoLike } from '../types';

describe('premium/free gating (shouldShowAds)', () => {
    it('hides ads when entitlement "premium" is active', () => {
        expect(shouldShowAds({ isAdFree: true })).toBe(false);
    });

    it('shows ads for free users', () => {
        expect(shouldShowAds({ isAdFree: false })).toBe(true);
    });
});

describe('getActiveEntitlement', () => {
    it('returns null when customerInfo is null', () => {
        expect(getActiveEntitlement(null)).toBeNull();
    });

    it('returns null when entitlement id is not present', () => {
        const customerInfo: CustomerInfoLike = { entitlements: { active: {} } };
        expect(getActiveEntitlement(customerInfo)).toBeNull();
    });

    it('returns the entitlement when present under REVENUECAT_AD_FREE_ENTITLEMENT_ID', () => {
        const customerInfo: CustomerInfoLike = {
            entitlements: { active: { [REVENUECAT_AD_FREE_ENTITLEMENT_ID]: { isActive: true } } },
        };
        expect(getActiveEntitlement(customerInfo)).toEqual({ isActive: true });
    });

    it('supports a custom entitlement id', () => {
        const customerInfo: CustomerInfoLike = {
            entitlements: { active: { other: { isActive: true } } },
        };
        expect(getActiveEntitlement(customerInfo, 'other')).toEqual({ isActive: true });
    });
});

describe('hasActiveAdFreeEntitlement', () => {
    it('returns false for null customerInfo', () => {
        expect(hasActiveAdFreeEntitlement(null)).toBe(false);
    });

    it('returns false when the premium entitlement is present but inactive', () => {
        const customerInfo: CustomerInfoLike = {
            entitlements: { active: { [REVENUECAT_AD_FREE_ENTITLEMENT_ID]: { isActive: false } } },
        };
        expect(hasActiveAdFreeEntitlement(customerInfo)).toBe(false);
    });

    it('returns true when the premium entitlement is active', () => {
        const customerInfo: CustomerInfoLike = {
            entitlements: { active: { [REVENUECAT_AD_FREE_ENTITLEMENT_ID]: { isActive: true } } },
        };
        expect(hasActiveAdFreeEntitlement(customerInfo)).toBe(true);
    });
});

describe('shouldAttemptAppOpenAd', () => {
    it('is true every Nth launch (interval=3)', () => {
        expect(shouldAttemptAppOpenAd(3, 3)).toBe(true);
        expect(shouldAttemptAppOpenAd(6, 3)).toBe(true);
        expect(shouldAttemptAppOpenAd(9, 3)).toBe(true);
    });

    it('is false on non-multiple launches', () => {
        expect(shouldAttemptAppOpenAd(1, 3)).toBe(false);
        expect(shouldAttemptAppOpenAd(2, 3)).toBe(false);
        expect(shouldAttemptAppOpenAd(4, 3)).toBe(false);
    });

    it('is false when interval is 0 (guard against division by zero)', () => {
        expect(shouldAttemptAppOpenAd(3, 0)).toBe(false);
    });
});
