import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@shared/ui';
import type { OnboardingFacade } from '../../application/contracts';
import { OnboardingActions } from '../components/OnboardingActions';
import { OnboardingCarousel } from '../components/OnboardingCarousel';
import { PaginationDots } from '../components/PaginationDots';
import { useOnboardingController } from '../hooks/useOnboardingController';

interface OnboardingScreenProps {
  facade: OnboardingFacade;
}

export default function OnboardingScreen({ facade }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const controller = useOnboardingController(facade);

  return (
    <Screen constrainWidth={false} contentStyle={styles.content} testID="onboarding-screen">
      <View style={styles.carousel}>
        <OnboardingCarousel
          layout={controller.layout}
          listRef={controller.flatListRef}
          onScroll={controller.handleScroll}
          steps={controller.steps}
        />
      </View>
      <View
        style={[
          styles.controls,
          {
            paddingHorizontal: controller.layout.horizontalGutter,
            paddingBottom: controller.layout.isSmallHeight ? 8 : 16,
          },
        ]}
      >
        <PaginationDots count={controller.steps.length} selectedIndex={controller.currentStep} />
        <OnboardingActions
          isLastStep={controller.isLastStep}
          nextLabel={t('onboarding.next')}
          onComplete={controller.onComplete}
          onNext={controller.handleNext}
          skipLabel={t('onboarding.skip')}
          startLabel={t('onboarding.start')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
  },
  carousel: {
    flex: 1,
  },
  controls: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 16,
  },
});
