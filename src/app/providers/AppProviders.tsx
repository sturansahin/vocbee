// src/app/providers/AppProviders.tsx
// Extracted VERBATIM from App.tsx's provider chain in Phase 2 (docs/architecture.md).
// Provider order is a BINDING behavior contract (docs/architecture.md) — DO NOT reorder:
//   SafeAreaProvider > ThemeProvider > AlertProvider > AuthProvider > MonetizationProvider
//   > ErrorBoundary > GestureHandlerRootView > (OfflineNotice + children)

import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@features/auth';
import { MonetizationProvider } from '@features/monetization';
import { ThemeProvider } from '@shared/theme';
import { AlertProvider, ErrorBoundary, OfflineNotice } from '@shared/ui';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <MonetizationProvider>
              <ErrorBoundary>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <OfflineNotice />
                  {children}
                </GestureHandlerRootView>
              </ErrorBoundary>
            </MonetizationProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default AppProviders;
