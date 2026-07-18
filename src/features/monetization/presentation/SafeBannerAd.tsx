import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View, Text, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import {
  areAdsSupported,
  ensureAdMobReady,
  getBannerAdComponent,
  getBannerAdSize,
  getDefaultAdRequestOptions,
} from '../composition/adMobService';

const MAX_BANNER_RETRIES = 3;
const BANNER_RETRY_DELAY_MS = 3000;
const BANNER_STALE_AFTER_MS = 180000;
const BANNER_WATCHDOG_INTERVAL_MS = 30000;

interface SafeBannerAdProps {
  unitId: string;
  size?: any;
  requestOptions?: any;
}

export const SafeBannerAd: React.FC<SafeBannerAdProps> = ({ unitId, size, requestOptions }) => {
  const isFocused = useIsFocused();
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(!areAdsSupported());
  const [reloadKey, setReloadKey] = useState(0);
  const appState = useRef(AppState.currentState);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const hasLoadedAtLeastOnceRef = useRef(false);
  const lastBannerLoadAtRef = useRef<number>(Date.now());
  const lastBannerReloadAtRef = useRef<number>(Date.now());

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const clearWatchdogInterval = useCallback(() => {
    if (watchdogIntervalRef.current) {
      clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }
  }, []);

  const triggerBannerReload = useCallback(
    (reason: string, resetRetryCount: boolean = false) => {
      if (!areAdsSupported()) {
        setIsReady(false);
        setHasError(false);
        return;
      }

      if (resetRetryCount) {
        retryCountRef.current = 0;
      }

      clearRetryTimeout();
      lastBannerReloadAtRef.current = Date.now();
      setHasError(false);
      setReloadKey((prev) => prev + 1);
      console.log(`[AdMob] Banner reload requested (${reason})`);
    },
    [clearRetryTimeout],
  );

  const scheduleRetry = useCallback(
    (reason: string) => {
      if (retryCountRef.current >= MAX_BANNER_RETRIES) {
        console.log(`[AdMob] Banner retry limit reached (${reason})`);
        return;
      }

      retryCountRef.current += 1;
      const delayMs = BANNER_RETRY_DELAY_MS * retryCountRef.current;
      clearRetryTimeout();
      retryTimeoutRef.current = setTimeout(() => {
        triggerBannerReload(`retry-${reason}`, false);
      }, delayMs);
    },
    [clearRetryTimeout, triggerBannerReload],
  );

  useEffect(() => {
    let isMounted = true;

    if (!areAdsSupported()) {
      setIsReady(false);
      return undefined;
    }

    ensureAdMobReady()
      .then((ready) => {
        if (!isMounted) {
          return;
        }

        setIsReady(ready);
        if (!ready) {
          scheduleRetry('sdk-not-ready');
          return;
        }

        clearRetryTimeout();
        retryCountRef.current = 0;
      })
      .catch((error) => {
        console.error('[AdMob] Banner init failed', error);
        if (isMounted) {
          setHasError(true);
          scheduleRetry('init-failed');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey, clearRetryTimeout, scheduleRetry]);

  useEffect(() => {
    if (!areAdsSupported() || !isFocused || appState.current !== 'active') {
      clearWatchdogInterval();
      return undefined;
    }

    watchdogIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastLoad = now - lastBannerLoadAtRef.current;
      const timeSinceLastReload = now - lastBannerReloadAtRef.current;

      // Inference from Google docs: AdMob custom banner refresh tops out at 150s,
      // so we only self-heal after that window plus buffer has passed.
      if (
        isReady &&
        !hasError &&
        timeSinceLastLoad >= BANNER_STALE_AFTER_MS &&
        timeSinceLastReload >= BANNER_STALE_AFTER_MS
      ) {
        triggerBannerReload('stale-watchdog', true);
      }
    }, BANNER_WATCHDOG_INTERVAL_MS);

    return () => {
      clearWatchdogInterval();
    };
  }, [clearWatchdogInterval, hasError, isFocused, isReady, triggerBannerReload]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        triggerBannerReload('app-active', true);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      clearRetryTimeout();
      clearWatchdogInterval();
    };
  }, [clearRetryTimeout, clearWatchdogInterval, triggerBannerReload]);

  const mergedRequestOptions = {
    ...getDefaultAdRequestOptions(),
    ...(requestOptions ?? {}),
  };

  if (!areAdsSupported()) {
    if (__DEV__) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.text}>AdMob Banner (Development Mode)</Text>
          <Text style={styles.subtext}>Native ads not available in Expo Go</Text>
        </View>
      );
    }

    return null;
  }

  if (!isReady || hasError) {
    if (__DEV__ && !hasError) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.text}>AdMob Banner is preparing</Text>
        </View>
      );
    }

    return null;
  }

  const BannerAd = getBannerAdComponent();
  const BannerAdSize = getBannerAdSize();

  if (!BannerAd) {
    return null;
  }

  return (
    <BannerAd
      key={`${unitId}:${reloadKey}`}
      unitId={unitId}
      size={size || BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={mergedRequestOptions}
      onAdLoaded={() => {
        clearRetryTimeout();
        retryCountRef.current = 0;
        hasLoadedAtLeastOnceRef.current = true;
        lastBannerLoadAtRef.current = Date.now();
        lastBannerReloadAtRef.current = Date.now();
        setHasError(false);
      }}
      onAdFailedToLoad={(error: any) => {
        console.log('[AdMob] Banner failed to load', error);
        if (!hasLoadedAtLeastOnceRef.current) {
          setHasError(true);
          scheduleRetry('initial-load-failed');
          return;
        }

        // After at least one successful render, prefer keeping the slot alive
        // and let AdMob-managed refresh / the watchdog recover the banner.
        scheduleRetry('post-load-failed');
      }}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    height: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  subtext: {
    fontSize: 10,
    color: '#888',
  },
});
