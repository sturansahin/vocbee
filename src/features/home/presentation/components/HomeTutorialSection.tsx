// src/features/home/presentation/components/HomeTutorialSection.tsx
// Keeps the overlay above the Home content while all spotlight targets remain the real, measured
// controls inside HomeWordCardSection. No cloned icon/text/button is rendered here.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import HomeTutorialOverlay from './HomeTutorialOverlay';
import type { TutorialLayouts } from './homeTutorialLayout';

export interface HomeTutorialSectionProps {
  showTutorial: boolean;
  tutorialLayouts: TutorialLayouts | null;
  tutorialStep: number;
  onTutorialComplete: () => void;
  onTutorialNext: () => void;
}

export function HomeTutorialSection({
  showTutorial,
  tutorialLayouts,
  tutorialStep,
  onTutorialComplete,
  onTutorialNext,
}: HomeTutorialSectionProps) {
  if (!showTutorial || !tutorialLayouts) {
    return null;
  }

  return (
    <View style={styles.overlayLayer} pointerEvents="box-none">
      <HomeTutorialOverlay
        visible={showTutorial}
        onComplete={onTutorialComplete}
        currentStep={tutorialStep}
        onNext={onTutorialNext}
        layouts={tutorialLayouts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9000,
    elevation: 9000,
  },
});

export default HomeTutorialSection;
