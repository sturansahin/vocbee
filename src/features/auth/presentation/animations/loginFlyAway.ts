import { Animated, Easing } from 'react-native';

interface LoginAnimationValues {
  translateX: Animated.Value;
  translateY: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
}

const timing = (
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (value: number) => number,
) =>
  Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });

export function createLoginFlyAwayAnimation(
  values: LoginAnimationValues,
  screenHeight: number,
): Animated.CompositeAnimation {
  const smooth = Easing.bezier(0.42, 0, 0.58, 1);
  const exit = Easing.bezier(0.33, 0, 0.2, 1);
  return Animated.sequence([
    Animated.delay(100),
    Animated.parallel([
      timing(values.translateX, -15, 300, Easing.bezier(0.25, 0.1, 0.25, 1)),
      timing(values.translateY, -10, 300, Easing.bezier(0.25, 0.1, 0.25, 1)),
      timing(values.rotation, -15, 300, Easing.bezier(0.25, 0.1, 0.25, 1)),
    ]),
    Animated.parallel([
      timing(values.translateX, 25, 400, smooth),
      timing(values.translateY, -25, 400, smooth),
      timing(values.rotation, 10, 400, smooth),
    ]),
    Animated.parallel([
      timing(values.translateX, -10, 350, smooth),
      timing(values.translateY, -15, 350, smooth),
      timing(values.rotation, -20, 350, smooth),
    ]),
    Animated.parallel([
      timing(values.translateX, 15, 380, smooth),
      timing(values.translateY, -30, 380, smooth),
      timing(values.rotation, 8, 380, smooth),
    ]),
    Animated.parallel([
      timing(values.translateX, 0, 300, smooth),
      timing(values.translateY, -40, 300, smooth),
      timing(values.rotation, -5, 300, smooth),
    ]),
    Animated.parallel([
      timing(values.translateY, -screenHeight * 1.2, 800, exit),
      timing(values.translateX, -30, 800, exit),
      timing(values.rotation, -15, 800, exit),
      timing(values.scale, 0.4, 800, exit),
      timing(values.opacity, 0, 600, exit),
    ]),
  ]);
}
