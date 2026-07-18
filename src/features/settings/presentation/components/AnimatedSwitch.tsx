import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { COLORS } from '@shared/theme';

interface AnimatedSwitchProps {
  value: boolean;
  onToggle: () => void;
  variant?: 'default' | 'theme';
}

export function AnimatedSwitch({ value, onToggle, variant = 'default' }: AnimatedSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;
  const backgroundProgress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? 22 : 2,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.timing(backgroundProgress, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [backgroundProgress, translateX, value]);

  const activeColor = variant === 'theme' ? '#1a1a1a' : COLORS.primary;
  const backgroundColor = backgroundProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', activeColor],
  });

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View
        style={[
          styles.track,
          { backgroundColor },
          !value && styles.inactiveTrack,
          value && variant === 'theme' && styles.activeThemeTrack,
        ]}
      >
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]}>
          {variant === 'theme' && (
            <MaterialIcons
              name={value ? 'nightlight-round' : 'wb-sunny'}
              size={16}
              color={value ? '#FFD700' : '#FFA500'}
            />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  inactiveTrack: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  activeThemeTrack: {
    borderWidth: 1,
    borderColor: '#444444',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
