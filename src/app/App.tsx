// src/app/App.tsx
// Thin composition root produced in Phase 2 (docs/refactor-v2/22) by decomposing the original
// root App.tsx into bootstrap + providers + navigation + lifecycle. Behavior is identical:
//  - module-level side effects run at the same time (configureNotifications + preventAutoHideAsync)
//  - font/splash gate (useAppBootstrap) renders null until fonts are ready
//  - provider chain order preserved (AppProviders)
//  - splash gate -> connection-error gate -> RootNavigator render preserved (AppContent)

import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { configureNotifications } from '../../services/notificationService';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';
import { useAppLifecycle } from './lifecycle/useAppLifecycle';
import { useAppBootstrap } from './bootstrap/useAppBootstrap';
import CustomSplashScreen from '../../screens/SplashScreen';
import { ConnectionErrorScreen } from '../../components/ConnectionErrorScreen';
// ADIM 1 (Developer Test Panel, docs/refactor-v2 devtools task): DevToolsRoot renders `null` unless
// `isDevToolsEnabled` (src/devtools/guard.ts) is true, which itself is only ever true when
// `__DEV__` is true — it is a no-op in production builds. It is mounted as a sibling OVERLAY of
// <AppContent/>, not inside RootNavigator, so RootStackParamList/RootNavigator/SettingsScreen are
// completely untouched by this wiring.
import { DevToolsRoot } from '../devtools';

// Configure notifications globally (module load — same timing as the original App.tsx)
configureNotifications();

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

  // Show splash screen while app is not ready
  console.log('[App] Render - showSplash:', showSplash, 'isAppReady:', isAppReady, 'connectionError:', connectionError);
  if (showSplash || !isAppReady) {
    return <CustomSplashScreen onFinish={() => { console.log('[App] Splash finished'); setShowSplash(false); }} />;
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
