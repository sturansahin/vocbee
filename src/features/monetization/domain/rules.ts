// src/features/monetization/domain/rules.ts
// Pure premium/free gating rules. No SDK imports (docs/refactor-v2/06, /14, /28, /33).
// This is the ONLY place that decides "should ads be shown" — screens/facades must delegate here
// instead of re-deriving the condition (previously `!isAdFree && !isMonetizationLoading` inline in
// screens/HomeScreen.tsx and `services/adMobService`/`context/MonetizationContext` consumers).

import type { AdGatingState, CustomerInfoLike, EntitlementInfoLike } from './types';
import { REVENUECAT_AD_FREE_ENTITLEMENT_ID } from './constants';

/**
 * Premium/free ad gating rule (docs/refactor-v2/37 §10):
 * ads are shown for free users, hidden once the ad-free entitlement is active.
 */
export function shouldShowAds(state: AdGatingState): boolean {
  return !state.isAdFree;
}

/**
 * Looks up the ad-free entitlement on a CustomerInfo-like object.
 * Mirrors services/revenueCatService.ts#getActiveEntitlement.
 */
export function getActiveEntitlement(
  customerInfo: CustomerInfoLike | null,
  entitlementId: string = REVENUECAT_AD_FREE_ENTITLEMENT_ID,
): EntitlementInfoLike | null {
  return customerInfo?.entitlements.active[entitlementId] ?? null;
}

/**
 * Whether the ad-free ("premium") entitlement is currently active.
 * Mirrors services/revenueCatService.ts#hasActiveAdFreeEntitlement.
 */
export function hasActiveAdFreeEntitlement(customerInfo: CustomerInfoLike | null): boolean {
  return Boolean(getActiveEntitlement(customerInfo)?.isActive);
}

/** Whether an app-open ad should be attempted on this launch count (services/adMobService.ts behavior). */
export function shouldAttemptAppOpenAd(launchCount: number, interval: number): boolean {
  return interval > 0 && launchCount % interval === 0;
}
