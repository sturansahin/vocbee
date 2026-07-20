import { useMemo, useRef, useState } from 'react';
import { type FlatList, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import type { RootStackParamList } from '@app/navigation/types';
import { useReducedMotion, useResponsiveLayout } from '@shared/responsive';
import type { OnboardingFacade } from '../../application/contracts';
import type { OnboardingStep } from '../onboardingTypes';

const STEP_SPECS = [
  {
    id: 'daily-words',
    titleKey: 'onboarding.title1',
    subtitleKey: 'onboarding.subtitle1',
    image: require('../../../../../assets/image/onboard1.png'),
  },
  {
    id: 'progress',
    titleKey: 'onboarding.title4',
    subtitleKey: 'onboarding.subtitle4',
    titleFallback: 'Let words come to you',
    subtitleFallback:
      'Get timely reminders, keep your learning streak alive, and return when it matters.',
    image: require('../../../../../assets/image/onboard2.png'),
  },
  {
    id: 'cards',
    titleKey: 'onboarding.title2',
    subtitleKey: 'onboarding.subtitle2',
    image: require('../../../../../assets/image/onboard3.png'),
  },
  {
    id: 'reminders',
    titleKey: 'onboarding.title3',
    subtitleKey: 'onboarding.subtitle3',
    image: require('../../../../../assets/image/onboard4.png'),
  },
] as const;

export function useOnboardingController(facade: OnboardingFacade) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Onboarding'>>();
  const { t } = useTranslation();
  const layout = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const completionPending = useRef(false);
  const flatListRef = useRef<FlatList<OnboardingStep>>(null);

  const steps = useMemo<OnboardingStep[]>(
    () =>
      STEP_SPECS.map((step) => ({
        id: step.id,
        image: step.image,
        title: t(step.titleKey, {
          defaultValue: 'titleFallback' in step ? step.titleFallback : undefined,
        }),
        subtitle: t(step.subtitleKey, {
          defaultValue: 'subtitleFallback' in step ? step.subtitleFallback : undefined,
        }),
      })),
    [t],
  );

  const completeOnboarding = async () => {
    if (completionPending.current) {
      return;
    }
    completionPending.current = true;
    try {
      await facade.complete();
    } catch (error) {
      console.error('Error marking onboarding as seen:', error);
    } finally {
      navigation.navigate('Login');
    }
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) {
      return;
    }
    flatListRef.current?.scrollToIndex({ index, animated: !reducedMotion });
    setCurrentStep(index);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      void completeOnboarding();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / layout.width);
    if (index !== currentStep && index >= 0 && index < steps.length) {
      setCurrentStep(index);
    }
  };

  return {
    currentStep,
    flatListRef,
    handleNext,
    handleScroll,
    isLastStep: currentStep === steps.length - 1,
    layout,
    onComplete: completeOnboarding,
    steps,
  };
}
