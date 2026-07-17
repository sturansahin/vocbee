// src/app/App.tsx
// Thin composition root produced in Phase 2 (docs/refactor-v2/22) by decomposing the original
// root App.tsx into bootstrap + providers + navigation + lifecycle. Behavior is identical:
//  - module-level side effects run at the same time (configureNotifications + preventAutoHideAsync)
//  - font/splash gate (useAppBootstrap) renders null until fonts are ready
//  - provider chain order preserved (AppProviders)
//  - splash gate -> connection-error gate -> RootNavigator render preserved (AppContent)

import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { notificationFacade } from '@features/notifications';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';
import { useAppLifecycle } from './lifecycle/useAppLifecycle';
import { useAppBootstrap } from './bootstrap/useAppBootstrap';
import { ConnectionErrorScreen, SplashScreen as CustomSplashScreen } from './presentation';

// Keep the entire devtools graph behind Metro's compile-time __DEV__ guard so production bundles
// can eliminate the require and all developer-only screens/fixtures.
const DevToolsRoot: React.ComponentType = __DEV__
  ? require('../devtools').DevToolsRoot
  : () => null;

// Configure notifications globally (module load — same timing as the original App.tsx)
notificationFacade.configure();

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// AppContent renders inside the provider tree so it can read auth/monetization/theme via useAppLifecycle.
function AppContent() {
  const {
    isAppReady,
    initialRoute,
    showSplash,
    setShowSplash,
    connectionError,
    userData,
    navigationRef,
  } = useAppLifecycle();

  if (showSplash || !isAppReady) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show connection error screen ONLY if there's a connection problem AND no cached user data
  // If we have cached data, show OfflineNotice banner instead (allows offline usage)
  if (connectionError && !userData) {
    return <ConnectionErrorScreen />;
  }

  return <RootNavigator initialRoute={initialRoute} navigationRef={navigationRef} />;
}

export default function App() {
  // Wait for both custom fonts and icon fonts to load (same gate as the original App.tsx)
  const fontsReady = useAppBootstrap();

  if (!fontsReady) {
    return null;
  }

  return (
    <AppProviders>
      <AppContent />
      <DevToolsRoot />
    </AppProviders>
  );
}
