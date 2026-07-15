// src/app/lifecycle/useAppLifecycle.ts
// Extracted VERBATIM from App.tsx's AppContent (everything except the render) in Phase 2
// (docs/refactor-v2/22). The refs, state, callbacks and the 8 effects are copied with the
// SAME ORDER, SAME dependency arrays and SAME bodies — trigger order/conditions are a binding
// behavior contract (docs/refactor-v2/03 §1, /22 §9). No logic changes.
//
// navigationTheme + StatusBar (which also used useTheme) moved to RootNavigator; this hook no
// longer needs useTheme. All other behavior is identical.

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../../types';
import { useAuth } from '@features/auth';
import { useMonetization } from '@features/monetization';
import { recordReviewAppLaunch } from '@features/review';
import { autoSync } from '@features/sync';
import { notificationFacade, type NotificationResponsePayload } from '@features/notifications';
import { STORAGE_KEYS } from '@shared/storage';
import {
  initializeAdMob,
  checkAndShowAppOpenAd,
  refreshAdInventoryOnForeground,
} from '../../../services/adMobService';

export function useAppLifecycle() {
  const { user, userData, isLoading, connectionError, notificationSettings } = useAuth();
  const { isAdFree, isLoading: isMonetizationLoading } = useMonetization();
  const appState = useRef(AppState.currentState);
  const notificationMaintenanceInFlight = useRef(false);
  const notificationPermissionGateInFlight = useRef(false);
  const handledNotificationResponses = useRef<Set<string>>(new Set());
  const checkedNotificationPermissionUsers = useRef<Set<string>>(new Set());
  const reviewLaunchRecordedUsers = useRef<Set<string>>(new Set());
  const adStartupUserId = useRef<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');
  const [showSplash, setShowSplash] = useState(true);
  const hasCompletedSetup = (userData as any)?.setupCompleted === true ||
    !!(userData?.preferences?.nativeLanguage && userData?.preferences?.targetLanguage);

  const consumeNotificationResponse = useCallback(
    async (
      response: NotificationResponsePayload | null,
      source: 'startup' | 'listener' | 'resume'
    ) => {
      if (!response) return;

      const notificationId = response.notification.request.identifier;
      const actionIdentifier = response.actionIdentifier || 'default';
      const responseKey = `${notificationId}:${actionIdentifier}`;

      if (handledNotificationResponses.current.has(responseKey)) {
        console.log(`[Notifications] Response ${responseKey} skipped (${source}) - already handled`);
        return;
      }

      handledNotificationResponses.current.add(responseKey);
      // Keep dedupe storage bounded.
      if (handledNotificationResponses.current.size > 50) {
        const firstEntry = handledNotificationResponses.current.values().next();
        if (!firstEntry.done) {
          handledNotificationResponses.current.delete(firstEntry.value);
        }
      }

      try {
        await notificationFacade.handleResponse(response);
        try {
          await notificationFacade.clearLastResponse();
        } catch (clearError) {
          console.warn(`[Notifications] Failed to clear last response (${source})`, clearError);
        }
      } catch (error) {
        handledNotificationResponses.current.delete(responseKey);
        console.error(`[Notifications] Failed to handle response (${source})`, error);
      }
    },
    []
  );

  const runNotificationMaintenance = useCallback(async (reason: 'startup' | 'resume') => {
    if (!user) return;

    if (notificationMaintenanceInFlight.current) {
      console.log(`[Notifications] Maintenance skipped (${reason}) - already running`);
      return;
    }

    notificationMaintenanceInFlight.current = true;
    console.log(`[Notifications] Maintenance started (${reason})`);

    try {
      try {
        await notificationFacade.processDelivered();
      } catch (error) {
        console.error(`[Notifications] processDeliveredNotifications failed (${reason})`, error);
      }

      // Record foreground baseline after processing delivered notifications so
      // next cycle can correctly identify "arrived while app was open" events.
      try {
        await notificationFacade.setForegroundTime();
      } catch (error) {
        console.error(`[Notifications] setLastForegroundTime failed (${reason})`, error);
      }

      try {
        await notificationFacade.refill();
      } catch (error) {
        console.error(`[Notifications] refillNotifications failed (${reason})`, error);
      }
    } finally {
      notificationMaintenanceInFlight.current = false;
      console.log(`[Notifications] Maintenance finished (${reason})`);
    }
  }, [user]);

  const ensureAuthenticatedUserNotificationPermission = useCallback(async () => {
    if (!user || !hasCompletedSetup) return;
    if (appState.current !== 'active') return;

    if (notificationPermissionGateInFlight.current) {
      console.log('[Notifications] Permission gate skipped - already running');
      return;
    }

    if (checkedNotificationPermissionUsers.current.has(user.uid)) {
      return;
    }

    notificationPermissionGateInFlight.current = true;

    try {
      const alreadyPromptedOnThisInstall = await notificationFacade.hasSeenPermissionPrompt(user.uid);
      const permissionState = await notificationFacade.getPermissionState();

      if (permissionState.granted) {
        checkedNotificationPermissionUsers.current.add(user.uid);
        return;
      }

      if (!permissionState.canAskAgain || permissionState.status !== 'undetermined') {
        if (!alreadyPromptedOnThisInstall) {
          await notificationFacade.markPermissionPromptSeen(user.uid);
        }
        checkedNotificationPermissionUsers.current.add(user.uid);
        console.log('[Notifications] Permission gate completed - system prompt unavailable');
        return;
      }

      if (alreadyPromptedOnThisInstall) {
        checkedNotificationPermissionUsers.current.add(user.uid);
        console.log('[Notifications] Permission gate skipped - already prompted on this install');
        return;
      }

      const granted = await notificationFacade.requestPermission();
      await notificationFacade.markPermissionPromptSeen(user.uid);
      checkedNotificationPermissionUsers.current.add(user.uid);

      if (granted && notificationSettings.enabled) {
        await notificationFacade.reschedule();
      }
    } catch (error) {
      console.error('[Notifications] Auth permission gate failed', error);
    } finally {
      notificationPermissionGateInFlight.current = false;
    }
  }, [user, hasCompletedSetup, notificationSettings.enabled]);

  // Determine initial route based on app state
  useEffect(() => {
    const determineInitialRoute = async () => {
      try {
        console.log('[App] Determining initial route...');
        // Check if user has seen onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
        console.log('[App] Has seen onboarding:', hasSeenOnboarding);

        // Wait for auth to finish loading
        if (isLoading) {
          console.log('[App] Auth still loading, waiting...');
          return;
        }
        console.log('[App] Auth loaded. User:', user ? 'logged in' : 'not logged in');
        console.log('[App] userData:', userData ? JSON.stringify({ setupCompleted: userData.setupCompleted, prefs: userData.preferences }) : 'null');

        let route: keyof RootStackParamList = 'Onboarding';

        if (!hasSeenOnboarding) {
          // First time user - show onboarding
          route = 'Onboarding';
        } else if (user) {
          // User is logged in
          // Check if setup is completed by verifying setupCompleted flag OR complete preferences
          const hasCompletedSetup = (userData as any)?.setupCompleted === true ||
            (userData?.preferences?.nativeLanguage && userData?.preferences?.targetLanguage);

          if (hasCompletedSetup) {
            // Setup completed - go to home
            route = 'MainTabs';
          } else {
            // Logged in but setup not completed
            route = 'NativeLanguage';
          }
        } else {
          // Has seen onboarding but not logged in
          route = 'Login';
        }

        console.log('[App] Setting initial route to:', route);
        setInitialRoute(route);
        console.log('[App] App is ready!');
        setIsAppReady(true);
      } catch (error) {
        console.error('Error determining initial route:', error);
        // Default to onboarding on error
        setInitialRoute('Onboarding');
        setIsAppReady(true);
      }
    };

    determineInitialRoute();
  }, [user, userData, isLoading]);

  // Auto-sync setup - run immediately when user is available
  useEffect(() => {
    if (!user) return;

    // Run auto sync immediately
    autoSync(user.uid);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (!hasCompletedSetup) return;
    if (reviewLaunchRecordedUsers.current.has(user.uid)) return;

    reviewLaunchRecordedUsers.current.add(user.uid);
    recordReviewAppLaunch().catch(error => {
      console.error('[ReviewPrompt] Failed to record app launch', error);
    });
  }, [user, isLoading, hasCompletedSetup]);

  // Run notification maintenance on cold start / login while app is active.
  // Without this, delivered notifications are only processed after a future
  // background->foreground transition.
  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (!hasCompletedSetup) return;
    if (appState.current !== 'active') return;
    runNotificationMaintenance('startup');
  }, [user, isLoading, hasCompletedSetup, runNotificationMaintenance]);

  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (!hasCompletedSetup) return;

    ensureAuthenticatedUserNotificationPermission();
  }, [user, isLoading, hasCompletedSetup, ensureAuthenticatedUserNotificationPermission]);

  useEffect(() => {
    if (!user) return;
    if (isLoading) return;
    if (!hasCompletedSetup) return;
    if (isMonetizationLoading) return;
    if (isAdFree) return;
    if (adStartupUserId.current === user.uid) return;

    adStartupUserId.current = user.uid;

    initializeAdMob()
      .then(async ready => {
        if (!ready) {
          return;
        }

        await refreshAdInventoryOnForeground(false);
        await checkAndShowAppOpenAd();
      })
      .catch(err => console.error('[App] AdMob init chain error:', err));
  }, [user, isLoading, hasCompletedSetup, isMonetizationLoading, isAdFree]);

  // Handle notification response from cold start (app opened by tapping a notification)
  useEffect(() => {
    let cancelled = false;

    const processStartupResponse = async () => {
      const retryDelaysMs = [0, 300, 1000];

      for (const delayMs of retryDelaysMs) {
        if (cancelled) return;

        if (delayMs > 0) {
          await new Promise<void>(resolve => setTimeout(() => resolve(), delayMs));
        }

        try {
          const lastResponse = await notificationFacade.getLastResponse();
          if (lastResponse) {
            await consumeNotificationResponse(lastResponse, 'startup');
            return;
          }
        } catch (error) {
          console.error('[Notifications] Failed to process startup response', error);
        }
      }
    };

    processStartupResponse();

    return () => {
      cancelled = true;
    };
  }, [consumeNotificationResponse]);

  // Handle live notification responses while app is running
  useEffect(() => {
    const subscription = notificationFacade.addResponseListener((response) => {
      consumeNotificationResponse(response, 'listener').catch(error => {
        console.error('[Notifications] Listener response handling failed', error);
      });
    });

    return () => subscription.remove();
  }, [consumeNotificationResponse]);

  // Handle app state changes for background sync and notification refill
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        notificationFacade.setBackgroundTime();
      }
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        notificationFacade.getLastResponse()
          .then(lastResponse => consumeNotificationResponse(lastResponse, 'resume'))
          .catch(error => {
            console.error('[Notifications] Resume response handling failed', error);
          });

        // App has come to foreground - trigger sync if user is logged in
        if (user && hasCompletedSetup) {
          autoSync(user.uid);
          runNotificationMaintenance('resume');
        }

        if (user && hasCompletedSetup && !isMonetizationLoading && !isAdFree) {
          refreshAdInventoryOnForeground().catch(error => {
            console.error('[AdMob] Foreground refresh failed', error);
          });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [
    user,
    hasCompletedSetup,
    runNotificationMaintenance,
    consumeNotificationResponse,
    isMonetizationLoading,
    isAdFree,
  ]);

  return {
    isAppReady,
    initialRoute,
    showSplash,
    setShowSplash,
    connectionError,
    userData,
    navigationRef,
  };
}
