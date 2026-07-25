import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, PanResponder } from 'react-native';
import { getTutorialSwipeNextStep } from '../../domain/rules';

interface SwipeGestureOptions {
  viewportWidth: number;
  reducedMotion: boolean;
  tutorialVisibleRef: React.MutableRefObject<boolean>;
  tutorialStepRef: React.MutableRefObject<number>;
  tutorialVisible: boolean;
  tutorialStep: number;
  setTutorialStep(step: number): void;
  onSwipe(direction: 'left' | 'right'): void | Promise<void>;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const {
    viewportWidth,
    reducedMotion,
    tutorialVisibleRef,
    tutorialStepRef,
    tutorialVisible,
    tutorialStep,
    setTutorialStep,
    onSwipe,
  } = options;
  const position = useRef(new Animated.ValueXY()).current;
  const tutorialAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const swipeRef = useRef<(direction: 'left' | 'right') => void>(() => undefined);
  const resetRef = useRef<() => void>(() => undefined);
  const viewportWidthRef = useRef(viewportWidth);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    viewportWidthRef.current = viewportWidth;
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion, viewportWidth]);

  const reset = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: reducedMotionRef.current ? 100 : 5,
      useNativeDriver: false,
    }).start();
  }, [position]);

  const swipe = useCallback(
    (direction: 'left' | 'right') => {
      const tutorialNext = tutorialVisibleRef.current
        ? getTutorialSwipeNextStep(tutorialStepRef.current, direction)
        : null;
      const destination =
        direction === 'right' ? viewportWidthRef.current * 1.5 : -viewportWidthRef.current * 1.5;
      Animated.timing(position, {
        toValue: { x: destination, y: 0 },
        duration: reducedMotionRef.current ? 0 : 300,
        useNativeDriver: false,
      }).start(() => {
        requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
        if (tutorialNext !== null) {
          setTutorialStep(tutorialNext);
          return;
        }
        void onSwipe(direction);
      });
    },
    [onSwipe, position, setTutorialStep, tutorialStepRef, tutorialVisibleRef],
  );

  useEffect(() => {
    swipeRef.current = swipe;
    resetRef.current = reset;
  }, [reset, swipe]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (tutorialVisibleRef.current && tutorialStepRef.current > 2) return false;
        return Math.abs(gesture.dx) > 15 || Math.abs(gesture.dy) > 15;
      },
      onPanResponderGrant: () => tutorialAnimationRef.current?.stop(),
      onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 }),
      onPanResponderRelease: (_, gesture) => {
        const threshold = viewportWidthRef.current * 0.25;
        if (tutorialVisibleRef.current) {
          if (tutorialStepRef.current === 1 && gesture.dx <= threshold) return resetRef.current();
          if (tutorialStepRef.current === 2 && gesture.dx >= -threshold) return resetRef.current();
          if (tutorialStepRef.current > 2) return resetRef.current();
        }
        if (gesture.dx > threshold) swipeRef.current('right');
        else if (gesture.dx < -threshold) swipeRef.current('left');
        else resetRef.current();
      },
    }),
  ).current;

  useEffect(() => {
    tutorialAnimationRef.current?.stop();
    position.stopAnimation();
    if (!tutorialVisible || tutorialStep > 2 || reducedMotion) {
      reset();
      return;
    }

    // Always restart from the card's resting position when the lesson changes. Without this,
    // stopping the step-one loop can leave its presentation value in-flight and make the
    // step-two left nudge appear static on some devices.
    position.setValue({ x: 0, y: 0 });
    const distance = Math.min(48, Math.max(30, viewportWidth * 0.09));
    const x = tutorialStep === 1 ? distance : -distance;
    tutorialAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(reducedMotion ? 0 : 180),
        Animated.timing(position, {
          toValue: { x, y: 0 },
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(position, {
          toValue: { x: 0, y: 0 },
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.delay(reducedMotion ? 0 : 180),
      ]),
      { resetBeforeIteration: true },
    );
    tutorialAnimationRef.current.start();
    return () => tutorialAnimationRef.current?.stop();
  }, [position, reducedMotion, reset, tutorialStep, tutorialVisible, viewportWidth]);

  const rotate = useMemo(
    () =>
      position.x.interpolate({
        inputRange: [-viewportWidth / 2, 0, viewportWidth / 2],
        outputRange: ['-15deg', '0deg', '15deg'],
        extrapolate: 'clamp',
      }),
    [position.x, viewportWidth],
  );

  return { position, rotate, panHandlers: panResponder.panHandlers, swipe };
}
