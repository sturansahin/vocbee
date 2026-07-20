import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import { useTheme } from '@shared/theme';
import { useStreakCelebrationAnimation } from '../hooks/useStreakCelebrationAnimation';
import { StreakCelebrationView } from './StreakCelebrationView';

interface StreakCelebrationOverlayProps {
  visible: boolean;
  celebrationKey: number;
  streakCount: number;
  streakLabel: string;
  message: string;
  onComplete: () => void;
}

export function StreakCelebrationOverlay({
  visible,
  celebrationKey,
  streakCount,
  streakLabel,
  message,
  onComplete,
}: StreakCelebrationOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, moderateScale } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const splitOffset = Math.min(moderateScale(86), width * 0.18);
  const animation = useStreakCelebrationAnimation({
    visible,
    celebrationKey,
    splitOffset,
    reducedMotion,
    onComplete,
  });

  if (!visible) return null;

  return (
    <StreakCelebrationView
      streakCount={streakCount}
      streakLabel={streakLabel}
      message={message}
      colors={colors}
      topInset={insets.top}
      bottomInset={insets.bottom}
      reducedMotion={reducedMotion}
      moderateScale={moderateScale}
      animation={animation}
    />
  );
}
