import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const CENTER_HOLD_DURATION = 920;
const SPLIT_HOLD_DURATION = 1580;
const REDUCED_MOTION_HOLD_DURATION = 1400;

export const STREAK_COUNT_UP_DELAY = 1360;

interface CelebrationAnimationOptions {
  visible: boolean;
  celebrationKey: number;
  splitOffset: number;
  reducedMotion: boolean;
  onComplete(): void;
}

export function useStreakCelebrationAnimation({
  visible,
  celebrationKey,
  splitOffset,
  reducedMotion,
  onComplete,
}: CelebrationAnimationOptions) {
  const lottieRef = useRef<any>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const values = useRef({
    backdropOpacity: new Animated.Value(0),
    emberScale: new Animated.Value(0.18),
    emberOpacity: new Animated.Value(0),
    fireOpacity: new Animated.Value(0),
    fireScale: new Animated.Value(0.4),
    fireTranslateX: new Animated.Value(0),
    countOpacity: new Animated.Value(0),
    countTranslateX: new Animated.Value(0),
    countTranslateY: new Animated.Value(22),
    messageOpacity: new Animated.Value(0),
    messageTranslateY: new Animated.Value(18),
  }).current;

  useEffect(() => {
    const completeOnce = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current();
    };

    animationRef.current?.stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!visible) {
      lottieRef.current?.reset?.();
      return;
    }

    completedRef.current = false;
    values.backdropOpacity.setValue(reducedMotion ? 1 : 0);
    values.emberScale.setValue(reducedMotion ? 1 : 0.18);
    values.emberOpacity.setValue(0);
    values.fireOpacity.setValue(reducedMotion ? 1 : 0);
    values.fireScale.setValue(reducedMotion ? 1 : 0.4);
    values.fireTranslateX.setValue(reducedMotion ? -splitOffset : 0);
    values.countOpacity.setValue(reducedMotion ? 1 : 0);
    values.countTranslateX.setValue(reducedMotion ? splitOffset : 0);
    values.countTranslateY.setValue(reducedMotion ? 0 : 22);
    values.messageOpacity.setValue(reducedMotion ? 1 : 0);
    values.messageTranslateY.setValue(reducedMotion ? 0 : 18);

    lottieRef.current?.reset?.();
    if (reducedMotion) {
      timeoutRef.current = setTimeout(completeOnce, REDUCED_MOTION_HOLD_DURATION);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    lottieRef.current?.play?.();
    animationRef.current = Animated.sequence([
      Animated.parallel([
        Animated.timing(values.backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(values.emberOpacity, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.spring(values.emberScale, {
              toValue: 1,
              speed: 16,
              bounciness: 7,
              useNativeDriver: true,
            }),
            Animated.timing(values.emberOpacity, {
              toValue: 0,
              duration: 170,
              delay: 35,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(values.fireOpacity, {
              toValue: 1,
              duration: 220,
              delay: 90,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(values.fireScale, {
              toValue: 1,
              speed: 14,
              bounciness: 8,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.delay(CENTER_HOLD_DURATION),
      Animated.parallel([
        Animated.spring(values.fireTranslateX, {
          toValue: -splitOffset,
          speed: 12,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.timing(values.countOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(values.countTranslateX, {
          toValue: splitOffset,
          speed: 12,
          bounciness: 6,
          useNativeDriver: true,
        }),
        Animated.spring(values.countTranslateY, {
          toValue: 0,
          speed: 13,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(90),
          Animated.parallel([
            Animated.timing(values.messageOpacity, {
              toValue: 1,
              duration: 240,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(values.messageTranslateY, {
              toValue: 0,
              speed: 13,
              bounciness: 5,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.delay(SPLIT_HOLD_DURATION),
      Animated.parallel([
        Animated.timing(values.backdropOpacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(values.fireOpacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(values.countOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(values.messageOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animationRef.current.start(({ finished }) => {
      if (finished) completeOnce();
    });

    return () => {
      animationRef.current?.stop();
    };
  }, [celebrationKey, reducedMotion, splitOffset, values, visible]);

  return { lottieRef, values };
}
