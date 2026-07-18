import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

interface AnimatedCountUpProps {
  value: number;
  delay?: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatter?: (value: number) => string;
  testID?: string;
}

export function AnimatedCountUp({
  value,
  delay = 0,
  duration,
  style,
  formatter,
  testID,
}: AnimatedCountUpProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const normalizedValue = Math.max(0, Math.round(value));
    const animationDuration = duration ?? Math.min(1100, Math.max(550, normalizedValue * 65));

    setDisplayValue(0);
    progress.stopAnimation();
    progress.setValue(0);

    const listenerId = progress.addListener(({ value: animatedValue }) => {
      setDisplayValue(Math.round(animatedValue * normalizedValue));
    });

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: animationDuration,
      delay,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        setDisplayValue(normalizedValue);
      }
    });

    return () => {
      progress.removeListener(listenerId);
      progress.stopAnimation();
    };
  }, [delay, duration, progress, value]);

  const renderedValue = formatter ? formatter(displayValue) : String(displayValue);

  return (
    <Text testID={testID} style={style}>
      {renderedValue}
    </Text>
  );
}
