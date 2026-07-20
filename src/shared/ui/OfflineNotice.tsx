import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '@shared/responsive';
import { useTheme } from '@shared/theme';

export const OfflineNotice = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { colors, shadows } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  // Use useRef for Animated.Value to avoid re-creation on re-render
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkConnection = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected !== false);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isConnected ? 0 : 1,
      duration: reducedMotion ? 0 : 300,
      useNativeDriver: true,
    }).start();
  }, [animation, isConnected, reducedMotion]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="auto"
      accessibilityLabel={t('offline.message')}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      accessibilityElementsHidden={false}
      importantForAccessibility="auto"
      style={[
        styles.container,
        {
          top: insets.top,
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.danger,
          ...shadows.floating,
        },
      ]}
    >
      <MaterialIcons name="wifi-off" size={20} color={colors.onDanger} />
      <Text style={[styles.text, { color: colors.onDanger }]}>{t('offline.message')}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
