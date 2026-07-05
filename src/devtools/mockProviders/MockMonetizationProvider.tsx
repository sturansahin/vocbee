// src/devtools/mockProviders/MockMonetizationProvider.tsx
// Fake monetization state (isAdFree/premium toggle) for devtools scenarios. Never calls
// RevenueCat/AdMob SDKs — all mutating actions are no-op stubs.

import React, { createContext, ReactNode, useMemo } from 'react';
import type { DevToolsScenario } from '../scenarios';

export interface MockMonetizationValue {
  isAdFree: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  presentPaywall: (...args: any[]) => Promise<any>;
  restorePurchases: () => Promise<void>;
  refresh: () => Promise<void>;
}

function noopAsync(label: string) {
  return async (..._args: any[]) => {
    console.log(`[DevTools][MockMonetizationProvider] blocked no-op call: ${label} (no real RevenueCat/AdMob call is made)`);
  };
}

export function buildMockMonetizationValue(scenario: DevToolsScenario): MockMonetizationValue {
  return {
    isAdFree: scenario.monetization.isAdFree,
    isLoading: scenario.monetization.isLoading,
    isPurchasing: false,
    presentPaywall: noopAsync('presentPaywall'),
    restorePurchases: noopAsync('restorePurchases'),
    refresh: noopAsync('refresh'),
  };
}

export const MockMonetizationContext = createContext<MockMonetizationValue | undefined>(undefined);

export function MockMonetizationProvider({
  scenario,
  children,
}: {
  scenario: DevToolsScenario;
  children: ReactNode;
}) {
  const value = useMemo(() => buildMockMonetizationValue(scenario), [scenario]);
  return <MockMonetizationContext.Provider value={value}>{children}</MockMonetizationContext.Provider>;
}
