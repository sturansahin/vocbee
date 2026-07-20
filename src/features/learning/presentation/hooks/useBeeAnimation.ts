import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import type { HomeBeePosition } from '@features/home';

export function useBeeAnimation(
  active: boolean,
  viewportWidth: number,
  reducedMotion: boolean,
  wordId?: number,
) {
  const [beePositions, setBeePositions] = useState<HomeBeePosition[]>([]);
  const [beesAnimating, setBeesAnimating] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateIn = useCallback(
    (bee: HomeBeePosition) => {
      setBeesAnimating(true);
      if (reducedMotion) {
        bee.translateX.setValue(0);
        bee.translateY.setValue(0);
        bee.opacity.setValue(1);
        bee.rotation.setValue(0);
        bee.scale.setValue(1);
        setBeesAnimating(false);
        return;
      }
      bee.translateX.setValue(-viewportWidth);
      bee.translateY.setValue(-50);
      bee.opacity.setValue(1);
      bee.rotation.setValue(-20);
      bee.scale.setValue(0.7);
      const animation = Animated.sequence([
        Animated.parallel([
          Animated.timing(bee.translateX, {
            toValue: -20,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(bee.translateY, {
            toValue: -20,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(bee.rotation, {
            toValue: 10,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.spring(bee.scale, {
            toValue: 1,
            tension: 30,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(bee.translateX, {
            toValue: 0,
            tension: 15,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bee.translateY, {
            toValue: 0,
            tension: 15,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bee.rotation, {
            toValue: 0,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animationRef.current?.stop();
      animationRef.current = animation;
      animation.start(() => setBeesAnimating(false));
    },
    [reducedMotion, viewportWidth],
  );

  useEffect(() => {
    if (!active || wordId === undefined) return;
    const bee: HomeBeePosition = {
      id: 0,
      x: Math.max(0, viewportWidth - 100),
      y: 10,
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    };
    setBeePositions([bee]);
    timeoutRef.current = setTimeout(() => animateIn(bee), reducedMotion ? 0 : 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [active, animateIn, reducedMotion, viewportWidth, wordId]);

  const animateAway = useCallback(() => {
    const bee = beePositions[0];
    if (!bee) return;
    if (reducedMotion) {
      bee.opacity.setValue(0);
      setBeesAnimating(false);
      return;
    }
    setBeesAnimating(true);
    const animation = Animated.parallel([
      Animated.timing(bee.translateY, { toValue: -500, duration: 600, useNativeDriver: true }),
      Animated.timing(bee.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(bee.rotation, { toValue: 60, duration: 600, useNativeDriver: true }),
      Animated.timing(bee.scale, { toValue: 0.3, duration: 600, useNativeDriver: true }),
    ]);
    animationRef.current?.stop();
    animationRef.current = animation;
    animation.start(() => setBeesAnimating(false));
  }, [beePositions, reducedMotion]);

  useEffect(() => () => animationRef.current?.stop(), []);

  return { beePositions, beesAnimating, animateAway };
}
