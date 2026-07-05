// src/devtools/__tests__/mockProviders.test.tsx
// Mock provider render smoke test: MockAuthProvider / MockMonetizationProvider /
// DevToolsScenarioProvider render their children without throwing, expose the expected fixture
// values, and their mutating methods are no-ops (never touch real Firebase/RevenueCat/AdMob).

import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SCENARIOS } from '../scenarios';
import { MockAuthContext, MockAuthProvider, buildMockAuthValue } from '../mockProviders/MockAuthProvider';
import { MockMonetizationContext, MockMonetizationProvider, buildMockMonetizationValue } from '../mockProviders/MockMonetizationProvider';
import { DevToolsScenarioProvider } from '../mockProviders/DevToolsScenarioProvider';

describe('devtools mock providers (render smoke test)', () => {
  it('MockAuthProvider renders children and exposes the scenario auth fixture', () => {
    const scenario = SCENARIOS.loggedIn;
    let capturedValue: ReturnType<typeof buildMockAuthValue> | undefined;

    function Probe() {
      const ctx = React.useContext(MockAuthContext);
      capturedValue = ctx;
      return <Text>PROBE_CHILD</Text>;
    }

    const { getByText } = render(
      <MockAuthProvider scenario={scenario}>
        <Probe />
      </MockAuthProvider>
    );

    expect(getByText('PROBE_CHILD')).toBeTruthy();
    expect(capturedValue?.isAuthenticated).toBe(true);
    expect(capturedValue?.user?.uid).toBe(scenario.auth.user?.uid);
  });

  it('MockAuthProvider reflects loggedOut scenario as unauthenticated', () => {
    const scenario = SCENARIOS.loggedOut;
    const value = buildMockAuthValue(scenario);
    expect(value.isAuthenticated).toBe(false);
    expect(value.user).toBeNull();
  });

  it('MockAuthProvider mutating methods are no-ops and never throw', async () => {
    const value = buildMockAuthValue(SCENARIOS.default);
    await expect(value.signOut()).resolves.toBeUndefined();
    await expect(value.deleteAccount()).resolves.toBeUndefined();
    await expect(value.updateNotificationSettings({})).resolves.toBeUndefined();
  });

  it('MockMonetizationProvider renders children and exposes the scenario monetization fixture', () => {
    const scenario = SCENARIOS.premium;
    let capturedValue: ReturnType<typeof buildMockMonetizationValue> | undefined;

    function Probe() {
      const ctx = React.useContext(MockMonetizationContext);
      capturedValue = ctx;
      return <Text>PROBE_MONETIZATION</Text>;
    }

    const { getByText } = render(
      <MockMonetizationProvider scenario={scenario}>
        <Probe />
      </MockMonetizationProvider>
    );

    expect(getByText('PROBE_MONETIZATION')).toBeTruthy();
    expect(capturedValue?.isAdFree).toBe(true);
  });

  it('MockMonetizationProvider mutating methods are no-ops and never throw', async () => {
    const value = buildMockMonetizationValue(SCENARIOS.freeWithAds);
    await expect(value.restorePurchases()).resolves.toBeUndefined();
    await expect(value.presentPaywall()).resolves.toBeUndefined();
  });

  it('DevToolsScenarioProvider composes both providers and renders children', () => {
    const { getByText } = render(
      <DevToolsScenarioProvider scenario={SCENARIOS.setupIncomplete}>
        <Text>COMPOSED_CHILD</Text>
      </DevToolsScenarioProvider>
    );

    expect(getByText('COMPOSED_CHILD')).toBeTruthy();
  });
});
