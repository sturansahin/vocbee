import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, PanResponder } from 'react-native';
import { getTutorialSwipeNextStep } from '../../domain/rules';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeGestureOptions {
  tutorialVisibleRef: React.MutableRefObject<boolean>;
  tutorialStepRef: React.MutableRefObject<number>;
  tutorialVisible: boolean;
  tutorialStep: number;
  setTutorialStep(step: number): void;
  onSwipe(direction: 'left' | 'right'): void | Promise<void>;
}

export function useSwipeGesture(options: SwipeGestureOptions) {
  const { tutorialVisibleRef, tutorialStepRef, tutorialVisible, tutorialStep, setTutorialStep, onSwipe } = options;
  const position = useRef(new Animated.ValueXY()).current;
  const tutorialAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const swipeRef = useRef<(direction: 'left' | 'right') => void>(() => undefined);
  const resetRef = useRef<() => void>(() => undefined);

  const reset = useCallback(() => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
  }, [position]);

  const swipe = useCallback((direction: 'left' | 'right') => {
    const tutorialNext = tutorialVisibleRef.current
      ? getTutorialSwipeNextStep(tutorialStepRef.current, direction)
      : null;
    const destination = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, { toValue: { x: destination, y: 0 }, duration: 300, useNativeDriver: false })
      .start(() => {
        requestAnimationFrame(() => position.setValue({ x: 0, y: 0 }));
        if (tutorialNext !== null) {
          setTutorialStep(tutorialNext);
          return;
        }
        void onSwipe(direction);
      });
  }, [onSwipe, position, setTutorialStep, tutorialStepRef, tutorialVisibleRef]);

  useEffect(() => { swipeRef.current = swipe; resetRef.current = reset; }, [reset, swipe]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (tutorialVisibleRef.current && tutorialStepRef.current > 2) return false;
      return Math.abs(gesture.dx) > 15 || Math.abs(gesture.dy) > 15;
    },
    onPanResponderGrant: () => tutorialAnimationRef.current?.stop(),
    onPanResponderMove: (_, gesture) => position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 }),
    onPanResponderRelease: (_, gesture) => {
      if (tutorialVisibleRef.current) {
        if (tutorialStepRef.current === 1 && gesture.dx <= SWIPE_THRESHOLD) return resetRef.current();
        if (tutorialStepRef.current === 2 && gesture.dx >= -SWIPE_THRESHOLD) return resetRef.current();
        if (tutorialStepRef.current > 2) return resetRef.current();
      }
      if (gesture.dx > SWIPE_THRESHOLD) swipeRef.current('right');
      else if (gesture.dx < -SWIPE_THRESHOLD) swipeRef.current('left');
      else resetRef.current();
    },
  })).current;

  useEffect(() => {
    tutorialAnimationRef.current?.stop();
    if (!tutorialVisible || tutorialStep > 2) {
      reset();
      return;
    }
    const x = tutorialStep === 1 ? 30 : -30;
    tutorialAnimationRef.current = Animated.loop(Animated.sequence([
      Animated.timing(position, { toValue: { x, y: 0 }, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(position, { toValue: { x: 0, y: 0 }, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    tutorialAnimationRef.current.start();
    return () => tutorialAnimationRef.current?.stop();
  }, [position, reset, tutorialStep, tutorialVisible]);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  return { position, rotate, panHandlers: panResponder.panHandlers, swipe };
}
