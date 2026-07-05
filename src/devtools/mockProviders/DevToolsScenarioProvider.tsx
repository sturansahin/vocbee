// src/devtools/mockProviders/DevToolsScenarioProvider.tsx
// Composes MockAuthProvider + MockMonetizationProvider for a given scenario. This is the single
// entry point panels use to preview a scenario without touching real Firebase/RevenueCat/AdMob.

import React, { ReactNode } from 'react';
import type { DevToolsScenario } from '../scenarios';
import { MockAuthProvider } from './MockAuthProvider';
import { MockMonetizationProvider } from './MockMonetizationProvider';

export function DevToolsScenarioProvider({
  scenario,
  children,
}: {
  scenario: DevToolsScenario;
  children: ReactNode;
}) {
  return (
    <MockAuthProvider scenario={scenario}>
      <MockMonetizationProvider scenario={scenario}>{children}</MockMonetizationProvider>
    </MockAuthProvider>
  );
}
