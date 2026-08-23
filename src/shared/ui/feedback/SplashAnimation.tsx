import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewProps } from 'react-native';
import LottieView from 'lottie-react-native';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { createSwarmAnimation } from '../../../../assets/animations/swarmAnimation';

const BEE_COLOR: [number, number, number, number] = [1, 0.78, 0.08, 1];

export interface SplashAnimationProps extends Omit<ViewProps, 'children'> {
  onRevealComplete?: () => void;
}

export function SplashAnimation({ onRevealComplete, style, ...viewProps }: SplashAnimationProps) {
  const { colors } = useTheme();
  const { isSmallHeight, sizeClass } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const lottieRef = useRef<LottieView>(null);
  const didReveal = useRef(false);
  const logoOpacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const logoScale = useRef(new Animated.Value(reducedMotion ? 1 : 0.96)).current;

  const logoSize = isSmallHeight ? 160 : sizeClass === 'wide' ? 200 : 184;
  const animation = useMemo(() => createSwarmAnimation(BEE_COLOR, reducedMotion), [reducedMotion]);

  useEffect(() => {
    lottieRef.current?.play();

    const completeReveal = () => {
      if (didReveal.current) return;
      didReveal.current = true;
      onRevealComplete?.();
    };

    if (reducedMotion) {
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      completeReveal();
      return;
    }

    const reveal = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 18,
        stiffness: 170,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]);

    reveal.start(({ finished }) => {
      if (finished) completeReveal();
    });

    return () => reveal.stop();
  }, [logoOpacity, logoScale, onRevealComplete, reducedMotion]);

  return (
    <View {...viewProps} style={[styles.container, { backgroundColor: colors.background }, style]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: logoSize,
            height: logoSize,
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <LottieView
          ref={lottieRef}
          source={animation}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
          loop={!reducedMotion}
          speed={1.1}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
