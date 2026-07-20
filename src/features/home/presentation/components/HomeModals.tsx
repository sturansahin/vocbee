// src/features/home/presentation/components/HomeModals.tsx
// Pure presentational composition of the two overlay/modal components rendered at the bottom of
// screens/HomeScreen.tsx (ADIM 2, UI-only extraction — docs/architecture.md): StreakCelebrationOverlay
// and AppRatingPrompt. VERBATIM props wiring — no new logic; all values/handlers are owned by
// HomeScreen and passed straight through unchanged.

import React from 'react';
import { AppRatingPrompt } from '@features/review';
import { StreakCelebrationOverlay } from '@features/streak';

export interface HomeModalsProps {
  streakCelebrationVisible: boolean;
  streakCelebrationKey: number;
  streakCelebrationCount: number;
  streakCelebrationLabel: string;
  streakCelebrationMessage: string;
  onStreakCelebrationComplete: () => void;

  reviewPromptVisible: boolean;
  onReviewPromptDismiss: () => void | Promise<void>;
  onReviewRateInStore: (rating: number) => void | Promise<void>;
  onReviewSendFeedback: (rating?: number) => void | Promise<void>;
}

export function HomeModals({
  streakCelebrationVisible,
  streakCelebrationKey,
  streakCelebrationCount,
  streakCelebrationLabel,
  streakCelebrationMessage,
  onStreakCelebrationComplete,
  reviewPromptVisible,
  onReviewPromptDismiss,
  onReviewRateInStore,
  onReviewSendFeedback,
}: HomeModalsProps) {
  return (
    <>
      <StreakCelebrationOverlay
        visible={streakCelebrationVisible}
        celebrationKey={streakCelebrationKey}
        streakCount={streakCelebrationCount}
        streakLabel={streakCelebrationLabel}
        message={streakCelebrationMessage}
        onComplete={onStreakCelebrationComplete}
      />
      <AppRatingPrompt
        visible={reviewPromptVisible}
        onDismiss={onReviewPromptDismiss}
        onRateInStore={onReviewRateInStore}
        onSendFeedback={onReviewSendFeedback}
      />
    </>
  );
}

export default HomeModals;
