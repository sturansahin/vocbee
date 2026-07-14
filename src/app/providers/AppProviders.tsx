// src/app/providers/AppProviders.tsx
// Extracted VERBATIM from App.tsx's provider chain in Phase 2 (docs/refactor-v2/22).
// Provider order is a BINDING behavior contract (docs/refactor-v2/03 §1, /22 §9) — DO NOT reorder:
//   SafeAreaProvider > ThemeProvider > AlertProvider > AuthProvider > MonetizationProvider
//   > ErrorBoundary > GestureHandlerRootView > (OfflineNotice + children)

import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../../../context/ThemeContext';
import { AuthProvider } from '@features/auth';
import { MonetizationProvider } from '@features/monetization';
import { AlertProvider } from '../../../components/CustomAlert';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { OfflineNotice } from '../../../components/OfflineNotice';

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
